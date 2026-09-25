import { describe, expect, it } from "vitest";
import { buildQueryString, formatBytes, formatDuration, parseQueryString } from "./formatting";

describe("parseQueryString", () => {
  it("splits a url with no query string", () => {
    expect(parseQueryString("https://api.example.com/users")).toEqual({
      base: "https://api.example.com/users",
      params: [],
    });
  });

  it("parses query params from a url", () => {
    const { base, params } = parseQueryString(
      "https://api.example.com/users?page=1&limit=20",
    );
    expect(base).toBe("https://api.example.com/users");
    expect(params.map((p) => [p.key, p.value])).toEqual([
      ["page", "1"],
      ["limit", "20"],
    ]);
  });
});

describe("buildQueryString", () => {
  it("returns the base url when there are no enabled params", () => {
    expect(buildQueryString("https://api.example.com/users", [])).toBe(
      "https://api.example.com/users",
    );
  });

  it("appends enabled params and skips disabled/empty-key ones", () => {
    const result = buildQueryString("https://api.example.com/users", [
      { id: "1", key: "page", value: "1", enabled: true },
      { id: "2", key: "limit", value: "20", enabled: false },
      { id: "3", key: "", value: "ignored", enabled: true },
    ]);
    expect(result).toBe("https://api.example.com/users?page=1");
  });

  it("round-trips through parseQueryString", () => {
    const original = "https://api.example.com/users?page=1&status=active";
    const { base, params } = parseQueryString(original);
    expect(buildQueryString(base, params)).toBe(original);
  });
});

describe("formatBytes", () => {
  it("formats bytes, kilobytes, and megabytes", () => {
    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});

describe("formatDuration", () => {
  it("formats sub-second and multi-second durations", () => {
    expect(formatDuration(143)).toBe("143ms");
    expect(formatDuration(2400)).toBe("2.40s");
  });
});
