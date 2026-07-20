import { useState, useEffect, createContext, useContext } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "./ThemeContext";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import UploadPage from "./components/UploadPage";
import Dashboard from "./components/Dashboard";
import PramanikAI from "./components/PramanikAI";
import ComplianceChatBot from "./components/ComplianceChatBot";
import ChatLauncher from "./components/ChatLauncher";

const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
// ── DIAGNOSTIC: visible in browser console and Vercel build logs ──
if (!GOOGLE_CLIENT_ID) {
  console.error(
    "[Pramanik] VITE_GOOGLE_CLIENT_ID is not set. " +
    "Add it in Vercel → Project → Settings → Environment Variables, " +
    "then redeploy. Google OAuth will not work until this is fixed."
  );
}
console.log("[Pramanik] Google client_id present:", !!GOOGLE_CLIENT_ID, "| trimmed length:", GOOGLE_CLIENT_ID.length);

export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("pramanik_user");
    const storedProfile = localStorage.getItem("pramanik_profile");
    if (storedUser) {
      setUser(storedUser);
      if (storedProfile) {
        try {
          setProfile(JSON.parse(storedProfile));
        } catch (e) {
          console.warn("Corrupted profile data, clearing.");
          localStorage.removeItem("pramanik_profile");
        }
      }
    }
    setIsAuthLoading(false);
  }, []);

  const login = (email, profileData) => {
    setUser(email);
    setProfile(profileData);
    localStorage.setItem("pramanik_user", email);
    if (profileData) {
      localStorage.setItem("pramanik_profile", JSON.stringify(profileData));
    }
  };

  const logout = () => {
    setUser(null);
    setProfile(null);
    localStorage.removeItem("pramanik_user");
    localStorage.removeItem("pramanik_profile");
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, profile, isAuthenticated, isAuthLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function AppContent() {
  const { user, isAuthenticated, isAuthLoading, login, logout } = useAuth();
  
  const [page, setPage] = useState(() => {
    if (window.location.pathname === "/auth/github/callback") {
      return "login";
    }
    return localStorage.getItem("pramanik_user") ? "upload" : "landing";
  });
  
  const [analysisData, setAnalysisData] = useState(null);
  const [uploadedConfig, setUploadedConfig] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = (email, profile) => {
    login(email, profile);
    setPage("upload");
  };

  const handleLogout = () => {
    logout();
    setAnalysisData(null);
    setUploadedConfig(null);
    setPage("landing");
  };

  const handleAnalysis = (data, config) => {
    setAnalysisData(data);
    setUploadedConfig(config);
    setPage("dashboard");
  };

  if (isAuthLoading) {
    return <div className="min-h-screen bg-[hsl(var(--col-bg))] flex items-center justify-center"></div>;
  }

  switch (page) {
    case "landing":
      return (
        <>
          <LandingPage 
            onGetStarted={() => isAuthenticated ? setPage("upload") : setPage("login")} 
            onChat={() => setPage("chat")} 
            isAuthenticated={isAuthenticated}
            user={user}
            onLogout={handleLogout}
          />
          <ChatLauncher />
        </>
      );
    case "login":
      return (
        <>
          <LoginPage onLogin={handleLogin} onBack={() => setPage(isAuthenticated ? "upload" : "landing")} />
          <ChatLauncher />
        </>
      );
    case "upload":
      return (
        <>
          <UploadPage
            onAnalysis={handleAnalysis}
            loading={loading}
            setLoading={setLoading}
            user={user}
            onLogout={handleLogout}
            onBack={() => setPage("landing")}
          />
          <ChatLauncher />
        </>
      );
    case "dashboard":
      return (
        <>
          <Dashboard
            data={analysisData}
            config={uploadedConfig}
            onReset={() => setPage("upload")}
            user={user}
            onLogout={handleLogout}
          />
          <ChatLauncher />
        </>
      );
    case "pramanik":
      return (
        <>
          <PramanikAI />
          <ChatLauncher />
        </>
      );
    case "chat":
      return <ComplianceChatBot />;
    default:
      return (
        <>
          <LandingPage 
            onGetStarted={() => isAuthenticated ? setPage("upload") : setPage("login")} 
            onChat={() => setPage("chat")} 
            isAuthenticated={isAuthenticated}
            user={user}
            onLogout={handleLogout}
          />
          <ChatLauncher />
        </>
      );
  }
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
