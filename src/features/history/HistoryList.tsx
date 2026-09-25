import { useState } from "react";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { MethodBadge } from "../../components/MethodBadge";
import type { HistoryEntry } from "../../types/history";
import type { RequestDraft } from "../../types/http";
import { useHistoryStore } from "./historyStore";

interface HistoryListProps {
  onRestore: (draft: RequestDraft) => void;
  filter?: string;
}

function statusColorClass(statusCode: number | null): string {
  if (statusCode === null) return "text-status-server-error";
  if (statusCode < 300) return "text-status-success";
  if (statusCode < 400) return "text-status-redirect";
  if (statusCode < 500) return "text-status-client-error";
  return "text-status-server-error";
}

function toDraft(entry: HistoryEntry): RequestDraft {
  return {
    method: entry.method,
    url: entry.url,
    params: entry.params,
    headers: entry.headers,
    auth: entry.auth,
    body: entry.body,
  };
}

export function HistoryList({ onRestore, filter = "" }: HistoryListProps) {
  const { entries: allEntries, clear } = useHistoryStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const needle = filter.trim().toLowerCase();
  const entries =
    needle.length === 0
      ? allEntries
      : allEntries.filter((entry) => entry.url.toLowerCase().includes(needle));

  return (
    <div className="flex flex-col gap-1 p-2 text-sm">
      <div className="flex items-center justify-between px-1 py-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
        <span>History</span>
        {entries.length > 0 && (
          <button
            type="button"
            className="hover:text-text-primary"
            onClick={() => setShowClearConfirm(true)}
          >
            Clear
          </button>
        )}
      </div>
      {entries.length === 0 && (
        <p className="px-1 text-xs text-text-muted">No requests sent yet.</p>
      )}
      {entries.map((entry) => (
        <div
          key={entry.id}
          onClick={() => onRestore(toDraft(entry))}
          className="flex cursor-pointer flex-col gap-0.5 rounded-sm px-2 py-1 hover:bg-surface-2"
        >
          <div className="flex items-center gap-2">
            <MethodBadge method={entry.method} />
            <span className="flex-1 truncate font-mono text-xs text-text-secondary">
              {entry.url}
            </span>
          </div>
          <div className="flex items-center gap-2 pl-[3.25rem] text-xs">
            <span className={statusColorClass(entry.statusCode)}>
              {entry.statusCode ?? entry.errorKind ?? "error"}
            </span>
            <span className="text-text-muted">
              {new Date(entry.executedAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
      ))}

      {showClearConfirm && (
        <ConfirmDialog
          title="Clear History"
          message="Clear all request history? This cannot be undone."
          confirmLabel="Clear"
          danger
          onConfirm={() => {
            void clear();
            setShowClearConfirm(false);
          }}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </div>
  );
}
