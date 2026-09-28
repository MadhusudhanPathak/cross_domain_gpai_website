import interest from "./interest.json";
import type { FormDef } from "../lib/formTypes";

export const forms: Record<string, FormDef> = {
  interest: interest as unknown as FormDef,
};

export function getForm(id: string): FormDef | undefined {
  return forms[id];
}
