import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, AlertTriangle, CheckCircle2,
  LogOut, ChevronRight, Zap, Globe, MoreHorizontal, LayoutGrid,
  RefreshCw, ArrowRight, BarChart3, TrendingUp, HelpCircle, FileText, GitCompare
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

// Functional Components from main
import ControlCard from "./ControlCard";
import PolicyViewer from "./PolicyViewer";
import PDFExport from "./PDFExport";
import BenchmarkCard from "./BenchmarkCard";
import AuditPrep from "./AuditPrep";
import PriorityFix from "./PriorityFix";
import FrameworkScores from "./FrameworkScores";

import PramanikDiagram from "./PramanikDiagram";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.2, 0, 0, 1] } }
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } }
};

export default function Dashboard({ data, config, onReset, user, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [workspaceTab, setWorkspaceTab] = useState("controls");

  const score = data?.score || 92;
  const criticalGaps = data?.gaps || 2;
  const userName = user?.split('@')[0] || "Pratyush";

  const navItems = [
    { id: "overview",  label: "Overview",   icon: LayoutGrid },
    { id: "audits",    label: "Compliance", icon: Shield },
    { id: "topology",  label: "Topology",   icon: Globe },
  ];

  const workspaceTabs = [
    { id: "controls",   label: `Controls (${data?.total || 0})`, icon: BarChart3 },
    { id: "benchmark",  label: "Benchmark",   icon: TrendingUp },
    { id: "priority",   label: "Priority Fix", icon: Zap },
    { id: "frameworks", label: "Frameworks",   icon: Globe },
    { id: "audit",      label: "Audit Prep",   icon: HelpCircle },
    { id: "policies",   label: "Policies",     icon: FileText },

  ];

  return (
    <div className="min-h-screen bg-[hsl(var(--col-bg))] text-[hsl(var(--col-text))] pb-40 relative font-display">

      {/* ── Ambient Pattern — very subtle ── */}
      <div className="absolute inset-0 z-0 bg-pattern-dots opacity-[0.07] pointer-events-none" />

      {/* ── TOP HEADER — fully theme-aware ── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[hsl(var(--col-border))] bg-[hsl(var(--col-bg)/0.90)] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="flex items-center">
              <span className="font-extrabold text-[22px] tracking-tight text-[hsl(var(--col-primary))]">Pramanik</span>
            </div>

            <nav className="hidden md:flex items-center gap-0.5 ml-4 pl-5 border-l border-[hsl(var(--col-border))]">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all ${activeTab === item.id
                    ? 'bg-[hsl(var(--col-primary)/0.09)] text-[hsl(var(--col-primary))]'
                    : 'text-[hsl(var(--col-muted))] hover:text-[hsl(var(--col-text))] hover:bg-[hsl(var(--col-primary)/0.04)]'}`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-[hsl(var(--col-accent))] bg-[hsl(var(--col-accent)/0.06)] px-3 py-1 rounded-full border border-[hsl(var(--col-accent)/0.12)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--col-accent))]" />
              Core Active
            </div>
            <ThemeToggle />
            <div className="w-px h-4 bg-[hsl(var(--col-border))]" />
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[hsl(var(--col-primary)/0.1)] border border-[hsl(var(--col-primary)/0.18)] flex items-center justify-center text-[11px] font-bold text-[hsl(var(--col-primary))] uppercase">
                {userName.substring(0, 1)}
              </div>
              <button onClick={onLogout} className="text-[hsl(var(--col-muted))] hover:text-[hsl(var(--col-primary))] transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN WORKSPACE ── */}
      <main className="max-w-7xl mx-auto px-6 pt-28 relative z-10">
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-7">

          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-[28px] font-bold tracking-tight">
                {activeTab === "overview" && `Welcome back, ${userName}`}
                {activeTab === "audits" && `Compliance Frameworks`}
                {activeTab === "topology" && `Cloud Topology Map`}
              </h1>
              <p className="text-[13px] text-[hsl(var(--col-muted))] mt-1 font-normal">
                {activeTab === "overview" && `Compliance review — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                {activeTab === "audits" && `Cross-framework compliance scoring and methodology`}
                {activeTab === "topology" && `Visualizing data flow from AWS Config to Compliance Artifacts`}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <PDFExport data={data} />
              <button onClick={onReset} className="btn-primary py-2 px-5 text-[13px] flex items-center gap-1.5">
                New Audit <ArrowRight size={13} />
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="space-y-7"
              >
                {/* Top KPI Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                  {/* Score Metric */}
                  <motion.div variants={fadeUp} className="surface-raise rounded-2xl p-6 flex flex-col justify-between h-[172px] cursor-default">
                    <p className="text-[11px] font-bold text-[hsl(var(--col-muted))] uppercase tracking-widest flex items-center justify-between">
                      System Trust Score
                      <Shield className="w-3.5 h-3.5 opacity-30 text-[hsl(var(--col-primary))]" />
                    </p>
                    <div className="flex items-end gap-2 mt-2">
                      <h3 className="text-[52px] font-black leading-[1] text-[hsl(var(--col-primary))]">{score}</h3>
                      <span className="text-[16px] text-[hsl(var(--col-muted))] mb-1.5 font-medium select-none opacity-40">/ 100</span>
                    </div>
                    <div className="w-full bg-[hsl(var(--col-border))] h-1 rounded-full mt-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
                        className="h-full bg-[hsl(var(--col-primary))] opacity-40 rounded-full"
                      />
                    </div>
                  </motion.div>

                  {/* Vulnerability Metric */}
                  <motion.div variants={fadeUp} className={`surface-raise rounded-2xl p-6 flex flex-col justify-between h-[172px] border transition-all ${criticalGaps > 0 ? 'border-red-100 dark:border-red-900/30' : 'border-[hsl(var(--col-border))]'}`}>
                    <p className="text-[11px] font-bold text-[hsl(var(--col-muted))] uppercase tracking-widest flex items-center justify-between">
                      Critical Gaps
                      {criticalGaps > 0
                        ? <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                        : <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--col-accent))]" />
                      }
                    </p>
                    <div className="flex items-end gap-2">
                      <h3 className={`text-[52px] font-black leading-[1] ${criticalGaps > 0 ? 'text-red-500' : 'text-[hsl(var(--col-accent))]'}`}>{criticalGaps}</h3>
                      <span className="text-[11px] text-[hsl(var(--col-muted))] mb-2 uppercase tracking-widest font-bold opacity-40">Gaps</span>
                    </div>
                    <p className={`text-[11px] font-medium ${criticalGaps > 0 ? 'text-red-400' : 'text-[hsl(var(--col-accent))]'}`}>
                      {criticalGaps > 0 ? 'Urgent attention required in 2 modules' : 'System posture is healthy'}
                    </p>
                  </motion.div>

                  {/* Action Card */}
                  <motion.div variants={fadeUp} className="surface-raise rounded-2xl p-6 flex flex-col justify-between h-[172px]">
                    <div className="space-y-0.5">
                      <p className="text-[14px] font-semibold text-[hsl(var(--col-text))]">Manifest Synced</p>
                      <p className="text-[12px] text-[hsl(var(--col-muted))] font-normal">Core validated 4 mins ago</p>
                    </div>
                    <div className="flex gap-2.5">
                      <button onClick={() => window.location.reload()} className="btn-primary flex-1 !py-2.5 text-[12px] rounded-[10px] outline-none">
                        <RefreshCw className="w-3.5 h-3.5 mr-1" /> Re-Scan
                      </button>
                      <button className="btn-secondary !py-2.5 px-4 text-[12px] rounded-[10px]">
                        More
                      </button>
                    </div>
                  </motion.div>
                </div>

                {/* ── WORKSPACE INTERFACE ── */}
                <div className="space-y-5">
                  {/* Workspace Tabs — scrollable */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {workspaceTabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setWorkspaceTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all border
                          ${workspaceTab === tab.id
                            ? 'bg-[hsl(var(--col-primary)/0.09)] text-[hsl(var(--col-primary))] border-[hsl(var(--col-primary)/0.22)]'
                            : 'bg-[hsl(var(--col-surface))] text-[hsl(var(--col-muted))] border-[hsl(var(--col-border))] hover:bg-[hsl(var(--col-raise))] hover:text-[hsl(var(--col-text))] hover:border-[hsl(var(--col-primary)/0.16)]'}`}
                      >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content Display Area */}
                  <motion.div key={workspaceTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="min-h-[400px]">
                    {workspaceTab === "controls" && (
                      <div className="space-y-3">
                        {data?.results?.map((control) => (
                          <ControlCard key={control.id} control={control} />
                        ))}
                        {(!data?.results || data.results.length === 0) && (
                          <div className="surface-raise p-16 rounded-2xl text-center">
                            <p className="text-[hsl(var(--col-muted))] font-normal italic text-[14px]">No controls generated for this manifest.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {workspaceTab === "benchmark" && (
                      <BenchmarkCard benchmark={data?.benchmark} />
                    )}

                    {workspaceTab === "priority" && (
                      <PriorityFix priorityFixes={data?.priority_fixes} currentScore={data?.score} />
                    )}

                    {workspaceTab === "frameworks" && (
                      <FrameworkScores frameworkScores={data?.framework_scores} />
                    )}

                    {workspaceTab === "audit" && (
                      <AuditPrep
                        companyName={data?.company_name || userName}
                        failedControls={data?.results?.filter(r => !r.passed) || []}
                      />
                    )}

                    {workspaceTab === "policies" && (
                      <div className="surface-raise p-7 rounded-2xl border border-[hsl(var(--col-border))]">
                        <PolicyViewer companyName={data?.company_name || userName} config={config} />
                      </div>
                    )}


                  </motion.div>
                </div>
              </motion.div>
            )}

            {activeTab === "audits" && (
              <motion.div
                key="compliance"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="surface-raise p-7 rounded-2xl border border-[hsl(var(--col-border))] min-h-[500px]">
                  <h3 className="text-[17px] font-bold mb-5 tracking-tight">Framework Audit Readiness</h3>
                  <FrameworkScores frameworkScores={data?.framework_scores || {}} />

                  <div className="mt-10 p-5 rounded-xl bg-[hsl(var(--col-primary)/0.04)] border border-[hsl(var(--col-primary)/0.1)]">
                    <h4 className="font-semibold text-[14px] mb-2">Audit Methodology</h4>
                    <p className="text-[13px] text-[hsl(var(--col-muted))] leading-relaxed">
                      Pramanik evaluates your infrastructure using the AICPA Trust Services Criteria (SOC 2), ISO 27001 Annex A, and HIPAA Security Rule requirements.
                      Scores are calculated based on control operating effectiveness and evidence availability.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "topology" && (
              <motion.div
                key="topology"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="surface-raise p-7 rounded-2xl border border-[hsl(var(--col-border))] min-h-[600px] flex flex-col items-center">
                  <div className="text-center mb-8">
                    <h3 className="text-[17px] font-bold tracking-tight">Cloud Compliance Pipeline</h3>
                    <p className="text-[13px] text-[hsl(var(--col-muted))] mt-1">Full-pipeline mapping from AWS Configuration to Regulatory Artifacts</p>
                  </div>
                  <div className="w-full max-w-4xl">
                    <PramanikDiagram />
                  </div>
                  <div className="grid grid-cols-3 gap-8 w-full mt-10 border-t border-[hsl(var(--col-border))] pt-8">
                    <div className="text-center">
                      <div className="text-[22px] font-black text-[hsl(var(--col-primary))]">120</div>
                      <div className="text-[10px] font-bold text-[hsl(var(--col-muted))] uppercase tracking-widest mt-0.5">AWS Config Nodes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[22px] font-black text-[hsl(var(--col-accent))]">400+</div>
                      <div className="text-[10px] font-bold text-[hsl(var(--col-muted))] uppercase tracking-widest mt-0.5">Telemetry Feeds</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[22px] font-black text-[hsl(var(--col-text))]">Instant</div>
                      <div className="text-[10px] font-bold text-[hsl(var(--col-muted))] uppercase tracking-widest mt-0.5">Artifact Update</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </main>
    </div>
  );
}
