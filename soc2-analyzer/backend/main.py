import json
from typing import Optional, List
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException, Header, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from soc2_controls import run_all_checks, get_benchmark
from framework_mappings import calculate_crvs, get_framework_summary, FRAMEWORK_MAP
from drift_detector import detect_drift
from security_hub import scan_aws_account
from pramanik_ai import (
    run_gap_analysis, run_policy_generator, run_ghost_audit,
    run_trustdna, run_compliance_obituary, run_pathfinder,
)
import deepseek_service
import github_agent
import adversary_agent
import audit_memory

# AI services — Bedrock primary, Groq fallback
import bedrock_service
import groq_service
import db

app = FastAPI(title="ComplianceAI API")

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


# ── LIVE AWS SCAN (Security Hub + boto3) ──────────

class AWSScanRequest(BaseModel):
    access_key: str
    secret_key: str
    region: str = "ap-south-1"
    company_name: str = ""
    industry: str = "saas_startup"


@app.post("/api/scan-aws")
async def scan_aws(req: AWSScanRequest):
    """Connect to real AWS account, pull live config via Security Hub + boto3."""
    try:
        # Scan the AWS account
        aws_config = scan_aws_account(req.access_key, req.secret_key, req.region)

        # Override company name and industry if provided
        if req.company_name:
            aws_config["company_name"] = req.company_name
        if req.industry:
            aws_config["industry"] = req.industry

        company_name = aws_config.get("company_name", "Your Company")

        # Run our 33 checks against the live config
        result = run_all_checks(aws_config)

        failed = [r for r in result["results"] if not r["passed"]]

        # AI explanations
        explanations = []
        if failed:
            try:
                explanations = bedrock_service.generate_explanations(failed, company_name)
                print("AI explanations: used Bedrock")
            except Exception as e:
                print(f"Bedrock failed: {e}, falling back to Groq")
                try:
                    explanations = groq_service.generate_explanations(failed, company_name)
                except Exception as e2:
                    print(f"Groq also failed: {e2}")

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
        failed_enriched = [r for r in enriched if not r["passed"]]
        priority_fixes = calculate_crvs(failed_enriched)
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
            "scan_source": "live_aws",
            "security_hub_findings": aws_config.get("security_hub_finding_count", 0),
        }

        # Save to Supabase
        try:
            db.save_scan(
                user_id=None, company_name=company_name, industry=industry,
                score=result["score"], passed=result["passed"], total=result["total"],
                results=enriched, priority_fixes=priority_fixes,
                framework_scores=framework_scores, benchmark=benchmark, config=aws_config,
            )
            db.save_baseline(user_id=None, company_name=company_name, config=aws_config)
        except Exception as e:
            print(f"Supabase save failed: {e}")

        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AWS scan failed: {str(e)}")


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

class DriftRequest(BaseModel):
    company_name: str
    config: dict


@app.post("/api/drift")
async def drift(req: DriftRequest):
    try:
        baseline = db.get_baseline(user_id=None, company_name=req.company_name)
        if not baseline:
            return {"error": "No baseline found. Run an analysis first to establish a baseline."}
        drift_result = detect_drift(req.config, baseline["config"])
        return drift_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Drift detection failed: {str(e)}")


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


# ══════════════════════════════════════════════════
# PRAMANIK AI — 6 Mode Compliance Co-Pilot
# ══════════════════════════════════════════════════

class GapAnalysisRequest(BaseModel):
    config: dict


@app.post("/api/pramanik/gap-analysis")
async def pramanik_gap_analysis(req: GapAnalysisRequest):
    try:
        result = run_gap_analysis(req.config)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class PolicyGenRequest(BaseModel):
    policy_type: str
    company_name: str
    tech_stack: str = ""
    policy_owner: str = "Security Officer"


