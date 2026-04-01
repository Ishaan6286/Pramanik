"""
ComplianceAI — LangGraph Multi-Agent Compliance Scanner

5 agents orchestrated as a stateful graph:
  1. Code Agent      — regex + Semgrep scan of GitHub repo files
  2. Policy Agent    — checks for SECURITY.md, CHANGELOG, CI/CD docs
  3. Dependency Agent — OSV.dev CVE lookup on package.json / requirements.txt
  4. Adversary Agent  — Groq AI challenges top findings like a Big 4 auditor
  5. CES Engine       — scores every finding → IMMEDIATE / HIGH / REVIEW / MONITOR

Agentic features:
  - Conditional routing: skip adversary if 0 findings
  - Adversary can ESCALATE findings → triggers deeper re-scan on flagged files
  - State flows between nodes as a typed dict
"""

from __future__ import annotations

import operator
from typing import TypedDict, Annotated, Any

from langgraph.graph import StateGraph, END

import github_agent
import adversary_agent
import audit_memory
from framework_mappings import calculate_crvs, get_framework_summary, FRAMEWORK_MAP


# ═══════════════════════════════════════════════════════════════════════════════
# STATE — typed dict that flows between every node
# ═══════════════════════════════════════════════════════════════════════════════

class ComplianceState(TypedDict):
    # Input
    repo_url: str
    token: str | None
    company_name: str
    selected_frameworks: list[str]
    max_files: int

    # Agent outputs (accumulated as we go)
    scan_result: dict               # from code agent
    findings: list[dict]            # raw findings from code + semgrep
    policy_status: dict             # from policy agent
    dep_findings: list[dict]        # from dependency agent
    all_findings: list[dict]        # merged findings
    challenged: list[dict]          # after adversary
    full_metrics: dict              # severity + triage counts
    control_results: list[dict]     # mapped to SOC 2 controls
    priority_fixes: list[dict]      # CES ranked
    framework_scores: dict          # per-framework scores
    score: int
    trail_info: dict

    # Agentic: track which nodes ran + decisions
    agent_trace: list[dict]         # [{node, status, decision, duration_ms}]
    rescan_files: list[str]         # files the adversary wants re-scanned
    iteration: int                  # re-scan loop counter (max 2)


# ═══════════════════════════════════════════════════════════════════════════════
# NODE 1: CODE AGENT — scans GitHub repo with 25 regex patterns + Semgrep
# ═══════════════════════════════════════════════════════════════════════════════

def code_agent_node(state: ComplianceState) -> dict:
    """Fetch repo files, run regex + Semgrep scan. On re-scan, only scan flagged files."""
    import time
    start = time.time()

    iteration = state.get("iteration", 0)
    rescan_files = state.get("rescan_files", [])

    if iteration == 0:
        # First scan — full repository
        scan_result = github_agent.scan_repository(
            repo_url=state["repo_url"],
            token=state.get("token"),
            max_files=state.get("max_files", 150),
        )
        findings = scan_result["findings"]
        trail_info = scan_result.get("trail_info", {})
        company_name = state.get("company_name") or scan_result["repo"]

        duration = int((time.time() - start) * 1000)
        return {
            "scan_result": scan_result,
            "findings": findings,
            "trail_info": trail_info,
            "company_name": company_name,
            "agent_trace": state.get("agent_trace", []) + [{
                "node": "code_agent",
                "status": "completed",
                "decision": f"Scanned {scan_result['files_scanned']}/{scan_result['total_files']} files, found {len(findings)} violations",
                "duration_ms": duration,
                "iteration": iteration,
            }],
        }
    else:
        # Re-scan — adversary flagged specific files for deeper analysis
        owner, repo = github_agent.parse_repo_url(state["repo_url"])
        token = state.get("token")
        new_findings = []

        for file_path in rescan_files[:10]:
            try:
                content = github_agent.fetch_file_content(owner, repo, file_path, token)
                file_findings = github_agent.scan_file(file_path, content)
                new_findings.extend(file_findings)
            except Exception:
                pass

        # Merge with existing findings (deduplicate by file+line)
        existing = {(f["file"], f["line"]) for f in state.get("findings", [])}
        unique_new = [f for f in new_findings if (f["file"], f["line"]) not in existing]
        merged = state.get("findings", []) + unique_new

        duration = int((time.time() - start) * 1000)
        return {
            "findings": merged,
            "rescan_files": [],
            "agent_trace": state.get("agent_trace", []) + [{
                "node": "code_agent",
                "status": "completed",
                "decision": f"Re-scanned {len(rescan_files)} flagged files, found {len(unique_new)} new violations",
                "duration_ms": duration,
                "iteration": iteration,
            }],
        }


# ═══════════════════════════════════════════════════════════════════════════════
# NODE 2: POLICY AGENT — checks for security documentation
# ═══════════════════════════════════════════════════════════════════════════════

