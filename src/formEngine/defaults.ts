import { browserTimeZone } from "../utils/dates";
import type { FormData, FormDef } from "./types";

const BROWSER_TIME_ZONE = "@browserTimeZone";

/** Fills dynamic defaults for fields that have no value yet. Returns a new object. */
export function applyDefaults(form: FormDef, data: FormData): FormData {
  const out: FormData = { ...data };
  for (const section of form.sections) {
    for (const field of section.fields) {
      if (field.type === "info" || out[field.id] !== undefined) continue;
      if (field.default === BROWSER_TIME_ZONE) out[field.id] = browserTimeZone();
    }
  }
  return out;
}
