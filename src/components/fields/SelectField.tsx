import { FieldWrapper } from "./FieldWrapper";
import type { Field } from "../../lib/formTypes";

export function SelectField({
  field,
  value,
  onChange,
  error,
}: {
  field: Extract<Field, { type: "select" }>;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <FieldWrapper id={field.id} label={field.label} help={field.help} error={error} required={field.required}>
      <select id={field.id} name={field.id} value={value ?? ""} required={field.required} onChange={(e) => onChange(e.target.value)}>
        <option value="" disabled>
          Choose an option
        </option>
        {field.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}