@app.post("/api/pramanik/policy")
async def pramanik_policy(req: PolicyGenRequest):
    try:
        result = run_policy_generator(req.policy_type, req.company_name, req.tech_stack, req.policy_owner)
        return {"policy": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class GhostAuditRequest(BaseModel):
    report: dict = {}


@app.post("/api/pramanik/ghost-audit")
async def pramanik_ghost_audit(req: GhostAuditRequest):
    try:
        result = run_ghost_audit(req.report if req.report else None)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class VendorRequest(BaseModel):
    vendors: List[str]


@app.post("/api/pramanik/vendor-inheritance")
async def pramanik_vendor(req: VendorRequest):
    try:
        result = run_trustdna(req.vendors)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class BreachRequest(BaseModel):
    breach_name: str
    user_config: dict = {}


@app.post("/api/pramanik/breach-analysis")
async def pramanik_breach(req: BreachRequest):
    try:
        result = run_compliance_obituary(req.breach_name, req.user_config if req.user_config else None)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class PathfinderRequest(BaseModel):
    customer_type: str = "B2B SaaS"
    tech_stack: str = "AWS"
    team_size: int = 10
    timeline: str = "6 months"


@app.post("/api/pramanik/certification-path")
async def pramanik_pathfinder(req: PathfinderRequest):
    try:
        profile = {
            "customer_type": req.customer_type,
            "tech_stack": req.tech_stack,
            "team_size": req.team_size,
            "timeline": req.timeline,
        }
        result = run_pathfinder(profile)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── PRAMANIK CHAT (RAG-powered) ───────────────────

@app.post("/api/pramanik/chat")
async def pramanik_chat(
    message: str = Form(""),
    files: List[UploadFile] = File(default=[]),
):
    try:
        result = deepseek_service.chat_with_rag(message)
        return result
    except Exception as e:
        print(f"Deepseek chat failed: {e}")
        # Fallback to Groq for chat
        try:
            response = groq_service._get_client().chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are a SOC 2 compliance expert. Answer questions about compliance frameworks, security controls, and audit preparation."},
                    {"role": "user", "content": message},
                ],
                temperature=0.3,
                max_tokens=1000,
            )
            return {
                "response": response.choices[0].message.content,
                "sources": ["Groq LLaMA 3.3 70B (fallback)"],
                "model": "groq-fallback",
            }
        except Exception as e2:
            raise HTTPException(status_code=500, detail=f"Chat failed: {str(e2)}")


# ══════════════════════════════════════════════════
# GITHUB MULTI-AGENT SCANNER
# ══════════════════════════════════════════════════

class GitHubScanRequest(BaseModel):
    repo_url: str
    token: str = ""
    company_name: str = ""
    selected_frameworks: List[str] = ["soc2", "iso27001", "dpdp"]


def _github_findings_to_controls(findings: list, selected_frameworks: list) -> list:
    """
    Convert raw code findings into control-based results (same format as /api/analyze).
    Groups findings by control ID so the Dashboard components work unchanged.
    """
    # Collect all unique control IDs that were checked
    control_findings: dict = {}
    for f in findings:
        # Skip policy-missing findings for now (they don't have line numbers)
        if f.get("pattern_id") == "POLICY-MISSING":
            continue
        for ctrl_id in f.get("controls", []):
            if ctrl_id not in control_findings:
                control_findings[ctrl_id] = []
            control_findings[ctrl_id].append(f)

    # Build result list
    results = []
    for ctrl_id, ctrl_findings in control_findings.items():
        fw_map = FRAMEWORK_MAP.get(ctrl_id, {})
        soc2_info = fw_map.get("soc2") or {}

        # Worst severity among findings for this control
        sev_order = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}
        worst_sev = max(ctrl_findings, key=lambda x: sev_order.get(x.get("severity", "MEDIUM"), 2))

        issues = list({f["message"] for f in ctrl_findings})
        file_refs = [f"{f['file']}:{f['line']}" for f in ctrl_findings[:3]]

        results.append({
            "id": ctrl_id,
            "title": soc2_info.get("title", ctrl_id),
            "passed": False,
            "severity": worst_sev.get("severity", "MEDIUM"),
            "issues": issues,
            "findings_detail": ctrl_findings,
            "file_refs": file_refs,
            "risk_explanation": ctrl_findings[0].get("auditor_challenge"),
            "fix_steps": [f.get("fix", "") for f in ctrl_findings[:3]],
            "business_impact": f"{len(ctrl_findings)} violation(s) found in code",
            "audit_verdict": ctrl_findings[0].get("audit_verdict", "CONFIRMED"),
        })

    # Filter to selected frameworks
    if selected_frameworks:
        fw_set = set(selected_frameworks)
        results = [
            r for r in results
            if any(
                FRAMEWORK_MAP.get(r["id"], {}).get(fw) is not None
                for fw in fw_set
            )
        ]

    return results


