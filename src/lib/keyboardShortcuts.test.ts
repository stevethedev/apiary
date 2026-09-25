import { describe, expect, it } from "vitest";
import { matchShortcut } from "./keyboardShortcuts";

function event(key: string, mod: "meta" | "ctrl" | "none" = "meta") {
  return {
    key,
    metaKey: mod === "meta",
    ctrlKey: mod === "ctrl",
  };
}

describe("matchShortcut", () => {
  it("maps Cmd+Enter to send", () => {
    expect(matchShortcut(event("Enter"))).toBe("send");
  });

  it("maps Cmd+S to save", () => {
    expect(matchShortcut(event("s"))).toBe("save");
  });

  it("maps Cmd+T to newTab", () => {
    expect(matchShortcut(event("t"))).toBe("newTab");
  });

  it("maps Cmd+L to focusUrl", () => {
    expect(matchShortcut(event("l"))).toBe("focusUrl");
  });

  it("maps Cmd+K to focusSearch", () => {
    expect(matchShortcut(event("k"))).toBe("focusSearch");
  });

  it("maps Cmd+W to closeTab", () => {
    expect(matchShortcut(event("w"))).toBe("closeTab");
  });

  it("also accepts Ctrl as the modifier", () => {
    expect(matchShortcut(event("s", "ctrl"))).toBe("save");
  });

  it("returns null without a modifier key", () => {
    expect(matchShortcut(event("s", "none"))).toBeNull();
  });

  it("returns null for keys with no mapped shortcut", () => {
    expect(matchShortcut(event("q"))).toBeNull();
  });
});
