import type { FieldOf } from "../../formEngine/types";
import { LabelledField } from "./FieldShell";

type Props = {
  field: FieldOf<"select">;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export function SelectField({ field, value, onChange, error }: Props) {
  return (
    <LabelledField id={field.id} label={field.label} help={field.help} error={error} required={field.required}>
      {(aria) => (
        <select
          id={field.id}
          name={field.id}
          value={value}
          required={field.required}
          onChange={(e) => onChange(e.target.value)}
          {...aria}
        >
          <option value="" disabled>
            Choose an option
          </option>
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </LabelledField>
  );
}
