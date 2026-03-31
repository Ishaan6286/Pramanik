import { useState } from "react";
import { AlertTriangle, ArrowUp, ArrowDown, Minus, RefreshCw, Loader2, Shield } from "lucide-react";

export default function DriftView({ companyName, config }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkDrift = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:3001/api/drift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_name: companyName, config }),
      });
      if (!response.ok) throw new Error("Failed to check drift");
      const result = await response.json();
      if (result.error) {
        setError(result.error);
      } else {
        setData(result);
      }
    } catch (err) {
      setError("Failed to check drift: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!data && !loading && !error) {
    return (
      <div className="text-center py-16">
        <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
        <h3 className="text-lg font-semibold mb-2">Compliance Drift Detection</h3>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Compare your current config against the last saved baseline to detect changes.
        </p>
        <button
          onClick={checkDrift}
          className="px-6 py-2.5 rounded-lg font-medium text-white"
          style={{ background: "var(--accent)" }}
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Check for Drift
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: "var(--accent)" }} />
        <p style={{ color: "var(--text-muted)" }}>Comparing against baseline...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-yellow-500" />
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>{error}</p>
        <button
          onClick={checkDrift}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "var(--accent)" }}
        >
          Try Again
        </button>
      </div>
    );
  }

  const sevColor = {
    CRITICAL: "#ef4444",
    HIGH: "#f97316",
    MEDIUM: "#eab308",
    LOW: "#3b82f6",
    INFO: "#22c55e",
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="glass p-5 fade-in">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{data.total_changes}</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>Total Changes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-500">{data.regressions}</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>Regressions</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-500">{data.improvements}</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>Improvements</div>
          </div>
        </div>
      </div>

      {data.total_changes === 0 ? (
        <div className="text-center py-8">
          <p className="text-green-500 font-medium">No drift detected — config matches baseline.</p>
        </div>
      ) : (
        data.changes.map((change, i) => (
          <div key={i} className="glass p-4 fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {change.is_regression ? (
                  <ArrowDown className="w-5 h-5 text-red-500" />
                ) : change.severity === "INFO" ? (
                  <ArrowUp className="w-5 h-5 text-green-500" />
                ) : (
                  <Minus className="w-5 h-5 text-yellow-500" />
                )}
                <div>
                  <div className="font-medium text-sm">{change.config_path}</div>
                  <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    <span className="line-through">{String(change.previous_value)}</span>
                    {" → "}
                    <span className="font-medium" style={{ color: change.is_regression ? "#ef4444" : "#22c55e" }}>
                      {String(change.current_value)}
                    </span>
                  </div>
                </div>
              </div>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded"
                style={{ background: sevColor[change.severity] + "20", color: sevColor[change.severity] }}
              >
                {change.severity}
              </span>
            </div>

            {change.affected_controls.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {change.affected_controls.map((cid) => (
                  <span key={cid} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}>
                    {cid}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))
      )}

      <div className="text-center pt-4">
        <button
          onClick={checkDrift}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}
        >
          <RefreshCw className="w-3 h-3 inline mr-1" />
          Recheck
        </button>
      </div>
    </div>
  );
}
