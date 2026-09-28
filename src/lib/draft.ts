import type { FormData } from "./formTypes";

function key(formId: string, version: string): string {
  return `gpai:draft:${formId}:${version}`;
}

export function loadLocalDraft(formId: string, version: string): { data: FormData; savedAt: string } | null {
  try {
    const raw = localStorage.getItem(key(formId, version));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveLocalDraft(formId: string, version: string, data: FormData) {
  try {
    localStorage.setItem(key(formId, version), JSON.stringify({ data, savedAt: new Date().toISOString() }));
  } catch {
    // ignore (private mode, quota, etc.)
  }
}

export function clearLocalDraft(formId: string, version: string) {
  try {
    localStorage.removeItem(key(formId, version));
  } catch {
    // ignore
  }
}

export function getResumeCode(formId: string): string | null {
  try {
    return localStorage.getItem(`gpai:resumecode:${formId}`);
  } catch {
    return null;
  }
}

export function setResumeCode(formId: string, code: string) {
  try {
    localStorage.setItem(`gpai:resumecode:${formId}`, code);
  } catch {
    // ignore
  }
}
