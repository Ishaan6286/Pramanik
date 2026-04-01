import { motion } from "framer-motion";

export default function CyberCircuit() {
  const primary = "hsl(var(--col-primary))";
  const sub = "hsl(var(--col-sub))";
  const bg = "hsl(var(--col-surface))";

  return (
    <div className="w-full h-full relative p-4 overflow-visible">
      <svg
        viewBox="0 0 1000 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* ── TECHNICAL GRID BACKGROUND ── */}
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="opacity-[0.05]" />
        </pattern>
        <rect width="1000" height="800" fill="url(#grid)" />

        {/* ── MAIN AUDIT PATHS (CIRCUIT TRACES) ── */}
        <g strokeWidth="1" className="opacity-20">
          <path d="M 100 200 L 300 200 L 300 400 L 450 400" stroke={sub} fill="none" />
          <path d="M 100 400 L 450 400" stroke={sub} fill="none" />
          <path d="M 100 600 L 300 600 L 300 400 L 450 400" stroke={sub} fill="none" />

          {/* OUTPUT PATHS */}
          <path d="M 550 400 L 700 400 L 700 200 L 850 200" stroke={sub} fill="none" />
          <path d="M 550 400 L 850 400" stroke={sub} fill="none" />
          <path d="M 550 400 L 700 400 L 700 600 L 850 600" stroke={sub} fill="none" />
        </g>

        {/* ── FLOWING PULSES ── */}
        <g>
          <motion.path 
            d="M 100 200 L 300 200 L 300 400 L 450 400" 
            stroke={primary} strokeWidth="2" fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1], opacity: [0, 1, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          <motion.path 
             d="M 100 400 L 450 400" 
             stroke={primary} strokeWidth="2" fill="none"
             initial={{ pathLength: 0, opacity: 0 }}
             animate={{ pathLength: [0, 1], opacity: [0, 1, 0] }}
             transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 1 }}
          />
          <motion.path 
             d="M 100 600 L 300 600 L 300 400 L 450 400" 
             stroke={primary} strokeWidth="2" fill="none"
             initial={{ pathLength: 0, opacity: 0 }}
             animate={{ pathLength: [0, 1], opacity: [0, 1, 0] }}
             transition={{ duration: 5, repeat: Infinity, ease: "linear", delay: 0.5 }}
          />

          {/* Outgoing Signals */}
          <motion.path 
             d="M 550 400 L 700 400 L 700 200 L 850 200" 
             stroke={primary} strokeWidth="2" fill="none"
             initial={{ pathLength: 0, opacity: 0 }}
             animate={{ pathLength: [0, 1], opacity: [0, 1, 0] }}
             transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 2 }}
          />
          <motion.path 
             d="M 550 400 L 850 400" 
             stroke={primary} strokeWidth="2" fill="none"
             initial={{ pathLength: 0, opacity: 0 }}
             animate={{ pathLength: [0, 1], opacity: [0, 1, 0] }}
             transition={{ duration: 5, repeat: Infinity, ease: "linear", delay: 1.5 }}
          />
          <motion.path 
             d="M 550 400 L 700 400 L 700 600 L 850 600" 
             stroke={primary} strokeWidth="2" fill="none"
             initial={{ pathLength: 0, opacity: 0 }}
             animate={{ pathLength: [0, 1], opacity: [0, 1, 0] }}
             transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 1 }}
          />
        </g>

        {/* ── SYSTEM NODES ── */}
        <g className="font-mono font-medium">
          {/* INPUTS */}
          <g>
            <rect x="50" y="180" width="100" height="40" rx="4" fill={bg} stroke={sub} strokeWidth="1" className="opacity-80" />
            <text x="100" y="204" textAnchor="middle" fontSize="12" fill={sub}>CONFIG</text>
            <circle cx="100" cy="200" r="3" fill={primary} />
          </g>
          <g>
            <rect x="50" y="380" width="100" height="40" rx="4" fill={bg} stroke={sub} strokeWidth="1" className="opacity-80" />
            <text x="100" y="404" textAnchor="middle" fontSize="12" fill={sub}>MANIFEST</text>
            <circle cx="100" cy="400" r="3" fill={primary} />
          </g>
          <g>
            <rect x="50" y="580" width="100" height="40" rx="4" fill={bg} stroke={sub} strokeWidth="1" className="opacity-80" />
            <text x="100" y="604" textAnchor="middle" fontSize="12" fill={sub}>TOPOLOGY</text>
            <circle cx="100" cy="600" r="3" fill={primary} />
          </g>

          {/* INFERENCE CORE */}
          <g>
            <rect x="450" y="350" width="100" height="100" rx="8" fill={bg} stroke={primary} strokeWidth="1" />
            <text x="500" y="405" textAnchor="middle" fontSize="14" fill={primary} letterSpacing="1">CORE_00</text>
            <circle cx="500" cy="350" r="4" fill={primary} />
            <circle cx="500" cy="450" r="4" fill={primary} />
          </g>

          {/* OUTPUTS */}
          <g>
            <text x="900" y="204" textAnchor="middle" fontSize="14" fill={sub}>SOC_2</text>
            <circle cx="850" cy="200" r="4" fill={sub} />
          </g>
          <g>
            <text x="900" y="404" textAnchor="middle" fontSize="14" fill={sub}>ISO_27001</text>
            <circle cx="850" cy="400" r="4" fill={sub} />
          </g>
          <g>
            <text x="900" y="604" textAnchor="middle" fontSize="14" fill={sub}>HIPAA</text>
            <circle cx="850" cy="600" r="4" fill={sub} />
          </g>
        </g>
      </svg>
    </div>
  );
}
