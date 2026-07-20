import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGoogleLogin } from "@react-oauth/google";
import { Shield, ArrowRight, Lock, Eye, EyeOff, ChevronLeft } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { API_URL } from "../config";

const NODES = [
  { id: "n1", label: "SOC 2",    x: "8%",  y: "18%", size: 48, delay: 0    },
  { id: "n2", label: "ISO\n27001", x: "88%", y: "12%", size: 54, delay: 0.3  },
  { id: "n3", label: "HIPAA",   x: "6%",  y: "72%", size: 44, delay: 0.6  },
  { id: "n4", label: "DPDP",    x: "90%", y: "65%", size: 48, delay: 0.2  },
  { id: "n5", label: "SOC 2",   x: "82%", y: "38%", size: 40, delay: 0.5  },
  { id: "n6", label: "ISO",     x: "14%", y: "44%", size: 40, delay: 0.4  },
];

export default function LoginPage({ onLogin, onBack }) {
  const [showPass, setShowPass]   = useState(false);
  const [focused, setFocused]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [oauthError, setOauthError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setOauthError(null);
    setTimeout(() => {
      const email = e.target.email.value || "user@pramanik.ai";
      onLogin(email);
    }, 900);
  };

  const googleLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (codeResponse) => {
      setLoading(true);
      setOauthError(null);
      try {
        // ── DIAGNOSTIC (safe — no secret logged) ──
        const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
        console.log("[OAuth:Google] client_id present:", !!googleClientId, "| trimmed length:", googleClientId.length);
        console.log("[OAuth:Google] API_URL:", API_URL);

        const res = await fetch(`${API_URL}/api/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: codeResponse.code }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(typeof data.detail === "string" ? data.detail : "Google sign-in failed");
        }
        // ── Reset loading BEFORE calling onLogin so the spinner clears ──
        setLoading(false);
        onLogin(data.email, data);
      } catch (err) {
        setOauthError(err.message || "Google sign-in failed");
        setLoading(false);
      }
    },
    onError: (err) => {
      console.error("[OAuth:Google] provider error:", err);
      setOauthError("Google sign-in was cancelled or failed");
      setLoading(false);
    },
  });

  const handleGitHubClick = () => {
    setLoading(true);
    setOauthError(null);
    try {
      // Trim the client ID to remove any accidental whitespace from env vars
      const clientId = (import.meta.env.VITE_GITHUB_CLIENT_ID || "").trim();

      // ── DIAGNOSTIC (safe — client_id is public, no secret logged) ──
      console.log("[OAuth:GitHub] client_id present:", !!clientId, "| trimmed length:", clientId.length);

      if (!clientId) {
        throw new Error("GitHub client ID is not configured. Set VITE_GITHUB_CLIENT_ID in Vercel environment variables.");
      }

      // CSRF state token
      const state = crypto.randomUUID
        ? crypto.randomUUID().replace(/-/g, "")
        : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("pramanik_github_state", state);

      // Build URL with URLSearchParams — no manual encoding mistakes
      const redirectUri = `${window.location.origin}/auth/github/callback`;
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: "read:user user:email",
        state,
      });
      const githubUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

      // ── DIAGNOSTIC ──
      console.log("[OAuth:GitHub] authorization URL:", githubUrl);

      window.location.href = githubUrl;
    } catch (err) {
      console.error("[OAuth:GitHub] initiation error:", err);
      setOauthError(err.message || "Failed to initiate GitHub login");
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkGitHubCallback = async () => {
      const path = window.location.pathname;
      if (path !== "/auth/github/callback") return;

      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");
      const storedState = localStorage.getItem("pramanik_github_state");

      // Instantly clear callback parameters from URL
      window.history.replaceState({}, document.title, window.location.origin + "/login");

      if (!code) {
        const errorMsg = params.get("error_description") || params.get("error") || "GitHub authentication failed";
        setOauthError(errorMsg);
        return;
      }

      if (!state || state !== storedState) {
        setOauthError("CSRF state mismatch. Authentication aborted for security.");
        localStorage.removeItem("pramanik_github_state");
        return;
      }

      localStorage.removeItem("pramanik_github_state");
      setLoading(true);
      setOauthError(null);

      try {
        const res = await fetch(`${API_URL}/api/auth/github`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(typeof data.detail === "string" ? data.detail : "GitHub sign-in failed");
        }
        console.log("[OAuth:GitHub] callback success, email:", data.email ? "present" : "missing");
        // Reset loading BEFORE calling onLogin so spinner clears
        setLoading(false);
        onLogin(data.email, data);
      } catch (err) {
        console.error("[OAuth:GitHub] callback error:", err);
        setOauthError(err.message || "GitHub sign-in failed");
        setLoading(false);
      }
    };

    checkGitHubCallback();
  }, [onLogin]);

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[hsl(var(--col-bg))] text-[hsl(var(--col-text))] overflow-hidden p-6">

      {/* ── AMBIENT GLOW — calmer ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-12%] left-[-4%] w-[65vw] h-[65vw] rounded-full blur-[140px] opacity-[0.05]"
          style={{ background: "radial-gradient(circle, hsl(var(--col-primary)) 0%, transparent 68%)" }} />
        <div className="absolute bottom-[-8%] right-[-4%] w-[50vw] h-[50vw] rounded-full blur-[120px] opacity-[0.04]"
          style={{ background: "radial-gradient(circle, hsl(var(--col-accent)) 0%, transparent 68%)" }} />
      </div>

      {/* ── FLOATING FRAMEWORK NODES — ambient, subtle ── */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.22]">
        {NODES.map(({ id, label, x, y, size, delay }) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
            transition={{
              opacity: { duration: 0.6, delay },
              scale: { duration: 0.6, delay },
              y: { duration: 5 + delay, repeat: Infinity, ease: "easeInOut", delay }
            }}
            className="absolute hidden md:flex flex-col items-center justify-center rounded-full font-semibold text-white text-center leading-tight"
            style={{
              left: x, top: y,
              width: size, height: size,
              fontSize: size * 0.17,
              background: "linear-gradient(135deg, hsl(var(--col-primary)/0.65), hsl(var(--col-accent)/0.45))",
              border: "1px solid hsl(var(--col-primary)/0.25)",
              backdropFilter: "blur(6px)",
            }}
          >
            {label.split("\n").map((t, i) => <span key={i}>{t}</span>)}
          </motion.div>
        ))}
      </div>

      {/* ── TOP NAV ── */}
      <nav className="absolute top-0 inset-x-0 z-20 max-w-[1400px] mx-auto px-8 py-6 flex items-center justify-between pointer-events-none">
        <div className="flex items-center pointer-events-auto cursor-pointer hover:opacity-75 transition-opacity" onClick={onBack}>
          <span className="font-extrabold text-[22px] tracking-tight text-[hsl(var(--col-primary))]">Pramanik</span>
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
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <div className="relative bg-[hsl(var(--col-surface))] border border-[hsl(var(--col-border))] rounded-[20px] p-9 shadow-[0_16px_48px_rgba(0,0,0,0.08)] overflow-hidden">

          {/* Very subtle card interior glow */}
          <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full blur-[50px] opacity-[0.08] pointer-events-none"
            style={{ background: "hsl(var(--col-primary))" }} />

          {/* ── HEADER ── */}
          <div className="relative text-center mb-8">
            {/* Icon */}
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[hsl(var(--col-primary))] to-[hsl(var(--col-accent))] flex items-center justify-center shadow-[0_4px_16px_hsl(var(--col-primary)/0.3)]">
              <Shield className="w-6 h-6 text-white" />
            </div>

            <h1 className="font-bold text-[30px] tracking-tight leading-none mb-2">
              Sign in to <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--col-primary))] to-[hsl(var(--col-accent))]">Pramanik</span>
            </h1>
            <p className="text-[11px] font-semibold text-[hsl(var(--col-muted))] uppercase tracking-[0.16em]">
              Compliance Intelligence Platform
            </p>
          </div>

          {/* ── FORM ── */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[hsl(var(--col-muted))]">
                Email
              </label>
              <div className={`relative flex items-center rounded-[10px] border transition-all duration-200 ${
                focused === 'email'
                  ? 'border-[hsl(var(--col-primary))] shadow-[0_0_0_3px_hsl(var(--col-primary)/0.10)]'
                  : 'border-[hsl(var(--col-border))]'
              } bg-[hsl(var(--col-raise))]`}>
                <span className="pl-3.5 text-[hsl(var(--col-muted))]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
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
                  className="w-full bg-transparent px-3 py-3 text-[14px] font-medium focus:outline-none placeholder:text-[hsl(var(--col-muted)/0.4)]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[hsl(var(--col-muted))]">
                Password
              </label>
              <div className={`relative flex items-center rounded-[10px] border transition-all duration-200 ${
                focused === 'password'
                  ? 'border-[hsl(var(--col-primary))] shadow-[0_0_0_3px_hsl(var(--col-primary)/0.10)]'
                  : 'border-[hsl(var(--col-border))]'
              } bg-[hsl(var(--col-raise))]`}>
                <span className="pl-3.5 text-[hsl(var(--col-muted))]">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  name="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••••••"
                  required
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  className="w-full bg-transparent px-3 py-3 text-[14px] font-mono focus:outline-none placeholder:text-[hsl(var(--col-muted)/0.4)]"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="pr-3.5 text-[hsl(var(--col-muted))] hover:text-[hsl(var(--col-primary))] transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-1">
              <motion.button
                type="submit"
                whileTap={{ scale: 0.99 }}
                disabled={loading}
                className="relative w-full py-3 rounded-[10px] font-semibold text-[14px] text-white overflow-hidden"
                style={{ background: "linear-gradient(135deg, hsl(var(--col-primary)), hsl(var(--col-accent)))" }}
              >
                <span className="relative flex items-center justify-center gap-2">
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-2">
                        Sign In <ArrowRight className="w-4 h-4" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              </motion.button>
            </div>

            {/* OAuth */}
            <div className="space-y-3 pt-1">
              <div className="relative flex items-center gap-3">
                <div className="flex-1 h-px bg-[hsl(var(--col-border))]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--col-muted))]">Or access with</span>
                <div className="flex-1 h-px bg-[hsl(var(--col-border))]" />
              </div>

              {oauthError && (
                <p className="text-[12px] text-center text-red-500/90 font-medium">{oauthError}</p>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <motion.button
                  type="button"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={loading}
                  onClick={() => googleLogin()}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-[10px] border border-[hsl(var(--col-border))] bg-[hsl(var(--col-raise))] hover:border-[hsl(var(--col-primary)/0.35)] hover:bg-[hsl(var(--col-primary)/0.03)] transition-all text-[11px] font-medium text-[hsl(var(--col-sub))] disabled:opacity-60"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Google</span>
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleGitHubClick}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-[10px] border border-[hsl(var(--col-border))] bg-[hsl(var(--col-raise))] hover:border-[hsl(var(--col-primary)/0.35)] hover:bg-[hsl(var(--col-primary)/0.03)] transition-all text-[11px] font-medium text-[hsl(var(--col-sub))]"
                >
                  <svg className="w-4 h-4 text-[hsl(var(--col-text))]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                  </svg>
                  <span>GitHub</span>
                </motion.button>
              </div>
            </div>
          </form>

          {/* ── SECURITY BADGE ── */}
          <div className="mt-7 flex items-center justify-center gap-2 opacity-25">
            <div className="h-px flex-1 bg-[hsl(var(--col-border))]" />
            <div className="flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              <span className="text-[9px] font-mono font-semibold uppercase tracking-[0.18em]">End-to-end encrypted</span>
            </div>
            <div className="h-px flex-1 bg-[hsl(var(--col-border))]" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
