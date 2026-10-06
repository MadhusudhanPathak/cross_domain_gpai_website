import type { FormDef } from "../formEngine/types";
import interest from "./interest.json";
import round1 from "./round1.json";

/** Registry of every form served at `/forms/<id>`. `<id>.meta.json` files are backend-only and must not be imported here. */
const forms: Record<string, FormDef> = {
  interest: interest as unknown as FormDef,
  round1: round1 as unknown as FormDef,
};

export function getForm(id: string): FormDef | undefined {
  return Object.prototype.hasOwnProperty.call(forms, id) ? forms[id] : undefined;
}
