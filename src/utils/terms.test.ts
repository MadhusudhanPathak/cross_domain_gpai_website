import { describe, expect, it } from "vitest";
import { termFinder, termSlug } from "./terms";

const entries = [
  { term: "Constitution", definition: "", matches: ["constitution"] },
  { term: "Constitutional classifiers", definition: "", matches: ["classifiers trained from a constitution"] },
  { term: "Art. 55", definition: "", matches: ["Art. 55(1)(b)"] },
  { term: "Checkpoint", definition: "", matches: ["checkpoint"] },
];

describe("termFinder", () => {
  const find = termFinder(entries);
  const words = (text: string) => find(text, new Set()).map((h) => text.slice(h.start, h.end));

  it("prefers the longest phrase and links each term once", () => {
    expect(words("classifiers trained from a constitution, per the constitution")).toEqual([
      "classifiers trained from a constitution",
      "constitution",
    ]);
    expect(words("a checkpoint and another checkpoint")).toEqual(["checkpoint"]);
  });

  it("matches whole words, plurals and phrases ending in punctuation, ignoring case", () => {
    expect(words("Successive Checkpoints under Art. 55(1)(b).")).toEqual(["Checkpoints", "Art. 55(1)(b)"]);
    expect(words("checkpointing and constitutional")).toEqual([]);
  });

  it("skips terms already linked earlier in the same text", () => {
    const used = new Set<number>();
    find("the checkpoint", used);
    expect(find("the checkpoint again", used)).toEqual([]);
  });
});

describe("termSlug", () => {
  it("makes stable anchor ids", () => {
    expect(termSlug("Lens methods (logit lens, tuned lens)")).toBe("lens-methods-logit-lens-tuned-lens");
    expect(termSlug("Arts. 91–92")).toBe("arts-91-92");
  });
});
