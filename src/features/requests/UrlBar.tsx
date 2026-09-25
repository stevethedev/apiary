import { HTTP_METHODS, type HttpMethod, type RequestDraft } from "../../types/http";
import { buildQueryString, parseQueryString } from "../../lib/formatting";
import { EnvironmentDropdown } from "../environments/EnvironmentDropdown";

const METHOD_SELECT_COLOR: Record<HttpMethod, string> = {
  GET: "text-method-get",
  POST: "text-method-post",
  PUT: "text-method-put",
  PATCH: "text-method-patch",
  DELETE: "text-method-delete",
  HEAD: "text-method-head",
  OPTIONS: "text-method-options",
};

interface UrlBarProps {
  draft: RequestDraft;
  onChange: (patch: Partial<RequestDraft>) => void;
  onSend: () => void;
  onSave: () => void;
  sendDisabled?: boolean;
}

export function UrlBar({ draft, onChange, onSend, onSave, sendDisabled }: UrlBarProps) {
  // draft.url is always stored as the bare base (no query string) — the
  // query string is derived from draft.params so the two never fight.
  const fullUrl = buildQueryString(draft.url, draft.params);

  function handleUrlChange(value: string) {
    const { base, params } = parseQueryString(value);
    onChange({ url: base, params });
  }

  return (
    <div className="flex items-center gap-2 border-b border-surface-3 bg-surface-1 p-2">
      <select
        value={draft.method}
        onChange={(e) => onChange({ method: e.target.value as HttpMethod })}
        className={`h-8 rounded-sm border border-surface-3 bg-surface-2 px-2 font-mono text-sm font-semibold ${METHOD_SELECT_COLOR[draft.method]}`}
      >
        {HTTP_METHODS.map((method) => (
          <option key={method} value={method}>
            {method}
          </option>
        ))}
      </select>
      <input
        id="apiary-url-bar"
        className="h-8 flex-1 rounded-sm border border-surface-3 bg-surface-2 px-3 font-mono text-sm text-text-primary outline-none focus:border-accent"
        placeholder="https://api.example.com/users"
        value={fullUrl}
        onChange={(e) => handleUrlChange(e.target.value)}
      />
      <EnvironmentDropdown />
      <button
        type="button"
        title="Save (Cmd+S)"
        onClick={onSave}
        className="h-8 rounded-sm border border-surface-3 px-3 text-sm text-text-primary hover:bg-surface-2"
      >
        Save
      </button>
      <button
        type="button"
        disabled={sendDisabled}
        onClick={onSend}
        className="h-8 rounded-sm bg-accent px-4 text-sm font-medium text-surface-0 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Send
      </button>
    </div>
  );
}
