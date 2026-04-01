import { useState } from "react";
import { Shield, Upload, Zap, FileCheck, LogOut, Check, Cloud, Key, Github } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import GitHubAgent from "./GitHubAgent";

const AVAILABLE_FRAMEWORKS = [
  {
    key: "soc2",
    label: "SOC 2",
    subtitle: "AICPA Trust Services Criteria",
    color: "#6366f1",
    controls: 33,
    popular: true,
  },
  {
    key: "iso27001",
    label: "ISO 27001",
    subtitle: "Information Security Management",
    color: "#22c55e",
    controls: 31,
    popular: true,
  },
  {
    key: "hipaa",
    label: "HIPAA",
    subtitle: "Health Information Protection",
    color: "#f97316",
    controls: 28,
    popular: false,
  },
  {
    key: "dpdp",
    label: "DPDP Act 2023",
    subtitle: "India Data Protection",
    color: "#ec4899",
    controls: 15,
    popular: true,
  },
];

export default function UploadPage({ onAnalysis, loading, setLoading, user, onLogout }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [selectedFrameworks, setSelectedFrameworks] = useState(["soc2", "iso27001", "dpdp"]);
  const [mode, setMode] = useState("upload"); // "upload", "aws", or "github"
  const [awsCreds, setAwsCreds] = useState({ access_key: "", secret_key: "", region: "ap-south-1", company_name: "" });

  const toggleFramework = (key) => {
    setSelectedFrameworks((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  };

  const handleFile = (f) => {
    if (f && f.name.endsWith(".json")) {
      setFile(f);
      setError(null);
    } else {
      setError("Please upload a JSON file");
    }
  };

  const filterFrameworks = (data) => {
    if (data.framework_scores) {
      const filtered = {};
      selectedFrameworks.forEach((key) => {
        if (data.framework_scores[key]) filtered[key] = data.framework_scores[key];
      });
      data.framework_scores = filtered;
      data.selected_frameworks = selectedFrameworks;
    }
    return data;
  };

  const handleAnalyze = async () => {
    if (!file || selectedFrameworks.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const configText = await file.text();
      const configJson = JSON.parse(configText);

      const formData = new FormData();
      formData.append("config", file);

      const response = await fetch("http://localhost:3001/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Analysis failed");
      const data = await response.json();
      onAnalysis(filterFrameworks(data), configJson);
    } catch (err) {
      setError("Failed to analyze: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAWSScan = async () => {
    if (!awsCreds.access_key || !awsCreds.secret_key) {
      setError("Please enter both Access Key and Secret Key");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:3001/api/scan-aws", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: awsCreds.access_key,
          secret_key: awsCreds.secret_key,
          region: awsCreds.region,
          company_name: awsCreds.company_name,
          industry: "saas_startup",
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "AWS scan failed");
      }

      const data = await response.json();
      onAnalysis(filterFrameworks(data), {});
    } catch (err) {
      setError("AWS scan failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6" style={{ color: "var(--accent)" }} />
          <span className="text-lg font-bold">ComplianceAI</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>{user}</span>
          <ThemeToggle />
          <button
            onClick={onLogout}
            className="p-2 rounded-lg hover:opacity-80"
            style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center px-4 pb-20 pt-8">
        <div className="text-center mb-8 fade-in">
          <h1 className="text-3xl font-bold mb-2">Compliance Analysis</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Select your target frameworks, upload your AWS config, and get a full gap analysis
          </p>
        </div>

        {/* Framework Selector */}
        <div className="w-full max-w-2xl mb-8 fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
              Target Frameworks
            </h3>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {selectedFrameworks.length} selected
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {AVAILABLE_FRAMEWORKS.map((fw) => {
              const selected = selectedFrameworks.includes(fw.key);
              return (
                <button
                  key={fw.key}
                  onClick={() => toggleFramework(fw.key)}
                  className="relative p-4 rounded-xl text-left transition-all"
                  style={{
                    background: selected ? fw.color + "15" : "var(--bg-secondary)",
                    border: `2px solid ${selected ? fw.color : "var(--border)"}`,
                  }}
                >
                  {/* Checkmark */}
                  <div
                    className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{
                      background: selected ? fw.color : "var(--bg-hover)",
                    }}
                  >
                    {selected && <Check className="w-3 h-3 text-white" />}
                  </div>

                  <div className="font-bold text-sm" style={{ color: selected ? fw.color : "var(--text-primary)" }}>
                    {fw.label}
                  </div>
                  <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    {fw.subtitle}
                  </div>
                  <div className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                    {fw.controls} controls
                  </div>
                  {fw.popular && (
                    <span
                      className="inline-block text-xs mt-1 px-1.5 py-0.5 rounded"
                      style={{ background: fw.color + "20", color: fw.color, fontSize: "10px" }}
                    >
                      Popular
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6 fade-in">
          <button
            onClick={() => setMode("upload")}
            className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            style={{
              background: mode === "upload" ? "var(--accent)" : "var(--bg-secondary)",
              color: mode === "upload" ? "white" : "var(--text-secondary)",
            }}
          >
            <Upload className="w-4 h-4" />
            Upload JSON
          </button>
          <button
            onClick={() => setMode("aws")}
            className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            style={{
              background: mode === "aws" ? "var(--accent)" : "var(--bg-secondary)",
              color: mode === "aws" ? "white" : "var(--text-secondary)",
            }}
          >
            <Cloud className="w-4 h-4" />
            Connect AWS
          </button>
          <button
            onClick={() => setMode("github")}
            className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            style={{
              background: mode === "github" ? "#1f2937" : "var(--bg-secondary)",
              color: mode === "github" ? "white" : "var(--text-secondary)",
              border: mode === "github" ? "1px solid #374151" : "none",
            }}
          >
            <Github className="w-4 h-4" />
            Scan GitHub
          </button>
        </div>

        {/* GitHub Agent */}
        {mode === "github" && (
          <GitHubAgent
            onResults={onAnalysis}
            selectedFrameworks={selectedFrameworks}
            loading={loading}
            setLoading={setLoading}
          />
        )}

        {/* AWS Connect Form */}
        {mode === "aws" && (
          <div className="w-full max-w-lg glass p-6 mb-6 fade-in space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-4 h-4" style={{ color: "var(--accent)" }} />
              <span className="font-semibold text-sm">AWS Credentials</span>
            </div>
            <input
              type="text"
              placeholder="Company Name (optional)"
              value={awsCreds.company_name}
              onChange={(e) => setAwsCreds({ ...awsCreds, company_name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />
            <input
              type="text"
              placeholder="AWS Access Key ID"
              value={awsCreds.access_key}
              onChange={(e) => setAwsCreds({ ...awsCreds, access_key: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm font-mono"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />
            <input
              type="password"
              placeholder="AWS Secret Access Key"
              value={awsCreds.secret_key}
              onChange={(e) => setAwsCreds({ ...awsCreds, secret_key: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm font-mono"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />
            <select
              value={awsCreds.region}
              onChange={(e) => setAwsCreds({ ...awsCreds, region: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            >
              <option value="ap-south-1">Mumbai (ap-south-1)</option>
              <option value="ap-south-2">Hyderabad (ap-south-2)</option>
              <option value="us-east-1">N. Virginia (us-east-1)</option>
              <option value="us-west-2">Oregon (us-west-2)</option>
              <option value="eu-west-1">Ireland (eu-west-1)</option>
              <option value="eu-north-1">Stockholm (eu-north-1)</option>
            </select>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Credentials are used for scanning only and are never stored.
            </p>
          </div>
        )}

        {/* Upload Box */}
        {mode === "upload" && (
        <div
          className="w-full max-w-lg rounded-2xl p-8 text-center cursor-pointer fade-in-d1"
          style={{
            background: file ? "var(--bg-card)" : "var(--bg-secondary)",
            border: `2px dashed ${dragOver ? "var(--accent)" : file ? "#22c55e" : "var(--border)"}`,
          }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => document.getElementById("fileInput").click()}
        >
          <input
            id="fileInput"
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />

          {file ? (
            <div>
              <FileCheck className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="font-semibold">{file.name}</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Ready to analyze</p>
            </div>
          ) : (
            <div>
              <Upload className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
              <p className="font-semibold">Drop your AWS config JSON here</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>or click to browse</p>
            </div>
          )}
        </div>
        )}

        {error && mode !== "github" && <p className="text-red-500 mt-4 text-sm">{error}</p>}

        {mode === "upload" && (
          <button
            onClick={handleAnalyze}
            disabled={!file || loading || selectedFrameworks.length === 0}
            className="mt-6 px-8 py-3.5 rounded-xl font-semibold text-white flex items-center gap-2 fade-in-d2"
            style={{
              background: file && !loading && selectedFrameworks.length > 0 ? "var(--accent)" : "var(--text-muted)",
              cursor: file && !loading && selectedFrameworks.length > 0 ? "pointer" : "not-allowed",
              opacity: file && !loading && selectedFrameworks.length > 0 ? 1 : 0.5,
            }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing {selectedFrameworks.length} frameworks...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Analyze {selectedFrameworks.length} Framework{selectedFrameworks.length !== 1 ? "s" : ""}
              </>
            )}
          </button>
        )}

        {mode === "aws" && (
          <button
            onClick={handleAWSScan}
            disabled={!awsCreds.access_key || !awsCreds.secret_key || loading || selectedFrameworks.length === 0}
            className="mt-2 px-8 py-3.5 rounded-xl font-semibold text-white flex items-center gap-2 fade-in-d2"
            style={{
              background: awsCreds.access_key && awsCreds.secret_key && !loading ? "#22c55e" : "var(--text-muted)",
              cursor: awsCreds.access_key && awsCreds.secret_key && !loading ? "pointer" : "not-allowed",
              opacity: awsCreds.access_key && awsCreds.secret_key && !loading ? 1 : 0.5,
            }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Scanning AWS Account...
              </>
            ) : (
              <>
                <Cloud className="w-5 h-5" />
                Scan {selectedFrameworks.length} Framework{selectedFrameworks.length !== 1 ? "s" : ""}
              </>
            )}
          </button>
        )}

        {mode === "upload" && (
          <p className="mt-4 text-xs fade-in-d3" style={{ color: "var(--text-muted)" }}>
            Use the sample file in{" "}
            <code style={{ background: "var(--bg-hover)", padding: "2px 6px", borderRadius: "4px" }}>
              sample-data/sample-aws-config.json
            </code>{" "}
            to test
          </p>
        )}
      </div>
    </div>
  );
}
