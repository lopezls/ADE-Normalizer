"use server";

import { ensureSchema, getSql } from "@/lib/db";
import { isValidPair } from "@/lib/drugs";
import { medListStatus, parseAdes } from "@/lib/encounter";
import { percentOf, type AuditRow } from "@/lib/call/score";

export type CallEncounterInput = {
  drugName: string;
  indication: string;
  therapyStart: string;
  medChanges: boolean;
  /** Medicines started or stopped; only used when medChanges is true. */
  medChangeList: { name: string; action: "started" | "stopped" }[];
  eventsReported: string;
  interventions: string;
  /** Pharmacist-reviewed standard terms, one per ADE. */
  ades: string[];
  rphName: string;
  /** Every scored step of the call and whether it was covered. The percentage is recomputed here. */
  audit: AuditRow[];
};

export type SaveCallState =
  | { status: "error"; message: string }
  | { status: "success"; encounterNumber: number };

/** Saves a finished call. No patient ID: the call screen never collects one. */
export async function saveCallEncounter(input: CallEncounterInput): Promise<SaveCallState> {
  const drugName = String(input.drugName ?? "").trim();
  const indication = String(input.indication ?? "").trim();
  const therapyStart = String(input.therapyStart ?? "").trim();
  const eventsReported = String(input.eventsReported ?? "").trim().slice(0, 4000);
  const interventions = String(input.interventions ?? "").trim().slice(0, 4000);
  const terms = Array.isArray(input.ades)
    ? input.ades.slice(0, 20).map((a) => String(a).trim().slice(0, 100).replace(/-/g, " "))
    : [];

  const meds = (Array.isArray(input.medChangeList) ? input.medChangeList : [])
    .slice(0, 20)
    .map((m) => ({
      name: String(m.name ?? "").trim().slice(0, 100),
      action: m.action === "stopped" ? "stopped" : "started",
    }))
    .filter((m) => m.name);
  // Stored in med_changes_details: "confirmed", or "updated: Name (started); ..."
  const medDetails = input.medChanges
    ? meds.length
      ? `updated: ${meds.map((m) => `${m.name} (${m.action})`).join("; ")}`
      : medListStatus(true)
    : medListStatus(false);

  const rphName = String(input.rphName ?? "").trim().slice(0, 60);
  const audit: AuditRow[] = (Array.isArray(input.audit) ? input.audit : []).slice(0, 30).map((r) => ({
    id: String(r.id ?? "").slice(0, 10),
    label: String(r.label ?? "").slice(0, 120),
    done: r.done === true,
    extra: r.extra === true,
  }));
  const scorePercent = audit.length ? percentOf(audit) : null;

  if (!isValidPair(drugName, indication))
    return { status: "error", message: "Select a valid drug and indication on the form first." };
  if (therapyStart && !/^\d{4}-\d{2}-\d{2}$/.test(therapyStart))
    return { status: "error", message: "Start of therapy is not a valid date." };

  try {
    await ensureSchema();
    const sql = getSql();
    const inserted = await sql`
      INSERT INTO encounters
        (patient_id, drug_name, therapy_start, indication, med_changes,
         med_changes_details, events_reported, ades, interventions,
         rph_name, score_percent, audit)
      VALUES
        (NULL, ${drugName}, ${therapyStart || null}, ${indication}, ${!!input.medChanges},
         ${medDetails}, ${eventsReported},
         ${parseAdes(terms.join("\n"))}, ${interventions},
         ${rphName}, ${scorePercent}, ${audit.length ? JSON.stringify(audit) : null}::jsonb)
      RETURNING id`;
    return { status: "success", encounterNumber: inserted[0].id as number };
  } catch (err) {
    console.error("saveCallEncounter failed", err);
    if (err instanceof Error && err.message.endsWith("is not set"))
      return { status: "error", message: `Server misconfigured: ${err.message}.` };
    return { status: "error", message: "Could not save the encounter. Please try again." };
  }
}
