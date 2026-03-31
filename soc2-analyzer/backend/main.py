import json
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from soc2_controls import run_all_checks, get_benchmark
from framework_mappings import calculate_crvs, get_framework_summary

# AI services — Bedrock primary, Groq fallback
import bedrock_service
import groq_service

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

    return {
        "company_name": company_name,
        "score": result["score"],
        "passed": result["passed"],
        "total": result["total"],
        "results": enriched,
        "benchmark": benchmark,
        "priority_fixes": priority_fixes,
        "framework_scores": framework_scores,
    }


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
