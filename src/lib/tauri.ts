import { invoke } from "@tauri-apps/api/core";
import type {
  HttpErrorResult,
  HttpResponseResult,
  ResolvedRequestPayload,
} from "../types/http";
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
    return await invoke<HttpResponseResult>("send_request", {
      requestId,
      payload,
    });
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

export const listCollections = (): Promise<Collection[]> =>
  invoke<Collection[]>("list_collections");
export const createCollection = (name: string): Promise<Collection> =>
  invoke<Collection>("create_collection", { name });

export async function renameCollection(
  id: string,
  name: string,
): Promise<void> {
  await invoke("rename_collection", { id, name });
}

export async function deleteCollection(id: string): Promise<void> {
  await invoke("delete_collection", { id });
}

export async function reorderCollections(orderedIds: string[]): Promise<void> {
  await invoke("reorder_collections", { orderedIds });
}

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

export const listRequests = (collectionId: string): Promise<SavedRequest[]> =>
  invoke<SavedRequest[]>("list_requests", { collectionId });
export const createRequest = (
  input: SavedRequestInput,
): Promise<SavedRequest> => invoke<SavedRequest>("create_request", { input });
export const updateRequest = (
  id: string,
  input: SavedRequestInput,
): Promise<SavedRequest> =>
  invoke<SavedRequest>("update_request", { id, input });
export const duplicateRequest = (id: string): Promise<SavedRequest> =>
  invoke<SavedRequest>("duplicate_request", { id });

export async function deleteRequest(id: string): Promise<void> {
  await invoke("delete_request", { id });
}

export async function reorderRequests(
  collectionId: string,
  orderedIds: string[],
): Promise<void> {
  await invoke("reorder_requests", { collectionId, orderedIds });
}

// --- Environments ------------------------------------------------------------

export const listEnvironments = (): Promise<Environment[]> =>
  invoke<Environment[]>("list_environments");
export const createEnvironment = (name: string): Promise<Environment> =>
  invoke<Environment>("create_environment", { name });
export const updateEnvironment = (
  id: string,
  name: string,
): Promise<Environment> =>
  invoke<Environment>("update_environment", { id, name });

export async function deleteEnvironment(id: string): Promise<void> {
  await invoke("delete_environment", { id });
}

export async function setActiveEnvironment(id: string): Promise<void> {
  await invoke("set_active_environment", { id });
}

export async function clearActiveEnvironment(): Promise<void> {
  await invoke("clear_active_environment");
}

export const setEnvironmentVariables = (
  environmentId: string,
  variables: EnvironmentVariable[],
): Promise<Environment> =>
  invoke<Environment>("set_environment_variables", {
    environmentId,
    variables,
  });

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

export const appendHistory = (
  entry: HistoryEntryInput,
): Promise<HistoryEntry> => invoke<HistoryEntry>("append_history", { entry });
export const listHistory = (
  limit: number,
  offset: number,
): Promise<HistoryEntry[]> =>
  invoke<HistoryEntry[]>("list_history", { limit, offset });

export async function clearHistory(): Promise<void> {
  await invoke("clear_history");
}

// --- Tabs ------------------------------------------------------------------------

export const loadOpenTabs = (): Promise<StoredTab[]> =>
  invoke<StoredTab[]>("load_open_tabs");

export async function saveOpenTabs(tabs: StoredTab[]): Promise<void> {
  await invoke("save_open_tabs", { tabs });
}
