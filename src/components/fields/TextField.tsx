import { FieldWrapper } from "./FieldWrapper";
import type { Field } from "../../lib/formTypes";

export function TextField({
  field,
  value,
  onChange,
  error,
}: {
  field: Extract<Field, { type: "text" | "email" | "url" }>;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <FieldWrapper id={field.id} label={field.label} help={field.help} error={error} required={field.required}>
      <input
        id={field.id}
        name={field.id}
        type={field.type}
        value={value ?? ""}
        maxLength={field.maxLength}
        required={field.required}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldWrapper>
  );
}
