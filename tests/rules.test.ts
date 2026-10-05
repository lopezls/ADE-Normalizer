import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { RULES, getRule, isRuleId } from "../lib/call/rules";

const md = readFileSync(resolve(__dirname, "../docs/Rules.md"), "utf8");

describe("rules.json vs docs/Rules.md", () => {
  it("contains every rule ID that appears in a Rules.md table row", () => {
    const idsInDoc = [...md.matchAll(/^\|\s*(D\d+-\w{2}|S-\d{2}|G-\d{2})\s*\|/gm)].map((m) => m[1]);
    expect(idsInDoc.length).toBeGreaterThan(0);
    for (const id of idsInDoc) expect(isRuleId(id), `${id} missing from rules.json`).toBe(true);
    expect(RULES.map((r) => r.id).sort()).toEqual([...new Set(idsInDoc)].sort());
  });

  it("has no duplicate IDs", () => {
    const ids = RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every Dupixent ADE rule a label, recommendation and source", () => {
    for (const r of RULES.filter((r) => r.kind === "ade")) {
      expect(r.label, r.id).toBeTruthy();
      expect(r.recommendation, r.id).toBeTruthy();
      expect(r.triggerPhrases.length, r.id).toBeGreaterThan(0);
      expect(r.source.name, r.id).toBeTruthy();
    }
  });

  it("keeps D1-01 text identical to the table", () => {
    const r = getRule("D1-01")!;
    expect(r.label).toBe("Diarrhea");
    expect(r.recommendation).toBe("Hydration, replace electrolytes, Imodium, BRAT diet");
    expect(r.source.url).toContain("clevelandclinic.org");
  });

  it("returns undefined for an unknown ID", () => {
    expect(getRule("D9-99")).toBeUndefined();
  });
});
