import { useState, useEffect, useRef } from "react";
import {
  Github, Code, Shield, AlertTriangle, FileText, Zap,
  Check, X, ChevronDown, ChevronRight, Eye, ExternalLink
} from "lucide-react";

const AGENTS = [
  { id: "code", name: "Code Agent", desc: "Scanning source files for 15 violation patterns", icon: Code, color: "#6366f1" },
  { id: "policy", name: "Policy Agent", desc: "Checking for security documentation", icon: FileText, color: "#22c55e" },
  { id: "adversary", name: "Adversary Agent", desc: "Challenging findings like a real auditor", icon: Eye, color: "#f97316" },
  { id: "ces", name: "CES Engine", desc: "Ranking by Compliance Efficiency Score v2", icon: Zap, color: "#eab308" },
  { id: "reporter", name: "Reporter Agent", desc: "Compiling cross-framework report", icon: Shield, color: "#ec4899" },
];

const VERDICT_CONFIG = {
  CONFIRMED: { label: "Confirmed", color: "#ef4444", bg: "#ef444420" },
  INSUFFICIENT_FIX: { label: "Fix Insufficient", color: "#f97316", bg: "#f9731620" },
  ESCALATE: { label: "Escalate", color: "#dc2626", bg: "#dc262620" },
  FALSE_POSITIVE: { label: "False Positive", color: "#6b7280", bg: "#6b728020" },
};

const SEVERITY_COLOR = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#eab308",
  LOW: "#22c55e",
};

