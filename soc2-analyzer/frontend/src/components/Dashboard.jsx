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
import DriftView from "./DriftView";

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.2, 0, 0, 1] } }
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

export default function Dashboard({ data, config, onReset, user, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [workspaceTab, setWorkspaceTab] = useState("controls");

  const score = data?.score || 92;
  const criticalGaps = data?.gaps || 2;
  const userName = user?.split('@')[0] || "Pratyush";

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutGrid },
    { id: "audits", label: "Compliance", icon: Shield },
    { id: "topology", label: "Topology", icon: Globe },
  ];

  const workspaceTabs = [
    { id: "controls", label: `Controls (${data?.total || 0})`, icon: BarChart3 },
    { id: "benchmark", label: "Benchmark", icon: TrendingUp },
    { id: "priority", label: "Priority Fix", icon: Zap },
    { id: "frameworks", label: "Frameworks", icon: Globe },
    { id: "audit", label: "Audit Prep", icon: HelpCircle },
    { id: "policies", label: "Policies", icon: FileText },
    { id: "drift", label: "Drift Analysis", icon: GitCompare },
  ];

  return (
    <div className="min-h-screen bg-[hsl(var(--col-bg))] text-[hsl(var(--col-text))] pb-40 relative selection:bg-[hsl(var(--col-primary)/0.12)] font-display">

      {/* ── Ambient Pattern ── */}
      <div className="absolute inset-0 z-0 bg-pattern-plus opacity-[0.18] pointer-events-none" />

      {/* ── TOP HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[hsl(var(--col-border))] bg-white/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-[hsl(var(--col-border))] bg-[hsl(var(--col-primary)/0.10)]">
                <Shield className="w-4.5 h-4.5 text-[hsl(var(--col-primary))]" />
              </div>
              <h2 className="font-bold tracking-tight text-[16px] uppercase">Pramanik</h2>
            </div>

            <nav className="hidden md:flex items-center gap-1 ml-6 pl-6 border-l border-[hsl(var(--col-border))]">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all ${activeTab === item.id ? 'bg-[hsl(var(--col-primary)/0.1)] text-[hsl(var(--col-primary))]' : 'text-[hsl(var(--col-muted))] hover:text-[hsl(var(--col-text))] hover:bg-[hsl(var(--col-primary)/0.03)]'}`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 mr-4 text-[12px] font-bold text-[hsl(var(--col-accent))] bg-[hsl(var(--col-accent)/0.06)] px-3 py-1 rounded-full border border-[hsl(var(--col-accent)/0.10)]">
              <span className="w-2 h-2 rounded-full bg-[hsl(var(--col-accent))]" /> Core Active
            </div>
            <ThemeToggle />
            <div className="w-px h-5 bg-[hsl(var(--col-border))]" />
            <div className="flex items-center gap-3 pl-2 group cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-[hsl(var(--col-primary)/0.1)] border border-[hsl(var(--col-primary)/0.2)] flex items-center justify-center text-[11px] font-black text-[hsl(var(--col-primary))] uppercase">
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
      <main className="max-w-7xl mx-auto px-6 pt-32 relative z-10">
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-8">

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
            <div>
              <h1 className="text-[32px] font-bold tracking-tighter">
                {activeTab === "overview" && `Welcome back, ${userName}`}
                {activeTab === "audits" && `Compliance Frameworks`}
                {activeTab === "topology" && `Cloud Topology Map`}
              </h1>
              <p className="text-[14px] text-[hsl(var(--col-muted))] mt-1 font-medium italic opacity-80">
                {activeTab === "overview" && `Autonomous Trust Audit — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                {activeTab === "audits" && `Cross-framework compliance scoring and methodology`}
                {activeTab === "topology" && `Visualizing data flow from AWS Config to Compliance Artifacts`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <PDFExport data={data} />
              <button onClick={onReset} className="btn-primary py-2.5 px-6 text-[13px] flex items-center gap-2">
                New Audit <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Top KPI Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Score Metric */}
                  <motion.div variants={fadeUp} className="surface-raise rounded-2xl p-7 flex flex-col justify-between h-[180px] hover:border-[hsl(var(--col-primary)/0.4)] transition-all">
                    <p className="text-[12px] font-bold text-[hsl(var(--col-muted))] uppercase tracking-widest flex items-center justify-between">
                      System Trust Score
                      <Shield className="w-4 h-4 opacity-30 text-[hsl(var(--col-primary))]" />
                    </p>
                    <div className="flex items-end gap-3 mt-4">
                      <h3 className="text-[56px] font-black leading-[1] text-[hsl(var(--col-primary))]">{score}</h3>
                      <span className="text-[18px] text-[hsl(var(--col-muted))] mb-2 font-bold select-none opacity-40">/ 100</span>
                    </div>
                    <div className="w-full bg-[hsl(var(--col-border))] h-1.5 rounded-full mt-4 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-[hsl(var(--col-primary)/0.45)]"
                      />
                    </div>
                  </motion.div>

                  {/* Vulnerability Metric */}
                  <motion.div variants={fadeUp} className={`surface-raise rounded-2xl p-7 flex flex-col justify-between h-[180px] border transition-all ${criticalGaps > 0 ? 'bg-[#fff5f5]/50 border-red-100' : 'bg-[#f0fdfa]/50 border-teal-100'}`}>
                    <p className="text-[12px] font-bold text-[hsl(var(--col-muted))] uppercase tracking-widest flex items-center justify-between">
                      Critical Gaps
                      {criticalGaps > 0 ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-[hsl(var(--col-accent))]" />}
                    </p>
                    <div className="flex items-end gap-3">
                      <h3 className={`text-[56px] font-black leading-[1] ${criticalGaps > 0 ? 'text-red-500' : 'text-[hsl(var(--col-accent))]'}`}>{criticalGaps}</h3>
                      <span className="text-[12px] text-[hsl(var(--col-muted))] mb-3 uppercase tracking-widest font-black opacity-40">Gaps Detected</span>
                    </div>
                    <p className={`text-[11px] font-bold ${criticalGaps > 0 ? 'text-red-400' : 'text-teal-500'}`}>
                      {criticalGaps > 0 ? 'Urgent attention required in 2 modules' : 'System posture is healthy'}
                    </p>
                  </motion.div>

                  {/* Action Card */}
                  <motion.div variants={fadeUp} className="surface-raise rounded-2xl p-7 flex flex-col justify-between h-[180px] bg-white">
                    <div className="space-y-1">
                      <p className="text-[15px] font-bold text-[hsl(var(--col-text))]">Manifest Synced</p>
                      <p className="text-[13px] text-[hsl(var(--col-muted))] font-medium">Core validated 4 mins ago</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => window.location.reload()} className="btn-primary flex-1 !py-3 text-[13px] rounded-xl outline-none">
                        <RefreshCw className="w-3.5 h-3.5 mr-1" /> Re-Scan
                      </button>
                      <button className="btn-secondary !py-3 px-4 text-[13px] rounded-xl">
                        More
                      </button>
                    </div>
                  </motion.div>
                </div>

                {/* ── CENTRAL WORKSPACE INTERFACE ── */}
                <div className="space-y-6">
                  {/* Workspace Tabs */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
                    {workspaceTabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setWorkspaceTab(tab.id)}
                        className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all border
                          ${workspaceTab === tab.id
                            ? 'bg-[hsl(var(--col-primary)/0.08)] text-[hsl(var(--col-primary))] border-[hsl(var(--col-primary)/0.22)]'
                            : 'bg-white/55 text-[hsl(var(--col-muted))] border-[hsl(var(--col-border))] hover:bg-white/70 hover:text-[hsl(var(--col-text))] hover:border-[hsl(var(--col-primary)/0.18)]'}`}
                      >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content Display Area */}
                  <motion.div key={workspaceTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="min-h-[400px]">
                    {workspaceTab === "controls" && (
                      <div className="space-y-4">
                        {data?.results?.map((control) => (
                          <ControlCard key={control.id} control={control} />
                        ))}
                        {(!data?.results || data.results.length === 0) && (
                          <div className="surface-raise p-20 rounded-3xl text-center">
                            <p className="text-[hsl(var(--col-muted))] font-medium italic">No controls generated for this manifest.</p>
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
                      <div className="surface-raise p-8 rounded-3xl bg-white border border-[hsl(var(--col-border))]">
                        <PolicyViewer companyName={data?.company_name || userName} config={config} />
                      </div>
                    )}

                    {workspaceTab === "drift" && (
                      <div className="surface-raise p-8 rounded-3xl bg-white border border-[hsl(var(--col-border))]">
                        <DriftView companyName={data?.company_name || userName} config={config} />
                      </div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            )}

            {activeTab === "audits" && (
              <motion.div
                key="compliance"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="surface-raise p-8 rounded-3xl bg-white border border-[hsl(var(--col-border))] min-h-[500px]">
                  <h3 className="text-xl font-bold mb-6">Framework Audit Readiness</h3>
                  <FrameworkScores frameworkScores={data?.framework_scores || {}} />

                  <div className="mt-12 p-6 rounded-2xl bg-[hsl(var(--col-primary)/0.03)] border border-[hsl(var(--col-primary)/0.1)]">
                    <h4 className="font-bold text-[15px] mb-2">Audit Methodology</h4>
                    <p className="text-sm text-[hsl(var(--col-muted))] leading-relaxed">
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="surface-raise p-8 rounded-3xl bg-white border border-[hsl(var(--col-border))] min-h-[600px] flex flex-col items-center">
                  <div className="text-center mb-10">
                    <h3 className="text-xl font-bold">Cloud Compliance Pipeline</h3>
                    <p className="text-sm text-[hsl(var(--col-muted))]">Full-pipeline mapping from AWS Configuration to Regulatory Artifacts</p>
                  </div>
                  <div className="w-full max-w-4xl">
                    <PramanikDiagram />
                  </div>
                  <div className="grid grid-cols-3 gap-6 w-full mt-10 border-t border-[hsl(var(--col-border))] pt-10">
                    <div className="text-center">
                      <div className="text-xl font-black text-[hsl(var(--col-primary))]">120</div>
                      <div className="text-[10px] font-bold text-[hsl(var(--col-muted))] uppercase">AWS Config Nodes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-black text-[hsl(var(--col-accent))]">400+</div>
                      <div className="text-[10px] font-bold text-[hsl(var(--col-muted))] uppercase">Telemetry Feeds</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-black text-[hsl(var(--col-text))]">Instant</div>
                      <div className="text-[10px] font-bold text-[hsl(var(--col-muted))] uppercase">Artifact Update</div>
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
