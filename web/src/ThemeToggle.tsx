import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

type Theme = "light" | "dark";

const TRAVEL = 26;

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function Sun() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" />
    </svg>
  );
}

function Moon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <path d="M20.4 14.6A8.5 8.5 0 0 1 9.4 3.6a8.5 8.5 0 1 0 11 11z" />
    </svg>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(currentTheme);
  const reduced = usePrefersReducedMotion();
  const dark = theme === "dark";

  const toggle = () => {
    const next: Theme = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("cards-theme", next);
    setTheme(next);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark theme"
      title={dark ? "Switch to light theme" : "Switch to dark theme"}
      className="theme-switch"
      onClick={toggle}
    >
      <span className="theme-switch-track" aria-hidden>
        <motion.span
          className="theme-switch-knob"
          initial={false}
          animate={{ x: dark ? TRAVEL : 0 }}
          transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 32 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              className="theme-switch-icon"
              initial={reduced ? false : { opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={reduced ? undefined : { opacity: 0, rotate: 90, scale: 0.5 }}
              transition={{ duration: reduced ? 0 : 0.22 }}
            >
              {dark ? <Moon /> : <Sun />}
            </motion.span>
          </AnimatePresence>
        </motion.span>
      </span>
    </button>
  );
}
