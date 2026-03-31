import { useState } from "react";
import "./PramanikAI.css";

export default function PramanikAI() {
  const [mode, setMode] = useState(null); // null | 'gap' | 'policy' | 'ghost' | 'vendor' | 'breach' | 'pathfinder'
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // ═══════════════════════════════════════════════════
  // MODE 1: GAP ANALYSIS
  // ═══════════════════════════════════════════════════

  const [gapConfig, setGapConfig] = useState({
    mfa_enforced: false,
    cloudtrail_enabled: false,
    s3_public_access: false,
    public_s3_buckets: [],
    rds_encryption: false,
    tls_enabled: false,
    security_groups_configured: false,
    least_privilege_applied: false,
    cloudwatch_enabled: false,
  });

  const handleGapAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:3001/api/pramanik/gap-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gapConfig),
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // ═══════════════════════════════════════════════════
  // MODE 2: POLICY GENERATOR
  // ═══════════════════════════════════════════════════

  const [policyForm, setPolicyForm] = useState({
    policyType: "Access Control Policy",
    companyName: "",
    stackTech: "AWS, Supabase, GitHub",
    policyOwner: "Security Officer",
  });

  const policyOptions = [
    "Access Control Policy",
    "Incident Response Policy",
    "Data Encryption Policy",
    "Password and Authentication Policy",
    "Vendor Management Policy",
    "Change Management Policy",
    "Business Continuity Policy",
    "Asset Management Policy",
    "Risk Assessment Policy",
    "Security Awareness Training Policy",
  ];

  const handlePolicyGenerator = async () => {
    if (!policyForm.companyName) {
      setError("Company name is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:3001/api/pramanik/policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(policyForm),
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // ═══════════════════════════════════════════════════
  // MODE 3: GHOST AUDIT
  // ═══════════════════════════════════════════════════

  const handleGhostAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:3001/api/pramanik/ghost-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // ═══════════════════════════════════════════════════
  // MODE 4: VENDOR INHERITANCE
  // ═══════════════════════════════════════════════════

  const [vendors, setVendors] = useState(["Stripe", "AWS", "Supabase", "GitHub"]);
  const [vendorInput, setVendorInput] = useState("");

  const availableVendors = [
    "Stripe",
    "AWS",
    "Supabase",
    "Twilio",
    "Vercel",
    "GitHub",
    "Cloudflare",
    "Intercom",
    "PagerDuty",
    "Datadog",
  ];

  const handleVendorToggle = (vendor) => {
    setVendors((prev) =>
      prev.includes(vendor) ? prev.filter((v) => v !== vendor) : [...prev, vendor]
    );
  };

  const handleVendorInheritance = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:3001/api/pramanik/vendor-inheritance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendors }),
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // ═══════════════════════════════════════════════════
  // MODE 5: BREACH ANALYSIS
  // ═══════════════════════════════════════════════════

  const [breachName, setBreachName] = useState("LastPass 2022");
  const knownBreaches = [
    "LastPass 2022",
    "Twilio 2022",
    "Cloudflare Okta 2022",
    "Uber 2022",
    "Microsoft Exchange 2023",
  ];

  const handleBreachAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:3001/api/pramanik/breach-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ breachName, userConfig: gapConfig }),
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // ═══════════════════════════════════════════════════
  // MODE 6: PATHFINDER
  // ═══════════════════════════════════════════════════

  const [profile, setProfile] = useState({
    customers: "US Enterprise SaaS",
    tech_stack: "AWS, React, Node.js",
    team_size: 10,
    timeline: "6 months",
  });

  const handlePathfinder = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:3001/api/pramanik/certification-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="pramanik-ai">
      <div className="pramanik-header">
        <h1>🔐 Pramanik AI — SOC 2 Compliance Co-Pilot</h1>
        <p>Your AI-powered compliance assistant. Choose a mode to get started.</p>
      </div>

      {/* MODE SELECTOR */}
      <div className="mode-selector">
        <div
          className={`mode-card ${mode === "gap" ? "active" : ""}`}
          onClick={() => {
            setMode("gap");
            setResult(null);
          }}
        >
          <div className="mode-icon">🔍</div>
          <h3>Gap Analysis</h3>
          <p>Scan your AWS config for SOC 2 gaps</p>
        </div>

        <div
          className={`mode-card ${mode === "policy" ? "active" : ""}`}
          onClick={() => {
            setMode("policy");
            setResult(null);
          }}
        >
          <div className="mode-icon">📄</div>
          <h3>Policy Generator</h3>
          <p>Generate compliance policy documents</p>
        </div>

        <div
          className={`mode-card ${mode === "ghost" ? "active" : ""}`}
          onClick={() => {
            setMode("ghost");
            setResult(null);
          }}
        >
          <div className="mode-icon">👻</div>
          <h3>Ghost Audit</h3>
          <p>Challenge your evidence like a Big 4 auditor</p>
        </div>

        <div
          className={`mode-card ${mode === "vendor" ? "active" : ""}`}
          onClick={() => {
            setMode("vendor");
            setResult(null);
          }}
        >
          <div className="mode-icon">🤝</div>
          <h3>Vendor Inheritance</h3>
          <p>Map your SaaS stack to SOC 2 controls</p>
        </div>

        <div
          className={`mode-card ${mode === "breach" ? "active" : ""}`}
          onClick={() => {
            setMode("breach");
            setResult(null);
          }}
        >
          <div className="mode-icon">💀</div>
          <h3>Breach Analysis</h3>
          <p>Check your exposure to known breaches</p>
        </div>

        <div
          className={`mode-card ${mode === "pathfinder" ? "active" : ""}`}
          onClick={() => {
            setMode("pathfinder");
            setResult(null);
          }}
        >
          <div className="mode-icon">🗺️</div>
          <h3>Certification Path</h3>
          <p>Get a compliance roadmap for your company</p>
        </div>
      </div>

      {/* MODE CONTENT */}
      <div className="mode-content">
        {mode === "gap" && (
          <div className="mode-panel">
            <h2>🔍 Gap Analysis — AWS Configuration</h2>
            <p>Toggle security controls you have implemented:</p>

            <div className="config-grid">
              {Object.keys(gapConfig).map((key) => (
                <label key={key} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={gapConfig[key] || false}
                    onChange={(e) =>
                      setGapConfig({ ...gapConfig, [key]: e.target.checked })
                    }
                  />
                  <span>{key.replace(/_/g, " ").toUpperCase()}</span>
                </label>
              ))}
            </div>

            <button className="action-btn" onClick={handleGapAnalysis} disabled={loading}>
              {loading ? "Analyzing..." : "Scan Configuration"}
            </button>
          </div>
        )}

        {mode === "policy" && (
          <div className="mode-panel">
            <h2>📄 Policy Generator</h2>

            <div className="form-group">
              <label>Policy Type *</label>
              <select
                value={policyForm.policyType}
                onChange={(e) =>
                  setPolicyForm({ ...policyForm, policyType: e.target.value })
                }
              >
                {policyOptions.map((policy) => (
                  <option key={policy} value={policy}>
                    {policy}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Company Name *</label>
              <input
                type="text"
                placeholder="e.g., Acme SaaS Inc"
                value={policyForm.companyName}
                onChange={(e) =>
                  setPolicyForm({ ...policyForm, companyName: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>Tech Stack</label>
              <input
                type="text"
                placeholder="e.g., AWS, Supabase, GitHub"
                value={policyForm.stackTech}
                onChange={(e) =>
                  setPolicyForm({ ...policyForm, stackTech: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>Policy Owner</label>
              <input
                type="text"
                placeholder="e.g., Chief Security Officer"
                value={policyForm.policyOwner}
                onChange={(e) =>
                  setPolicyForm({ ...policyForm, policyOwner: e.target.value })
                }
              />
            </div>

            <button className="action-btn" onClick={handlePolicyGenerator} disabled={loading}>
              {loading ? "Generating..." : "Generate Policy"}
            </button>
          </div>
        )}

        {mode === "ghost" && (
          <div className="mode-panel">
            <h2>👻 Ghost Audit — Red Team Challenges</h2>
            <p>I will role-play as a senior CPA auditor and challenge your evidence...</p>
            <button className="action-btn" onClick={handleGhostAudit} disabled={loading}>
              {loading ? "Auditing..." : "Start Ghost Audit"}
            </button>
          </div>
        )}

        {mode === "vendor" && (
          <div className="mode-panel">
            <h2>🤝 Vendor Inheritance Map</h2>
            <p>Select your SaaS vendors. I'll map which SOC 2 controls they cover:</p>

            <div className="vendor-grid">
              {availableVendors.map((vendor) => (
                <label key={vendor} className="vendor-item">
                  <input
                    type="checkbox"
                    checked={vendors.includes(vendor)}
                    onChange={() => handleVendorToggle(vendor)}
                  />
                  <span>{vendor}</span>
                </label>
              ))}
            </div>

            <button className="action-btn" onClick={handleVendorInheritance} disabled={loading}>
              {loading ? "Analyzing..." : "Map Vendor Coverage"}
            </button>
          </div>
        )}

        {mode === "breach" && (
          <div className="mode-panel">
            <h2>💀 Compliance Obituary — Breach Analysis</h2>
            <p>Select a known breach. I'll check if your configuration is vulnerable:</p>

            <div className="form-group">
              <label>Known Breach</label>
              <select
                value={breachName}
                onChange={(e) => setBreachName(e.target.value)}
              >
                {knownBreaches.map((breach) => (
                  <option key={breach} value={breach}>
                    {breach}
                  </option>
                ))}
              </select>
            </div>

            <button className="action-btn" onClick={handleBreachAnalysis} disabled={loading}>
              {loading ? "Analyzing..." : "Analyze Breach"}
            </button>
          </div>
        )}

        {mode === "pathfinder" && (
          <div className="mode-panel">
            <h2>🗺️ Certification Pathfinder</h2>
            <p>Tell me about your company. I'll recommend a compliance roadmap:</p>

            <div className="form-group">
              <label>Target Customers</label>
              <input
                type="text"
                placeholder="e.g., US Enterprise, EU Enterprise, Healthcare"
                value={profile.customers}
                onChange={(e) => setProfile({ ...profile, customers: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Tech Stack</label>
              <input
                type="text"
                placeholder="e.g., AWS, React, Node.js"
                value={profile.tech_stack}
                onChange={(e) => setProfile({ ...profile, tech_stack: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Team Size</label>
              <input
                type="number"
                placeholder="e.g., 10"
                value={profile.team_size}
                onChange={(e) => setProfile({ ...profile, team_size: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Timeline</label>
              <select
                value={profile.timeline}
                onChange={(e) => setProfile({ ...profile, timeline: e.target.value })}
              >
                <option>3 months</option>
                <option>6 months</option>
                <option>12 months</option>
              </select>
            </div>

            <button className="action-btn" onClick={handlePathfinder} disabled={loading}>
              {loading ? "Analyzing..." : "Get Roadmap"}
            </button>
          </div>
        )}
      </div>

      {/* RESULTS */}
      {result && (
        <div className="results-panel">
          <h2>📊 Results</h2>
          <pre className="result-output">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      {/* ERROR */}
      {error && <div className="error-panel">⚠️ Error: {error}</div>}
    </div>
  );
}
