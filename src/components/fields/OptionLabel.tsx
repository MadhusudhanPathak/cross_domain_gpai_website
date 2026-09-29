import type { Option } from "../../formEngine/types";

/** Label text plus optional description, shown beside a radio or checkbox. */
export function OptionLabel({ option }: { option: Pick<Option, "label" | "description"> }) {
  return (
    <span className="option__body">
      <span>{option.label}</span>
      {option.description && <span className="option__desc">{option.description}</span>}
    </span>
  );
}
