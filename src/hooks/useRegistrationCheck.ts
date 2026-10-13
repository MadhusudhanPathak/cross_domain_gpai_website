import { useState } from "react";

const normalize = (email: unknown): string => (typeof email === "string" ? email.trim().toLowerCase() : "");

/**
 * Tracks the server's NOT_REGISTERED response on submit, so the notice disappears once
 * the participant changes the email address it was for.
 */
export function useRegistrationCheck(email: unknown) {
  const [missing, setMissing] = useState("");
  const current = normalize(email);

  return {
    /** The email the server rejected as unregistered, while it is still the one entered; otherwise "". */
    missingEmail: missing && missing === current ? missing : "",
    markMissing: () => setMissing(current),
  };
}
