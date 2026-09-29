import type { FieldOf } from "../../formEngine/types";
import { LabelledField } from "./FieldShell";

type Props = {
  field: FieldOf<"text" | "email" | "url">;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export function TextField({ field, value, onChange, error }: Props) {
  return (
    <LabelledField id={field.id} label={field.label} help={field.help} error={error} required={field.required}>
      {(aria) => (
        <input
          id={field.id}
          name={field.id}
          type={field.type}
          value={value}
          maxLength={field.maxLength}
          required={field.required}
          onChange={(e) => onChange(e.target.value)}
          {...aria}
        />
      )}
    </LabelledField>
  );
}