@app.post("/api/scan-github")
async def scan_github(req: GitHubScanRequest):
    """Multi-agent GitHub repository compliance scanner."""
    try:
        # ── Agent 1 + 2: Code Agent + Policy Agent ──
        print(f"GitHub scan starting: {req.repo_url}")
        scan_result = github_agent.scan_repository(
            repo_url=req.repo_url,
            token=req.token or None,
            max_files=150,
        )

        findings = scan_result["findings"]
        company_name = req.company_name or scan_result["repo"]

        # ── Agent 3: Adversary Agent (Stage 1: rule-based triage, Stage 2: AI) ──
        print(f"Adversary agent: rule-based triage on {len(findings)} findings...")
        challenged = adversary_agent.challenge_findings(findings, company_name)

        # ── Full metrics (no AI, pure logic) ──
        full_metrics = adversary_agent.get_full_metrics(challenged)

        # ── Agent 4: CES Engine ──
        control_results = _github_findings_to_controls(challenged, req.selected_frameworks)
        priority_fixes = calculate_crvs(control_results)

        # Framework scores (based on which controls failed)
        framework_scores = get_framework_summary(control_results)

        # Score: percentage of checked controls that passed
        total_controls_checked = len(control_results)
        total_reported = max(total_controls_checked, 1)
        score = max(0, 100 - int((total_controls_checked / 33) * 100))

        # Severity counts from adversary agent (includes triage)
        severity_counts = full_metrics["severity_counts"]
        triage_counts = full_metrics["triage_counts"]

        response_data = {
            "company_name": company_name,
            "repo": scan_result["repo"],
            "score": score,
            "passed": 0,
            "total": total_reported,
            "results": control_results,
            "priority_fixes": priority_fixes,
            "framework_scores": framework_scores,
            "benchmark": None,

            # GitHub-specific extras
            "scan_source": "github",
            "files_scanned": scan_result["files_scanned"],
            "total_files": scan_result["total_files"],
            "raw_findings": challenged,
            "severity_counts": severity_counts,
            "triage_counts": triage_counts,
            "policy_status": scan_result["policy_status"],
            "trail_info": scan_result["trail_info"],
            "selected_frameworks": req.selected_frameworks,

            # Full metrics package (no AI — always available)
            "soc2_metrics": full_metrics["soc2_metrics"],
            "framework_metrics": full_metrics["framework_metrics"],
            "audit_questions_by_control": full_metrics["audit_questions_by_control"],
            "total_audit_questions": full_metrics["total_audit_questions"],
        }

        return response_data

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GitHub scan failed: {str(e)}")


# ══════════════════════════════════════════════════
# ADMIN — Seed + manage audit questions in Supabase
# ══════════════════════════════════════════════════

