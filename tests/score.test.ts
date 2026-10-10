import { describe, expect, it } from "vitest";
import { callReducer, initialState } from "../lib/call/reducer";
import { replayFor } from "../lib/call/replay";
import { scoreCall } from "../lib/call/score";
import { DEMO_CALL_1 } from "../lib/call/script";
import type { CallState } from "../lib/call/types";

function play(upTo: number): CallState {
  let s = initialState(DEMO_CALL_1.setup);
  for (const line of DEMO_CALL_1.lines.slice(0, upTo)) s = callReducer(s, { type: "deliver", line, update: replayFor(line.turn) });
  return callReducer(s, { type: "end" });
}

describe("scoreCall", () => {
  it("has 10 core steps worth 10 points each", () => {
    const s = scoreCall(callReducer(initialState(DEMO_CALL_1.setup), { type: "end" }));
    expect(s.rows).toHaveLength(10);
    expect(s.possible).toBe(100);
    expect(s.earned).toBe(0);
    expect(s.percent).toBe(0);
    expect(s.passed).toBe(false);
  });

  it("Demo Call 1: all core steps done, but the triggered extras are missed", () => {
    const s = scoreCall(play(20));
    // 10 core + adherence support (triggered by the missed dose) + ADE addressed
    expect(s.rows.map((r) => r.id)).toEqual(
      expect.arrayContaining(["S-01", "S-02", "S-03", "S-11", "S-08", "S-10", "S-07", "S-06", "S-05", "S-09", "G-01", "ADE"]),
    );
    expect(s.possible).toBe(120);
    const byId = Object.fromEntries(s.rows.map((r) => [r.id, r.done]));
    expect(byId["ADE"]).toBe(true); // guidance was given for the diarrhea
    expect(byId["G-01"]).toBe(false); // no adherence suggestion on this call
    expect(s.earned).toBe(110);
    expect(s.percent).toBe(92);
    expect(s.passed).toBe(true);
  });

  it("a missed core step lowers the percentage and can fail the call", () => {
    const s = scoreCall(play(5)); // identity done, rest of the call never happened
    expect(s.percent).toBeLessThan(90);
    expect(s.passed).toBe(false);
  });

  it("exactly 90% passes", () => {
    const base = play(20);
    // drop one core step from the 120-point total? use a call with no extras instead
    const noExtras = { ...base, events: [], interventions: [], checklist: { ...base.checklist, "G-01": { done: false } } };
    const s = scoreCall(noExtras as CallState);
    expect(s.possible).toBe(100);
    expect(s.percent).toBe(100);
    const missOne = { ...noExtras, checklist: { ...noExtras.checklist, "S-09": { done: false } } };
    const t = scoreCall(missOne as CallState);
    expect(t.percent).toBe(90);
    expect(t.passed).toBe(true);
  });
});
