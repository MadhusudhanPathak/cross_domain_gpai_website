import type { Field } from "../../lib/formTypes";

export function RadioField({
  field,
  value,
  onChange,
  error,
}: {
  field: Extract<Field, { type: "radio" }>;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const errorId = error ? `${field.id}-error` : undefined;
  const helpId = field.help ? `${field.id}-help` : undefined;
  return (
    <fieldset className="field" id={field.id} aria-describedby={[helpId, errorId].filter(Boolean).join(" ") || undefined}>
      <legend>
        {field.label}
        {field.required ? " *" : ""}
      </legend>
      {field.help && (
        <p className="field__help" id={helpId}>
          {field.help}
        </p>
      )}
      <div className="option-list">
        {field.options.map((o) => (
          <label className="option" key={o.value}>
            <input
              type="radio"
              name={field.id}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              aria-invalid={error ? "true" : undefined}
            />
            <span className="option__body">
              <span>{o.label}</span>
              {o.description && <span className="option__desc">{o.description}</span>}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p className="field__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
