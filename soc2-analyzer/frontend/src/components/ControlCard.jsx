import { useState } from "react";
import { CheckCircle, XCircle, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

export default function ControlCard({ control }) {
  const [expanded, setExpanded] = useState(!control.passed);

  const severityColor = {
    CRITICAL: "#ef4444",
    HIGH: "#f97316",
    MEDIUM: "#eab308",
  };

  return (
    <div
      className="glass overflow-hidden"
      style={{
        borderLeft: `3px solid ${control.passed ? "#22c55e" : severityColor[control.severity] || "#ef4444"}`
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:opacity-90"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {control.passed ? (
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{control.id}</span>
              <h3 className="font-semibold">{control.title}</h3>
              {control.severity && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    color: severityColor[control.severity],
                    background: `${severityColor[control.severity]}15`,
                  }}
                >
                  {control.severity}
                </span>
              )}
            </div>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{control.description}</p>
          </div>
        </div>

        {expanded ? (
          <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
        ) : (
          <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
        )}
      </div>

      {/* Expanded Details */}
      {expanded && !control.passed && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="pt-3">
            {/* Issues */}
            <div className="space-y-1.5">
              {control.issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-red-500 mt-0.5">-</span>
                  <span style={{ color: "var(--text-secondary)" }}>{issue}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Explanation */}
          {control.risk_explanation && (
            <div className="p-3 rounded-lg" style={{ background: "var(--bg-hover)" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "#eab308" }}>Why this matters</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{control.risk_explanation}</p>
            </div>
          )}

          {/* Fix Steps */}
          {control.fix_steps?.length > 0 && (
            <div className="p-3 rounded-lg" style={{ background: "var(--bg-hover)" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--accent)" }}>How to fix</p>
              <div className="space-y-1.5">
                {control.fix_steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5 font-medium text-white"
                      style={{ background: "var(--accent)" }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ color: "var(--text-secondary)" }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Business Impact */}
          {control.business_impact && (
            <div
              className="p-3 rounded-lg text-sm"
              style={{ background: "#ef444415", border: "1px solid #ef444430" }}
            >
              <span className="font-semibold text-red-500">Impact: </span>
              <span style={{ color: "var(--text-secondary)" }}>{control.business_impact}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
