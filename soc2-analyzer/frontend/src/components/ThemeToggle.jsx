import { useTheme } from "../ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ sidebar }) {
  const { dark, toggle } = useTheme();

  if (sidebar) {
    return (
      <button onClick={toggle}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-[10px] text-[13px] font-medium text-[hsl(var(--col-muted))] hover:bg-white/5 hover:text-white transition-all"
        title={dark ? "Switch to Light Mode" : "Switch to Cyber Dark"}>
        {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[hsl(var(--col-indigo))]" />}
        <span>{dark ? "Light Mode" : "Cyber Dark"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="w-9 h-9 rounded-xl border border-[hsl(var(--col-border))/0.5] hover:border-[hsl(var(--col-border))] bg-white/5 flex items-center justify-center transition-all group overflow-hidden"
      title={dark ? "Switch to Light" : "Switch to Dark"}
    >
      <div className="relative w-4 h-4">
        {dark ? (
          <Sun className="w-4 h-4 text-amber-400 animate-in zoom-in-50 duration-300" />
        ) : (
          <Moon className="w-4 h-4 text-[hsl(var(--col-indigo))] animate-in zoom-in-50 duration-300" />
        )}
      </div>
    </button>
  );
}
