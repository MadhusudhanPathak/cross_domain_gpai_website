import type { ReactNode } from "react";

/** ARIA attributes that link an input to its help text and error message. */
export type InputAria = {
  "aria-describedby"?: string;
  "aria-invalid"?: "true";
};

export function describedBy(...ids: (string | undefined)[]): string | undefined {
  return ids.filter(Boolean).join(" ") || undefined;
}

export function helpIdFor(id: string, help?: string): string | undefined {
  return help ? `${id}-help` : undefined;
}

export function errorIdFor(id: string, error?: string): string | undefined {
  return error ? `${id}-error` : undefined;
}

export function invalidAttr(error?: string): "true" | undefined {
  return error ? "true" : undefined;
}

export function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p className="field__error" id={errorIdFor(id, error)} role="alert">
      {error}
    </p>
  );
}

function FieldHelp({ id, help }: { id: string; help?: string }) {
  if (!help) return null;
  return (
    <p className="field__help" id={helpIdFor(id, help)}>
      {help}
    </p>
  );
}

type ShellProps = {
  id: string;
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
};

/** Label, help and error around a single native input. `children` receives the ARIA props for that input. */
export function LabelledField({
  id,
  label,
  help,
  error,
  required,
  children,
}: ShellProps & { children: (aria: InputAria) => ReactNode }) {
  const aria: InputAria = {
    "aria-describedby": describedBy(helpIdFor(id, help), errorIdFor(id, error)),
    "aria-invalid": invalidAttr(error),
  };
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </label>
      <FieldHelp id={id} help={help} />
      {children(aria)}
      <FieldError id={id} error={error} />
    </div>
  );
}

/** Fieldset with legend, help and error for grouped inputs (radios, checkboxes, grids). */
export function FieldsetField({ id, label, help, error, required, children }: ShellProps & { children: ReactNode }) {
  return (
    <fieldset className="field" id={id} aria-describedby={describedBy(helpIdFor(id, help), errorIdFor(id, error))}>
      <legend>
        {label}
        {required ? " *" : ""}
      </legend>
      <FieldHelp id={id} help={help} />
      {children}
      <FieldError id={id} error={error} />
    </fieldset>
  );
}
