import { useState } from "react";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import type { EnvironmentVariable } from "../../types/environment";
import { useEnvironmentStore } from "./environmentStore";

function createEmptyVariable(): EnvironmentVariable {
  return { id: crypto.randomUUID(), key: "", value: "", isSecret: false, sortOrder: 0 };
}

function VariableRow({
  variable,
  onChange,
  onRemove,
}: {
  variable: EnvironmentVariable;
  onChange: (patch: Partial<EnvironmentVariable>) => void;
  onRemove: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const showMasked = variable.isSecret && !revealed;

  return (
    <div className="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-2 border-b border-surface-2 py-1">
      <input
        className="bg-transparent px-1 font-mono text-sm text-text-primary outline-none"
        placeholder="key"
        value={variable.key}
        onChange={(e) => onChange({ key: e.target.value })}
      />
      <input
        className="bg-transparent px-1 font-mono text-sm text-text-primary outline-none"
        placeholder="value"
        type={showMasked ? "password" : "text"}
        value={variable.value}
        onChange={(e) => onChange({ value: e.target.value })}
      />
      <label className="flex items-center gap-1 text-xs text-text-muted">
        <input
          type="checkbox"
          checked={variable.isSecret}
          onChange={(e) => onChange({ isSecret: e.target.checked })}
        />
        secret
      </label>
      <div className="flex items-center gap-1">
        {variable.isSecret && (
          <button
            type="button"
            className="text-xs text-text-muted hover:text-text-primary"
            onClick={() => setRevealed((v) => !v)}
          >
            {revealed ? "Hide" : "Show"}
          </button>
        )}
        <button
          type="button"
          aria-label="Remove variable"
          className="text-text-muted hover:text-status-server-error"
          onClick={onRemove}
        >
          ×
        </button>
      </div>
    </div>
  );
}

export function EnvironmentEditor({
  environmentId,
  onClose,
}: {
  environmentId: string;
  onClose: () => void;
}) {
  const { environments, setVariables, deleteEnvironment } = useEnvironmentStore();
  const environment = environments.find((e) => e.id === environmentId);
  const [variables, setLocalVariables] = useState<EnvironmentVariable[]>(() => [
    ...(environment?.variables ?? []),
  ]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!environment) return null;

  function update(id: string, patch: Partial<EnvironmentVariable>) {
    setLocalVariables((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }

  function remove(id: string) {
    setLocalVariables((prev) => prev.filter((v) => v.id !== id));
  }

  async function handleSave() {
    const cleaned = variables
      .filter((v) => v.key.trim().length > 0)
      .map((v, i) => ({ ...v, sortOrder: i }));
    await setVariables(environmentId, cleaned);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50">
      <div className="flex max-h-[80vh] w-[560px] flex-col rounded-sm border border-surface-3 bg-surface-1 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">{environment.name} variables</h2>
          <button
            type="button"
            className="text-text-muted hover:text-text-primary"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {variables.map((variable) => (
            <VariableRow
              key={variable.id}
              variable={variable}
              onChange={(patch) => update(variable.id, patch)}
              onRemove={() => remove(variable.id)}
            />
          ))}
          <button
            type="button"
            className="mt-2 text-sm text-text-muted hover:text-text-primary"
            onClick={() => setLocalVariables((prev) => [...prev, createEmptyVariable()])}
          >
            + Add variable
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            className="text-sm text-status-server-error hover:underline"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete environment
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-sm border border-surface-3 px-3 py-1 text-sm text-text-primary hover:bg-surface-2"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-sm bg-accent px-3 py-1 text-sm font-medium text-surface-0"
              onClick={() => void handleSave()}
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Environment"
          message={`Delete environment "${environment.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => void deleteEnvironment(environmentId).then(onClose)}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
