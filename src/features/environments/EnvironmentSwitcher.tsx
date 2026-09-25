import { useState } from "react";
import { PromptDialog } from "../../components/PromptDialog";
import { RowMenu } from "../../components/RowMenu";
import { useEnvironmentStore } from "./environmentStore";

interface EnvironmentSwitcherProps {
  onEdit: (environmentId: string) => void;
}

export function EnvironmentSwitcher({ onEdit }: EnvironmentSwitcherProps) {
  const { environments, createEnvironment, setActive, renameEnvironment } = useEnvironmentStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const active = environments.find((e) => e.isActive);

  async function handleCreate(name: string) {
    const environment = await createEnvironment(name);
    await setActive(environment.id);
    setShowCreateDialog(false);
  }

  function commitRename(environmentId: string, currentName: string) {
    setRenamingId(null);
    const trimmed = draftName.trim();
    if (trimmed.length > 0 && trimmed !== currentName) {
      void renameEnvironment(environmentId, trimmed);
    }
  }

  return (
    <div className="flex flex-col gap-1 p-2 text-sm">
      <div className="flex items-center justify-between px-1 py-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
        <span>Environments</span>
        <button
          type="button"
          aria-label="New environment"
          className="rounded-sm px-1.5 hover:bg-surface-2 hover:text-text-primary"
          onClick={() => setShowCreateDialog(true)}
        >
          +
        </button>
      </div>
      {environments.length === 0 && (
        <p className="px-1 text-xs text-text-muted">No environments yet.</p>
      )}
      {environments.map((environment) => {
        const isRenaming = renamingId === environment.id;
        return (
          <div
            key={environment.id}
            onClick={() => !isRenaming && void setActive(environment.id)}
            className={`group flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 ${
              environment.id === active?.id
                ? "bg-surface-2 text-text-primary"
                : "text-text-secondary hover:bg-surface-2/60"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                environment.id === active?.id ? "bg-status-success" : "bg-text-muted"
              }`}
            />
            {isRenaming ? (
              <input
                autoFocus
                className="flex-1 bg-transparent text-text-primary outline-none"
                value={draftName}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={() => commitRename(environment.id, environment.name)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") setRenamingId(null);
                }}
              />
            ) : (
              <span className="flex-1 truncate">{environment.name}</span>
            )}
            <RowMenu
              items={[
                { label: "Edit Variables", onClick: () => onEdit(environment.id) },
                {
                  label: "Rename",
                  onClick: () => {
                    setDraftName(environment.name);
                    setRenamingId(environment.id);
                  },
                },
              ]}
            />
          </div>
        );
      })}

      {showCreateDialog && (
        <PromptDialog
          title="New Environment"
          label="NAME"
          placeholder="Development"
          confirmLabel="Create"
          onConfirm={(name) => void handleCreate(name)}
          onCancel={() => setShowCreateDialog(false)}
        />
      )}
    </div>
  );
}