def policy_agent_node(state: ComplianceState) -> dict:
    """Check which security/policy docs exist. Add missing ones as findings."""
    import time
    start = time.time()

    scan_result = state.get("scan_result", {})
    policy_status = scan_result.get("policy_status", {})

    # Policy findings are already in the scan_result from code agent
    # But we separate them here for clarity in the graph

    policy_findings = [f for f in state.get("findings", []) if f.get("pattern_id") == "POLICY-MISSING"]
    code_findings = [f for f in state.get("findings", []) if f.get("pattern_id") != "POLICY-MISSING"]

    duration = int((time.time() - start) * 1000)
    return {
        "policy_status": policy_status,
        "agent_trace": state.get("agent_trace", []) + [{
            "node": "policy_agent",
            "status": "completed",
            "decision": f"Found {len(policy_status.get('present', []))} docs present, {len(policy_status.get('missing', []))} missing",
            "duration_ms": duration,
        }],
    }


# ═══════════════════════════════════════════════════════════════════════════════
# NODE 3: DEPENDENCY AGENT — OSV.dev CVE lookup
# ═══════════════════════════════════════════════════════════════════════════════

def dependency_agent_node(state: ComplianceState) -> dict:
    """Already run inside code_agent (scan_repository calls scan_dependencies_osv).
    This node extracts + logs the dep findings separately for tracing."""
    import time
    start = time.time()

    dep_findings = [f for f in state.get("findings", []) if f.get("source") == "osv"]
    semgrep_findings = [f for f in state.get("findings", []) if f.get("source") == "semgrep"]

    duration = int((time.time() - start) * 1000)
    return {
        "dep_findings": dep_findings,
        "agent_trace": state.get("agent_trace", []) + [{
            "node": "dependency_agent",
            "status": "completed",
            "decision": f"Found {len(dep_findings)} CVEs in dependencies, {len(semgrep_findings)} Semgrep findings",
            "duration_ms": duration,
        }],
    }


# ═══════════════════════════════════════════════════════════════════════════════
# NODE 4: ADVERSARY AGENT — Groq AI challenges findings like a Big 4 auditor
# ═══════════════════════════════════════════════════════════════════════════════

def adversary_agent_node(state: ComplianceState) -> dict:
    """Challenge top findings with Groq AI. Can escalate → trigger re-scan."""
    import time
    start = time.time()

    findings = state.get("findings", [])
    company_name = state.get("company_name", "Unknown")

    challenged = adversary_agent.challenge_findings(findings, company_name)
    full_metrics = adversary_agent.get_full_metrics(challenged)

    # AGENTIC: Check if adversary escalated any findings
    # If so, collect those files for a deeper re-scan
    escalated_files = []
    for f in challenged:
        if f.get("audit_verdict") == "ESCALATE" or f.get("escalated_severity") == "CRITICAL":
            file_path = f.get("file", "")
            if file_path and file_path not in escalated_files:
                escalated_files.append(file_path)

    decision = f"Challenged {len(findings)} findings via AI"
    if escalated_files:
        decision += f", ESCALATED {len(escalated_files)} files for re-scan"

    duration = int((time.time() - start) * 1000)
    return {
        "challenged": challenged,
        "all_findings": challenged,
        "full_metrics": full_metrics,
        "rescan_files": escalated_files,
        "agent_trace": state.get("agent_trace", []) + [{
            "node": "adversary_agent",
            "status": "completed",
            "decision": decision,
            "duration_ms": duration,
        }],
    }


# ═══════════════════════════════════════════════════════════════════════════════
# NODE 5: CES ENGINE — score + rank every finding
# ═══════════════════════════════════════════════════════════════════════════════

