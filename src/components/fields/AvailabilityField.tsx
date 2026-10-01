import type { FieldOf } from "../../formEngine/types";
import { datesBetween, formatDateLabel, isWeekend } from "../../utils/dates";
import { FieldsetField, invalidAttr } from "./FieldShell";

/** Selected slot values keyed by ISO date. */
type Availability = Record<string, string[]>;

type Props = {
  field: FieldOf<"availability">;
  value: Availability;
  onChange: (value: Availability) => void;
  error?: string;
  city?: string;
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Above this many slots per day, per-slot "select all" buttons would be too cluttered to be useful. */
const MAX_BULK_SLOT_BUTTONS = 6;

/** Day-by-day grid of time-slot chips with bulk "select all" and "all day" shortcuts. */
export function AvailabilityField({ field, value, onChange, error, city }: Props) {
  const dates = datesBetween(field.dates.from, field.dates.to);
  const allSlots = field.slots.map((s) => s.value);
  const slotsOn = (date: string) => value[date] ?? [];

  function toggleSlot(date: string, slot: string) {
    const current = slotsOn(date);
    const next = current.includes(slot) ? current.filter((s) => s !== slot) : [...current, slot];
    onChange({ ...value, [date]: next });
  }

  function toggleAllDay(date: string) {
    const allSelected = allSlots.every((s) => slotsOn(date).includes(s));
    onChange({ ...value, [date]: allSelected ? [] : allSlots });
  }

  function selectAllOf(slot: string) {
    const next: Availability = { ...value };
    for (const d of dates) {
      const current = next[d] ?? [];
      if (!current.includes(slot)) next[d] = [...current, slot];
    }
    onChange(next);
  }

  const selections = Object.values(value);
  const totalSlots = selections.reduce((sum, slots) => sum + slots.length, 0);
  const daysWithSelection = selections.filter((slots) => slots.length > 0).length;

  return (
    <FieldsetField id={field.id} label={field.label} help={field.help} error={error} required={field.required}>
      <p className="avail-tz">Times are shown in your local time{city ? ` (${city})` : ""}.</p>

      <div className="avail-controls">
        {field.slots.length <= MAX_BULK_SLOT_BUTTONS &&
          field.slots.map((s) => (
            <button type="button" className="button button--secondary" key={s.value} onClick={() => selectAllOf(s.value)}>
              Select all {s.label.toLowerCase()}s
            </button>
          ))}
        <button type="button" className="button button--secondary" onClick={() => onChange({})}>
          Clear all
        </button>
      </div>

      <div role="group" aria-label={field.label}>
        {dates.map((d) => {
          const current = slotsOn(d);
          const allSelected = allSlots.length > 0 && allSlots.every((s) => current.includes(s));
          return (
            <div className={isWeekend(d) ? "avail-row avail-row--weekend" : "avail-row"} key={d}>
              <div className="avail-row__date">{formatDateLabel(d)}</div>
              <div className="avail-row__chips">
                {field.slots.map((s) => {
                  const id = `${field.id}-${d}-${s.value}`;
                  return (
                    <span className="chip" key={s.value}>
                      <input
                        type="checkbox"
                        id={id}
                        checked={current.includes(s.value)}
                        onChange={() => toggleSlot(d, s.value)}
                        aria-invalid={invalidAttr(error)}
                      />
                      <label className="chip__label" htmlFor={id}>
                        <span>{s.label}</span>
                        {s.description && <span className="chip__sub">{s.description}</span>}
                      </label>
                    </span>
                  );
                })}
              </div>
              <label className="avail-row__all">
                <input type="checkbox" checked={allSelected} onChange={() => toggleAllDay(d)} />
                All day
              </label>
            </div>
          );
        })}
      </div>

      <div className="avail-counter" aria-live="polite">
        {plural(totalSlots, "slot")} selected across {plural(daysWithSelection, "day")}.
      </div>
    </FieldsetField>
  );
}
