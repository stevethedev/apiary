import { useState, type JSX } from "react";
import { useCollectionsStore } from "../collections/collectionsStore";

interface SaveRequestDialogProps {
  suggestedName: string;
  onCancel: () => void;
  onConfirm: (collectionId: string, name: string) => void;
}

export function SaveRequestDialog({
  suggestedName,
  onCancel,
  onConfirm,
}: SaveRequestDialogProps): JSX.Element {
  const { collections, createCollection } = useCollectionsStore();
  const [name, setName] = useState(suggestedName);
  const [collectionId, setCollectionId] = useState(collections[0]?.id ?? "");
  const [creatingCollection, setCreatingCollection] = useState(
    collections.length === 0,
  );
  const [newCollectionName, setNewCollectionName] = useState("");

  async function handleConfirm(): Promise<void> {
    if (name.trim().length === 0) return;
    let targetId = collectionId;
    if (creatingCollection) {
      if (newCollectionName.trim().length === 0) return;
      const collection = await createCollection(newCollectionName.trim());
      targetId = collection.id;
    }
    if (!targetId) return;
    onConfirm(targetId, name.trim());
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50">
      <div className="w-[420px] rounded-sm border border-surface-3 bg-surface-1 p-4">
        <h2 className="mb-3 text-sm font-semibold text-text-primary">
          Save Request
        </h2>

        <label className="mb-3 flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-text-muted">NAME</span>
          <input
            autoFocus
            className="h-8 rounded-sm border border-surface-3 bg-surface-2 px-2 text-text-primary outline-none focus:border-accent"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
          />
        </label>

        <label className="mb-1 flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-text-muted">
            COLLECTION
          </span>
          {!creatingCollection ? (
            <select
              className="h-8 rounded-sm border border-surface-3 bg-surface-2 px-2 text-text-primary outline-none"
              value={collectionId}
              onChange={(e) => {
                if (e.target.value === "__new__") setCreatingCollection(true);
                else setCollectionId(e.target.value);
              }}
            >
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="__new__">+ New collection…</option>
            </select>
          ) : (
            <input
              className="h-8 rounded-sm border border-surface-3 bg-surface-2 px-2 text-text-primary outline-none focus:border-accent"
              placeholder="Collection name"
              value={newCollectionName}
              onChange={(e) => {
                setNewCollectionName(e.target.value);
              }}
            />
          )}
        </label>

        <div className="mt-4 flex justify-end gap-2">
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
            onClick={() => void handleConfirm()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
