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
  readonly id: string;
  readonly key: string;
  readonly value: string;
  readonly enabled: boolean;
}

export type AuthConfig =
  | { readonly type: "none" }
  | { readonly type: "bearer"; readonly token: string }
  | {
      readonly type: "basic";
      readonly username: string;
      readonly password: string;
    }
  | {
      readonly type: "apiKey";
      readonly key: string;
      readonly value: string;
      readonly placement: "header" | "query";
    };

export type BodyConfig =
  | { readonly type: "none" }
  | { readonly type: "json"; readonly content: string }
  | { readonly type: "raw"; readonly content: string }
  | { readonly type: "form"; readonly rows: readonly KeyValueRow[] };

export interface RequestDraft {
  readonly method: HttpMethod;
  readonly url: string;
  readonly params: readonly KeyValueRow[];
  readonly headers: readonly KeyValueRow[];
  readonly auth: AuthConfig;
  readonly body: BodyConfig;
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
  readonly kind: HttpErrorKind;
  readonly message: string;
}

export interface HttpResponseResult {
  readonly statusCode: number;
  readonly statusText: string;
  readonly headers: readonly (readonly [string, string])[];
  readonly body: string;
  readonly bodySizeBytes: number;
  readonly durationMs: number;
}

/** Mirrors the Rust `AuthPayload` enum — auth config with every variable
 * reference already resolved to a concrete string. */
export type ResolvedAuthPayload =
  | { readonly type: "none" }
  | { readonly type: "bearer"; readonly token: string }
  | {
      readonly type: "basic";
      readonly username: string;
      readonly password: string;
    }
  | {
      readonly type: "apiKey";
      readonly key: string;
      readonly value: string;
      readonly placement: "header" | "query";
    };

/** Mirrors the Rust `HttpRequestPayload` struct passed to `send_request`. */
export interface ResolvedRequestPayload {
  readonly method: HttpMethod;
  readonly url: string;
  readonly headers: readonly (readonly [string, string])[];
  readonly body: string | null;
  readonly auth: ResolvedAuthPayload;
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
