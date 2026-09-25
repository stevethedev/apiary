import { create } from "zustand";
import type { Environment, EnvironmentVariable } from "../../types/environment";
import * as api from "../../lib/tauri";

interface EnvironmentState {
  environments: Environment[];
  loaded: boolean;
  load: () => Promise<void>;
  createEnvironment: (name: string) => Promise<Environment>;
  renameEnvironment: (id: string, name: string) => Promise<void>;
  deleteEnvironment: (id: string) => Promise<void>;
  setActive: (id: string) => Promise<void>;
  clearActive: () => Promise<void>;
  setVariables: (
    environmentId: string,
    variables: EnvironmentVariable[],
  ) => Promise<void>;
  /** Plain key -> value map for the active environment, used to resolve
   * {{variable}} references before sending. Secret values are included —
   * masking only applies to the UI, not to what actually gets sent. */
  activeVariables: () => Record<string, string>;
}

export const useEnvironmentStore = create<EnvironmentState>((set, get) => ({
  environments: [],
  loaded: false,

  load: async (): Promise<void> => {
    const environments = await api.listEnvironments();
    set({ environments, loaded: true });
  },

  createEnvironment: async (name): Promise<Environment> => {
    const environment = await api.createEnvironment(name);
    set((state) => ({ environments: [...state.environments, environment] }));
    return environment;
  },

  renameEnvironment: async (id, name): Promise<void> => {
    const environment = await api.updateEnvironment(id, name);
    set((state) => ({
      environments: state.environments.map((e) =>
        e.id === id ? environment : e,
      ),
    }));
  },

  deleteEnvironment: async (id): Promise<void> => {
    await api.deleteEnvironment(id);
    set((state) => ({
      environments: state.environments.filter((e) => e.id !== id),
    }));
  },

  setActive: async (id): Promise<void> => {
    await api.setActiveEnvironment(id);
    set((state) => ({
      environments: state.environments.map((e) => ({
        ...e,
        isActive: e.id === id,
      })),
    }));
  },

  clearActive: async (): Promise<void> => {
    await api.clearActiveEnvironment();
    set((state) => ({
      environments: state.environments.map((e) => ({ ...e, isActive: false })),
    }));
  },

  setVariables: async (environmentId, variables): Promise<void> => {
    const environment = await api.setEnvironmentVariables(
      environmentId,
      variables,
    );
    set((state) => ({
      environments: state.environments.map((e) =>
        e.id === environmentId ? environment : e,
      ),
    }));
  },

  activeVariables: (): Record<string, string> => {
    const active = get().environments.find((e) => e.isActive);
    if (!active) return {};
    const map: Record<string, string> = {};
    for (const variable of active.variables) {
      map[variable.key] = variable.value;
    }
    return map;
  },
}));