def ces_engine_node(state: ComplianceState) -> dict:
    """Map findings to controls, calculate CES scores, framework summaries."""
    import time
    start = time.time()

    challenged = state.get("challenged", [])
    selected_frameworks = state.get("selected_frameworks", ["soc2", "iso27001", "dpdp"])

    # Convert findings → control results (same logic as main.py _github_findings_to_controls)
    control_findings: dict = {}
    for f in challenged:
        if f.get("pattern_id") == "POLICY-MISSING":
            continue
        for ctrl_id in f.get("controls", []):
            if ctrl_id not in control_findings:
                control_findings[ctrl_id] = []
            control_findings[ctrl_id].append(f)

    control_results = []
    for ctrl_id, ctrl_findings in control_findings.items():
        fw_map = FRAMEWORK_MAP.get(ctrl_id, {})
        soc2_info = fw_map.get("soc2") or {}

        sev_order = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}
        worst_sev = max(ctrl_findings, key=lambda x: sev_order.get(x.get("severity", "MEDIUM"), 2))
        issues = list({f["message"] for f in ctrl_findings})
        file_refs = [f"{f['file']}:{f['line']}" for f in ctrl_findings[:3]]

        control_results.append({
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

    # Filter by selected frameworks
    if selected_frameworks:
        fw_set = set(selected_frameworks)
        control_results = [
            r for r in control_results
            if any(FRAMEWORK_MAP.get(r["id"], {}).get(fw) is not None for fw in fw_set)
        ]

    priority_fixes = calculate_crvs(control_results)
    framework_scores = get_framework_summary(control_results)

    total_controls = len(control_results)
    score = max(0, 100 - int((total_controls / 33) * 100))

    duration = int((time.time() - start) * 1000)
    return {
        "control_results": control_results,
        "priority_fixes": priority_fixes,
        "framework_scores": framework_scores,
        "score": score,
        "agent_trace": state.get("agent_trace", []) + [{
            "node": "ces_engine",
            "status": "completed",
            "decision": f"Scored {total_controls} controls, compliance score: {score}%",
            "duration_ms": duration,
        }],
    }


# ═══════════════════════════════════════════════════════════════════════════════
# CONDITIONAL EDGES — agentic routing logic
# ═══════════════════════════════════════════════════════════════════════════════

def should_run_adversary(state: ComplianceState) -> str:
    """Skip adversary if no findings to challenge."""
    findings = state.get("findings", [])
    if len(findings) == 0:
        return "skip_to_ces"
    return "run_adversary"


def should_rescan(state: ComplianceState) -> str:
    """After adversary, check if any findings were escalated for re-scan."""
    rescan_files = state.get("rescan_files", [])
    iteration = state.get("iteration", 0)

    # Max 1 re-scan loop to prevent infinite cycles
    if rescan_files and iteration < 1:
        return "rescan"
    return "continue_to_ces"


# ═══════════════════════════════════════════════════════════════════════════════
# INCREMENT NODE — bump iteration counter before re-scan
# ═══════════════════════════════════════════════════════════════════════════════

def increment_iteration(state: ComplianceState) -> dict:
    return {"iteration": state.get("iteration", 0) + 1}


# ═══════════════════════════════════════════════════════════════════════════════
# BUILD THE GRAPH
# ═══════════════════════════════════════════════════════════════════════════════

def build_compliance_graph() -> StateGraph:
    """
    Build the LangGraph compliance scanner.

    Graph structure:
        code_agent → policy_agent → dependency_agent → [conditional] → adversary_agent
                                                              ↓ (if 0 findings)
                                                         ces_engine → END
                                                              ↑
        adversary_agent → [conditional: escalated?] → increment → code_agent (re-scan)
                                    ↓ (no escalation)
                               ces_engine → END
    """
    graph = StateGraph(ComplianceState)

    # Add nodes
    graph.add_node("code_agent", code_agent_node)
    graph.add_node("policy_agent", policy_agent_node)
    graph.add_node("dependency_agent", dependency_agent_node)
    graph.add_node("adversary_agent", adversary_agent_node)
    graph.add_node("ces_engine", ces_engine_node)
    graph.add_node("increment_iteration", increment_iteration)

    # Set entry point
    graph.set_entry_point("code_agent")

    # Linear flow: code → policy → dependency
    graph.add_edge("code_agent", "policy_agent")
    graph.add_edge("policy_agent", "dependency_agent")

    # Conditional: skip adversary if 0 findings
    graph.add_conditional_edges(
        "dependency_agent",
        should_run_adversary,
        {
            "run_adversary": "adversary_agent",
            "skip_to_ces": "ces_engine",
        },
    )

    # Conditional: after adversary, re-scan or continue
    graph.add_conditional_edges(
        "adversary_agent",
        should_rescan,
        {
            "rescan": "increment_iteration",
            "continue_to_ces": "ces_engine",
        },
    )

    # Re-scan loop: increment → code_agent (which will do targeted re-scan)
    graph.add_edge("increment_iteration", "code_agent")

    # CES engine → END
    graph.add_edge("ces_engine", END)

    return graph.compile()


# ═══════════════════════════════════════════════════════════════════════════════
# ENTRY POINT — run the full graph
# ═══════════════════════════════════════════════════════════════════════════════

# Compile once at module load
_compiled_graph = build_compliance_graph()


def run_compliance_scan(
    repo_url: str,
    token: str | None = None,
    company_name: str = "",
    selected_frameworks: list[str] | None = None,
    max_files: int = 150,
) -> dict:
    """
    Run the full multi-agent compliance scan via LangGraph.
    Returns the final state with all results.
    """
    if selected_frameworks is None:
        selected_frameworks = ["soc2", "iso27001", "dpdp"]

    initial_state: ComplianceState = {
        "repo_url": repo_url,
        "token": token,
        "company_name": company_name,
        "selected_frameworks": selected_frameworks,
        "max_files": max_files,
        "scan_result": {},
        "findings": [],
        "policy_status": {},
        "dep_findings": [],
        "all_findings": [],
        "challenged": [],
        "full_metrics": {},
        "control_results": [],
        "priority_fixes": [],
        "framework_scores": {},
        "score": 0,
        "trail_info": {},
        "agent_trace": [],
        "rescan_files": [],
        "iteration": 0,
    }

    # Run the graph — returns final state
    final_state = _compiled_graph.invoke(initial_state)
    return final_state
