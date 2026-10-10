"use server";

import { ensureSchema, getSql } from "@/lib/db";
import { DRUGS, isValidPair } from "@/lib/drugs";
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
  /** Set when a record for this call already exists (made automatically at End call): update it instead of adding another. */
  encounterId?: number;
  /** Automatic save at End call: the indication may still be blank. Submit is always strict. */
  draft?: boolean;
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

  const valid = isValidPair(drugName, indication) || (input.draft === true && (DRUGS as string[]).includes(drugName) && indication === "");
  if (!valid) return { status: "error", message: "Select a valid drug and indication on the form first." };
  if (therapyStart && !/^\d{4}-\d{2}-\d{2}$/.test(therapyStart))
    return { status: "error", message: "Start of therapy is not a valid date." };

  try {
    await ensureSchema();
    const sql = getSql();
    const auditJson = audit.length ? JSON.stringify(audit) : null;
    const adesText = parseAdes(terms.join("\n"));

    // A record made at End call is updated in place (only call records, and only recent ones).
    const id = Number.isInteger(input.encounterId) ? (input.encounterId as number) : null;
    if (id !== null) {
      const updated = await sql`
        UPDATE encounters SET
          drug_name = ${drugName}, therapy_start = ${therapyStart || null}, indication = ${indication},
          med_changes = ${!!input.medChanges}, med_changes_details = ${medDetails},
          events_reported = ${eventsReported}, ades = ${adesText}, interventions = ${interventions},
          rph_name = ${rphName}, score_percent = ${scorePercent}, audit = ${auditJson}::jsonb
        WHERE id = ${id} AND patient_id IS NULL AND created_at > now() - interval '1 day'
        RETURNING id`;
      if (updated.length > 0) return { status: "success", encounterNumber: updated[0].id as number };
    }

    const inserted = await sql`
      INSERT INTO encounters
        (patient_id, drug_name, therapy_start, indication, med_changes,
         med_changes_details, events_reported, ades, interventions,
         rph_name, score_percent, audit)
      VALUES
        (NULL, ${drugName}, ${therapyStart || null}, ${indication}, ${!!input.medChanges},
         ${medDetails}, ${eventsReported},
         ${adesText}, ${interventions},
         ${rphName}, ${scorePercent}, ${auditJson}::jsonb)
      RETURNING id`;
    return { status: "success", encounterNumber: inserted[0].id as number };
  } catch (err) {
    console.error("saveCallEncounter failed", err);
    if (err instanceof Error && err.message.endsWith("is not set"))
      return { status: "error", message: `Server misconfigured: ${err.message}.` };
    return { status: "error", message: "Could not save the encounter. Please try again." };
  }
}
