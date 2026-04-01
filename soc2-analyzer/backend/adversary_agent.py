"""
Adversary Agent — AI-powered compliance auditor that challenges every finding.

Architecture (two-stage):
  Stage 1 — Rule-based triage (audit_memory.py): ALWAYS runs, no API needed.
             Scores every finding, attaches audit questions from memory.
  Stage 2 — AI challenge (Bedrock/Groq): Only runs on IMMEDIATE_ACTION + HIGH_PRIORITY findings.
             Challenges each one like a Big 4 auditor.

This means the tool always produces useful output even if AI is unavailable.
"""

import json
import audit_memory
import bedrock_service
import groq_service


def _build_challenge_prompt(findings: list, repo_name: str) -> str:
    """Build adversary prompt with audit memory injected as context."""
    findings_text = ""
    for i, f in enumerate(findings[:10], 1):
        qs = f.get("audit_questions", [])
        qs_text = "\n".join(f"     Q{j+1}: {q}" for j, q in enumerate(qs[:3]))
        findings_text += f"""
{i}. [{f.get('triage_flag','?')} | Score:{f.get('triage_score',0)}] {f.get('name','')}
   Severity: {f.get('severity','')} | Controls: {', '.join(f.get('controls',[]))}
   File: {f.get('file','')} Line {f.get('line',0)}
   Issue: {f.get('message','')}
   Standard fix: {f.get('fix','')}
   Known audit questions for this control:
{qs_text}
"""

    return f"""You are a senior compliance auditor at a Big 4 firm (Deloitte/PwC/EY/KPMG) conducting a SOC 2 Type 2 audit for "{repo_name}".

A code scanner flagged these findings. You already know what auditors ask for each control (shown above as audit questions).

For EACH finding, challenge it like a real auditor:
1. Is this a genuine risk or a false positive in context?
2. Is the standard fix actually sufficient to pass a Type 2 audit, or does the auditor demand more?
3. What specific evidence would you accept to close this finding?
4. Generate 2 sharp audit questions specific to THIS finding (not generic).

Return ONLY a JSON array, one object per finding (same order):
[
  {{
    "finding_index": 1,
    "verdict": "CONFIRMED" | "INSUFFICIENT_FIX" | "ESCALATE" | "FALSE_POSITIVE",
    "confidence": 90,
    "auditor_challenge": "One sharp sentence: what the auditor says",
    "audit_evidence_required": "Exactly what you need to see to close this finding",
    "generated_audit_questions": ["Q1 specific to this finding", "Q2 specific to this finding"],
    "escalated_severity": null | "CRITICAL" | "HIGH"
  }}
]

Be strict. Be direct. A lenient auditor harms the company.
Return ONLY valid JSON — no text, no markdown fences."""


def challenge_findings(findings: list, repo_name: str = "Unknown") -> list:
    """
    Full adversary agent pipeline:
    1. Rule-based triage (always runs)
    2. AI challenge on high-priority findings only
    3. Return merged results with SOC2 + framework metrics
    """
    if not findings:
        return []

    # ── Stage 1: Rule-based triage (no AI) ──────────────────────────────────
    triaged = audit_memory.rule_based_triage(findings)

    # ── Stage 2: AI challenge on top findings only ───────────────────────────
    # Only send IMMEDIATE_ACTION and HIGH_PRIORITY to AI (saves cost, stays fast)
    high_priority = [f for f in triaged if f.get("triage_flag") in ("IMMEDIATE_ACTION", "HIGH_PRIORITY")]
    ai_targets = high_priority[:10]  # Max 10 to keep prompt size manageable

    verdicts = []
    if ai_targets:
        prompt = _build_challenge_prompt(ai_targets, repo_name)
        raw = None

        try:
            raw = bedrock_service._call_bedrock(prompt, max_tokens=2500, temperature=0.2)
        except Exception as e:
            print(f"Adversary: Bedrock failed ({e}), trying Groq")
            try:
                client = groq_service._get_client()
                resp = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": "You are a strict SOC 2 Type 2 auditor. Return only valid JSON arrays. No markdown."},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.2,
                    max_tokens=2500,
                )
                raw = resp.choices[0].message.content
            except Exception as e2:
                print(f"Adversary: Groq also failed ({e2}), using rule-based only")

        if raw:
            try:
                clean = raw.replace("```json", "").replace("```", "").strip()
                verdicts = json.loads(clean, strict=False)
            except Exception:
                verdicts = []

    # ── Merge AI verdicts back into triaged findings ─────────────────────────
    for verdict in verdicts:
        idx = verdict.get("finding_index", 0) - 1
        if 0 <= idx < len(ai_targets):
            # Find corresponding finding in full triaged list
            target = ai_targets[idx]
            for i, f in enumerate(triaged):
                if f.get("file") == target.get("file") and f.get("line") == target.get("line"):
                    triaged[i] = {
                        **triaged[i],
                        "audit_verdict": verdict.get("verdict", "CONFIRMED"),
                        "audit_confidence": verdict.get("confidence", 70),
                        "auditor_challenge": verdict.get("auditor_challenge", ""),
                        "audit_evidence_required": verdict.get("audit_evidence_required", ""),
                        "generated_audit_questions": verdict.get("generated_audit_questions", []),
                        "escalated_severity": verdict.get("escalated_severity"),
                        "ai_challenged": True,
                    }
                    break

    # ── Fill defaults for findings not AI-challenged ─────────────────────────
    for i, f in enumerate(triaged):
        if "audit_verdict" not in f:
            triaged[i] = {
                **f,
                "audit_verdict": "CONFIRMED" if f.get("triage_flag") in ("IMMEDIATE_ACTION", "HIGH_PRIORITY") else "REVIEW_REQUIRED",
                "audit_confidence": 65,
                "auditor_challenge": f"Rule-based triage flagged this as {f.get('triage_flag','?')}. Verify with your auditor.",
                "audit_evidence_required": "Provide configuration evidence and policy documentation.",
                "generated_audit_questions": f.get("audit_questions", [])[:2],
                "ai_challenged": False,
            }

    return triaged


def get_full_metrics(findings: list) -> dict:
    """
    Full metrics package — no AI needed.
    Returns SOC2 category breakdown + cross-framework counts + severity breakdown.
    """
    soc2_metrics = audit_memory.calculate_soc2_metrics(findings)
    framework_metrics = audit_memory.calculate_framework_metrics(findings)

    sev_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    triage_counts = {"IMMEDIATE_ACTION": 0, "HIGH_PRIORITY": 0, "REVIEW_REQUIRED": 0, "MONITOR": 0}

    for f in findings:
        sev = f.get("severity", "MEDIUM")
        sev_counts[sev] = sev_counts.get(sev, 0) + 1
        triage = f.get("triage_flag", "MONITOR")
        triage_counts[triage] = triage_counts.get(triage, 0) + 1

    # All unique audit questions across all findings
    all_questions = audit_memory.get_questions_for_findings(findings)

    return {
        "soc2_metrics": soc2_metrics,
        "framework_metrics": framework_metrics,
        "severity_counts": sev_counts,
        "triage_counts": triage_counts,
        "audit_questions_by_control": all_questions,
        "total_audit_questions": sum(len(v) for v in all_questions.values()),
    }
