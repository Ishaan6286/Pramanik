"""
Supabase Database Service
Handles all database operations — saving scans, loading history, baselines for drift,
and the dynamic audit questions table (editable from Supabase dashboard).
"""

import os
from supabase import create_client

_client = None


def _get_client():
    global _client
    if _client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY")
        if not url or not key:
            raise Exception("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")
        _client = create_client(url, key)
    return _client


# ── SCANS ──────────────────────────────────────────

def save_scan(user_id, company_name: str, industry: str, score: int,
              passed: int, total: int, results: list, priority_fixes: list,
              framework_scores: dict, benchmark: dict, config: dict) -> dict:
    """Save a completed scan to the database."""
    data = {
        "company_name": company_name,
        "industry": industry,
        "score": score,
        "passed": passed,
        "total": total,
        "results": results,
        "priority_fixes": priority_fixes,
        "framework_scores": framework_scores,
        "benchmark": benchmark,
        "config": config,
    }
    if user_id:
        data["user_id"] = user_id
    result = _get_client().table("scans").insert(data).execute()
    return result.data[0] if result.data else data


def get_scans(user_id) -> list:
    """Get all scans, newest first."""
    query = _get_client().table("scans").select("*").order("created_at", desc=True)
    if user_id:
        query = query.eq("user_id", user_id)
    result = query.execute()
    return result.data


def get_scan(scan_id: str) -> dict:
    """Get a single scan by ID."""
    result = (_get_client().table("scans")
              .select("*")
              .eq("id", scan_id)
              .single()
              .execute())
    return result.data


# ── BASELINES (for drift detection) ────────────────

def save_baseline(user_id, company_name: str, config: dict) -> dict:
    """Save current config as the baseline for drift comparison."""
    # Delete old baseline for this company
    delete_query = _get_client().table("baselines").delete().eq("company_name", company_name)
    if user_id:
        delete_query = delete_query.eq("user_id", user_id)
    delete_query.execute()

    data = {
        "company_name": company_name,
        "config": config,
    }
    if user_id:
        data["user_id"] = user_id
    result = _get_client().table("baselines").insert(data).execute()
    return result.data[0] if result.data else data


def get_baseline(user_id, company_name: str):
    """Get the stored baseline config for drift comparison."""
    query = (_get_client().table("baselines")
             .select("*")
             .eq("company_name", company_name)
             .order("created_at", desc=True)
             .limit(1))
    if user_id:
        query = query.eq("user_id", user_id)
    result = query.execute()
    return result.data[0] if result.data else None


# ── AUDIT QUESTIONS (dynamic, editable from Supabase dashboard) ────────────

def get_audit_questions_for_control(control_id: str) -> list[str]:
    """
    Fetch audit questions for a control from Supabase.
    Returns list of question strings, ordered by severity (CRITICAL first).
    Returns [] if table doesn't exist or DB is unreachable.
    """
    try:
        result = (_get_client()
                  .table("audit_questions")
                  .select("question")
                  .eq("control_id", control_id)
                  .order("created_at")
                  .execute())
        return [row["question"] for row in (result.data or [])]
    except Exception:
        return []


def get_all_audit_questions() -> dict[str, list[str]]:
    """
    Fetch ALL audit questions from Supabase, grouped by control_id.
    Used for bulk loading at startup.
    """
    try:
        result = (_get_client()
                  .table("audit_questions")
                  .select("control_id, question")
                  .order("control_id")
                  .execute())
        grouped: dict = {}
        for row in (result.data or []):
            ctrl = row["control_id"]
            if ctrl not in grouped:
                grouped[ctrl] = []
            grouped[ctrl].append(row["question"])
        return grouped
    except Exception:
        return {}


def add_audit_question(control_id: str, question: str, framework: str = "soc2", source: str = "custom") -> bool:
    """
    Add a new audit question to Supabase.
    Call this from the admin panel or seed script.
    """
    try:
        _get_client().table("audit_questions").insert({
            "control_id": control_id,
            "question": question,
            "framework": framework,
            "source": source,
        }).execute()
        return True
    except Exception as e:
        print(f"Failed to add audit question: {e}")
        return False


def seed_audit_questions(questions_dict: dict, overwrite: bool = False) -> int:
    """
    Seed the audit_questions table from the static dict in audit_memory.py.
    Call once on first run: POST /api/admin/seed-audit-questions
    Returns number of questions inserted.
    """
    client = _get_client()

    if overwrite:
        client.table("audit_questions").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()

    rows = []
    for control_id, questions in questions_dict.items():
        for q in questions:
            rows.append({
                "control_id": control_id,
                "question": q,
                "framework": "soc2" if control_id.startswith(("CC", "A", "C", "PI", "P")) else "dpdp",
                "source": "aicpa_builtin",
            })

    if not rows:
        return 0

    # Insert in batches of 100
    for i in range(0, len(rows), 100):
        client.table("audit_questions").insert(rows[i:i+100]).execute()

    return len(rows)


# ── GITHUB SCAN RESULTS ─────────────────────────────

def save_github_scan(repo: str, findings_count: int, severity_counts: dict,
                     score: int, raw_findings: list, triage_counts: dict) -> dict:
    """Save a GitHub repo scan result."""
    try:
        data = {
            "repo": repo,
            "findings_count": findings_count,
            "severity_counts": severity_counts,
            "score": score,
            "raw_findings": raw_findings[:50],  # Limit to 50 to avoid payload size issues
            "triage_counts": triage_counts,
        }
        result = _get_client().table("github_scans").insert(data).execute()
        return result.data[0] if result.data else data
    except Exception as e:
        print(f"Failed to save GitHub scan: {e}")
        return {}
