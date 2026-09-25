import { create } from "zustand";
import { createEmptyDraft, type RequestDraft } from "../../types/http";
import {
  storedTabToTab,
  tabToStoredTab,
  type Tab,
  type TabResponseState,
} from "../../types/tab";
import { loadOpenTabs, saveOpenTabs } from "../../lib/tauri";

const PERSIST_DEBOUNCE_MS = 300;
let persistTimer: ReturnType<typeof setTimeout> | undefined;

interface TabsState {
  tabs: Tab[];
  activeTabId: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  openNewTab: () => string;
  openRequestTab: (
    requestId: string,
    name: string,
    draft: RequestDraft,
  ) => string;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateDraft: (tabId: string, patch: Partial<RequestDraft>) => void;
  renameTab: (tabId: string, name: string) => void;
  bindTabToRequest: (tabId: string, requestId: string, name: string) => void;
  setResponse: (tabId: string, response: TabResponseState) => void;
}

function makeTab(overrides: Partial<Tab> = {}): Tab {
  return {
    id: crypto.randomUUID(),
    requestId: null,
    name: "Untitled Request",
    draft: createEmptyDraft(),
    dirty: false,
    response: { status: "idle" },
    ...overrides,
  };
}

function schedulePersist(getState: () => TabsState): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    const { tabs, activeTabId } = getState();
    const stored = tabs.map((tab, index) => ({
      ...tabToStoredTab(tab, index),
      isActive: tab.id === activeTabId,
    }));
    void saveOpenTabs(stored);
  }, PERSIST_DEBOUNCE_MS);
}

export const useTabsStore = create<TabsState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  hydrated: false,

  hydrate: async (): Promise<void> => {
    if (get().hydrated) return;
    const stored = await loadOpenTabs();
    const tabs = stored
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(storedTabToTab);
    const active = stored.find((tab) => tab.isActive);
    set({
      tabs,
      activeTabId: active?.id ?? tabs.at(0)?.id ?? null,
      hydrated: true,
    });
  },

  openNewTab: (): string => {
    const tab = makeTab();
    set((state) => ({ tabs: [...state.tabs, tab], activeTabId: tab.id }));
    schedulePersist(get);
    return tab.id;
  },

  openRequestTab: (requestId, name, draft): string => {
    const existing = get().tabs.find((tab) => tab.requestId === requestId);
    if (existing) {
      set({ activeTabId: existing.id });
      return existing.id;
    }
    const tab = makeTab({ requestId, name, draft });
    set((state) => ({ tabs: [...state.tabs, tab], activeTabId: tab.id }));
    schedulePersist(get);
    return tab.id;
  },

  closeTab: (id): void => {
    const { tabs, activeTabId } = get();
    const index = tabs.findIndex((tab) => tab.id === id);
    if (index === -1) return;
    const nextTabs = tabs.filter((tab) => tab.id !== id);
    let nextActive = activeTabId;
    if (activeTabId === id) {
      const fallback =
        nextTabs.at(index) ?? (index > 0 ? nextTabs.at(index - 1) : undefined);
      nextActive = fallback ? fallback.id : null;
    }
    set({ tabs: nextTabs, activeTabId: nextActive });
    schedulePersist(get);
  },

  setActiveTab: (id): void => {
    set({ activeTabId: id });
    schedulePersist(get);
  },

  updateDraft: (tabId, patch): void => {
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId
          ? { ...tab, draft: { ...tab.draft, ...patch }, dirty: true }
          : tab,
      ),
    }));
    schedulePersist(get);
  },

  renameTab: (tabId, name): void => {
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId ? { ...tab, name } : tab,
      ),
    }));
    schedulePersist(get);
  },

  bindTabToRequest: (tabId, requestId, name): void => {
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId ? { ...tab, requestId, name, dirty: false } : tab,
      ),
    }));
    schedulePersist(get);
  },

  setResponse: (tabId, response): void => {
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId ? { ...tab, response } : tab,
      ),
    }));
  },
}));
