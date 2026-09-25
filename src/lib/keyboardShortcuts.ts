export type ShortcutAction =
  "send" | "save" | "newTab" | "focusUrl" | "focusSearch" | "closeTab";

interface MinimalKeyboardEvent {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
}

/** Cmd on macOS, Ctrl elsewhere/anywhere — accepts either so it works
 * regardless of platform. */
function isModifierPressed(event: MinimalKeyboardEvent): boolean {
  return event.metaKey || event.ctrlKey;
}

/** Pure mapping from a keydown event to the action it represents, or null
 * if it isn't one of Apiary's shortcuts. Kept separate from the DOM
 * listener so it's unit-testable without simulating real events. */
export function matchShortcut(
  event: MinimalKeyboardEvent,
): ShortcutAction | null {
  if (!isModifierPressed(event)) return null;

  switch (event.key.toLowerCase()) {
    case "enter":
      return "send";
    case "s":
      return "save";
    case "t":
      return "newTab";
    case "l":
      return "focusUrl";
    case "k":
      return "focusSearch";
    case "w":
      return "closeTab";
    default:
      return null;
  }
}
