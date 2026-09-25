import {
  createContext,
  useContext,
  useEffect,
  useState,
  type JSX,
  type ReactNode,
} from "react";
import {
  applyThemePreference,
  getStoredThemePreference,
  getSystemTheme,
  type EffectiveTheme,
  type ThemePreference,
} from "../lib/theme";

interface ThemeContextValue {
  preference: ThemePreference;
  effectiveTheme: EffectiveTheme;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [preference, setPreferenceState] = useState<ThemePreference>(
    getStoredThemePreference,
  );
  const [systemTheme, setSystemTheme] =
    useState<EffectiveTheme>(getSystemTheme);

  useEffect(() => {
    applyThemePreference(preference);
  }, [preference]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const handleChange = (): void => {
      setSystemTheme(getSystemTheme());
    };
    media.addEventListener("change", handleChange);
    return (): void => {
      media.removeEventListener("change", handleChange);
    };
  }, []);

  const effectiveTheme = preference === "system" ? systemTheme : preference;

  return (
    <ThemeContext.Provider
      value={{ preference, effectiveTheme, setPreference: setPreferenceState }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
