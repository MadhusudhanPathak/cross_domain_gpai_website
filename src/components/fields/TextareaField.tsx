import type { FieldOf } from "../../formEngine/types";
import { LabelledField } from "./FieldShell";

type Props = {
  field: FieldOf<"textarea">;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export function TextareaField({ field, value, onChange, error }: Props) {
  return (
    <LabelledField id={field.id} label={field.label} help={field.help} error={error} required={field.required}>
      {(aria) => (
        <>
          <textarea
            id={field.id}
            name={field.id}
            value={value}
            maxLength={field.maxLength}
            required={field.required}
            onChange={(e) => onChange(e.target.value)}
            {...aria}
          />
          {field.maxLength && (
            <div className="char-count">
              {value.length} / {field.maxLength}
            </div>
          )}
        </>
      )}
    </LabelledField>
  );
}
