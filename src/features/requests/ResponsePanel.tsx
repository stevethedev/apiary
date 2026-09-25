import { useState, type JSX } from "react";
import Editor from "@monaco-editor/react";
import { useTheme } from "../../components/ThemeProvider";
import {
  formatBytes,
  formatDuration,
  tryFormatJson,
} from "../../lib/formatting";
import { monacoThemeName } from "../../lib/theme";
import type { HttpErrorKind } from "../../types/http";
import type { TabResponseState } from "../../types/tab";

// Past this size, skip Monaco's JSON formatting/highlighting (which chokes
// on huge documents) and fall back to plain text, per the large-response
// design decision — the UI must never freeze.
const LARGE_RESPONSE_THRESHOLD_BYTES = 3 * 1024 * 1024;

const ERROR_LABEL: Record<HttpErrorKind, string> = {
  network: "Request failed",
  dns: "Could not resolve host",
  timeout: "Request timed out",
  invalidUrl: "Invalid URL",
  tls: "TLS error",
  cancelled: "Request cancelled",
  invalidResponse: "Invalid response",
};

function statusColorClass(statusCode: number): string {
  if (statusCode < 300) return "text-status-success";
  if (statusCode < 400) return "text-status-redirect";
  if (statusCode < 500) return "text-status-client-error";
  return "text-status-server-error";
}

function parseSetCookieHeaders(
  headers: readonly (readonly [string, string])[],
): string[] {
  return headers
    .filter(([key]) => key.toLowerCase() === "set-cookie")
    .map(([, value]) => value);
}

interface ResponsePanelProps {
  response: TabResponseState;
  onCancel: () => void;
}

export function ResponsePanel({
  response,
  onCancel,
}: ResponsePanelProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<"Body" | "Headers" | "Cookies">(
    "Body",
  );
  const { effectiveTheme } = useTheme();

  if (response.status === "idle") {
    return (
      <div className="flex h-full items-center justify-center text-sm text-text-muted">
        Send a request to see the response.
      </div>
    );
  }

  if (response.status === "blocked") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 text-sm">
        <p className="text-status-client-error">
          Cannot send — undefined variable(s):
        </p>
        <p className="font-mono text-text-primary">
          {response.missing.map((name) => `{{${name}}}`).join(", ")}
        </p>
      </div>
    );
  }

  if (response.status === "sending") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-text-muted">
        <p>Sending…</p>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-sm border border-surface-3 px-3 py-1 text-text-primary hover:bg-surface-2"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (response.status === "error") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 p-4 text-center text-sm">
        <p className="font-medium text-status-server-error">
          {ERROR_LABEL[response.error.kind]}
        </p>
        <p className="text-text-muted">{response.error.message}</p>
      </div>
    );
  }

  const { result } = response;
  const isLarge = result.bodySizeBytes > LARGE_RESPONSE_THRESHOLD_BYTES;
  const { formatted, isJson } = tryFormatJson(result.body);
  const cookies = parseSetCookieHeaders(result.headers);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-surface-3 px-3 py-2 font-mono text-sm">
        <span
          className={`font-semibold ${statusColorClass(result.statusCode)}`}
        >
          {result.statusCode} {result.statusText}
        </span>
        <span className="text-text-muted">
          {formatDuration(result.durationMs)}
        </span>
        <span className="text-text-muted">
          {formatBytes(result.bodySizeBytes)}
        </span>
      </div>
      <div className="flex border-b border-surface-3 text-sm">
        {(["Body", "Headers", "Cookies"] as const).map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              setActiveTab(label);
            }}
            className={`px-4 py-2 ${
              activeTab === label
                ? "border-b-2 border-accent text-text-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {activeTab === "Body" &&
          (isLarge ? (
            <div>
              <p className="p-2 text-xs text-text-muted">
                Large response ({formatBytes(result.bodySizeBytes)}) —
                formatting disabled.
              </p>
              <pre className="whitespace-pre-wrap break-all p-3 font-mono text-sm text-text-primary">
                {result.body}
              </pre>
            </div>
          ) : isJson ? (
            <Editor
              language="json"
              theme={monacoThemeName(effectiveTheme)}
              value={formatted}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 13,
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          ) : (
            <pre className="whitespace-pre-wrap break-all p-3 font-mono text-sm text-text-primary">
              {result.body}
            </pre>
          ))}
        {activeTab === "Headers" && (
          <table className="w-full text-left font-mono text-sm">
            <tbody>
              {result.headers.map(([key, value], i) => (
                <tr key={`${key}-${i}`} className="border-b border-surface-2">
                  <td className="px-3 py-1 text-text-muted">{key}</td>
                  <td className="px-3 py-1 text-text-primary">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {activeTab === "Cookies" &&
          (cookies.length === 0 ? (
            <p className="p-3 text-sm text-text-muted">
              No cookies were set by this response.
            </p>
          ) : (
            <ul className="p-3 font-mono text-sm text-text-primary">
              {cookies.map((cookie, i) => (
                <li key={i} className="border-b border-surface-2 py-1">
                  {cookie}
                </li>
              ))}
            </ul>
          ))}
      </div>
    </div>
  );
}
