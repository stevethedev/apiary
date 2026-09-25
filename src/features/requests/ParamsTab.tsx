import { KeyValueEditor } from "../../components/KeyValueEditor";
import type { KeyValueRow } from "../../types/http";

interface ParamsTabProps {
  params: KeyValueRow[];
  onChange: (params: KeyValueRow[]) => void;
}

export function ParamsTab({ params, onChange }: ParamsTabProps) {
  return (
    <div className="p-3">
      <KeyValueEditor rows={params} onChange={onChange} keyPlaceholder="KEY" valuePlaceholder="VALUE" />
    </div>
  );
}
