import { useEffect, useState } from "react";
import { TabBar } from "./components/TabBar";
import { ThemeToggle } from "./components/ThemeToggle";
import { RequestEditor } from "./features/requests/RequestEditor";
import { ResponsePanel } from "./features/requests/ResponsePanel";
import { SaveRequestDialog } from "./features/requests/SaveRequestDialog";
import { useTabsStore } from "./features/requests/tabsStore";
import { resolveDraft } from "./features/requests/variableResolution";
import { CollectionsSidebar } from "./features/collections/CollectionsSidebar";
import { useCollectionsStore } from "./features/collections/collectionsStore";
import { EnvironmentSwitcher } from "./features/environments/EnvironmentSwitcher";
import { EnvironmentEditor } from "./features/environments/EnvironmentEditor";
import { useEnvironmentStore } from "./features/environments/environmentStore";
import { HistoryList } from "./features/history/HistoryList";
import { useHistoryStore } from "./features/history/historyStore";
import { matchShortcut } from "./lib/keyboardShortcuts";
import { ApiaryHttpError, cancelRequest, sendRequest } from "./lib/tauri";
import type { RequestDraft } from "./types/http";
import type { SavedRequest } from "./types/request";

function App() {
  const tabs = useTabsStore((s) => s.tabs);
  const activeTabId = useTabsStore((s) => s.activeTabId);
  const hydrateTabs = useTabsStore((s) => s.hydrate);
  const openNewTab = useTabsStore((s) => s.openNewTab);
  const openRequestTab = useTabsStore((s) => s.openRequestTab);
  const bindTabToRequest = useTabsStore((s) => s.bindTabToRequest);
  const closeTab = useTabsStore((s) => s.closeTab);
  const updateDraft = useTabsStore((s) => s.updateDraft);
  const setResponse = useTabsStore((s) => s.setResponse);

  const loadCollections = useCollectionsStore((s) => s.load);
  const updateSavedRequest = useCollectionsStore((s) => s.updateRequest);

  const loadEnvironments = useEnvironmentStore((s) => s.load);
  const activeVariables = useEnvironmentStore((s) => s.activeVariables);

  const loadHistory = useHistoryStore((s) => s.load);
  const appendHistoryEntry = useHistoryStore((s) => s.append);

  const [editingEnvironmentId, setEditingEnvironmentId] = useState<string | null>(null);
  const [savingTabId, setSavingTabId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    void Promise.all([
      hydrateTabs(),
      loadCollections(),
      loadEnvironments(),
      loadHistory(),
    ]);
  }, [hydrateTabs, loadCollections, loadEnvironments, loadHistory]);

  useEffect(() => {
    if (tabs.length === 0) {
      openNewTab();
    }
  }, [tabs.length, openNewTab]);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? null;

  async function handleSend() {
    if (!activeTab) return;
    const { payload, missing } = resolveDraft(activeTab.draft, activeVariables());
    if (!payload) {
      setResponse(activeTab.id, { status: "blocked", missing });
      return;
    }

    const requestId = crypto.randomUUID();
    setResponse(activeTab.id, { status: "sending", requestId });
    try {
      const result = await sendRequest(requestId, payload);
      setResponse(activeTab.id, { status: "success", result });
      void appendHistoryEntry({
        method: activeTab.draft.method,
        url: activeTab.draft.url,
        params: activeTab.draft.params,
        headers: activeTab.draft.headers,
        auth: activeTab.draft.auth,
        body: activeTab.draft.body,
        statusCode: result.statusCode,
        durationMs: result.durationMs,
        responseSizeBytes: result.bodySizeBytes,
        responseHeaders: result.headers,
        errorKind: null,
      });
    } catch (error) {
      const httpError =
        error instanceof ApiaryHttpError
          ? error
          : new ApiaryHttpError({ kind: "network", message: String(error) });
      setResponse(activeTab.id, {
        status: "error",
        error: { kind: httpError.kind, message: httpError.message },
      });
      if (httpError.kind !== "cancelled") {
        void appendHistoryEntry({
          method: activeTab.draft.method,
          url: activeTab.draft.url,
          params: activeTab.draft.params,
          headers: activeTab.draft.headers,
          auth: activeTab.draft.auth,
          body: activeTab.draft.body,
          statusCode: null,
          durationMs: null,
          responseSizeBytes: null,
          responseHeaders: null,
          errorKind: httpError.kind,
        });
      }
    }
  }

  function handleCancel() {
    if (!activeTab || activeTab.response.status !== "sending") return;
    void cancelRequest(activeTab.response.requestId);
  }

  function handleSave() {
    if (!activeTab) return;
    if (activeTab.requestId) {
      void updateSavedRequest(activeTab.requestId, {
        collectionId: findCollectionIdForRequest(activeTab.requestId),
        name: activeTab.name,
        method: activeTab.draft.method,
        url: activeTab.draft.url,
        params: activeTab.draft.params,
        headers: activeTab.draft.headers,
        auth: activeTab.draft.auth,
        body: activeTab.draft.body,
      });
    } else {
      setSavingTabId(activeTab.id);
    }
  }

  function findCollectionIdForRequest(requestId: string): string {
    const { requestsByCollection } = useCollectionsStore.getState();
    for (const [collectionId, requests] of Object.entries(requestsByCollection)) {
      if (requests.some((r) => r.id === requestId)) return collectionId;
    }
    return "";
  }

  async function handleConfirmSave(collectionId: string, name: string) {
    if (!activeTab) return;
    const created = await useCollectionsStore.getState().createRequest({
      collectionId,
      name,
      method: activeTab.draft.method,
      url: activeTab.draft.url,
      params: activeTab.draft.params,
      headers: activeTab.draft.headers,
      auth: activeTab.draft.auth,
      body: activeTab.draft.body,
    });
    bindTabToRequest(activeTab.id, created.id, created.name);
    setSavingTabId(null);
  }

  function handleOpenSavedRequest(request: SavedRequest) {
    openRequestTab(request.id, request.name, {
      method: request.method,
      url: request.url,
      params: request.params,
      headers: request.headers,
      auth: request.auth,
      body: request.body,
    });
  }

  function handleRestoreFromHistory(draft: RequestDraft) {
    const tabId = openNewTab();
    updateDraft(tabId, draft);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const action = matchShortcut(event);
      if (!action) return;

      switch (action) {
        case "send":
          event.preventDefault();
          void handleSend();
          break;
        case "save":
          event.preventDefault();
          handleSave();
          break;
        case "newTab":
          event.preventDefault();
          openNewTab();
          break;
        case "focusUrl":
          event.preventDefault();
          document.getElementById("apiary-url-bar")?.focus();
          break;
        case "focusSearch":
          event.preventDefault();
          document.getElementById("apiary-sidebar-search")?.focus();
          break;
        case "closeTab":
          event.preventDefault();
          if (activeTab) closeTab(activeTab.id);
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, openNewTab, closeTab]);

  return (
    <div className="flex h-screen w-screen text-text-primary">
      <aside className="flex w-72 flex-col overflow-auto border-r border-surface-3 bg-surface-1">
        <div className="flex items-center justify-between border-b border-surface-3 p-3 text-sm font-semibold tracking-wide">
          <span>Apiary</span>
          <ThemeToggle />
        </div>
        <div className="border-b border-surface-3 p-2">
          <input
            id="apiary-sidebar-search"
            type="text"
            placeholder="Search (Cmd+K)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 w-full rounded-sm border border-surface-3 bg-surface-2 px-2 text-sm text-text-primary outline-none focus:border-accent"
          />
        </div>
        <CollectionsSidebar onOpenRequest={handleOpenSavedRequest} filter={searchTerm} />
        <div className="border-t border-surface-3">
          <EnvironmentSwitcher onEdit={setEditingEnvironmentId} />
        </div>
        <div className="border-t border-surface-3">
          <HistoryList onRestore={handleRestoreFromHistory} filter={searchTerm} />
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <TabBar />
        <div className="flex min-h-0 flex-1 flex-col">
          {activeTab ? (
            <RequestEditor
              tab={activeTab}
              onUpdateDraft={(patch) => updateDraft(activeTab.id, patch)}
              onSend={() => void handleSend()}
              onSave={handleSave}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
              No request open.
            </div>
          )}
          <div className="h-64 border-t border-surface-3">
            {activeTab && <ResponsePanel response={activeTab.response} onCancel={handleCancel} />}
          </div>
        </div>
      </main>

      {editingEnvironmentId && (
        <EnvironmentEditor
          environmentId={editingEnvironmentId}
          onClose={() => setEditingEnvironmentId(null)}
        />
      )}

      {savingTabId && activeTab && (
        <SaveRequestDialog
          suggestedName={activeTab.name === "Untitled Request" ? "" : activeTab.name}
          onCancel={() => setSavingTabId(null)}
          onConfirm={(collectionId, name) => void handleConfirmSave(collectionId, name)}
        />
      )}
    </div>
  );
}

export default App;
