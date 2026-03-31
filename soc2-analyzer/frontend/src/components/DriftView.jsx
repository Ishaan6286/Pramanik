import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, TrendingDown, Clock, Zap, BarChart3, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

// Safe rendering components
const SafeRiskScore = ({ score }) => {
  const safeScore = Math.max(0, Math.min(100, score || 0));
  const getColor = (s) => {
    if (s >= 80) return "bg-red-500";
    if (s >= 60) return "bg-orange-500";
    if (s >= 40) return "bg-yellow-500";
    if (s >= 1) return "bg-blue-500";
    return "bg-green-500";
  };
  return (
    <div className={`${getColor(safeScore)} w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
      {safeScore}
    </div>
  );
};

const SafeFrameworks = ({ frameworks = [] }) => {
  if (!Array.isArray(frameworks) || frameworks.length === 0) {
    return <span className="text-gray-500 text-sm">No frameworks affected</span>;
  }
  return (
    <div className="space-y-2">
      {frameworks.map((fw) => (
        <div key={fw.framework || Math.random()} className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
          <p className="font-semibold text-blue-900 dark:text-blue-400">{fw.framework}</p>
          <p className="text-sm text-blue-700 dark:text-blue-300">{fw.controls?.join(", ") || "N/A"}</p>
        </div>
      ))}
    </div>
  );
};

const SafeRemediationSteps = ({ remediation }) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-900/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <p className="text-sm font-semibold mb-2">Remediation Steps</p>
      <pre className="whitespace-pre-wrap break-words text-xs text-gray-700 dark:text-gray-300 overflow-auto max-h-40 font-mono">
        {remediation || "No remediation available"}
      </pre>
    </div>
  );
};

export default function DriftView({ config, companyName }) {
  const [driftResult, setDriftResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedChange, setExpandedChange] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState("all");

  useEffect(() => {
    if (config && companyName) {
      performDriftAnalysis();
    }
  }, [config, companyName]);

  const performDriftAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/drift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName,
          config: config,
        }),
      });

      if (!response.ok) {
        throw new Error("Drift analysis failed");
      }

      const result = await response.json();
      
      // Handle standardized response format
      if (result.status === "error" || result.error) {
        setError(result.error || "Unknown error occurred");
        setDriftResult(null);
      } else if (result.status === "success" && result.data) {
        setDriftResult(result.data);
      } else if (result.data && !result.error) {
        // Fallback for legacy format
        setDriftResult(result.data);
      } else {
        setError("Invalid response format");
        setDriftResult(null);
      }
    } catch (err) {
      setError(err.message);
      console.error("Drift analysis error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p>Analyzing configuration drift...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass p-6 bg-red-500/10 border border-red-500/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-500">Drift Detection Error</h3>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={performDriftAnalysis}
              className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm font-medium transition-colors"
            >
              Retry Analysis
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!driftResult) {
    return (
      <div className="glass p-8 text-center text-gray-400">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No drift data available</p>
        <button
          onClick={performDriftAnalysis}
          className="mt-4 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Check Drift
        </button>
      </div>
    );
  }

  // Safety checks for undefined/null values
  const safeTotal = driftResult.total_changes || 0;
  const safeRegressions = driftResult.regressions || 0;
  const safeImprovements = driftResult.improvements || 0;
  const safeCritical = driftResult.critical_issues || 0;
  const safeRiskDelta = driftResult.overall_risk_increase || 0;

  const filteredChanges = (driftResult.changes || []).filter((change) => {
    if (filterSeverity === "all") return true;
    if (filterSeverity === "regression") return change.is_regression;
    if (filterSeverity === "improvement") return !change.is_regression;
    return change.severity === filterSeverity;
  });

  const severityColors = {
    CRITICAL: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-500", icon: "text-red-500" },
    HIGH: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-500", icon: "text-orange-500" },
    MEDIUM: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-500", icon: "text-yellow-500" },
    LOW: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-500", icon: "text-blue-500" },
    INFO: { bg: "bg-gray-500/10", border: "border-gray-500/30", text: "text-gray-400", icon: "text-gray-400" },
  };

  const getRiskIndicator = (riskScore) => {
    if (riskScore >= 80) return { color: "text-red-500", bg: "bg-red-500/20", label: "CRITICAL" };
    if (riskScore >= 60) return { color: "text-orange-500", bg: "bg-orange-500/20", label: "HIGH" };
    if (riskScore >= 40) return { color: "text-yellow-500", bg: "bg-yellow-500/20", label: "MEDIUM" };
    if (riskScore > 0) return { color: "text-blue-500", bg: "bg-blue-500/20", label: "LOW" };
    return { color: "text-green-500", bg: "bg-green-500/20", label: "IMPROVEMENT" };
  };

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass p-4 border-l-4 border-red-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total Changes</p>
              <p className="text-2xl font-bold mt-1">{safeTotal}</p>
            </div>
            <BarChart3 className="w-6 h-6 text-red-500/50" />
          </div>
        </div>

        <div className="glass p-4 border-l-4 border-orange-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Regressions</p>
              <p className="text-2xl font-bold mt-1">{safeRegressions}</p>
            </div>
            <TrendingDown className="w-6 h-6 text-orange-500/50" />
          </div>
        </div>

        <div className="glass p-4 border-l-4 border-green-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Improvements</p>
              <p className="text-2xl font-bold mt-1">{safeImprovements}</p>
            </div>
            <CheckCircle className="w-6 h-6 text-green-500/50" />
          </div>
        </div>

        <div className={`glass p-4 border-l-4 ${safeRiskDelta > 0 ? "border-red-500" : "border-green-500"}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Risk Change</p>
              <p className={`text-2xl font-bold mt-1 ${safeRiskDelta > 0 ? "text-red-500" : "text-green-500"}`}>
                {safeRiskDelta > 0 ? "+" : ""}{safeRiskDelta}
              </p>
            </div>
            <Zap className={`w-6 h-6 ${safeRiskDelta > 0 ? "text-red-500/50" : "text-green-500/50"}`} />
          </div>
        </div>
      </div>

      {/* Critical Issues Alert */}
      {safeCritical > 0 && (
        <div className="glass p-4 bg-red-500/10 border border-red-500/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-500">
                {safeCritical} Critical Issue{safeCritical !== 1 ? "s" : ""} Detected
              </h3>
              <p className="text-sm text-red-400 mt-1">
                Your configuration has regressed in ways that significantly impact compliance. Immediate action required.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex gap-2 flex-wrap">
        {["all", "regression", "improvement", "CRITICAL", "HIGH", "MEDIUM"].map((filter) => (
          <button
            key={filter}
            onClick={() => setFilterSeverity(filter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterSeverity === filter
                ? "bg-blue-500 text-white"
                : "glass hover:bg-gray-700/50"
            }`}
          >
            {filter === "regression"
              ? "🔴 Regressions"
              : filter === "improvement"
              ? "🟢 Improvements"
              : filter === "all"
              ? "All Changes"
              : filter}
          </button>
        ))}
      </div>

      {/* Changes List */}
      <div className="space-y-3">
        {filteredChanges.length === 0 ? (
          <div className="glass p-8 text-center text-gray-400">
            <p>No changes match the selected filter</p>
          </div>
        ) : (
          filteredChanges.map((change, idx) => {
            const colors = severityColors[change.severity] || severityColors.INFO;
            const riskLevel = getRiskIndicator(change.risk_score);

            return (
              <div
                key={idx}
                className={`glass overflow-hidden transition-all cursor-pointer hover:opacity-95 ${colors.border} border`}
                onClick={() => setExpandedChange(expandedChange === idx ? null : idx)}
              >
                {/* Header */}
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {change.is_regression ? (
                        <TrendingDown className={`w-5 h-5 ${colors.icon}`} />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>

                    {/* Main Content */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-grow">
                          <h3 className="font-semibold text-lg break-words">{change.config_path}</h3>
                          <p className="text-sm text-gray-400 mt-1">{change.explanation}</p>
                        </div>

                        {/* Right Side Info */}
                        <div className="flex items-center gap-3">
                          {change.is_regression && change.risk_score !== undefined && (
                            <SafeRiskScore score={change.risk_score} />
                          )}
                          <div
                            className={`px-2 py-1 rounded text-xs font-medium ${colors.bg} ${colors.text}`}
                          >
                            {change.severity || "UNKNOWN"}
                          </div>
                          {expandedChange === idx ? (
                            <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedChange === idx && (
                  <div className="border-t border-gray-700 p-4 bg-gray-900/30 space-y-4">
                    {/* Value Change */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-400 uppercase">Previous Value</label>
                        <p className="mt-1 font-mono text-sm bg-gray-900/50 p-2 rounded break-all">
                          {JSON.stringify(change.previous_value) === "null"
                            ? "Not Set"
                            : typeof change.previous_value === "boolean"
                            ? change.previous_value
                              ? "✓ Enabled"
                              : "✗ Disabled"
                            : JSON.stringify(change.previous_value)}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-400 uppercase">Current Value</label>
                        <p className="mt-1 font-mono text-sm bg-gray-900/50 p-2 rounded break-all">
                          {JSON.stringify(change.current_value) === "null"
                            ? "Not Set"
                            : typeof change.current_value === "boolean"
                            ? change.current_value
                              ? "✓ Enabled"
                              : "✗ Disabled"
                            : JSON.stringify(change.current_value)}
                        </p>
                      </div>
                    </div>

                    {/* Affected Frameworks - Using Safe Component */}
                    {change.affected_frameworks && change.affected_frameworks.length > 0 && (
                      <div>
                        <label className="text-xs font-medium text-gray-400 uppercase">Affected Frameworks</label>
                        <div className="mt-2">
                          <SafeFrameworks frameworks={change.affected_frameworks} />
                        </div>
                      </div>
                    )}

                    {/* Affected Controls */}
                    {change.affected_controls && Array.isArray(change.affected_controls) && change.affected_controls.length > 0 && (
                      <div>
                        <label className="text-xs font-medium text-gray-400 uppercase">SOC 2 Controls</label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {change.affected_controls.map((control, cIdx) => (
                            <span key={cIdx} className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400 font-mono">
                              {control}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Remediation - Using Safe Component */}
                    {change.is_regression && change.remediation && (
                      <SafeRemediationSteps remediation={change.remediation} />
                    )}

                    {/* Change Type */}
                    <div className="text-xs text-gray-500">
                      Change Type:{" "}
                      <span className="font-mono text-gray-400">
                        {change.change_type}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Last Updated & Refresh */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {driftResult.timestamp && (
            <>Last analyzed: {new Date(driftResult.timestamp).toLocaleString()}</>
          )}
          {!driftResult.timestamp && (
            <>Last analyzed: Just now</>
          )}
        </div>
        <button
          onClick={performDriftAnalysis}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500/20 hover:bg-blue-500/30 transition-colors"
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Refresh
        </button>
      </div>
    </div>
  );
}
