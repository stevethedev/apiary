import { KeyValueEditor } from "../../components/KeyValueEditor";
import type { AuthConfig, BodyConfig, KeyValueRow } from "../../types/http";
import { computeGeneratedHeaders } from "./requestBuilder";

interface HeadersTabProps {
  headers: readonly KeyValueRow[];
  body: BodyConfig;
  auth: AuthConfig;
  onChange: (headers: readonly KeyValueRow[]) => void;
}

export function HeadersTab({ headers, body, auth, onChange }: HeadersTabProps) {
  const generated = computeGeneratedHeaders(headers, body, auth);

  return (
    <div className="p-3">
      <KeyValueEditor rows={headers} onChange={onChange} keyPlaceholder="KEY" valuePlaceholder="VALUE" />

      {generated.length > 0 && (
        <div className="mt-4">
          <p className="mb-1 text-xs font-medium tracking-wide text-text-muted">
            GENERATED — sent automatically from Auth/Body, read-only
          </p>
          <div className="flex flex-col text-sm">
            {generated.map((row) => (
              <div
                key={row.key}
                className="grid grid-cols-[1fr_1fr] gap-2 border-b border-surface-2 py-1"
              >
                <span className="truncate px-1 font-mono text-text-secondary">{row.key}</span>
                <span className="truncate px-1 font-mono text-text-muted">{row.value}</span>
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-text-muted">
            Add your own row above with the same name to override any of these.
          </p>
        </div>
      )}
    </div>
  );
}
