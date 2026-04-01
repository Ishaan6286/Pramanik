"""
Audit Memory — Hybrid database of real SOC 2 Type 2 audit questions per control.

Load order:
  1. Supabase `audit_questions` table (dynamic — edit from dashboard anytime)
  2. Static dict below (fallback if DB is unreachable)

This is Agent 3's "memory" — injected into the Adversary Agent prompt so it
knows exactly what a real auditor will ask, without needing AI to generate questions.

Source: AICPA SOC 2 audit procedures, Big 4 audit checklists, NIST SP 800-53.
"""

import threading

# Cache loaded from Supabase at first use
_supabase_cache: dict | None = None
_cache_lock = threading.Lock()

# Real audit questions per SOC 2 control ID
# Each question is what an auditor would actually ask during a Type 2 engagement
AUDIT_QUESTIONS: dict[str, list[str]] = {
    "CC6.1": [
        "What percentage of users have MFA enabled? Provide enrollment report.",
        "Show your privileged access review from the last 90 days.",
        "Demonstrate how new user access is approved and provisioned.",
        "What is your process for revoking access when an employee leaves?",
        "Show audit logs of failed login attempts for the last 30 days.",
    ],
    "CC6.2": [
        "Show your current password policy configuration (screenshot + policy doc).",
        "When was the password policy last reviewed and by whom?",
        "Provide evidence that the policy is enforced at the system level.",
        "How do you handle service account passwords and rotation?",
    ],
    "CC6.3": [
        "Show your role-based access matrix for all production systems.",
        "Demonstrate that access follows least-privilege principle.",
        "When was your last user access review? Show the evidence.",
        "How are admin privileges tracked and approved?",
    ],
    "CC6.6": [
        "List all publicly accessible S3 buckets and justify each one.",
        "Show your network diagram — which services are internet-facing?",
        "Demonstrate that no production databases are publicly accessible.",
        "Show your firewall/security group rules for all production resources.",
    ],
    "CC6.7": [
        "Show SSL/TLS configuration for all customer-facing endpoints.",
        "Provide certificate expiry monitoring evidence.",
        "Demonstrate encryption in transit for all internal service communication.",
        "When was your last TLS configuration review?",
    ],
    "CC6.8": [
        "Show your vulnerability scanning schedule and last 3 reports.",
        "How do you manage dependencies and patch critical CVEs?",
        "Demonstrate your secure development lifecycle (SDLC) process.",
        "Show evidence of security code review in your pull request process.",
    ],
    "CC7.1": [
        "Is GuardDuty or equivalent threat detection enabled in all regions?",
        "Show the last 90 days of security alerts and how they were handled.",
        "Demonstrate your threat detection coverage — what are the gaps?",
        "How are security alerts escalated and who is on-call?",
    ],
    "CC7.2": [
        "Show CloudTrail is enabled in ALL AWS regions (not just primary).",
        "Demonstrate log file validation is enabled (prevents tampering).",
        "Who has access to modify or delete CloudTrail logs?",
        "Show your log retention policy — minimum 1 year required for SOC 2.",
        "Demonstrate that logs are shipped to an immutable destination (separate account or S3 with MFA delete).",
    ],
    "CC7.3": [
        "Show your incident response runbooks for top 3 incident types.",
        "Demonstrate a completed incident response exercise from the last 12 months.",
        "What is your SLA for responding to a P1 security incident?",
        "Show your on-call rotation and escalation policy.",
    ],
    "CC8.1": [
        "Show your change management process — how are production changes approved?",
        "Demonstrate that all production deployments have a change ticket.",
        "Show evidence of testing before production deployment.",
        "How do you track and document emergency changes?",
    ],
    "CC9.2": [
        "List every datastore that contains customer PII or sensitive data.",
        "Show encryption configuration for each — key type, rotation schedule.",
        "Who manages encryption keys and how is key access controlled?",
        "Demonstrate that backups are also encrypted.",
        "Show your KMS key rotation policy.",
    ],
    "A1.1": [
        "Show your SLA/uptime commitments to customers.",
        "Demonstrate your availability monitoring — what triggers an alert?",
        "Show your capacity planning process.",
        "What is your current p99 response time for the last 30 days?",
    ],
    "A1.2": [
        "Show your backup schedule and last successful restore test.",
        "Demonstrate that backups are in a separate region from production.",
        "What is your RTO (Recovery Time Objective)? Show how you test it.",
        "Show backup integrity verification logs.",
    ],
    "C1.1": [
        "Show your data classification policy — how is PII identified?",
        "Demonstrate data discovery tooling (Macie, DLP, etc.).",
        "How is sensitive data labeled and tracked across systems?",
        "Show your data flow diagram highlighting all PII flows.",
    ],
    "C1.2": [
        "Show your data retention and disposal policy.",
        "Demonstrate secure deletion of data when retention period expires.",
        "How do you handle customer data deletion requests?",
    ],
    "CC4.1": [
        "Show your monitoring dashboard — what metrics are tracked?",
        "Demonstrate alerting coverage — what conditions trigger alerts?",
        "Show your on-call runbook for the top 5 alert types.",
    ],
    "CC5.1": [
        "Show your internal audit schedule for security controls.",
        "Demonstrate that controls are tested quarterly.",
    ],
    "CC5.2": [
        "Show your WAF configuration and rule set.",
        "Demonstrate input validation in your application code.",
        "Show your OWASP Top 10 remediation status.",
    ],
    "P1.1": [
        "Show your privacy policy — when was it last updated?",
        "Demonstrate consent capture at point of data collection.",
        "Show your data processing agreements with all vendors.",
    ],
    "P1.2": [
        "Demonstrate how users can access, correct, and delete their data.",
        "Show your process for handling data subject requests.",
        "What is your SLA for responding to DSARs (Data Subject Access Requests)?",
    ],
    "P1.3": [
        "Show your data retention schedule per data category.",
        "Demonstrate automatic deletion when retention period expires.",
    ],
    # DPDP Act 2023 specific
    "§8(1)": [
        "Show your Information Security Policy — signed off by board/CTO.",
        "Demonstrate that security controls are aligned with DPDP Act requirements.",
    ],
    "§8(5)": [
        "Show your breach notification SOP — 72-hour notification requirement.",
        "Demonstrate your breach detection tooling.",
        "Who is your Data Protection Officer (DPO)?",
    ],
    "CC2.1": [
        "Show your security awareness training completion rate.",
        "Demonstrate all employees completed annual security training.",
    ],
    "CC3.2": [
        "Show your risk register — last updated when?",
        "Demonstrate your risk assessment methodology.",
    ],
}


