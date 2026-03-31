import { useState } from "react";
import { ChevronDown, ChevronUp, Zap, Target, TrendingUp } from "lucide-react";

const FRAMEWORK_COLORS = {
  "SOC 2": { bg: "#6366f115", border: "#6366f130", text: "#6366f1" },
  "ISO 27001": { bg: "#22c55e15", border: "#22c55e30", text: "#22c55e" },
  "HIPAA": { bg: "#f9731615", border: "#f9731630", text: "#f97316" },
};

const SEVERITY_COLOR = {
  9: "#ef4444", 8: "#ef4444", 7: "#f97316",
  6: "#f97316", 5: "#eab308", 4: "#eab308",
  3: "#94a3b8", 2: "#94a3b8", 1: "#94a3b8",
};

function ScoreBar({ label, value, max = 10, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-20 flex-shrink-0" style={{ color: "var(--text-muted)" }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${(value / max) * 100}%`, background: color }}
        />
      </div>
      <span className="text-xs w-4 text-right" style={{ color: "var(--text-muted)" }}>{value}</span>
    </div>
  );
}

export default function PriorityFix({ priorityFixes, currentScore }) {
  const [expanded, setExpanded] = useState(null);

  if (!priorityFixes || priorityFixes.length === 0) {
    return (
      <div className="glass p-10 text-center fade-in">
        <Zap className="w-12 h-12 mx-auto mb-3" style={{ color: "#22c55e" }} />
        <h3 className="text-lg font-semibold mb-1">All Controls Passing</h3>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>No fixes needed — you're compliant!</p>
      </div>
    );
  }

  const maxCrvs = priorityFixes[0]?.crvs_score || 1;

  return (
    <div className="space-y-4 fade-in">
      {/* Header */}
      <div className="glass p-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: "var(--accent)" }} />
            Fix Priority Order
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Ranked by CRVS — Compliance Risk Velocity Score. Fix in this order for maximum impact.
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color: "var(--accent)" }}>{currentScore}%</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>current score</div>
        </div>
      </div>

      {/* Fix list */}
      <div className="space-y-2">
        {priorityFixes.map((fix, i) => {
          const isExpanded = expanded === i;
          const barColor = fix.crvs_score > maxCrvs * 0.7 ? "#ef4444"
            : fix.crvs_score > maxCrvs * 0.4 ? "#f97316" : "#eab308";

          return (
            <div key={fix.id} className="glass overflow-hidden">
              {/* Row */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:opacity-90"
                onClick={() => setExpanded(isExpanded ? null : i)}
              >
                {/* Priority number */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    background: barColor + "20",
                    color: barColor,
                    border: `1px solid ${barColor}40`,
                  }}
                >
                  {fix.fix_priority}
                </div>

                {/* Control info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{fix.id}</span>
                    <span className="font-semibold text-sm">{fix.title}</span>
                    <div className="flex gap-1">
                      {fix.framework_mappings.map((fw) => (
                        <span
                          key={fw.framework}
                          className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                          style={{
                            background: FRAMEWORK_COLORS[fw.framework]?.bg,
                            border: `1px solid ${FRAMEWORK_COLORS[fw.framework]?.border}`,
                            color: FRAMEWORK_COLORS[fw.framework]?.text,
                          }}
                        >
                          {fw.framework}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CRVS bar */}
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(fix.crvs_score / maxCrvs) * 100}%`, background: barColor }}
                      />
                    </div>
                    <span className="text-xs font-mono flex-shrink-0" style={{ color: barColor }}>
                      CRVS {fix.crvs_score.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Score improvement */}
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 text-green-500 font-semibold text-sm">
                    <TrendingUp className="w-3 h-3" />
                    +{fix.score_improvement}%
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>→ {fix.projected_score_if_fixed}%</div>
                </div>

                {isExpanded
                  ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                  : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                }
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="pt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Risk breakdown */}
                    <div className="p-3 rounded-lg" style={{ background: "var(--bg-hover)" }}>
                      <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-muted)" }}>
                        Risk Breakdown
                      </p>
                      <div className="space-y-2">
                        <ScoreBar label="Severity" value={fix.severity} color="#ef4444" />
                        <ScoreBar label="Exploitability" value={fix.exploitability} color="#f97316" />
                        <ScoreBar label="Data Exposure" value={fix.data_exposure} color="#eab308" />
                        <ScoreBar label="Blast Radius" value={fix.blast_radius} color="#6366f1" />
                      </div>
                      <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)" }}>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          ×{fix.cross_framework_multiplier} cross-framework
                        </span>
                        <span className="font-bold" style={{ color: barColor }}>
                          CRVS = {fix.crvs_score.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Framework mappings */}
                    <div className="p-3 rounded-lg" style={{ background: "var(--bg-hover)" }}>
                      <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-muted)" }}>
                        Fixes {fix.frameworks_satisfied} Framework{fix.frameworks_satisfied > 1 ? "s" : ""}
                      </p>
                      <div className="space-y-2">
                        {fix.framework_mappings.map((fw) => (
                          <div
                            key={fw.framework}
                            className="p-2 rounded-lg"
                            style={{
                              background: FRAMEWORK_COLORS[fw.framework]?.bg,
                              border: `1px solid ${FRAMEWORK_COLORS[fw.framework]?.border}`,
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="text-xs font-semibold"
                                style={{ color: FRAMEWORK_COLORS[fw.framework]?.text }}
                              >
                                {fw.framework}
                              </span>
                              <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                                {fw.control}
                              </span>
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                              {fw.title}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Issues */}
                  {fix.issues?.length > 0 && (
                    <div className="space-y-1">
                      {fix.issues.map((issue, ii) => (
                        <div key={ii} className="flex items-start gap-2 text-sm">
                          <span className="text-red-500 mt-0.5">-</span>
                          <span style={{ color: "var(--text-secondary)" }}>{issue}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
