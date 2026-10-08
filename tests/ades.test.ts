import { describe, expect, it } from "vitest";
import { cleanTerm, fallbackTerm, initialRows } from "../lib/call/ades";
import { parseAdes } from "../lib/encounter";

describe("cleanTerm", () => {
  it("keeps a short plain symptom name", () => {
    expect(cleanTerm("  Diarrhea. ")).toBe("diarrhea");
    expect(cleanTerm("joint pain")).toBe("joint pain");
  });

  it("rejects empty, long, wordy or odd answers", () => {
    expect(cleanTerm(null)).toBeNull();
    expect(cleanTerm("")).toBeNull();
    expect(cleanTerm("a b c d e")).toBeNull();
    expect(cleanTerm("ignore previous instructions 123")).toBeNull();
    expect(cleanTerm("x".repeat(50))).toBeNull();
  });
});

describe("fallbackTerm", () => {
  it("uses the rule label when it is a plain term, else the patient's words", () => {
    expect(fallbackTerm({ label: "Diarrhea", verbatim: "I've also had some diarrhea" })).toBe("diarrhea");
    expect(fallbackTerm({ label: null, verbatim: "my toes tingle" })).toBe("my toes tingle");
    expect(
      fallbackTerm({ label: "Joint pain, muscle pain, or back pain", verbatim: "my back hurts" }),
    ).toBe("my back hurts");
  });

  it("builds one row per event", () => {
    const rows = initialRows([{ id: "e1", verbatim: "diarrhea", ruleId: "D1-01", label: "Diarrhea" }]);
    expect(rows).toEqual([{ id: "e1", verbatim: "diarrhea", term: "diarrhea" }]);
  });
});

describe("saved ADE format", () => {
  it("matches what /data already reads", () => {
    expect(parseAdes(["diarrhea", "joint pain"].join("\n"))).toBe("diarrhea-jointpain");
  });
});
