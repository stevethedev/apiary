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
  | { readonly status: "idle" }
  | { readonly status: "sending"; readonly requestId: string }
  | { readonly status: "success"; readonly result: HttpResponseResult }
  | { readonly status: "error"; readonly error: HttpErrorResult }
  | { readonly status: "blocked"; readonly missing: readonly string[] };

export interface Tab {
  readonly id: string;
  /** null for an ad-hoc tab that isn't bound to any saved request. */
  readonly requestId: string | null;
  readonly name: string;
  readonly draft: RequestDraft;
  /** True when `draft` differs from the last-saved state of `requestId`. */
  readonly dirty: boolean;
  readonly response: TabResponseState;
}

/** Mirrors the Rust `OpenTab` row shape used to persist the open-tabs set. */
export interface StoredTab {
  readonly id: string;
  readonly requestId: string | null;
  readonly name: string;
  readonly isActive: boolean;
  readonly sortOrder: number;
  readonly draftMethod: HttpMethod;
  readonly draftUrl: string;
  readonly draftParams: readonly KeyValueRow[];
  readonly draftHeaders: readonly KeyValueRow[];
  readonly draftAuth: AuthConfig;
  readonly draftBody: BodyConfig;
  readonly isDirty: boolean;
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
