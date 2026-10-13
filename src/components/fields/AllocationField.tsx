import { Fragment, useState } from "react";
import { ALLOCATION_TOTAL, CONFIDENCE_MAX, CONFIDENCE_MIN, allocationIssues, allocationSum } from "../../formEngine/items";
import type { AllocationValue, FieldOf } from "../../formEngine/types";
import { FieldError, describedBy, errorIdFor, invalidAttr } from "./FieldShell";
import { CountInput, ItemText, OutOfCompetence, RationaleBox, questionIdFor } from "./ItemParts";

type Props = {
  field: FieldOf<"allocation">;
  value: AllocationValue;
  onChange: (value: AllocationValue) => void;
  error?: string;
};

/**
 * Constant-sum allocation: whole-number percentages across codes that must total exactly 100%, plus confidence and rationale.
 * (The stored value keeps the key `points` for the per-code numbers.)
 */
export function AllocationField({ field, value, onChange, error }: Props) {
  const [touched, setTouched] = useState({ points: false, confidence: false });
  const issues = allocationIssues(value);
  const sum = allocationSum(value);
  const pointsError = touched.points || error ? issues.points : undefined;
  const confidenceError = touched.confidence || (error && error === issues.confidence) ? issues.confidence : undefined;
  const summary = error && error !== pointsError && error !== confidenceError && error !== issues.rationale ? error : undefined;
  const totalOk = sum === ALLOCATION_TOTAL;
  const totalId = `${field.id}-total`;

  function setOoc(ooc: boolean) {
    const cleared = Object.fromEntries(field.codes.map((c) => [c.value, ""]));
    onChange(ooc ? { ...value, ooc, points: cleared, confidence: "" } : { ...value, ooc });
    setTouched({ points: false, confidence: false });
  }

  return (
    <fieldset
      className="field item"
      id={field.id}
      aria-describedby={describedBy(questionIdFor(field.id), errorIdFor(field.id, summary))}
    >
      <ItemText id={field.id} title={field.label} stem={field.stem} question={field.question} />

      <div className="alloc">
        {field.codes.map((c, i) => {
          const inputId = `${field.id}-${c.value}`;
          const descId = `${inputId}-desc`;
          return (
            <Fragment key={c.value}>
              {i === 0 && <p className="alloc__group-heading">Everything is fine</p>}
              {i === 1 && (
                <>
                  <hr className="alloc__divider" />
                  <p className="alloc__group-heading">The items below need improvement</p>
                </>
              )}
              <div className="alloc__row">
                <div className="alloc__text">
                  <label htmlFor={inputId}>
                    <span className="alloc__code">{c.code}</span> {c.label}
                  </label>
                  <span className="alloc__desc" id={descId}>
                    {c.description}
                  </span>
                </div>
                <div className="count-input__box">
                  <input
                    id={inputId}
                    className="alloc__input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={value.points[c.value] ?? ""}
                    disabled={value.ooc}
                    onChange={(e) => onChange({ ...value, points: { ...value.points, [c.value]: e.target.value } })}
                    onBlur={() => setTouched((t) => ({ ...t, points: true }))}
                    aria-describedby={describedBy(descId, totalId)}
                    aria-invalid={invalidAttr(pointsError)}
                  />
                  <span aria-hidden="true">%</span>
                </div>
              </div>
            </Fragment>
          );
        })}
        <p className={`alloc__total${!value.ooc && !totalOk ? " alloc__total--error" : ""}`} id={totalId} aria-live="polite">
          Total: {sum ?? "–"}%{!value.ooc && !totalOk && ` (must add up to ${ALLOCATION_TOTAL}%)`}
        </p>
        {pointsError && <p className="field__error">{pointsError}</p>}
      </div>

      <div className="estimate-grid">
        <CountInput
          id={`${field.id}-confidence`}
          label="Confidence in this allocation"
          hint={`${CONFIDENCE_MIN}–${CONFIDENCE_MAX}%`}
          suffix="%"
          value={value.confidence}
          disabled={value.ooc}
          error={confidenceError}
          onChange={(confidence) => onChange({ ...value, confidence })}
          onBlur={() => setTouched((t) => ({ ...t, confidence: true }))}
        />
      </div>

      <OutOfCompetence id={field.id} checked={value.ooc} onChange={setOoc} />
      <RationaleBox id={field.id} value={value.rationale} onChange={(rationale) => onChange({ ...value, rationale })} />
      <FieldError id={field.id} error={summary} />
    </fieldset>
  );
}
