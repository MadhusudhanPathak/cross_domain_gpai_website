import type { Field } from "../../lib/formTypes";

export function MatrixField({
  field,
  value,
  onChange,
  error,
}: {
  field: Extract<Field, { type: "matrix" }>;
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
  error?: string;
}) {
  const v = value ?? {};
  const errorId = error ? `${field.id}-error` : undefined;

  function setRow(rowId: string, col: string) {
    onChange({ ...v, [rowId]: col });
  }

  return (
    <fieldset className="field" id={field.id} aria-describedby={errorId}>
      <legend>
        {field.label}
        {field.required ? " *" : ""}
      </legend>
      {field.help && <p className="field__help">{field.help}</p>}

      {/* Desktop: table of rows x columns */}
      <table className="matrix-table matrix-desktop">
        <thead>
          <tr>
            <th scope="col"></th>
            {field.columns.map((col) => (
              <th scope="col" key={col.value}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {field.rows.map((row) => (
            <tr key={row.id}>
              <th scope="row">{row.label}</th>
              {field.columns.map((col) => (
                <td key={col.value}>
                  <input
                    type="radio"
                    name={`${field.id}_${row.id}`}
                    value={col.value}
                    checked={v[row.id] === col.value}
                    onChange={() => setRow(row.id, col.value)}
                    aria-label={`${row.label}: ${col.label}`}
                    aria-invalid={error ? "true" : undefined}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile: each row as its own labelled radio group */}
      <div className="matrix-mobile">
        {field.rows.map((row) => (
          <fieldset className="matrix-row-mobile" key={row.id}>
            <legend>{row.label}</legend>
            <div className="option-list">
              {field.columns.map((col) => (
                <label className="option" key={col.value}>
                  <input
                    type="radio"
                    name={`${field.id}_${row.id}`}
                    value={col.value}
                    checked={v[row.id] === col.value}
                    onChange={() => setRow(row.id, col.value)}
                    aria-invalid={error ? "true" : undefined}
                  />
                  <span className="option__body">
                    <span>{col.label}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      {error && (
        <p className="field__error" id={errorId} role="alert">
          {error}
        </p>
      )}

      <style>{`
        .matrix-desktop { display: none; }
        @media (min-width: 720px) {
          .matrix-desktop { display: table; }
          .matrix-mobile { display: none; }
        }
      `}</style>
    </fieldset>
  );
}
