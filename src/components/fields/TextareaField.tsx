import { FieldWrapper } from "./FieldWrapper";
import type { Field } from "../../lib/formTypes";

export function TextareaField({
  field,
  value,
  onChange,
  error,
}: {
  field: Extract<Field, { type: "textarea" }>;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const v = value ?? "";
  return (
    <FieldWrapper id={field.id} label={field.label} help={field.help} error={error} required={field.required}>
      <textarea
        id={field.id}
        name={field.id}
        value={v}
        maxLength={field.maxLength}
        required={field.required}
        onChange={(e) => onChange(e.target.value)}
      />
      {field.maxLength && (
        <div className="char-count">
          {v.length} / {field.maxLength}
        </div>
      )}
    </FieldWrapper>
  );
}
