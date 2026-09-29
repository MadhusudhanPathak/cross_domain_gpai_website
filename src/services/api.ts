import { API_TIMEOUT_MS, APPS_SCRIPT_URL } from "../config";
import type { FieldErrors, FormData } from "../formEngine/types";

export type ApiErrorCode =
  | "VALIDATION"
  | "CLOSED"
  | "RATE_LIMIT"
  | "NEEDS_CODE"
  | "BAD_CODE"
  | "NOT_FOUND"
  | "BAD_REQUEST"
  | "SERVER"
  | "NETWORK";

export type ApiSuccess<T> = { ok: true } & T;
export type ApiFailure = { ok: false; code: ApiErrorCode; message: string; fieldErrors?: FieldErrors };
export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export type StatusResponse = { open: boolean; closesAt?: string; message?: string };
export type SubmitResponse = { submissionId: string; copySent: boolean };
export type SaveDraftResponse = { savedAt: string; codeEmailed: boolean };
export type GetDraftResponse = { data: FormData; savedAt: string };

export type ApiRequest =
  | { action: "getStatus"; formId: string }
  | {
      action: "submit";
      formId: string;
      formVersion: string;
      submissionId: string;
      data: FormData;
      copyRequested: boolean;
      hp: string;
      elapsedMs: number;
    }
  | { action: "saveDraft"; formId: string; email: string; data: FormData; code?: string }
  | { action: "getDraft"; formId: string; email: string; code: string };

const NETWORK_FAILURE: ApiFailure = {
  ok: false,
  code: "NETWORK",
  message: "We could not reach the server. Your answers are saved in this browser. Try again in a moment.",
};

const MALFORMED_RESPONSE: ApiFailure = {
  ok: false,
  code: "SERVER",
  message: "The server sent an unexpected response. Your answers are saved in this browser. Try again in a moment.",
};

function isApiResult(value: unknown): value is ApiResult<unknown> {
  return typeof value === "object" && value !== null && typeof (value as { ok?: unknown }).ok === "boolean";
}

/**
 * POSTs a request to the Apps Script backend. Never throws: network, timeout and
 * malformed-response problems are returned as an `ApiFailure`.
 *
 * The body is sent as `text/plain` so the browser skips the CORS preflight, which
 * Apps Script cannot answer.
 */
export async function call<T>(request: ApiRequest, timeoutMs = API_TIMEOUT_MS): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(request),
      redirect: "follow",
      signal: controller.signal,
    });
    const body: unknown = await res.json();
    return isApiResult(body) ? (body as ApiResult<T>) : MALFORMED_RESPONSE;
  } catch {
    return NETWORK_FAILURE;
  } finally {
    clearTimeout(timer);
  }
}
