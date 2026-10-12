import type { FormData, FormDef } from "./types";

/** Key under which a server draft records the form version it was saved under. Never part of the answers. */
export const DRAFT_VERSION_KEY = "__formVersion";

export type UpgradedDraft = { data: FormData; cleared: number };

/**
 * Prepares answers saved under another version of the form (or under an unknown one) for the current version.
 * Answers to the fields in `form.resetOnUpgrade`, whose wording changed, are dropped so they are answered again
 * under the current wording; `cleared` counts them. Drafts saved under the current version pass through unchanged.
 */
export function upgradeDraft(form: FormDef, data: FormData, savedVersion: string | undefined): UpgradedDraft {
  if (savedVersion === form.version) return { data, cleared: 0 };
  const reset = new Set(form.resetOnUpgrade ?? []);
  const kept: FormData = {};
  let cleared = 0;
  for (const [key, value] of Object.entries(data)) {
    if (reset.has(key)) cleared++;
    else kept[key] = value;
  }
  return { data: kept, cleared };
}

/** Splits a server draft into its answers and the form version it was saved under, if it recorded one. */
export function splitServerDraft(draft: FormData): { data: FormData; version: string | undefined } {
  const { [DRAFT_VERSION_KEY]: version, ...data } = draft;
  return { data, version: typeof version === "string" ? version : undefined };
}
