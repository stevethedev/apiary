import { useState } from "react";
import { UrlBar } from "./UrlBar";
import { ParamsTab } from "./ParamsTab";
import { HeadersTab } from "./HeadersTab";
import { AuthTab } from "./AuthTab";
import { BodyTab } from "./BodyTab";
import type { Tab } from "../../types/tab";
import type { RequestDraft } from "../../types/http";

const TABS = ["Params", "Headers", "Auth", "Body"] as const;
type EditorTab = (typeof TABS)[number];

interface RequestEditorProps {
  tab: Tab;
  onUpdateDraft: (patch: Partial<RequestDraft>) => void;
  onSend: () => void;
  onSave: () => void;
}

export function RequestEditor({ tab, onUpdateDraft, onSend, onSave }: RequestEditorProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>("Params");
  const { draft } = tab;

  return (
    <div className="flex h-full flex-col">
      <UrlBar
        draft={draft}
        onChange={onUpdateDraft}
        onSend={onSend}
        onSave={onSave}
        sendDisabled={draft.url.length === 0 || tab.response.status === "sending"}
      />
      <div className="flex border-b border-surface-3 text-sm">
        {TABS.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => setActiveTab(label)}
            className={`px-4 py-2 ${
              activeTab === label
                ? "border-b-2 border-accent text-text-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {activeTab === "Params" && (
          <ParamsTab params={draft.params} onChange={(params) => onUpdateDraft({ params })} />
        )}
        {activeTab === "Headers" && (
          <HeadersTab
            headers={draft.headers}
            body={draft.body}
            auth={draft.auth}
            onChange={(headers) => onUpdateDraft({ headers })}
          />
        )}
        {activeTab === "Auth" && (
          <AuthTab auth={draft.auth} onChange={(auth) => onUpdateDraft({ auth })} />
        )}
        {activeTab === "Body" && (
          <BodyTab body={draft.body} onChange={(body) => onUpdateDraft({ body })} />
        )}
      </div>
    </div>
  );
}
