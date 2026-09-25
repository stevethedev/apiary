import { createEmptyRow, type KeyValueRow } from "../types/http";

/** Splits a full URL into its base (scheme/host/path) and query rows. */
export function parseQueryString(url: string): {
  base: string;
  params: KeyValueRow[];
} {
  const queryIndex = url.indexOf("?");
  if (queryIndex === -1) {
    return { base: url, params: [] };
  }
  const base = url.slice(0, queryIndex);
  const query = url.slice(queryIndex + 1);
  if (query.length === 0) {
    return { base, params: [] };
  }
  const params = query.split("&").map((pair) => {
    const [key, ...rest] = pair.split("=");
    return {
      id: crypto.randomUUID(),
      key: decodeURIComponent(key),
      value: decodeURIComponent(rest.join("=")),
      enabled: true,
    };
  });
  return { base, params };
}

/** Rebuilds a full URL from a base and query rows, dropping disabled/empty-key rows. */
export function buildQueryString(
  base: string,
  params: readonly KeyValueRow[],
): string {
  const active = params.filter((row) => row.enabled && row.key.length > 0);
  if (active.length === 0) {
    return base;
  }
  const query = active
    .map(
      (row) =>
        `${encodeURIComponent(row.key)}=${encodeURIComponent(row.value)}`,
    )
    .join("&");
  return `${base}?${query}`;
}

/**
 * Merges a newly-edited URL's query string back into the param rows.
 * `buildQueryString` only shows *enabled* rows in the URL bar, so a naive
 * `parseQueryString(value)` on every URL edit would silently drop any
 * disabled row — it was never visible in the string to begin with. This
 * re-parses only the enabled rows from the URL and keeps existing disabled
 * rows untouched (still removable via the Params tab's own delete button).
 */
export function mergeQueryParamsFromUrl(
  currentParams: readonly KeyValueRow[],
  url: string,
): { base: string; params: KeyValueRow[] } {
  const { base, params: parsedEnabledParams } = parseQueryString(url);
  const disabledParams = currentParams.filter((row) => !row.enabled);
  return { base, params: [...parsedEnabledParams, ...disabledParams] };
}

export function ensureTrailingEmptyRow(
  rows: readonly KeyValueRow[],
): readonly KeyValueRow[] {
  const last = rows.at(-1);
  if (!last || last.key.length > 0 || last.value.length > 0) {
    return [...rows, createEmptyRow()];
  }
  return rows;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function tryFormatJson(raw: string): {
  formatted: string;
  isJson: boolean;
} {
  try {
    const parsed: unknown = JSON.parse(raw);
    return { formatted: JSON.stringify(parsed, null, 2), isJson: true };
  } catch {
    return { formatted: raw, isJson: false };
  }
}
