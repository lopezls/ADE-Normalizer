import { itemLabel } from "./checklist";
import { ITEM_IDS, type CallState, type ItemId } from "./types";

const CONSENT: Record<string, string> = {
  patient: "contact patient",
  doctor: "contact doctor only",
  either: "contact either patient or doctor",
  none: "no contact",
};
const ER: Record<string, string> = {
  none: "No ER visit or hospitalization reported.",
  er: "Patient reported an ER visit.",
  hospitalized: "Patient reported hospitalization.",
  unclear: "ER / hospitalization answer unclear.",
};

/** Fixed template, no model call: the same state always gives the same note. */
export function buildChartNote(s: CallState): string {
  const done = (id: ItemId) => s.checklist[id].done;
  const parts: string[] = [];

  const doneSteps = ITEM_IDS.filter((id) => id.startsWith("S-") && done(id)).map((id) =>
    itemLabel(id),
  );
  parts.push(`Call steps completed: ${doneSteps.length ? doneSteps.join("; ") : "none documented"}.`);

  const drug = [s.form.drug, s.drugDetail].filter(Boolean).join(", ");
  parts.push(`Drug: ${drug || "Not documented"}${s.form.indication ? ` (${s.form.indication})` : ""}.`);

  parts.push(`Consent: ${s.form.consent ? CONSENT[s.form.consent] : "Not documented"}.`);

  if (s.form.events.trim()) {
    const labels = s.events.map((e) => e.label ?? "no rule matched; pharmacist to assess");
    parts.push(
      `Events reported (patient's words):\n${s.form.events.trim()}\nStandardized: ${labels.join("; ") || "pharmacist to assess"}.`,
    );
  } else {
    parts.push("Events reported: None reported.");
  }

  parts.push(s.form.erOrHospital ? ER[s.form.erOrHospital] : "ER / hospitalization: not asked.");

  const sev = s.form.seriousness
    ? `${s.form.seriousness === "serious" ? "Serious" : "Non-serious"}${
        s.seriousnessIsDefault && !s.seriousnessConfirmed ? " (default; pending pharmacist confirmation)" : ""
      }`
    : "Pharmacist to assess";
  parts.push(`Seriousness: ${sev}.`);

  if (s.form.missedDose.trim()) parts.push(`Missed dose: ${s.form.missedDose.trim()}.`);

  parts.push(
    `Intervention provided: ${s.form.interventions.trim() ? s.form.interventions.trim() : "None documented"}`,
  );

  const flags: string[] = [];
  for (const id of ITEM_IDS) {
    if (done(id)) continue;
    if (id === "G-01") {
      if (s.checklist["G-01"].triggeredAtTurn !== undefined)
        flags.push("Adherence support (alarms, pill boxes, calendars) not covered after reported missed dose.");
    } else {
      flags.push(`Not documented: ${itemLabel(id)}.`);
    }
  }
  if (flags.length) parts.push(`Flags:\n- ${flags.join("\n- ")}`);

  return parts.join("\n\n");
}
