import { PieChart, Pie, Cell, ResponsiveContainer, Label } from "recharts";
import { motion } from "framer-motion";
import { Shield, Globe, Lock } from "lucide-react";

const frameworks = [
  { name: "SOC 2 Type II", score: 85, color: "hsl(220, 35%, 62%)", icon: Shield, id: "soc2" },
  { name: "ISO 27001", score: 42, color: "hsl(265, 28%, 64%)", icon: Globe, id: "iso" },
  { name: "HIPAA", score: 68, color: "hsl(155, 28%, 56%)", icon: Lock, id: "hipaa" }
];

export default function MultiFrameworkScore({ scores = {} }) {
  // Use provided scores or defaults
  const data = frameworks.map(f => ({
    ...f,
    score: scores[f.id] || f.score
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
      {data.map((fw, i) => (
        <motion.div
          key={fw.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="surface rounded-[32px] p-10 flex flex-col items-center justify-center relative overflow-hidden group transition-all"
        >
          {/* Background Atmosphere */}
          <div 
            className="absolute inset-0 opacity-[0.06] pointer-events-none" 
            style={{ background: fw.color }}
          />
          
          <div className="w-full h-56 relative mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { value: fw.score },
                    { value: 100 - fw.score }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill={fw.color} />
                  <Cell fill="rgba(0,0,0,0.04)" />
                  <Label
                    content={({ viewBox }) => {
                      const { cx, cy } = viewBox;
                      return (
                        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
                          <tspan
                            x={cx}
                            y={cy}
                            className="text-[32px] font-display font-black fill-[hsl(var(--col-text))]"
                          >
                            {fw.score}%
                          </tspan>
                        </text>
                      );
                    }}
                  />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            {/* Framework Icon */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-12 opacity-25 transition-opacity">
               <fw.icon className="w-6 h-6" style={{ color: fw.color }} />
            </div>
          </div>

          <div className="text-center relative z-10">
            <h4 className="font-display font-bold text-[22px] tracking-tight mb-2">{fw.name}</h4>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
              {fw.score >= 80 ? "Audit Ready" : fw.score >= 50 ? "In Progress" : "Gaps Detected"}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
