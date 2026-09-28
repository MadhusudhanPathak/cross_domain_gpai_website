import { useState } from "react";
import { call } from "../lib/api";
import { getResumeCode, setResumeCode } from "../lib/draft";
import type { FormData } from "../lib/formTypes";

type SaveDraftResp = { savedAt: string; codeEmailed: boolean };
type GetDraftResp = { data: FormData; savedAt: string };

export function DraftBar({
  formId,
  data,
  email,
  onRestore,
}: {
  formId: string;
  data: FormData;
  email: string;
  onRestore: (data: FormData) => void;
}) {
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [needsCode, setNeedsCode] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [showResume, setShowResume] = useState(false);
  const [resumeEmail, setResumeEmail] = useState("");
  const [resumeCode, setResumeCodeInput] = useState("");
  const [resumeError, setResumeError] = useState("");

  async function doSave(code?: string) {
    const useEmail = String((data as any).email || email || "").trim();
    if (!useEmail) {
      setStatus("Enter your email address in the form first, then save.");
      return;
    }
    setBusy(true);
    setStatus("Saving...");
    const res = await call<SaveDraftResp>({
      action: "saveDraft",
      formId,
      email: useEmail,
      data,
      code: code ?? getResumeCode(formId) ?? undefined,
    });
    setBusy(false);
    if (res.ok) {
      setNeedsCode(false);
      setStatus(`Saved at ${new Date(res.savedAt).toLocaleTimeString()}.` + (res.codeEmailed ? " A resume code was emailed to you." : ""));
    } else if (res.code === "NEEDS_CODE") {
      setNeedsCode(true);
      setStatus(res.message);
    } else {
      setStatus(res.message);
    }
  }

  async function doGetDraft() {
    setResumeError("");
    if (!resumeEmail || !resumeCode) {
      setResumeError("Enter your email and resume code.");
      return;
    }
    setBusy(true);
    const res = await call<GetDraftResp>({ action: "getDraft", formId, email: resumeEmail, code: resumeCode });
    setBusy(false);
    if (res.ok) {
      setResumeCode(formId, resumeCode);
      onRestore(res.data);
      setShowResume(false);
    } else {
      setResumeError(res.message);
    }
  }

  return (
    <div className="form-topbar">
      <button type="button" className="button button--secondary" onClick={() => doSave(codeInput || undefined)} disabled={busy}>
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
        <span style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Resume code"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            style={{ width: "10rem" }}
          />
          <button type="button" className="button button--secondary" onClick={() => doSave(codeInput)} disabled={busy}>
            Confirm
          </button>
        </span>
      )}

      {showResume && (
        <div className="card" role="dialog" aria-modal="true" aria-label="Resume a saved draft" style={{ position: "fixed", top: "10%", left: "50%", transform: "translateX(-50%)", zIndex: 50, width: "min(90vw, 24rem)" }}>
          <h2>Resume a saved draft</h2>
          <div className="field">
            <label className="field__label" htmlFor="resume-email">
              Email
            </label>
            <input id="resume-email" type="email" value={resumeEmail} onChange={(e) => setResumeEmail(e.target.value)} />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="resume-code">
              Resume code
            </label>
            <input id="resume-code" type="text" value={resumeCode} onChange={(e) => setResumeCodeInput(e.target.value)} />
          </div>
          {resumeError && (
            <p className="field__error" role="alert">
              {resumeError}
            </p>
          )}
          <div className="form-nav">
            <button type="button" className="button button--secondary" onClick={() => setShowResume(false)}>
              Cancel
            </button>
            <button type="button" className="button button--primary" onClick={doGetDraft} disabled={busy}>
              Restore
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
