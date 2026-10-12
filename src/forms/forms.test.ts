import { describe, expect, it } from "vitest";
import { getForm } from ".";
import { constraintCodes } from "../content/delphi";
import type { Field, FormDef } from "../formEngine/types";
import round1Json from "./round1.json";
import round1Meta from "./round1.meta.json";

describe("getForm", () => {
  it("returns registered forms", () => {
    expect(getForm("interest")?.id).toBe("interest");
    expect(getForm("round1")?.id).toBe("round1");
  });

  it("ignores unknown ids and Object.prototype keys", () => {
    expect(getForm("missing")).toBeUndefined();
    expect(getForm("constructor")).toBeUndefined();
    expect(getForm("__proto__")).toBeUndefined();
  });
});

describe("round1 questionnaire", () => {
  const form = getForm("round1") as FormDef;
  const items = form.sections.flatMap((s) => s.fields).filter((f) => f.type === "estimate" || f.type === "allocation");

  it("has 40 items, D1-01 to D4-10, ten per domain in fixed order", () => {
    const expected = ["D1", "D2", "D3", "D4"].flatMap((d) => Array.from({ length: 10 }, (_, i) => `${d}-${String(i + 1).padStart(2, "0")}`));
    expect(items.map((f) => f.id)).toEqual(expected);
    for (const d of ["D1", "D2", "D3", "D4"]) {
      const section = form.sections.find((s) => s.id === d);
      expect(section?.fields.filter((f) => f.type !== "info").map((f) => f.id)).toEqual(expected.filter((id) => id.startsWith(d)));
    }
  });

  it("uses an allocation for position 01 and four-step estimates for 02-10, all required", () => {
    for (const f of items) {
      expect(f.type).toBe(f.id.endsWith("-01") ? "allocation" : "estimate");
      expect(f.required).toBe(true);
    }
  });

  it("has analysis metadata for exactly the items in the form", () => {
    expect(Object.keys(round1Meta.items).sort()).toEqual(items.map((f) => f.id).sort());
    expect(round1Meta.formId).toBe(form.id);
  });

  it("resets only fields that exist in the form when a draft from another version is restored", () => {
    const ids = new Set(form.sections.flatMap((s) => s.fields).map((f) => f.id));
    for (const id of form.resetOnUpgrade ?? []) expect(ids.has(id)).toBe(true);
  });

  it("never shows internal analysis labels to participants", () => {
    const text = JSON.stringify(round1Json);
    const internal = /bounded weight|disputed transfer|domain diagnosis|shared remedy|specific remedy|access status|mainstream|underdog|overreach|hypothes|ledger|G\d\d\b/i;
    expect(text).not.toMatch(internal);
    expect(text).not.toMatch(/"(item_type|slot|pair_id|ledger_ref|claim_ref)"/);
  });

  it("allocation codes match the glossary's constraint codes", () => {
    const expected = constraintCodes.map((c) => ({ code: c.code, label: c.label, description: c.description }));
    for (const f of items.filter((x): x is Extract<Field, { type: "allocation" }> => x.type === "allocation")) {
      expect(f.codes.map((c) => ({ code: c.code, label: c.label, description: c.description }))).toEqual(expected);
    }
  });

  it("shows the anchor claim on every domain page", () => {
    for (const d of ["D1", "D2", "D3", "D4"]) {
      const section = form.sections.find((s) => s.id === d);
      const anchor = section?.fields.find((f) => f.id === `${d}_anchor`);
      expect(anchor?.type === "info" && anchor.text).toMatch(new RegExp(`^\\*\\*Anchor claim \\(${d}\\)\\.\\*\\*`));
      expect(section?.fields.some((f) => f.type === "info" && f.component === "ReferenceScenario")).toBe(true);
    }
  });
});

describe("round1 navigation and wording", () => {
  const form = getForm("round1") as FormDef;

  it("shows the step bar and gates each domain on its first question", () => {
    expect(form.stepNav).toBe(true);
    for (const d of ["D1", "D2", "D3", "D4"]) {
      const section = form.sections.find((s) => s.id === d);
      expect(section?.gateField).toBe(`${d}-01`);
      expect(section?.fields.some((f) => f.id === section.gateField)).toBe(true);
    }
  });

  it("uses bold only (no single-asterisk italics) and percentages rather than points", () => {
    const text = JSON.stringify(round1Json);
    expect(text.replace(/\*\*/g, "")).not.toMatch(/\*/);
    expect(text).not.toMatch(/\bpoints\b/i);
  });
});
