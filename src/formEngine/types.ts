/** Schema for JSON form definitions in `src/forms/`. Mirrored by the Apps Script backend via `Forms.gs`. */

/** Shows a field or section only when another field's value matches. */
export type Condition =
  | { field: string; equals: string }
  | { field: string; notEquals: string }
  | { field: string; includes: string };

export type Option = {
  value: string;
  label: string;
  description?: string;
  /** For checkboxes: selecting this option clears all others. */
  exclusive?: boolean;
};

export type MatrixRow = { id: string; label: string };

export type RankingItem = { id: string; label: string };

export type AvailabilitySlot = { value: string; label: string; description?: string };

/** One category in an `allocation` field. `value` is the storage key; `code` is the short symbol shown to people. */
export type AllocationCode = { value: string; code: string; label: string; description: string };

/**
 * Stored shape of an `estimate` field (four-step elicitation). Numbers are kept as the strings typed,
 * so partial input survives drafts; validation parses them. `ooc` = "Outside my competence".
 */
export type EstimateValue = {
  lowest: string;
  highest: string;
  best: string;
  confidence: string;
  rationale: string;
  ooc: boolean;
};

/** Stored shape of an `allocation` field: points per code (as typed), plus the same confidence, rationale and `ooc` as an estimate. */
export type AllocationValue = {
  points: Record<string, string>;
  confidence: string;
  rationale: string;
  ooc: boolean;
};

export type FieldBase = {
  id: string;
  label: string;
  help?: string;
  required?: boolean;
  showIf?: Condition;
  maxLength?: number;
  minItems?: number;
  /** Initial value. The token `@browserTimeZone` resolves to the visitor's IANA time zone. */
  default?: string;
};

export type Field =
  | (FieldBase & { type: "text" | "email" | "url" })
  | (FieldBase & { type: "textarea" })
  | (FieldBase & { type: "select"; options: Option[] })
  | (FieldBase & { type: "radio"; options: Option[] })
  | (FieldBase & { type: "checkboxes"; options: Option[]; /** Options whose value equals this other field's current value are hidden and stripped from the answer. */ excludeField?: string })
  | (FieldBase & { type: "checkbox" })
  | (FieldBase & { type: "matrix"; rows: MatrixRow[]; columns: Option[] })
  | (FieldBase & { type: "ranking"; items: RankingItem[] })
  | (FieldBase & {
      type: "availability";
      /** Inclusive ISO date range, `YYYY-MM-DD`. */
      dates: { from: string; to: string };
      slots: AvailabilitySlot[];
      /** Minimum total slots required across the whole range (not per day). Defaults to 1 when required. */
      minSlots?: number;
    })
  | (FieldBase & { type: "consents"; options: Option[] })
  | (FieldBase & {
      type: "estimate";
      /** Markdown shown above the question, e.g. the evidence and the claim. */
      stem?: string;
      question: string;
    })
  | (FieldBase & {
      type: "allocation";
      stem?: string;
      question: string;
      /** Points are allocated across these codes and must total exactly 100. */
      codes: AllocationCode[];
    })
  | (FieldBase & { type: "info"; text?: string; component?: string; variant?: "callout" });

export type FieldType = Field["type"];

/** Narrows `Field` to a single variant by its `type`. */
export type FieldOf<T extends FieldType> = Extract<Field, { type: T }>;

export type Section = {
  id: string;
  title: string;
  description?: string;
  showIf?: Condition;
  /** Id of a field in this section. The fields after it stay disabled until it is answered validly. */
  gateField?: string;
  fields: Field[];
};

export type FormDef = {
  id: string;
  version: string;
  title: string;
  intro?: string;
  estimatedMinutes?: number;
  submitLabel: string;
  /** Name of the Google Sheet tab that stores submissions. */
  sheet: string;
  /** "panel": only people whose email appears in the expression of interest may submit or save drafts (checked by the server). */
  access: "open" | "panel";
  /** When true, shows a bar of all steps. People can jump back freely, and forward only to steps whose earlier steps are all complete. */
  stepNav?: boolean;
  /** Markdown shown on the confirmation page instead of the default "we will be in touch" line. */
  doneMessage?: string;
  /** Field ids reworded since an earlier `version`. A draft saved under another version is restored without their answers. */
  resetOnUpgrade?: string[];
  sections: Section[];
};

export type FormData = Record<string, unknown>;
export type FieldErrors = Record<string, string>;
