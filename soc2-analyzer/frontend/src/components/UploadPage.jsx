import { useState } from "react";
import { Shield, Upload, Zap, FileCheck } from "lucide-react";

export default function UploadPage({ onAnalysis, loading, setLoading }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);

  const handleFile = (f) => {
    if (f && f.name.endsWith('.json')) {
      setFile(f);
      setError(null);
    } else {
      setError('Please upload a JSON file');
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const configText = await file.text();
      const configJson = JSON.parse(configText);

      const formData = new FormData();
      formData.append('config', file);

      const response = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();
      onAnalysis(data, configJson);
    } catch (err) {
      setError('Failed to analyze: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Shield className="w-10 h-10 text-blue-400" />
          <h1 className="text-4xl font-bold">SOC2 Analyzer</h1>
        </div>
        <p className="text-gray-400 text-xl">
          Get SOC 2 audit-ready in 2 minutes, not 9 months
        </p>
        <p className="text-gray-500 mt-2">
          Upload your AWS config → AI finds every gap → Get policies + report
        </p>
      </div>

      {/* Stats Bar */}
      <div className="flex flex-wrap gap-8 mb-10 text-center justify-center">
        <div>
          <div className="text-2xl font-bold text-blue-400">9 months</div>
          <div className="text-gray-500 text-sm">Traditional time</div>
        </div>
        <div className="text-gray-600 text-2xl flex items-center">→</div>
        <div>
          <div className="text-2xl font-bold text-green-400">2 minutes</div>
          <div className="text-gray-500 text-sm">With SOC2 Analyzer</div>
        </div>
        <div className="text-gray-600 text-2xl flex items-center mx-4">|</div>
        <div>
          <div className="text-2xl font-bold text-blue-400">₹60 lakhs</div>
          <div className="text-gray-500 text-sm">Traditional cost</div>
        </div>
        <div className="text-gray-600 text-2xl flex items-center">→</div>
        <div>
          <div className="text-2xl font-bold text-green-400">₹2,000/mo</div>
          <div className="text-gray-500 text-sm">Our price</div>
        </div>
      </div>

      {/* Upload Box */}
      <div
        className={`w-full max-w-xl border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
          ${dragOver ? 'border-blue-400 bg-blue-950' : 'border-gray-700 hover:border-gray-500'}
          ${file ? 'border-green-500 bg-green-950/30' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => document.getElementById('fileInput').click()}
      >
        <input
          id="fileInput"
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {file ? (
          <div>
            <FileCheck className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-green-400 font-semibold text-lg">{file.name}</p>
            <p className="text-gray-500 text-sm mt-1">Ready to analyze</p>
          </div>
        ) : (
          <div>
            <Upload className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-300 font-semibold text-lg">Drop your AWS config JSON here</p>
            <p className="text-gray-500 text-sm mt-2">or click to browse</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-400 mt-4">{error}</p>
      )}

      <button
        onClick={handleAnalyze}
        disabled={!file || loading}
        className={`mt-6 px-10 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition-all
          ${file && !loading
            ? 'bg-blue-600 hover:bg-blue-500 cursor-pointer'
            : 'bg-gray-700 cursor-not-allowed opacity-50'}`}
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Analyzing with AI...
          </>
        ) : (
          <>
            <Zap className="w-5 h-5" />
            Analyze Compliance
          </>
        )}
      </button>
    </div>
  );
}
