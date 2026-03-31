import { useState } from "react";
import { ThemeProvider } from "./ThemeContext";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import UploadPage from "./components/UploadPage";
import Dashboard from "./components/Dashboard";

function AppContent() {
  const [page, setPage] = useState("landing"); // landing | login | upload | dashboard
  const [user, setUser] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [uploadedConfig, setUploadedConfig] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = (email) => {
    setUser(email);
    setPage("upload");
  };

  const handleLogout = () => {
    setUser(null);
    setAnalysisData(null);
    setUploadedConfig(null);
    setPage("landing");
  };

  const handleAnalysis = (data, config) => {
    setAnalysisData(data);
    setUploadedConfig(config);
    setPage("dashboard");
  };

  switch (page) {
    case "landing":
      return <LandingPage onGetStarted={() => setPage("login")} />;
    case "login":
      return <LoginPage onLogin={handleLogin} onBack={() => setPage("landing")} />;
    case "upload":
      return (
        <UploadPage
          onAnalysis={handleAnalysis}
          loading={loading}
          setLoading={setLoading}
          user={user}
          onLogout={handleLogout}
        />
      );
    case "dashboard":
      return (
        <Dashboard
          data={analysisData}
          config={uploadedConfig}
          onReset={() => setPage("upload")}
          user={user}
          onLogout={handleLogout}
        />
      );
    default:
      return <LandingPage onGetStarted={() => setPage("login")} />;
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
