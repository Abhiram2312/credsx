import { motion } from "motion/react";
import { useState } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

type Theme = "light" | "dark";

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(currentTheme);
  const reduced = usePrefersReducedMotion();

  const choose = (next: Theme) => {
    document.documentElement.dataset.theme = next;
    localStorage.setItem("cards-theme", next);
    setTheme(next);
  };

  const next = theme === "dark" ? "light" : "dark";

  return (
    <motion.button
      type="button"
      className="inline-flex min-h-11 items-center rounded-md border border-line bg-card px-4 text-sm text-ink"
      aria-pressed={theme === "dark"}
      whileTap={reduced ? undefined : { scale: 0.98 }}
      onClick={() => choose(next)}
    >
      {theme === "dark" ? "Use light theme" : "Use dark theme"}
    </motion.button>
  );
}
