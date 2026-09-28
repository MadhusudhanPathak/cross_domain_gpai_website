import React from "react";

export function FieldWrapper({
  id,
  label,
  help,
  error,
  required,
  children,
  as = "label",
}: {
  id: string;
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  as?: "label" | "div";
}) {
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const LabelTag: any = as === "label" ? "label" : "div";
  return (
    <div className="field">
      <LabelTag className="field__label" htmlFor={as === "label" ? id : undefined}>
        {label}
        {required ? " *" : ""}
      </LabelTag>
      {help && (
        <p className="field__help" id={helpId}>
          {help}
        </p>
      )}
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<any>, {
            "aria-describedby": [helpId, errorId].filter(Boolean).join(" ") || undefined,
            "aria-invalid": error ? "true" : undefined,
          })
        : children}
      {error && (
        <p className="field__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
