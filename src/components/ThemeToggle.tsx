import type { JSX } from "react";
import type { ThemePreference } from "../lib/theme";
import { useTheme } from "./ThemeProvider";

const NEXT: Record<ThemePreference, ThemePreference> = {
  system: "light",
  light: "dark",
  dark: "system",
};

const LABEL: Record<ThemePreference, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

const ICON: Record<ThemePreference, string> = {
  system: "◐",
  light: "☀",
  dark: "☾",
};

export function ThemeToggle(): JSX.Element {
  const { preference, setPreference } = useTheme();

  return (
    <button
      type="button"
      title={`Theme: ${LABEL[preference]} (click to change)`}
      onClick={() => {
        setPreference(NEXT[preference]);
      }}
      className="rounded-sm px-1.5 py-0.5 text-sm text-text-muted hover:bg-surface-2 hover:text-text-primary"
    >
      {ICON[preference]}
    </button>
  );
}
