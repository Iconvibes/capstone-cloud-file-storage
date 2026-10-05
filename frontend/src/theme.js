import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "lumenvault-theme";

export const THEMES = ["light", "dark"];

function readStored() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(saved) ? saved : null;
  } catch {
    return null; // private mode / storage disabled
  }
}

// An explicit choice always wins; otherwise follow the OS, then fall back to
// the dimmed light theme.
function preferred() {
  const stored = readStored();
  if (stored) return stored;
  if (typeof window.matchMedia === "function") {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  }
  return "light";
}

function paint(theme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  // Keeps the mobile browser chrome and the desktop window in step.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#14161c" : "#e9e4db");
}

export function applyStoredTheme() {
  paint(preferred());
}

// useTheme() is called by whichever component renders the switch, so several
// copies stay in sync through the shared `theme-changed` event.
export function useTheme() {
  const [theme, setThemeState] = useState(() => preferred());

  useEffect(() => {
    const sync = (event) => setThemeState(event.detail);
    window.addEventListener("theme-changed", sync);
    return () => window.removeEventListener("theme-changed", sync);
  }, []);

  // Follow the OS only while the user has not made an explicit choice.
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (readStored()) return;
      const next = query.matches ? "dark" : "light";
      paint(next);
      setThemeState(next);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((next) => {
    if (!THEMES.includes(next)) return;
    paint(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Persistence is best-effort; the theme still applies for this session.
    }
    window.dispatchEvent(new CustomEvent("theme-changed", { detail: next }));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}
