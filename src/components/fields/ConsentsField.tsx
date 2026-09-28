import type { Field } from "../../lib/formTypes";

export function ConsentsField({
  field,
  value,
  onChange,
  error,
}: {
  field: Extract<Field, { type: "consents" }>;
  value: Record<string, boolean>;
  onChange: (v: Record<string, boolean>) => void;
  error?: string;
}) {
  const v = value ?? {};
  const errorId = error ? `${field.id}-error` : undefined;

  return (
    <fieldset className="field" id={field.id} aria-describedby={errorId}>
      <legend>{field.label}</legend>
      {field.options.map((o) => (
        <label className="consent-item" key={o.value}>
          <input
            type="checkbox"
            checked={!!v[o.value]}
            onChange={(e) => onChange({ ...v, [o.value]: e.target.checked })}
            aria-invalid={error ? "true" : undefined}
            required
          />
          <span>{o.label}</span>
        </label>
      ))}
      {error && (
        <p className="field__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
