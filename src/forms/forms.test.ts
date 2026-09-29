import { describe, expect, it } from "vitest";
import { getForm } from ".";

describe("getForm", () => {
  it("returns registered forms", () => {
    expect(getForm("interest")?.id).toBe("interest");
  });

  it("ignores unknown ids and Object.prototype keys", () => {
    expect(getForm("missing")).toBeUndefined();
    expect(getForm("constructor")).toBeUndefined();
    expect(getForm("__proto__")).toBeUndefined();
  });
});
