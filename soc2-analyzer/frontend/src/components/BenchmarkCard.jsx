import { TrendingUp, Users, Award, AlertTriangle } from "lucide-react";

const ratingColors = {
  "Excellent": "#22c55e",
  "Above Average": "#3b82f6",
  "Below Average": "#f97316",
  "Needs Immediate Action": "#ef4444",
};

export default function BenchmarkCard({ benchmark }) {
  if (!benchmark) return null;

  const color = ratingColors[benchmark.rating] || "#3b82f6";
  const barWidth = Math.min(100, benchmark.percentile);

  return (
    <div className="glass p-6 fade-in">
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp className="w-5 h-5" style={{ color: "var(--accent)" }} />
        <h3 className="font-semibold text-lg">Industry Benchmark</h3>
      </div>

      {/* Main comparison */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Your position */}
        <div>
          {/* Rating badge */}
          <div
            className="inline-block px-3 py-1 rounded-full text-sm font-semibold mb-3"
            style={{ background: `${color}20`, color }}
          >
            {benchmark.rating}
          </div>

          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
            {benchmark.message}
          </p>

          {/* Percentile bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
              <span>Your percentile</span>
              <span className="font-semibold" style={{ color }}>{benchmark.percentile}th</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
              <div
                className="h-full rounded-full relative"
                style={{ width: `${barWidth}%`, background: color }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              <span>Bottom</span>
              <span>Top</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-3">
            <div className="flex-1 p-3 rounded-lg text-center" style={{ background: "var(--bg-hover)" }}>
              <div className="text-xl font-bold" style={{ color }}>{benchmark.your_score}%</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Your Score</div>
            </div>
            <div className="flex-1 p-3 rounded-lg text-center" style={{ background: "var(--bg-hover)" }}>
              <div className="text-xl font-bold" style={{ color: "var(--text-secondary)" }}>{benchmark.industry_avg}%</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Industry Avg</div>
            </div>
            <div className="flex-1 p-3 rounded-lg text-center" style={{ background: "var(--bg-hover)" }}>
              <div className="text-xl font-bold" style={{ color: "var(--text-secondary)" }}>{benchmark.top_quartile}%</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Top 25%</div>
            </div>
          </div>
        </div>

        {/* Right: Industry comparison */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            <span className="text-sm font-medium">vs. {benchmark.industry}</span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              (n={benchmark.sample_size})
            </span>
          </div>

          {/* All industries comparison */}
          <div className="space-y-2.5">
            {Object.entries(benchmark.all_industries).map(([key, ind]) => {
              const isYours = ind.label === benchmark.industry;
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: isYours ? "var(--accent)" : "var(--text-muted)", fontWeight: isYours ? 600 : 400 }}>
                      {ind.label} {isYours && "(You)"}
                    </span>
                    <span style={{ color: "var(--text-muted)" }}>{ind.avg_score}% avg</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${ind.avg_score}%`,
                        background: isYours ? "var(--accent)" : "var(--text-muted)",
                        opacity: isYours ? 1 : 0.4,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Your score marker */}
          <div className="mt-3 p-2 rounded-lg flex items-center gap-2" style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
            <Award className="w-4 h-4" style={{ color }} />
            <span className="text-xs" style={{ color }}>
              Your score ({benchmark.your_score}%) is {benchmark.your_score >= benchmark.industry_avg ? "above" : "below"} the {benchmark.industry} average ({benchmark.industry_avg}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
