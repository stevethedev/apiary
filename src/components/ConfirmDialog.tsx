interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Same rationale as PromptDialog: `window.confirm()` is unreliable inside
 * Tauri's embedded webview, so destructive actions get an in-app modal
 * instead of relying on it. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50">
      <div className="w-[380px] rounded-sm border border-surface-3 bg-surface-1 p-4">
        <h2 className="mb-2 text-sm font-semibold text-text-primary">{title}</h2>
        <p className="mb-4 text-sm text-text-secondary">{message}</p>
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
            autoFocus
            className={`rounded-sm px-3 py-1 text-sm font-medium ${
              danger ? "bg-status-server-error text-white" : "bg-accent text-surface-0"
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
