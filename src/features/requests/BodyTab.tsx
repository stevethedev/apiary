import type { JSX } from "react";
import Editor from "@monaco-editor/react";
import { KeyValueEditor } from "../../components/KeyValueEditor";
import { useTheme } from "../../components/ThemeProvider";
import { monacoThemeName } from "../../lib/theme";
import { createEmptyRow, type BodyConfig } from "../../types/http";

interface BodyTabProps {
  body: BodyConfig;
  onChange: (body: BodyConfig) => void;
}

const BODY_TYPES: { value: BodyConfig["type"]; label: string }[] = [
  { value: "none", label: "None" },
  { value: "json", label: "JSON" },
  { value: "raw", label: "Raw Text" },
  { value: "form", label: "Form URL-Encoded" },
];

function bodyOfType(type: BodyConfig["type"]): BodyConfig {
  switch (type) {
    case "none":
      return { type: "none" };
    case "json":
      return { type: "json", content: "" };
    case "raw":
      return { type: "raw", content: "" };
    case "form":
      return { type: "form", rows: [createEmptyRow()] };
  }
}

export function BodyTab({ body, onChange }: BodyTabProps): JSX.Element {
  const { effectiveTheme } = useTheme();
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-surface-2 p-2 text-sm">
        {BODY_TYPES.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-1.5 text-text-secondary"
          >
            <input
              type="radio"
              name="body-type"
              checked={body.type === option.value}
              onChange={() => {
                onChange(bodyOfType(option.value));
              }}
            />
            {option.label}
          </label>
        ))}
      </div>

      {body.type === "none" && (
        <p className="p-3 text-sm text-text-muted">This request has no body.</p>
      )}

      {body.type === "json" && (
        <div className="min-h-0 flex-1">
          <Editor
            language="json"
            theme={monacoThemeName(effectiveTheme)}
            value={body.content}
            onChange={(value) => {
              onChange({ type: "json", content: value ?? "" });
            }}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
      )}

      {body.type === "raw" && (
        <textarea
          className="min-h-0 flex-1 resize-none bg-surface-1 p-3 font-mono text-sm text-text-primary outline-none"
          value={body.content}
          onChange={(e) => {
            onChange({ type: "raw", content: e.target.value });
          }}
        />
      )}

      {body.type === "form" && (
        <div className="p-3">
          <KeyValueEditor
            rows={body.rows}
            onChange={(rows) => {
              onChange({ type: "form", rows });
            }}
          />
        </div>
      )}
    </div>
  );
}
