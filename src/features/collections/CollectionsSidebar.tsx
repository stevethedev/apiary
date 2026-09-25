import { useState, type JSX } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { MethodBadge } from "../../components/MethodBadge";
import { PromptDialog } from "../../components/PromptDialog";
import { RowMenu } from "../../components/RowMenu";
import { useCollectionsStore } from "./collectionsStore";
import { createEmptyDraft } from "../../types/http";
import type { Collection } from "../../types/collection";
import type { SavedRequest } from "../../types/request";

interface CollectionsSidebarProps {
  onOpenRequest: (request: SavedRequest) => void;
  filter?: string;
}

function matchesFilter(request: SavedRequest, filter: string): boolean {
  const needle = filter.toLowerCase();
  return (
    request.name.toLowerCase().includes(needle) ||
    request.url.toLowerCase().includes(needle)
  );
}

function SortableRequestRow({
  request,
  onOpenRequest,
}: {
  request: SavedRequest;
  onOpenRequest: (request: SavedRequest) => void;
}): JSX.Element {
  const { deleteRequest, duplicateRequest, updateRequest } =
    useCollectionsStore();
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState(request.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: request.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  function commitRename(): void {
    setRenaming(false);
    const trimmed = draftName.trim();
    if (trimmed.length > 0 && trimmed !== request.name) {
      void updateRequest(request.id, { ...request, name: trimmed });
    } else {
      setDraftName(request.name);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!renaming) onOpenRequest(request);
      }}
      className="group flex cursor-pointer items-center gap-2 rounded-sm py-1 pl-8 pr-2 text-sm text-text-secondary hover:bg-surface-2 hover:text-text-primary"
    >
      <MethodBadge method={request.method} />
      {renaming ? (
        <input
          autoFocus
          className="flex-1 bg-transparent text-text-primary outline-none"
          value={draftName}
          onClick={(e) => {
            e.stopPropagation();
          }}
          onChange={(e) => {
            setDraftName(e.target.value);
          }}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") {
              setDraftName(request.name);
              setRenaming(false);
            }
          }}
        />
      ) : (
        <span className="flex-1 truncate">{request.name}</span>
      )}
      <RowMenu
        items={[
          {
            label: "Rename",
            onClick: (): void => {
              setRenaming(true);
            },
          },
          {
            label: "Duplicate",
            onClick: (): void => void duplicateRequest(request.id),
          },
          {
            label: "Delete",
            danger: true,
            onClick: (): void => {
              setShowDeleteConfirm(true);
            },
          },
        ]}
      />

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Request"
          message={`Delete "${request.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => {
            void deleteRequest(request.id);
            setShowDeleteConfirm(false);
          }}
          onCancel={() => {
            setShowDeleteConfirm(false);
          }}
        />
      )}
    </div>
  );
}

interface SortableCollectionSectionProps {
  collection: Collection;
  requests: SavedRequest[];
  isExpanded: boolean;
  isRenaming: boolean;
  draftName: string;
  onToggleExpanded: () => void;
  onDraftNameChange: (value: string) => void;
  onCommitRename: () => void;
  onStartRename: () => void;
  onNewRequest: () => void;
  onDelete: () => void;
  onOpenRequest: (request: SavedRequest) => void;
}

function SortableCollectionSection({
  collection,
  requests,
  isExpanded,
  isRenaming,
  draftName,
  onToggleExpanded,
  onDraftNameChange,
  onCommitRename,
  onStartRename,
  onNewRequest,
  onDelete,
  onOpenRequest,
}: SortableCollectionSectionProps): JSX.Element {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: collection.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        {...attributes}
        {...listeners}
        className="group flex cursor-pointer items-center gap-1 rounded-sm px-1 py-1 hover:bg-surface-2"
        onClick={() => {
          if (!isRenaming) onToggleExpanded();
        }}
      >
        <span className="w-3 text-text-muted">{isExpanded ? "▾" : "▸"}</span>
        {isRenaming ? (
          <input
            autoFocus
            className="flex-1 bg-transparent text-text-primary outline-none"
            value={draftName}
            onClick={(e) => {
              e.stopPropagation();
            }}
            onChange={(e) => {
              onDraftNameChange(e.target.value);
            }}
            onBlur={onCommitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
          />
        ) : (
          <span className="flex-1 truncate font-medium text-text-primary">
            {collection.name}
          </span>
        )}
        <button
          type="button"
          aria-label="New request in collection"
          className="rounded-sm px-1 text-text-muted opacity-0 group-hover:opacity-100 hover:bg-surface-3 hover:text-text-primary"
          onClick={(e) => {
            e.stopPropagation();
            onNewRequest();
          }}
        >
          +
        </button>
        <RowMenu
          items={[
            { label: "Rename", onClick: onStartRename },
            { label: "Delete", danger: true, onClick: onDelete },
          ]}
        />
      </div>

      {isExpanded && (
        <SortableContext
          items={requests.map((r) => r.id)}
          strategy={verticalListSortingStrategy}
        >
          {requests.map((request) => (
            <SortableRequestRow
              key={request.id}
              request={request}
              onOpenRequest={onOpenRequest}
            />
          ))}
        </SortableContext>
      )}
    </div>
  );
}

export function CollectionsSidebar({
  onOpenRequest,
  filter = "",
}: CollectionsSidebarProps): JSX.Element {
  const {
    collections,
    requestsByCollection,
    createCollection,
    renameCollection,
    deleteCollection,
    createRequest,
    reorderRequests,
    reorderCollections,
  } = useCollectionsStore();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [renamingCollectionId, setRenamingCollectionId] = useState<
    string | null
  >(null);
  const [collectionDraftName, setCollectionDraftName] = useState("");
  const [showNewCollectionDialog, setShowNewCollectionDialog] = useState(false);
  const [deletingCollectionId, setDeletingCollectionId] = useState<
    string | null
  >(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );
  const isFiltering = filter.trim().length > 0;

  function toggleExpanded(id: string): void {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // A single DndContext handles both collection reordering and, within an
  // expanded collection, reordering its own requests — dnd-kit only
  // disallows nesting multiple DndContexts, not nesting SortableContexts,
  // so this dispatches on what kind of id was dragged instead of using two
  // separate drag managers.
  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    if (collections.some((c) => c.id === active.id)) {
      const oldIndex = collections.findIndex((c) => c.id === active.id);
      const newIndex = collections.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = [...collections];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);
      void reorderCollections(reordered.map((c) => c.id));
      return;
    }

    const collectionId = Object.keys(requestsByCollection).find((id) =>
      requestsByCollection[id].some((r) => r.id === active.id),
    );
    if (!collectionId) return;
    const requests = requestsByCollection[collectionId] ?? [];
    const oldIndex = requests.findIndex((r) => r.id === active.id);
    const newIndex = requests.findIndex((r) => r.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = [...requests];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    void reorderRequests(
      collectionId,
      reordered.map((r) => r.id),
    );
  }

  async function handleNewCollection(name: string): Promise<void> {
    const collection = await createCollection(name);
    setExpanded((prev) => new Set(prev).add(collection.id));
    setShowNewCollectionDialog(false);
  }

  async function handleNewRequest(collectionId: string): Promise<void> {
    const draft = createEmptyDraft();
    const request = await createRequest({
      collectionId,
      name: "New Request",
      method: draft.method,
      url: draft.url,
      params: draft.params,
      headers: draft.headers,
      auth: draft.auth,
      body: draft.body,
    });
    setExpanded((prev) => new Set(prev).add(collectionId));
    onOpenRequest(request);
  }

  const visibleCollections = collections
    .map((collection) => {
      const allRequests = requestsByCollection[collection.id] ?? [];
      const requests = isFiltering
        ? allRequests.filter((r) => matchesFilter(r, filter))
        : allRequests;
      return { collection, requests };
    })
    .filter(({ requests }) => !isFiltering || requests.length > 0);

  const sections = visibleCollections.map(({ collection, requests }) => (
    <SortableCollectionSection
      key={collection.id}
      collection={collection}
      requests={requests}
      isExpanded={isFiltering || expanded.has(collection.id)}
      isRenaming={renamingCollectionId === collection.id}
      draftName={collectionDraftName}
      onToggleExpanded={() => {
        toggleExpanded(collection.id);
      }}
      onDraftNameChange={setCollectionDraftName}
      onCommitRename={() => {
        setRenamingCollectionId(null);
        const trimmed = collectionDraftName.trim();
        if (trimmed.length > 0 && trimmed !== collection.name) {
          void renameCollection(collection.id, trimmed);
        }
      }}
      onStartRename={() => {
        setCollectionDraftName(collection.name);
        setRenamingCollectionId(collection.id);
      }}
      onNewRequest={() => void handleNewRequest(collection.id)}
      onDelete={() => {
        setDeletingCollectionId(collection.id);
      }}
      onOpenRequest={onOpenRequest}
    />
  ));

  return (
    <div className="flex flex-col gap-1 p-2 text-sm">
      <div className="flex items-center justify-between px-1 py-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
        <span>Collections</span>
        <button
          type="button"
          aria-label="New collection"
          className="rounded-sm px-1.5 hover:bg-surface-2 hover:text-text-primary"
          onClick={() => {
            setShowNewCollectionDialog(true);
          }}
        >
          +
        </button>
      </div>

      {isFiltering ? (
        sections
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visibleCollections.map(({ collection }) => collection.id)}
            strategy={verticalListSortingStrategy}
          >
            {sections}
          </SortableContext>
        </DndContext>
      )}

      {showNewCollectionDialog && (
        <PromptDialog
          title="New Collection"
          label="NAME"
          placeholder="Users API"
          confirmLabel="Create"
          onConfirm={(name) => void handleNewCollection(name)}
          onCancel={() => {
            setShowNewCollectionDialog(false);
          }}
        />
      )}

      {deletingCollectionId && (
        <ConfirmDialog
          title="Delete Collection"
          message={`Delete collection "${
            collections.find((c) => c.id === deletingCollectionId)?.name ?? ""
          }" and all its requests? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => {
            void deleteCollection(deletingCollectionId);
            setDeletingCollectionId(null);
          }}
          onCancel={() => {
            setDeletingCollectionId(null);
          }}
        />
      )}
    </div>
  );
}
