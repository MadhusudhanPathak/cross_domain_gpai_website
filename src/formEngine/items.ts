import { isRecord } from "../utils/guards";
import type { AllocationCode, AllocationValue, EstimateValue } from "./types";

/**
 * Rules for the elicitation item types (`estimate`, `allocation`). Keep the messages and the order of
 * checks in sync with `estimateError_` / `allocationError_` in `apps-script/Code.gs`.
 */

export const COUNT_MIN = 0;
export const COUNT_MAX = 100;
export const CONFIDENCE_MIN = 50;
export const CONFIDENCE_MAX = 100;
export const ALLOCATION_TOTAL = 100;
/** Above this the rationale counter shows a warning; above the hard limit the item is invalid. */
export const RATIONALE_SOFT_WORDS = 100;
export const RATIONALE_MAX_WORDS = 150;
export const RATIONALE_MAX_CHARS = 1500;

export const ITEM_MESSAGES = {
  estimateMissing: 'Enter all four numbers, or tick "Outside my competence".',
  allocationMissing: 'Allocate 100% across the codes and give your confidence, or tick "Outside my competence".',
  lowest: "Lower estimate must be a whole number from 0 to 100.",
  highest: "Upper estimate must be a whole number from 0 to 100.",
  order: "Upper estimate must be greater than or equal to the lower estimate.",
  best: "Best estimate must be a whole number from 0 to 100.",
  bestRange: "Best estimate must be between the lower and upper estimates.",
  confidence: "Confidence must be a whole number from 50 to 100.",
  points: "Percentages must be whole numbers from 0 to 100.",
  rationale: `Keep the rationale to ${RATIONALE_MAX_WORDS} words or fewer.`,
} as const;

export const totalMessage = (sum: number) => `Percentages must add up to exactly ${ALLOCATION_TOTAL}% (currently ${sum}%).`;

const str = (v: unknown): string => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "");

export const isBlank = (v: string): boolean => v.trim() === "";

/** Parses a whole number within [min, max]; anything else (blank, decimals, signs, out of range) is null. */
export function parseWhole(v: string, min: number, max: number): number | null {
  const s = v.trim();
  if (!/^\d{1,3}$/.test(s)) return null;
  const n = Number(s);
  return n >= min && n <= max ? n : null;
}

export function wordCount(text: string): number {
  const s = text.trim();
  return s ? s.split(/\s+/).length : 0;
}

export function asEstimate(value: unknown): EstimateValue {
  const v = isRecord(value) ? value : {};
  return {
    lowest: str(v.lowest),
    highest: str(v.highest),
    best: str(v.best),
    confidence: str(v.confidence),
    rationale: str(v.rationale),
    ooc: v.ooc === true,
  };
}

export function asAllocation(value: unknown, codes: AllocationCode[]): AllocationValue {
  const v = isRecord(value) ? value : {};
  const raw = isRecord(v.points) ? v.points : {};
  const points: Record<string, string> = {};
  for (const c of codes) points[c.value] = str(raw[c.value]);
  return { points, confidence: str(v.confidence), rationale: str(v.rationale), ooc: v.ooc === true };
}

export type EstimatePart = "lowest" | "highest" | "best" | "confidence" | "rationale";
export type EstimateIssues = Partial<Record<EstimatePart, string>>;

/** Every problem with an estimate, keyed by the input it belongs to (for inline messages). Blank inputs count as problems. */
export function estimateIssues(v: EstimateValue): EstimateIssues {
  const issues: EstimateIssues = {};
  if (wordCount(v.rationale) > RATIONALE_MAX_WORDS) issues.rationale = ITEM_MESSAGES.rationale;
  if (v.ooc) return issues;
  const lo = parseWhole(v.lowest, COUNT_MIN, COUNT_MAX);
  const hi = parseWhole(v.highest, COUNT_MIN, COUNT_MAX);
  const best = parseWhole(v.best, COUNT_MIN, COUNT_MAX);
  if (lo === null) issues.lowest = ITEM_MESSAGES.lowest;
  if (hi === null) issues.highest = ITEM_MESSAGES.highest;
  else if (lo !== null && hi < lo) issues.highest = ITEM_MESSAGES.order;
  if (best === null) issues.best = ITEM_MESSAGES.best;
  else if (lo !== null && hi !== null && (best < lo || best > hi)) issues.best = ITEM_MESSAGES.bestRange;
  if (parseWhole(v.confidence, CONFIDENCE_MIN, CONFIDENCE_MAX) === null) issues.confidence = ITEM_MESSAGES.confidence;
  return issues;
}

/** The single message reported for an estimate field, or undefined when it is resolved (or optional and untouched). */
export function estimateError(v: EstimateValue, required: boolean | undefined): string | undefined {
  const issues = estimateIssues(v);
  if (issues.rationale) return issues.rationale;
  if (v.ooc) return undefined;
  if ([v.lowest, v.highest, v.best, v.confidence].every(isBlank)) return required ? ITEM_MESSAGES.estimateMissing : undefined;
  return issues.lowest ?? issues.highest ?? issues.best ?? issues.confidence;
}

/** Soft warnings: allowed, but worth a second look. */
export function estimateWarning(v: EstimateValue): string | undefined {
  if (v.ooc) return undefined;
  const lo = parseWhole(v.lowest, COUNT_MIN, COUNT_MAX);
  const hi = parseWhole(v.highest, COUNT_MIN, COUNT_MAX);
  if (lo === null || hi === null) return undefined;
  if (lo === hi) return "You have given no range. Are you certain of the exact count?";
  if (lo === COUNT_MIN && hi === COUNT_MAX)
    return "This range covers every possible answer. Consider ticking \"Outside my competence\" if you cannot narrow it.";
  return undefined;
}

export type AllocationIssues = { points?: string; total?: string; confidence?: string; rationale?: string };

/** Sum of the points, treating blank inputs as 0. Null when any input is not a whole number from 0 to 100. */
export function allocationSum(v: AllocationValue): number | null {
  let sum = 0;
  for (const raw of Object.values(v.points)) {
    if (isBlank(raw)) continue;
    const n = parseWhole(raw, COUNT_MIN, COUNT_MAX);
    if (n === null) return null;
    sum += n;
  }
  return sum;
}

export function allocationIssues(v: AllocationValue): AllocationIssues {
  const issues: AllocationIssues = {};
  if (wordCount(v.rationale) > RATIONALE_MAX_WORDS) issues.rationale = ITEM_MESSAGES.rationale;
  if (v.ooc) return issues;
  const sum = allocationSum(v);
  if (sum === null) issues.points = ITEM_MESSAGES.points;
  else if (sum !== ALLOCATION_TOTAL) issues.total = totalMessage(sum);
  if (parseWhole(v.confidence, CONFIDENCE_MIN, CONFIDENCE_MAX) === null) issues.confidence = ITEM_MESSAGES.confidence;
  return issues;
}

export function allocationError(v: AllocationValue, required: boolean | undefined): string | undefined {
  const issues = allocationIssues(v);
  if (issues.rationale) return issues.rationale;
  if (v.ooc) return undefined;
  if ([...Object.values(v.points), v.confidence].every(isBlank)) return required ? ITEM_MESSAGES.allocationMissing : undefined;
  return issues.points ?? issues.total ?? issues.confidence;
}