@app.post("/api/admin/seed-audit-questions")
async def seed_audit_questions(overwrite: bool = False):
    """
    Seed the Supabase audit_questions table from the static dict.
    Run once after creating the table. Safe to re-run (won't duplicate if overwrite=False).
    """
    try:
        from audit_memory import AUDIT_QUESTIONS
        count = db.seed_audit_questions(AUDIT_QUESTIONS, overwrite=overwrite)
        audit_memory.invalidate_cache()
        return {"seeded": count, "message": f"Successfully seeded {count} questions into Supabase"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Seed failed: {str(e)}")


class AuditQuestionRequest(BaseModel):
    control_id: str
    question: str
    framework: str = "soc2"
    source: str = "custom"


@app.post("/api/admin/audit-questions")
async def add_audit_question(req: AuditQuestionRequest):
    """Add a new audit question to Supabase. Immediately available without restart."""
    try:
        db.add_audit_question(req.control_id, req.question, req.framework, req.source)
        audit_memory.invalidate_cache()
        return {"success": True, "control_id": req.control_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/admin/audit-questions/{control_id}")
async def get_audit_questions_for_control(control_id: str):
    """Get all questions for a control (from Supabase or static fallback)."""
    return {
        "control_id": control_id,
        "questions": audit_memory.get_audit_questions(control_id),
    }


# ══════════════════════════════════════════════════
# GITHUB WEBHOOK — Runs on every push to main
# Called by GitHub Actions CI/CD pipeline
# ══════════════════════════════════════════════════

class GitHubWebhookPayload(BaseModel):
    repo_url: str
    ref: str = "refs/heads/main"
    commit_sha: str = ""
    token: str = ""


@app.post("/api/webhook/github")
async def github_webhook(payload: GitHubWebhookPayload):
    """
    Called by GitHub Actions on every push to main.
    Scans the repo and returns pass/fail + findings.
    Exit code 1 (via failed field) will fail the CI build.
    """
    if "refs/heads/main" not in payload.ref and "refs/heads/master" not in payload.ref:
        return {"skipped": True, "reason": f"Not a main/master push: {payload.ref}"}

    try:
        scan_result = github_agent.scan_repository(
            repo_url=payload.repo_url,
            token=payload.token or None,
            max_files=100,
        )

        findings = scan_result["findings"]
        challenged = adversary_agent.challenge_findings(findings[:20], payload.repo_url)
        full_metrics = adversary_agent.get_full_metrics(challenged)

        critical_count = full_metrics["severity_counts"].get("CRITICAL", 0)
        immediate_count = full_metrics["triage_counts"].get("IMMEDIATE_ACTION", 0)

        # Save to Supabase
        try:
            db.save_github_scan(
                repo=scan_result["repo"],
                findings_count=len(findings),
                severity_counts=full_metrics["severity_counts"],
                score=max(0, 100 - int((len(findings) / 33) * 100)),
                raw_findings=challenged,
                triage_counts=full_metrics["triage_counts"],
            )
        except Exception as e:
            print(f"Failed to save GitHub scan to DB: {e}")

        # Build summary for GitHub Actions output
        summary_lines = [
            f"ComplianceAI scan: {len(findings)} violations in {scan_result['files_scanned']} files",
            f"Severity: {full_metrics['severity_counts']}",
            f"Triage: {immediate_count} IMMEDIATE_ACTION | {full_metrics['triage_counts'].get('HIGH_PRIORITY', 0)} HIGH_PRIORITY",
        ]
        if critical_count > 0:
            summary_lines.append(f"❌ {critical_count} CRITICAL violations — build blocked")
        else:
            summary_lines.append("✅ No CRITICAL violations — build allowed")

        return {
            "repo": scan_result["repo"],
            "commit_sha": payload.commit_sha,
            "files_scanned": scan_result["files_scanned"],
            "total_findings": len(findings),
            "severity_counts": full_metrics["severity_counts"],
            "triage_counts": full_metrics["triage_counts"],
            "soc2_metrics": full_metrics["soc2_metrics"],
            "framework_metrics": full_metrics["framework_metrics"],
            "critical_count": critical_count,
            "build_passed": critical_count == 0,
            "summary": "\n".join(summary_lines),
            "top_findings": [
                {
                    "file": f.get("file"),
                    "line": f.get("line"),
                    "name": f.get("name"),
                    "severity": f.get("severity"),
                    "triage_flag": f.get("triage_flag"),
                    "message": f.get("message"),
                }
                for f in challenged[:10]
            ],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Webhook scan failed: {str(e)}")
