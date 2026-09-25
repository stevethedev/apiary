import type { AuthConfig, BodyConfig, HttpErrorKind, HttpMethod, KeyValueRow } from "./http";

/**
 * Full standalone snapshot of a request as it was actually sent, plus response
 * metadata. Deliberately NOT a pointer to a saved Request row: ad-hoc/unsaved
 * requests still show up here, and editing a saved request later never
 * rewrites what history shows for a past run.
 */
export interface HistoryEntry {
  id: string;
  method: HttpMethod;
  url: string;
  params: KeyValueRow[];
  headers: KeyValueRow[];
  auth: AuthConfig;
  body: BodyConfig;
  statusCode: number | null;
  durationMs: number | null;
  responseSizeBytes: number | null;
  responseHeaders: [string, string][] | null;
  errorKind: HttpErrorKind | null;
  executedAt: string;
}
