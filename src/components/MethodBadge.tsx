import type { HttpMethod } from "../types/http";

const METHOD_COLOR: Record<HttpMethod, string> = {
  GET: "text-method-get",
  POST: "text-method-post",
  PUT: "text-method-put",
  PATCH: "text-method-patch",
  DELETE: "text-method-delete",
  HEAD: "text-method-head",
  OPTIONS: "text-method-options",
};

export function MethodBadge({ method }: { method: HttpMethod }) {
  return (
    <span className={`font-mono text-xs font-semibold ${METHOD_COLOR[method]}`}>
      {method}
    </span>
  );
}
