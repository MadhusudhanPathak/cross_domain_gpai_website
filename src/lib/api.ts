// The Apps Script /exec URL is public by design (the browser must call it), so a
// hardcoded fallback is safe. It applies when the env var is missing or empty.
const DEFAULT_URL =
  "https://script.google.com/macros/s/AKfycbyPR2yb-2CXU1KvObr-Vnwr7nJWVK1tLTi2MoDLNtMRT4tONWjUW0c2GXtMDR3XHYD3/exec";
const URL_: string = import.meta.env.VITE_APPS_SCRIPT_URL || DEFAULT_URL;

export type ApiSuccess<T> = { ok: true } & T;
export type ApiFailure = {
  ok: false;
  code: "VALIDATION" | "CLOSED" | "RATE_LIMIT" | "NEEDS_CODE" | "BAD_CODE" | "NOT_FOUND" | "BAD_REQUEST" | "SERVER" | "NETWORK";
  message: string;
  fieldErrors?: Record<string, string>;
};
export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export async function call<T>(payload: object, timeoutMs = 25000): Promise<ApiResult<T>> {
  if (!URL_) {
    return {
      ok: false,
      code: "SERVER",
      message: "The form backend is not configured yet. Set VITE_APPS_SCRIPT_URL.",
    };
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(URL_, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow",
      signal: ctrl.signal,
    });
    return (await res.json()) as ApiResult<T>;
  } catch {
    return {
      ok: false,
      code: "NETWORK",
      message: "We could not reach the server. Your answers are saved in this browser. Try again in a moment.",
    };
  } finally {
    clearTimeout(timer);
  }
}
