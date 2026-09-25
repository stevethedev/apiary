import { describe, expect, it } from "vitest";
import { findVariableRefs, resolveVariables } from "./variableSyntax";

describe("findVariableRefs", () => {
  it("finds all variable references in a string", () => {
    expect(findVariableRefs("{{base_url}}/users/{{user_id}}")).toEqual([
      "base_url",
      "user_id",
    ]);
  });

  it("returns an empty array when there are none", () => {
    expect(findVariableRefs("https://api.example.com/users")).toEqual([]);
  });
});

describe("resolveVariables", () => {
  it("resolves all known variables", () => {
    const { resolved, missing } = resolveVariables(
      "{{base_url}}/users/{{user_id}}",
      {
        base_url: "https://api.dev.example.com",
        user_id: "42",
      },
    );
    expect(resolved).toBe("https://api.dev.example.com/users/42");
    expect(missing).toEqual([]);
  });

  it("reports missing variables and leaves them unresolved", () => {
    const { resolved, missing } = resolveVariables(
      "{{base_url}}/users/{{user_id}}",
      {
        base_url: "https://api.dev.example.com",
      },
    );
    expect(missing).toEqual(["user_id"]);
    expect(resolved).toBe("https://api.dev.example.com/users/{{user_id}}");
  });
});
