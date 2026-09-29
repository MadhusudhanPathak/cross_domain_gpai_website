import type { FormDef } from "../formEngine/types";
import interest from "./interest.json";

/** Registry of every form served at `/forms/<id>`. */
const forms: Record<string, FormDef> = {
  interest: interest as unknown as FormDef,
};

export function getForm(id: string): FormDef | undefined {
  return Object.prototype.hasOwnProperty.call(forms, id) ? forms[id] : undefined;
}
