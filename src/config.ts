/**
 * Public Apps Script /exec URL used when VITE_APPS_SCRIPT_URL is unset or blank.
 * The URL is not a secret: the browser must call it directly.
 */
const DEFAULT_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyPR2yb-2CXU1KvObr-Vnwr7nJWVK1tLTi2MoDLNtMRT4tONWjUW0c2GXtMDR3XHYD3/exec";

export const APPS_SCRIPT_URL: string = import.meta.env.VITE_APPS_SCRIPT_URL?.trim() || DEFAULT_APPS_SCRIPT_URL;

export const API_TIMEOUT_MS = 25_000;

export const LOCAL_DRAFT_DEBOUNCE_MS = 500;
