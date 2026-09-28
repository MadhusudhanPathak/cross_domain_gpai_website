import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import type { FormDef, FieldErrors } from "../lib/formTypes";
import { useFormState } from "../lib/useFormState";
import { visibleSections, visibleFields, validateSection, validateForm, stripHidden, isVisible } from "../lib/validate";
import { FieldRenderer } from "./fields/FieldRenderer";
import { ErrorSummary } from "./ErrorSummary";
import { DraftBar } from "./DraftBar";
import { MarkdownLite } from "../lib/markdownLite";
import { call } from "../lib/api";
import { loadLocalDraft, saveLocalDraft, clearLocalDraft } from "../lib/draft";
import { uuid } from "../lib/uuid";
import { browserTimeZone } from "../lib/dates";
import { site } from "../content/site";

type SubmitResp = { submissionId: string; copySent: boolean };
type StatusResp = { open: boolean; closesAt?: string; message?: string };

export function FormRenderer({ form }: { form: FormDef }) {
  const [, navigate] = useLocation();
  const { data, setField, replaceAll } = useFormState(() => {
    const restored = loadLocalDraft(form.id, form.version);
    const base: Record<string, unknown> = restored?.data ?? {};
    // apply defaults for fields not already present
    for (const section of form.sections) {
      for (const field of section.fields) {
        if (field.type === "info") continue;
        if (base[field.id] !== undefined) continue;
        if (field.default === "@browserTimeZone") base[field.id] = browserTimeZone();
      }
    }
    return base;
  });

  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [formStatus, setFormStatus] = useState<StatusResp | null>(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const submissionId = useRef(uuid());
  const startedAt = useRef(Date.now());
  const errorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const restored = loadLocalDraft(form.id, form.version);
    if (restored) setShowDraftBanner(true);
    call<StatusResp>({ action: "getStatus", formId: form.id }).then((res) => {
      if (res.ok) setFormStatus(res);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.id]);

  useEffect(() => {
    const t = setTimeout(() => saveLocalDraft(form.id, form.version, data), 500);
    return () => clearTimeout(t);
  }, [data, form.id, form.version]);

  const sections = useMemo(() => visibleSections(form, data), [form, data]);
  const currentSection = sections[Math.min(stepIndex, sections.length - 1)];
  const fields = useMemo(() => (currentSection ? visibleFields(currentSection, data) : []), [currentSection, data]);

  useEffect(() => {
    if (Object.keys(errors).length && errorRef.current) {
      errorRef.current.focus();
    }
  }, [errors]);

  if (formStatus && formStatus.open === false) {
    return (
      <div className="container container--narrow">
        <h1>This form is closed</h1>
        <p>{formStatus.message || "This form is no longer accepting responses."}</p>
        <p>
          Questions? Contact <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
        </p>
      </div>
    );
  }

  function goNext() {
    const sectionErrors = validateSection(currentSection, data);
    setErrors(sectionErrors);
    if (Object.keys(sectionErrors).length > 0) return;
    setErrors({});
    if (stepIndex < sections.length - 1) setStepIndex(stepIndex + 1);
  }

  function goBack() {
    setErrors({});
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  }

  async function handleSubmit() {
    const allErrors = validateForm(form, data);
    if (Object.keys(allErrors).length > 0) {
      // Jump to first step containing an error.
      const idx = sections.findIndex((s) => visibleFields(s, data).some((f) => allErrors[f.id]));
      if (idx >= 0) setStepIndex(idx);
      setErrors(allErrors);
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    const payload = stripHidden(form, data);
    const res = await call<SubmitResp>({
      action: "submit",
      formId: form.id,
      formVersion: form.version,
      submissionId: submissionId.current,
      data: payload,
      copyRequested: !!data.copy_requested,
      hp: (data as any).__hp || "",
      elapsedMs: Date.now() - startedAt.current,
    });
    setSubmitting(false);
    if (res.ok) {
      clearLocalDraft(form.id, form.version);
      try {
        sessionStorage.setItem(
          `gpai:done:${form.id}`,
          JSON.stringify({ submissionId: res.submissionId, copySent: res.copySent, email: data.email, commitment: data.commitment })
        );
      } catch {
        // ignore
      }
      navigate(`/forms/${form.id}/done`);
    } else if (res.code === "VALIDATION" && res.fieldErrors) {
      const idx = sections.findIndex((s) => visibleFields(s, data).some((f) => res.fieldErrors![f.id]));
      if (idx >= 0) setStepIndex(idx);
      setErrors(res.fieldErrors);
    } else {
      setSubmitError(res.message);
    }
  }

  if (!currentSection) return null;

  const isLastStep = stepIndex === sections.length - 1;

  return (
    <div className="container">
      <DraftBar
        formId={form.id}
        data={data}
        email={(data.email as string) ?? ""}
        onRestore={(restored) => {
          replaceAll(restored);
          setShowDraftBanner(false);
        }}
      />

      {showDraftBanner && (
        <div className="draft-banner">
          <span>You have saved answers on this device.</span>
          <span style={{ display: "flex", gap: "0.75rem" }}>
            <button type="button" className="button button--secondary" onClick={() => setShowDraftBanner(false)}>
              Keep editing
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => {
                clearLocalDraft(form.id, form.version);
                replaceAll({});
                setShowDraftBanner(false);
              }}
            >
              Start fresh
            </button>
          </span>
        </div>
      )}

      <h1>{form.title}</h1>
      {form.intro && <MarkdownLite text={form.intro} />}

      <p className="step-label">
        Step {stepIndex + 1} of {sections.length}: {currentSection.title}
      </p>
      <div className="progress-bar">
        <div className="progress-bar__fill" style={{ width: `${((stepIndex + 1) / sections.length) * 100}%` }} />
      </div>

      {currentSection.description && <p className="field__help">{currentSection.description}</p>}

      <ErrorSummary ref={errorRef} errors={errors} fields={fields} />

      {submitError && (
        <div className="alert alert--danger" role="alert">
          {submitError}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isLastStep) handleSubmit();
          else goNext();
        }}
      >
        {currentSection.fields.map((field) => {
          if (!isVisible(field.showIf, data)) return null;
          return <FieldRenderer key={field.id} field={field} data={data} setField={setField} error={errors[field.id]} />;
        })}

        {/* Honeypot: visually hidden, real inputs would never fill this. */}
        <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
          <label htmlFor="hp-field">Leave this field blank</label>
          <input
            id="hp-field"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={(data as any).__hp || ""}
            onChange={(e) => setField("__hp", e.target.value)}
          />
        </div>

        <div className="form-nav">
          {stepIndex > 0 ? (
            <button type="button" className="button button--secondary" onClick={goBack}>
              Back
            </button>
          ) : (
            <span />
          )}
          {isLastStep ? (
            <button type="submit" className="button button--primary" disabled={submitting}>
              {submitting ? "Sending..." : form.submitLabel}
            </button>
          ) : (
            <button type="submit" className="button button--primary">
              Next
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