# Severity levels that should ALWAYS be flagged regardless of context
ALWAYS_FLAG_PATTERNS = {"CRED-001", "CRED-002", "S3-001", "IAM-001", "SQLI-001", "NOSQL-001", "EVAL-001"}

# Control categories for SOC 2 metrics
CONTROL_CATEGORIES = {
    "Common Criteria (CC)": [c for c in AUDIT_QUESTIONS if c.startswith("CC")],
    "Availability (A)": [c for c in AUDIT_QUESTIONS if c.startswith("A")],
    "Confidentiality (C)": [c for c in AUDIT_QUESTIONS if c.startswith("C") and not c.startswith("CC")],
    "Processing Integrity (PI)": ["PI1.1", "PI1.2", "PI1.3"],
    "Privacy (P)": [c for c in AUDIT_QUESTIONS if c.startswith("P") and not c.startswith("PI")],
}


def _load_supabase_cache() -> dict:
    """Load all audit questions from Supabase once. Thread-safe."""
    global _supabase_cache
    with _cache_lock:
        if _supabase_cache is not None:
            return _supabase_cache
        try:
            import db
            loaded = db.get_all_audit_questions()
            if loaded:
                _supabase_cache = loaded
                print(f"Audit memory: loaded {sum(len(v) for v in loaded.values())} questions from Supabase")
                return _supabase_cache
        except Exception as e:
            print(f"Audit memory: Supabase unavailable ({e}), using static fallback")
        _supabase_cache = {}
        return _supabase_cache