export default function GitHubAgent({ onResults, selectedFrameworks, loading, setLoading }) {
  const [repoUrl, setRepoUrl] = useState("");
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [agentStages, setAgentStages] = useState(
    AGENTS.map(a => ({ ...a, status: "pending", progress: 0 }))
  );
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [expandedFiles, setExpandedFiles] = useState({});
  const timerRef = useRef(null);

  // Animate agent progress while API call runs
  const startAgentAnimation = () => {
    let currentAgent = 0;
    let progress = 0;

    const tick = () => {
      setAgentStages(prev => {
        const updated = [...prev];
        if (currentAgent >= AGENTS.length) return updated;

        progress += Math.random() * 18 + 5;

        if (progress >= 100) {
          updated[currentAgent] = { ...updated[currentAgent], status: "done", progress: 100 };
          currentAgent++;
          progress = 0;
          if (currentAgent < AGENTS.length) {
            updated[currentAgent] = { ...updated[currentAgent], status: "running", progress: 0 };
          }
        } else {
          updated[currentAgent] = { ...updated[currentAgent], status: "running", progress };
        }
        return updated;
      });

      if (currentAgent < AGENTS.length) {
        timerRef.current = setTimeout(tick, 200 + Math.random() * 150);
      }
    };

    setAgentStages(prev => {
      const updated = [...prev];
      updated[0] = { ...updated[0], status: "running", progress: 0 };
      return updated;
    });

    timerRef.current = setTimeout(tick, 300);
  };

  const finishAllAgents = () => {
    clearTimeout(timerRef.current);
    setAgentStages(AGENTS.map(a => ({ ...a, status: "done", progress: 100 })));
  };

  const handleScan = async () => {
    if (!repoUrl.trim()) return;
    setError(null);
    setResults(null);
    setScanning(true);
    setLoading(true);
    setAgentStages(AGENTS.map(a => ({ ...a, status: "pending", progress: 0 })));
    setExpandedFiles({});

    startAgentAnimation();

    try {
      const resp = await fetch("http://localhost:3001/api/scan-github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo_url: repoUrl.trim(),
          token: token.trim(),
          selected_frameworks: selectedFrameworks,
        }),
      });

      finishAllAgents();

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || "Scan failed");
      }

      const data = await resp.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
      setAgentStages(AGENTS.map(a => ({ ...a, status: "pending", progress: 0 })));
    } finally {
      setScanning(false);
      setLoading(false);
    }
  };

  // Group raw findings by file
  const findingsByFile = results
    ? results.raw_findings.reduce((acc, f) => {
        const key = f.file || "unknown";
        if (!acc[key]) acc[key] = [];
        acc[key].push(f);
        return acc;
      }, {})
    : {};

  return (
    <div className="w-full max-w-2xl">
      {/* Input Form */}
      <div className="glass p-5 mb-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Github className="w-4 h-4" style={{ color: "var(--accent)" }} />
          <span className="font-semibold text-sm">GitHub Repository Scanner</span>
        </div>

        <input
          type="text"
          placeholder="https://github.com/owner/repository"
          value={repoUrl}
          onChange={e => setRepoUrl(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleScan()}
          className="w-full px-3 py-2 rounded-lg text-sm font-mono"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
        />

        <div className="flex gap-2 items-center">
          <input
            type={showToken ? "text" : "password"}
            placeholder="GitHub Token (optional — for private repos)"
            value={token}
            onChange={e => setToken(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-mono"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
          <button
            onClick={() => setShowToken(s => !s)}
            className="px-3 py-2 rounded-lg text-xs"
            style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}
          >
            {showToken ? "Hide" : "Show"}
          </button>
        </div>

        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Public repos work without a token. For private repos, create a token with <code>repo</code> scope.
        </p>

        <button
          onClick={handleScan}
          disabled={!repoUrl.trim() || scanning}
          className="w-full py-2.5 rounded-lg font-semibold text-sm text-white flex items-center justify-center gap-2"
          style={{
            background: repoUrl.trim() && !scanning ? "var(--accent)" : "var(--text-muted)",
            cursor: repoUrl.trim() && !scanning ? "pointer" : "not-allowed",
            opacity: repoUrl.trim() && !scanning ? 1 : 0.6,
          }}
        >
          {scanning ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Agents running...
            </>
          ) : (
            <>
              <Github className="w-4 h-4" />
              Launch Agents
            </>
          )}
        </button>
      </div>

      {/* Agent Progress Cards */}
      {(scanning || results) && (
        <div className="space-y-2 mb-5">
          {agentStages.map((agent) => {
            const Icon = agent.icon;
            const isDone = agent.status === "done";
            const isRunning = agent.status === "running";
            return (
              <div
                key={agent.id}
                className="rounded-xl px-4 py-3 flex items-center gap-3 transition-all"
                style={{
                  background: "var(--bg-secondary)",
                  border: `1px solid ${isDone ? agent.color + "50" : "var(--border)"}`,
                  opacity: agent.status === "pending" ? 0.4 : 1,
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: agent.color + "20" }}
                >
                  {isDone
                    ? <Check className="w-4 h-4" style={{ color: agent.color }} />
                    : <Icon className="w-4 h-4" style={{ color: agent.color }} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{agent.name}</span>
                    {isRunning && (
                      <span className="text-xs" style={{ color: agent.color }}>
                        {Math.round(agent.progress)}%
                      </span>
                    )}
                    {isDone && (
                      <span className="text-xs" style={{ color: "#22c55e" }}>Done</span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {agent.desc}
                  </p>
                  {isRunning && (
                    <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-200"
                        style={{ width: `${agent.progress}%`, background: agent.color }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <div className="rounded-xl p-4 mb-5 text-sm" style={{ background: "#ef444415", border: "1px solid #ef444440", color: "#ef4444" }}>
          {error}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="glass p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold">{results.repo}</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {results.files_scanned} files scanned · {results.raw_findings?.length || 0} violations found
                </p>
              </div>
              <a
                href={`https://github.com/${results.repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
                style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}
              >
                <ExternalLink className="w-3 h-3" />
                Open Repo
              </a>
            </div>

            {/* Severity badges */}
            <div className="flex gap-3 flex-wrap">
              {Object.entries(results.severity_counts || {}).map(([sev, count]) => (
                count > 0 && (
                  <div
                    key={sev}
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: SEVERITY_COLOR[sev] + "20", color: SEVERITY_COLOR[sev] }}
                  >
                    {count} {sev}
                  </div>
                )
              ))}
            </div>

            {/* Policy status */}
            {results.policy_status && (
              <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: "var(--text-secondary)" }}>Security Documentation</span>
                  <span style={{ color: results.policy_status.score >= 60 ? "#22c55e" : "#ef4444" }}>
                    {results.policy_status.score}%
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap mt-1">
                  {results.policy_status.present?.map(doc => (
                    <span key={doc.path} className="text-xs px-2 py-0.5 rounded" style={{ background: "#22c55e20", color: "#22c55e" }}>
                      ✓ {doc.name}
                    </span>
                  ))}
                  {results.policy_status.missing?.slice(0, 3).map(doc => (
                    <span key={doc.path} className="text-xs px-2 py-0.5 rounded" style={{ background: "#ef444420", color: "#ef4444" }}>
                      ✗ {doc.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Trail detection */}
            {results.trail_info && (
              <div className="mt-3 pt-3 text-xs" style={{ borderTop: "1px solid var(--border)" }}>
                <span className="font-medium" style={{ color: "var(--text-secondary)" }}>CloudTrail in Code: </span>
                {results.trail_info.terraform_defined
                  ? (results.trail_info.terraform_enabled
                    ? <span style={{ color: "#22c55e" }}>✓ Terraform — CloudTrail enabled</span>
                    : <span style={{ color: "#ef4444" }}>✗ Terraform — CloudTrail disabled</span>)
                  : results.trail_info.cloudformation_defined
                    ? <span style={{ color: "#22c55e" }}>✓ CloudFormation detected</span>
                    : <span style={{ color: "var(--text-muted)" }}>No IaC detected in repo</span>
                }
              </div>
            )}

            {/* CTA to full dashboard */}
            <button
              onClick={() => onResults(results, {})}
              className="mt-4 w-full py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
              style={{ background: "var(--accent)" }}
            >
              <Zap className="w-4 h-4" />
              View Full Analysis in Dashboard
            </button>
          </div>

          {/* ── Metric Panels ── */}

          {/* SOC 2 Category Metrics */}
          {results.soc2_metrics && (
            <div className="glass p-5">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" style={{ color: "#6366f1" }} />
                SOC 2 Control Categories Affected
              </h4>
              <div className="space-y-2">
                {Object.entries(results.soc2_metrics).map(([cat, data]) => (
                  data.total > 0 && (
                    <div key={cat}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span style={{ color: "var(--text-secondary)" }}>{cat}</span>
                        <span style={{ color: data.affected > 0 ? "#ef4444" : "#22c55e" }}>
                          {data.affected}/{data.total} controls affected
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${data.pct}%`,
                            background: data.pct >= 60 ? "#ef4444" : data.pct >= 30 ? "#f97316" : "#eab308",
                          }}
                        />
                      </div>
                      {data.controls.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {data.controls.map(c => (
                            <span key={c} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#ef444420", color: "#ef4444" }}>
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Cross-Framework Metrics */}
          {results.framework_metrics && (
            <div className="glass p-5">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4" style={{ color: "#f97316" }} />
                Cross-Framework Impact
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "soc2", label: "SOC 2", color: "#6366f1" },
                  { key: "iso27001", label: "ISO 27001", color: "#22c55e" },
                  { key: "hipaa", label: "HIPAA", color: "#f97316" },
                  { key: "dpdp", label: "DPDP 2023", color: "#ec4899" },
                ].map(fw => (
                  <div
                    key={fw.key}
                    className="p-3 rounded-xl text-center"
                    style={{ background: fw.color + "15", border: `1px solid ${fw.color}30` }}
                  >
                    <div className="text-2xl font-bold" style={{ color: fw.color }}>
                      {results.framework_metrics[fw.key] || 0}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {fw.label}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>violations</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Triage Summary (rule-based, no AI) */}
          {results.triage_counts && (
            <div className="glass p-5">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" style={{ color: "#eab308" }} />
                Adversary Agent Triage
                <span className="text-xs font-normal ml-auto" style={{ color: "var(--text-muted)" }}>
                  rule-based · no AI cost
                </span>
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "IMMEDIATE_ACTION", label: "Immediate Action", color: "#ef4444" },
                  { key: "HIGH_PRIORITY", label: "High Priority", color: "#f97316" },
                  { key: "REVIEW_REQUIRED", label: "Review Required", color: "#eab308" },
                  { key: "MONITOR", label: "Monitor", color: "#6b7280" },
                ].map(t => (
                  <div
                    key={t.key}
                    className="p-2.5 rounded-lg flex items-center justify-between"
                    style={{ background: t.color + "15" }}
                  >
                    <span className="text-xs font-medium" style={{ color: t.color }}>{t.label}</span>
                    <span className="text-lg font-bold" style={{ color: t.color }}>
                      {results.triage_counts[t.key] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Questions */}
          {results.audit_questions_by_control && Object.keys(results.audit_questions_by_control).length > 0 && (
            <div className="glass p-5">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" style={{ color: "#22c55e" }} />
                Audit Questions Your Auditor Will Ask
                <span className="text-xs font-normal ml-auto px-2 py-0.5 rounded" style={{ background: "#22c55e20", color: "#22c55e" }}>
                  {results.total_audit_questions} total
                </span>
              </h4>
              <div className="space-y-3">
                {Object.entries(results.audit_questions_by_control).slice(0, 5).map(([ctrl, qs]) => (
                  <div key={ctrl}>
                    <div className="text-xs font-semibold mb-1" style={{ color: "var(--accent)" }}>{ctrl}</div>
                    <div className="space-y-1">
                      {(qs || []).slice(0, 3).map((q, i) => (
                        <div key={i} className="text-xs flex gap-2" style={{ color: "var(--text-secondary)" }}>
                          <span className="flex-shrink-0" style={{ color: "var(--text-muted)" }}>Q{i + 1}.</span>
                          {q}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {Object.keys(results.audit_questions_by_control).length > 5 && (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    + {Object.keys(results.audit_questions_by_control).length - 5} more controls with questions
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Findings by file */}
          <div>
            <h4 className="text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              Violations by File
            </h4>
            {Object.keys(findingsByFile).length === 0 ? (
              <div className="glass p-6 text-center">
                <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium">No violations found</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  All scanned patterns passed
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(findingsByFile).map(([file, filefindings]) => {
                  const isOpen = expandedFiles[file];
                  const worstSev = filefindings.reduce((worst, f) => {
                    const order = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
                    return (order[f.severity] || 0) > (order[worst] || 0) ? f.severity : worst;
                  }, "LOW");

                  return (
                    <div
                      key={file}
                      className="rounded-xl overflow-hidden"
                      style={{ border: "1px solid var(--border)" }}
                    >
                      <button
                        className="w-full flex items-center justify-between px-4 py-3 text-left"
                        style={{ background: "var(--bg-secondary)" }}
                        onClick={() => setExpandedFiles(prev => ({ ...prev, [file]: !isOpen }))}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Code className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                          <span className="text-xs font-mono truncate">{file}</span>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <span
                            className="text-xs px-2 py-0.5 rounded font-semibold flex-shrink-0"
                            style={{ background: SEVERITY_COLOR[worstSev] + "20", color: SEVERITY_COLOR[worstSev] }}
                          >
                            {filefindings.length} {filefindings.length === 1 ? "issue" : "issues"}
                          </span>
                          {isOpen ? <ChevronDown className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} /> : <ChevronRight className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="divide-y" style={{ borderTop: "1px solid var(--border)" }}>
                          {filefindings.map((finding, idx) => {
                            const verdict = finding.audit_verdict || "CONFIRMED";
                            const vConfig = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.CONFIRMED;

                            return (
                              <div key={idx} className="px-4 py-3" style={{ background: "var(--bg-card)" }}>
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className="text-xs font-bold px-1.5 py-0.5 rounded"
                                      style={{ background: SEVERITY_COLOR[finding.severity] + "20", color: SEVERITY_COLOR[finding.severity] }}
                                    >
                                      {finding.severity}
                                    </span>
                                    <span className="text-sm font-medium">{finding.name}</span>
                                  </div>
                                  <span
                                    className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                                    style={{ background: vConfig.bg, color: vConfig.color }}
                                  >
                                    {vConfig.label}
                                  </span>
                                </div>

                                {finding.line > 0 && (
                                  <div
                                    className="text-xs font-mono px-2 py-1 rounded mb-1.5 truncate"
                                    style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}
                                  >
                                    Line {finding.line}: {finding.line_content}
                                  </div>
                                )}

                                <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
                                  {finding.message}
                                </p>

                                {finding.auditor_challenge && (
                                  <p className="text-xs italic" style={{ color: "#f97316" }}>
                                    Auditor: "{finding.auditor_challenge}"
                                  </p>
                                )}

                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {finding.controls?.map(c => (
                                    <span key={c} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>
                                      {c}
                                    </span>
                                  ))}
                                  {finding.frameworks?.map(fw => (
                                    <span key={fw} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--accent)20", color: "var(--accent)" }}>
                                      {fw.toUpperCase()}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
