import json
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from soc2_controls import run_all_checks, get_benchmark
from framework_mappings import calculate_crvs, get_framework_summary
from drift_detector import detect_drift

# AI services — Bedrock primary, Groq fallback
import bedrock_service
import groq_service
import db

app = FastAPI(title="SOC2 Analyzer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/analyze")
async def analyze(config: UploadFile = File(...)):
    try:
        content = await config.read()
        aws_config = json.loads(content)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON file")

    company_name = aws_config.get("company_name", "Your Company")
    result = run_all_checks(aws_config)

    failed = [r for r in result["results"] if not r["passed"]]

    explanations = []
    if failed:
        try:
            explanations = bedrock_service.generate_explanations(failed, company_name)
            print("AI explanations: used Bedrock")
        except Exception as e:
            print(f"Bedrock explanations failed: {e}, falling back to Groq")
            try:
                explanations = groq_service.generate_explanations(failed, company_name)
                print("AI explanations: used Groq fallback")
            except Exception as e2:
                print(f"Groq fallback also failed: {e2}")

    enriched = []
    for control in result["results"]:
        exp = next((e for e in explanations if e.get("control_id") == control["id"]), None)
        enriched.append({
            **control,
            "risk_explanation": exp["risk_explanation"] if exp else None,
            "fix_steps": exp.get("fix_steps", []) if exp else [],
            "business_impact": exp["business_impact"] if exp else None,
        })

    industry = aws_config.get("industry", "saas_startup")
    benchmark = get_benchmark(result["score"], industry)

    # CES Algorithm — rank failed controls by risk
    failed_enriched = [r for r in enriched if not r["passed"]]
    priority_fixes = calculate_crvs(failed_enriched)

    # Framework scores (SOC2 + ISO 27001 + HIPAA)
    framework_scores = get_framework_summary(result["results"])

    response_data = {
        "company_name": company_name,
        "score": result["score"],
        "passed": result["passed"],
        "total": result["total"],
        "results": enriched,
        "benchmark": benchmark,
        "priority_fixes": priority_fixes,
        "framework_scores": framework_scores,
    }

    # Save to Supabase (non-blocking — don't fail the request if DB is down)
    try:
        db.save_scan(
            user_id=None,
            company_name=company_name,
            industry=industry,
            score=result["score"],
            passed=result["passed"],
            total=result["total"],
            results=enriched,
            priority_fixes=priority_fixes,
            framework_scores=framework_scores,
            benchmark=benchmark,
            config=aws_config,
        )
        # Save baseline for drift detection
        db.save_baseline(user_id=None, company_name=company_name, config=aws_config)
        print(f"Scan saved to Supabase for {company_name}")
    except Exception as e:
        print(f"Supabase save failed (non-critical): {e}")

    return response_data


class PolicyRequest(BaseModel):
    company_name: str
    aws_config: dict = {}


@app.post("/api/policies")
async def policies(req: PolicyRequest):
    try:
        result = bedrock_service.generate_policies(req.company_name)
        return result
    except Exception as e:
        print(f"Bedrock policies failed: {e}, falling back to Groq")
        try:
            result = groq_service.generate_policies(req.company_name)
            return result
        except Exception as e2:
            print(f"Groq policies also failed: {e2}")
            raise HTTPException(status_code=500, detail=f"Policy generation failed: {str(e2)}")


class AuditPrepRequest(BaseModel):
    company_name: str
    failed_controls: list


@app.post("/api/audit-prep")
async def audit_prep(req: AuditPrepRequest):
    try:
        result = bedrock_service.generate_audit_questions(req.failed_controls, req.company_name)
        return result
    except Exception as e:
        print(f"Bedrock audit-prep failed: {e}, falling back to Groq")
        try:
            result = groq_service.generate_audit_questions(req.failed_controls, req.company_name)
            return result
        except Exception as e2:
            raise HTTPException(status_code=500, detail=f"Audit prep failed: {str(e2)}")


# ── DRIFT DETECTION ────────────────────────────────

from datetime import datetime as dt_datetime


def _drift_response(success: bool, data: dict = None, error: str = None) -> dict:
    """Standardized drift detection response format."""
    return {
        "status": "success" if success else "error",
        "timestamp": dt_datetime.utcnow().isoformat(),
        "data": data or {},
        "error": error,
    }


class DriftRequest(BaseModel):
    company_name: str
    config: dict


@app.post("/api/drift")
async def drift(req: DriftRequest):
    try:
        baseline = db.get_baseline(user_id=None, company_name=req.company_name)
        if not baseline:
            return _drift_response(False, error="No baseline found. Run an analysis first to establish a baseline.")
        
        drift_result = detect_drift(req.config, baseline["config"])
        
        # Save drift analysis to history (non-blocking)
        try:
            db.save_drift_analysis(
                user_id=None,
                company_name=req.company_name,
                drift_result=drift_result,
                baseline_id=baseline.get("id")
            )
            # Create alerts for critical regressions
            critical_changes = [c for c in drift_result.get("changes", []) if c.get("severity") == "CRITICAL"]
            for change in critical_changes:
                db.create_drift_alert(
                    user_id=None,
                    company_name=req.company_name,
                    change=change
                )
        except Exception as e:
            print(f"Drift history save failed (non-critical): {e}")
        
        return _drift_response(True, data=drift_result)
    except Exception as e:
        print(f"Drift detection error: {e}")
        return _drift_response(False, error=f"Drift detection failed: {str(e)}")


# ── SCAN HISTORY ───────────────────────────────────

@app.get("/api/scans")
async def list_scans():
    try:
        scans = db.get_scans(user_id=None)
        # Return summary only (not full results) for list view
        return [
            {
                "id": s["id"],
                "company_name": s["company_name"],
                "score": s["score"],
                "passed": s["passed"],
                "total": s["total"],
                "created_at": s["created_at"],
            }
            for s in scans
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch scans: {str(e)}")


@app.get("/api/scans/{scan_id}")
async def get_scan(scan_id: str):
    try:
        scan = db.get_scan(scan_id)
        return scan
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch scan: {str(e)}")
