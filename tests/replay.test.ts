import { describe, expect, it } from "vitest";
import { buildChartNote } from "../lib/call/chartNote";
import { visibleChecklist } from "../lib/call/checklist";
import { callReducer, initialState } from "../lib/call/reducer";
import { replayFor } from "../lib/call/replay";
import { DEMO_CALL_1 } from "../lib/call/script";
import type { CallState } from "../lib/call/types";

/** Plays turns 1..upTo through the real reducer, like the call screen does. */
function play(upTo: number, start = initialState(DEMO_CALL_1.setup)): CallState {
  let s = start;
  for (const line of DEMO_CALL_1.lines.slice(s.transcript.length, upTo)) {
    s = callReducer(s, { type: "deliver", line, update: replayFor(line.turn) });
  }
  return s;
}
const done = (s: CallState, id: string) => visibleChecklist(s).find((i) => i.id === id)?.done;

describe("Demo Call 1 replay vs 'What the tool should do'", () => {
  it("turn 1: self-identify checked", () => {
    expect(done(play(1), "S-01")).toBe(true);
  });

  it("turn 3: recording disclosure checked", () => {
    expect(done(play(3), "S-02")).toBe(true);
  });

  it("turns 4-5: identity checked only after the patient replies; DOB never stored", () => {
    expect(done(play(4), "S-03")).toBe(false);
    const s = play(5);
    expect(done(s, "S-03")).toBe(true);
    expect(JSON.stringify(s.form)).not.toMatch(/2002|January/i);
    expect(buildChartNote(s)).not.toMatch(/2002|January/i);
  });

  it("turns 6-7: drug recorded, consent only after the patient answers", () => {
    const at6 = play(6);
    expect(at6.form.drug).toBe("Dupixent");
    expect(at6.drugDetail).toBe("300 mg, every 2 weeks");
    expect(done(at6, "S-04")).toBe(false);
    const at7 = play(7);
    expect(done(at7, "S-04")).toBe(true);
    expect(at7.form.consent).toBe("doctor");
  });

  it("turn 9: missed dose, verbatim event, rules D1-01 and D1-MD, G-01 added red", () => {
    const s = play(9);
    expect(s.missedDose?.reason).toBe("last night I got out of work late");
    expect(s.missedDose?.schedule).toContain("every other week");
    expect(s.events).toHaveLength(1);
    expect(s.events[0].verbatim).toBe("I've also had some diarrhea");
    expect(s.events[0].label).toBe("Diarrhea");
    expect(s.form.events).toContain("I've also had some diarrhea");
    expect(s.matched.map((m) => m.ruleId).sort()).toEqual(["D1-01", "D1-MD"]);
    expect(done(s, "G-01")).toBe(false); // present in the list but not done
    expect(visibleChecklist(s).some((i) => i.id === "G-01")).toBe(true);
  });

  it("G-01 is hidden before any missed dose", () => {
    expect(visibleChecklist(play(8)).some((i) => i.id === "G-01")).toBe(false);
  });

  it("turns 10-13: duration and treatments recorded; still exactly one event", () => {
    const s = play(13);
    expect(s.events).toHaveLength(1);
    expect(s.events[0].duration).toContain("About a day");
    expect(s.events[0].treatmentsTried).toBe("Not really");
  });

  it("turn 14: intervention documented; G-01 stays open; no new event", () => {
    const s = play(14);
    expect(s.form.interventions).toContain("replacing fluids");
    expect(done(s, "G-01")).toBe(false);
    expect(s.events).toHaveLength(1);
  });

  it("turns 16-17: ER asked, none reported, seriousness defaulted by code", () => {
    const s = play(17);
    expect(done(s, "S-06")).toBe(true);
    expect(s.form.erOrHospital).toBe("none");
    expect(s.form.seriousness).toBe("non-serious");
    expect(s.seriousnessIsDefault).toBe(true);
  });

  it("turn 18: closing reminder checked", () => {
    expect(done(play(18), "S-05")).toBe(true);
  });

  it("end: all required steps done, adherence flagged as not covered", () => {
    const s = play(20);
    for (const id of ["S-01", "S-02", "S-03", "S-04", "S-05", "S-06"]) expect(done(s, id)).toBe(true);
    expect(done(s, "G-01")).toBe(false);
    const note = buildChartNote(s);
    expect(note).toContain("Adherence support (alarms, pill boxes, calendars) not covered");
    expect(note).toContain("Non-serious (default; pending pharmacist confirmation)");
    expect(note).toContain("contact doctor only");
    expect(note).toContain("Standardized: Diarrhea");
  });
});

describe("pharmacist edits", () => {
  it("AI updates never overwrite a field the pharmacist edited", () => {
    let s = play(9);
    s = callReducer(s, { type: "edit", field: "events", value: "My corrected wording" });
    s = play(13, s);
    expect(s.form.events).toBe("My corrected wording");
    expect(s.events[0].duration).toContain("About a day"); // structured data still updates
  });

  it("the pharmacist's seriousness choice is kept and clears the default flag", () => {
    let s = callReducer(play(16), { type: "edit", field: "seriousness", value: "serious" });
    s = play(17, s);
    expect(s.form.seriousness).toBe("serious");
    expect(s.seriousnessIsDefault).toBe(false);
  });

  it("an unknown rule ID or event ref is ignored with a warning", () => {
    let s = initialState(DEMO_CALL_1.setup);
    s = callReducer(s, {
      type: "deliver",
      line: DEMO_CALL_1.lines[8],
      update: { events: [{ ref: "new", verbatim: "x", ruleId: "D9-99" }, { ref: "e42", duration: "1 day" }] },
    });
    expect(s.events[0].ruleId).toBeNull();
    expect(s.warnings).toHaveLength(2);
  });

  it("G-01 cannot be completed before it is triggered", () => {
    const s = callReducer(initialState(DEMO_CALL_1.setup), {
      type: "deliver",
      line: DEMO_CALL_1.lines[13],
      update: { itemsCompleted: ["G-01"] },
    });
    expect(s.checklist["G-01"].done).toBe(false);
  });

  it("reset returns to a clean state", () => {
    const s = callReducer(play(20), { type: "reset", setup: DEMO_CALL_1.setup });
    expect(s).toEqual(initialState(DEMO_CALL_1.setup));
  });
});

describe("live-mode actions (hear + apply)", () => {
  it("hear then apply gives the same result as deliver", () => {
    let a = initialState(DEMO_CALL_1.setup);
    let b = initialState(DEMO_CALL_1.setup);
    for (const line of DEMO_CALL_1.lines.slice(0, 9)) {
      a = callReducer(a, { type: "deliver", line, update: replayFor(line.turn) });
      b = callReducer(b, { type: "hear", line });
      b = callReducer(b, { type: "apply", turn: line.turn, update: replayFor(line.turn) });
    }
    expect(b).toEqual(a);
  });

  it("the line is visible before its analysis arrives", () => {
    const s = callReducer(initialState(DEMO_CALL_1.setup), { type: "hear", line: DEMO_CALL_1.lines[0] });
    expect(s.transcript).toHaveLength(1);
    expect(done(s, "S-01")).toBe(false);
  });

  it("server warnings are kept for display", () => {
    const s = callReducer(initialState(DEMO_CALL_1.setup), {
      type: "apply", turn: 9, update: {}, warnings: ["Turn 9: something was dropped"],
    });
    expect(s.warnings).toEqual(["Turn 9: something was dropped"]);
  });
});
