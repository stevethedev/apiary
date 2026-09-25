import type { AuthConfig, BodyConfig, KeyValueRow } from "../../types/http";

function contentTypeDefaultFor(body: BodyConfig): string | null {
  if (body.type === "json") return "application/json";
  if (body.type === "form") return "application/x-www-form-urlencoded";
  return null;
}

/** Headers actually going over the wire: enabled rows, plus the JSON/form
 * Content-Type default when the user hasn't set their own. */
export function buildEffectiveHeaders(
  headers: KeyValueRow[],
  body: BodyConfig,
): [string, string][] {
  const active: [string, string][] = headers
    .filter((row) => row.enabled && row.key.length > 0)
    .map((row) => [row.key, row.value]);

  const hasContentType = active.some(([key]) => key.toLowerCase() === "content-type");
  const contentTypeDefault = contentTypeDefaultFor(body);
  if (!hasContentType && contentTypeDefault) {
    active.unshift(["Content-Type", contentTypeDefault]);
  }
  return active;
}

export interface GeneratedHeader {
  key: string;
  value: string;
}

/** Best-effort base64 of "username:password" for the Basic-auth preview.
 * `btoa` throws on non-Latin1 input (e.g. a stray unresolved {{var}} isn't
 * an issue, but literal unicode in the password would be) — fall back to a
 * placeholder rather than crash the tab on every keystroke. */
function previewBasicAuthValue(username: string, password: string): string {
  try {
    return btoa(`${username}:${password}`);
  } catch {
    return "<base64>";
  }
}

/** Headers Apiary adds automatically that the user didn't type themselves
 * — the JSON/form Content-Type default, and whatever the Auth tab implies
 * (Authorization, or a header-placed API key). Shown read-only in the
 * Headers tab so "what will actually be sent" is never a surprise. An
 * explicit user row for the same header name always wins and suppresses
 * the generated one, matching what actually happens at send time. */
export function computeGeneratedHeaders(
  headers: KeyValueRow[],
  body: BodyConfig,
  auth: AuthConfig,
): GeneratedHeader[] {
  const enabledKeys = new Set(
    headers.filter((row) => row.enabled && row.key.length > 0).map((row) => row.key.toLowerCase()),
  );
  const generated: GeneratedHeader[] = [];

  const contentTypeDefault = contentTypeDefaultFor(body);
  if (!enabledKeys.has("content-type") && contentTypeDefault) {
    generated.push({ key: "Content-Type", value: contentTypeDefault });
  }

  if (!enabledKeys.has("authorization")) {
    if (auth.type === "bearer") {
      generated.push({ key: "Authorization", value: `Bearer ${auth.token}` });
    } else if (auth.type === "basic") {
      generated.push({
        key: "Authorization",
        value: `Basic ${previewBasicAuthValue(auth.username, auth.password)}`,
      });
    }
  }

  if (auth.type === "apiKey" && auth.placement === "header" && !enabledKeys.has(auth.key.toLowerCase())) {
    generated.push({ key: auth.key || "(key)", value: auth.value });
  }

  return generated;
}

export function buildEffectiveBody(body: BodyConfig): string | null {
  switch (body.type) {
    case "none":
      return null;
    case "json":
    case "raw":
      return body.content;
    case "form":
      return body.rows
        .filter((row) => row.enabled && row.key.length > 0)
        .map((row) => `${encodeURIComponent(row.key)}=${encodeURIComponent(row.value)}`)
        .join("&");
  }
}
