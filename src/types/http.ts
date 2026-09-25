export const HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
] as const;

export type HttpMethod = (typeof HTTP_METHODS)[number];

export interface KeyValueRow {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export type AuthConfig =
  | { type: "none" }
  | { type: "bearer"; token: string }
  | { type: "basic"; username: string; password: string }
  | {
      type: "apiKey";
      key: string;
      value: string;
      placement: "header" | "query";
    };

export type BodyConfig =
  | { type: "none" }
  | { type: "json"; content: string }
  | { type: "raw"; content: string }
  | { type: "form"; rows: KeyValueRow[] };

export interface RequestDraft {
  method: HttpMethod;
  url: string;
  params: KeyValueRow[];
  headers: KeyValueRow[];
  auth: AuthConfig;
  body: BodyConfig;
}

export type HttpErrorKind =
  | "network"
  | "dns"
  | "timeout"
  | "invalidUrl"
  | "tls"
  | "cancelled"
  | "invalidResponse";

export interface HttpErrorResult {
  kind: HttpErrorKind;
  message: string;
}

export interface HttpResponseResult {
  statusCode: number;
  statusText: string;
  headers: [string, string][];
  body: string;
  bodySizeBytes: number;
  durationMs: number;
}

/** Mirrors the Rust `AuthPayload` enum — auth config with every variable
 * reference already resolved to a concrete string. */
export type ResolvedAuthPayload =
  | { type: "none" }
  | { type: "bearer"; token: string }
  | { type: "basic"; username: string; password: string }
  | { type: "apiKey"; key: string; value: string; placement: "header" | "query" };

/** Mirrors the Rust `HttpRequestPayload` struct passed to `send_request`. */
export interface ResolvedRequestPayload {
  method: HttpMethod;
  url: string;
  headers: [string, string][];
  body: string | null;
  auth: ResolvedAuthPayload;
}

export function createEmptyDraft(): RequestDraft {
  return {
    method: "GET",
    url: "",
    params: [],
    headers: [],
    auth: { type: "none" },
    body: { type: "none" },
  };
}

export function createEmptyRow(): KeyValueRow {
  return { id: crypto.randomUUID(), key: "", value: "", enabled: true };
}
