import { describe, expect, it } from "vitest";
import { computeGeneratedHeaders } from "./requestBuilder";

describe("computeGeneratedHeaders", () => {
  it("shows the JSON content-type default", () => {
    const generated = computeGeneratedHeaders(
      [],
      { type: "json", content: "{}" },
      { type: "none" },
    );
    expect(generated).toEqual([
      { key: "Content-Type", value: "application/json" },
    ]);
  });

  it("shows the Bearer authorization header", () => {
    const generated = computeGeneratedHeaders(
      [],
      { type: "none" },
      {
        type: "bearer",
        token: "{{token}}",
      },
    );
    expect(generated).toEqual([
      { key: "Authorization", value: "Bearer {{token}}" },
    ]);
  });

  it("shows a base64-encoded Basic authorization header", () => {
    const generated = computeGeneratedHeaders(
      [],
      { type: "none" },
      {
        type: "basic",
        username: "alice",
        password: "secret",
      },
    );
    expect(generated).toEqual([
      { key: "Authorization", value: `Basic ${btoa("alice:secret")}` },
    ]);
  });

  it("shows a header-placed API key under its own name", () => {
    const generated = computeGeneratedHeaders(
      [],
      { type: "none" },
      {
        type: "apiKey",
        key: "X-API-Key",
        value: "{{apiKey}}",
        placement: "header",
      },
    );
    expect(generated).toEqual([{ key: "X-API-Key", value: "{{apiKey}}" }]);
  });

  it("omits a query-placed API key — it isn't a header", () => {
    const generated = computeGeneratedHeaders(
      [],
      { type: "none" },
      {
        type: "apiKey",
        key: "api_key",
        value: "abc123",
        placement: "query",
      },
    );
    expect(generated).toEqual([]);
  });

  it("suppresses a generated header the user has overridden explicitly", () => {
    const generated = computeGeneratedHeaders(
      [
        {
          id: "1",
          key: "Content-Type",
          value: "application/vnd.api+json",
          enabled: true,
        },
      ],
      { type: "json", content: "{}" },
      { type: "bearer", token: "abc" },
    );
    expect(generated).toEqual([{ key: "Authorization", value: "Bearer abc" }]);
  });

  it("shows both content-type and auth headers together", () => {
    const generated = computeGeneratedHeaders(
      [],
      { type: "json", content: "{}" },
      { type: "bearer", token: "abc" },
    );
    expect(generated).toEqual([
      { key: "Content-Type", value: "application/json" },
      { key: "Authorization", value: "Bearer abc" },
    ]);
  });
});
