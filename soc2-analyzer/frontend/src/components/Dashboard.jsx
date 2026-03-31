import { useState } from "react";
import { Shield, ArrowLeft, BarChart3, FileText, TrendingUp, HelpCircle, LogOut, Zap, Globe, GitCompare } from "lucide-react";
import ControlCard from "./ControlCard";
import PolicyViewer from "./PolicyViewer";
import PDFExport from "./PDFExport";
import BenchmarkCard from "./BenchmarkCard";
import AuditPrep from "./AuditPrep";
import ThemeToggle from "./ThemeToggle";
import PriorityFix from "./PriorityFix";
import FrameworkScores from "./FrameworkScores";
import DriftView from "./DriftView";

export default function Dashboard({ data, config, onReset, user, onLogout }) {
  const [activeTab, setActiveTab] = useState("controls");

  const scoreColor = data.score >= 70 ? "#22c55e" : data.score >= 40 ? "#eab308" : "#ef4444";
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (data.score / 100) * circumference;

  const criticalCount = data.results.filter(r => r.severity === "CRITICAL").length;
  const highCount = data.results.filter(r => r.severity === "HIGH").length;
  const mediumCount = data.results.filter(r => r.severity === "MEDIUM").length;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <button onClick={onReset} className="hover:opacity-70" style={{ color: "var(--text-secondary)" }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Shield className="w-5 h-5" style={{ color: "var(--accent)" }} />
          <span className="font-bold">SOC2 Analyzer</span>
          <span style={{ color: "var(--text-muted)" }}>|</span>
          <span style={{ color: "var(--text-secondary)" }} className="text-sm">{data.company_name}</span>
        </div>
        <div className="flex items-center gap-3">
          <PDFExport data={data} />
          <ThemeToggle />
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 rounded-lg hover:opacity-80"
              style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-8">
        {/* Score Section */}
        <div className="glass p-6 mb-8 fade-in">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Score Ring */}
            <div className="relative">
              <svg width="120" height="120" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border)" strokeWidth="6" />
                <circle
                  cx="50" cy="50" r="45" fill="none"
                  stroke={scoreColor} strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  className="score-ring"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold" style={{ color: scoreColor }}>{data.score}%</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              <div className="text-center p-3 rounded-lg" style={{ background: "var(--bg-hover)" }}>
                <div className="text-2xl font-bold">{data.passed}/{data.total}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>Controls Passed</div>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ background: "var(--bg-hover)" }}>
                <div className="text-2xl font-bold text-red-500">{criticalCount}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>Critical</div>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ background: "var(--bg-hover)" }}>
                <div className="text-2xl font-bold text-orange-500">{highCount}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>High</div>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ background: "var(--bg-hover)" }}>
                <div className="text-2xl font-bold text-yellow-500">{mediumCount}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>Medium</div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
              <span>{data.passed} passed</span>
              <span>{data.total - data.passed} failed</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${data.score}%`, background: scoreColor }}
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mb-6" style={{ borderBottom: "1px solid var(--border)" }}>
          <button
            onClick={() => setActiveTab("controls")}
            className="pb-3 text-sm font-medium flex items-center gap-2"
            style={{
              color: activeTab === "controls" ? "var(--accent)" : "var(--text-muted)",
              borderBottom: activeTab === "controls" ? "2px solid var(--accent)" : "2px solid transparent"
            }}
          >
            <BarChart3 className="w-4 h-4" />
            Controls ({data.total})
          </button>
          <button
            onClick={() => setActiveTab("benchmark")}
            className="pb-3 text-sm font-medium flex items-center gap-2"
            style={{
              color: activeTab === "benchmark" ? "var(--accent)" : "var(--text-muted)",
              borderBottom: activeTab === "benchmark" ? "2px solid var(--accent)" : "2px solid transparent"
            }}
          >
            <TrendingUp className="w-4 h-4" />
            Benchmark
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className="pb-3 text-sm font-medium flex items-center gap-2"
            style={{
              color: activeTab === "audit" ? "var(--accent)" : "var(--text-muted)",
              borderBottom: activeTab === "audit" ? "2px solid var(--accent)" : "2px solid transparent"
            }}
          >
            <HelpCircle className="w-4 h-4" />
            Audit Prep
          </button>
          <button
            onClick={() => setActiveTab("priority")}
            className="pb-3 text-sm font-medium flex items-center gap-2"
            style={{
              color: activeTab === "priority" ? "var(--accent)" : "var(--text-muted)",
              borderBottom: activeTab === "priority" ? "2px solid var(--accent)" : "2px solid transparent"
            }}
          >
            <Zap className="w-4 h-4" />
            Priority Fix
          </button>
          <button
            onClick={() => setActiveTab("frameworks")}
            className="pb-3 text-sm font-medium flex items-center gap-2"
            style={{
              color: activeTab === "frameworks" ? "var(--accent)" : "var(--text-muted)",
              borderBottom: activeTab === "frameworks" ? "2px solid var(--accent)" : "2px solid transparent"
            }}
          >
            <Globe className="w-4 h-4" />
            Frameworks
          </button>
          <button
            onClick={() => setActiveTab("policies")}
            className="pb-3 text-sm font-medium flex items-center gap-2"
            style={{
              color: activeTab === "policies" ? "var(--accent)" : "var(--text-muted)",
              borderBottom: activeTab === "policies" ? "2px solid var(--accent)" : "2px solid transparent"
            }}
          >
            <FileText className="w-4 h-4" />
            Policies
          </button>
          <button
            onClick={() => setActiveTab("drift")}
            className="pb-3 text-sm font-medium flex items-center gap-2"
            style={{
              color: activeTab === "drift" ? "var(--accent)" : "var(--text-muted)",
              borderBottom: activeTab === "drift" ? "2px solid var(--accent)" : "2px solid transparent"
            }}
          >
            <GitCompare className="w-4 h-4" />
            Drift
          </button>
        </div>

        {/* Tab Content */}
        <div className="pb-12">
          {activeTab === "controls" && (
            <div className="space-y-3">
              {data.results.map((control) => (
                <ControlCard key={control.id} control={control} />
              ))}
            </div>
          )}
          {activeTab === "benchmark" && (
            <BenchmarkCard benchmark={data.benchmark} />
          )}
          {activeTab === "priority" && (
            <PriorityFix priorityFixes={data.priority_fixes} currentScore={data.score} />
          )}
          {activeTab === "frameworks" && (
            <FrameworkScores frameworkScores={data.framework_scores} />
          )}
          {activeTab === "audit" && (
            <AuditPrep
              companyName={data.company_name}
              failedControls={data.results.filter(r => !r.passed)}
            />
          )}
          {activeTab === "policies" && (
            <PolicyViewer companyName={data.company_name} config={config} />
          )}
          {activeTab === "drift" && (
            <DriftView companyName={data.company_name} config={config} />
          )}
        </div>
      </div>
    </div>
  );
}
