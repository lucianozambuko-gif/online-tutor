export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "lumen-theme";

// Inlined into a <script> in the root layout too (kept as a plain string
// there, not imported) — it must run before first paint to avoid a flash of
// the wrong theme, which rules out waiting for a React effect.
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export function getCurrentTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private browsing / storage disabled — the toggle still works for this
    // page load, it just won't persist across reloads.
  }
}
