export type ThemePreference = "system" | "light" | "dark";
export type EffectiveTheme = "light" | "dark";

const STORAGE_KEY = "apiary-theme";

export function getStoredThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // localStorage can throw (private mode, blocked storage) — fall back.
  }
  return "system";
}

/** Sets the `data-theme` attribute the CSS in globals.css keys off of, and
 * persists the choice. `"system"` clears the attribute so the
 * prefers-color-scheme media query takes over. */
export function applyThemePreference(preference: ThemePreference): void {
  if (preference === "system") {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = preference;
  }
  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Persistence is a nicety, not a requirement — ignore failures.
  }
}

export function getSystemTheme(): EffectiveTheme {
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function monacoThemeName(effectiveTheme: EffectiveTheme): string {
  return effectiveTheme === "light" ? "vs" : "vs-dark";
}
