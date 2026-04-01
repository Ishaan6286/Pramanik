import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ArrowRight, Lock, Eye, EyeOff, ChevronLeft, Zap } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const NODES = [
  { label: "SOC 2",    x: "8%",  y: "18%", size: 52, delay: 0    },
  { label: "ISO\n27001", x: "88%", y: "12%", size: 58, delay: 0.3  },
  { label: "HIPAA",   x: "6%",  y: "72%", size: 48, delay: 0.6  },
  { label: "GDPR",    x: "90%", y: "65%", size: 52, delay: 0.2  },
  { label: "NIST",    x: "82%", y: "38%", size: 44, delay: 0.5  },
  { label: "DPDP",    x: "14%", y: "44%", size: 44, delay: 0.4  },
];

export default function LoginPage({ onLogin, onBack }) {
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused]   = useState(null);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const email = e.target.email.value || "user@pramanik.ai";
      onLogin(email);
    }, 900);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[hsl(var(--col-bg))] text-[hsl(var(--col-text))] overflow-hidden p-6">

      {/* ── AMBIENT GLOW ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-5%] w-[70vw] h-[70vw] rounded-full blur-[130px] opacity-[0.07]"
          style={{ background: "radial-gradient(circle, hsl(var(--col-primary)) 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[55vw] h-[55vw] rounded-full blur-[110px] opacity-[0.05]"
          style={{ background: "radial-gradient(circle, hsl(var(--col-accent)) 0%, transparent 70%)" }} />
      </div>

      {/* ── FLOATING FRAMEWORK NODES ── */}
      {NODES.map(({ label, x, y, size, delay }) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
          transition={{ opacity: { duration: 0.6, delay }, scale: { duration: 0.6, delay }, y: { duration: 4 + delay, repeat: Infinity, ease: "easeInOut", delay } }}
          className="absolute pointer-events-none z-0 hidden md:flex flex-col items-center justify-center rounded-full font-bold text-white text-center leading-tight"
          style={{
            left: x, top: y,
            width: size, height: size,
            fontSize: size * 0.17,
            background: "linear-gradient(135deg, hsl(var(--col-primary)/0.7), hsl(var(--col-accent)/0.5))",
            boxShadow: "0 4px 24px hsl(var(--col-primary)/0.2)",
            border: "1px solid hsl(var(--col-primary)/0.3)",
            backdropFilter: "blur(8px)",
          }}
        >
          {label.split("\n").map((t, i) => <span key={i}>{t}</span>)}
        </motion.div>
      ))}

      {/* ── TOP NAV ── */}
      <nav className="absolute top-0 inset-x-0 z-20 max-w-[1400px] mx-auto px-8 py-8 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto cursor-pointer group" onClick={onBack}>
          <div className="w-10 h-10 flex items-center justify-center bg-[hsl(var(--col-surface))] border border-[hsl(var(--col-border))] rounded-xl shadow-sm group-hover:border-[hsl(var(--col-primary)/0.5)] transition-all">
            <img src="/logo.png" alt="Pramanik" className="w-6 h-6 object-contain" onError={e => e.target.style.display='none'} />
            <Shield className="w-5 h-5 text-[hsl(var(--col-primary))]" style={{ display: 'none' }} />
          </div>
          <span className="font-bold text-[18px] tracking-tight group-hover:text-[hsl(var(--col-primary))] transition-colors">PRAMANIK</span>
        </div>
        <div className="flex items-center gap-3 pointer-events-auto">
          {onBack && (
            <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] font-medium text-[hsl(var(--col-muted))] hover:text-[hsl(var(--col-text))] transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          <ThemeToggle />
        </div>
      </nav>

      {/* ── MAIN CARD ── */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[440px]"
      >
        {/* Card glow ring */}
        <div className="absolute -inset-px rounded-[28px] bg-gradient-to-br from-[hsl(var(--col-primary)/0.4)] via-transparent to-[hsl(var(--col-accent)/0.2)] blur-sm pointer-events-none" />

        <div className="relative bg-[hsl(var(--col-surface))] border border-[hsl(var(--col-border))] rounded-[28px] p-10 shadow-[0_32px_80px_rgba(0,0,0,0.18)] overflow-hidden">

          {/* Card interior top-left flare */}
          <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full blur-[60px] opacity-20 pointer-events-none"
            style={{ background: "hsl(var(--col-primary))" }} />

          {/* ── HEADER ── */}
          <div className="relative text-center mb-10">
            {/* Icon */}
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[hsl(var(--col-primary))] to-[hsl(var(--col-accent))] flex items-center justify-center shadow-[0_6px_24px_hsl(var(--col-primary)/0.4)]">
              <Shield className="w-7 h-7 text-white" />
            </div>

            <h1 className="font-bold text-[34px] tracking-tight leading-none mb-3">
              Access <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--col-primary))] to-[hsl(var(--col-accent))]">Vault.</span>
            </h1>
            <p className="text-[11px] font-bold text-[hsl(var(--col-muted))] uppercase tracking-[0.22em] font-mono">
              Restricted Personnel Only
            </p>
          </div>

          {/* ── FORM ── */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[hsl(var(--col-muted))] font-mono">
                Identity
              </label>
              <div className={`relative flex items-center rounded-xl border transition-all duration-200 ${
                focused === 'email'
                  ? 'border-[hsl(var(--col-primary))] shadow-[0_0_0_3px_hsl(var(--col-primary)/0.12)]'
                  : 'border-[hsl(var(--col-border))]'
              } bg-[hsl(var(--col-raise))]`}>
                <span className="pl-4 text-[hsl(var(--col-muted))]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  name="email"
                  type="email"
                  placeholder="you@pramanik.ai"
                  required
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  className="w-full bg-transparent px-3 py-3.5 text-[15px] font-medium focus:outline-none placeholder:text-[hsl(var(--col-muted)/0.4)]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[hsl(var(--col-muted))] font-mono">
                Passkey
              </label>
              <div className={`relative flex items-center rounded-xl border transition-all duration-200 ${
                focused === 'password'
                  ? 'border-[hsl(var(--col-primary))] shadow-[0_0_0_3px_hsl(var(--col-primary)/0.12)]'
                  : 'border-[hsl(var(--col-border))]'
              } bg-[hsl(var(--col-raise))]`}>
                <span className="pl-4 text-[hsl(var(--col-muted))]">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  name="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••••••"
                  required
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  className="w-full bg-transparent px-3 py-3.5 text-[15px] font-mono focus:outline-none placeholder:text-[hsl(var(--col-muted)/0.4)]"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="pr-4 text-[hsl(var(--col-muted))] hover:text-[hsl(var(--col-primary))] transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <motion.button
                type="submit"
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className="relative w-full py-3.5 rounded-xl font-bold text-[15px] text-white overflow-hidden group"
                style={{ background: "linear-gradient(135deg, hsl(var(--col-primary)), hsl(var(--col-accent)))" }}
              >
                {/* Shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative flex items-center justify-center gap-2">
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-2">
                        Open Subsystem <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              </motion.button>
            </div>

            {/* OAuth */}
            <div className="space-y-4 pt-1">
              <div className="relative flex items-center gap-3">
                <div className="flex-1 h-px bg-[hsl(var(--col-border))]" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[hsl(var(--col-muted))]">Or access with</span>
                <div className="flex-1 h-px bg-[hsl(var(--col-border))]" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    name: "Google",
                    icon: (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    )
                  },
                  {
                    name: "Microsoft",
                    icon: (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#f35325" d="M1 1h10.5v10.5H1z"/>
                        <path fill="#81bc06" d="M12.5 1H23v10.5H12.5z"/>
                        <path fill="#05a6f0" d="M1 12.5h10.5V23H1z"/>
                        <path fill="#ffba08" d="M12.5 12.5H23V23H12.5z"/>
                      </svg>
                    )
                  },
                  {
                    name: "GitHub",
                    icon: (
                      <svg className="w-5 h-5 text-[hsl(var(--col-text))]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                      </svg>
                    )
                  }
                ].map(({ name, icon }) => (
                  <motion.button key={name} type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
                    className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl border border-[hsl(var(--col-border))] bg-[hsl(var(--col-raise))] hover:border-[hsl(var(--col-primary)/0.4)] hover:bg-[hsl(var(--col-primary)/0.04)] transition-all text-[12px] font-semibold text-[hsl(var(--col-sub))]">
                    {icon}
                    <span className="hidden sm:inline">{name}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </form>

          {/* ── SECURITY BADGE ── */}
          <div className="mt-8 flex items-center justify-center gap-2 opacity-40">
            <div className="h-px flex-1 bg-[hsl(var(--col-border))]" />
            <div className="flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em]">AES-256 Protocol Active</span>
            </div>
            <div className="h-px flex-1 bg-[hsl(var(--col-border))]" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
