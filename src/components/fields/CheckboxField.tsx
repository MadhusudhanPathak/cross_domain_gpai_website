import type { Field } from "../../lib/formTypes";

export function CheckboxField({
  field,
  value,
  onChange,
  error,
}: {
  field: Extract<Field, { type: "checkbox" }>;
  value: boolean;
  onChange: (v: boolean) => void;
  error?: string;
}) {
  const errorId = error ? `${field.id}-error` : undefined;
  const helpId = field.help ? `${field.id}-help` : undefined;
  return (
    <div className="field">
      <label className="option">
        <input
          type="checkbox"
          id={field.id}
          name={field.id}
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          aria-describedby={[helpId, errorId].filter(Boolean).join(" ") || undefined}
          aria-invalid={error ? "true" : undefined}
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
      {error && (
        <p className="field__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
