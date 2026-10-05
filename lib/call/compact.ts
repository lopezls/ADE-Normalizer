import type { CompactState } from "./schema";
import { ITEM_IDS, type CallState } from "./types";

/** What the server needs to know about the call so far. No transcript. */
export function compactState(s: CallState): CompactState {
  return {
    doneItems: ITEM_IDS.filter((id) => s.checklist[id].done),
    missedDoseReported: s.missedDose !== null,
    consent: s.form.consent,
    erOrHospital: s.form.erOrHospital,
    events: s.events.map((e) => ({ id: e.id, verbatim: e.verbatim.slice(0, 300), ruleId: e.ruleId })),
  };
}
