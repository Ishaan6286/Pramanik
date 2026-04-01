import { useState, useRef } from "react";
import { API_URL } from "../config";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud, FileJson, ArrowRight, Shield, X, RefreshCw, Lock,
  Cloud, Key, Github, Check, Zap, FileCheck
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import GitHubAgent from "./GitHubAgent";

const AVAILABLE_FRAMEWORKS = [
  {
    key: "soc2",
    label: "SOC 2",
    subtitle: "AICPA Trust Services Criteria",
    color: "hsl(180, 35%, 52%)", // Pastel aqua
    controls: 33,
    popular: true,
  },
  {
    key: "iso27001",
    label: "ISO 27001",
    subtitle: "Information Security Management",
    color: "hsl(150, 28%, 50%)", // Pastel green
    controls: 31,
    popular: true,
  },
  {
    key: "hipaa",
    label: "HIPAA",
    subtitle: "Health Information Protection",
    color: "hsl(28, 55%, 58%)", // Pastel amber
    controls: 28,
    popular: false,
  },
  {
    key: "dpdp",
    label: "DPDP Act 2023",
    subtitle: "India Data Protection",
    color: "hsl(330, 32%, 62%)", // Pastel rose
    controls: 15,
    popular: true,
  },
];

const fadeUp = {
  hidden:  { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.2, 0, 0, 1] } }
};

