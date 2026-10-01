import { ContactLink } from "../ContactLink";

/** Notice shown when the local draft for this form was restored on load. */
export function DraftBanner({ onKeep, onDiscard }: { onKeep: () => void; onDiscard: () => void }) {
  return (
    <div className="draft-banner">
      <span>You have saved answers on this device.</span>
      <span className="draft-banner__actions">
        <button type="button" className="button button--secondary" onClick={onKeep}>
          Keep editing
        </button>
        <button type="button" className="button button--secondary" onClick={onDiscard}>
          Start fresh
        </button>
      </span>
    </div>
  );
}

/** Prominent, sticky bar showing overall completion of the form's required fields, independent of which step is shown. */
export function CompletionBar({ percent }: { percent: number }) {
  return (
    <div className="completion-bar">
      <span className="completion-bar__label">{percent}% complete</span>
      <div
        className="completion-bar__track"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Form completion"
      >
        <div className="completion-bar__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function StepProgress({ step, total, title }: { step: number; total: number; title: string }) {
  return (
    <>
      <p className="step-label">
        Step {step + 1} of {total}: {title}
      </p>
      <div className="progress-bar">
        <div className="progress-bar__fill" style={{ width: `${((step + 1) / total) * 100}%` }} />
      </div>
    </>
  );
}

/** Off-screen input that people never see; bots that fill it are silently discarded by the server. */
export function Honeypot({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="visually-offscreen" aria-hidden="true">
      <label htmlFor="hp-field">Leave this field blank</label>
      <input id="hp-field" type="text" tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function FormClosed({ message }: { message?: string }) {
  return (
    <div className="container container--narrow">
      <h1>This form is closed</h1>
      <p>{message || "This form is no longer accepting responses."}</p>
      <p>
        Questions? Contact <ContactLink />.
      </p>
    </div>
  );
}
