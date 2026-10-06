import { useState } from "react";
import {
  CONFIDENCE_MAX,
  CONFIDENCE_MIN,
  COUNT_MAX,
  COUNT_MIN,
  estimateIssues,
  estimateWarning,
  isBlank,
  parseWhole,
  type EstimatePart,
} from "../../formEngine/items";
import type { EstimateValue, FieldOf } from "../../formEngine/types";
import { FieldError, describedBy, errorIdFor } from "./FieldShell";
import { CountInput, ItemText, OutOfCompetence, RangeBar, RationaleBox, questionIdFor } from "./ItemParts";

type Props = {
  field: FieldOf<"estimate">;
  value: EstimateValue;
  onChange: (value: EstimateValue) => void;
  error?: string;
};

type NumberPart = Exclude<EstimatePart, "rationale">;

/** In IDEA order: the extremes first, to reduce anchoring on the best estimate. */
const PARTS: { part: NumberPart; label: string; hint: string; suffix?: string }[] = [
  { part: "lowest", label: "Lower estimate", hint: `${COUNT_MIN}–${COUNT_MAX}` },
  { part: "highest", label: "Upper estimate", hint: `${COUNT_MIN}–${COUNT_MAX}` },
  { part: "best", label: "Best estimate", hint: "Between your lower and upper estimates" },
  {
    part: "confidence",
    label: "Confidence",
    hint: `${CONFIDENCE_MIN}–${CONFIDENCE_MAX}% that the true count lies between your lower and upper estimates`,
    suffix: "%",
  },
];

/** Four-step elicitation (lower, upper and best estimates, confidence), with "Outside my competence" and an optional rationale. */
export function EstimateField({ field, value, onChange, error }: Props) {
  const [touched, setTouched] = useState<Partial<Record<NumberPart, boolean>>>({});
  const issues = estimateIssues(value);
  const allBlank = PARTS.every(({ part }) => isBlank(value[part]));
  // After a failed Next/submit, show every per-input problem, unless nothing was entered (the summary message covers that).
  const revealAll = !!error && !allBlank;
  const inlineError = (part: NumberPart) => (touched[part] || revealAll ? issues[part] : undefined);
  const shownInline = PARTS.map(({ part }) => inlineError(part));
  const summary = error && !shownInline.includes(error) && error !== issues.rationale ? error : undefined;

  const lo = parseWhole(value.lowest, COUNT_MIN, COUNT_MAX);
  const hi = parseWhole(value.highest, COUNT_MIN, COUNT_MAX);
  const best = parseWhole(value.best, COUNT_MIN, COUNT_MAX);
  const showBar = !value.ooc && lo !== null && hi !== null && best !== null && lo <= best && best <= hi;
  const warning = estimateWarning(value);

  function setOoc(ooc: boolean) {
    onChange(ooc ? { ...value, ooc, lowest: "", highest: "", best: "", confidence: "" } : { ...value, ooc });
    setTouched({});
  }

  return (
    <fieldset
      className="field item"
      id={field.id}
      aria-describedby={describedBy(questionIdFor(field.id), errorIdFor(field.id, summary))}
    >
      <ItemText id={field.id} title={field.label} stem={field.stem} question={field.question} />

      <div className="estimate-grid">
        {PARTS.map(({ part, label, hint, suffix }) => (
          <CountInput
            key={part}
            id={`${field.id}-${part}`}
            label={label}
            hint={hint}
            suffix={suffix}
            value={value[part]}
            disabled={value.ooc}
            error={inlineError(part)}
            onChange={(v) => onChange({ ...value, [part]: v })}
            onBlur={() => setTouched((t) => ({ ...t, [part]: true }))}
          />
        ))}
      </div>

      {showBar && <RangeBar lowest={lo} highest={hi} best={best} />}
      {warning && (
        <p className="item__warning" role="status">
          {warning}
        </p>
      )}

      <OutOfCompetence id={field.id} checked={value.ooc} onChange={setOoc} />
      <RationaleBox id={field.id} value={value.rationale} onChange={(rationale) => onChange({ ...value, rationale })} />
      <FieldError id={field.id} error={summary} />
    </fieldset>
  );
}
