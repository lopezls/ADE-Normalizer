import type { CallEncounterInput } from "@/app/actions";
import { scoreCall } from "./score";
import type { CallState, EventRecord } from "./types";

/** One reviewed ADE row: what the patient said, and the standard term the pharmacist signs off on. */
export type AdeRow = { id: string; verbatim: string; term: string };

/**
 * Cleans a term the model returned. Returns null for anything that is not a short
 * plain symptom name, so a bad answer falls back to the patient's own words.
 */
export function cleanTerm(raw: string | null | undefined): string | null {
  const t = (raw ?? "").trim().toLowerCase().replace(/[.,;:!]+$/, "");
  if (!t || t.length > 40) return null;
  if (!/^[a-z][a-z' -]*$/.test(t)) return null;
  if (t.split(/\s+/).length > 4) return null;
  return t;
}

/** Used when the AI is not available or could not name the event: rule label, else the patient's words. */
export function fallbackTerm(e: Pick<EventRecord, "label" | "verbatim">): string {
  return cleanTerm(e.label) ?? e.verbatim;
}

export function initialRows(events: EventRecord[]): AdeRow[] {
  return events.map((e) => ({ id: e.id, verbatim: e.verbatim, term: fallbackTerm(e) }));
}

/**
 * Everything saved for a finished call. Used for the automatic save at End call (with the
 * unreviewed terms) and again at Submit (with the pharmacist's reviewed terms).
 */
export function buildEncounterInput(state: CallState, ades: string[]): CallEncounterInput {
  return {
    drugName: state.form.drug,
    indication: state.form.indication,
    therapyStart: state.form.therapyStart,
    medChanges: state.form.medChanges === "yes",
    medChangeList: state.medChangeList
      .filter((m) => m.name.trim())
      .map((m) => ({ name: m.name.trim(), action: m.action })),
    eventsReported: state.form.events,
    interventions: state.form.interventions,
    ades,
    rphName: state.form.rphName,
    audit: scoreCall(state).rows.map(({ id, label, done, extra }) => ({ id, label, done, extra })),
  };
}