def get_audit_questions(control_id: str) -> list[str]:
    """
    Get audit questions for a control.
    Tries Supabase first, falls back to static dict, then generates a generic question.
    """
    # 1. Try Supabase cache
    db_cache = _load_supabase_cache()
    if db_cache and control_id in db_cache:
        return db_cache[control_id]

    # 2. Static fallback
    if control_id in AUDIT_QUESTIONS:
        return AUDIT_QUESTIONS[control_id]

    # 3. Generic default
    return [
        f"Provide evidence that {control_id} is implemented and operating effectively.",
        "Show configuration screenshots and policy documentation.",
        "Demonstrate this control has been tested in the last 12 months.",
    ]


def invalidate_cache():
    """Call this after adding new questions to Supabase to reload the cache."""
    global _supabase_cache
    with _cache_lock:
        _supabase_cache = None


def get_questions_for_findings(findings: list) -> dict:
    """Get all relevant audit questions for a list of findings."""
    questions_by_control = {}
    for finding in findings:
        for ctrl in finding.get("controls", []):
            if ctrl not in questions_by_control:
                questions_by_control[ctrl] = get_audit_questions(ctrl)
    return questions_by_control


def rule_based_triage(findings: list) -> list:
    """
    Fast, deterministic risk triage — NO AI needed.

    This runs FIRST before the Adversary Agent so:
    1. The tool always works even if Bedrock/Groq is down
    2. AI only processes pre-filtered high-priority findings (saves cost)
    3. Every finding has a justified risk score before AI sees it
    """
    sev_scores = {"CRITICAL": 40, "HIGH": 25, "MEDIUM": 10, "LOW": 3}
    # Controls that are the highest risk if violated
    HIGH_VALUE_CONTROLS = {"CC6.1", "CC6.6", "CC7.2", "CC9.2", "CC6.7"}

    triaged = []
    for f in findings:
        risk_score = 0

        # 1. Severity weight
        risk_score += sev_scores.get(f.get("severity", "MEDIUM"), 10)

        # 2. Cross-framework bonus — more frameworks = bigger compliance gap
        fw_count = len(f.get("frameworks", []))
        risk_score += fw_count * 5

        # 3. High-value control bonus
        if any(c in HIGH_VALUE_CONTROLS for c in f.get("controls", [])):
            risk_score += 15

        # 4. Always-flag patterns — no context needed, always critical
        if f.get("pattern_id") in ALWAYS_FLAG_PATTERNS:
            risk_score += 30

        # 5. Triage classification
        if f.get("pattern_id") in ALWAYS_FLAG_PATTERNS or risk_score >= 70:
            triage_flag = "IMMEDIATE_ACTION"
            triage_color = "#ef4444"
        elif risk_score >= 45:
            triage_flag = "HIGH_PRIORITY"
            triage_color = "#f97316"
        elif risk_score >= 25:
            triage_flag = "REVIEW_REQUIRED"
            triage_color = "#eab308"
        else:
            triage_flag = "MONITOR"
            triage_color = "#6b7280"

        # 6. Attach audit questions (memory injection)
        audit_qs = []
        for ctrl in f.get("controls", []):
            audit_qs.extend(get_audit_questions(ctrl)[:2])  # Top 2 per control

        triaged.append({
            **f,
            "triage_score": risk_score,
            "triage_flag": triage_flag,
            "triage_color": triage_color,
            "audit_questions": audit_qs[:4],  # Max 4 questions per finding
        })

    return sorted(triaged, key=lambda x: x["triage_score"], reverse=True)


def calculate_soc2_metrics(findings: list) -> dict:
    """
    Calculate SOC 2 metrics from findings — how many controls affected per category.
    No AI needed.
    """
    affected_controls = {c for f in findings for c in f.get("controls", [])}

    metrics = {}
    for category, controls in CONTROL_CATEGORIES.items():
        affected = [c for c in controls if c in affected_controls]
        total = len(controls)
        metrics[category] = {
            "affected": len(affected),
            "total": total,
            "controls": affected,
            "pct": round(len(affected) / max(total, 1) * 100),
        }

    return metrics


def calculate_framework_metrics(findings: list) -> dict:
    """Cross-framework breakdown — how many findings per framework."""
    fw_counts = {"soc2": 0, "iso27001": 0, "hipaa": 0, "dpdp": 0}
    for f in findings:
        for fw in f.get("frameworks", []):
            if fw in fw_counts:
                fw_counts[fw] += 1
    return fw_counts
