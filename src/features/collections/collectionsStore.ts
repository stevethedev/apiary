import { create } from "zustand";
import type { Collection } from "../../types/collection";
import type { SavedRequest } from "../../types/request";
import * as api from "../../lib/tauri";

interface CollectionsState {
  collections: Collection[];
  requestsByCollection: Record<string, SavedRequest[]>;
  loaded: boolean;
  load: () => Promise<void>;
  createCollection: (name: string) => Promise<Collection>;
  renameCollection: (id: string, name: string) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  reorderCollections: (orderedIds: string[]) => Promise<void>;
  createRequest: (input: api.SavedRequestInput) => Promise<SavedRequest>;
  updateRequest: (id: string, input: api.SavedRequestInput) => Promise<SavedRequest>;
  duplicateRequest: (id: string) => Promise<SavedRequest>;
  deleteRequest: (id: string) => Promise<void>;
  reorderRequests: (collectionId: string, orderedIds: string[]) => Promise<void>;
}

export const useCollectionsStore = create<CollectionsState>((set) => ({
  collections: [],
  requestsByCollection: {},
  loaded: false,

  load: async () => {
    const collections = await api.listCollections();
    const requestLists = await Promise.all(
      collections.map((collection) => api.listRequests(collection.id)),
    );
    const requestsByCollection: Record<string, SavedRequest[]> = {};
    collections.forEach((collection, i) => {
      requestsByCollection[collection.id] = requestLists[i];
    });
    set({ collections, requestsByCollection, loaded: true });
  },

  createCollection: async (name) => {
    const collection = await api.createCollection(name);
    set((state) => ({
      collections: [...state.collections, collection],
      requestsByCollection: { ...state.requestsByCollection, [collection.id]: [] },
    }));
    return collection;
  },

  renameCollection: async (id, name) => {
    await api.renameCollection(id, name);
    set((state) => ({
      collections: state.collections.map((c) => (c.id === id ? { ...c, name } : c)),
    }));
  },

  deleteCollection: async (id) => {
    await api.deleteCollection(id);
    set((state) => {
      const { [id]: _removed, ...rest } = state.requestsByCollection;
      return {
        collections: state.collections.filter((c) => c.id !== id),
        requestsByCollection: rest,
      };
    });
  },

  reorderCollections: async (orderedIds) => {
    await api.reorderCollections(orderedIds);
    set((state) => ({
      collections: orderedIds
        .map((id) => state.collections.find((c) => c.id === id))
        .filter((c): c is Collection => c !== undefined),
    }));
  },

  createRequest: async (input) => {
    const request = await api.createRequest(input);
    set((state) => ({
      requestsByCollection: {
        ...state.requestsByCollection,
        [input.collectionId]: [...(state.requestsByCollection[input.collectionId] ?? []), request],
      },
    }));
    return request;
  },

  updateRequest: async (id, input) => {
    const request = await api.updateRequest(id, input);
    set((state) => ({
      requestsByCollection: {
        ...state.requestsByCollection,
        [input.collectionId]: (state.requestsByCollection[input.collectionId] ?? []).map((r) =>
          r.id === id ? request : r,
        ),
      },
    }));
    return request;
  },

  duplicateRequest: async (id) => {
    const request = await api.duplicateRequest(id);
    set((state) => ({
      requestsByCollection: {
        ...state.requestsByCollection,
        [request.collectionId]: [
          ...(state.requestsByCollection[request.collectionId] ?? []),
          request,
        ],
      },
    }));
    return request;
  },

  deleteRequest: async (id) => {
    await api.deleteRequest(id);
    set((state) => {
      const requestsByCollection = { ...state.requestsByCollection };
      for (const collectionId of Object.keys(requestsByCollection)) {
        requestsByCollection[collectionId] = requestsByCollection[collectionId].filter(
          (r) => r.id !== id,
        );
      }
      return { requestsByCollection };
    });
  },

  reorderRequests: async (collectionId, orderedIds) => {
    await api.reorderRequests(collectionId, orderedIds);
    set((state) => {
      const existing = state.requestsByCollection[collectionId] ?? [];
      const reordered = orderedIds
        .map((id) => existing.find((r) => r.id === id))
        .filter((r): r is SavedRequest => r !== undefined);
      return {
        requestsByCollection: { ...state.requestsByCollection, [collectionId]: reordered },
      };
    });
  },
}));
