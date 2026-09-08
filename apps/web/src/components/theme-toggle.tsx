"use client";

import { useEffect, useState } from "react";
import { applyTheme, getCurrentTheme, type Theme } from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    // Deferred a tick rather than read synchronously — this runs after the
    // inline theme-init script (see layout.tsx) has already set the real
    // class on <html>, so there's nothing to race; the microtask hop just
    // keeps this from being a same-commit synchronous setState.
    Promise.resolve().then(() => setTheme(getCurrentTheme()));
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  }

  // Avoids briefly showing the wrong switch position before this effect
  // reads the theme the inline init script already applied to <html>.
  if (!theme) return <div className="h-7" />;

  const isDark = theme === "dark";

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-ink-900">Dark mode</p>
        <p className="text-xs text-ink-300">Switch the app to a darker color scheme.</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label="Toggle dark mode"
        onClick={toggle}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${isDark ? "bg-sky-600" : "bg-ink-700/15"}`}
      >
        <span
          className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${isDark ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}
