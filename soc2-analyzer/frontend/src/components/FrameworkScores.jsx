const FRAMEWORKS = [
  {
    key: "soc2",
    label: "SOC 2",
    subtitle: "Trust Service Criteria",
    color: "hsl(220, 35%, 62%)",
    bg: "hsla(220, 35%, 62%, 0.10)",
    description: "AICPA framework for security, availability, and confidentiality",
  },
  {
    key: "iso27001",
    label: "ISO 27001",
    subtitle: "Annex A Controls",
    color: "hsl(155, 28%, 56%)",
    bg: "hsla(155, 28%, 56%, 0.10)",
    description: "International standard for information security management systems",
  },
  {
    key: "hipaa",
    label: "HIPAA",
    subtitle: "Security Rule",
    color: "hsl(28, 45%, 60%)",
    bg: "hsla(28, 45%, 60%, 0.10)",
    description: "US federal law protecting health information and ePHI",
  },
  {
    key: "dpdp",
    label: "DPDP Act",
    subtitle: "India 2023",
    color: "hsl(330, 30%, 64%)",
    bg: "hsla(330, 30%, 64%, 0.10)",
    description: "India's Digital Personal Data Protection Act — consent, breach notification, data principal rights",
  },
];

function ScoreRing({ score, color, size = 80 }) {
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
      <circle
        cx="40" cy="40" r={r}
        fill="none" stroke={color} strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 40 40)"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
    </svg>
  );
}

export default function FrameworkScores({ frameworkScores }) {
  if (!frameworkScores) return null;

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h3 className="font-semibold">Multi-Framework Coverage</h3>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          One scan, four compliance frameworks. Each control maps to SOC 2, ISO 27001, HIPAA, and India's DPDP Act simultaneously.
        </p>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {FRAMEWORKS.map((fw) => {
          const data = frameworkScores[fw.key];
          if (!data) return null;
          const score = data.score;
          const status = score >= 70 ? "On Track" : score >= 40 ? "Needs Work" : "At Risk";
          const statusColor = score >= 70 ? "hsl(155, 28%, 56%)" : score >= 40 ? "hsl(45, 35%, 56%)" : "hsl(2, 45%, 62%)";

          return (
            <div
              key={fw.key}
              className="glass p-5 flex flex-col items-center text-center"
              style={{ borderTop: `3px solid ${fw.color}` }}
            >
              <div className="relative mb-2">
                <ScoreRing score={score} color={fw.color} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold" style={{ color: fw.color }}>{score}%</span>
                </div>
              </div>

              <h4 className="font-bold text-lg">{fw.label}</h4>
              <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>{fw.subtitle}</p>

              <div
                className="text-xs px-2.5 py-1 rounded-full font-medium mb-3"
                style={{ background: statusColor + "15", color: statusColor }}
              >
                {status}
              </div>

              <div className="w-full flex justify-between text-sm">
                <div className="text-center">
                  <div className="font-bold" style={{ color: "hsl(155, 28%, 56%)" }}>{data.passed}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>Passed</div>
                </div>
                <div className="text-center">
                  <div className="font-bold" style={{ color: "hsl(2, 45%, 62%)" }}>{data.total - data.passed}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>Failed</div>
                </div>
                <div className="text-center">
                  <div className="font-bold">{data.total}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>Total</div>
                </div>
              </div>

              <div className="w-full mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${score}%`, background: fw.color }}
                />
              </div>

              <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>{fw.description}</p>
            </div>
          );
        })}
      </div>

      {/* Cross-framework callout */}
      <div
        className="glass p-5"
        style={{ borderLeft: "3px solid var(--accent)" }}
      >
        <h4 className="font-semibold mb-1">Why Multi-Framework Matters</h4>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Most compliance tools check one framework at a time. Our CES algorithm identifies controls that satisfy
          multiple frameworks simultaneously — fixing MFA alone satisfies <strong>SOC 2 CC6.1</strong>,{" "}
          <strong>ISO 27001 A.9.4.2</strong>, <strong>HIPAA §164.312(d)</strong>, and{" "}
          <strong>DPDP §8(1)</strong> at once. One fix, four frameworks.
        </p>
        <div className="flex gap-6 mt-3">
          {FRAMEWORKS.map((fw) => {
            const data = frameworkScores[fw.key];
            return (
              <div key={fw.key} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: fw.color }} />
                <span className="text-sm">
                  <span className="font-medium" style={{ color: fw.color }}>{fw.label}</span>
                  <span style={{ color: "var(--text-muted)" }}> {data?.score}%</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
