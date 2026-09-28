import type { Field } from "../../lib/formTypes";
import { datesBetween, formatDateLabel, isWeekend } from "../../lib/dates";

type AvailValue = Record<string, string[]>;

export function AvailabilityField({
  field,
  value,
  onChange,
  error,
  timezone,
}: {
  field: Extract<Field, { type: "availability" }>;
  value: AvailValue;
  onChange: (v: AvailValue) => void;
  error?: string;
  timezone?: string;
}) {
  const v = value ?? {};
  const dates = datesBetween(field.dates.from, field.dates.to);
  const errorId = error ? `${field.id}-error` : undefined;

  function toggleSlot(date: string, slot: string) {
    const current = v[date] ?? [];
    const next = current.includes(slot) ? current.filter((s) => s !== slot) : [...current, slot];
    onChange({ ...v, [date]: next });
  }

  function toggleAllDay(date: string) {
    const allSlots = field.slots.map((s) => s.value);
    const current = v[date] ?? [];
    const allSelected = allSlots.every((s) => current.includes(s));
    onChange({ ...v, [date]: allSelected ? [] : allSlots });
  }

  function selectAllOf(slot: string) {
    const next: AvailValue = { ...v };
    for (const d of dates) {
      const current = next[d] ?? [];
      if (!current.includes(slot)) next[d] = [...current, slot];
    }
    onChange(next);
  }

  function clearAll() {
    onChange({});
  }

  const totalSlots = Object.values(v).reduce((sum, arr) => sum + (arr?.length ?? 0), 0);
  const daysWithSelection = Object.values(v).filter((arr) => (arr?.length ?? 0) > 0).length;

  return (
    <fieldset className="field" id={field.id} aria-describedby={errorId}>
      <legend>
        {field.label}
        {field.required ? " *" : ""}
      </legend>
      {field.help && <p className="field__help">{field.help}</p>}
      {timezone && <p className="avail-tz">Times are in your time zone: {timezone}</p>}

      <div className="avail-controls">
        {field.slots.map((s) => (
          <button type="button" className="button button--secondary" key={s.value} onClick={() => selectAllOf(s.value)}>
            Select all {s.label.toLowerCase()}s
          </button>
        ))}
        <button type="button" className="button button--secondary" onClick={clearAll}>
          Clear all
        </button>
      </div>

      <div role="group" aria-label={field.label}>
        {dates.map((d) => {
          const weekend = isWeekend(d);
          const current = v[d] ?? [];
          const allSlots = field.slots.map((s) => s.value);
          const allSelected = allSlots.length > 0 && allSlots.every((s) => current.includes(s));
          return (
            <div className={weekend ? "avail-row avail-row--weekend" : "avail-row"} key={d}>
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
                        aria-invalid={error ? "true" : undefined}
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
        {totalSlots} slot{totalSlots === 1 ? "" : "s"} selected across {daysWithSelection} day{daysWithSelection === 1 ? "" : "s"}.
      </div>

      {error && (
        <p className="field__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
