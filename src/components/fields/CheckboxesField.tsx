import type { Field } from "../../lib/formTypes";

export function CheckboxesField({
  field,
  value,
  onChange,
  error,
}: {
  field: Extract<Field, { type: "checkboxes" }>;
  value: string[];
  onChange: (v: string[]) => void;
  error?: string;
}) {
  const v = value ?? [];
  const errorId = error ? `${field.id}-error` : undefined;
  const helpId = field.help ? `${field.id}-help` : undefined;

  function toggle(opt: (typeof field.options)[number]) {
    const exclusiveValues = field.options.filter((o) => o.exclusive).map((o) => o.value);
    const isSelected = v.includes(opt.value);
    if (isSelected) {
      onChange(v.filter((x) => x !== opt.value));
      return;
    }
    if (opt.exclusive) {
      onChange([opt.value]);
      return;
    }
    const next = v.filter((x) => !exclusiveValues.includes(x));
    onChange([...next, opt.value]);
  }

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
              type="checkbox"
              name={field.id}
              value={o.value}
              checked={v.includes(o.value)}
              onChange={() => toggle(o)}
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
