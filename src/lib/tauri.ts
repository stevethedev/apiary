import { invoke } from "@tauri-apps/api/core";
import type { HttpErrorResult, HttpResponseResult, ResolvedRequestPayload } from "../types/http";
import type { Collection } from "../types/collection";
import type { Environment, EnvironmentVariable } from "../types/environment";
import type { HistoryEntry } from "../types/history";
import type { SavedRequest } from "../types/request";
import type { StoredTab } from "../types/tab";

export class ApiaryHttpError extends Error {
  kind: HttpErrorResult["kind"];

  constructor(result: HttpErrorResult) {
    super(result.message);
    this.kind = result.kind;
  }
}

function isHttpErrorResult(error: unknown): error is HttpErrorResult {
  return (
    typeof error === "object" &&
    error !== null &&
    "kind" in error &&
    "message" in error
  );
}

export async function sendRequest(
  requestId: string,
  payload: ResolvedRequestPayload,
): Promise<HttpResponseResult> {
  try {
    return await invoke<HttpResponseResult>("send_request", { requestId, payload });
  } catch (error) {
    if (isHttpErrorResult(error)) {
      throw new ApiaryHttpError(error);
    }
    throw error;
  }
}

export async function cancelRequest(requestId: string): Promise<void> {
  await invoke("cancel_request", { requestId });
}

// --- Collections -----------------------------------------------------------

export const listCollections = () => invoke<Collection[]>("list_collections");
export const createCollection = (name: string) =>
  invoke<Collection>("create_collection", { name });
export const renameCollection = (id: string, name: string) =>
  invoke<void>("rename_collection", { id, name });
export const deleteCollection = (id: string) => invoke<void>("delete_collection", { id });
export const reorderCollections = (orderedIds: string[]) =>
  invoke<void>("reorder_collections", { orderedIds });

// --- Requests ----------------------------------------------------------------

export interface SavedRequestInput {
  collectionId: string;
  name: string;
  method: SavedRequest["method"];
  url: string;
  params: SavedRequest["params"];
  headers: SavedRequest["headers"];
  auth: SavedRequest["auth"];
  body: SavedRequest["body"];
}

export const listRequests = (collectionId: string) =>
  invoke<SavedRequest[]>("list_requests", { collectionId });
export const createRequest = (input: SavedRequestInput) =>
  invoke<SavedRequest>("create_request", { input });
export const updateRequest = (id: string, input: SavedRequestInput) =>
  invoke<SavedRequest>("update_request", { id, input });
export const duplicateRequest = (id: string) =>
  invoke<SavedRequest>("duplicate_request", { id });
export const deleteRequest = (id: string) => invoke<void>("delete_request", { id });
export const reorderRequests = (collectionId: string, orderedIds: string[]) =>
  invoke<void>("reorder_requests", { collectionId, orderedIds });

// --- Environments ------------------------------------------------------------

export const listEnvironments = () => invoke<Environment[]>("list_environments");
export const createEnvironment = (name: string) =>
  invoke<Environment>("create_environment", { name });
export const updateEnvironment = (id: string, name: string) =>
  invoke<Environment>("update_environment", { id, name });
export const deleteEnvironment = (id: string) => invoke<void>("delete_environment", { id });
export const setActiveEnvironment = (id: string) =>
  invoke<void>("set_active_environment", { id });
export const clearActiveEnvironment = () => invoke<void>("clear_active_environment");
export const setEnvironmentVariables = (
  environmentId: string,
  variables: EnvironmentVariable[],
) => invoke<Environment>("set_environment_variables", { environmentId, variables });

// --- History -------------------------------------------------------------------

export interface HistoryEntryInput {
  method: HistoryEntry["method"];
  url: string;
  params: HistoryEntry["params"];
  headers: HistoryEntry["headers"];
  auth: HistoryEntry["auth"];
  body: HistoryEntry["body"];
  statusCode: number | null;
  durationMs: number | null;
  responseSizeBytes: number | null;
  responseHeaders: HistoryEntry["responseHeaders"];
  errorKind: string | null;
}

export const appendHistory = (entry: HistoryEntryInput) =>
  invoke<HistoryEntry>("append_history", { entry });
export const listHistory = (limit: number, offset: number) =>
  invoke<HistoryEntry[]>("list_history", { limit, offset });
export const clearHistory = () => invoke<void>("clear_history");

// --- Tabs ------------------------------------------------------------------------

export const loadOpenTabs = () => invoke<StoredTab[]>("load_open_tabs");
export const saveOpenTabs = (tabs: StoredTab[]) => invoke<void>("save_open_tabs", { tabs });
