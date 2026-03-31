import { useTheme } from "../ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { dark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg hover:opacity-80"
      style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
