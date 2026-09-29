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

export type AvailabilitySlot = { value: string; label: string; description?: string };

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
  | (FieldBase & { type: "checkboxes"; options: Option[] })
  | (FieldBase & { type: "checkbox" })
  | (FieldBase & { type: "matrix"; rows: MatrixRow[]; columns: Option[] })
  | (FieldBase & {
      type: "availability";
      /** Inclusive ISO date range, `YYYY-MM-DD`. */
      dates: { from: string; to: string };
      slots: AvailabilitySlot[];
    })
  | (FieldBase & { type: "consents"; options: Option[] })
  | (FieldBase & { type: "info"; text?: string; component?: string });

export type FieldType = Field["type"];

/** Narrows `Field` to a single variant by its `type`. */
export type FieldOf<T extends FieldType> = Extract<Field, { type: T }>;

export type Section = {
  id: string;
  title: string;
  description?: string;
  showIf?: Condition;
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
  access: "open" | "panel";
  sections: Section[];
};

export type FormData = Record<string, unknown>;
export type FieldErrors = Record<string, string>;
