import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Github, Code, Shield, FileText, Zap, Check, ChevronDown, ChevronRight, Eye, ExternalLink, Package, Wrench, Loader, GitPullRequest } from "lucide-react";
import { API_URL } from "../config";
import "./GitHubAgent.css";

/** Read JSON from fetch; if the server returns HTML (wrong port / SPA), show a clear error. */
async function readApiJson(resp) {
  const text = await resp.text();
  const t = text.trim();
  if (t.startsWith("<") || (!t.startsWith("{") && !t.startsWith("["))) {
    throw new Error(
      `The API returned a page instead of JSON (status ${resp.status}). ` +
      `Start the FastAPI backend (e.g. uvicorn on port 8000) and set VITE_API_URL if it is not ${API_URL}.`
    );
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from API (status ${resp.status})`);
  }
}

const AGENTS = [
  { id: "code", name: "Code Agent", desc: "Inspecting repository structure", icon: Code },
  { id: "policy", name: "Policy Agent", desc: "Checking documentation", icon: FileText },
  { id: "adversary", name: "Adversary Agent", desc: "Challenging findings", icon: Eye },
  { id: "ces", name: "CES Engine", desc: "Evaluating evidence", icon: Zap },
  { id: "reporter", name: "Reporter", desc: "Preparing results", icon: Shield },
];

const SEV_CLASS = {
  CRITICAL: "sw-chip--critical",
  HIGH: "sw-chip--high",
  MEDIUM: "sw-chip--medium",
  LOW: "sw-chip--low",
};

const VERDICT = {
  CONFIRMED: { label: "Confirmed", className: "sw-chip--high" },
  INSUFFICIENT_FIX: { label: "Fix Insufficient", className: "sw-chip--medium" },
  ESCALATE: { label: "Escalate", className: "sw-chip--critical" },
  FALSE_POSITIVE: { label: "False Positive", className: "sw-chip" },
};

function SevBadge({ sev }) {
  return (
    <span className={`sw-sev sw-chip ${SEV_CLASS[sev] || SEV_CLASS.LOW}`}>{sev}</span>
  );
}

export default function GitHubAgent({ onResults, selectedFrameworks, loading, setLoading }) {
  const [repoUrl, setRepoUrl] = useState("");
  const [token, setToken] = useState(() => sessionStorage.getItem("pramanik_gh_token") || "");
  const [showToken, setShowToken] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [fixingKey, setFixingKey] = useState(null);
  const [fixResults, setFixResults] = useState({});
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [agentStages, setAgentStages] = useState(AGENTS.map(a => ({ ...a, status: "pending", progress: 0 })));
  const [tokenModal, setTokenModal] = useState(null);
  const [modalToken, setModalToken] = useState("");
  const timerRef = useRef(null);

  const questionsWrapRef = useRef(null);

  useEffect(() => {
    // Height sync removed as requested
  }, []);

  const saveToken = (value) => {
    const trimmed = value.trim();
    setToken(trimmed);
    if (trimmed) sessionStorage.setItem("pramanik_gh_token", trimmed);
    else sessionStorage.removeItem("pramanik_gh_token");
    return trimmed;
  };

  const runAutoFix = async (file, finding, idx, authToken) => {
    const key = `${file}:${idx}`;
    setFixingKey(key);
    setFixResults(p => ({ ...p, [key]: {} }));
    try {
      const resp = await fetch(`${API_URL}/api/auto-fix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo_url: repoUrl.trim(),
          token: authToken,
          file_path: file,
          finding,
        }),
      });
      const data = await readApiJson(resp);
      if (!resp.ok) {
        const detail = typeof data.detail === "string" ? data.detail : "Auto-fix failed";
        throw new Error(detail);
      }
      setFixResults(p => ({
        ...p,
        [key]: {
          pr_url: data.pr_url,
          pr_number: data.pr_number,
          branch: data.branch,
        },
      }));
    } catch (e) {
      setFixResults(p => ({ ...p, [key]: { error: e.message } }));
    } finally {
      setFixingKey(null);
    }
  };

  const handleAutoFix = async (file, finding, idx) => {
    if (!token.trim()) {
      setModalToken("");
      setTokenModal({ file, finding, idx });
      return;
    }
    await runAutoFix(file, finding, idx, token.trim());
  };

  const confirmTokenAndFix = async () => {
    if (!tokenModal || !modalToken.trim()) return;
    const saved = saveToken(modalToken);
    const pending = tokenModal;
    setTokenModal(null);
    await runAutoFix(pending.file, pending.finding, pending.idx, saved);
  };

  const startAnimation = () => {
    let cur = 0, prog = 0;
    const tick = () => {
      setAgentStages(prev => {
        const u = [...prev];
        if (cur >= AGENTS.length) return u;
        prog += Math.random() * 18 + 5;
        if (prog >= 100) {
          u[cur] = { ...u[cur], status: "done", progress: 100 };
          cur++; prog = 0;
          if (cur < AGENTS.length) u[cur] = { ...u[cur], status: "running", progress: 0 };
        } else {
          u[cur] = { ...u[cur], status: "running", progress: prog };
        }
        return u;
      });
      if (cur < AGENTS.length) timerRef.current = setTimeout(tick, 200 + Math.random() * 150);
    };
    setAgentStages(prev => { const u = [...prev]; u[0] = { ...u[0], status: "running" }; return u; });
    timerRef.current = setTimeout(tick, 300);
  };

  const finishAll = () => {
    clearTimeout(timerRef.current);
    setAgentStages(AGENTS.map(a => ({ ...a, status: "done", progress: 100 })));
  };

  const handleScan = async () => {
    if (!repoUrl.trim()) return;
    setError(null); setResults(null); setScanning(true); setLoading(true);
    setAgentStages(AGENTS.map(a => ({ ...a, status: "pending", progress: 0 })));
    setExpanded({});
    startAnimation();
    try {
      const resp = await fetch(`${API_URL}/api/scan-github`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: repoUrl.trim(), token: token.trim(), selected_frameworks: selectedFrameworks }),
      });
      finishAll();
      const data = await readApiJson(resp);
      if (!resp.ok) {
        const detail = typeof data.detail === "string" ? data.detail : "Scan failed";
        if (/rate limit/i.test(detail) && !token.trim()) {
          throw new Error(
            "GitHub API rate limit hit (60 requests/hour without a token). " +
            "Paste a personal access token above and try again — create one at github.com/settings/tokens (no scopes needed for public repos)."
          );
        }
        throw new Error(detail);
      }
      setResults(data);
    } catch (e) {
      setError(e.message);
      setAgentStages(AGENTS.map(a => ({ ...a, status: "pending", progress: 0 })));
    } finally { setScanning(false); setLoading(false); }
  };

  const byFile = results
    ? (results.raw_findings || []).reduce((acc, f) => { const k = f.file || "unknown"; if (!acc[k]) acc[k] = []; acc[k].push(f); return acc; }, {})
    : {};

  return (
    <div className="sw">
      <div className="sw-card">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
          <div className="sw-agent-icon" aria-hidden="true"><Github size={16} /></div>
          <div>
            <h3 className="sw-title">GitHub Repository Scanner</h3>
            <p className="sw-desc">Analyze a public or authorized repository against selected compliance controls.</p>
          </div>
        </div>

        <label className="sw-label" htmlFor="gh-repo-url">Repository URL</label>
        <input
          id="gh-repo-url"
          className="sw-input"
          style={{ marginBottom: 12 }}
          placeholder="https://github.com/owner/repository"
          value={repoUrl}
          onChange={e => setRepoUrl(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleScan()}
        />

        <label className="sw-label" htmlFor="gh-token">Access Token (optional)</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            id="gh-token"
            className="sw-input sw-input--mono"
            style={{ flex: 1 }}
            type={showToken ? "text" : "password"}
            placeholder="GitHub token — optional for public repos"
            value={token}
            onChange={e => saveToken(e.target.value)}
            autoComplete="off"
          />
          <button type="button" className="sw-btn sw-btn--ghost" onClick={() => setShowToken(s => !s)}>
            {showToken ? "Hide" : "Show"}
          </button>
        </div>
        <p style={{ fontSize: 12, color: "hsl(var(--col-muted))", marginBottom: 16, lineHeight: 1.45 }}>
          Public repositories can be scanned without a token. A token may help with API limits or private repos.
          Auto-Fix pull requests need a{" "}
          <a className="sw-link" href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer">
            personal access token
          </a>{" "}
          with the <code style={{ fontSize: 11 }}>repo</code> scope.
        </p>

        <button
          type="button"
          className="sw-btn sw-btn--primary"
          onClick={handleScan}
          disabled={!repoUrl.trim() || scanning}
        >
          {scanning
            ? <><Loader size={15} className="sw-spin" /> Analyzing repository...</>
            : <><Github size={15} /> Launch Agents</>}
        </button>
      </div>

      {(scanning || results) && (
        <div className="sw-card">
          <p className="sw-kicker" style={{ marginBottom: 12 }}>Analysis pipeline</p>
          {scanning && repoUrl && (
            <p style={{ fontSize: 13, color: "hsl(var(--col-sub))", margin: "0 0 12px" }}>
              Analyzing repository · <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12 }}>{repoUrl.replace(/^https?:\/\/github\.com\//, "")}</span>
            </p>
          )}
          <div className="sw-pipeline-list">
            {agentStages.map(agent => {
              const Icon = agent.icon;
              const done = agent.status === "done";
              const running = agent.status === "running";
              const stateClass = done ? "sw-agent--done" : running ? "sw-agent--running" : "sw-agent--pending";
              return (
                <div key={agent.id} className={`sw-agent ${stateClass}`}>
                  <div className={`sw-agent-icon ${done ? "sw-agent-icon--done" : ""}`} aria-hidden="true">
                    {done ? <Check size={14} strokeWidth={2.5} /> : <Icon size={14} />}
                  </div>
                  <div>
                    <div className="sw-agent-top">
                      <span className="sw-agent-name">{agent.name}</span>
                      <span className={`sw-agent-status ${done ? "sw-agent-status--done" : running ? "sw-agent-status--running" : ""}`}>
                        {done ? "Completed" : running ? "Running" : "Pending"}
                      </span>
                    </div>
                    {!done && <p className="sw-agent-desc">{agent.desc}</p>}
                    {running && (
                      <div className="sw-progress" role="progressbar" aria-label={`${agent.name} running`} aria-valuetext="In progress">
                        <div className="sw-progress-bar" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && <div className="sw-error" role="alert">{error}</div>}

      {results && (
        <div className="sw-results">
          <div className="sw-stack">
            <div className="sw-card">
              <p className="sw-kicker">Scan summary</p>
              <h3 className="sw-title" style={{ marginTop: 6 }}>{results.repo}</h3>
              <p className="sw-meta">
                {results.files_scanned} files scanned · {results.raw_findings?.length || 0} findings
              </p>
              <a
                className="sw-btn sw-btn--ghost"
                href={`https://github.com/${results.repo}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ width: "auto", display: "inline-flex", marginBottom: 14, textDecoration: "none" }}
              >
                <ExternalLink size={12} /> View on GitHub
              </a>

              <div className="sw-chip-row">
                {Object.entries(results.severity_counts || {})
                  .filter(([, count]) => count > 0)
                  .map(([sev, count]) => (
                    <span key={sev} className={`sw-chip ${SEV_CLASS[sev] || ""}`}>
                      {count} {sev}
                    </span>
                  ))}
              </div>

              {results.triage_counts && (
                <div className="sw-triage">
                  {[
                    { key: "IMMEDIATE_ACTION", label: "Immediate" },
                    { key: "HIGH_PRIORITY", label: "High" },
                    { key: "REVIEW_REQUIRED", label: "Review" },
                    { key: "MONITOR", label: "Monitor" },
                  ].map(t => (
                    <div key={t.key} className="sw-triage-cell">
                      <strong>{results.triage_counts[t.key] || 0}</strong>
                      <span>{t.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {results.policy_status && (
                <div style={{ paddingTop: 12, borderTop: "1px solid hsl(var(--col-border))" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
                    <span className="sw-kicker" style={{ margin: 0 }}>Documentation coverage</span>
                    <span style={{ color: "hsl(var(--col-text))", fontWeight: 650 }}>{results.policy_status.score}%</span>
                  </div>
                  <div className="sw-progress" style={{ marginBottom: 10 }}>
                    <div style={{ height: "100%", width: `${Math.min(100, results.policy_status.score || 0)}%`, background: "hsl(var(--col-primary))", borderRadius: 99 }} />
                  </div>
                  <div className="sw-chip-row" style={{ marginBottom: 0 }}>
                    {results.policy_status.present?.map(d => (
                      <span key={d.path} className="sw-chip">✓ {d.name}</span>
                    ))}
                    {results.policy_status.missing?.slice(0, 3).map(d => (
                      <span key={d.path} className="sw-chip" style={{ opacity: 0.7 }}>✕ {d.name}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {results.audit_questions_by_control && Object.keys(results.audit_questions_by_control).length > 0 && (
              <div className="sw-card" ref={questionsWrapRef}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <p className="sw-kicker" style={{ marginBottom: 4 }}>Auditor readiness</p>
                    <h3 className="sw-title" style={{ fontSize: "1rem" }}>Questions to prepare for</h3>
                  </div>
                  <span className="sw-chip">{results.total_audit_questions} questions</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: showAllQuestions ? "none" : 280, overflow: "auto" }}>
                  {Object.entries(results.audit_questions_by_control)
                    .slice(0, showAllQuestions ? undefined : 2)
                    .map(([ctrl, qs]) => (
                    <div key={ctrl}>
                      <span className="sw-q-ctrl">{ctrl}</span>
                      <div>
                        {(qs || []).slice(0, showAllQuestions ? undefined : 2).map((q, i) => (
                          <div key={i} className="sw-q">
                            <span>Q{i + 1}.</span> {q}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {Object.keys(results.audit_questions_by_control).length > 2 && (
                  <button
                    type="button"
                    className="sw-btn sw-btn--ghost"
                    style={{ width: "100%", marginTop: 12 }}
                    onClick={() => setShowAllQuestions(s => !s)}
                  >
                    {showAllQuestions ? "Show Less" : `Show All ${results.total_audit_questions} Questions`}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="sw-stack">
            {results.framework_metrics && (
              <div className="sw-card">
                <p className="sw-kicker" style={{ marginBottom: 12 }}>Cross-framework impact</p>
                <div className="sw-fw-grid">
                  {[
                    { key: "soc2", label: "SOC 2" },
                    { key: "iso27001", label: "ISO 27001" },
                    { key: "hipaa", label: "HIPAA" },
                    { key: "dpdp", label: "DPDP Act" },
                  ].map(fw => (
                    <div key={fw.key} className="sw-fw-card">
                      <strong>{results.framework_metrics[fw.key] || 0}</strong>
                      <div>
                        <span>{fw.label}</span>
                        <small>mapped findings</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="sw-kicker" style={{ marginBottom: 10 }}>Violations by file</p>
              {Object.keys(byFile).length === 0 ? (
                <div className="sw-card sw-empty">
                  <Check size={28} color="hsl(152 50% 45%)" style={{ margin: "0 auto" }} />
                  <p style={{ fontWeight: 650, color: "hsl(var(--col-text))", marginTop: 8 }}>No findings detected</p>
                  <p>No findings detected for the selected assessment.</p>
                </div>
              ) : (
                Object.entries(byFile).map(([file, ffindings]) => {
                  const isOpen = expanded[file];
                  const worst = ffindings.reduce((w, f) => {
                    const o = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
                    return (o[f.severity] || 0) > (o[w] || 0) ? f.severity : w;
                  }, "LOW");
                  const hasCVE = ffindings.some(f => f.source === "osv");

                  return (
                    <div key={file} className="sw-file">
                      <button
                        type="button"
                        className="sw-file-btn"
                        aria-expanded={!!isOpen}
                        onClick={() => setExpanded(p => ({ ...p, [file]: !isOpen }))}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                          {hasCVE ? <Package size={13} color="hsl(var(--col-muted))" /> : <Code size={13} color="hsl(var(--col-muted))" />}
                          <span className="sw-file-path">{file}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          <span className={`sw-chip ${SEV_CLASS[worst] || ""}`}>
                            {ffindings.length} {ffindings.length === 1 ? "finding" : "findings"}
                          </span>
                          {isOpen ? <ChevronDown size={14} color="hsl(var(--col-muted))" /> : <ChevronRight size={14} color="hsl(var(--col-muted))" />}
                        </div>
                      </button>

                      {isOpen && ffindings.map((finding, idx) => {
                        const vc = VERDICT[finding.audit_verdict] || VERDICT.CONFIRMED;
                        const fKey = `${file}:${idx}`;
                        const fr = fixResults[fKey];
                        const isFixing = fixingKey === fKey;
                        return (
                          <div key={`${file}-${idx}-${finding.pattern_id || finding.name || idx}`} className="sw-finding">
                            <div className="sw-finding-head">
                              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flexWrap: "wrap" }}>
                                <SevBadge sev={finding.severity} />
                                <span className="sw-finding-name">{finding.name}</span>
                              </div>
                              <span className={`sw-verdict sw-chip ${vc.className}`}>{vc.label}</span>
                            </div>

                            {finding.line > 0 && (
                              <div className="sw-code">Line {finding.line}: {finding.line_content}</div>
                            )}

                            <p className="sw-finding-msg">{finding.message}</p>

                            {finding.auditor_challenge && (
                              <p className="sw-finding-auditor">Auditor: &quot;{finding.auditor_challenge}&quot;</p>
                            )}

                            {finding.fix && (
                              <p className="sw-finding-fix">Recommended: {finding.fix}</p>
                            )}

                            {fr?.pr_url ? (
                              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
                                <a className="sw-btn sw-btn--success" href={fr.pr_url} target="_blank" rel="noopener noreferrer">
                                  <GitPullRequest size={12} /> Review PR #{fr.pr_number} on GitHub
                                </a>
                                <span style={{ fontSize: 11.5, color: "hsl(var(--col-muted))" }}>
                                  Branch <code style={{ fontSize: 11 }}>{fr.branch}</code> — approve &amp; merge manually
                                </span>
                              </div>
                            ) : (
                              <div style={{ marginTop: 8 }}>
                                <button
                                  type="button"
                                  className="sw-btn sw-btn--outline"
                                  onClick={() => handleAutoFix(file, finding, idx)}
                                  disabled={isFixing || !!fixingKey}
                                >
                                  {isFixing
                                    ? <><Loader size={11} className="sw-spin" /> Creating PR...</>
                                    : <><Wrench size={11} /> Auto-Fix</>}
                                </button>
                                {fr?.error && (
                                  <p style={{ marginTop: 6, fontSize: 12, color: "hsl(0 70% 65%)", maxWidth: 420 }}>{fr.error}</p>
                                )}
                              </div>
                            )}

                            <div className="sw-controls">
                              {finding.controls?.map(c => (
                                <span key={c} className="sw-control">{c}</span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {tokenModal && createPortal(
        <div className="sw-modal-backdrop" onClick={() => setTokenModal(null)} role="presentation">
          <div
            className="sw-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sw-token-title"
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <GitPullRequest size={18} color="hsl(var(--col-primary))" />
              <h3 id="sw-token-title">GitHub token required</h3>
            </div>
            <p>
              Auto-Fix creates a pull request on <strong>{repoUrl.replace("https://github.com/", "") || "your repo"}</strong>.
              Paste a Personal Access Token with <code style={{ fontSize: 12 }}>repo</code> scope — you review and merge on GitHub.
            </p>
            <a
              className="sw-link"
              href="https://github.com/settings/tokens/new?scopes=repo&description=Pramanik%20Auto-Fix"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, marginBottom: 12 }}
            >
              <ExternalLink size={12} /> Create a token on GitHub
            </a>
            <label className="sw-label" htmlFor="sw-modal-token">Personal access token</label>
            <input
              id="sw-modal-token"
              autoFocus
              type="password"
              className="sw-input sw-input--mono"
              placeholder="ghp_... or github_pat_..."
              value={modalToken}
              onChange={e => setModalToken(e.target.value)}
              onKeyDown={e => e.key === "Enter" && confirmTokenAndFix()}
              autoComplete="off"
            />
            <div className="sw-modal-actions">
              <button type="button" className="sw-btn sw-btn--ghost" onClick={() => setTokenModal(null)}>Cancel</button>
              <button
                type="button"
                className="sw-btn sw-btn--primary"
                style={{ width: "auto", padding: "0.6rem 1rem" }}
                onClick={confirmTokenAndFix}
                disabled={!modalToken.trim()}
              >
                Create pull request
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
