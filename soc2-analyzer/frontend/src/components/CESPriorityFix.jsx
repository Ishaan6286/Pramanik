import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, AlertTriangle, Shield, TrendingUp, ChevronRight, Terminal, Info } from "lucide-react";

const SEVERITY_MAP = {
  CRITICAL: { color: "text-[hsl(var(--col-ruby))]", bg: "bg-[hsl(var(--col-ruby))/0.1]", border: "border-[hsl(var(--col-ruby))/0.2]" },
  HIGH: { color: "text-[hsl(var(--col-coral))]", bg: "bg-[hsl(var(--col-coral))/0.1]", border: "border-[hsl(var(--col-coral))/0.2]" },
  MEDIUM: { color: "text-[hsl(var(--col-amber))]", bg: "bg-[hsl(var(--col-amber))/0.1]", border: "border-[hsl(var(--col-amber))/0.2]" },
};

export default function CESPriorityFix({ priorityFixes = [], currentScore }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!priorityFixes.length) return (
    <div className="surface rounded-[40px] p-20 text-center relative overflow-hidden">
      <Shield className="w-16 h-16 text-[hsl(var(--col-emerald))] mx-auto mb-6 opacity-20" />
      <h3 className="font-display font-bold text-[28px] tracking-tight mb-2">Posture Optimized</h3>
      <p className="text-[hsl(var(--col-sub))] font-medium">No high-priority CES fixes required at this time.</p>
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--col-emerald)/0.05)] to-transparent pointer-events-none" />
    </div>
  );

  return (
    <div className="space-y-10">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-12 px-2">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 rounded-[22px] bg-[hsl(var(--col-coral)/0.1)] flex items-center justify-center border border-[hsl(var(--col-coral)/0.2)] shadow-[0_0_30px_hsl(var(--col-coral)/0.2)]">
              <Zap className="w-7 h-7 text-[hsl(var(--col-coral))]" />
           </div>
           <div>
              <h3 className="font-display font-black text-[32px] tracking-tighter">Fix Registry.</h3>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] opacity-30">Ranked by Critical Evidence Score (CES)</p>
           </div>
        </div>
        <div className="text-right">
           <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] opacity-30 mb-2">Impact Potential</p>
           <p className="text-[42px] font-display font-black text-[hsl(var(--col-emerald))] leading-none">
             +{priorityFixes.reduce((acc, f) => acc + (f.score_improvement || 0), 0)}<span className="text-[20px] font-bold opacity-40">%</span>
           </p>
        </div>
      </div>

      <div className="space-y-6">
        {priorityFixes.map((fix, i) => (
          <motion.div
            key={fix.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={`surface rounded-[32px] overflow-hidden transition-all duration-500 border border-white/5 ${expandedId === fix.id ? 'border-[hsl(var(--col-indigo)/0.3)] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)]' : 'hover:border-white/20'}`}
          >
            <div 
              className="p-8 cursor-pointer flex items-center justify-between group"
              onClick={() => setExpandedId(expandedId === fix.id ? null : fix.id)}
            >
              <div className="flex items-center gap-8 flex-1">
                <div className="text-[32px] font-display font-black text-white/5 w-12 transition-colors group-hover:text-white/10 uppercase italic">
                  {String(i + 1).padStart(2, '0')}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="font-mono text-[9px] font-black text-[hsl(var(--col-indigo))] bg-[hsl(var(--col-indigo))/0.08] px-2 py-1 rounded-full border border-[hsl(var(--col-indigo))/0.15] tracking-[0.15em] uppercase">
                      {fix.id}
                    </span>
                    <h4 className="font-display font-bold text-[22px] tracking-tight">{fix.title}</h4>
                  </div>
                  <div className="flex gap-4">
                    {fix.framework_mappings.map(fw => (
                      <span key={fw.framework} className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] opacity-20">
                        // {fw.framework}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="hidden lg:flex items-center gap-10 px-10 border-x border-white/5">
                   <div className="text-center">
                      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] opacity-20 mb-2">CES Velocity</p>
                      <p className="font-display font-bold text-[20px] text-[hsl(var(--col-coral))]">{fix.crvs_score || fix.ces_score}</p>
                   </div>
                   <div className="text-center">
                      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] opacity-20 mb-2">Improvement</p>
                      <p className="font-display font-bold text-[20px] text-[hsl(var(--col-emerald))]">+{fix.score_improvement}%</p>
                   </div>
                </div>
              </div>

              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-700 ${expandedId === fix.id ? 'rotate-90 bg-[hsl(var(--col-indigo))/0.1] text-[hsl(var(--col-indigo))]' : 'text-white/10 group-hover:text-white/40'}`}>
                <ChevronRight className="w-6 h-6" />
              </div>
            </div>

            <AnimatePresence>
              {expandedId === fix.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="px-8 pb-12 overflow-hidden"
                >
                  <div className="pt-8 grid lg:grid-cols-[1.2fr_0.8fr] gap-12 border-t border-white/5">
                    {/* Impact Analysis */}
                    <div>
                      <h5 className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-[hsl(var(--col-indigo))] mb-6 flex items-center gap-3">
                        <TrendingUp className="w-4 h-4" /> Strategic Impact
                      </h5>
                      <div className="space-y-6">
                        <p className="text-[17px] text-[hsl(var(--col-sub))] leading-relaxed font-medium">
                          Remediation of this control satisfies requirements for <span className="text-white font-bold">{fix.frameworks_satisfied} core frameworks</span> and stabilizes neural dependency chains within the global region.
                        </p>
                        <div className="bg-white/[0.02] rounded-3xl p-6 border border-white/5 relative overflow-hidden">
                           <div className="flex justify-between items-end mb-4 relative z-10">
                              <span className="font-mono text-[9px] font-bold uppercase tracking-widest opacity-30 italic">Risk Pressure Gauge</span>
                              <span className="font-display font-black text-[22px] text-[hsl(var(--col-coral))]">{fix.crvs_score || fix.ces_score} / 1000</span>
                           </div>
                           <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden relative z-10">
                              <motion.div 
                                className="h-full bg-gradient-to-r from-[hsl(var(--col-coral))] to-[hsl(var(--col-indigo))]" 
                                initial={{ width: 0 }}
                                animate={{ width: `${((fix.crvs_score || fix.ces_score) / 1000) * 100}%` }}
                                transition={{ duration: 2, delay: 0.3 }}
                              />
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Resolve */}
                    <div className="flex flex-col h-full">
                       <h5 className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-[hsl(var(--col-emerald))] mb-6 flex items-center gap-3">
                        <Terminal className="w-4 h-4" /> Resolution Manifest
                      </h5>
                      <div className="flex-1 glass rounded-3xl p-8 font-mono text-[12px] text-indigo-300 border border-white/5 relative group overflow-hidden">
                        <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-40 transition-opacity">
                           <Info className="w-5 h-5 text-white" />
                        </div>
                        <div className="space-y-2 relative z-10">
                          {fix.issues?.map((issue, idx) => (
                            <p key={idx} className="flex gap-4 opacity-60">
                              <span className="text-[hsl(var(--col-ruby))] font-black">!</span> {issue}
                            </p>
                          ))}
                          <div className="pt-6 mt-6 border-t border-white/5">
                            <p className="text-[hsl(var(--col-emerald))] opacity-40 mb-2"># Execute via Cloud Console</p>
                            <p className="text-white/80 leading-relaxed font-bold">aws cloudtrail update-trail <br/> --name audit-log --enable-log-file-validation</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
