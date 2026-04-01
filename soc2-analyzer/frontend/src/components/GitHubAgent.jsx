import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Github, Code, Shield, AlertTriangle, FileText, Zap, Check, ChevronDown, ChevronRight, Eye, ExternalLink, Package, Wrench, Loader, GitPullRequest } from "lucide-react";
import { API_URL } from "../config";

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
  { id: "code", name: "Code Agent", desc: "Scanning source files", icon: Code, color: "#4F46E5" },
  { id: "policy", name: "Policy Agent", desc: "Checking documentation", icon: FileText, color: "#059669" },
  { id: "adversary", name: "Adversary Agent", desc: "Challenging findings", icon: Eye, color: "#D97706" },
  { id: "ces", name: "CES Engine", desc: "Scoring by compliance impact", icon: Zap, color: "#7C3AED" },
  { id: "reporter", name: "Reporter", desc: "Compiling report", icon: Shield, color: "#DB2777" },
];

const SEV = {
  CRITICAL: { bg: "#FEF2F2", color: "#DC2626", dot: "#DC2626" },
  HIGH: { bg: "#FFFBEB", color: "#D97706", dot: "#D97706" },
  MEDIUM: { bg: "#FEFCE8", color: "#CA8A04", dot: "#CA8A04" },
  LOW: { bg: "#F0FDF4", color: "#16A34A", dot: "#16A34A" },
};

const VERDICT = {
  CONFIRMED: { label: "Confirmed", color: "#DC2626", bg: "#FEF2F2" },
  INSUFFICIENT_FIX: { label: "Fix Insufficient", color: "#D97706", bg: "#FFFBEB" },
  ESCALATE: { label: "Escalate", color: "#7C2D12", bg: "#FFF7ED" },
  FALSE_POSITIVE: { label: "False Positive", color: "#6B7280", bg: "#F9FAFB" },
};

const card = {
  background: "#FFFFFF",
  borderRadius: 16,
  padding: 24,
  boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)",
  marginBottom: 16,
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  border: "1px solid transparent",
};

function SevBadge({ sev }) {
  const c = SEV[sev] || SEV.LOW;
  return (
    <span style={{ padding: "3px 10px", borderRadius: 100, fontSize: 12.5, fontWeight: 700, background: c.bg, color: c.color }}>
      {sev}
    </span>
  );
}

