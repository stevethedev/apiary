const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;

export function findVariableRefs(text: string): string[] {
  const refs: string[] = [];
  for (const match of text.matchAll(VARIABLE_PATTERN)) {
    refs.push(match[1]);
  }
  return refs;
}

/**
 * Resolves every {{var}} in `text` against `variables`. Names not found in
 * `variables` are reported in `missing` and left unresolved in `resolved` —
 * callers must check `missing` and refuse to send rather than use `resolved`
 * as-is when it's non-empty.
 */
export function resolveVariables(
  text: string,
  variables: Record<string, string>,
): { resolved: string; missing: string[] } {
  const missing: string[] = [];
  const resolved = text.replace(VARIABLE_PATTERN, (whole, name: string) => {
    if (Object.prototype.hasOwnProperty.call(variables, name)) {
      return variables[name];
    }
    missing.push(name);
    return whole;
  });
  return { resolved, missing };
}
