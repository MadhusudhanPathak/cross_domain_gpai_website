import type { FieldOf } from "../../formEngine/types";
import { FieldsetField } from "./FieldShell";

type Props = {
  field: FieldOf<"ranking">;
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
};

/** Ordered list of items with up/down buttons, from most (top) to least (bottom). Accessible alternative to drag-and-drop. */
export function RankingField({ field, value, onChange, error }: Props) {
  const order = value.length === field.items.length ? value : field.items.map((i) => i.id);
  const labelFor = (id: string) => field.items.find((i) => i.id === id)?.label ?? id;

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <FieldsetField id={field.id} label={field.label} help={field.help} error={error} required={field.required}>
      <ol className="ranking-list">
        {order.map((id, i) => (
          <li className="ranking-item" key={id}>
            <span className="ranking-item__rank" aria-hidden="true">
              {i + 1}
            </span>
            <span className="ranking-item__label">{labelFor(id)}</span>
            <span className="ranking-item__buttons">
              <button
                type="button"
                className="button button--secondary"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label={`Move ${labelFor(id)} up`}
              >
                Up
              </button>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => move(i, 1)}
                disabled={i === order.length - 1}
                aria-label={`Move ${labelFor(id)} down`}
              >
                Down
              </button>
            </span>
          </li>
        ))}
      </ol>
    </FieldsetField>
  );
}
