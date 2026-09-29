import { useState } from "react";
import type { FormData } from "../../formEngine/types";
import { call, type SaveDraftResponse } from "../../services/api";
import { getResumeCode } from "../../services/storage";
import { ResumeDialog } from "./ResumeDialog";

type Props = {
  formId: string;
  data: FormData;
  onRestore: (data: FormData) => void;
};

/**
 * "Save and continue later" and "Resume a saved draft" controls. The first server save emails a
 * resume code; later saves for the same email must present that code.
 */
export function DraftBar({ formId, data, onRestore }: Props) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsCode, setNeedsCode] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [showResume, setShowResume] = useState(false);

  async function save(code?: string) {
    const email = typeof data.email === "string" ? data.email.trim() : "";
    if (!email) {
      setStatus("Enter your email address in the form first, then save.");
      return;
    }
    setBusy(true);
    setStatus("Saving...");
    const res = await call<SaveDraftResponse>({
      action: "saveDraft",
      formId,
      email,
      data,
      code: code ?? getResumeCode(formId) ?? undefined,
    });
    setBusy(false);
    if (res.ok) {
      setNeedsCode(false);
      const savedAt = new Date(res.savedAt).toLocaleTimeString();
      setStatus(`Saved at ${savedAt}.` + (res.codeEmailed ? " A resume code was emailed to you." : ""));
      return;
    }
    if (res.code === "NEEDS_CODE") setNeedsCode(true);
    setStatus(res.message);
  }

  return (
    <div className="form-topbar">
      <button type="button" className="button button--secondary" onClick={() => save(codeInput || undefined)} disabled={busy}>
        Save and continue later
      </button>
      <button type="button" className="button button--text" onClick={() => setShowResume(true)}>
        Resume a saved draft
      </button>

      {status && (
        <span className="field__help" aria-live="polite">
          {status}
        </span>
      )}

      {needsCode && (
        <span className="draft-code">
          <input type="text" placeholder="Resume code" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} />
          <button type="button" className="button button--secondary" onClick={() => save(codeInput)} disabled={busy}>
            Confirm
          </button>
        </span>
      )}

      {showResume && (
        <ResumeDialog
          formId={formId}
          onClose={() => setShowResume(false)}
          onRestore={(restored) => {
            onRestore(restored);
            setShowResume(false);
          }}
        />
      )}
    </div>
  );
}
