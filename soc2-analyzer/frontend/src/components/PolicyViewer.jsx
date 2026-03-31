import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";

export default function PolicyViewer({ companyName, config }) {
  const [policies, setPolicies] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activePolicy, setActivePolicy] = useState(0);

  const generatePolicies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: companyName, aws_config: config })
      });
      if (!response.ok) throw new Error('Policy generation failed');
      const data = await response.json();
      setPolicies(data.policies);
    } catch (err) {
      setError('Failed to generate policies: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!policies) {
    return (
      <div className="glass p-10 text-center fade-in">
        <FileText className="w-14 h-14 mx-auto mb-4" style={{ color: "var(--accent)" }} />
        <h3 className="text-xl font-semibold mb-2">Generate SOC 2 Policies</h3>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          AI will create audit-ready policy documents tailored to {companyName}
        </p>
        <button
          onClick={generatePolicies}
          disabled={loading}
          className="px-6 py-3 rounded-lg font-semibold text-white inline-flex items-center gap-2"
          style={{ background: "var(--accent)" }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Generate Policies
            </>
          )}
        </button>
        {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Policy Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {policies.map((policy, i) => (
          <button
            key={i}
            onClick={() => setActivePolicy(i)}
            className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
            style={{
              background: activePolicy === i ? "var(--accent)" : "var(--bg-hover)",
              color: activePolicy === i ? "white" : "var(--text-secondary)",
            }}
          >
            {policy.title}
          </button>
        ))}
      </div>

      {/* Policy Content — document-like feel */}
      <div className="glass p-8">
        <h3 className="text-xl font-bold mb-1">{policies[activePolicy].title}</h3>
        <div className="h-0.5 rounded mb-6" style={{ background: "var(--accent)", width: "60px" }} />
        <div
          className="text-sm leading-relaxed whitespace-pre-wrap"
          style={{ color: "var(--text-secondary)" }}
        >
          {policies[activePolicy].content}
        </div>
      </div>
    </div>
  );
}
