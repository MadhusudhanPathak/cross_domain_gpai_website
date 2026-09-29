import { useEffect } from "react";
import { LOCAL_DRAFT_DEBOUNCE_MS } from "../config";
import type { FormData } from "../formEngine/types";
import { saveLocalDraft } from "../services/storage";

/** Persists answers to localStorage shortly after each change. */
export function useLocalDraftAutosave(formId: string, version: string, data: FormData): void {
  useEffect(() => {
    const timer = setTimeout(() => saveLocalDraft(formId, version, data), LOCAL_DRAFT_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [formId, version, data]);
}
