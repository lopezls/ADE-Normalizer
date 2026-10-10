import { describe, expect, it } from "vitest";
import { percentOf } from "../lib/call/score";
import { summarizeAudit } from "../lib/stats";

const step = (id: string, label: string, done: boolean) => ({ id, label, done });
const rows = [
  { rph_name: "Alex", score_percent: 90, audit: [step("S-06", "ER / hospital", false), step("S-01", "Self-identify", true)] },
  { rph_name: "Alex", score_percent: 100, audit: [step("S-06", "ER / hospital", true), step("S-01", "Self-identify", true)] },
  { rph_name: "", score_percent: 70, audit: [step("S-06", "ER / hospital", false), step("G-01", "Adherence", false)] },
];

describe("summarizeAudit", () => {
  it("averages scores overall and per pharmacist", () => {
    const s = summarizeAudit(rows);
    expect(s.calls).toBe(3);
    expect(s.avgPercent).toBe(87);
    expect(s.byRph).toEqual([
      { name: "Alex", calls: 2, avgPercent: 95 },
      { name: "(name not recorded)", calls: 1, avgPercent: 70 },
    ]);
  });

  it("ranks the most-missed steps, counting only calls where the step applied", () => {
    const s = summarizeAudit(rows);
    expect(s.missed[0]).toEqual({ id: "S-06", label: "ER / hospital", missed: 2, applicable: 3 });
    expect(s.missed[1]).toEqual({ id: "G-01", label: "Adherence", missed: 1, applicable: 1 });
    expect(s.missed.find((m) => m.id === "S-01")).toBeUndefined();
  });

  it("handles no calls and old rows without an audit", () => {
    expect(summarizeAudit([]).avgPercent).toBe(0);
    expect(summarizeAudit([{ rph_name: "A", score_percent: 80, audit: null }]).missed).toEqual([]);
  });
});

describe("percentOf", () => {
  it("is the share of covered rows", () => {
    expect(percentOf([{ done: true }, { done: true }, { done: false }, { done: true }])).toBe(75);
    expect(percentOf([])).toBe(0);
  });
});

describe("buildEncounterInput", () => {
  it("carries the form, the reviewed ADEs and the audit rows", async () => {
    const { buildEncounterInput } = await import("../lib/call/ades");
    const { callReducer, initialState } = await import("../lib/call/reducer");
    const { DEMO_CALL_1 } = await import("../lib/call/script");
    let s = initialState(DEMO_CALL_1.setup);
    s = callReducer(s, { type: "edit", field: "rphName", value: "Alex" });
    s = callReducer(s, { type: "end" });
    const input = buildEncounterInput(s, ["diarrhea"]);
    expect(input.rphName).toBe("Alex");
    expect(input.ades).toEqual(["diarrhea"]);
    expect(input.drugName).toBe("Dupixent");
    expect(input.audit).toHaveLength(10);
    expect(input.audit.every((r) => r.done === false)).toBe(true);
  });
});
