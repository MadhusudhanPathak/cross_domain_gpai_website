import type { FieldOf } from "../../formEngine/types";
import { FieldError, describedBy, errorIdFor, helpIdFor, invalidAttr } from "./FieldShell";

type Props = {
  field: FieldOf<"checkbox">;
  value: boolean;
  onChange: (value: boolean) => void;
  error?: string;
};

/** A single yes/no checkbox whose label and help sit inside the clickable option card. */
export function CheckboxField({ field, value, onChange, error }: Props) {
  const helpId = helpIdFor(field.id, field.help);
  return (
    <div className="field">
      <label className="option">
        <input
          type="checkbox"
          id={field.id}
          name={field.id}
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          aria-describedby={describedBy(helpId, errorIdFor(field.id, error))}
          aria-invalid={invalidAttr(error)}
        />
        <span className="option__body">
          <span>{field.label}</span>
          {field.help && (
            <span className="option__desc" id={helpId}>
              {field.help}
            </span>
          )}
        </span>
      </label>
      <FieldError id={field.id} error={error} />
    </div>
  );
}
