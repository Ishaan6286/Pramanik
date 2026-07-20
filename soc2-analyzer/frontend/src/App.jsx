import { useState } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "./ThemeContext";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import UploadPage from "./components/UploadPage";
import Dashboard from "./components/Dashboard";
import PramanikAI from "./components/PramanikAI";
import ComplianceChatBot from "./components/ComplianceChatBot";
import ChatLauncher from "./components/ChatLauncher";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function AppContent() {
  const [user, setUser] = useState(() => localStorage.getItem("pramanik_user"));
  const [page, setPage] = useState(() => (localStorage.getItem("pramanik_user") ? "upload" : "landing"));
  const [analysisData, setAnalysisData] = useState(null);
  const [uploadedConfig, setUploadedConfig] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = (email, profile) => {
    setUser(email);
    localStorage.setItem("pramanik_user", email);
    if (profile) {
      localStorage.setItem("pramanik_profile", JSON.stringify(profile));
    }
    setPage("upload");
  };

  const handleLogout = () => {
    setUser(null);
    setAnalysisData(null);
    setUploadedConfig(null);
    localStorage.removeItem("pramanik_user");
    localStorage.removeItem("pramanik_profile");
    setPage("landing");
  };

  const handleAnalysis = (data, config) => {
    setAnalysisData(data);
    setUploadedConfig(config);
    setPage("dashboard");
  };

  switch (page) {
    case "landing":
      return (
        <>
          <LandingPage onGetStarted={() => setPage("login")} onChat={() => setPage("chat")} />
          <ChatLauncher />
        </>
      );
    case "login":
      return (
        <>
          <LoginPage onLogin={handleLogin} onBack={() => setPage("landing")} />
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
          <LandingPage onGetStarted={() => setPage("login")} onChat={() => setPage("chat")} />
          <ChatLauncher />
        </>
      );
  }
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
