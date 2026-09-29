import { forwardRef } from "react";
import type { Field, FieldErrors } from "../../formEngine/types";

type Props = { errors: FieldErrors; fields: Field[] };

/** Focusable list of the current step's errors, each linking to its field. Renders nothing when there are none. */
export const ErrorSummary = forwardRef<HTMLDivElement, Props>(function ErrorSummary({ errors, fields }, ref) {
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