export default function GitHubAgent({ onResults, selectedFrameworks, loading, setLoading }) {
  const [repoUrl, setRepoUrl] = useState("");
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [fixingKey, setFixingKey] = useState(null);
  const [fixResults, setFixResults] = useState({});
  const [agentStages, setAgentStages] = useState(AGENTS.map(a => ({ ...a, status: "pending", progress: 0 })));
  const timerRef = useRef(null);

  const questionsWrapRef = useRef(null);

  useEffect(() => {
    // Height sync removed as requested
  }, []);

  const handleAutoFix = async (file, finding, idx) => {
    const key = `${file}:${idx}`;
    if (!token.trim()) {
      setFixResults(p => ({ ...p, [key]: { error: "GitHub token with repo scope required for auto-fix" } }));
      return;
    }
    setFixingKey(key);
    setFixResults(p => ({ ...p, [key]: {} }));
    try {
      const resp = await fetch(`${API_URL}/api/auto-fix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: repoUrl.trim(), token: token.trim(), file_path: file, finding }),
      });
      const data = await readApiJson(resp);
      if (!resp.ok) throw new Error(data.detail || "Auto-fix failed");
      setFixResults(p => ({ ...p, [key]: { pr_url: data.pr_url, pr_number: data.pr_number } }));
    } catch (e) {
      setFixResults(p => ({ ...p, [key]: { error: e.message } }));
    } finally {
      setFixingKey(null);
    }
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
      if (!resp.ok) throw new Error(data.detail || "Scan failed");
      setResults(data);
    } catch (e) {
      setError(e.message);
      setAgentStages(AGENTS.map(a => ({ ...a, status: "pending", progress: 0 })));
    } finally { setScanning(false); setLoading(false); }
  };

  const byFile = results
    ? (results.raw_findings || []).reduce((acc, f) => { const k = f.file || "unknown"; if (!acc[k]) acc[k] = []; acc[k].push(f); return acc; }, {})
    : {};

  const inp = {
    width: "100%", padding: "11px 14px", borderRadius: 10,
    border: "1.5px solid #E5E7EB", fontSize: 14, color: "#111827",
    background: "#FAFAF8", outline: "none", fontFamily: "inherit",
  };

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; }`}</style>

      {/* Input card */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
          <Github size={18} color="#4F46E5" />
          <span style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>GitHub Repository Scanner</span>
        </div>

        <input
          style={{ ...inp, marginBottom: 10 }}
          placeholder="https://github.com/owner/repository"
          value={repoUrl}
          onChange={e => setRepoUrl(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleScan()}
        />

        <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
          <input
            style={{ ...inp, flex: 1, fontFamily: "monospace", fontSize: 13 }}
            type={showToken ? "text" : "password"}
            placeholder="GitHub Token (optional — for private repos)"
            value={token}
            onChange={e => setToken(e.target.value)}
          />
          <button
            onClick={() => setShowToken(s => !s)}
            style={{ padding: "11px 14px", borderRadius: 10, border: "1.5px solid #E5E7EB", background: "#FAFAF8", color: "#6B7280", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            {showToken ? "Hide" : "Show"}
          </button>
        </div>
        <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 18 }}>Public repos work without a token.</p>

        <button
          onClick={handleScan}
          disabled={!repoUrl.trim() || scanning}
          style={{
            width: "100%", padding: "13px", borderRadius: 12,
            background: repoUrl.trim() && !scanning ? "#4F46E5" : "#E5E7EB",
            color: repoUrl.trim() && !scanning ? "#FFF" : "#9CA3AF",
            fontSize: 14, fontWeight: 600, border: "none",
            cursor: repoUrl.trim() && !scanning ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {scanning
            ? <><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Agents runningΓÇª</>
            : <><Github size={16} /> Launch Agents</>
          }
        </button>
      </div>

      {/* Agent pipeline */}
      {(scanning || results) && (
        <div style={{ ...card, padding: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 14 }}>Agent Pipeline</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {agentStages.map(agent => {
              const Icon = agent.icon;
              const done = agent.status === "done";
              const running = agent.status === "running";
              return (
                <div key={agent.id} style={{ display: "flex", alignItems: "center", gap: 12, opacity: agent.status === "pending" ? 0.35 : 1, transition: "opacity 0.3s" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: agent.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {done
                      ? <Check size={14} color={agent.color} strokeWidth={2.5} />
                      : <Icon size={14} color={agent.color} />
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: running ? 4 : 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{agent.name}</span>
                      <span style={{ fontSize: 11, color: done ? "#059669" : agent.color }}>
                        {done ? "Done" : running ? `${Math.round(agent.progress)}%` : ""}
                      </span>
                    </div>
                    {!done && <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>{agent.desc}</p>}
                    {running && (
                      <div style={{ height: 3, borderRadius: 99, background: "#F3F4F6", overflow: "hidden", marginTop: 6 }}>
                        <div style={{ height: "100%", width: `${agent.progress}%`, background: agent.color, borderRadius: 99, transition: "width 0.2s" }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div style={{ padding: "14px 18px", borderRadius: 12, background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Results */}
      {results && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "24px", alignItems: "start" }}>
          {/* LEFT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Summary card */}
            <div 
              style={card}
              onMouseOver={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.08)"; e.currentTarget.style.borderColor = "#EEF2FF"; }}
              onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = card.boxShadow; e.currentTarget.style.borderColor = "transparent"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>{results.repo}</h3>
                  <p style={{ fontSize: 12, color: "#6B7280", marginTop: 3 }}>
                    {results.files_scanned} files · {results.raw_findings?.length || 0} violations
                  </p>
                </div>
                <a
                  href={`https://github.com/${results.repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#6B7280", textDecoration: "none", padding: "6px 12px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#FAFAF8" }}
                >
                  <ExternalLink size={12} /> View repo
                </a>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {Object.entries(results.severity_counts || {})
                  .filter(([, count]) => count > 0)
                  .map(([sev, count]) => (
                    <span key={sev} style={{ padding: "4px 12px", borderRadius: 100, fontSize: 12, fontWeight: 600, background: (SEV[sev] || SEV.LOW).bg, color: (SEV[sev] || SEV.LOW).color }}>
                      {count} {sev}
                    </span>
                  ))
                }
              </div>

              {results.triage_counts && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
                  {[
                    { key: "IMMEDIATE_ACTION", label: "Immediate", color: "#DC2626", bg: "#FEF2F2" },
                    { key: "HIGH_PRIORITY", label: "High", color: "#D97706", bg: "#FFFBEB" },
                    { key: "REVIEW_REQUIRED", label: "Review", color: "#CA8A04", bg: "#FEFCE8" },
                    { key: "MONITOR", label: "Monitor", color: "#6B7280", bg: "#F9FAFB" },
                  ].map(t => (
                    <div key={t.key} style={{ textAlign: "center", padding: "12px 8px", borderRadius: 10, background: t.bg }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: t.color }}>{results.triage_counts[t.key] || 0}</div>
                      <div style={{ fontSize: 10, color: t.color, fontWeight: 600, marginTop: 2 }}>{t.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {results.policy_status && (
                <div style={{ paddingTop: 14, borderTop: "1px solid #F3F4F6" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
                    <span style={{ color: "#6B7280", fontWeight: 500 }}>Security Docs</span>
                    <span style={{ color: results.policy_status.score >= 60 ? "#059669" : "#DC2626", fontWeight: 600 }}>{results.policy_status.score}%</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {results.policy_status.present?.map(d => (
                      <span key={d.path} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "#F0FDF4", color: "#16A34A" }}>✓ {d.name}</span>
                    ))}
                    {results.policy_status.missing?.slice(0, 3).map(d => (
                      <span key={d.path} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "#FEF2F2", color: "#DC2626" }}>✕ {d.name}</span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => onResults(results, {})}
                style={{ width: "100%", marginTop: 16, padding: 13, borderRadius: 12, background: "#4F46E5", color: "#FFF", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <Zap size={15} /> Open Full Dashboard
              </button>
            </div>

            {/* Audit questions */}
            {results.audit_questions_by_control && Object.keys(results.audit_questions_by_control).length > 0 && (
              <div 
                style={card}
                onMouseOver={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.08)"; e.currentTarget.style.borderColor = "#EEF2FF"; }}
                onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = card.boxShadow; e.currentTarget.style.borderColor = "transparent"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.05em", textTransform: "uppercase", margin: 0 }}>What Your Auditor Will Ask</p>
                  <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 100, background: "#F0FDF4", color: "#059669", fontWeight: 600 }}>
                    {results.total_audit_questions} questions
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {Object.entries(results.audit_questions_by_control).map(([ctrl, qs]) => (
                    <div key={ctrl}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#4F46E5", background: "#EEF2FF", padding: "2px 8px", borderRadius: 5 }}>{ctrl}</span>
                      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
                        {(qs || []).map((q, i) => (
                          <div key={i} style={{ fontSize: 12, color: "#374151", display: "flex", gap: 8 }}>
                            <span style={{ color: "#9CA3AF", flexShrink: 0 }}>Q{i + 1}.</span> {q}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Framework impact */}
            {results.framework_metrics && (
              <div 
                style={card}
                onMouseOver={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.08)"; e.currentTarget.style.borderColor = "#EEF2FF"; }}
                onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = card.boxShadow; e.currentTarget.style.borderColor = "transparent"; }}
              >
                <p style={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 14 }}>Cross-Framework Impact</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                  {[
                    { key: "soc2", label: "SOC 2", color: "#4F46E5" },
                    { key: "iso27001", label: "ISO 27001", color: "#059669" },
                    { key: "hipaa", label: "HIPAA", color: "#D97706" },
                    { key: "dpdp", label: "DPDP 2023", color: "#DB2777" },
                  ].map(fw => (
                    <div key={fw.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, background: fw.color + "08", border: `1.5px solid ${fw.color}25` }}>
                      <span style={{ fontSize: 24, fontWeight: 700, color: fw.color }}>{results.framework_metrics[fw.key] || 0}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{fw.label}</div>
                        <div style={{ fontSize: 11, color: "#9CA3AF" }}>violations</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Findings by file */}
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 12 }}>Violations by File</p>
              {Object.keys(byFile).length === 0 ? (
                <div style={{ ...card, textAlign: "center", padding: 36 }}>
                  <Check size={32} color="#059669" style={{ margin: "0 auto 10px" }} />
                  <p style={{ fontWeight: 600, fontSize: 15.5, color: "#111827" }}>No violations found</p>
                  <p style={{ fontSize: 14.5, color: "#9CA3AF", marginTop: 4 }}>All patterns passed</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {Object.entries(byFile).map(([file, ffindings]) => {
                    const isOpen = expanded[file];
                    const worst = ffindings.reduce((w, f) => {
                      const o = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
                      return (o[f.severity] || 0) > (o[w] || 0) ? f.severity : w;
                    }, "LOW");
                    const hasCVE = ffindings.some(f => f.source === "osv");

                    return (
                      <div key={file} style={{ borderRadius: 14, overflow: "hidden", border: "1.5px solid #F3F4F6", background: "#FFFFFF", transition: "all 0.2s" }}>
                        <button
                          style={{ width: "100%", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                          onClick={() => setExpanded(p => ({ ...p, [file]: !isOpen }))}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                            {hasCVE ? <Package size={13} color="#9CA3AF" style={{ flexShrink: 0 }} /> : <Code size={13} color="#9CA3AF" style={{ flexShrink: 0 }} />}
                            <span style={{ fontSize: 13.5, fontFamily: "monospace", color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 8 }}>
                            <span style={{ fontSize: 12.5, fontWeight: 600, padding: "3px 8px", borderRadius: 100, background: (SEV[worst] || SEV.LOW).bg, color: (SEV[worst] || SEV.LOW).color }}>
                              {ffindings.length} {ffindings.length === 1 ? "issue" : "issues"}
                            </span>
                            {isOpen ? <ChevronDown size={14} color="#9CA3AF" /> : <ChevronRight size={14} color="#9CA3AF" />}
                          </div>
                        </button>

                        {isOpen && (
                          <div style={{ borderTop: "1px solid #F3F4F6" }}>
                            {ffindings.map((finding, idx) => {
                              const vc = VERDICT[finding.audit_verdict] || VERDICT.CONFIRMED;
                              return (
                                <div key={idx} style={{ padding: "16px 18px", borderBottom: idx < ffindings.length - 1 ? "1px solid #F9FAFB" : "none", background: "#FAFAF8" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                                      <SevBadge sev={finding.severity} />
                                      <span style={{ fontSize: 14.5, fontWeight: 600, color: "#111827" }}>{finding.name}</span>
                                    </div>
                                    <span style={{ fontSize: 12.5, padding: "3px 8px", borderRadius: 100, background: vc.bg, color: vc.color, whiteSpace: "nowrap", fontWeight: 500 }}>
                                      {vc.label}
                                    </span>
                                  </div>

                                  {finding.line > 0 && (
                                    <div style={{ fontFamily: "monospace", fontSize: 12.5, padding: "6px 10px", borderRadius: 7, background: "#F3F4F6", color: "#374151", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      Line {finding.line}: {finding.line_content}
                                    </div>
                                  )}

                                  <p style={{ fontSize: 13.5, color: "#6B7280", marginBottom: 6 }}>{finding.message}</p>

                                  {finding.auditor_challenge && (
                                    <p style={{ fontSize: 13.5, color: "#D97706", fontStyle: "italic", marginBottom: 6 }}>
                                      Auditor: "{finding.auditor_challenge}"
                                    </p>
                                  )}

                                  {finding.fix && (
                                    <p style={{ fontSize: 12.5, color: "#059669", background: "#F0FDF4", padding: "6px 10px", borderRadius: 7 }}>
                                      Fix: {finding.fix}
                                    </p>
                                  )}

                                  {/* Auto-Fix PR Button */}
                                  {(() => {
                                    const fKey = `${file}:${idx}`;
                                    const fr = fixResults[fKey];
                                    const isFixing = fixingKey === fKey;
                                    if (fr?.pr_url) {
                                      return (
                                        <a
                                          href={fr.pr_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, padding: "6px 14px", borderRadius: 8, background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#059669", fontSize: 12.5, fontWeight: 600, textDecoration: "none" }}
                                        >
                                          <GitPullRequest size={12} /> PR #{fr.pr_number} opened
                                        </a>
                                      );
                                    }
                                    return (
                                      <div style={{ marginTop: 8 }}>
                                        <button
                                          onClick={() => handleAutoFix(file, finding, idx)}
                                          disabled={isFixing || !!fixingKey}
                                          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, background: isFixing ? "#F3F4F6" : "#059669", color: isFixing ? "#6B7280" : "#FFFFFF", fontSize: 12.5, fontWeight: 600, border: "none", cursor: isFixing || fixingKey ? "not-allowed" : "pointer", opacity: fixingKey && !isFixing ? 0.5 : 1 }}
                                        >
                                          {isFixing ? <Loader size={11} style={{ animation: "spin 1s linear infinite" }} /> : <><Wrench size={11} /> Auto-Fix</>}
                                        </button>
                                      </div>
                                    );
                                  })()}
                                  <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
                                    {finding.controls?.map(c => (
                                      <span key={c} style={{ fontSize: 11.5, padding: "2px 7px", borderRadius: 5, background: "#EEF2FF", color: "#4F46E5", fontWeight: 600 }}>{c}</span>
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
        </div>
      )}
    </div>
  );
}
