import type { AuthConfig } from "../../types/http";

interface AuthTabProps {
  auth: AuthConfig;
  onChange: (auth: AuthConfig) => void;
}

const inputClass =
  "h-8 w-full rounded-sm border border-surface-3 bg-surface-2 px-2 font-mono text-sm text-text-primary outline-none focus:border-accent";

export function AuthTab({ auth, onChange }: AuthTabProps) {
  return (
    <div className="flex flex-col gap-3 p-3 text-sm">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-text-muted">TYPE</span>
        <select
          className={inputClass}
          value={auth.type}
          onChange={(e) => {
            const type = e.target.value as AuthConfig["type"];
            if (type === "none") onChange({ type: "none" });
            else if (type === "bearer") onChange({ type: "bearer", token: "" });
            else if (type === "basic") onChange({ type: "basic", username: "", password: "" });
            else onChange({ type: "apiKey", key: "", value: "", placement: "header" });
          }}
        >
          <option value="none">None</option>
          <option value="bearer">Bearer Token</option>
          <option value="basic">Basic Auth</option>
          <option value="apiKey">API Key</option>
        </select>
      </label>

      {auth.type === "bearer" && (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-text-muted">TOKEN</span>
          <input
            className={inputClass}
            placeholder="{{token}}"
            value={auth.token}
            onChange={(e) => onChange({ ...auth, token: e.target.value })}
          />
        </label>
      )}

      {auth.type === "basic" && (
        <>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-muted">USERNAME</span>
            <input
              className={inputClass}
              value={auth.username}
              onChange={(e) => onChange({ ...auth, username: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-muted">PASSWORD</span>
            <input
              type="password"
              className={inputClass}
              value={auth.password}
              onChange={(e) => onChange({ ...auth, password: e.target.value })}
            />
          </label>
        </>
      )}

      {auth.type === "apiKey" && (
        <>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-muted">KEY</span>
            <input
              className={inputClass}
              value={auth.key}
              onChange={(e) => onChange({ ...auth, key: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-muted">VALUE</span>
            <input
              className={inputClass}
              placeholder="{{apiKey}}"
              value={auth.value}
              onChange={(e) => onChange({ ...auth, value: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-muted">ADD TO</span>
            <select
              className={inputClass}
              value={auth.placement}
              onChange={(e) =>
                onChange({ ...auth, placement: e.target.value as "header" | "query" })
              }
            >
              <option value="header">Header</option>
              <option value="query">Query Param</option>
            </select>
          </label>
        </>
      )}
    </div>
  );
}
