import type { FieldOf } from "../../formEngine/types";
import { FieldsetField, invalidAttr } from "./FieldShell";

type Props = {
  field: FieldOf<"consents">;
  value: Record<string, boolean>;
  onChange: (value: Record<string, boolean>) => void;
  error?: string;
};

/** Every item must be ticked, so the legend carries no required marker. */
export function ConsentsField({ field, value, onChange, error }: Props) {
  return (
    <FieldsetField id={field.id} label={field.label} help={field.help} error={error}>
      {field.options.map((o) => (
        <label className="consent-item" key={o.value}>
          <input
            type="checkbox"
            checked={!!value[o.value]}
            onChange={(e) => onChange({ ...value, [o.value]: e.target.checked })}
            aria-invalid={invalidAttr(error)}
            required
          />
          <span>{o.label}</span>
        </label>
      ))}
    </FieldsetField>
  );
}
