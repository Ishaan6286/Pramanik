import { useState } from "react";
import { HelpCircle, Loader2, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, Eye, EyeOff, FileText } from "lucide-react";

export default function AuditPrep({ companyName, failedControls }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedQ, setExpandedQ] = useState(null);
  const [showGoodAnswer, setShowGoodAnswer] = useState({});
  const [showRedFlag, setShowRedFlag] = useState({});

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:3001/api/audit-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName,
          failed_controls: failedControls,
        }),
      });
      if (!response.ok) throw new Error("Failed to generate");
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError("Failed to generate audit questions: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAnswer = (key, type) => {
    if (type === "good") {
      setShowGoodAnswer((prev) => ({ ...prev, [key]: !prev[key] }));
    } else {
      setShowRedFlag((prev) => ({ ...prev, [key]: !prev[key] }));
    }
  };

  if (!data) {
    return (
      <div className="glass p-10 text-center fade-in">
        <HelpCircle className="w-14 h-14 mx-auto mb-4" style={{ color: "var(--accent)" }} />
        <h3 className="text-xl font-semibold mb-2">Audit Interview Prep</h3>
        <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
          AI generates the exact questions a SOC 2 auditor will ask based on your gaps.
        </p>
        <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>
          Includes good answers, red flags to avoid, and evidence you'll need to show.
        </p>
        <button
          onClick={generate}
          disabled={loading}
          className="px-6 py-3 rounded-lg font-semibold text-white inline-flex items-center gap-2"
          style={{ background: "var(--accent)" }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Questions...
            </>
          ) : (
            <>
              <HelpCircle className="w-4 h-4" />
              Generate Audit Questions
            </>
          )}
        </button>
        {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Audit Interview Questions</h3>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Prepare for these questions before your SOC 2 audit
          </p>
        </div>
        <div className="text-sm px-3 py-1 rounded-full" style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}>
          {data.categories?.reduce((sum, c) => sum + c.questions.length, 0)} questions
        </div>
      </div>

      {data.categories?.map((cat, ci) => (
        <div key={ci} className="glass overflow-hidden">
          {/* Category header */}
          <div className="px-5 py-3 flex items-center gap-2 font-semibold" style={{ borderBottom: "1px solid var(--border)" }}>
            <span>{cat.category}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>
              {cat.questions.length}
            </span>
          </div>

          {/* Questions */}
          <div>
            {cat.questions.map((q, qi) => {
              const key = `${ci}-${qi}`;
              const isExpanded = expandedQ === key;

              return (
                <div key={qi} style={{ borderBottom: "1px solid var(--border)" }}>
                  {/* Question */}
                  <div
                    className="px-5 py-3 flex items-start gap-3 cursor-pointer hover:opacity-80"
                    onClick={() => setExpandedQ(isExpanded ? null : key)}
                  >
                    <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--accent)" }} />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{q.question}</p>
                      {!isExpanded && (
                        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                          {q.intent}
                        </p>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                    ) : (
                      <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                    )}
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-5 pb-4 space-y-3 ml-7">
                      {/* Intent */}
                      <div className="p-3 rounded-lg" style={{ background: "var(--bg-hover)" }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: "var(--accent)" }}>
                          What the auditor is really looking for
                        </p>
                        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{q.intent}</p>
                      </div>

                      {/* Good answer */}
                      <div>
                        <button
                          onClick={() => toggleAnswer(key, "good")}
                          className="flex items-center gap-2 text-sm font-medium mb-1.5"
                          style={{ color: "#22c55e" }}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Good Answer
                          {showGoodAnswer[key] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        {showGoodAnswer[key] && (
                          <div className="p-3 rounded-lg text-sm" style={{ background: "#22c55e10", border: "1px solid #22c55e30", color: "var(--text-secondary)" }}>
                            {q.good_answer}
                          </div>
                        )}
                      </div>

                      {/* Red flag */}
                      <div>
                        <button
                          onClick={() => toggleAnswer(key, "red")}
                          className="flex items-center gap-2 text-sm font-medium mb-1.5"
                          style={{ color: "#ef4444" }}
                        >
                          <AlertTriangle className="w-4 h-4" />
                          Red Flag (avoid saying this)
                          {showRedFlag[key] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        {showRedFlag[key] && (
                          <div className="p-3 rounded-lg text-sm" style={{ background: "#ef444410", border: "1px solid #ef444430", color: "var(--text-secondary)" }}>
                            {q.red_flag}
                          </div>
                        )}
                      </div>

                      {/* Evidence needed */}
                      {q.evidence_needed?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-1.5 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                            <FileText className="w-3 h-3" /> Evidence to prepare
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {q.evidence_needed.map((ev, ei) => (
                              <span
                                key={ei}
                                className="text-xs px-2.5 py-1 rounded-full"
                                style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}
                              >
                                {ev}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
