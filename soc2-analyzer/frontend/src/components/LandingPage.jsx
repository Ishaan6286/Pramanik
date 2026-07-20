import { useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  FileSearch,
  Layers,
  Menu,
  MessageSquare,
  Search,
  Shield,
  X,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import "./LandingPage.css";

const FRAMEWORKS = [
  {
    id: "soc2",
    name: "SOC 2",
    blurb: "Understand trust service criteria, controls, and evidence requirements.",
    detail:
      "Explore SOC 2 trust service criteria and how control areas show up in day-to-day security practice.",
    points: ["Access control", "Change management", "Evidence guidance"],
  },
  {
    id: "iso27001",
    name: "ISO 27001",
    blurb: "Explore information security management requirements and control guidance.",
    detail:
      "Navigate ISMS-oriented requirements and control themes without digging through dense documentation alone.",
    points: ["ISMS requirements", "Risk treatment", "Annex A controls"],
  },
  {
    id: "hipaa",
    name: "HIPAA",
    blurb: "Understand key privacy and security requirements for protected health information.",
    detail:
      "Review privacy and security safeguard themes related to protecting health information.",
    points: ["Privacy requirements", "Security safeguards", "PHI protection"],
  },
  {
    id: "dpdp",
    name: "DPDP Act",
    blurb: "Explore obligations related to personal data protection under India's Digital Personal Data Protection Act.",
    detail:
      "Learn core DPDP concepts such as data principal rights and fiduciary responsibilities.",
    points: ["Data principal rights", "Consent obligations", "Data fiduciary responsibilities"],
  },
];

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Grounded Compliance Q&A",
    body: "Ask framework-specific questions and receive answers based on relevant compliance context from the knowledge base.",
  },
  {
    icon: Layers,
    title: "Framework Exploration",
    body: "Navigate SOC 2, ISO 27001, HIPAA, and the DPDP Act to understand requirements without starting from scratch.",
  },
  {
    icon: FileSearch,
    title: "Control & Requirement Guidance",
    body: "Break down complex controls and requirements into clearer, structured guidance you can review.",
  },
  {
    icon: Search,
    title: "Contextual Retrieval",
    body: "Retrieve relevant compliance knowledge before generating an AI-assisted response.",
  },
  {
    icon: BookOpen,
    title: "Source-Aware Responses",
    body: "Review the context and references used to support generated guidance where available.",
  },
  {
    icon: Shield,
    title: "Scan-Assisted Workflows",
    body: "Connect a GitHub repo, AWS account, or config upload to help surface compliance-related findings in your own environment.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Ask",
    body: "Ask a compliance question using natural language.",
  },
  {
    num: "02",
    title: "Retrieve",
    body: "Pramanik retrieves relevant context from its compliance knowledge base.",
  },
  {
    num: "03",
    title: "Understand",
    body: "Receive structured, context-aware guidance designed to make complex requirements easier to navigate.",
  },
];

