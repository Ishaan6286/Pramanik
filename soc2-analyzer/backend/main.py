import os
import json
import urllib.request
import urllib.parse
import urllib.error
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
import agent_graph
import autofix

# AI services — auto-switches between Groq and Bedrock via AI_PROVIDER env var
import groq_service
from ai_provider import ai as ai_service
import db

app = FastAPI(title="ComplianceAI API")

# CORS — restricted in production via env var, open in dev
_cors_env = os.getenv("CORS_ORIGINS", "")
_cors_origins = _cors_env.split(",") if _cors_env else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    """Health check — shows AI provider, version, and status."""
    return {
        "status": "ok",
        "ai_provider": ai_service.name,
        "ai_model": ai_service.model,
        "version": "2.0.0",
        "features": ["langgraph", "auto-fix-pr", "adversary-agent", "ces-engine"],
    }


class GoogleAuthRequest(BaseModel):
    code: str


@app.post("/api/auth/google")
async def auth_google(req: GoogleAuthRequest):
    """Exchange a Google OAuth auth code for user profile info."""
    client_id = os.getenv("GOOGLE_CLIENT_ID", "").strip()
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "").strip()
    if not client_id or not client_secret:
        raise HTTPException(status_code=500, detail="Google OAuth is not configured on the server")

    token_body = urllib.parse.urlencode({
        "code": req.code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": "postmessage",
        "grant_type": "authorization_code",
    }).encode()

    try:
        token_req = urllib.request.Request(
            "https://oauth2.googleapis.com/token",
            data=token_body,
            method="POST",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        with urllib.request.urlopen(token_req, timeout=15) as resp:
            tokens = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        detail = e.read().decode() if e.fp else str(e)
        raise HTTPException(status_code=401, detail=f"Google token exchange failed: {detail}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Google token exchange failed: {e}")

    access_token = tokens.get("access_token")
    if not access_token:
        raise HTTPException(status_code=401, detail="Google did not return an access token")

    try:
        user_req = urllib.request.Request(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        with urllib.request.urlopen(user_req, timeout=15) as resp:
            profile = json.loads(resp.read().decode())
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Failed to fetch Google profile: {e}")

    email = profile.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="Google account did not provide an email")

    return {
        "email": email,
        "name": profile.get("name") or email.split("@")[0],
        "picture": profile.get("picture"),
        "sub": profile.get("sub"),
    }


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
            explanations = ai_service.generate_explanations(failed, company_name)
            print(f"AI explanations: used {ai_service.name}")
        except Exception as e:
            print(f"AI explanations failed: {e}")

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
                explanations = ai_service.generate_explanations(failed, company_name)
                print(f"AI explanations: used {ai_service.name}")
            except Exception as e:
                print(f"AI failed: {e}")

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
        result = ai_service.generate_policies(req.company_name)
        return result
    except Exception as e:
        print(f"AI policies failed: {e}")
        raise HTTPException(status_code=500, detail=f"Policy generation failed: {str(e)}")


class AuditPrepRequest(BaseModel):
    company_name: str
    failed_controls: list


@app.post("/api/audit-prep")
async def audit_prep(req: AuditPrepRequest):
    try:
        result = ai_service.generate_audit_questions(req.failed_controls, req.company_name)
        return result
    except Exception as e:
        print(f"AI audit-prep failed: {e}")
        raise HTTPException(status_code=500, detail=f"Audit prep failed: {str(e)}")


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
        if not (message or "").strip() and not files:
            raise HTTPException(status_code=400, detail="Message is required")

        result = deepseek_service.chat_with_rag(message)
        # Older soft-error shape from deepseek_service — still fall back if present
        if isinstance(result, dict) and result.get("error") and "temporarily unavailable" in (result.get("response") or ""):
            raise Exception(result.get("error") or "Deepseek unavailable")
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"Deepseek chat failed: {e}")
        # Fallback to AI provider for chat
        try:
            response_text = ai_service.call_llm(
                prompt=message or "Hello",
                system="You are a SOC 2 compliance expert. Answer questions about compliance frameworks, security controls, and audit preparation.",
                temperature=0.3,
                max_tokens=1000,
            )
            return {
                "response": response_text,
                "sources": [f"{ai_service.name} {ai_service.model} (fallback)"],
                "model": f"{ai_service.name}-fallback",
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
    """Multi-agent GitHub repository compliance scanner — powered by LangGraph."""
    try:
        print(f"[LangGraph] Starting multi-agent scan: {req.repo_url}")

        # Run the full LangGraph agent pipeline
        final_state = agent_graph.run_compliance_scan(
            repo_url=req.repo_url,
            token=req.token or None,
            company_name=req.company_name,
            selected_frameworks=req.selected_frameworks,
            max_files=150,
        )

        # Extract results from final graph state
        scan_result = final_state.get("scan_result", {})
        challenged = final_state.get("challenged", []) or final_state.get("findings", [])
        full_metrics = final_state.get("full_metrics", {})
        control_results = final_state.get("control_results", [])

        severity_counts = full_metrics.get("severity_counts", {})
        triage_counts = full_metrics.get("triage_counts", {})

        total_reported = max(len(control_results), 1)

        response_data = {
            "company_name": final_state.get("company_name", ""),
            "repo": scan_result.get("repo", ""),
            "score": final_state.get("score", 0),
            "passed": 0,
            "total": total_reported,
            "results": control_results,
            "priority_fixes": final_state.get("priority_fixes", []),
            "framework_scores": final_state.get("framework_scores", {}),
            "benchmark": None,

            # GitHub-specific extras
            "scan_source": "github",
            "files_scanned": scan_result.get("files_scanned", 0),
            "total_files": scan_result.get("total_files", 0),
            "raw_findings": challenged,
            "severity_counts": severity_counts,
            "triage_counts": triage_counts,
            "policy_status": final_state.get("policy_status", {}),
            "trail_info": final_state.get("trail_info", {}),
            "selected_frameworks": req.selected_frameworks,

            # Full metrics package
            "soc2_metrics": full_metrics.get("soc2_metrics", {}),
            "framework_metrics": full_metrics.get("framework_metrics", {}),
            "audit_questions_by_control": full_metrics.get("audit_questions_by_control", {}),
            "total_audit_questions": full_metrics.get("total_audit_questions", 0),

            # LangGraph agent trace — shows each node's decisions
            "agent_trace": final_state.get("agent_trace", []),
        }

        # Log the agent trace
        for trace in final_state.get("agent_trace", []):
            print(f"  [{trace['node']}] {trace['decision']} ({trace['duration_ms']}ms)")

        return response_data

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GitHub scan failed: {str(e)}")


# ══════════════════════════════════════════════════
# AUTO-FIX PR GENERATOR
# ══════════════════════════════════════════════════

class AutoFixRequest(BaseModel):
    repo_url: str
    token: str
    file_path: str
    finding: dict


@app.post("/api/auto-fix")
async def auto_fix_endpoint(req: AutoFixRequest):
    """Generate an AI code fix and open a PR on GitHub."""
    try:
        if not req.token:
            raise HTTPException(
                status_code=400,
                detail="GitHub token with `repo` scope is required for auto-fix.",
            )

        result = autofix.auto_fix(
            repo_url=req.repo_url,
            token=req.token,
            file_path=req.file_path,
            finding=req.finding,
        )
        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auto-fix failed: {str(e)}")


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
# WEBHOOK — Scans repo on push events
# ══════════════════════════════════════════════════

from fastapi import Request


@app.post("/api/webhook/github")
async def github_webhook(request: Request):
    """Webhook endpoint — scans repo on push events."""
    body = await request.json()

    # ── Parse payload (handle both formats) ──
    repo_url = ""
    ref = ""
    commit_sha = ""
    token = os.getenv("GITHUB_DEFAULT_TOKEN", "")
    event_type = request.headers.get("X-GitHub-Event", "push")

    if "repository" in body:
        # GitHub webhook payload
        repo_data = body["repository"]
        repo_url = repo_data.get("html_url") or repo_data.get("clone_url", "")
        ref = body.get("ref", "")
        commit_sha = body.get("after", body.get("head_commit", {}).get("id", ""))

        # For pull_request events
        if event_type == "pull_request":
            pr = body.get("pull_request", {})
            ref = f"refs/heads/{pr.get('head', {}).get('ref', 'main')}"
            repo_url = pr.get("head", {}).get("repo", {}).get("html_url", repo_url)

        print(f"[Webhook] Push event: {event_type} on {repo_url} ref={ref}")
    else:
        # Legacy format (from GitHub Actions or manual calls)
        repo_url = body.get("repo_url", "")
        ref = body.get("ref", "refs/heads/main")
        commit_sha = body.get("commit_sha", "")
        token = body.get("token", "") or token
        print(f"[Webhook] Legacy format: {repo_url} ref={ref}")

    if not repo_url:
        return {"skipped": True, "reason": "No repository URL found in payload"}

    # Only scan pushes to main/master
    if ref and "refs/heads/main" not in ref and "refs/heads/master" not in ref:
        return {"skipped": True, "reason": f"Not a main/master push: {ref}"}

    try:
        # Run LangGraph multi-agent scan
        final_state = agent_graph.run_compliance_scan(
            repo_url=repo_url,
            token=token or None,
            max_files=100,
        )

        scan_result = final_state.get("scan_result", {})
        findings = final_state.get("findings", [])
        challenged = final_state.get("challenged", []) or findings
        full_metrics = final_state.get("full_metrics", {})

        severity_counts = full_metrics.get("severity_counts", {})
        triage_counts = full_metrics.get("triage_counts", {})
        critical_count = severity_counts.get("CRITICAL", 0)
        immediate_count = triage_counts.get("IMMEDIATE_ACTION", 0)

        # Save to Supabase
        try:
            db.save_github_scan(
                repo=scan_result.get("repo", ""),
                findings_count=len(findings),
                severity_counts=severity_counts,
                score=max(0, 100 - int((len(findings) / 33) * 100)),
                raw_findings=challenged,
                triage_counts=triage_counts,
            )
        except Exception as e:
            print(f"Failed to save GitHub scan to DB: {e}")

        # ── Auto-fix: create PRs for CRITICAL findings ──
        auto_fix_prs = []
        if token and critical_count > 0:
            critical_findings = [
                f for f in challenged
                if f.get("severity") == "CRITICAL"
                and f.get("file")
                and f.get("pattern_id") != "POLICY-MISSING"
            ][:3]  # Max 3 auto-fix PRs per push to avoid spam

            for finding in critical_findings:
                try:
                    pr_result = autofix.auto_fix(
                        repo_url=repo_url,
                        token=token,
                        file_path=finding["file"],
                        finding=finding,
                    )
                    auto_fix_prs.append(pr_result)
                    print(f"[Webhook] Auto-fix PR created: {pr_result.get('pr_url', '')}")
                except Exception as e:
                    print(f"[Webhook] Auto-fix failed for {finding.get('file')}: {e}")

        # Build summary
        files_scanned = scan_result.get("files_scanned", 0)
        summary_lines = [
            f"ComplianceAI scan: {len(findings)} violations in {files_scanned} files",
            f"Severity: {severity_counts}",
            f"Triage: {immediate_count} IMMEDIATE_ACTION | {triage_counts.get('HIGH_PRIORITY', 0)} HIGH_PRIORITY",
        ]
        if critical_count > 0:
            summary_lines.append(f"{critical_count} CRITICAL violations — build blocked")
        else:
            summary_lines.append("No CRITICAL violations — build allowed")

        return {
            "repo": scan_result.get("repo", ""),
            "commit_sha": commit_sha,
            "event_type": event_type,
            "files_scanned": files_scanned,
            "total_findings": len(findings),
            "severity_counts": severity_counts,
            "triage_counts": triage_counts,
            "soc2_metrics": full_metrics.get("soc2_metrics", {}),
            "framework_metrics": full_metrics.get("framework_metrics", {}),
            "critical_count": critical_count,
            "build_passed": critical_count == 0,
            "summary": "\n".join(summary_lines),
            "agent_trace": final_state.get("agent_trace", []),
            "auto_fix_prs": auto_fix_prs,
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
