import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { applyDefaults } from "../../formEngine/defaults";
import type { FieldErrors, FormData, FormDef } from "../../formEngine/types";
import { hasErrors, validateForm, validateSection } from "../../formEngine/validate";
import { firstSectionWithError, isVisible, stripHidden, visibleFields, visibleSections } from "../../formEngine/visibility";
import { useFormState } from "../../hooks/useFormState";
import { useFormStatus } from "../../hooks/useFormStatus";
import { useLocalDraftAutosave } from "../../hooks/useLocalDraftAutosave";
import { call, type SubmitResponse } from "../../services/api";
import { clearLocalDraft, loadLocalDraft, saveDoneInfo } from "../../services/storage";
import { uuid } from "../../utils/uuid";
import { MarkdownLite } from "../MarkdownLite";
import { FieldRenderer } from "../fields/FieldRenderer";
import { DraftBar } from "./DraftBar";
import { ErrorSummary } from "./ErrorSummary";
import { DraftBanner, FormClosed, Honeypot, StepProgress } from "./FormParts";

const HONEYPOT_KEY = "__hp";

const optionalString = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

/**
 * Renders a JSON form definition as a multi-step form: one visible section per step, validated
 * on "Next", fully re-validated on submit, with local autosave and server-side drafts.
 */
export function FormRenderer({ form }: { form: FormDef }) {
  const [, navigate] = useLocation();
  const [initialDraft] = useState(() => loadLocalDraft(form.id, form.version));
  const { data, setField, replaceAll } = useFormState(() => applyDefaults(form, initialDraft?.data ?? {}));

  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showDraftBanner, setShowDraftBanner] = useState(initialDraft !== null);
  const submissionId = useRef(uuid());
  const startedAt = useRef(Date.now());
  const errorRef = useRef<HTMLDivElement | null>(null);

  const formStatus = useFormStatus(form.id);
  useLocalDraftAutosave(form.id, form.version, data);

  const sections = useMemo(() => visibleSections(form, data), [form, data]);
  const step = Math.max(0, Math.min(stepIndex, sections.length - 1));
  const currentSection = sections[step];
  const fields = useMemo(() => (currentSection ? visibleFields(currentSection, data) : []), [currentSection, data]);

  useEffect(() => {
    if (hasErrors(errors)) errorRef.current?.focus();
  }, [errors]);

  if (formStatus?.open === false) return <FormClosed message={formStatus.message} />;
  if (!currentSection) return null;

  const isLastStep = step === sections.length - 1;

  function showErrors(fieldErrors: FieldErrors) {
    const idx = firstSectionWithError(sections, data, fieldErrors);
    if (idx >= 0) setStepIndex(idx);
    setErrors(fieldErrors);
  }

  function goNext() {
    const sectionErrors = validateSection(currentSection, data);
    setErrors(sectionErrors);
    if (!hasErrors(sectionErrors) && !isLastStep) setStepIndex(step + 1);
  }

  function goBack() {
    setErrors({});
    if (step > 0) setStepIndex(step - 1);
  }

  function restoreDraft(restored: FormData) {
    replaceAll(restored);
    setShowDraftBanner(false);
  }

  function discardLocalDraft() {
    clearLocalDraft(form.id, form.version);
    replaceAll({});
    setShowDraftBanner(false);
  }

  async function handleSubmit() {
    if (submitting) return;
    const allErrors = validateForm(form, data);
    if (hasErrors(allErrors)) {
      showErrors(allErrors);
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    const res = await call<SubmitResponse>({
      action: "submit",
      formId: form.id,
      formVersion: form.version,
      submissionId: submissionId.current,
      data: stripHidden(form, data),
      copyRequested: !!data.copy_requested,
      hp: optionalString(data[HONEYPOT_KEY]) ?? "",
      elapsedMs: Date.now() - startedAt.current,
    });
    setSubmitting(false);
    if (res.ok) {
      clearLocalDraft(form.id, form.version);
      saveDoneInfo(form.id, {
        submissionId: res.submissionId,
        copySent: res.copySent,
        email: optionalString(data.email),
        commitment: optionalString(data.commitment),
      });
      navigate(`/forms/${form.id}/done`);
    } else if (res.code === "VALIDATION" && res.fieldErrors) {
      showErrors(res.fieldErrors);
    } else {
      setSubmitError(res.message);
    }
  }

  return (
    <div className="container">
      <DraftBar formId={form.id} data={data} onRestore={restoreDraft} />

      {showDraftBanner && <DraftBanner onKeep={() => setShowDraftBanner(false)} onDiscard={discardLocalDraft} />}

      <h1>{form.title}</h1>
      {form.intro && <MarkdownLite text={form.intro} />}

      <StepProgress step={step} total={sections.length} title={currentSection.title} />

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
        {currentSection.fields
          .filter((field) => isVisible(field.showIf, data))
          .map((field) => (
            <FieldRenderer key={field.id} field={field} data={data} setField={setField} error={errors[field.id]} />
          ))}

        <Honeypot value={optionalString(data[HONEYPOT_KEY]) ?? ""} onChange={(v) => setField(HONEYPOT_KEY, v)} />

        <div className="form-nav">
          {step > 0 ? (
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
