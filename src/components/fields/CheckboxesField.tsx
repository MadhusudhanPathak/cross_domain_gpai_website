import type { FieldOf, Option } from "../../formEngine/types";
import { FieldsetField, invalidAttr } from "./FieldShell";
import { OptionLabel } from "./OptionLabel";

type Props = {
  field: FieldOf<"checkboxes">;
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
};

/** Toggles `option` in `selected`; an exclusive option (e.g. "None of these") clears the others and vice versa. */
function toggleOption(options: Option[], selected: string[], option: Option): string[] {
  if (selected.includes(option.value)) return selected.filter((x) => x !== option.value);
  if (option.exclusive) return [option.value];
  const exclusive = new Set(options.filter((o) => o.exclusive).map((o) => o.value));
  return [...selected.filter((x) => !exclusive.has(x)), option.value];
}

export function CheckboxesField({ field, value, onChange, error }: Props) {
  return (
    <FieldsetField id={field.id} label={field.label} help={field.help} error={error} required={field.required}>
      <div className="option-list">
        {field.options.map((o) => (
          <label className="option" key={o.value}>
            <input
              type="checkbox"
              name={field.id}
              value={o.value}
              checked={value.includes(o.value)}
              onChange={() => onChange(toggleOption(field.options, value, o))}
              aria-invalid={invalidAttr(error)}
            />
            <OptionLabel option={o} />
          </label>
        ))}
      </div>
    </FieldsetField>
  );
}
