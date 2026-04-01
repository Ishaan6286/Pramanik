import { useState } from "react";
import { Shield, Upload, FileCheck, LogOut, Check, Cloud, Key, Github, Zap } from "lucide-react";
import GitHubAgent from "./GitHubAgent";

const FRAMEWORKS = [
  { key: "soc2",     label: "SOC 2",        sub: "AICPA · 33 controls",  color: "#4F46E5" },
  { key: "iso27001", label: "ISO 27001",     sub: "ISMS · 31 controls",   color: "#059669" },
  { key: "hipaa",    label: "HIPAA",         sub: "Health · 28 controls", color: "#D97706" },
  { key: "dpdp",     label: "DPDP 2023",    sub: "India · 15 controls",  color: "#DB2777" },
];

const AWS_REGIONS = [
  { value: "ap-south-1",  label: "Mumbai" },
  { value: "ap-south-2",  label: "Hyderabad" },
  { value: "us-east-1",   label: "N. Virginia" },
  { value: "us-west-2",   label: "Oregon" },
  { value: "eu-west-1",   label: "Ireland" },
  { value: "eu-north-1",  label: "Stockholm" },
];

const s = {
  page:    { minHeight: "100vh", background: "#F8F7F4", display: "flex", flexDirection: "column", fontFamily: "'Inter', system-ui, sans-serif" },
  nav:     { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 32px", background: "#FFFFFF", borderBottom: "1px solid #EFEFED" },
  logo:    { display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 16, color: "#111827" },
  navR:    { display: "flex", alignItems: "center", gap: 12 },
  userTxt: { fontSize: 13, color: "#6B7280" },
  logoutBtn: { padding: "6px 12px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#FFF", cursor: "pointer", fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 },
  main:    { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 16px 80px" },
  heading: { fontSize: 28, fontWeight: 700, color: "#111827", marginBottom: 6, textAlign: "center" },
  sub:     { fontSize: 15, color: "#6B7280", textAlign: "center", marginBottom: 36 },
  // Framework chips
  fwRow:   { display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 32 },
  // Tabs
  tabs:    { display: "flex", gap: 4, background: "#EFEFED", padding: 4, borderRadius: 12, marginBottom: 28 },
  // Card
  card:    { width: "100%", maxWidth: 520, background: "#FFFFFF", borderRadius: 20, padding: 28, boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 8px 24px rgba(0,0,0,0.05)" },
  label:   { fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 6, display: "block", letterSpacing: "0.04em", textTransform: "uppercase" },
  input:   { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 14, color: "#111827", background: "#FAFAF8", outline: "none", boxSizing: "border-box" },
  select:  { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 14, color: "#111827", background: "#FAFAF8", outline: "none", boxSizing: "border-box", cursor: "pointer" },
  hint:    { fontSize: 12, color: "#9CA3AF", marginTop: 6 },
  err:     { marginTop: 16, padding: "12px 16px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: 13 },
};

function FrameworkChip({ fw, selected, onToggle }) {
  return (
    <button
      onClick={() => onToggle(fw.key)}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 16px", borderRadius: 100,
        border: `1.5px solid ${selected ? fw.color : "#E5E7EB"}`,
        background: selected ? fw.color + "12" : "#FFFFFF",
        cursor: "pointer", transition: "all 0.15s",
      }}
    >
      {selected && (
        <span style={{ width: 14, height: 14, borderRadius: "50%", background: fw.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Check size={9} color="#fff" strokeWidth={3} />
        </span>
      )}
      <span style={{ fontSize: 13, fontWeight: 600, color: selected ? fw.color : "#374151" }}>{fw.label}</span>
      <span style={{ fontSize: 11, color: "#9CA3AF" }}>{fw.sub}</span>
    </button>
  );
}

function Tab({ label, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 18px", borderRadius: 9,
        background: active ? "#FFFFFF" : "transparent",
        border: "none", cursor: "pointer",
        fontSize: 13, fontWeight: 600,
        color: active ? "#111827" : "#6B7280",
        boxShadow: active ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
        transition: "all 0.15s",
      }}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

function PrimaryBtn({ onClick, disabled, loading, children, color = "#4F46E5" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%", padding: "13px 20px", borderRadius: 12,
        background: disabled ? "#E5E7EB" : color,
        color: disabled ? "#9CA3AF" : "#FFFFFF",
        fontSize: 14, fontWeight: 600, border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        marginTop: 24, transition: "opacity 0.15s",
      }}
    >
      {loading
        ? <><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />Analyzing…</>
        : children
      }
    </button>
  );
}

export default function UploadPage({ onAnalysis, loading, setLoading, user, onLogout }) {
  const [dragOver, setDragOver]         = useState(false);
  const [file, setFile]                 = useState(null);
  const [error, setError]               = useState(null);
  const [selectedFrameworks, setSelFw]  = useState(["soc2", "iso27001", "dpdp"]);
  const [mode, setMode]                 = useState("upload");
  const [awsCreds, setAwsCreds]         = useState({ access_key: "", secret_key: "", region: "ap-south-1", company_name: "" });

  const toggleFw = (key) => setSelFw(prev => prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]);

  const handleFile = (f) => {
    if (f?.name.endsWith(".json")) { setFile(f); setError(null); }
    else setError("Please upload a .json file");
  };

  const filterFrameworks = (data) => {
    if (data.framework_scores) {
      const filtered = {};
      selectedFrameworks.forEach(k => { if (data.framework_scores[k]) filtered[k] = data.framework_scores[k]; });
      data.framework_scores = filtered;
      data.selected_frameworks = selectedFrameworks;
    }
    return data;
  };

  const handleAnalyze = async () => {
    if (!file || selectedFrameworks.length === 0) return;
    setLoading(true); setError(null);
    try {
      const configText = await file.text();
      const configJson = JSON.parse(configText);
      const formData = new FormData();
      formData.append("config", file);
      const resp = await fetch("http://localhost:3001/api/analyze", { method: "POST", body: formData });
      if (!resp.ok) throw new Error("Analysis failed");
      onAnalysis(filterFrameworks(await resp.json()), configJson);
    } catch (e) { setError("Failed: " + e.message); }
    finally { setLoading(false); }
  };

  const handleAWSScan = async () => {
    if (!awsCreds.access_key || !awsCreds.secret_key) { setError("Enter both Access Key and Secret Key"); return; }
    setLoading(true); setError(null);
    try {
      const resp = await fetch("http://localhost:3001/api/scan-aws", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...awsCreds, industry: "saas_startup" }),
      });
      if (!resp.ok) { const e = await resp.json(); throw new Error(e.detail || "Scan failed"); }
      onAnalysis(filterFrameworks(await resp.json()), {});
    } catch (e) { setError("AWS scan failed: " + e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; }`}</style>

      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.logo}>
          <Shield size={20} color="#4F46E5" />
          ComplianceAI
        </div>
        <div style={s.navR}>
          <span style={s.userTxt}>{user}</span>
          <button style={s.logoutBtn} onClick={onLogout}>
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </nav>

      {/* Main */}
      <main style={s.main}>
        <h1 style={s.heading}>Compliance Analysis</h1>
        <p style={s.sub}>Select frameworks, then scan your code, AWS account, or GitHub repo</p>

        {/* Framework chips */}
        <div style={s.fwRow}>
          {FRAMEWORKS.map(fw => (
            <FrameworkChip key={fw.key} fw={fw} selected={selectedFrameworks.includes(fw.key)} onToggle={toggleFw} />
          ))}
        </div>

        {/* Mode tabs */}
        <div style={s.tabs}>
          <Tab label="Upload JSON" icon={Upload}  active={mode === "upload"} onClick={() => setMode("upload")} />
          <Tab label="Connect AWS" icon={Cloud}   active={mode === "aws"}    onClick={() => setMode("aws")} />
          <Tab label="Scan GitHub" icon={Github}  active={mode === "github"} onClick={() => setMode("github")} />
        </div>

        {/* GitHub mode — full width handled by GitHubAgent */}
        {mode === "github" && (
          <div style={{ width: "100%", maxWidth: 600 }}>
            <GitHubAgent onResults={onAnalysis} selectedFrameworks={selectedFrameworks} loading={loading} setLoading={setLoading} />
          </div>
        )}

        {/* Upload mode */}
        {mode === "upload" && (
          <div style={s.card}>
            <div
              style={{
                borderRadius: 14, border: `2px dashed ${dragOver ? "#4F46E5" : file ? "#059669" : "#E5E7EB"}`,
                background: file ? "#F0FDF4" : dragOver ? "#EEF2FF" : "#FAFAF8",
                padding: "36px 24px", textAlign: "center", cursor: "pointer", transition: "all 0.2s",
              }}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => document.getElementById("fi").click()}
            >
              <input id="fi" type="file" accept=".json" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
              {file ? (
                <>
                  <FileCheck size={32} color="#059669" style={{ margin: "0 auto 10px" }} />
                  <p style={{ fontWeight: 600, color: "#111827", fontSize: 14 }}>{file.name}</p>
                  <p style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>Ready to analyze</p>
                </>
              ) : (
                <>
                  <Upload size={32} color="#9CA3AF" style={{ margin: "0 auto 10px" }} />
                  <p style={{ fontWeight: 600, color: "#374151", fontSize: 14 }}>Drop your AWS config JSON here</p>
                  <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>or click to browse</p>
                </>
              )}
            </div>
            {error && <div style={s.err}>{error}</div>}
            <PrimaryBtn onClick={handleAnalyze} disabled={!file || loading || selectedFrameworks.length === 0} loading={loading}>
              <Zap size={16} />
              Analyze {selectedFrameworks.length} Framework{selectedFrameworks.length !== 1 ? "s" : ""}
            </PrimaryBtn>
            <p style={{ ...s.hint, textAlign: "center", marginTop: 12 }}>
              Test with <code style={{ background: "#F3F4F6", padding: "2px 6px", borderRadius: 5, fontSize: 11 }}>sample-data/sample-aws-config.json</code>
            </p>
          </div>
        )}

        {/* AWS mode */}
        {mode === "aws" && (
          <div style={s.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <Key size={16} color="#4F46E5" />
              <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>AWS Credentials</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={s.label}>Company Name (optional)</label>
                <input style={s.input} placeholder="Acme Corp" value={awsCreds.company_name}
                  onChange={e => setAwsCreds({ ...awsCreds, company_name: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Access Key ID</label>
                <input style={{ ...s.input, fontFamily: "monospace" }} placeholder="AKIA…" value={awsCreds.access_key}
                  onChange={e => setAwsCreds({ ...awsCreds, access_key: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Secret Access Key</label>
                <input style={{ ...s.input, fontFamily: "monospace" }} type="password" placeholder="••••••••" value={awsCreds.secret_key}
                  onChange={e => setAwsCreds({ ...awsCreds, secret_key: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Region</label>
                <select style={s.select} value={awsCreds.region} onChange={e => setAwsCreds({ ...awsCreds, region: e.target.value })}>
                  {AWS_REGIONS.map(r => <option key={r.value} value={r.value}>{r.label} ({r.value})</option>)}
                </select>
              </div>
            </div>

            <p style={s.hint}>Credentials are used only for scanning and are never stored.</p>
            {error && <div style={s.err}>{error}</div>}
            <PrimaryBtn onClick={handleAWSScan} disabled={!awsCreds.access_key || !awsCreds.secret_key || loading || selectedFrameworks.length === 0} loading={loading} color="#059669">
              <Cloud size={16} />
              Scan AWS Account
            </PrimaryBtn>
          </div>
        )}
      </main>
    </div>
  );
}
