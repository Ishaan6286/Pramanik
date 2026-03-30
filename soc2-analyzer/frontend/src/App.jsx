import { useState } from "react";
import UploadPage from "./components/UploadPage";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [analysisData, setAnalysisData] = useState(null);
  const [uploadedConfig, setUploadedConfig] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalysis = (data, config) => {
    setAnalysisData(data);
    setUploadedConfig(config);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {!analysisData ? (
        <UploadPage
          onAnalysis={handleAnalysis}
          loading={loading}
          setLoading={setLoading}
        />
      ) : (
        <Dashboard
          data={analysisData}
          config={uploadedConfig}
          onReset={() => setAnalysisData(null)}
        />
      )}
    </div>
  );
}
