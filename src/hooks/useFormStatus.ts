import { useEffect, useState } from "react";
import { call, type StatusResponse } from "../services/api";

/** Fetches whether a form is open. Returns null until (and unless) the server answers successfully. */
export function useFormStatus(formId: string): StatusResponse | null {
  const [status, setStatus] = useState<StatusResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    call<StatusResponse>({ action: "getStatus", formId }).then((res) => {
      if (!cancelled && res.ok) setStatus(res);
    });
    return () => {
      cancelled = true;
    };
  }, [formId]);

  return status;
}
