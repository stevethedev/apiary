import type {
  AuthConfig,
  BodyConfig,
  HttpErrorKind,
  HttpMethod,
  KeyValueRow,
} from "./http";

/**
 * Full standalone snapshot of a request as it was actually sent, plus response
 * metadata. Deliberately NOT a pointer to a saved Request row: ad-hoc/unsaved
 * requests still show up here, and editing a saved request later never
 * rewrites what history shows for a past run.
 */
export interface HistoryEntry {
  readonly id: string;
  readonly method: HttpMethod;
  readonly url: string;
  readonly params: readonly KeyValueRow[];
  readonly headers: readonly KeyValueRow[];
  readonly auth: AuthConfig;
  readonly body: BodyConfig;
  readonly statusCode: number | null;
  readonly durationMs: number | null;
  readonly responseSizeBytes: number | null;
  readonly responseHeaders: readonly (readonly [string, string])[] | null;
  readonly errorKind: HttpErrorKind | null;
  readonly executedAt: string;
}
