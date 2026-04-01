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
      { icon: Bell, title: "Drift Alerts", sub: "Actionable", subClass: "text-[hsl(var(--col-muted))]", color: "col-primary" }
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
      <nav className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <div className="flex items-center cursor-pointer hover:opacity-90 transition-opacity">
          <span className="font-extrabold text-[26px] tracking-tighter text-[#1eaba3] drop-shadow-sm">Pramanik</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button
            onClick={onGetStarted}
            className="px-5 py-2 rounded-lg font-medium text-white bg-[hsl(var(--col-primary))]"
          >
            Login
          </button>
        </div>
      </nav>

      {/* ══ HERO SECTION ══ */}
      <section className="relative pt-40 pb-32 overflow-hidden bg-[hsl(var(--col-bg))] min-h-[90vh] flex flex-col items-center justify-center text-center border-b border-[hsl(var(--col-border))]">

        {/* Dynamic Background — Hyperspeed in dark, DotGrid in light */}
        {dark ? (
          <>
            <WebGLBoundary>
              <Suspense fallback={null}>
                <Hyperspeed speed={1.2} />
              </Suspense>
            </WebGLBoundary>
            {/* Dark overlay so text stays fully legible */}
            <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--col-bg)/0.55)] via-[hsl(var(--col-bg)/0.35)] to-[hsl(var(--col-bg))] pointer-events-none z-[1]" />
          </>
        ) : (
          <div className="absolute inset-0 pointer-events-auto z-0" style={{ maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)' }}>
            <DotGrid
              dotSize={4}
              gap={18}
              baseColor="#e5efeb"
              activeColor="#1eaba3"
              proximity={120}
              shockRadius={250}
              shockStrength={5}
              resistance={750}
              returnDuration={1.5}
            />
          </div>
        )}

        {/* Soft radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-full rounded-full blur-[160px] opacity-[0.06] pointer-events-none z-[1]"
          style={{ background: "hsl(var(--col-primary))" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[hsl(var(--col-bg))] pointer-events-none z-[1]" />

        <div className="max-w-5xl mx-auto px-6 relative z-10 w-full flex flex-col items-center">
          <h1 className="text-[clamp(48px,7vw,88px)] font-bold leading-[1.05] tracking-tight mb-8">
            Trust doesn't wait for<br /> your next audit.<br />
            Neither does <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--col-primary))] to-[hsl(var(--col-accent))]">Pramanik.</span>
          </h1>

          <p className="text-[18px] md:text-[20px] leading-[1.6] text-[hsl(var(--col-muted))] max-w-[800px] mb-12 font-medium">
            The world's first Autonomous Trust Platform. Pramanik detects change across your posture,
            determines what's at risk, and acts — across compliance, vendor risk, AI governance, and
            more — so your organization stays trustworthy without the operational chaos.
          </p>

          <div className="relative mb-20">
            <button onClick={onGetStarted} className="btn-primary py-4 px-10 text-[18px]">
              Get Started
            </button>
          </div>
        </div>
      </section>

      {/* ══ TRUSTED BY MARQUEE ══ */}
      <section className="relative border-y border-[hsl(var(--col-border))] py-10 overflow-hidden"
        style={{
          background: dark
            ? "linear-gradient(135deg, hsl(222 18% 10%) 0%, hsl(222 22% 13%) 50%, hsl(222 18% 10%) 100%)"
            : "linear-gradient(135deg, hsl(175 60% 22%) 0%, hsl(160 50% 28%) 50%, hsl(175 60% 22%) 100%)"
        }}>

        {/* Glow orbs in background */}
        {dark && (
          <>
            <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[80px] opacity-20 pointer-events-none"
              style={{ background: "hsl(175 60% 50%)" }} />
            <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[80px] opacity-15 pointer-events-none"
              style={{ background: "hsl(150 55% 50%)" }} />
          </>
        )}

        {/* Aurora wave overlay */}
        <div className="absolute inset-0 z-0 opacity-30 mix-blend-screen pointer-events-none">
          <Aurora
            colorStops={["#2dd4bf", "#A5E6D6", "#34d399"]}
            blend={0.4}
            amplitude={0.8}
            speed={0.6}
          />
        </div>

        {/* Top + bottom edge fade */}
        <div className="absolute inset-x-0 top-0 h-8 pointer-events-none z-10"
          style={{ background: dark ? "linear-gradient(to bottom, hsl(222 18% 9%), transparent)" : "linear-gradient(to bottom, hsl(175 60% 22%), transparent)" }} />
        <div className="absolute inset-x-0 bottom-0 h-8 pointer-events-none z-10"
          style={{ background: dark ? "linear-gradient(to top, hsl(222 18% 9%), transparent)" : "linear-gradient(to top, hsl(175 60% 22%), transparent)" }} />

        <div className="max-w-[1400px] mx-auto relative z-[5]">
          <p className="text-center text-[11px] font-bold text-white/50 mb-7 uppercase tracking-[0.3em] px-6">
            4+ Compliance Frameworks
          </p>
          <div className="relative flex w-full overflow-hidden"
            style={{ maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)' }}>
            <div className="animate-marquee gap-32 items-center w-max pr-32">
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
                <div key={i} className="inline-flex items-center gap-2 mx-10 whitespace-nowrap group cursor-default">
                  <span className="w-1.5 h-1.5 rounded-full opacity-70 group-hover:opacity-100 transition-opacity"
                    style={{ background: accent }} />
                  <span className="text-[18px] font-bold text-white/75 group-hover:text-white transition-colors tracking-tight">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ══ STAGE OF TRUST SECTION ══ */}
      <section className="py-32 px-6 max-w-[1400px] mx-auto border-b border-[hsl(var(--col-border))]">
        <div className="text-center mb-24">
          <span className="inline-block px-3 py-1 bg-[hsl(var(--col-primary)/0.1)] text-[hsl(var(--col-primary))] font-bold text-[12px] uppercase tracking-widest rounded-full mb-6">The Challenge</span>
          <h2 className="text-[48px] md:text-[56px] font-bold tracking-tight">Built for every stage of <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--col-primary))] to-[hsl(var(--col-accent))] italic">trust</span></h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start relative pb-32">
          {/* Left Side: Vertical Flowchart Timeline */}
          <div className="relative w-full">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-[hsl(var(--col-primary))] via-[hsl(var(--col-accent))] to-[hsl(var(--col-border))]" />

            {[
              { label: "Startups", title: "Get audit-ready in weeks", desc: "Zero to SOC 2 with no dedicated team. AI scopes, maps controls, and closes gaps autonomously.", stats: [{ val: "14", sub: "Days Avg" }, { val: "85%", sub: "Automated" }], color: "var(--col-accent)" },
              { label: "Growing Companies", title: "Trust ops on autopilot", desc: "Multi-framework compliance for scaling teams. Continuous monitoring across 1000+ controls.", tags: ["3+ Frameworks", "∞ Integrations"], color: "var(--col-primary)" },
              { label: "Enterprises", title: "Defensible posture. Always.", desc: "Non-stop compliance across global infra. Custom frameworks, on-prem agents, 24/7 support.", badge: "Continuous Monitoring Active", color: "var(--col-muted)" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -80 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.5 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.1 }}
                className={`relative pl-16 ${i < 2 ? "pb-16" : ""}`}
              >
                <div className="absolute left-[17px] top-6 w-[18px] h-[18px] rounded-full ring-4 ring-[hsl(var(--col-surface))]"
                  style={{ background: `hsl(${item.color})` }} />
                <div className="bg-[hsl(var(--col-surface))] border border-[hsl(var(--col-border))] p-6 rounded-2xl">
                  <span className="font-bold tracking-widest text-[10px] uppercase text-[hsl(var(--col-primary))]">{item.label}</span>
                  <h4 className="text-[20px] font-bold mt-2 leading-tight">{item.title}</h4>
                  <p className="text-[13px] text-[hsl(var(--col-muted))] mt-2 leading-snug">{item.desc}</p>
                  {item.stats && (
                    <div className="flex items-center gap-5 mt-4">
                      {item.stats.map((s, j) => (
                        <div key={j} className="text-center">
                          <span className="text-[20px] font-black text-[hsl(var(--col-primary))]">{s.val}</span>
                          <span className="text-[11px] block text-[hsl(var(--col-muted))]">{s.sub}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {item.tags && (
                    <div className="flex items-center gap-3 mt-4">
                      {item.tags.map((t, j) => (
                        <div key={j} className="bg-[hsl(var(--col-primary)/0.1)] px-3 py-1.5 rounded-lg">
                          <span className="text-[12px] font-bold text-[hsl(var(--col-primary))]">{t}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {item.badge && (
                    <div className="flex items-center gap-2.5 mt-4">
                      <div className="w-2 h-2 rounded-full bg-[hsl(var(--col-accent))] animate-pulse" />
                      <span className="text-[12px] font-semibold text-[hsl(var(--col-muted))]">{item.badge}</span>
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
                style: dark ? "bg-[hsl(var(--col-raise))] border border-[hsl(var(--col-border))]" : "bg-[hsl(180,30%,12%)]", dark: true
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 80 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.5 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.1 }}
                className={`p-8 rounded-2xl ${card.style} ${i < 2 ? "mb-8" : ""}`}
              >
                <span className={`inline-block px-3 py-1 rounded-full mb-5 font-bold text-[12px] uppercase tracking-widest ${card.light ? "bg-white/20 text-white" : card.dark ? "bg-white/10 text-white/60" : "bg-[hsl(var(--col-primary)/0.1)] text-[hsl(var(--col-primary))]"}`}>
                  {card.label}
                </span>
                <h3 className={`text-[28px] font-bold tracking-tight mb-4 ${card.light || card.dark ? "text-white" : ""}`}>
                  {card.title}
                </h3>
                <p className={`text-[15px] leading-[1.7] ${card.light ? "text-white/90" : card.dark ? "text-white/70" : "text-[hsl(var(--col-muted))]"}`}>
                  {card.desc}
                </p>
                {i === 0 && (
                  <a href="https://drive.google.com/file/d/1N7AI0cxkeV_YpPL60nKdPpHEnKtWXN-B/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 font-semibold text-[hsl(var(--col-primary))] hover:gap-3 transition-all">
                    Learn more <ArrowRight className="w-4 h-4" />
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <PricingSection />

      {/* ══ ARCHITECTURE / PLATFORM SECTION ══ */}
      <section className="py-24 px-6 bg-[hsl(var(--col-bg))] relative border-b border-[hsl(var(--col-border))]">
        <div className="max-w-[1400px] mx-auto text-center">
          <span className="inline-block px-3 py-1 bg-[hsl(var(--col-primary)/0.1)] text-[hsl(var(--col-primary))] font-bold text-[12px] uppercase tracking-widest rounded-full mb-6">An Enterprise-Grade Engine</span>
          <h2 className="text-[40px] md:text-[48px] font-bold tracking-tight mb-12">One unified autonomous trust platform.</h2>

          <div className="flex flex-wrap justify-center gap-4 mb-20">
            {FEATURES.map((feature, i) => (
              <button key={i} onClick={() => setActiveFeatureIndex(i)} className={`font-semibold py-2 px-6 rounded-[8px] border transition-colors ${i === activeFeatureIndex ? "bg-[hsl(var(--col-primary))] text-white border-transparent" : "bg-[hsl(var(--col-surface))] text-[hsl(var(--col-text))] border-[hsl(var(--col-border))] hover:border-[hsl(var(--col-primary)/0.5)]"}`}>
                {feature.title}
              </button>
            ))}
          </div>

          {/* Architecture Graphic */}
          <div className="relative max-w-4xl mx-auto h-[450px] border border-[hsl(var(--col-border))] rounded-2xl bg-[hsl(var(--col-surface))] overflow-hidden flex items-center justify-center p-8 bg-pattern-plus shadow-sm">
            <div className="flex w-full items-center justify-between relative z-10 px-4">
              {/* Inputs */}
              <div className="flex flex-col gap-10 w-1/4">
                {activeFeature.inputs.map(({ icon: Icon, title, sub, color }, i) => (
                  <motion.div key={`${activeFeatureIndex}-input-${i}`} initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} transition={{delay: i*0.1}} whileHover={{ scale: 1.05, x: 5 }}
                    className="bg-[hsl(var(--col-raise))] p-5 rounded-2xl shadow-sm border border-[hsl(var(--col-border))] flex items-center gap-4 cursor-pointer relative">
                    <div className={`absolute -left-3 inset-y-0 w-1 bg-gradient-to-b from-[hsl(var(--${color}))] to-transparent rounded-full`} />
                    <div className={`w-10 h-10 rounded-full bg-[hsl(var(--${color})/0.1)] flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 text-[hsl(var(--${color}))]`} />
                    </div>
                    <div>
                      <h5 className="text-[15px] font-bold leading-tight">{title}</h5>
                      <p className="text-[12px] text-[hsl(var(--col-muted))] font-medium mt-0.5">{sub}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Processing Core */}
              <div className="w-1/3 relative flex justify-center">
                <motion.div animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className={`absolute inset-0 bg-[hsl(var(--${activeFeature.core.color}))] blur-3xl rounded-full transition-colors duration-500`} />
                <div className={`relative z-10 p-[2px] rounded-3xl bg-gradient-to-tr ${activeFeature.core.glow} shadow-[0_8px_40px_rgb(30,171,163,0.3)] group cursor-crosshair transition-all duration-500`}>
                  <div className="bg-[hsl(var(--col-surface))] p-8 rounded-[22px] flex flex-col items-center justify-center h-[180px] w-[180px] transition-transform duration-500 group-hover:scale-[0.98]">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className={`absolute inset-2 border border-dashed border-[hsl(var(--${activeFeature.core.color})/0.3)] rounded-full pointer-events-none`} />
                    <AnimatePresence mode="wait">
                      <motion.div key={activeFeatureIndex} initial={{opacity:0, scale:0.5}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.5}} transition={{duration: 0.3}} className="flex flex-col items-center justify-center h-full pt-1">
                        <activeFeature.core.icon className={`w-14 h-14 text-[hsl(var(--${activeFeature.core.color}))] mb-4 relative z-10`} />
                        <h4 className="font-bold text-[18px] mb-1 relative z-10 text-center leading-tight mx-[-10px]">{activeFeature.core.title}</h4>
                        <span className="text-[10px] text-[hsl(var(--col-accent))] bg-[hsl(var(--col-primary)/0.05)] px-2 py-0.5 rounded-full uppercase font-bold tracking-widest relative z-10 whitespace-nowrap mt-1">{activeFeature.core.sub}</span>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Outputs */}
              <div className="flex flex-col gap-10 w-1/4">
                {activeFeature.outputs.map(({ icon: Icon, title, sub, subClass, color }, i) => (
                  <motion.div key={`${activeFeatureIndex}-output-${i}`} initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} transition={{delay: i*0.1}} whileHover={{ scale: 1.05, x: -5 }}
                    className="bg-[hsl(var(--col-raise))] p-5 rounded-2xl shadow-sm border border-[hsl(var(--col-border))] flex items-center gap-4 cursor-pointer relative">
                    <div className={`absolute -right-3 inset-y-0 w-1 bg-gradient-to-t from-[hsl(var(--${color}))] to-transparent rounded-full`} />
                    <div className={`w-10 h-10 rounded-full bg-[hsl(var(--${color})/0.1)] flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 text-[hsl(var(--${color}))]`} />
                    </div>
                    <div>
                      <h5 className="text-[15px] font-bold leading-tight">{title}</h5>
                      <p className={`text-[12px] font-bold mt-0.5 px-2 py-0.5 rounded-full inline-block ${subClass}`}>{sub}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Connecting Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              <path d="M 240 130 C 320 130, 360 225, 410 225" fill="none" stroke="hsl(var(--col-primary))" strokeWidth="2" opacity="0.15" />
              <path d="M 240 320 C 320 320, 360 225, 410 225" fill="none" stroke="hsl(var(--col-accent))" strokeWidth="2" opacity="0.15" />
              <path d="M 480 225 C 530 225, 570 130, 650 130" fill="none" stroke="hsl(var(--col-accent))" strokeWidth="2" opacity="0.15" />
              <path d="M 480 225 C 530 225, 570 320, 650 320" fill="none" stroke="hsl(var(--col-primary))" strokeWidth="2" opacity="0.15" />
              <motion.path d="M 240 130 C 320 130, 360 225, 410 225" fill="none" stroke="hsl(var(--col-primary))" strokeWidth="2" strokeDasharray="4 8" animate={{ strokeDashoffset: [-24, 0] }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
              <motion.path d="M 240 320 C 320 320, 360 225, 410 225" fill="none" stroke="hsl(var(--col-accent))" strokeWidth="2" strokeDasharray="4 8" animate={{ strokeDashoffset: [-24, 0] }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
              <motion.path d="M 480 225 C 530 225, 570 130, 650 130" fill="none" stroke="hsl(var(--col-accent))" strokeWidth="2" strokeDasharray="4 8" animate={{ strokeDashoffset: [24, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} />
              <motion.path d="M 480 225 C 530 225, 570 320, 650 320" fill="none" stroke="hsl(var(--col-primary))" strokeWidth="2" strokeDasharray="4 8" animate={{ strokeDashoffset: [24, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} />
            </svg>
          </div>
        </div>
      </section>

      {/* ══ FRAMEWORKS EXPANSION ══ */}
      <section className="py-32 bg-[hsl(var(--col-bg))] relative overflow-hidden border-t border-[hsl(var(--col-border))]">
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="max-w-2xl mb-16">
            <h2 className="text-[48px] font-bold tracking-tight mb-6">4+ Frameworks. And Counting.</h2>
            <p className="text-[18px] text-[hsl(var(--col-muted))] leading-relaxed mb-8">
              SOC 2, ISO 27001, HIPAA, GDPR, PCI DSS, and 4+ global standards. Upload any additional regulation or contract — Pramanik translates it into controls automatically.
            </p>
            <a href="https://drive.google.com/file/d/1N7AI0cxkeV_YpPL60nKdPpHEnKtWXN-B/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="btn-primary py-3.5 px-8 inline-flex items-center gap-2 w-fit">
              Learn more <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="h-[400px] w-full relative mt-20 hidden md:block rounded-2xl border border-[hsl(var(--col-border))] bg-[hsl(var(--col-surface))] shadow-sm overflow-hidden">
            <div className="absolute inset-0 bg-pattern-plus opacity-30" />

            <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-48 h-48 border-2 border-dashed border-[hsl(var(--col-primary)/0.3)] rounded-full flex items-center justify-center bg-[hsl(var(--col-surface))] z-20">
              <div className="w-32 h-32 bg-gradient-to-br from-[hsl(var(--col-primary))] to-[hsl(var(--col-accent))] rounded-2xl flex items-center justify-center shadow-[0_8px_30px_rgb(45,212,191,0.3)] flex-col text-white">
                <Shield className="w-12 h-12 mb-2" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Frameworks</span>
              </div>
            </div>

            {[
              { label: "SOC 2",      pos: "right-[20%] top-[20%]",    size: "w-24 h-24",        color: "bg-[hsl(var(--col-primary))]" },
              { label: "ISO 27001",  pos: "right-[35%] top-[10%]",    size: "w-20 h-20",        color: "bg-[hsl(var(--col-accent))]"  },
              { label: "HIPAA",      pos: "right-[45%] top-[35%]",    size: "w-20 h-20",        color: "bg-teal-400"                  },
              { label: "FR",         pos: "right-[30%] top-[45%]",    size: "w-16 h-16",        color: "bg-emerald-600"               },
              { label: "AICPA SOC",  pos: "right-[15%] top-[40%]",    size: "w-[90px] h-[90px]",color: "bg-cyan-500"                  },
              { label: "NIST 800-53",pos: "right-[25%] bottom-[20%]", size: "w-20 h-20",        color: "bg-[hsl(var(--col-primary))]" },
              { label: "CCPA",       pos: "right-[40%] bottom-[30%]", size: "w-[70px] h-[70px]",color: "bg-slate-700"                 },
              { label: "DPDP",       pos: "right-[13%] bottom-[12%]", size: "w-[72px] h-[72px]",color: "bg-[#0e7490]"                 },
            ].map(({ label, pos, size, color }) => (
              <div key={label} className={`absolute ${pos} ${size} ${color} rounded-full flex flex-col items-center justify-center text-white font-bold text-center leading-tight shadow-md z-20 hover:scale-110 transition-transform cursor-pointer border-2 border-[hsl(var(--col-border))]`}>
                {label.split(" ").map((w, i) => <span key={i} className="text-xs">{w}</span>)}
              </div>
            ))}

            <div className="absolute left-[35%] top-1/2 -translate-y-[1px] w-[50%] h-[2px] z-10">
              <svg width="100%" height="400" className="absolute top-1/2 -translate-y-1/2 overflow-visible">
                <path d="M 0 200 L 200 50"  fill="none" stroke="hsl(var(--col-primary) / 0.4)" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M 0 200 L 200 350" fill="none" stroke="hsl(var(--col-primary) / 0.4)" strokeWidth="2" strokeDasharray="4 4" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="relative bg-[hsl(var(--col-surface))] py-14 px-6 overflow-hidden">

        {/* Animated shimmer top border */}
        <div className="absolute top-0 inset-x-0 h-px overflow-hidden">
          <motion.div
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-[hsl(var(--col-primary))] to-transparent opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[hsl(var(--col-border))] to-transparent" />
        </div>

        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-[hsl(var(--col-primary)/0.05)] blur-3xl rounded-full pointer-events-none" />

        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">

          {/* Brand + tagline */}
          <div className="flex flex-col items-start gap-1">
            <span className="font-extrabold text-[28px] tracking-tighter text-[#1eaba3] drop-shadow-sm">Pramanik</span>
            <span className="text-[10px] text-[hsl(var(--col-primary))] font-semibold uppercase tracking-[0.15em] ml-1">Autonomous Trust Platform</span>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-[hsl(var(--col-border))] bg-[hsl(var(--col-raise))]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[12px] font-semibold text-[hsl(var(--col-sub))]">All systems operational</span>
          </div>

          {/* Copyright */}
          <p className="text-[13px] font-medium text-[hsl(var(--col-muted))] tracking-wide">
            © 2026 Pramanik Inc. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
