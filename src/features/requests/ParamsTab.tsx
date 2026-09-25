import type { JSX } from "react";
import { KeyValueEditor } from "../../components/KeyValueEditor";
import type { KeyValueRow } from "../../types/http";

interface ParamsTabProps {
  params: readonly KeyValueRow[];
  onChange: (params: readonly KeyValueRow[]) => void;
}

export function ParamsTab({ params, onChange }: ParamsTabProps): JSX.Element {
  return (
    <div className="p-3">
      <KeyValueEditor
        rows={params}
        onChange={onChange}
        keyPlaceholder="KEY"
        valuePlaceholder="VALUE"
      />
    </div>
  );
}
