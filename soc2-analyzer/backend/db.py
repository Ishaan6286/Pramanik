"""
Supabase Database Service
Handles all database operations — saving scans, loading history, baselines for drift.
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


# ── DRIFT HISTORY (for trending & alerting) ────────

def save_drift_analysis(user_id, company_name: str, drift_result: dict, baseline_id: str = None) -> dict:
    """Save drift analysis result for history and trending."""
    data = {
        "company_name": company_name,
        "total_changes": drift_result.get("total_changes"),
        "regressions": drift_result.get("regressions"),
        "improvements": drift_result.get("improvements"),
        "critical_issues": drift_result.get("critical_issues"),
        "overall_risk_increase": drift_result.get("overall_risk_increase"),
        "changes": drift_result.get("changes", []),
        "baseline_id": baseline_id,
    }
    if user_id:
        data["user_id"] = user_id
    
    result = _get_client().table("drift_history").insert(data).execute()
    return result.data[0] if result.data else data


def get_drift_history(user_id, company_name: str, limit: int = 10) -> list:
    """Get recent drift analyses for a company."""
    query = (_get_client().table("drift_history")
             .select("*")
             .eq("company_name", company_name)
             .order("analysis_timestamp", desc=True)
             .limit(limit))
    if user_id:
        query = query.eq("user_id", user_id)
    
    result = query.execute()
    return result.data


def get_critical_alerts(user_id, company_name: str, status: str = "new") -> list:
    """Get critical drift alerts for a company."""
    query = (_get_client().table("drift_alerts")
             .select("*")
             .eq("company_name", company_name)
             .eq("status", status)
             .eq("severity", "CRITICAL")
             .order("detected_at", desc=True))
    if user_id:
        query = query.eq("user_id", user_id)
    
    result = query.execute()
    return result.data


def create_drift_alert(user_id, company_name: str, change: dict) -> dict:
    """Create an alert for a regression."""
    if not change.get("is_regression"):
        return None  # Don't alert on improvements
    
    data = {
        "company_name": company_name,
        "severity": change.get("severity"),
        "drift_config_path": change.get("config_path"),
        "previous_value": str(change.get("previous_value")),
        "current_value": str(change.get("current_value")),
        "risk_score": change.get("risk_score"),
        "affected_controls": change.get("affected_controls", []),
        "explanation": change.get("explanation"),
        "remediation": change.get("remediation"),
        "status": "new",
    }
    if user_id:
        data["user_id"] = user_id
    
    result = _get_client().table("drift_alerts").insert(data).execute()
    return result.data[0] if result.data else data


def acknowledge_alert(alert_id: str, user_id) -> dict:
    """Mark an alert as acknowledged."""
    from datetime import datetime
    
    data = {
        "status": "acknowledged",
        "acknowledged_at": datetime.utcnow().isoformat(),
        "acknowledged_by": user_id,
    }
    result = (_get_client().table("drift_alerts")
              .update(data)
              .eq("id", alert_id)
              .execute())
    return result.data[0] if result.data else data


def resolve_alert(alert_id: str) -> dict:
    """Mark an alert as resolved."""
    data = {"status": "resolved"}
    result = (_get_client().table("drift_alerts")
              .update(data)
              .eq("id", alert_id)
              .execute())
    return result.data[0] if result.data else data


def get_drift_trends(user_id, company_name: str, days: int = 30) -> list:
    """Get drift trends for the last N days."""
    from datetime import datetime, timedelta
    
    start_date = (datetime.utcnow() - timedelta(days=days)).date()
    
    query = (_get_client().table("drift_trends")
             .select("*")
             .eq("company_name", company_name)
             .gte("date", str(start_date))
             .order("date", desc=True))
    if user_id:
        query = query.eq("user_id", user_id)
    
    result = query.execute()
    return result.data


def log_audit_event(user_id, company_name: str, action: str, 
                    drift_path: str = None, severity: str = None,
                    previous_value = None, current_value = None, notes: str = None) -> dict:
    """Log a drift-related event for compliance audit trail."""
    data = {
        "company_name": company_name,
        "action": action,
        "drift_config_path": drift_path,
        "previous_value": str(previous_value) if previous_value else None,
        "current_value": str(current_value) if current_value else None,
        "severity": severity,
        "performed_by": user_id,
        "notes": notes,
    }
    
    result = _get_client().table("drift_audit_log").insert(data).execute()
    return result.data[0] if result.data else data
