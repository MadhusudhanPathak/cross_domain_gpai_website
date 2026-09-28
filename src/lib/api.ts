const URL_ = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined;

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
