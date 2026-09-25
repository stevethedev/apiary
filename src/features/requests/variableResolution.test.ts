import { describe, expect, it } from "vitest";
import { createEmptyDraft } from "../../types/http";
import { resolveDraft } from "./variableResolution";

describe("resolveDraft", () => {
  it("resolves variables in the url and params", () => {
    const draft = {
      ...createEmptyDraft(),
      url: "{{base_url}}/users",
      params: [{ id: "1", key: "id", value: "{{user_id}}", enabled: true }],
    };

    const { payload, missing } = resolveDraft(draft, {
      base_url: "https://api.dev.example.com",
      user_id: "42",
    });

    expect(missing).toEqual([]);
    expect(payload?.url).toBe("https://api.dev.example.com/users?id=42");
  });

  it("blocks resolution and reports missing variable names", () => {
    const draft = { ...createEmptyDraft(), url: "{{base_url}}/users" };

    const { payload, missing } = resolveDraft(draft, {});

    expect(payload).toBeNull();
    expect(missing).toEqual(["base_url"]);
  });

  it("auto-adds a JSON content-type header when the body is JSON", () => {
    const draft = {
      ...createEmptyDraft(),
      url: "https://api.example.com/users",
      body: { type: "json" as const, content: '{"name":"a"}' },
    };

    const { payload } = resolveDraft(draft, {});

    expect(payload?.headers).toContainEqual(["Content-Type", "application/json"]);
    expect(payload?.body).toBe('{"name":"a"}');
  });

  it("lets an explicit content-type header override the JSON default", () => {
    const draft = {
      ...createEmptyDraft(),
      url: "https://api.example.com/users",
      body: { type: "json" as const, content: "{}" },
      headers: [
        { id: "1", key: "Content-Type", value: "application/vnd.api+json", enabled: true },
      ],
    };

    const { payload } = resolveDraft(draft, {});

    const contentTypeHeaders = payload?.headers.filter(
      ([key]) => key.toLowerCase() === "content-type",
    );
    expect(contentTypeHeaders).toEqual([["Content-Type", "application/vnd.api+json"]]);
  });

  it("resolves bearer token variables", () => {
    const draft = {
      ...createEmptyDraft(),
      url: "https://api.example.com/me",
      auth: { type: "bearer" as const, token: "{{token}}" },
    };

    const { payload, missing } = resolveDraft(draft, { token: "secret" });

    expect(missing).toEqual([]);
    expect(payload?.auth).toEqual({ type: "bearer", token: "secret" });
  });
});
