import { forwardRef } from "react";
import type { Field, FieldErrors } from "../lib/formTypes";

export const ErrorSummary = forwardRef<HTMLDivElement, { errors: FieldErrors; fields: Field[] }>(function ErrorSummary(
  { errors, fields },
  ref
) {
  const entries = Object.entries(errors);
  if (entries.length === 0) return null;
  const labelFor = (id: string) => fields.find((f) => f.id === id)?.label ?? id;

  return (
    <div className="error-summary" role="alert" tabIndex={-1} ref={ref}>
      <h2>There is a problem</h2>
      <ul>
        {entries.map(([id, msg]) => (
          <li key={id}>
            <a href={`#${id}`}>
              {labelFor(id)}: {msg}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
});
