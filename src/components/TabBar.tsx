import type { JSX } from "react";
import { MethodBadge } from "./MethodBadge";
import { useTabsStore } from "../features/requests/tabsStore";

export function TabBar(): JSX.Element {
  const tabs = useTabsStore((s) => s.tabs);
  const activeTabId = useTabsStore((s) => s.activeTabId);
  const setActiveTab = useTabsStore((s) => s.setActiveTab);
  const closeTab = useTabsStore((s) => s.closeTab);
  const openNewTab = useTabsStore((s) => s.openNewTab);

  return (
    <div className="flex h-9 items-stretch border-b border-surface-3 bg-surface-1">
      <div className="flex flex-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
              }}
              className={`group flex min-w-[140px] max-w-[220px] cursor-pointer items-center gap-2 border-r border-surface-3 px-3 text-sm ${
                isActive
                  ? "bg-surface-2 text-text-primary"
                  : "text-text-secondary hover:bg-surface-2/60"
              }`}
            >
              <MethodBadge method={tab.draft.method} />
              <span className="flex-1 truncate">
                {tab.name}
                {tab.dirty ? " •" : ""}
              </span>
              <button
                type="button"
                aria-label="Close tab"
                className="text-text-muted opacity-0 group-hover:opacity-100 hover:text-text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        aria-label="New tab"
        title="New tab (Cmd+T)"
        className="w-9 text-text-secondary hover:bg-surface-2 hover:text-text-primary"
        onClick={() => openNewTab()}
      >
        +
      </button>
    </div>
  );
}
