import type { FieldOf } from "../../formEngine/types";
import { FieldsetField, invalidAttr } from "./FieldShell";
import { OptionLabel } from "./OptionLabel";

type Props = {
  field: FieldOf<"radio">;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export function RadioField({ field, value, onChange, error }: Props) {
  return (
    <FieldsetField id={field.id} label={field.label} help={field.help} error={error} required={field.required}>
      <div className="option-list">
        {field.options.map((o) => (
          <label className="option" key={o.value}>
            <input
              type="radio"
              name={field.id}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              aria-invalid={invalidAttr(error)}
            />
            <OptionLabel option={o} />
          </label>
        ))}
      </div>
    </FieldsetField>
  );
}
