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
