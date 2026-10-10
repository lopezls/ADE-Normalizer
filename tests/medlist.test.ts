import { describe, expect, it } from "vitest";
import { buildChartNote, medListNote } from "../lib/call/chartNote";
import { callReducer, initialState } from "../lib/call/reducer";
import { DEMO_CALL_1 } from "../lib/call/script";

const fresh = () => initialState(DEMO_CALL_1.setup);

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
