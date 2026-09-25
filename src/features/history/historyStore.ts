import { create } from "zustand";
import type { HistoryEntry } from "../../types/history";
import * as api from "../../lib/tauri";

const PAGE_SIZE = 200;

interface HistoryState {
  entries: HistoryEntry[];
  loaded: boolean;
  load: () => Promise<void>;
  append: (input: api.HistoryEntryInput) => Promise<void>;
  clear: () => Promise<void>;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  entries: [],
  loaded: false,

  load: async () => {
    const entries = await api.listHistory(PAGE_SIZE, 0);
    set({ entries, loaded: true });
  },

  append: async (input) => {
    const entry = await api.appendHistory(input);
    set((state) => ({ entries: [entry, ...state.entries] }));
  },

  clear: async () => {
    await api.clearHistory();
    set({ entries: [] });
  },
}));
