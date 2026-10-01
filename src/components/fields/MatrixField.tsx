import type { FieldOf } from "../../formEngine/types";
import { FieldsetField, invalidAttr } from "./FieldShell";

type Props = {
  field: FieldOf<"matrix">;
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  error?: string;
};

/** Rows × columns radio grid: a table on wide screens, one radio group per row on narrow screens. */
export function MatrixField({ field, value, onChange, error }: Props) {
  const setRow = (rowId: string, col: string) => onChange({ ...value, [rowId]: col });

  return (
    <FieldsetField id={field.id} label={field.label} help={field.help} error={error} required={field.required}>
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
                  <label className="matrix-cell">
                    <input
                      type="radio"
                      name={`${field.id}_${row.id}`}
                      value={col.value}
                      checked={value[row.id] === col.value}
                      onChange={() => setRow(row.id, col.value)}
                      aria-label={`${row.label}: ${col.label}`}
                      aria-invalid={invalidAttr(error)}
                    />
                  </label>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

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
                    checked={value[row.id] === col.value}
                    onChange={() => setRow(row.id, col.value)}
                    aria-invalid={invalidAttr(error)}
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
    </FieldsetField>
  );
}
