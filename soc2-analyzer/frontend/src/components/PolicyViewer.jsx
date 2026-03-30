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
        body: JSON.stringify({
          company_name: companyName,
          aws_config: config
        })
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
      <div className="border border-gray-800 rounded-xl p-8 text-center">
        <FileText className="w-12 h-12 text-blue-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Generate SOC 2 Policies</h3>
        <p className="text-gray-500 mb-6">
          AI will create audit-ready policy documents tailored to {companyName}
        </p>
        <button
          onClick={generatePolicies}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-all flex items-center gap-2 mx-auto"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Policies...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              Generate Policies
            </>
          )}
        </button>
        {error && <p className="text-red-400 mt-4">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      {/* Policy Tabs */}
      <div className="flex gap-2 mb-4">
        {policies.map((policy, i) => (
          <button
            key={i}
            onClick={() => setActivePolicy(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activePolicy === i
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {policy.title}
          </button>
        ))}
      </div>

      {/* Policy Content */}
      <div className="border border-gray-800 rounded-xl p-6 bg-gray-900">
        <h3 className="text-xl font-bold mb-4">{policies[activePolicy].title}</h3>
        <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
          {policies[activePolicy].content}
        </div>
      </div>
    </div>
  );
}
