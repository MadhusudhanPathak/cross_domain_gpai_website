import { datesBetween } from "../utils/dates";
import { isRecord } from "../utils/guards";
import type { Field, FieldErrors, FormData, FormDef, Section } from "./types";
import { visibleFields, visibleSections, isVisible } from "./visibility";

/** Client-side validation. Keep in sync with `validateFieldServer_` in `apps-script/Code.gs`. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\//;
const MAX_EMAIL_LENGTH = 254;
const DEFAULT_TEXT_MAX = 2000;
const DEFAULT_TEXTAREA_MAX = 5000;

function trimCap(value: unknown, cap: number): string {
  return String(value ?? "").trim().slice(0, cap);
}

function objectValue<T>(value: unknown): Record<string, T> {
  return (isRecord(value) ? value : {}) as Record<string, T>;
}

/** Returns the error message for one field, or undefined when valid. */
export function validateField(field: Field, data: FormData): string | undefined {
  const value = data[field.id];
  const required = field.required;

  switch (field.type) {
    case "text":
    case "email":
    case "url": {
      const s = trimCap(value, field.maxLength ?? DEFAULT_TEXT_MAX);
      if (!s) return required ? `Enter ${field.label.toLowerCase()}.` : undefined;
      if (field.type === "email" && (s.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(s))) return "Enter a valid email address.";
      if (field.type === "url" && !URL_RE.test(s)) return "Enter a web address starting with http:// or https://.";
      return undefined;
    }
    case "textarea": {
      const s = trimCap(value, field.maxLength ?? DEFAULT_TEXTAREA_MAX);
      return required && !s ? `Enter ${field.label.toLowerCase()}.` : undefined;
    }
    case "select":
    case "radio": {
      const s = String(value ?? "");
      if (!s) return required ? `Choose an option for "${field.label}".` : undefined;
      return field.options.some((o) => o.value === s) ? undefined : "Choose a valid option.";
    }
    case "checkboxes": {
      const selected: unknown[] = Array.isArray(value) ? value : [];
      const min = field.minItems ?? (required ? 1 : 0);
      if (selected.length < min) return `Select at least ${min === 1 ? "one option" : `${min} options`}.`;
      const allowed = new Set<unknown>(field.options.map((o) => o.value));
      if (!selected.every((x) => allowed.has(x))) return "Contains an invalid option.";
      if (field.excludeField && selected.includes(data[field.excludeField])) return "Contains an option already chosen elsewhere.";
      return undefined;
    }
    case "checkbox":
      return required && value !== true ? `You must check "${field.label}".` : undefined;
    case "matrix": {
      const answers = objectValue<unknown>(value);
      const allowed = new Set<unknown>(field.columns.map((c) => c.value));
      for (const row of field.rows) {
        const answer = answers[row.id];
        if (required && !answer) return `Answer every row for "${field.label}".`;
        if (answer && !allowed.has(answer)) return "Contains an invalid answer.";
      }
      return undefined;
    }
    case "ranking": {
      const order: unknown[] = Array.isArray(value) ? value : [];
      if (!required && order.length === 0) return undefined;
      const ids = field.items.map((i) => i.id);
      const isPermutation = order.length === ids.length && ids.every((id) => order.includes(id)) && new Set(order).size === ids.length;
      return isPermutation ? undefined : `Rank every item for "${field.label}".`;
    }
    case "availability": {
      const byDate = objectValue<unknown>(value);
      const validDates = new Set(datesBetween(field.dates.from, field.dates.to));
      const validSlots = new Set<unknown>(field.slots.map((s) => s.value));
      let total = 0;
      for (const [date, slots] of Object.entries(byDate)) {
        if (!validDates.has(date)) return "Contains an invalid date.";
        if (!Array.isArray(slots)) continue;
        if (slots.some((s) => !validSlots.has(s))) return "Contains an invalid time slot.";
        total += slots.length;
      }
      const min = field.minSlots ?? (required ? 1 : 0);
      return total < min ? `Select at least ${min === 1 ? "one time slot" : `${min} time slots`}.` : undefined;
    }
    case "consents": {
      const agreed = objectValue<unknown>(value);
      return field.options.every((o) => agreed[o.value]) ? undefined : "You must agree to every item to continue.";
    }
    case "info":
      return undefined;
  }
}

export function validateSection(section: Section, data: FormData): FieldErrors {
  const errors: FieldErrors = {};
  if (!isVisible(section.showIf, data)) return errors;
  for (const field of visibleFields(section, data)) {
    const error = validateField(field, data);
    if (error) errors[field.id] = error;
  }
  return errors;
}

export function validateForm(form: FormDef, data: FormData): FieldErrors {
  const errors: FieldErrors = {};
  for (const section of visibleSections(form, data)) {
    Object.assign(errors, validateSection(section, data));
  }
  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
