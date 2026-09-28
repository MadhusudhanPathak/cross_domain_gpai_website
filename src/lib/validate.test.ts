import { describe, it, expect } from "vitest";
import { isVisible, validateForm, stripHidden } from "./validate";
import type { FormDef } from "./formTypes";

const form: FormDef = {
  id: "test",
  version: "1.0.0",
  title: "Test",
  submitLabel: "Submit",
  sheet: "Test",
  access: "open",
  sections: [
    {
      id: "s1",
      title: "Section 1",
      fields: [
        { id: "name", type: "text", label: "Name", required: true, maxLength: 50 },
        { id: "email", type: "email", label: "Email", required: true },
        { id: "site", type: "url", label: "Site" },
        { id: "track", type: "radio", label: "Track", required: true, options: [{ value: "a", label: "A" }, { value: "b", label: "B" }] },
        { id: "other", type: "text", label: "Other", showIf: { field: "track", equals: "b" } },
        { id: "tags", type: "checkboxes", label: "Tags", required: true, minItems: 1, options: [{ value: "x", label: "X" }, { value: "none", label: "None", exclusive: true }] },
      ],
    },
    {
      id: "s2",
      title: "Section 2",
      showIf: { field: "track", notEquals: "b" },
      fields: [
        { id: "consent", type: "consents", label: "Consent", options: [{ value: "c1", label: "C1" }, { value: "c2", label: "C2" }] },
      ],
    },
  ],
};

describe("isVisible", () => {
  it("equals condition", () => {
    expect(isVisible({ field: "track", equals: "b" }, { track: "b" })).toBe(true);
    expect(isVisible({ field: "track", equals: "b" }, { track: "a" })).toBe(false);
  });
  it("notEquals condition", () => {
    expect(isVisible({ field: "track", notEquals: "b" }, { track: "a" })).toBe(true);
    expect(isVisible({ field: "track", notEquals: "b" }, { track: "b" })).toBe(false);
  });
  it("includes condition", () => {
    expect(isVisible({ field: "tags", includes: "x" }, { tags: ["x", "y"] })).toBe(true);
    expect(isVisible({ field: "tags", includes: "x" }, { tags: ["y"] })).toBe(false);
  });
  it("undefined condition is always visible", () => {
    expect(isVisible(undefined, {})).toBe(true);
  });
});

describe("validateForm", () => {
  it("flags required fields as missing on empty data", () => {
    const errors = validateForm(form, {});
    expect(errors.name).toBeTruthy();
    expect(errors.email).toBeTruthy();
    expect(errors.track).toBeTruthy();
    expect(errors.tags).toBeTruthy();
  });

  it("passes with valid data and skips hidden fields", () => {
    const data = { name: "A", email: "a@example.com", track: "a", tags: ["x"], consent: { c1: true, c2: true } };
    const errors = validateForm(form, data);
    expect(errors).toEqual({});
  });

  it("rejects invalid email", () => {
    const errors = validateForm(form, { name: "A", email: "not-an-email", track: "a", tags: ["x"] });
    expect(errors.email).toBeTruthy();
  });

  it("rejects invalid url", () => {
    const errors = validateForm(form, { name: "A", email: "a@example.com", site: "notaurl", track: "a", tags: ["x"] });
    expect(errors.site).toBeTruthy();
  });

  it("does not require consent section when track is b (hidden by showIf)", () => {
    const data = { name: "A", email: "a@example.com", track: "b", tags: ["x"] };
    const errors = validateForm(form, data);
    expect(errors.consent).toBeUndefined();
  });

  it("requires consent when section is visible", () => {
    const data = { name: "A", email: "a@example.com", track: "a", tags: ["x"], consent: { c1: true } };
    const errors = validateForm(form, data);
    expect(errors.consent).toBeTruthy();
  });
});

describe("stripHidden", () => {
  it("removes values for fields hidden by showIf", () => {
    const data = { name: "A", email: "a@example.com", track: "a", other: "should be dropped", tags: ["x"] };
    const stripped = stripHidden(form, data);
    expect(stripped.other).toBeUndefined();
    expect(stripped.name).toBe("A");
  });

  it("keeps values for fields shown by showIf", () => {
    const data = { name: "A", email: "a@example.com", track: "b", other: "kept", tags: ["x"] };
    const stripped = stripHidden(form, data);
    expect(stripped.other).toBe("kept");
  });

  it("drops entire section values when section is hidden", () => {
    const data = { name: "A", email: "a@example.com", track: "b", tags: ["x"], consent: { c1: true, c2: true } };
    const stripped = stripHidden(form, data);
    expect(stripped.consent).toBeUndefined();
  });
});
