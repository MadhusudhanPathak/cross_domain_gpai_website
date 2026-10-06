import { describe, expect, it } from "vitest";
import {
  ITEM_MESSAGES,
  allocationError,
  asAllocation,
  asEstimate,
  estimateError,
  estimateIssues,
  estimateWarning,
  parseWhole,
  totalMessage,
  wordCount,
} from "./items";
import type { AllocationCode } from "./types";

const est = (v: Record<string, unknown>) => asEstimate(v);
const valid = { lowest: "20", highest: "60", best: "40", confidence: "80" };

describe("parseWhole", () => {
  it("accepts whole numbers in range only", () => {
    expect(parseWhole("0", 0, 100)).toBe(0);
    expect(parseWhole(" 100 ", 0, 100)).toBe(100);
    expect(parseWhole("101", 0, 100)).toBeNull();
    expect(parseWhole("-1", 0, 100)).toBeNull();
    expect(parseWhole("2.5", 0, 100)).toBeNull();
    expect(parseWhole("1e2", 0, 100)).toBeNull();
    expect(parseWhole("", 0, 100)).toBeNull();
    expect(parseWhole("49", 50, 100)).toBeNull();
  });
});

describe("estimateError", () => {
  it("accepts a complete, ordered estimate", () => {
    expect(estimateError(est(valid), true)).toBeUndefined();
    expect(estimateError(est({ lowest: "40", highest: "40", best: "40", confidence: "50" }), true)).toBeUndefined();
  });

  it("requires all four numbers unless outside competence", () => {
    expect(estimateError(est({}), true)).toBe(ITEM_MESSAGES.estimateMissing);
    expect(estimateError(est({}), false)).toBeUndefined();
    expect(estimateError(est({ ooc: true }), true)).toBeUndefined();
    expect(estimateError(est({ ...valid, confidence: "" }), true)).toBe(ITEM_MESSAGES.confidence);
  });

  it("blocks lowest > highest and best outside the range", () => {
    expect(estimateError(est({ ...valid, lowest: "70" }), true)).toBe(ITEM_MESSAGES.order);
    expect(estimateError(est({ ...valid, best: "10" }), true)).toBe(ITEM_MESSAGES.bestRange);
    expect(estimateError(est({ ...valid, best: "61" }), true)).toBe(ITEM_MESSAGES.bestRange);
  });

  it("blocks out-of-range and non-integer values", () => {
    expect(estimateError(est({ ...valid, lowest: "1.5" }), true)).toBe(ITEM_MESSAGES.lowest);
    expect(estimateError(est({ ...valid, highest: "120" }), true)).toBe(ITEM_MESSAGES.highest);
    expect(estimateError(est({ ...valid, confidence: "45" }), true)).toBe(ITEM_MESSAGES.confidence);
    expect(estimateError(est({ ...valid, confidence: "101" }), true)).toBe(ITEM_MESSAGES.confidence);
  });

  it("applies the rationale word limit even when outside competence", () => {
    const long = Array(151).fill("word").join(" ");
    expect(estimateError(est({ ooc: true, rationale: long }), true)).toBe(ITEM_MESSAGES.rationale);
    expect(estimateError(est({ ...valid, rationale: Array(150).fill("w").join(" ") }), true)).toBeUndefined();
  });

  it("reports per-input issues for inline messages", () => {
    const issues = estimateIssues(est({ lowest: "50", highest: "40" }));
    expect(issues.highest).toBe(ITEM_MESSAGES.order);
    expect(issues.best).toBe(ITEM_MESSAGES.best);
    expect(issues.lowest).toBeUndefined();
  });
});

describe("estimateWarning", () => {
  it("warns on a zero-width or all-covering range", () => {
    expect(estimateWarning(est({ lowest: "30", highest: "30" }))).toMatch(/no range/);
    expect(estimateWarning(est({ lowest: "0", highest: "100" }))).toMatch(/every possible answer/);
    expect(estimateWarning(est(valid))).toBeUndefined();
  });
});

describe("allocationError", () => {
  const codes: AllocationCode[] = ["L", "V", "none"].map((value) => ({ value, code: value, label: value, description: "" }));
  const alloc = (v: Record<string, unknown>) => asAllocation(v, codes);

  it("accepts points totalling exactly 100, treating blanks as 0", () => {
    expect(allocationError(alloc({ points: { L: "60", V: "40" }, confidence: "70" }), true)).toBeUndefined();
  });

  it("rejects other totals, negatives and decimals", () => {
    expect(allocationError(alloc({ points: { L: "60", V: "30" }, confidence: "70" }), true)).toBe(totalMessage(90));
    expect(allocationError(alloc({ points: { L: "-10", V: "110" }, confidence: "70" }), true)).toBe(ITEM_MESSAGES.points);
    expect(allocationError(alloc({ points: { L: "50.5", V: "49.5" }, confidence: "70" }), true)).toBe(ITEM_MESSAGES.points);
  });

  it("requires confidence, and an answer unless outside competence", () => {
    expect(allocationError(alloc({ points: { L: "100" } }), true)).toBe(ITEM_MESSAGES.confidence);
    expect(allocationError(alloc({}), true)).toBe(ITEM_MESSAGES.allocationMissing);
    expect(allocationError(alloc({ ooc: true }), true)).toBeUndefined();
  });

  it("ignores keys that are not codes", () => {
    expect(alloc({ points: { L: "100", X: "5" } }).points).toEqual({ L: "100", V: "", none: "" });
  });
});

describe("wordCount", () => {
  it("counts whitespace-separated words", () => {
    expect(wordCount("")).toBe(0);
    expect(wordCount("  one two\nthree  ")).toBe(3);
  });
});
