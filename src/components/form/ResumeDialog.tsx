import { useState } from "react";
import type { FormData } from "../../formEngine/types";
import { call, type GetDraftResponse } from "../../services/api";
import { setResumeCode } from "../../services/storage";
import { isRecord } from "../../utils/guards";

type Props = {
  formId: string;
  onClose: () => void;
  onRestore: (data: FormData) => void;
};

/** Modal that fetches a server-side draft by email and resume code. */
export function ResumeDialog({ formId, onClose, onRestore }: Props) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function restore() {
    setError("");
    const trimmedEmail = email.trim();
    const trimmedCode = code.trim();
    if (!trimmedEmail || !trimmedCode) {
      setError("Enter your email and resume code.");
      return;
    }
    setBusy(true);
    const res = await call<GetDraftResponse>({ action: "getDraft", formId, email: trimmedEmail, code: trimmedCode });
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    if (!isRecord(res.data)) {
      setError("The saved draft could not be read.");
      return;
    }
    setResumeCode(formId, trimmedCode);
    onRestore(res.data);
  }

  return (
    <div className="card dialog" role="dialog" aria-modal="true" aria-label="Resume a saved draft">
      <h2>Resume a saved draft</h2>
      <div className="field">
        <label className="field__label" htmlFor="resume-email">
          Email
        </label>
        <input id="resume-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label className="field__label" htmlFor="resume-code">
          Resume code
        </label>
        <input id="resume-code" type="text" value={code} onChange={(e) => setCode(e.target.value)} />
      </div>
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
      <div className="form-nav">
        <button type="button" className="button button--secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="button button--primary" onClick={restore} disabled={busy}>
          Restore
        </button>
      </div>
    </div>
  );
}
