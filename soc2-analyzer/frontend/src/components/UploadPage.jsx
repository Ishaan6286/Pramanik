import { useState } from "react";
import { Shield, Upload, Zap, FileCheck, ArrowLeft, LogOut } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function UploadPage({ onAnalysis, loading, setLoading, user, onLogout }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);

  const handleFile = (f) => {
    if (f && f.name.endsWith('.json')) {
      setFile(f);
      setError(null);
    } else {
      setError('Please upload a JSON file');
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const configText = await file.text();
      const configJson = JSON.parse(configText);

      const formData = new FormData();
      formData.append('config', file);

      const response = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();
      onAnalysis(data, configJson);
    } catch (err) {
      setError('Failed to analyze: ' + err.message);
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
          <span className="text-lg font-bold">SOC2 Analyzer</span>
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
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
        <div className="text-center mb-10 fade-in">
          <h1 className="text-3xl font-bold mb-3">Upload AWS Configuration</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Drop your AWS config JSON file to start the compliance analysis
          </p>
        </div>

        {/* Upload Box */}
        <div
          className={`w-full max-w-lg rounded-2xl p-10 text-center cursor-pointer fade-in-d1`}
          style={{
            background: file ? "var(--bg-card)" : "var(--bg-secondary)",
            border: `2px dashed ${dragOver ? "var(--accent)" : file ? "#22c55e" : "var(--border)"}`,
          }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => document.getElementById('fileInput').click()}
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
              <FileCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-semibold text-lg">{file.name}</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Ready to analyze</p>
            </div>
          ) : (
            <div>
              <Upload className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
              <p className="font-semibold text-lg">Drop your JSON config here</p>
              <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>or click to browse</p>
            </div>
          )}
        </div>

        {error && (
          <p className="text-red-500 mt-4 text-sm">{error}</p>
        )}

        <button
          onClick={handleAnalyze}
          disabled={!file || loading}
          className="mt-6 px-8 py-3.5 rounded-xl font-semibold text-white flex items-center gap-2 fade-in-d2"
          style={{
            background: file && !loading ? "var(--accent)" : "var(--text-muted)",
            cursor: file && !loading ? "pointer" : "not-allowed",
            opacity: file && !loading ? 1 : 0.5,
          }}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Analyze Compliance
            </>
          )}
        </button>

        {/* Helper text */}
        <p className="mt-4 text-xs fade-in-d3" style={{ color: "var(--text-muted)" }}>
          Use the sample file in <code style={{ background: "var(--bg-hover)", padding: "2px 6px", borderRadius: "4px" }}>sample-data/sample-aws-config.json</code> to test
        </p>
      </div>
    </div>
  );
}
