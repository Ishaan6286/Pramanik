import { Shield, FileText, Lock, ArrowRight, CheckCircle, Database, Bot, FileSearch, Book, Cloud, Search, List, Zap, Server, GitMerge, Activity, FolderOpen, Bell, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { lazy, Suspense, Component, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import DotGrid from "./DotGrid";
import Aurora from "./Aurora";
import BeamBackground from "./BeamBackground";
import { useTheme } from "../ThemeContext";
import PricingSection from "./PricingSection";

// Lazy-load the heavy 3D component so it doesn't block the initial render
const Hyperspeed = lazy(() => import("./Hyperspeed"));

// Error boundary — if WebGL fails, show nothing instead of crashing
class WebGLBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

const FEATURES = [
  {
    title: "LLM Multi-Agent Evaluator",
    inputs: [
      { icon: FileText, title: "Raw Policies", sub: "PDFs, CSVs", color: "col-primary" },
      { icon: Database, title: "Cloud Logs", sub: "AWS, GCP, Azure", color: "col-accent" }
    ],
    core: { icon: Bot, title: "AI Engine", sub: "Inference Core", color: "col-primary", glow: "from-[hsl(var(--col-primary))] via-[#6aeada] to-[hsl(var(--col-accent))]" },
    outputs: [
      { icon: Shield, title: "Compliance State", sub: "100% Passing", subClass: "text-emerald-500 bg-emerald-500/10", color: "col-accent" },
      { icon: FileSearch, title: "Gap Analysis", sub: "Actionable Fixes", subClass: "text-[hsl(var(--col-muted))]", color: "col-primary" }
    ]
  },
  {
    title: "Vector Knowledge Base",
    inputs: [
      { icon: Book, title: "Frameworks", sub: "SOC 2, ISO, HIPAA", color: "col-primary" },
      { icon: Cloud, title: "Prior Audits", sub: "Historical Evidence", color: "col-accent" }
    ],
    core: { icon: Database, title: "Vector DB", sub: "Semantic Search", color: "col-accent", glow: "from-[hsl(var(--col-accent))] via-[#a5b4fc] to-[hsl(var(--col-primary))]" },
    outputs: [
      { icon: Search, title: "Control Match", sub: "High Confidence", subClass: "text-blue-500 bg-blue-500/10", color: "col-accent" },
      { icon: CheckCircle, title: "Evidence Map", sub: "Auto-Linked", subClass: "text-[hsl(var(--col-muted))]", color: "col-primary" }
    ]
  },
  {
    title: "Dynamic Policy Extraction",
    inputs: [
      { icon: FileText, title: "PDF Manuals", sub: "Unstructured Data", color: "col-primary" },
      { icon: Globe, title: "Web Sources", sub: "Compliance Portals", color: "col-accent" }
    ],
    core: { icon: Zap, title: "Parser Engine", sub: "NLP Extraction", color: "col-primary", glow: "from-amber-400 via-orange-400 to-[hsl(var(--col-primary))]" },
    outputs: [
      { icon: List, title: "Structured DB", sub: "JSON formatted", subClass: "text-amber-500 bg-amber-500/10", color: "col-accent" },
      { icon: Shield, title: "Mapped Rules", sub: "Ready-to-use", subClass: "text-[hsl(var(--col-muted))]", color: "col-primary" }
    ]
  },
  {
    title: "Continuous Evidence Collection",
    inputs: [
      { icon: Server, title: "Live Infra", sub: "AWS Config", color: "col-primary" },
      { icon: GitMerge, title: "CI/CD Pipes", sub: "GitHub, GitLab", color: "col-accent" }
    ],
    core: { icon: Activity, title: "Sync Agent", sub: "Real-time Poll", color: "col-accent", glow: "from-emerald-400 via-teal-400 to-[hsl(var(--col-primary))]" },
    outputs: [
      { icon: FolderOpen, title: "Audit Folders", sub: "Auto-filed", subClass: "text-emerald-500 bg-emerald-500/10", color: "col-accent" },
      { icon: Bell, title: "Compliance Logs", sub: "Actionable", subClass: "text-[hsl(var(--col-muted))]", color: "col-primary" }
    ]
  }
];

export default function LandingPage({ onGetStarted, onChat }) {
  const { dark } = useTheme();
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const activeFeature = FEATURES[activeFeatureIndex];

  return (
    <div className="min-h-screen bg-[hsl(var(--col-bg))] text-[hsl(var(--col-text))]">

      {/* Radiant beam background — dark mode only */}
      {dark && <BeamBackground />}

      {/* ══ NAV ══ */}
      <nav className="sticky top-0 z-40 w-full bg-[hsl(var(--col-bg)/0.88)] backdrop-blur-md border-b border-[hsl(var(--col-border))]">
        <div className="max-w-[1280px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
            <span className="font-extrabold text-[22px] tracking-tight text-[hsl(var(--col-primary))]">Pramanik</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={onGetStarted}
              className="btn-solid h-9 px-5 text-[13px]"
            >
              Login
            </button>
          </div>
        </div>
      </nav>

      {/* ══ HERO SECTION ══ */}
      <section className="relative pt-24 pb-24 overflow-hidden bg-[hsl(var(--col-bg))] min-h-[86vh] flex flex-col items-center justify-center text-center border-b border-[hsl(var(--col-border))]">

        {/* Dynamic Background */}
        {dark ? (
          <>
            <WebGLBoundary>
              <Suspense fallback={null}>
                <Hyperspeed speed={1.0} />
              </Suspense>
            </WebGLBoundary>
            {/* Dark overlay so text stays fully legible */}
            <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--col-bg)/0.60)] via-[hsl(var(--col-bg)/0.40)] to-[hsl(var(--col-bg))] pointer-events-none z-[1]" />
          </>
        ) : (
          <div className="absolute inset-0 pointer-events-auto z-0" style={{ maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)', opacity: 0.7 }}>
            <DotGrid
              dotSize={3}
              gap={20}
              baseColor="#dde8e4"
              activeColor="#2F7D6E"
              proximity={100}
              shockRadius={200}
              shockStrength={4}
              resistance={800}
              returnDuration={1.8}
            />
          </div>
        )}

        {/* Soft radial glow — very subtle */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-full rounded-full blur-[180px] opacity-[0.04] pointer-events-none z-[1]"
          style={{ background: "hsl(var(--col-primary))" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[hsl(var(--col-bg))] pointer-events-none z-[1]" />

        <div className="max-w-4xl mx-auto px-6 relative z-10 w-full flex flex-col items-center">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="badge mb-7"
          >
            Autonomous Trust Platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="text-[clamp(40px,6vw,72px)] font-bold leading-[1.08] tracking-[-0.035em] mb-6"
          >
            Trust doesn't wait for<br />your next audit.<br />
            Neither does <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--col-primary))] to-[hsl(var(--col-accent))]">Pramanik.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="text-[17px] leading-[1.65] text-[hsl(var(--col-muted))] max-w-[680px] mb-10 font-normal"
          >
            The world's first Autonomous Trust Platform. Pramanik detects change across your posture,
            determines what's at risk, and acts — across compliance, vendor risk, AI governance, and
            more — so your organization stays trustworthy without the operational chaos.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="relative mb-16"
          >
            <button onClick={onGetStarted} className="btn-solid py-3 px-8 text-[15px] flex items-center gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ══ TRUSTED BY MARQUEE ══ */}
      <section className="relative border-y border-[hsl(var(--col-border))] py-6 overflow-hidden"
        style={{
          background: dark
            ? "linear-gradient(135deg, hsl(222 20% 10%) 0%, hsl(222 22% 12%) 50%, hsl(222 20% 10%) 100%)"
            : "linear-gradient(135deg, hsl(168 46% 28%) 0%, hsl(152 36% 32%) 50%, hsl(168 46% 28%) 100%)"
        }}>

        {/* Subtle glow orbs in background */}
        {dark && (
          <>
            <div className="absolute -left-16 top-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[60px] opacity-10 pointer-events-none"
              style={{ background: "hsl(168 52% 44%)" }} />
            <div className="absolute -right-16 top-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[60px] opacity-8 pointer-events-none"
              style={{ background: "hsl(152 44% 46%)" }} />
          </>
        )}

        {/* Aurora wave overlay — subtle */}
        <div className="absolute inset-0 z-0 opacity-20 mix-blend-screen pointer-events-none">
          <Aurora
            colorStops={["#2dd4bf", "#A5E6D6", "#34d399"]}
            blend={0.3}
            amplitude={0.6}
            speed={0.4}
          />
        </div>

        {/* Edge fades */}
        <div className="absolute inset-x-0 top-0 h-6 pointer-events-none z-10"
          style={{ background: dark ? "linear-gradient(to bottom, hsl(222 20% 10%), transparent)" : "linear-gradient(to bottom, hsl(168 46% 28%), transparent)" }} />
        <div className="absolute inset-x-0 bottom-0 h-6 pointer-events-none z-10"
          style={{ background: dark ? "linear-gradient(to top, hsl(222 20% 10%), transparent)" : "linear-gradient(to top, hsl(168 46% 28%), transparent)" }} />

        <div className="max-w-[1280px] mx-auto relative z-[5]">
          <p className="text-center text-[10px] font-bold text-white/40 mb-5 uppercase tracking-[0.35em] px-6">
            4+ Compliance Frameworks
          </p>
          <div className="relative flex w-full overflow-hidden"
            style={{ maskImage: 'linear-gradient(to right, transparent, black 14%, black 86%, transparent)' }}>
            <div className="animate-marquee gap-28 items-center w-max pr-28">
              {[
                { name: "SOC 2", accent: "#2dd4bf" },
                { name: "GDPR", accent: "#34d399" },
                { name: "ISO 27001", accent: "#a5f3fc" },
                { name: "HIPAA", accent: "#2dd4bf" },
                { name: "NIST", accent: "#6ee7b7" },
                { name: "CCPA", accent: "#a5f3fc" },
                { name: "PCI DSS", accent: "#34d399" },
                { name: "DPDP", accent: "#2dd4bf" },
                { name: "SOC 2", accent: "#2dd4bf" },
                { name: "GDPR", accent: "#34d399" },
                { name: "ISO 27001", accent: "#a5f3fc" },
                { name: "HIPAA", accent: "#2dd4bf" },
                { name: "NIST", accent: "#6ee7b7" },
                { name: "CCPA", accent: "#a5f3fc" },
                { name: "PCI DSS", accent: "#34d399" },
                { name: "DPDP", accent: "#2dd4bf" },
              ].map(({ name, accent }, i) => (
                <div key={i} className="inline-flex items-center gap-2 mx-8 whitespace-nowrap group cursor-default">
                  <span className="w-1 h-1 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
                    style={{ background: accent }} />
                  <span className="text-[15px] font-semibold text-white/65 group-hover:text-white/90 transition-colors tracking-tight">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ══ STAGE OF TRUST SECTION ══ */}
      <section className="py-24 border-b border-[hsl(var(--col-border))]">
        <div className="max-w-[1280px] mx-auto px-6">
        <div className="text-center mb-16">
          <span className="badge mb-5">The Challenge</span>
          <h2 className="text-[38px] md:text-[48px] font-bold tracking-[-0.03em] mt-4">Built for every stage of <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--col-primary))] to-[hsl(var(--col-accent))] italic">trust</span></h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start relative pb-24">
          {/* Left Side: Vertical Flowchart Timeline */}
          <div className="relative w-full">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-[hsl(var(--col-primary))] via-[hsl(var(--col-accent))] to-[hsl(var(--col-border)/0.5)]" />

            {[
              { label: "Startups", title: "Get audit-ready in weeks", desc: "Zero to SOC 2 with no dedicated team. AI scopes, maps controls, and closes gaps autonomously.", stats: [{ val: "14", sub: "Days Avg" }, { val: "85%", sub: "Automated" }], color: "var(--col-accent)" },
              { label: "Growing Companies", title: "Trust ops on autopilot", desc: "Multi-framework compliance for scaling teams. Continuous monitoring across 1000+ controls.", tags: ["3+ Frameworks", "∞ Integrations"], color: "var(--col-primary)" },
              { label: "Enterprises", title: "Defensible posture. Always.", desc: "Non-stop compliance across global infra. Custom frameworks, on-prem agents, 24/7 support.", badge: "Continuous Monitoring Active", color: "var(--col-muted)" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.5 }}
                transition={{ duration: 0.55, ease: "easeOut", delay: i * 0.1 }}
                className={`relative pl-14 ${i < 2 ? "pb-14" : ""}`}
              >
                <div className="absolute left-[14px] top-5 w-[14px] h-[14px] rounded-full ring-[3px] ring-[hsl(var(--col-surface))]"
                  style={{ background: `hsl(${item.color})` }} />
                <div className="bg-[hsl(var(--col-surface))] border border-[hsl(var(--col-border))] p-6 rounded-2xl hover:border-[hsl(var(--col-primary)/0.25)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] transition-all">
                  <span className="font-bold tracking-widest text-[10px] uppercase text-[hsl(var(--col-primary))]">{item.label}</span>
                  <h4 className="text-[18px] font-bold mt-2 leading-snug tracking-tight">{item.title}</h4>
                  <p className="text-[14px] text-[hsl(var(--col-muted))] mt-2 leading-relaxed">{item.desc}</p>
                  {item.stats && (
                    <div className="flex items-center gap-6 mt-4">
                      {item.stats.map((s, j) => (
                        <div key={j} className="text-center">
                          <span className="text-[22px] font-black text-[hsl(var(--col-primary))]">{s.val}</span>
                          <span className="text-[11px] block text-[hsl(var(--col-muted))] font-medium">{s.sub}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {item.tags && (
                    <div className="flex items-center gap-2 mt-4">
                      {item.tags.map((t, j) => (
                        <div key={j} className="bg-[hsl(var(--col-primary)/0.08)] px-3 py-1 rounded-lg">
                          <span className="text-[12px] font-semibold text-[hsl(var(--col-primary))]">{t}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {item.badge && (
                    <div className="flex items-center gap-2 mt-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--col-accent))] animate-pulse" />
                      <span className="text-[12px] font-medium text-[hsl(var(--col-muted))]">{item.badge}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right Side: Detail Cards */}
          <div className="relative w-full">
            {[
              {
                label: "Startups", title: "Your first compliance operator.",
                desc: "No one owns compliance at your startup. That's fine — until it isn't. Pramanik steps in as your compliance team: scopes your SOC 2, ISO 27001, or HIPAA program, connects to your systems, closes the gaps, and gets you to audit readiness.",
                style: "bg-[hsl(var(--col-surface))] border border-[hsl(var(--col-border))]"
              },
              {
                label: "Growing Companies", title: "Trust ops on autopilot.",
                desc: "You have a small security team working overtime. Empower them. Pramanik intelligently pulls evidence, continuously monitors thousands of controls, and acts as the automated brain behind your entire trust posture.",
                style: "bg-[hsl(var(--col-primary))]", light: true
              },
              {
                label: "Enterprises", title: "A defensible trust posture. Always.",
                desc: "Navigating intense regulatory pressure requires absolute visibility. Our Autonomous AI Inference Core ensures non-stop compliance visibility across your sprawling cloud infrastructure and multi-national vendor network.",
                style: dark ? "bg-[hsl(var(--col-raise))] border border-[hsl(var(--col-border))]" : "bg-[hsl(180,25%,14%)]", dark: true
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.5 }}
                transition={{ duration: 0.55, ease: "easeOut", delay: i * 0.1 }}
                className={`p-8 rounded-2xl ${card.style} ${i < 2 ? "mb-6" : ""}`}
              >
                <span className={`inline-block px-3 py-1 rounded-full mb-4 font-semibold text-[11px] uppercase tracking-[0.1em] ${card.light ? "bg-white/20 text-white" : card.dark ? "bg-white/10 text-white/55" : "bg-[hsl(var(--col-primary)/0.09)] text-[hsl(var(--col-primary))]"}`}>
                  {card.label}
                </span>
                <h3 className={`text-[24px] font-bold tracking-tight mb-3 leading-snug ${card.light || card.dark ? "text-white" : ""}`}>
                  {card.title}
                </h3>
                <p className={`text-[14px] leading-[1.7] ${card.light ? "text-white/88" : card.dark ? "text-white/65" : "text-[hsl(var(--col-muted))]"}`}>
                  {card.desc}
                </p>
                {i === 0 && (
                  <a href="https://drive.google.com/file/d/1N7AI0cxkeV_YpPL60nKdPpHEnKtWXN-B/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 font-semibold text-[13px] text-[hsl(var(--col-primary))] hover:gap-3 transition-all">
                    Learn more <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        </div>
        </div>
      </section>

      <PricingSection />

      {/* ══ ARCHITECTURE / PLATFORM SECTION ══ */}
      <section className="py-24 bg-[hsl(var(--col-bg))] relative border-b border-[hsl(var(--col-border))]">
        <div className="max-w-[1280px] mx-auto px-6 text-center">
          <span className="badge mb-5">An Enterprise-Grade Engine</span>
          <h2 className="text-[36px] md:text-[44px] font-bold tracking-[-0.025em] mt-4 mb-10">One unified autonomous trust platform.</h2>

          {/* Tab Buttons */}
          <div className="flex flex-wrap justify-center gap-2 mb-16">
            {FEATURES.map((feature, i) => (
              <button key={i} onClick={() => setActiveFeatureIndex(i)}
                className={`font-semibold py-2 px-5 text-[13px] rounded-full border transition-all ${i === activeFeatureIndex
                  ? "bg-[hsl(var(--col-primary))] text-white border-transparent shadow-[0_2px_8px_hsl(var(--col-primary)/0.2)]"
                  : "bg-[hsl(var(--col-surface))] text-[hsl(var(--col-sub))] border-[hsl(var(--col-border))] hover:border-[hsl(var(--col-primary)/0.4)] hover:text-[hsl(var(--col-primary))]"}`}>
                {feature.title}
              </button>
            ))}
          </div>

          {/* Architecture Graphic */}
          <div className="relative max-w-4xl mx-auto h-[420px] border border-[hsl(var(--col-border))] rounded-2xl bg-[hsl(var(--col-surface))] overflow-hidden flex items-center justify-center p-8 shadow-sm">
            {/* Subtle background pattern inside diagram */}
            <div className="absolute inset-0 bg-pattern-dots opacity-30" />

            <div className="flex w-full items-center justify-between relative z-10 px-4">
              {/* Inputs */}
              <div className="flex flex-col gap-8 w-1/4">
                {activeFeature.inputs.map(({ icon: Icon, title, sub, color }, i) => (
                  <motion.div key={`${activeFeatureIndex}-input-${i}`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} whileHover={{ scale: 1.04, x: 4 }}
                    className="bg-[hsl(var(--col-raise))] p-4 rounded-xl border border-[hsl(var(--col-border))] flex items-center gap-3 cursor-pointer relative hover:border-[hsl(var(--col-primary)/0.3)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-all">
                    <div className={`absolute -left-[3px] inset-y-4 w-[3px] bg-[hsl(var(--${color}))] rounded-full opacity-60`} />
                    <div className={`w-9 h-9 rounded-lg bg-[hsl(var(--${color})/0.1)] flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 text-[hsl(var(--${color}))]`} />
                    </div>
                    <div>
                      <h5 className="text-[13px] font-bold leading-tight">{title}</h5>
                      <p className="text-[11px] text-[hsl(var(--col-muted))] font-medium mt-0.5">{sub}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Processing Core */}
              <div className="w-1/3 relative flex justify-center">
                <motion.div animate={{ scale: [1, 1.04, 1], opacity: [0.2, 0.45, 0.2] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className={`absolute inset-0 bg-[hsl(var(--${activeFeature.core.color}))] blur-3xl rounded-full transition-colors duration-500`} />
                <div className={`relative z-10 p-[2px] rounded-3xl bg-gradient-to-tr ${activeFeature.core.glow} shadow-[0_6px_28px_hsl(var(--col-primary)/0.18)] group cursor-crosshair transition-all duration-500`}>
                  <div className="bg-[hsl(var(--col-surface))] p-7 rounded-[22px] flex flex-col items-center justify-center h-[168px] w-[168px] transition-transform duration-500 group-hover:scale-[0.98]">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
                      className={`absolute inset-2 border border-dashed border-[hsl(var(--${activeFeature.core.color})/0.2)] rounded-full pointer-events-none`} />
                    <AnimatePresence mode="wait">
                      <motion.div key={activeFeatureIndex} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.3 }} className="flex flex-col items-center justify-center h-full pt-1">
                        <activeFeature.core.icon className={`w-12 h-12 text-[hsl(var(--${activeFeature.core.color}))] mb-3 relative z-10`} />
                        <h4 className="font-bold text-[16px] mb-1 relative z-10 text-center leading-tight">{activeFeature.core.title}</h4>
                        <span className="text-[9px] text-[hsl(var(--col-accent))] bg-[hsl(var(--col-primary)/0.06)] px-2 py-0.5 rounded-full uppercase font-bold tracking-widest relative z-10 whitespace-nowrap">{activeFeature.core.sub}</span>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Outputs */}
              <div className="flex flex-col gap-8 w-1/4">
                {activeFeature.outputs.map(({ icon: Icon, title, sub, subClass, color }, i) => (
                  <motion.div key={`${activeFeatureIndex}-output-${i}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} whileHover={{ scale: 1.04, x: -4 }}
                    className="bg-[hsl(var(--col-raise))] p-4 rounded-xl border border-[hsl(var(--col-border))] flex items-center gap-3 cursor-pointer relative hover:border-[hsl(var(--col-primary)/0.3)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-all">
                    <div className={`absolute -right-[3px] inset-y-4 w-[3px] bg-[hsl(var(--${color}))] rounded-full opacity-60`} />
                    <div className={`w-9 h-9 rounded-lg bg-[hsl(var(--${color})/0.1)] flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 text-[hsl(var(--${color}))]`} />
                    </div>
                    <div>
                      <h5 className="text-[13px] font-bold leading-tight">{title}</h5>
                      <p className={`text-[11px] font-semibold mt-0.5 px-1.5 py-0.5 rounded-md inline-block ${subClass}`}>{sub}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Connecting Lines — softer, slower */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              <path d="M 240 130 C 320 130, 360 210, 410 210" fill="none" stroke="hsl(var(--col-primary))" strokeWidth="1.5" opacity="0.12" />
              <path d="M 240 290 C 320 290, 360 210, 410 210" fill="none" stroke="hsl(var(--col-accent))" strokeWidth="1.5" opacity="0.12" />
              <path d="M 480 210 C 530 210, 570 130, 650 130" fill="none" stroke="hsl(var(--col-accent))" strokeWidth="1.5" opacity="0.12" />
              <path d="M 480 210 C 530 210, 570 290, 650 290" fill="none" stroke="hsl(var(--col-primary))" strokeWidth="1.5" opacity="0.12" />
              <motion.path d="M 240 130 C 320 130, 360 210, 410 210" fill="none" stroke="hsl(var(--col-primary))" strokeWidth="1.5" strokeDasharray="4 10" animate={{ strokeDashoffset: [-28, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
              <motion.path d="M 240 290 C 320 290, 360 210, 410 210" fill="none" stroke="hsl(var(--col-accent))" strokeWidth="1.5" strokeDasharray="4 10" animate={{ strokeDashoffset: [-28, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }} />
              <motion.path d="M 480 210 C 530 210, 570 130, 650 130" fill="none" stroke="hsl(var(--col-accent))" strokeWidth="1.5" strokeDasharray="4 10" animate={{ strokeDashoffset: [28, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }} />
              <motion.path d="M 480 210 C 530 210, 570 290, 650 290" fill="none" stroke="hsl(var(--col-primary))" strokeWidth="1.5" strokeDasharray="4 10" animate={{ strokeDashoffset: [28, 0] }} transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }} />
            </svg>
          </div>
        </div>
      </section>

      {/* ══ FRAMEWORKS EXPANSION ══ */}
      <section className="py-24 bg-[hsl(var(--col-bg))] relative overflow-hidden border-t border-[hsl(var(--col-border))]">
        <div className="max-w-[1280px] mx-auto px-6 relative z-10">
          <div className="max-w-2xl mb-14">
            <h2 className="text-[40px] font-bold tracking-[-0.025em] mb-4">4+ Frameworks. And Counting.</h2>
            <p className="text-[16px] text-[hsl(var(--col-muted))] leading-relaxed mb-7">
              SOC 2, ISO 27001, HIPAA, GDPR, PCI DSS, and 4+ global standards. Upload any additional regulation or contract — Pramanik translates it into controls automatically.
            </p>
            <a href="https://drive.google.com/file/d/1N7AI0cxkeV_YpPL60nKdPpHEnKtWXN-B/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="btn-primary py-3 px-7 inline-flex items-center gap-2 w-fit text-[14px]">
              Learn more <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Framework Bubbles Visual */}
          <div className="h-[380px] w-full relative mt-16 hidden md:block rounded-2xl border border-[hsl(var(--col-border))] bg-[hsl(var(--col-surface))] overflow-hidden">
            <div className="absolute inset-0 bg-pattern-dots opacity-20" />

            {/* Center hub */}
            <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-44 h-44 border border-dashed border-[hsl(var(--col-primary)/0.25)] rounded-full flex items-center justify-center bg-[hsl(var(--col-surface))] z-20">
              <div className="w-28 h-28 bg-gradient-to-br from-[hsl(var(--col-primary))] to-[hsl(var(--col-accent))] rounded-2xl flex items-center justify-center shadow-[0_6px_24px_hsl(var(--col-primary)/0.22)] flex-col text-white">
                <Shield className="w-10 h-10 mb-1.5" />
                <span className="text-[9px] font-bold uppercase tracking-widest">Frameworks</span>
              </div>
            </div>

            {/* Framework bubbles — more uniform sizes, slightly muted */}
            {[
              { label: "SOC 2",      pos: "right-[20%] top-[18%]",    size: "w-20 h-20",        color: "bg-[hsl(var(--col-primary))]", opacity: "opacity-90" },
              { label: "ISO 27001",  pos: "right-[35%] top-[10%]",    size: "w-[72px] h-[72px]",color: "bg-[hsl(var(--col-accent))]",  opacity: "opacity-85" },
              { label: "HIPAA",      pos: "right-[46%] top-[34%]",    size: "w-[72px] h-[72px]",color: "bg-teal-500",                  opacity: "opacity-80" },
              { label: "FR",         pos: "right-[31%] top-[46%]",    size: "w-[60px] h-[60px]",color: "bg-emerald-600",               opacity: "opacity-80" },
              { label: "AICPA SOC",  pos: "right-[16%] top-[40%]",   size: "w-20 h-20",        color: "bg-cyan-600",                  opacity: "opacity-85" },
              { label: "NIST 800-53",pos: "right-[25%] bottom-[18%]", size: "w-[72px] h-[72px]",color: "bg-[hsl(var(--col-primary))]", opacity: "opacity-80" },
              { label: "CCPA",       pos: "right-[40%] bottom-[28%]", size: "w-[64px] h-[64px]",color: "bg-slate-600",                 opacity: "opacity-80" },
              { label: "DPDP",       pos: "right-[13%] bottom-[12%]", size: "w-[68px] h-[68px]",color: "bg-[#0e7490]",                 opacity: "opacity-85" },
            ].map(({ label, pos, size, color, opacity }) => (
              <div key={label} className={`absolute ${pos} ${size} ${color} ${opacity} rounded-full flex flex-col items-center justify-center text-white font-semibold text-center leading-tight z-20 hover:opacity-100 hover:scale-105 transition-all duration-200 cursor-pointer`}>
                {label.split(" ").map((w, i) => <span key={i} className="text-[11px]">{w}</span>)}
              </div>
            ))}

            {/* Connector lines */}
            <div className="absolute left-[35%] top-1/2 -translate-y-[1px] w-[50%] h-[2px] z-10">
              <svg width="100%" height="400" className="absolute top-1/2 -translate-y-1/2 overflow-visible">
                <path d="M 0 200 L 200 50"  fill="none" stroke="hsl(var(--col-primary) / 0.3)" strokeWidth="1.5" strokeDasharray="4 5" />
                <path d="M 0 200 L 200 350" fill="none" stroke="hsl(var(--col-primary) / 0.3)" strokeWidth="1.5" strokeDasharray="4 5" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="relative bg-[hsl(var(--col-surface))] py-16 px-6 overflow-hidden border-t border-[hsl(var(--col-border))]">

        {/* Animated shimmer top border */}
        <div className="absolute top-0 inset-x-0 h-px overflow-hidden">
          <motion.div
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-[hsl(var(--col-primary))] to-transparent opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[hsl(var(--col-border))] to-transparent" />
        </div>

        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-24 bg-[hsl(var(--col-primary)/0.04)] blur-3xl rounded-full pointer-events-none" />

        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">

          {/* Brand + tagline */}
          <div className="flex flex-col items-start gap-1">
            <span className="font-extrabold text-[24px] tracking-tight text-[hsl(var(--col-primary))]">Pramanik</span>
            <span className="text-[10px] text-[hsl(var(--col-muted))] font-medium uppercase tracking-[0.18em]">Autonomous Trust Platform</span>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-[hsl(var(--col-border))] bg-[hsl(var(--col-raise))]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-[12px] font-medium text-[hsl(var(--col-sub))]">All systems operational</span>
          </div>

          {/* Copyright */}
          <p className="text-[12px] font-medium text-[hsl(var(--col-muted))]">
            © 2026 Pramanik Inc. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
