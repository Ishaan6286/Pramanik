import { useEffect, useRef } from "react";
import { useTheme } from "../ThemeContext";

// Full-pipeline: AWS Config → AI Engine → SOC2/ISO/HIPAA Reports
export default function PramanikDiagram() {
  const { dark } = useTheme();

  // Cyber-Obsidian Colors
  const accent = dark ? "#6366f1" : "#4f46e5";
  const accentSoft = dark ? "#6366f130" : "#4f46e520";
  const accentLine = dark ? "#6366f160" : "#4f46e540";
  const nodeBg = dark ? "#0f0f18" : "#f4f4ff";
  const nodeStroke = dark ? "#6366f150" : "#4f46e530";
  const textColor = dark ? "#e0e0f0" : "#1a1a3a";
  const mutedText = dark ? "#70709090" : "#7070aa90";
  const emerald = dark ? "#10b981" : "#059669";
  const violet = dark ? "#8b5cf6" : "#7c3aed";

  return (
    <div className={`w-full select-none transition-all duration-700 pb-10`}>
      <svg
        viewBox="0 0 580 440"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        aria-label="Pramanik AI Compliance Pipeline Diagram"
      >
        <defs>
          <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          <filter id="softglow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          <radialGradient id="aiCoreGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.3" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>

          <linearGradient id="lineGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.7" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Dot Grid */}
        {Array.from({ length: 11 }).map((_, row) =>
          Array.from({ length: 15 }).map((_, col) => (
            <circle key={`${row}-${col}`} cx={col * 40 + 20} cy={row * 40 + 20} r="1" fill={mutedText} />
          ))
        )}

        {/* Flows */}
        <path d="M 160 220 C 210 220 240 220 260 220" stroke="url(#lineGrad1)" strokeWidth="2" strokeDasharray="6 6">
          <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="1.5s" repeatCount="indefinite" />
        </path>

        {[150, 220, 290].map((y, i) => (
          <path key={i} d={`M 300 220 C 340 220 370 ${y} 420 ${y}`} stroke={accentLine} strokeWidth="1.5" strokeDasharray="4 4">
             <animate attributeName="stroke-dashoffset" from="0" to="-16" dur={`${1.2 + i*0.2}s`} repeatCount="indefinite" />
          </path>
        ))}

        {/* Nodes */}
        <g>
          <circle cx="120" cy="220" r="48" fill={nodeBg} stroke={nodeStroke} strokeWidth="1" />
          <path d="M100 215a4 4 0 011-7.9 5 5 0 0110-1.1 4 4 0 017 4 4 4 0 01-2 7.1" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <text x="120" y="275" textAnchor="middle" fontSize="10" fontWeight="700" fill={textColor} opacity="0.6">AWS CONFIG</text>
        </g>

        <g>
          <circle cx="280" cy="220" r="64" fill="url(#aiCoreGrad)" />
          <circle cx="280" cy="220" r="48" fill={nodeBg} stroke={accent} strokeWidth="2" />
          <circle cx="280" cy="220" r="48" fill="none" stroke={accent} strokeOpacity="0.4">
             <animate attributeName="r" values="48;64;48" dur="3s" repeatCount="indefinite" />
             <animate attributeName="stroke-opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite" />
          </circle>
          <text x="280" y="285" textAnchor="middle" fontSize="10" fontFamily="'JetBrains Mono'" fontWeight="800" fill={accent} letterSpacing="2">PRAMANIK AI</text>
        </g>

        {[
          { y: 150, label: "SOC 2", color: accent },
          { y: 220, label: "ISO 27001", color: violet },
          { y: 290, label: "HIPAA", color: emerald }
        ].map((node, i) => (
          <g key={i}>
            <circle cx="440" cy={node.y} r="30" fill={nodeBg} stroke={node.color} strokeWidth="1.5" />
            <text x="495" y={node.y + 5} fontSize="10" fontWeight="700" fill={textColor} opacity="0.7">{node.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
