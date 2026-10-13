import { RATIONALE_MAX_CHARS, RATIONALE_MAX_WORDS, RATIONALE_SOFT_WORDS, wordCount } from "../../formEngine/items";
import { linkableTerms, referencePath } from "../../content/delphi";
import { MarkdownLite } from "../MarkdownLite";
import { describedBy, invalidAttr } from "./FieldShell";

/** Building blocks shared by the elicitation item widgets (`EstimateField`, `AllocationField`). */

export const questionIdFor = (id: string) => `${id}-question`;

/** Item heading, stem (evidence/claim) and question. The question gets an id so the fieldset can reference it. */
export function ItemText({ id, title, stem, question }: { id: string; title: string; stem?: string; question: string }) {
  return (
    <>
      <legend className="item__title">
        <span className="item__id">{id}</span> {title}
      </legend>
      {stem && (
        <div className="item__stem">
          <MarkdownLite text={stem} terms={linkableTerms} referenceHref={referencePath} />
        </div>
      )}
      <div className="item__question" id={questionIdFor(id)}>
        <MarkdownLite text={question} terms={linkableTerms} referenceHref={referencePath} />
      </div>
    </>
  );
}

type CountInputProps = {
  id: string;
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
  suffix?: string;
};

/** Whole-number text input. Typing is never blocked; the parent validates on blur and on submit. */
export function CountInput({ id, label, hint, value, onChange, onBlur, disabled, error, suffix }: CountInputProps) {
  const hintId = `${id}-hint`;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="count-input">
      <label className="count-input__label" htmlFor={id}>
        {label}
      </label>
      <div className="count-input__box">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-describedby={describedBy(hintId, errorId)}
          aria-invalid={invalidAttr(error)}
        />
        {suffix && <span aria-hidden="true">{suffix}</span>}
      </div>
      <span className="count-input__hint" id={hintId}>
        {hint}
      </span>
      {error && (
        <p className="field__error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}

/** 0–100 bar with the plausible range shaded and the best estimate marked. Decorative: the numbers are in the inputs. */
export function RangeBar({ lowest, highest, best }: { lowest: number; highest: number; best: number }) {
  return (
    <div className="rangebar" aria-hidden="true">
      <div className="rangebar__track">
        <div className="rangebar__interval" style={{ left: `${lowest}%`, width: `${highest - lowest}%` }} />
        <div className="rangebar__best" style={{ left: `${best}%` }} />
      </div>
      <div className="rangebar__scale">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
    </div>
  );
}

export function OutOfCompetence({ id, checked, onChange }: { id: string; checked: boolean; onChange: (checked: boolean) => void }) {
  const inputId = `${id}-ooc`;
  return (
    <div className="item__ooc">
      <input id={inputId} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <label htmlFor={inputId}>Outside my competence</label>
    </div>
  );
}

/** Optional rationale with a live word count: a warning above the soft limit, an error above the hard limit. */
export function RationaleBox({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  const inputId = `${id}-rationale`;
  const helpId = `${inputId}-help`;
  const countId = `${inputId}-count`;
  const words = wordCount(value);
  const over = words > RATIONALE_MAX_WORDS;
  const warn = !over && words > RATIONALE_SOFT_WORDS;
  return (
    <div className="item__rationale">
      <label className="field__label" htmlFor={inputId}>
        Rationale (optional)
      </label>
      <p className="field__help" id={helpId}>
        Up to {RATIONALE_SOFT_WORDS} words. Shared anonymously with other participants in Round 2, so please leave out
        anything that identifies you.
      </p>
      <textarea
        id={inputId}
        rows={3}
        value={value}
        maxLength={RATIONALE_MAX_CHARS}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={describedBy(helpId, countId)}
        aria-invalid={invalidAttr(over ? "over" : undefined)}
      />
      <div className={`char-count${over ? " char-count--error" : warn ? " char-count--warn" : ""}`} id={countId}>
        {words} / {RATIONALE_SOFT_WORDS} words
        {/* Only the warnings are announced, not every change in the count. */}
        <span role="status">
          {warn && ` (over ${RATIONALE_SOFT_WORDS}; the limit is ${RATIONALE_MAX_WORDS})`}
          {over && ` (please shorten to ${RATIONALE_MAX_WORDS} or fewer)`}
        </span>
      </div>
    </div>
  );
}
