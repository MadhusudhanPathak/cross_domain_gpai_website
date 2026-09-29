import type { FormData } from "../formEngine/types";
import { isRecord } from "../utils/guards";

/** Browser storage for drafts, resume codes and the confirmation page. All calls fail silently (private mode, quota, disabled storage). */

export type LocalDraft = { data: FormData; savedAt: string };

export type DoneInfo = { submissionId: string; copySent: boolean; email?: string; commitment?: string };

const draftKey = (formId: string, version: string) => `gpai:draft:${formId}:${version}`;
const resumeCodeKey = (formId: string) => `gpai:resumecode:${formId}`;
const doneKey = (formId: string) => `gpai:done:${formId}`;

function read(storage: () => Storage, key: string): string | null {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}

function write(storage: () => Storage, key: string, value: string): void {
  try {
    storage().setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

function remove(storage: () => Storage, key: string): void {
  try {
    storage().removeItem(key);
  } catch {
    /* storage unavailable */
  }
}

function readJson(storage: () => Storage, key: string): unknown {
  const raw = read(storage, key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const local = () => localStorage;
const session = () => sessionStorage;

export function loadLocalDraft(formId: string, version: string): LocalDraft | null {
  const parsed = readJson(local, draftKey(formId, version));
  if (!isRecord(parsed) || !isRecord(parsed.data)) return null;
  return { data: parsed.data, savedAt: String(parsed.savedAt ?? "") };
}

export function saveLocalDraft(formId: string, version: string, data: FormData): void {
  const draft: LocalDraft = { data, savedAt: new Date().toISOString() };
  write(local, draftKey(formId, version), JSON.stringify(draft));
}

export function clearLocalDraft(formId: string, version: string): void {
  remove(local, draftKey(formId, version));
}

export function getResumeCode(formId: string): string | null {
  return read(local, resumeCodeKey(formId));
}

export function setResumeCode(formId: string, code: string): void {
  write(local, resumeCodeKey(formId), code);
}

export function saveDoneInfo(formId: string, info: DoneInfo): void {
  write(session, doneKey(formId), JSON.stringify(info));
}

export function loadDoneInfo(formId: string): DoneInfo | null {
  const parsed = readJson(session, doneKey(formId));
  if (!isRecord(parsed) || typeof parsed.submissionId !== "string") return null;
  return {
    submissionId: parsed.submissionId,
    copySent: parsed.copySent === true,
    email: typeof parsed.email === "string" ? parsed.email : undefined,
    commitment: typeof parsed.commitment === "string" ? parsed.commitment : undefined,
  };
}
