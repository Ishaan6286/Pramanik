import { useState } from "react";
import { Shield, ArrowLeft, CheckCircle, XCircle, BarChart3, FileText, Download } from "lucide-react";
import ControlCard from "./ControlCard";
import PolicyViewer from "./PolicyViewer";
import PDFExport from "./PDFExport";

export default function Dashboard({ data, config, onReset }) {
  const [activeTab, setActiveTab] = useState("controls");

  const scoreColor = data.score >= 70 ? "text-green-400" : data.score >= 40 ? "text-yellow-400" : "text-red-400";
  const scoreBg = data.score >= 70 ? "bg-green-950/30 border-green-800" : data.score >= 40 ? "bg-yellow-950/30 border-yellow-800" : "bg-red-950/30 border-red-800";

  const criticalCount = data.results.filter(r => r.severity === "CRITICAL").length;
  const highCount = data.results.filter(r => r.severity === "HIGH").length;
  const mediumCount = data.results.filter(r => r.severity === "MEDIUM").length;

  return (
    <div className="min-h-screen pb-12">
      {/* Top Bar */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onReset} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Shield className="w-6 h-6 text-blue-400" />
          <h1 className="text-xl font-bold">SOC2 Analyzer</h1>
          <span className="text-gray-500">|</span>
          <span className="text-gray-400">{data.company_name}</span>
        </div>
        <PDFExport data={data} />
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-8">
        {/* Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Main Score */}
          <div className={`border rounded-xl p-6 text-center ${scoreBg}`}>
            <div className={`text-5xl font-bold ${scoreColor}`}>{data.score}%</div>
            <div className="text-gray-400 text-sm mt-1">Compliance Score</div>
            <div className="text-gray-500 text-xs mt-1">{data.passed}/{data.total} controls passed</div>
          </div>

          {/* Severity Counts */}
          <div className="border border-red-900/50 bg-red-950/10 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-red-400">{criticalCount}</div>
            <div className="text-gray-400 text-sm mt-1">Critical Issues</div>
          </div>
          <div className="border border-orange-900/50 bg-orange-950/10 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-orange-400">{highCount}</div>
            <div className="text-gray-400 text-sm mt-1">High Issues</div>
          </div>
          <div className="border border-yellow-900/50 bg-yellow-950/10 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-yellow-400">{mediumCount}</div>
            <div className="text-gray-400 text-sm mt-1">Medium Issues</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("controls")}
            className={`px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all ${
              activeTab === "controls"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Control Results ({data.total})
          </button>
          <button
            onClick={() => setActiveTab("policies")}
            className={`px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all ${
              activeTab === "policies"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            <FileText className="w-4 h-4" />
            Policy Documents
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "controls" ? (
          <div className="space-y-3">
            {data.results.map((control) => (
              <ControlCard key={control.id} control={control} />
            ))}
          </div>
        ) : (
          <PolicyViewer companyName={data.company_name} config={config} />
        )}
      </div>
    </div>
  );
}
