import { buildQueryString } from "../../lib/formatting";
import { resolveVariables } from "../../lib/variableSyntax";
import type { RequestDraft, ResolvedRequestPayload } from "../../types/http";
import { buildEffectiveBody, buildEffectiveHeaders } from "./requestBuilder";

export interface DraftResolutionResult {
  payload: ResolvedRequestPayload | null;
  /** Distinct {{variable}} names referenced but not found in `variables`. */
  missing: string[];
}

/**
 * Walks every field of a request draft (url, params, headers, body, auth)
 * substituting {{variable}} references against the active environment.
 * If anything is missing, `payload` is null and the caller must block
 * Send and show `missing` inline — a request is never sent with a literal
 * unresolved "{{...}}" in it.
 */
export function resolveDraft(
  draft: RequestDraft,
  variables: Record<string, string>,
): DraftResolutionResult {
  const missing = new Set<string>();

  function resolve(text: string): string {
    const { resolved, missing: unresolvedNames } = resolveVariables(text, variables);
    unresolvedNames.forEach((name) => missing.add(name));
    return resolved;
  }

  const baseUrl = resolve(draft.url);
  const resolvedParams = draft.params
    .filter((row) => row.enabled && row.key.length > 0)
    .map((row) => ({ ...row, key: resolve(row.key), value: resolve(row.value) }));
  const url = buildQueryString(baseUrl, resolvedParams);

  const effectiveHeaders = buildEffectiveHeaders(draft.headers, draft.body);
  const headers: [string, string][] = effectiveHeaders.map(([key, value]) => [
    resolve(key),
    resolve(value),
  ]);

  const rawBody = buildEffectiveBody(draft.body);
  const body = rawBody === null ? null : resolve(rawBody);

  const auth = resolveAuth(draft.auth, resolve);

  if (missing.size > 0) {
    return { payload: null, missing: [...missing] };
  }

  return {
    payload: { method: draft.method, url, headers, body, auth },
    missing: [],
  };
}

function resolveAuth(
  auth: RequestDraft["auth"],
  resolve: (text: string) => string,
): ResolvedRequestPayload["auth"] {
  switch (auth.type) {
    case "none":
      return { type: "none" };
    case "bearer":
      return { type: "bearer", token: resolve(auth.token) };
    case "basic":
      return {
        type: "basic",
        username: resolve(auth.username),
        password: resolve(auth.password),
      };
    case "apiKey":
      return {
        type: "apiKey",
        key: resolve(auth.key),
        value: resolve(auth.value),
        placement: auth.placement,
      };
  }
}
