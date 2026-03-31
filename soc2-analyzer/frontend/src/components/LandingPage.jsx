import { Shield, Zap, FileText, Lock, ArrowRight, CheckCircle } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const features = [
  {
    icon: Zap,
    title: "Instant Analysis",
    desc: "Upload your AWS config and get a full SOC 2 gap analysis in under 2 minutes."
  },
  {
    icon: Lock,
    title: "8 SOC 2 Controls",
    desc: "Checks access controls, encryption, logging, threat detection, backups & more."
  },
  {
    icon: FileText,
    title: "AI-Generated Policies",
    desc: "Get audit-ready policy documents tailored to your company, powered by AI."
  }
];

const checks = [
  "MFA & access control validation",
  "S3, RDS encryption checks",
  "CloudTrail & VPC flow log audit",
  "Public access detection",
  "Backup & recovery assessment",
  "PDF compliance report export"
];

export default function LandingPage({ onGetStarted }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Shield className="w-7 h-7" style={{ color: "var(--accent)" }} />
          <span className="text-xl font-bold">SOC2 Analyzer</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button
            onClick={onGetStarted}
            className="px-5 py-2 rounded-lg font-medium text-white"
            style={{ background: "var(--accent)" }}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 pt-20 pb-16 max-w-3xl mx-auto fade-in">
        <div
          className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-6"
          style={{ background: "var(--bg-hover)", color: "var(--accent)" }}
        >
          SOC 2 Type II Compliance
        </div>
        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
          Get audit-ready in{" "}
          <span className="gradient-text">minutes</span>,<br />
          not months.
        </h1>
        <p className="text-lg mb-10" style={{ color: "var(--text-secondary)" }}>
          Upload your AWS configuration. Our AI analyzes every security control,
          identifies gaps, and generates the policies you need — instantly.
        </p>
        <button
          onClick={onGetStarted}
          className="px-8 py-4 rounded-xl font-semibold text-lg text-white inline-flex items-center gap-2 hover:gap-3"
          style={{ background: "var(--accent)" }}
        >
          Start Free Analysis <ArrowRight className="w-5 h-5" />
        </button>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className={`glass p-6 fade-in-d${i + 1}`}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ background: "var(--bg-hover)" }}
              >
                <f.icon className="w-5 h-5" style={{ color: "var(--accent)" }} />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p style={{ color: "var(--text-secondary)" }} className="text-sm leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* What We Check */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-8">What we check</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {checks.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-lg fade-in-d2"
              style={{ background: "var(--bg-secondary)" }}
            >
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>
        Built for startups getting SOC 2 certified.
      </footer>
    </div>
  );
}