function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function LandingPage({ onGetStarted, isAuthenticated, user, onLogout }) {
  const reduceMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFw, setActiveFw] = useState(FRAMEWORKS[0].id);
  const menuTitleId = useId();
  const closeBtnRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const fade = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] },
        };

  const active = FRAMEWORKS.find((f) => f.id === activeFw) || FRAMEWORKS[0];

  const navGo = (id) => {
    setMenuOpen(false);
    scrollToId(id);
  };

  return (
    <div className="lp">
      <div className="lp-shell">
        <header className={`lp-nav ${scrolled ? "lp-nav--scrolled" : ""}`}>
          <div className="lp-nav-inner">
            <button type="button" className="lp-brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              Pramanik
            </button>

            <nav className="lp-nav-links" aria-label="Primary">
              <a href="#product" onClick={(e) => { e.preventDefault(); scrollToId("product"); }}>Product</a>
              <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToId("how-it-works"); }}>How It Works</a>
              <a href="#frameworks" onClick={(e) => { e.preventDefault(); scrollToId("frameworks"); }}>Frameworks</a>
              <a href="#about" onClick={(e) => { e.preventDefault(); scrollToId("about"); }}>About</a>
            </nav>

            <div className="lp-nav-actions">
              <ThemeToggle />
              {isAuthenticated ? (
                <>
                  <button type="button" className="lp-btn lp-btn--ghost lp-btn--sm" onClick={onLogout}>
                    Logout
                  </button>
                  <button type="button" className="lp-btn lp-btn--solid lp-btn--sm" onClick={onGetStarted}>
                    Open Scanner
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="lp-btn lp-btn--ghost lp-btn--sm" onClick={onGetStarted}>
                    Login
                  </button>
                  <button type="button" className="lp-btn lp-btn--solid lp-btn--sm" onClick={onGetStarted}>
                    Get Started
                  </button>
                </>
              )}
              <button
                type="button"
                className="lp-menu-btn"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                aria-controls="lp-mobile-drawer"
                onClick={() => setMenuOpen((v) => !v)}
              >
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </header>

        {menuOpen && (
          <div className="lp-drawer" role="presentation" onClick={() => setMenuOpen(false)}>
            <div
              id="lp-mobile-drawer"
              className="lp-drawer-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby={menuTitleId}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <h2 id={menuTitleId} style={{ margin: 0, fontSize: "1rem", fontFamily: "Syne, system-ui, sans-serif" }}>Menu</h2>
                <button ref={closeBtnRef} type="button" className="lp-menu-btn" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <button type="button" className="lp-drawer-link" onClick={() => navGo("product")}>Product</button>
              <button type="button" className="lp-drawer-link" onClick={() => navGo("how-it-works")}>How It Works</button>
              <button type="button" className="lp-drawer-link" onClick={() => navGo("frameworks")}>Frameworks</button>
              <button type="button" className="lp-drawer-link" onClick={() => navGo("about")}>About</button>
              {isAuthenticated ? (
                <>
                  <button type="button" className="lp-btn lp-btn--ghost" style={{ marginTop: "1rem" }} onClick={() => { setMenuOpen(false); onLogout(); }}>
                    Logout
                  </button>
                  <button type="button" className="lp-btn lp-btn--solid" style={{ marginTop: "1rem" }} onClick={() => { setMenuOpen(false); onGetStarted(); }}>
                    Open Scanner
                  </button>
                </>
              ) : (
                <button type="button" className="lp-btn lp-btn--solid" style={{ marginTop: "1rem" }} onClick={() => { setMenuOpen(false); onGetStarted(); }}>
                  Get Started
                </button>
              )}
            </div>
          </div>
        )}

        {/* Hero */}
        <section className="lp-hero" aria-labelledby="lp-hero-title">
          <div>
            <motion.p className="lp-kicker" {...fade(0)}>AI-assisted compliance knowledge</motion.p>
            <motion.h1 id="lp-hero-title" className="lp-hero-title" {...fade(0.05)}>
              Navigate compliance.
              <br />
              Understand the <em>evidence</em>.
            </motion.h1>
            <motion.p className="lp-hero-copy" {...fade(0.1)}>
              Explore framework-specific requirements, understand controls, and get grounded answers across SOC 2, ISO 27001, HIPAA, and India&apos;s DPDP Act.
            </motion.p>
            <motion.div className="lp-hero-ctas" {...fade(0.15)}>
              <button type="button" className="lp-btn lp-btn--solid" onClick={onGetStarted}>
                {isAuthenticated ? "Open Scanner" : "Explore Pramanik"} <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button type="button" className="lp-btn lp-btn--ghost" onClick={() => scrollToId("frameworks")}>
                View Frameworks
              </button>
            </motion.div>
          </div>

          <motion.aside className="lp-rag" aria-label="Example compliance retrieval flow" {...fade(0.12)}>
            <div className="lp-rag-bar">
              <span className="lp-rag-dot" aria-hidden="true" />
              <span className="lp-rag-dot" aria-hidden="true" />
              <span className="lp-rag-dot" aria-hidden="true" />
              <span className="lp-rag-label">Workspace preview</span>
            </div>
            <div className="lp-rag-query">
              “What evidence is typically required for SOC 2 access controls?”
            </div>
            <div className="lp-rag-flow">
              <div className="lp-rag-step">
                <span className="lp-rag-step-idx">01</span>
                <div>
                  <strong>Query</strong>
                  <span>Natural-language compliance question</span>
                </div>
              </div>
              <div className="lp-rag-step">
                <span className="lp-rag-step-idx">02</span>
                <div>
                  <strong>Knowledge retrieval</strong>
                  <span>Pull relevant framework context from the knowledge base</span>
                </div>
              </div>
              <div className="lp-rag-step">
                <span className="lp-rag-step-idx">03</span>
                <div>
                  <strong>Grounded response</strong>
                  <span>Structured guidance with supporting context</span>
                </div>
              </div>
            </div>
            <div className="lp-rag-sources">
              <div className="lp-source-card">
                <small>Source</small>
                <p>SOC 2 · CC6 access control themes</p>
              </div>
              <div className="lp-source-card">
                <small>Context</small>
                <p>Evidence examples · MFA · least privilege</p>
              </div>
            </div>
          </motion.aside>
        </section>

        {/* Supported frameworks */}
        <section id="frameworks" className="lp-section" aria-labelledby="fw-heading">
          <p className="lp-kicker">4 supported frameworks</p>
          <h2 id="fw-heading" className="lp-h2">Explore guidance across four compliance and privacy frameworks.</h2>
          <p className="lp-lead">
            Pramanik helps teams understand requirements for the frameworks it currently supports — it does not issue certifications.
          </p>
          <div className="lp-fw-strip">
            {FRAMEWORKS.map((fw) => (
              <article key={fw.id} className="lp-fw-card">
                <h3>{fw.name}</h3>
                <p>{fw.blurb}</p>
              </article>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="lp-section" aria-labelledby="how-heading">
          <p className="lp-kicker">How Pramanik works</p>
          <h2 id="how-heading" className="lp-h2">From question to grounded guidance</h2>
          <p className="lp-lead">
            A simple retrieval-assisted flow designed to help you navigate dense compliance material more clearly.
          </p>
          <div className="lp-steps">
            {STEPS.map((step) => (
              <article key={step.num} className="lp-step">
                <div className="lp-step-num">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
          <div className="lp-pipeline" aria-hidden="true">
            <span className="node">Question</span>
            <span className="arrow">→</span>
            <span className="node">Retrieval</span>
            <span className="arrow">→</span>
            <span className="node">Relevant context</span>
            <span className="arrow">→</span>
            <span className="node">AI response</span>
          </div>
        </section>

        {/* Product / workspace */}
        <section id="product" className="lp-section" aria-labelledby="product-heading">
          <p className="lp-kicker">AI-assisted compliance workspace</p>
          <h2 id="product-heading" className="lp-h2">Built around knowledge, retrieval, and review</h2>
          <p className="lp-lead">
            These capabilities reflect what Pramanik actually provides today — assistants, scanners, and framework-aware guidance to help you understand compliance work.
          </p>
          <div className="lp-features">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <article key={title} className="lp-feature">
                <div className="lp-feature-icon" aria-hidden="true">
                  <Icon size={18} />
                </div>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Framework explorer */}
        <section className="lp-section" aria-labelledby="explorer-heading">
          <p className="lp-kicker">Framework explorer</p>
          <h2 id="explorer-heading" className="lp-h2">One workspace. Four frameworks.</h2>
          <p className="lp-lead">
            Select a framework to see example topics you can explore with Pramanik&apos;s guidance experience.
          </p>
          <div className="lp-explorer">
            <div className="lp-tabs" role="tablist" aria-label="Supported frameworks">
              {FRAMEWORKS.map((fw) => (
                <button
                  key={fw.id}
                  type="button"
                  role="tab"
                  id={`tab-${fw.id}`}
                  aria-selected={activeFw === fw.id}
                  aria-controls={`panel-${fw.id}`}
                  className="lp-tab"
                  onClick={() => setActiveFw(fw.id)}
                  onMouseEnter={() => setActiveFw(fw.id)}
                >
                  {fw.name}
                </button>
              ))}
            </div>
            <div
              className="lp-tab-panel"
              role="tabpanel"
              id={`panel-${active.id}`}
              aria-labelledby={`tab-${active.id}`}
            >
              <h3>{active.name}</h3>
              <p>{active.detail}</p>
              <ul>
                {active.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Responsible AI */}
        <section id="about" className="lp-section" aria-labelledby="about-heading">
          <p className="lp-kicker">Responsible use</p>
          <h2 id="about-heading" className="lp-h2">AI guidance with the right boundaries.</h2>
          <p className="lp-lead">
            Pramanik is designed to assist with compliance research and understanding. AI-generated responses should be reviewed against official framework documentation and professional guidance when making compliance or audit decisions.
          </p>
          <div className="lp-principles">
            <article className="lp-principle">
              <h3>Grounded</h3>
              <p>Uses relevant compliance context from the knowledge base where available.</p>
            </article>
            <article className="lp-principle">
              <h3>Transparent</h3>
              <p>Makes the supported framework scope clear: SOC 2, ISO 27001, HIPAA, and DPDP Act.</p>
            </article>
            <article className="lp-principle">
              <h3>Assistive</h3>
              <p>Supports human decision-making rather than replacing auditors or compliance professionals.</p>
            </article>
          </div>
        </section>

        {/* Final CTA */}
        <div className="lp-cta">
          <div className="lp-cta-inner">
            <div>
              <h2>Make compliance knowledge easier to navigate.</h2>
              <p>
                Start exploring framework guidance, ask grounded questions, and work through controls with clearer context.
              </p>
            </div>
            <div className="lp-cta-actions">
              <button type="button" className="lp-btn lp-btn--solid" onClick={onGetStarted}>
                {isAuthenticated ? "Open Scanner" : "Get Started"}
              </button>
              <button type="button" className="lp-btn lp-btn--ghost" onClick={() => scrollToId("frameworks")}>
                Explore Frameworks
              </button>
            </div>
          </div>
        </div>

        <footer className="lp-footer">
          <div className="lp-footer-inner">
            <p>© {new Date().getFullYear()} Pramanik · AI-assisted compliance knowledge</p>
            <div className="lp-footer-links">
              <a href="#product" onClick={(e) => { e.preventDefault(); scrollToId("product"); }}>Product</a>
              <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToId("how-it-works"); }}>How It Works</a>
              <a href="#frameworks" onClick={(e) => { e.preventDefault(); scrollToId("frameworks"); }}>Frameworks</a>
              <a href="#about" onClick={(e) => { e.preventDefault(); scrollToId("about"); }}>About</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
