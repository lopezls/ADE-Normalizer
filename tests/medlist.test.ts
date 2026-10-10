import { describe, expect, it } from "vitest";
import { buildChartNote, medListNote } from "../lib/call/chartNote";
import { callReducer, initialState } from "../lib/call/reducer";
import { DEMO_CALL_1 } from "../lib/call/script";

const fresh = () => initialState(DEMO_CALL_1.setup);

describe("medication list changes from the AI", () => {
  const line = DEMO_CALL_1.lines[6]; // a patient line
  it("sets the radio to yes and adds a row for each medicine the patient reports", () => {
    const s = callReducer(fresh(), {
      type: "deliver",
      line,
      update: { medChanges: [{ name: "metformin", action: "started" }, { name: "Zyrtec", action: "stopped" }] },
    });
    expect(s.form.medChanges).toBe("yes");
    expect(s.aiFilled.medChanges).toBe(true);
    expect(s.medChangeList.map((m) => [m.name, m.action])).toEqual([["metformin", "started"], ["Zyrtec", "stopped"]]);
    expect(buildChartNote(s)).toContain("Changes reported: metformin (started); Zyrtec (stopped).");
  });

  it("does not add the same medicine twice", () => {
    let s = callReducer(fresh(), { type: "deliver", line, update: { medChanges: [{ name: "Metformin", action: "started" }] } });
    s = callReducer(s, { type: "apply", turn: 8, update: { medChanges: [{ name: "metformin", action: "started" }] } });
    expect(s.medChangeList).toHaveLength(1);
  });

  it("leaves the form alone once the pharmacist has answered the question", () => {
    let s = callReducer(fresh(), { type: "edit", field: "medChanges", value: "no" });
    s = callReducer(s, { type: "deliver", line, update: { medChanges: [{ name: "metformin", action: "started" }] } });
    expect(s.form.medChanges).toBe("no");
    expect(s.medChangeList).toHaveLength(0);
  });
});

describe("medication list changes", () => {
  it("says no changes by default", () => {
    expect(medListNote(fresh())).toBe("No changes reported.");
    expect(buildChartNote(fresh())).toContain("Medication list: No changes reported.");
  });

  it("adds, edits and removes entries", () => {
    let s = callReducer(fresh(), { type: "medAdd", id: "a" });
    s = callReducer(s, { type: "medAdd", id: "b" });
    s = callReducer(s, { type: "medEdit", id: "a", patch: { name: "Metformin" } });
    s = callReducer(s, { type: "medEdit", id: "b", patch: { name: "Lisinopril", action: "stopped" } });
    expect(s.medChangeList).toEqual([
      { id: "a", name: "Metformin", action: "started" },
      { id: "b", name: "Lisinopril", action: "stopped" },
    ]);
    s = callReducer(s, { type: "medRemove", id: "a" });
    expect(s.medChangeList.map((m) => m.id)).toEqual(["b"]);
  });

  it("lists medicines in the note only when the answer is yes", () => {
    let s = callReducer(fresh(), { type: "medAdd", id: "a" });
    s = callReducer(s, { type: "medEdit", id: "a", patch: { name: "Metformin" } });
    expect(medListNote(s)).toBe("No changes reported.");
    s = callReducer(s, { type: "edit", field: "medChanges", value: "yes" });
    expect(medListNote(s)).toBe("Changes reported: Metformin (started).");
  });

  it("says so when yes was chosen but no medicine was entered", () => {
    const s = callReducer(fresh(), { type: "edit", field: "medChanges", value: "yes" });
    expect(medListNote(s)).toBe("Changes reported (medicines not entered).");
  });
});
