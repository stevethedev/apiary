import { useState } from "react";

interface PromptDialogProps {
  title: string;
  label: string;
  placeholder?: string;
  initialValue?: string;
  confirmLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

/** Tauri's embedded webview doesn't implement `window.prompt()` — it
 * silently no-ops instead of showing anything — so any "ask for a name"
 * interaction needs an in-app modal like this one instead. */
export function PromptDialog({
  title,
  label,
  placeholder,
  initialValue = "",
  confirmLabel = "Create",
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  const [value, setValue] = useState(initialValue);

  function handleConfirm() {
    const trimmed = value.trim();
    if (trimmed.length === 0) return;
    onConfirm(trimmed);
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50">
      <div className="w-[380px] rounded-sm border border-surface-3 bg-surface-1 p-4">
        <h2 className="mb-3 text-sm font-semibold text-text-primary">{title}</h2>
        <label className="mb-4 flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-text-muted">{label}</span>
          <input
            autoFocus
            className="h-8 rounded-sm border border-surface-3 bg-surface-2 px-2 text-text-primary outline-none focus:border-accent"
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleConfirm();
              if (e.key === "Escape") onCancel();
            }}
          />
        </label>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="rounded-sm border border-surface-3 px-3 py-1 text-sm text-text-primary hover:bg-surface-2"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-sm bg-accent px-3 py-1 text-sm font-medium text-surface-0"
            onClick={handleConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
