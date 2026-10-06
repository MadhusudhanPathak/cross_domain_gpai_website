import { describe, expect, it } from "vitest";
import codeGs from "../../apps-script/Code.gs?raw";
import { getForm } from ".";
import round1Meta from "./round1.meta.json";
import type { Field, FormData, FormDef } from "../formEngine/types";
import { validateField } from "../formEngine/validate";

/**
 * Runs the Apps Script validator (`validateFieldServer_` in Code.gs) beside the browser validator and checks
 * they agree, so the "change both" contract in AGENTS.md is enforced for the elicitation item types.
 * Code.gs only declares functions at the top level, so it can be evaluated without the Google services.
 */
type ServerValidate = (field: Field, data: FormData, errors: Record<string, string>) => void;
const validateFieldServer = new Function(`${codeGs}\nreturn validateFieldServer_;`)() as ServerValidate;

function serverError(field: Field, data: FormData): string | undefined {
  const errors: Record<string, string> = {};
  validateFieldServer(field, data, errors);
  return errors[field.id];
}

const long = Array(151).fill("w").join(" ");

const estimateCases: unknown[] = [
  undefined,
  {},
  { lowest: "20", highest: "60", best: "40", confidence: "80" },
  { lowest: "20", highest: "60", best: "40", confidence: "80", rationale: long },
  { ooc: true },
  { ooc: true, rationale: long },
  { lowest: "70", highest: "60", best: "65", confidence: "80" },
  { lowest: "20", highest: "60", best: "70", confidence: "80" },
  { lowest: "x", highest: "60", best: "40", confidence: "80" },
  { lowest: "20", highest: "", best: "40", confidence: "80" },
  { lowest: "20", highest: "60", best: "4.5", confidence: "80" },
  { lowest: "20", highest: "60", best: "40", confidence: "49" },
  { lowest: 20, highest: 60, best: 40, confidence: 80 },
  { lowest: "", highest: "", best: "", confidence: "70" },
  { lowest: "-1", highest: "101", best: "", confidence: "" },
];

const allocationCases = (codes: string[]): unknown[] => [
  undefined,
  {},
  { ooc: true },
  { ooc: true, rationale: long },
  { points: { [codes[0]]: "100" }, confidence: "70" },
  { points: { [codes[0]]: "60", [codes[1]]: "30" }, confidence: "70" },
  { points: { [codes[0]]: "60", [codes[1]]: "40" } },
  { points: { [codes[0]]: "-5", [codes[1]]: "105" }, confidence: "70" },
  { points: { [codes[0]]: "50.5", [codes[1]]: "49.5" }, confidence: "70" },
  { points: {}, confidence: "70" },
  { points: { [codes[0]]: "100", bogus: "50" }, confidence: "70", rationale: "fine" },
];

const round1 = getForm("round1") as FormDef;
const fields = round1.sections.flatMap((s) => s.fields);

describe("server and browser validation agree", () => {
  for (const field of fields) {
    if (field.type === "estimate") {
      it(`estimate ${field.id}`, () => {
        for (const value of estimateCases) {
          const data = { [field.id]: value };
          expect(serverError(field, data), JSON.stringify(value)).toBe(validateField(field, data));
        }
      });
    } else if (field.type === "allocation") {
      it(`allocation ${field.id}`, () => {
        for (const value of allocationCases(field.codes.map((c) => c.value))) {
          const data = { [field.id]: value };
          expect(serverError(field, data), JSON.stringify(value)).toBe(validateField(field, data));
        }
      });
    }
  }
});

type LongRow = Record<string, unknown>;
const server = new Function(`${codeGs}\nreturn { longRows_, longColumnsFor_, columnsFor_, flatten_ };`)() as {
  longRows_: (form: unknown, data: FormData, base: LongRow) => LongRow[];
  longColumnsFor_: (form: unknown) => string[];
  columnsFor_: (form: unknown) => string[];
  flatten_: (form: unknown, data: FormData) => Record<string, unknown>;
};

describe("long-format rows (Round1_Long)", () => {
  // Mirrors what scripts/export-schemas.mjs writes into Forms.gs.
  const backendForm = { ...round1, itemMeta: { round: round1Meta.round, itemVersion: round1Meta.itemVersion, items: round1Meta.items } };
  const data: FormData = { panel: "legal" };
  for (const f of fields) {
    if (f.type === "estimate") data[f.id] = { lowest: "20", highest: "60", best: "40", confidence: "50", rationale: " because " };
    if (f.type === "allocation") data[f.id] = { points: { L: "60", V: "40" }, confidence: "70" };
  }
  data["D1-03"] = { ooc: true, rationale: "not my field" };
  const rows = server.longRows_(backendForm, data, { participant_id: "P1", panel: "legal" });
  const byId = (id: string) => rows.find((r) => r.item_id === id) as LongRow;

  it("writes one row per item with the spec §8 columns", () => {
    expect(rows).toHaveLength(40);
    const cols = server.longColumnsFor_(backendForm);
    expect(cols).toEqual(expect.arrayContaining(["participant_id", "panel", "round", "item_id", "item_version", "domain", "position", "item_type",
      "technique", "slot", "pair_id", "ledger_ref", "claim_ref", "response_type", "out_of_competence", "lowest", "highest", "best",
      "confidence", "lower80", "upper80", "alloc_L", "alloc_V", "alloc_T", "alloc_E", "alloc_N", "alloc_O", "alloc_none", "rationale"]));
    expect(cols).not.toContain("email");
  });

  it("carries item metadata and standardised 80% intervals", () => {
    const r = byId("D1-02");
    expect(r).toMatchObject({ domain: "D1", position: 2, round: 1, item_version: "1.0", item_type: "bounded", slot: "mainstream", pair_id: "D1-P1",
      ledger_ref: "G01", response_type: "four_step", best: 40, rationale: "because" });
    // 40 − (40 − 20) × 80/50 = 8; 40 + (60 − 40) × 80/50 = 72
    expect(r.lower80).toBe(8);
    expect(r.upper80).toBe(72);
  });

  it("leaves numbers blank when outside competence, and fills blank allocation points with 0", () => {
    expect(byId("D1-03")).toMatchObject({ out_of_competence: "TRUE", lowest: "", best: "", rationale: "not my field" });
    expect(byId("D1-03").lower80).toBeUndefined();
    expect(byId("D2-01")).toMatchObject({ response_type: "allocation", alloc_L: 60, alloc_V: 40, alloc_T: 0, alloc_none: 0, confidence: 70 });
  });

  it("flattens items into the wide row", () => {
    const cols = server.columnsFor_(backendForm);
    expect(cols).toContain("participant_id");
    expect(cols).toEqual(expect.arrayContaining(["D1-01_L", "D1-01_none", "D1-01_confidence", "D1-02_lowest", "D1-02_ooc", "D1-02_rationale"]));
    const flat = server.flatten_(backendForm, data);
    expect(flat["D1-02_best"]).toBe(40);
    expect(flat["D1-03_ooc"]).toBe("TRUE");
  });
});
