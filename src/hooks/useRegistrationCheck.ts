import { useState } from "react";
import type { FormDef } from "../formEngine/types";
import { call, type CheckEmailResponse } from "../services/api";

const normalize = (email: unknown): string => (typeof email === "string" ? email.trim().toLowerCase() : "");

/**
 * For forms with `access: "panel"`: checks that the email entered appears among the expressions of interest.
 * The server checks again on submit and on draft saves, so when the check itself fails (network, rate limit)
 * the participant may continue rather than being blocked.
 */
export function useRegistrationCheck(form: FormDef, email: unknown) {
  const [verified, setVerified] = useState("");
  const [missing, setMissing] = useState("");
  const [checking, setChecking] = useState(false);
  const current = normalize(email);

  /** Resolves to false only when the server says the email is not registered. */
  async function ensureRegistered(): Promise<boolean> {
    if (form.access !== "panel" || !current || current === verified) return true;
    setChecking(true);
    const res = await call<CheckEmailResponse>({ action: "checkEmail", formId: form.id, email: current });
    setChecking(false);
    if (res.ok && !res.registered) {
      setMissing(current);
      return false;
    }
    if (res.ok) setVerified(current);
    setMissing("");
    return true;
  }

  return {
    checking,
    /** The email the server did not recognise, while it is still the one entered; otherwise "". */
    missingEmail: missing && missing === current ? missing : "",
    markMissing: () => setMissing(current),
    ensureRegistered,
  };
}
