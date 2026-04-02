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
    color: "hsl(168, 46%, 35%)",
    controls: 33,
    popular: true,
  },
  {
    key: "iso27001",
    label: "ISO 27001",
    subtitle: "Information Security Management",
    color: "hsl(152, 36%, 40%)",
    controls: 31,
    popular: true,
  },
  {
    key: "hipaa",
    label: "HIPAA",
    subtitle: "Health Information Protection",
    color: "hsl(28, 45%, 52%)",
    controls: 28,
    popular: false,
  },
  {
    key: "dpdp",
    label: "DPDP Act 2023",
    subtitle: "India Data Protection",
    color: "hsl(330, 28%, 56%)",
    controls: 15,
    popular: true,
  },
];

const fadeUp = {
  hidden:  { opacity: 0, y: 12 },
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
    <div className="min-h-screen relative bg-[hsl(var(--col-bg))] text-[hsl(var(--col-text))] overflow-hidden font-display">
      
      {/* ── Ambient Pattern — lighter ── */}
      <div className="absolute inset-0 z-0 bg-pattern-dots opacity-[0.10] pointer-events-none" />

      {/* ── TOP NAV ── */}
      <header className="relative z-50 border-b border-[hsl(var(--col-border))] bg-[hsl(var(--col-bg)/0.85)] backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-8 h-14 flex items-center justify-between">
          <div className="flex items-center">
            <span className="font-extrabold text-[22px] tracking-tight text-[hsl(var(--col-primary))]">Pramanik</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[hsl(var(--col-primary)/0.06)] text-[hsl(var(--col-muted))] hover:text-[hsl(var(--col-primary))] transition-all">
               <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN WORKSPACE ── */}
      <main className="relative z-10 max-w-5xl mx-auto min-h-[calc(100vh-56px)] flex flex-col items-center py-14 px-6">
        
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center mb-10">
          <span className="badge mb-4">
            Compliance Scanner
          </span>
          <h1 className="text-[30px] font-bold tracking-tight mt-3 mb-2">
             Scan Your Code
          </h1>
          <p className="text-[15px] text-[hsl(var(--col-muted))] font-normal">
             Select compliance frameworks, connect your codebase, and get instant results.
          </p>
        </motion.div>

        <div className="w-full max-w-2xl mx-auto">

           {/* MAIN CONTENT */}
           <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col items-center">
             
              {/* Ingestion Method (horizontal) */}
              <div className="w-full mb-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[12px] font-bold uppercase tracking-widest text-[hsl(var(--col-muted))] px-1">
                    Scan Method
                  </h3>
                </div>

                <div className="w-full flex items-center gap-2">
                  {[
                    { id: "upload", label: "Upload Config", icon: UploadCloud },
                    { id: "aws",    label: "Connect AWS",  icon: Cloud },
                    { id: "github", label: "Scan GitHub",  icon: Github },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setMode(id)}
                      className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-semibold border transition-all focus:outline-none
                        ${mode === id
                          ? 'bg-[hsl(var(--col-primary)/0.08)] border-[hsl(var(--col-primary)/0.28)] text-[hsl(var(--col-primary))]'
                          : 'bg-[hsl(var(--col-surface))] border-[hsl(var(--col-border))] text-[hsl(var(--col-muted))] hover:bg-[hsl(var(--col-raise))] hover:border-[hsl(var(--col-primary)/0.18)] hover:text-[hsl(var(--col-text))]'}`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
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
                <div className="w-full space-y-5">
                  <div className="surface-raise p-8 rounded-2xl bg-[hsl(var(--col-surface))] border border-[hsl(var(--col-border))] space-y-5">
                    <div className="flex items-center gap-4 mb-2">
                       <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                          <Cloud className="w-5 h-5 text-amber-500" />
                       </div>
                       <div>
                          <h3 className="text-[17px] font-bold tracking-tight">AWS Account Bridge</h3>
                          <p className="text-[12px] text-[hsl(var(--col-muted))] font-medium">Read-only scanner for IAM, Networking, and S3 posture</p>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--col-muted))]">Access Key ID</label>
                        <div className="relative">
                          <Key className="absolute left-3.5 top-3 w-4 h-4 text-[hsl(var(--col-muted))]" />
                          <input type="text" placeholder="AKIA..." value={awsCreds.access_key} onChange={(e) => setAwsCreds({ ...awsCreds, access_key: e.target.value })} className="w-full pl-10 pr-4 py-2.5 rounded-[10px] bg-[hsl(var(--col-bg))] border border-[hsl(var(--col-border))] text-[13px] font-mono focus:ring-2 focus:ring-[hsl(var(--col-primary)/0.18)] focus:outline-none transition-all" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--col-muted))]">Secret Access Key</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[hsl(var(--col-muted))]" />
                          <input type="password" placeholder="••••••••••••" value={awsCreds.secret_key} onChange={(e) => setAwsCreds({ ...awsCreds, secret_key: e.target.value })} className="w-full pl-10 pr-4 py-2.5 rounded-[10px] bg-[hsl(var(--col-bg))] border border-[hsl(var(--col-border))] text-[13px] font-mono focus:ring-2 focus:ring-[hsl(var(--col-primary)/0.18)] focus:outline-none transition-all" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--col-muted))]">Account Label</label>
                        <input type="text" placeholder="Production / Staging" value={awsCreds.company_name} onChange={(e) => setAwsCreds({ ...awsCreds, company_name: e.target.value })} className="w-full px-3.5 py-2.5 rounded-[10px] bg-[hsl(var(--col-bg))] border border-[hsl(var(--col-border))] text-[13px] focus:ring-2 focus:ring-[hsl(var(--col-primary)/0.18)] focus:outline-none transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--col-muted))]">Primary Region</label>
                        <select value={awsCreds.region} onChange={(e) => setAwsCreds({ ...awsCreds, region: e.target.value })} className="w-full px-3.5 py-2.5 rounded-[10px] bg-[hsl(var(--col-bg))] border border-[hsl(var(--col-border))] text-[13px] focus:ring-2 focus:ring-[hsl(var(--col-primary)/0.18)] focus:outline-none transition-all">
                          <option value="ap-south-1">Mumbai (ap-south-1)</option>
                          <option value="us-east-1">N. Virginia (us-east-1)</option>
                          <option value="eu-west-1">Ireland (eu-west-1)</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col items-center">
                       <button onClick={handleAWSScan} disabled={scanning} className="btn-solid w-full max-w-[280px] py-3 text-[14px] flex justify-center">
                          {scanning ? 'Connecting Account...' : 'Initiate AWS Audit'}
                       </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload View */}
              {mode === "upload" && (
                <div className="w-full space-y-6">
                  <motion.div
                    onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                    className={`relative w-full rounded-2xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col items-center justify-center p-14 border-2 border-dashed
                      ${file 
                        ? 'bg-[hsl(var(--col-raise))] border-[hsl(var(--col-primary)/0.45)]' 
                        : isDragActive 
                          ? 'bg-[hsl(var(--col-surface))] border-[hsl(var(--col-primary)/0.5)] ring-4 ring-[hsl(var(--col-primary)/0.06)]' 
                          : 'bg-[hsl(var(--col-surface))] border-[hsl(var(--col-border))] hover:border-[hsl(var(--col-primary)/0.28)] hover:bg-[hsl(var(--col-raise))]'}`}
                    onClick={() => !file && fileRef.current.click()}
                  >
                    <input type="file" ref={fileRef} hidden accept=".json" onChange={e => handleDrop({ preventDefault:()=>{}, stopPropagation:()=>{}, dataTransfer:{files:e.target.files} })} />

                    <AnimatePresence mode="wait">
                      {!file ? (
                        <motion.div key="empty" initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }} className="flex flex-col items-center text-center">
                          <div className="w-14 h-14 rounded-xl bg-[hsl(var(--col-primary)/0.06)] border border-[hsl(var(--col-primary)/0.12)] flex items-center justify-center mb-5">
                             <UploadCloud className="w-6 h-6 text-[hsl(var(--col-primary))]" />
                          </div>
                          <p className="font-semibold text-[17px] mb-1 tracking-tight">Click to upload manifest</p>
                          <p className="text-[13px] text-[hsl(var(--col-muted))] font-normal">Supports AWS, GCP, and Azure JSON exports</p>
                        </motion.div>
                      ) : (
                        <motion.div key="file" initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }} className="flex flex-col items-center text-center w-full z-10">
                          <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--col-primary)/0.08)] flex items-center justify-center mb-5 border border-[hsl(var(--col-primary)/0.18)]">
                            <FileJson className="w-7 h-7 text-[hsl(var(--col-primary))]" />
                          </div>
                          <h3 className="font-bold text-[18px] truncate max-w-[380px] text-[hsl(var(--col-text))] tracking-tight">{file.name}</h3>
                          <p className="text-[12px] font-medium text-[hsl(var(--col-muted))] mt-2 uppercase tracking-widest opacity-60">Ready for autonomous audit</p>
                          
                          <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="mt-8 text-[12px] font-medium text-[hsl(var(--col-muted))] hover:text-red-500 transition-all underline underline-offset-4">
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
                          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
                          onClick={handleStartAnalysis}
                          disabled={scanning}
                          className="btn-solid w-full max-w-[280px] group flex justify-center py-3 text-[14px]"
                        >
                          {scanning ? 'Initializing Analysis...' : 'Run Autonomous Audit'}
                          {!scanning && <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />}
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {error && mode !== "github" && (
                 <div className="mt-6 flex items-center gap-3 text-red-500 bg-red-50/60 border border-red-100 px-5 py-3.5 rounded-xl w-full">
                    <X className="w-4 h-4 flex-shrink-0" />
                    <p className="text-[13px] font-medium">{error}</p>
                 </div>
              )}

              {mode !== "github" && (
                 <div className="flex items-center justify-center gap-6 mt-10 bg-[hsl(var(--col-surface))] border border-[hsl(var(--col-border))] px-6 py-2.5 rounded-full">
                   <div className="flex items-center gap-2 text-[11px] text-[hsl(var(--col-muted))] font-medium uppercase tracking-widest">
                     <Shield className="w-3.5 h-3.5 text-[hsl(var(--col-primary))]" />
                     Secure
                   </div>
                   <div className="w-px h-3.5 bg-[hsl(var(--col-border))]" />
                   <div className="flex items-center gap-2 text-[11px] text-[hsl(var(--col-muted))] font-medium uppercase tracking-widest">
                     <Lock className="w-3.5 h-3.5 text-[hsl(var(--col-primary))]" />
                     Private
                   </div>
                 </div>
              )}
           </motion.div>
        </div>

        {/* GitHub Results Bottom Row Portals */}
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
            className="fixed inset-0 z-[100] bg-[hsl(var(--col-bg)/0.94)] backdrop-blur-xl flex flex-col items-center justify-center p-6"
          >
            <div className="max-w-[440px] w-full flex flex-col items-center text-center">
               <div className="w-16 h-16 bg-gradient-to-br from-[hsl(var(--col-primary))] to-[hsl(var(--col-accent))] rounded-2xl flex items-center justify-center mb-8 shadow-[0_8px_32px_hsl(var(--col-primary)/0.25)]">
                  <RefreshCw className="w-7 h-7 text-white animate-spin-slow" />
               </div>

               <div className="w-full space-y-4 mb-8">
                  <div className="flex justify-between items-end mb-2">
                     <p className="text-[12px] font-semibold text-[hsl(var(--col-muted))] uppercase tracking-widest">Processing</p>
                     <p className="text-[18px] font-bold text-[hsl(var(--col-primary))]">
                        {Math.round(((scanStep + 1) / (steps.length + 1)) * 100)}%
                     </p>
                  </div>
                  <div className="h-1.5 w-full bg-[hsl(var(--col-border))] rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-[hsl(var(--col-primary))] to-[hsl(var(--col-accent))] rounded-full" 
                      initial={{ width: 0 }}
                      animate={{ width: `${((scanStep + 1) / (steps.length + 1)) * 100}%` }}
                      transition={{ duration: 1.0, ease: "easeInOut" }}
                    />
                  </div>
               </div>

               <div className="h-14 w-full flex flex-col justify-center items-center">
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={scanStep}
                      initial={{ opacity:0, y:8 }} 
                      animate={{ opacity:1, y:0 }} 
                      exit={{ opacity:0, y:-8 }}
                      transition={{ duration: 0.35 }}
                      className="text-[15px] font-semibold text-[hsl(var(--col-text))] tracking-tight"
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
