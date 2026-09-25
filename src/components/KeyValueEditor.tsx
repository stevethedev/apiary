import { createEmptyRow, type KeyValueRow } from "../types/http";
import { ensureTrailingEmptyRow } from "../lib/formatting";

interface KeyValueEditorProps {
  rows: readonly KeyValueRow[];
  onChange: (rows: readonly KeyValueRow[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

/** Shared key/value row editor used by Params, Headers, and Form-body tabs. */
export function KeyValueEditor({
  rows,
  onChange,
  keyPlaceholder = "KEY",
  valuePlaceholder = "VALUE",
}: KeyValueEditorProps) {
  const displayRows = ensureTrailingEmptyRow(rows);

  function updateRow(id: string, patch: Partial<KeyValueRow>) {
    const next = displayRows.map((row) =>
      row.id === id ? { ...row, ...patch } : row,
    );
    onChange(ensureTrailingEmptyRow(next));
  }

  function removeRow(id: string) {
    onChange(rows.filter((row) => row.id !== id));
  }

  return (
    <div className="flex flex-col text-sm">
      <div className="grid grid-cols-[1fr_1fr_28px] gap-px border-b border-surface-3 pb-1 text-xs font-medium tracking-wide text-text-muted">
        <span>{keyPlaceholder}</span>
        <span>{valuePlaceholder}</span>
        <span />
      </div>
      {displayRows.map((row) => {
        const isTrailing = row.key.length === 0 && row.value.length === 0;
        return (
          <div
            key={row.id}
            className="grid grid-cols-[1fr_1fr_28px] items-center gap-2 border-b border-surface-2 py-1"
          >
            <input
              className="bg-transparent px-1 font-mono text-sm text-text-primary outline-none placeholder:text-text-muted"
              value={row.key}
              placeholder="key"
              onChange={(e) => updateRow(row.id, { key: e.target.value })}
            />
            <input
              className="bg-transparent px-1 font-mono text-sm text-text-primary outline-none placeholder:text-text-muted"
              value={row.value}
              placeholder="value"
              onChange={(e) => updateRow(row.id, { value: e.target.value })}
            />
            {isTrailing ? (
              <span />
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={row.enabled}
                  onChange={(e) => updateRow(row.id, { enabled: e.target.checked })}
                />
                <button
                  type="button"
                  aria-label="Remove row"
                  className="text-text-muted hover:text-status-server-error"
                  onClick={() => removeRow(row.id)}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { createEmptyRow };
