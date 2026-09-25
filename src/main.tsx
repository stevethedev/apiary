import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./components/ThemeProvider";
import "./styles/globals.css";
import "./lib/monacoSetup";
import { applyThemePreference, getStoredThemePreference } from "./lib/theme";

// Applied synchronously, before the first paint, so the correct theme is
// already on <html> when React mounts — avoids a flash of the wrong theme.
applyThemePreference(getStoredThemePreference());

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
