export type Condition =
  | { field: string; equals: string }
  | { field: string; notEquals: string }
  | { field: string; includes: string };

export type Option = {
  value: string;
  label: string;
  description?: string;
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
      dates: { from: string; to: string };
      slots: AvailabilitySlot[];
    })
  | (FieldBase & { type: "consents"; options: Option[] })
  | (FieldBase & { type: "info"; text?: string; component?: string });

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
  sheet: string;
  access: "open" | "panel";
  sections: Section[];
};

export type FormData = Record<string, unknown>;
export type FieldErrors = Record<string, string>;
