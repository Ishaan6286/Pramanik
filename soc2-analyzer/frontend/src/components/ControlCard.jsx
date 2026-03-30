import { useState } from "react";
import { CheckCircle, XCircle, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

const severityColors = {
  CRITICAL: "text-red-400 bg-red-950 border-red-800",
  HIGH: "text-orange-400 bg-orange-950 border-orange-800",
  MEDIUM: "text-yellow-400 bg-yellow-950 border-yellow-800",
};

export default function ControlCard({ control }) {
  const [expanded, setExpanded] = useState(!control.passed);

  return (
    <div
      className={`border rounded-xl p-5 transition-all ${
        control.passed
          ? "border-green-800 bg-green-950/20"
          : "border-red-800/50 bg-red-950/10"
      }`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {control.passed ? (
            <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
          ) : (
            <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-gray-400">{control.id}</span>
              <h3 className="font-semibold text-lg">{control.title}</h3>
            </div>
            <p className="text-gray-500 text-sm">{control.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {control.severity && (
            <span className={`text-xs px-2 py-1 rounded-full border ${severityColors[control.severity]}`}>
              {control.severity}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && !control.passed && (
        <div className="mt-4 space-y-4 pl-9">
          {/* Issues */}
          <div>
            <h4 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" /> Issues Found
            </h4>
            <ul className="space-y-1">
              {control.issues.map((issue, i) => (
                <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  {issue}
                </li>
              ))}
            </ul>
          </div>

          {/* Risk Explanation */}
          {control.risk_explanation && (
            <div className="bg-gray-900 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-yellow-400 mb-1">Why This Matters</h4>
              <p className="text-gray-300 text-sm">{control.risk_explanation}</p>
            </div>
          )}

          {/* Fix Steps */}
          {control.fix_steps?.length > 0 && (
            <div className="bg-gray-900 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-400 mb-2">How to Fix</h4>
              <ol className="space-y-1">
                {control.fix_steps.map((step, i) => (
                  <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                    <span className="text-blue-400 font-mono text-xs mt-0.5">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Business Impact */}
          {control.business_impact && (
            <div className="bg-red-950/30 border border-red-900 rounded-lg p-3">
              <p className="text-red-300 text-sm">
                <span className="font-semibold">Business Impact: </span>
                {control.business_impact}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
