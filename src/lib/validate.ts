import type { Condition, Field, FieldErrors, FormData, FormDef, Section } from "./formTypes";
import { datesBetween } from "./dates";

export function isVisible(cond: Condition | undefined, data: FormData): boolean {
  if (!cond) return true;
  const v = data[cond.field];
  if ("equals" in cond) return v === cond.equals;
  if ("notEquals" in cond) return v !== cond.notEquals;
  if ("includes" in cond) return Array.isArray(v) && (v as string[]).includes(cond.includes);
  return true;
}

export function visibleSections(form: FormDef, data: FormData): Section[] {
  return form.sections.filter((s) => isVisible(s.showIf, data));
}

export function visibleFields(section: Section, data: FormData): Field[] {
  return section.fields.filter((f) => isVisible(f.showIf, data) && f.type !== "info");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function trimCap(s: unknown, cap: number): string {
  return String(s ?? "").trim().slice(0, cap);
}

function validateField(field: Field, data: FormData, errors: FieldErrors) {
  const v = data[field.id];
  const required = field.required;

  switch (field.type) {
    case "text":
    case "email":
    case "url": {
      const s = trimCap(v, field.maxLength ?? 2000);
      if (required && !s) { errors[field.id] = `Enter ${field.label.toLowerCase()}.`; return; }
      if (!s) return;
      if (field.type === "email") {
        if (s.length > 254 || !EMAIL_RE.test(s)) errors[field.id] = "Enter a valid email address.";
      }
      if (field.type === "url") {
        if (!/^https?:\/\//.test(s)) errors[field.id] = "Enter a web address starting with http:// or https://.";
      }
      return;
    }
    case "textarea": {
      const s = trimCap(v, field.maxLength ?? 5000);
      if (required && !s) errors[field.id] = `Enter ${field.label.toLowerCase()}.`;
      return;
    }
    case "select":
    case "radio": {
      const s = String(v ?? "");
      if (required && !s) { errors[field.id] = `Choose an option for "${field.label}".`; return; }
      if (s && !field.options.some((o) => o.value === s)) errors[field.id] = "Choose a valid option.";
      return;
    }
    case "checkboxes": {
      const arr = Array.isArray(v) ? (v as string[]) : [];
      const min = field.minItems ?? (required ? 1 : 0);
      if (arr.length < min) { errors[field.id] = `Select at least ${min === 1 ? "one option" : `${min} options`}.`; return; }
      const allowed = new Set(field.options.map((o) => o.value));
      if (arr.some((x) => !allowed.has(x))) errors[field.id] = "Contains an invalid option.";
      return;
    }
    case "checkbox": {
      if (required && v !== true) errors[field.id] = `You must check "${field.label}".`;
      return;
    }
    case "matrix": {
      const obj = (v && typeof v === "object" ? v : {}) as Record<string, string>;
      const allowedCols = new Set(field.columns.map((c) => c.value));
      for (const row of field.rows) {
        const rv = obj[row.id];
        if (required && !rv) { errors[field.id] = `Answer every row for "${field.label}".`; return; }
        if (rv && !allowedCols.has(rv)) { errors[field.id] = "Contains an invalid answer."; return; }
      }
      return;
    }
    case "availability": {
      const obj = (v && typeof v === "object" ? v : {}) as Record<string, string[]>;
      const validDates = new Set(datesBetween(field.dates.from, field.dates.to));
      const validSlots = new Set(field.slots.map((s) => s.value));
      let total = 0;
      for (const [d, slots] of Object.entries(obj)) {
        if (!validDates.has(d)) { errors[field.id] = "Contains an invalid date."; return; }
        if (!Array.isArray(slots)) continue;
        for (const s of slots) {
          if (!validSlots.has(s)) { errors[field.id] = "Contains an invalid time slot."; return; }
        }
        total += slots.length;
      }
      if (required && total < 1) errors[field.id] = "Select at least one time slot.";
      return;
    }
    case "consents": {
      const obj = (v && typeof v === "object" ? v : {}) as Record<string, boolean>;
      for (const opt of field.options) {
        if (!obj[opt.value]) { errors[field.id] = "You must agree to every item to continue."; return; }
      }
      return;
    }
  }
}

export function validateSection(section: Section, data: FormData): FieldErrors {
  const errors: FieldErrors = {};
  if (!isVisible(section.showIf, data)) return errors;
  for (const field of visibleFields(section, data)) {
    validateField(field, data, errors);
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

// Removes values for fields/sections hidden by showIf, so the payload matches what the server expects.
export function stripHidden(form: FormDef, data: FormData): FormData {
  const out: FormData = {};
  for (const section of visibleSections(form, data)) {
    for (const field of section.fields) {
      if (field.type === "info") continue;
      if (!isVisible(field.showIf, data)) continue;
      out[field.id] = data[field.id];
    }
  }
  return out;
}