export default function UploadPage({ onAnalysis, onBack, loading, setLoading, user, onLogout }) {
  const [file, setFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const [mode, setMode] = useState("upload"); // "upload", "aws", or "github"
  const [selectedFrameworks, setSelectedFrameworks] = useState(["soc2", "iso27001", "dpdp"]);
  const [error, setError] = useState(null);
  const [awsCreds, setAwsCreds] = useState({ access_key: "", secret_key: "", region: "ap-south-1", company_name: "" });
  
  const fileRef = useRef(null);

  const steps = [
    "Initializing Inference Core",
    "Mapping Resource Topology",
    "Surface Contact Analysis",
    "Policy Deep-Link Verification",
    "Generating Manifest Signal"
  ];

  const toggleFramework = (key) => {
    setSelectedFrameworks((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.type === "application/json" || f.name.endsWith(".json"))) setFile(f);
  };

  const filterFrameworks = (data) => {
    if (data.framework_scores) {
      const filtered = {};
      selectedFrameworks.forEach((key) => {
        if (data.framework_scores[key]) filtered[key] = data.framework_scores[key];
      });
      data.framework_scores = filtered;
      data.selected_frameworks = selectedFrameworks;
    }
    return data;
  };

  const handleStartAnalysis = async () => {
    if (!file || selectedFrameworks.length === 0) return;
    setScanning(true);
    setScanStep(0);
    setError(null);

    // Simulate progress while API is hitting
    let progressTimer = setInterval(() => {
       setScanStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1500);

    try {
      const configText = await file.text();
      const configJson = JSON.parse(configText);

      const formData = new FormData();
      formData.append("config", file);

      const response = await fetch(`${API_URL}/api/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Analysis failed");
      const data = await response.json();

      clearInterval(progressTimer);
      setScanStep(steps.length);

      setTimeout(() => {
        onAnalysis(filterFrameworks(data), configJson);
        setScanning(false);
        setLoading(false);
      }, 800);
    } catch (err) {
      setError("Failed to analyze: " + err.message);
      setScanning(false);
      clearInterval(progressTimer);
      setLoading(false);
    }
  };

  const handleAWSScan = async () => {
    if (!awsCreds.access_key || !awsCreds.secret_key) {
      setError("Please enter both Access Key and Secret Key");
      return;
    }
    setScanning(true);
    setScanStep(0);
    setError(null);

    let progressTimer = setInterval(() => {
       setScanStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2000);

    try {
      const response = await fetch(`${API_URL}/api/scan-aws`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...awsCreds, industry: "saas_startup" }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "AWS scan failed");
      }

      const data = await response.json();
      clearInterval(progressTimer);
      setScanStep(steps.length);

      setTimeout(() => {
        onAnalysis(filterFrameworks(data), {});
        setScanning(false);
        setLoading(false);
      }, 800);
    } catch (err) {
      setError("AWS scan failed: " + err.message);
      setScanning(false);
      clearInterval(progressTimer);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-[hsl(var(--col-bg))] text-[hsl(var(--col-text))] overflow-hidden selection:bg-[hsl(var(--col-primary)/0.12)] font-display">
      
      {/* ── Ambient Pattern ── */}
      <div className="absolute inset-0 z-0 bg-pattern-plus opacity-[0.18] pointer-events-none" />

      {/* ── TOP NAV ── */}
      <header className="relative z-50 max-w-[1400px] mx-auto px-8 h-16 flex items-center justify-between border-b border-[hsl(var(--col-border))] bg-white/70">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-[hsl(var(--col-border))] bg-[hsl(var(--col-primary)/0.10)]">
            <Shield className="w-4.5 h-4.5 text-[hsl(var(--col-primary))]" />
          </div>
          <span className="font-bold tracking-tight text-[16px] uppercase">Pramanik</span>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[hsl(var(--col-primary)/0.05)] text-[hsl(var(--col-muted))] hover:text-[hsl(var(--col-primary))] transition-all">
             <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── MAIN WORKSPACE ── */}
      <main className="relative z-10 max-w-5xl mx-auto min-h-[calc(100vh-64px)] flex flex-col items-center py-16 px-6">
        
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center mb-12">
          <span className="inline-block px-3 py-1 bg-[hsl(var(--col-primary)/0.08)] text-[hsl(var(--col-primary))] font-bold text-[11px] uppercase tracking-widest rounded-full mb-4 border border-[hsl(var(--col-primary)/0.12)]">
            Autonomous Ingestion
          </span>
          <h1 className="text-[36px] font-bold tracking-tight mb-3">
             Architecture Ingestion
          </h1>
          <p className="text-[16px] text-[hsl(var(--col-muted))] font-medium">
             Select target frameworks and scan your infrastructure for trust compliance.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 w-full">
           
           {/* LEFT COLUMN: Frameworks & Modes */}
           <motion.div variants={fadeUp} initial="hidden" animate="visible" className="lg:col-span-4 space-y-8">
              
              {/* Framework Selector */}
              <div className="space-y-4">
                 <div className="flex items-center justify-between px-1">
                    <h3 className="text-[13px] font-black uppercase tracking-widest text-[hsl(var(--col-muted))]">Target Frameworks</h3>
                    <span className="text-[11px] font-bold text-[hsl(var(--col-primary))]">{selectedFrameworks.length} selected</span>
                 </div>
                 <div className="grid grid-cols-1 gap-3">
                    {AVAILABLE_FRAMEWORKS.map((fw) => {
                      const selected = selectedFrameworks.includes(fw.key);
                      return (
                        <button
                          key={fw.key}
                          onClick={() => toggleFramework(fw.key)}
                          className={`relative p-4 rounded-2xl text-left border transition-all group overflow-hidden ${selected ? 'bg-white/75 border-[hsl(var(--col-primary)/0.35)]' : 'bg-white/55 border-[hsl(var(--col-border))] hover:bg-white/70 hover:border-[hsl(var(--col-primary)/0.22)]'}`}
                        >
                          <div className="flex items-center gap-3 mb-1">
                             <div className="w-6 h-6 rounded-full flex items-center justify-center border border-[hsl(var(--col-border))]" style={{ backgroundColor: selected ? fw.color : 'transparent', color: selected ? 'rgba(255,255,255,0.95)' : 'transparent' }}>
                                <Check className="w-3 h-3" />
                             </div>
                             <span className="font-bold text-[15px]">{fw.label}</span>
                          </div>
                          <p className="text-[12px] text-[hsl(var(--col-muted))] font-medium leading-tight">
                             {fw.subtitle}
                          </p>
                          {fw.popular && !selected && (
                             <span className="absolute top-4 right-4 text-[9px] font-bold uppercase tracking-tighter bg-[hsl(var(--col-accent)/0.08)] text-[hsl(var(--col-accent))] px-1.5 py-0.5 rounded border border-[hsl(var(--col-accent)/0.12)]">Popular</span>
                          )}
                        </button>
                      );
                    })}
                 </div>
              </div>

              {/* Ingestion method selector moved to right column */}
           </motion.div>

           {/* RIGHT COLUMN: Action Zone */}
           <motion.div variants={fadeUp} initial="hidden" animate="visible" className="lg:col-span-8 flex flex-col items-center">
             
              {/* Ingestion Method (horizontal) */}
              <div className="w-full mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[13px] font-black uppercase tracking-widest text-[hsl(var(--col-muted))] px-1">
                    Ingestion Method
                  </h3>
                </div>

                <div className="w-full flex items-center gap-2">
                  <button
                    onClick={() => setMode("upload")}
                    className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-[14px] font-bold border transition-all focus:outline-none focus:ring-4 focus:ring-[hsl(var(--col-primary))/0.10]
                      ${mode === "upload"
                        ? 'bg-[hsl(var(--col-primary)/0.07)] border-[hsl(var(--col-primary)/0.25)] text-[hsl(var(--col-primary))]'
                        : 'bg-white/55 border-[hsl(var(--col-border))] text-[hsl(var(--col-muted))] hover:bg-white/70 hover:border-[hsl(var(--col-primary)/0.18)]'}`}
                  >
                    <UploadCloud className="w-4 h-4" />
                    Local Config
                  </button>

                  <button
                    onClick={() => setMode("aws")}
                    className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-[14px] font-bold border transition-all focus:outline-none focus:ring-4 focus:ring-[hsl(var(--col-primary))/0.10]
                      ${mode === "aws"
                        ? 'bg-[hsl(var(--col-primary)/0.07)] border-[hsl(var(--col-primary)/0.25)] text-[hsl(var(--col-primary))]'
                        : 'bg-white/55 border-[hsl(var(--col-border))] text-[hsl(var(--col-muted))] hover:bg-white/70 hover:border-[hsl(var(--col-primary)/0.18)]'}`}
                  >
                    <Cloud className="w-4 h-4" />
                    Connect AWS
                  </button>

                  <button
                    onClick={() => setMode("github")}
                    className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-[14px] font-bold border transition-all focus:outline-none focus:ring-4 focus:ring-[hsl(var(--col-primary))/0.10]
                      ${mode === "github"
                        ? 'bg-[hsl(var(--col-primary)/0.07)] border-[hsl(var(--col-primary)/0.25)] text-[hsl(var(--col-primary))]'
                        : 'bg-white/55 border-[hsl(var(--col-border))] text-[hsl(var(--col-muted))] hover:bg-white/70 hover:border-[hsl(var(--col-primary)/0.18)]'}`}
                  >
                    <Github className="w-4 h-4" />
                    Scan GitHub
                  </button>
                </div>
              </div>
              
              {/* GitHub Agent View */}
              {mode === "github" && (
                <div className="w-full">
                  <GitHubAgent onResults={(data) => onAnalysis(filterFrameworks(data), {})} selectedFrameworks={selectedFrameworks} loading={loading} setLoading={setLoading} />
                </div>
              )}

              {/* AWS Connect View */}
              {mode === "aws" && (
                <div className="w-full space-y-6">
                  <div className="surface-raise p-10 rounded-[32px] bg-white border border-[hsl(var(--col-border))] space-y-6">
                    <div className="flex items-center gap-4 mb-4">
                       <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                          <Cloud className="w-6 h-6 text-amber-500" />
                       </div>
                       <div>
                          <h3 className="text-[18px] font-bold">AWS Account Bridge</h3>
                          <p className="text-[13px] text-[hsl(var(--col-muted))] font-medium">Read-only scanner for IAM, Networking, and S3 posture</p>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-[hsl(var(--col-muted))] ml-1">Access Key ID</label>
                        <div className="relative">
                          <Key className="absolute left-4 top-3.5 w-4 h-4 text-[hsl(var(--col-muted))]" />
                          <input type="text" placeholder="AKIA..." value={awsCreds.access_key} onChange={(e) => setAwsCreds({ ...awsCreds, access_key: e.target.value })} className="w-full pl-11 pr-4 py-3 rounded-xl bg-[hsl(var(--col-bg))] border border-[hsl(var(--col-border))] text-[14px] font-mono focus:ring-2 focus:ring-[hsl(var(--col-primary))/0.2] transition-all" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-[hsl(var(--col-muted))] ml-1">Secret Access Key</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-3.5 w-4 h-4 text-[hsl(var(--col-muted))]" />
                          <input type="password" placeholder="••••••••••••" value={awsCreds.secret_key} onChange={(e) => setAwsCreds({ ...awsCreds, secret_key: e.target.value })} className="w-full pl-11 pr-4 py-3 rounded-xl bg-[hsl(var(--col-bg))] border border-[hsl(var(--col-border))] text-[14px] font-mono focus:ring-2 focus:ring-[hsl(var(--col-primary))/0.2] transition-all" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-[hsl(var(--col-muted))] ml-1">Account Label</label>
                        <input type="text" placeholder="Production / Staging" value={awsCreds.company_name} onChange={(e) => setAwsCreds({ ...awsCreds, company_name: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--col-bg))] border border-[hsl(var(--col-border))] text-[14px]" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-[hsl(var(--col-muted))] ml-1">Primary Region</label>
                        <select value={awsCreds.region} onChange={(e) => setAwsCreds({ ...awsCreds, region: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-[hsl(var(--col-bg))] border border-[hsl(var(--col-border))] text-[14px]">
                          <option value="ap-south-1">Mumbai (ap-south-1)</option>
                          <option value="us-east-1">N. Virginia (us-east-1)</option>
                          <option value="eu-west-1">Ireland (eu-west-1)</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-4 flex flex-col items-center">
                       <button onClick={handleAWSScan} disabled={scanning} className="btn-primary w-full max-w-[320px] py-4 text-[16px] flex justify-center">
                          {scanning ? 'Connecting Account...' : 'Initiate AWS Audit'}
                       </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload View */}
              {mode === "upload" && (
                <div className="w-full space-y-8">
                  <motion.div
                    onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                    className={`relative w-full rounded-[32px] transition-all duration-500 overflow-hidden cursor-pointer flex flex-col items-center justify-center p-20 border-2 border-dashed
                      ${file 
                        ? 'bg-white border-[hsl(var(--col-primary))] shadow-[0_20px_60px_-10px_rgba(30,171,163,0.1)]' 
                        : isDragActive 
                          ? 'bg-white border-[hsl(var(--col-primary))] ring-8 ring-[hsl(var(--col-primary)/0.03)]' 
                          : 'bg-white/50 border-[hsl(var(--col-border))] hover:border-[hsl(var(--col-primary)/0.3)] hover:bg-white'}`}
                    onClick={() => !file && fileRef.current.click()}
                  >
                    <input type="file" ref={fileRef} hidden accept=".json" onChange={e => handleDrop({ preventDefault:()=>{}, stopPropagation:()=>{}, dataTransfer:{files:e.target.files} })} />

                    <AnimatePresence mode="wait">
                      {!file ? (
                        <motion.div key="empty" initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }} className="flex flex-col items-center text-center">
                          <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--col-primary)/0.05)] border border-[hsl(var(--col-primary)/0.1)] flex items-center justify-center mb-6">
                             <UploadCloud className="w-7 h-7 text-[hsl(var(--col-primary))]" />
                          </div>
                          <p className="font-bold text-[18px] mb-1">Click to upload manifest</p>
                          <p className="text-[14px] text-[hsl(var(--col-muted))] font-medium italic">Supports AWS, GCP, and Azure JSON exports</p>
                        </motion.div>
                      ) : (
                        <motion.div key="file" initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} className="flex flex-col items-center text-center w-full z-10">
                          <div className="w-20 h-20 rounded-3xl bg-[hsl(var(--col-primary)/0.1)] flex items-center justify-center mb-6 border border-[hsl(var(--col-primary)/0.2)]">
                            <FileJson className="w-8 h-8 text-[hsl(var(--col-primary))]" />
                          </div>
                          <h3 className="font-bold text-[20px] truncate max-w-[400px] text-[hsl(var(--col-text))] tracking-tight">{file.name}</h3>
                          <p className="text-[13px] font-bold text-[hsl(var(--col-muted))] mt-3 uppercase tracking-widest opacity-60">Ready for autonomous audit</p>
                          
                          <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="mt-10 text-[13px] font-bold text-[hsl(var(--col-muted))] hover:text-red-500 transition-all underline underline-offset-4">
                            Discard file
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  <div className="w-full flex flex-col items-center">
                    <AnimatePresence>
                      {file && (
                        <motion.button 
                          initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
                          onClick={handleStartAnalysis}
                          disabled={scanning}
                          className="btn-primary w-full max-w-[320px] group flex justify-center py-4 text-[16px]"
                        >
                          {scanning ? 'Initializing Analysis...' : 'Run Autonomous Audit'}
                          {!scanning && <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />}
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {error && mode !== "github" && (
                 <div className="mt-8 flex items-center gap-3 text-red-500 bg-red-50/50 border border-red-100 px-6 py-4 rounded-3xl w-full">
                    <X className="w-5 h-5 flex-shrink-0" />
                    <p className="text-[14px] font-medium">{error}</p>
                 </div>
              )}

              {mode !== "github" && (
                 <div className="flex items-center justify-center gap-10 mt-12 bg-white/40 border border-[hsl(var(--col-border))] px-8 py-3 rounded-full">
                   <div className="flex items-center gap-2.5 text-[12px] text-[hsl(var(--col-muted))] font-bold uppercase tracking-widest">
                     <Shield className="w-4 h-4 text-[hsl(var(--col-primary))]" />
                     Secure
                   </div>
                   <div className="w-px h-4 bg-[hsl(var(--col-border))]" />
                   <div className="flex items-center gap-2.5 text-[12px] text-[hsl(var(--col-muted))] font-bold uppercase tracking-widest">
                     <Lock className="w-4 h-4 text-[hsl(var(--col-primary))]" />
                     Private
                   </div>
                 </div>
              )}
           </motion.div>
        </div>

        {/* GitHub Results Bottom Row Portals (forces vertical alignment) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 w-full mt-6 empty:hidden">
           <div className="lg:col-span-4" id="github-bottom-left"></div>
           <div className="lg:col-span-8" id="github-bottom-right"></div>
        </div>
      </main>

      {/* ── SCANNING OVERLAY ── */}
      <AnimatePresence>
        {scanning && (
          <motion.div 
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-xl flex flex-col items-center justify-center p-6"
          >
            <div className="max-w-[480px] w-full flex flex-col items-center text-center">
               <div className="w-20 h-20 bg-gradient-to-br from-[hsl(var(--col-primary))] to-[hsl(var(--col-accent))] rounded-3xl flex items-center justify-center mb-10 shadow-2xl shadow-[hsl(var(--col-primary)/0.3)] animate-pulse">
                  <RefreshCw className="w-8 h-8 text-white animate-spin-slow" />
               </div>

               <div className="w-full space-y-6 mb-10">
                  <div className="flex justify-between items-end mb-3">
                     <p className="text-[14px] font-bold text-[hsl(var(--col-muted))] uppercase tracking-widest">Post-Processing Matrix</p>
                     <p className="text-[18px] font-black text-[hsl(var(--col-primary))]">
                        {Math.round(((scanStep + 1) / (steps.length + 1)) * 100)}%
                     </p>
                  </div>
                  <div className="h-2 w-full bg-[hsl(var(--col-border))] rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-[hsl(var(--col-primary))] to-[hsl(var(--col-accent))]" 
                      initial={{ width: 0 }}
                      animate={{ width: `${((scanStep + 1) / (steps.length + 1)) * 100}%` }}
                      transition={{ duration: 1.2, ease: "easeInOut" }}
                    />
                  </div>
               </div>

               <div className="h-16 w-full flex flex-col justify-center items-center">
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={scanStep}
                      initial={{ opacity:0, y:10 }} 
                      animate={{ opacity:1, y:0 }} 
                      exit={{ opacity:0, y:-10 }}
                      transition={{ duration: 0.4 }}
                      className="text-[16px] font-bold text-[hsl(var(--col-text))] tracking-tight"
                    >
                      {steps[scanStep] || "Finalizing Manifest Signal..."}
                    </motion.div>
                  </AnimatePresence>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
