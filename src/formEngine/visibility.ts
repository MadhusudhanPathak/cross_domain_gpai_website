import type { Condition, Field, FieldErrors, FormData, FormDef, Section } from "./types";

/** Evaluates a `showIf` condition; an absent condition is always visible. */
export function isVisible(cond: Condition | undefined, data: FormData): boolean {
  if (!cond) return true;
  const value = data[cond.field];
  if ("equals" in cond) return value === cond.equals;
  if ("notEquals" in cond) return value !== cond.notEquals;
  if ("includes" in cond) return Array.isArray(value) && value.includes(cond.includes);
  return true;
}

export function visibleSections(form: FormDef, data: FormData): Section[] {
  return form.sections.filter((s) => isVisible(s.showIf, data));
}

/** Visible input fields of a section (`info` blocks excluded). */
export function visibleFields(section: Section, data: FormData): Field[] {
  return section.fields.filter((f) => f.type !== "info" && isVisible(f.showIf, data));
}

/** Keeps only values of visible input fields, so the payload matches what the server validates. */
export function stripHidden(form: FormDef, data: FormData): FormData {
  const out: FormData = {};
  for (const section of visibleSections(form, data)) {
    for (const field of visibleFields(section, data)) {
      out[field.id] = data[field.id];
    }
  }
  return out;
}

/** Index of the first section with an error in one of its visible fields, or -1. */
export function firstSectionWithError(sections: Section[], data: FormData, errors: FieldErrors): number {
  return sections.findIndex((s) => visibleFields(s, data).some((f) => errors[f.id]));
}
