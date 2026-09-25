import type {
  AuthConfig,
  BodyConfig,
  HttpErrorResult,
  HttpMethod,
  HttpResponseResult,
  KeyValueRow,
  RequestDraft,
} from "./http";

export type TabResponseState =
  | { status: "idle" }
  | { status: "sending"; requestId: string }
  | { status: "success"; result: HttpResponseResult }
  | { status: "error"; error: HttpErrorResult }
  | { status: "blocked"; missing: string[] };

export interface Tab {
  id: string;
  /** null for an ad-hoc tab that isn't bound to any saved request. */
  requestId: string | null;
  name: string;
  draft: RequestDraft;
  /** True when `draft` differs from the last-saved state of `requestId`. */
  dirty: boolean;
  response: TabResponseState;
}

/** Mirrors the Rust `OpenTab` row shape used to persist the open-tabs set. */
export interface StoredTab {
  id: string;
  requestId: string | null;
  name: string;
  isActive: boolean;
  sortOrder: number;
  draftMethod: HttpMethod;
  draftUrl: string;
  draftParams: KeyValueRow[];
  draftHeaders: KeyValueRow[];
  draftAuth: AuthConfig;
  draftBody: BodyConfig;
  isDirty: boolean;
}

export function tabToStoredTab(tab: Tab, index: number): StoredTab {
  return {
    id: tab.id,
    requestId: tab.requestId,
    name: tab.name,
    isActive: false, // set by the caller, which knows the overall active id
    sortOrder: index,
    draftMethod: tab.draft.method,
    draftUrl: tab.draft.url,
    draftParams: tab.draft.params,
    draftHeaders: tab.draft.headers,
    draftAuth: tab.draft.auth,
    draftBody: tab.draft.body,
    isDirty: tab.dirty,
  };
}

export function storedTabToTab(stored: StoredTab): Tab {
  return {
    id: stored.id,
    requestId: stored.requestId,
    name: stored.name,
    dirty: stored.isDirty,
    response: { status: "idle" },
    draft: {
      method: stored.draftMethod,
      url: stored.draftUrl,
      params: stored.draftParams,
      headers: stored.draftHeaders,
      auth: stored.draftAuth,
      body: stored.draftBody,
    },
  };
}
