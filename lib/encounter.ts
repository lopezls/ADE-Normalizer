import { createHmac } from "node:crypto";

export type EncounterInput = {
  patientId: string;
  drugName: string;
  therapyStart: string;
  indication: string;
  medChanges: boolean;
  eventsReported: string;
  interventions: string;
};

export type EncounterResult = {
  encounterNumber: number;
  maskedPatient: number;
  createdAt: string;
  summary: string;
};

/** One-way hash of the real patient ID so the raw ID is never stored. */
export function hashPatientId(raw: string) {
  const secret = process.env.PATIENT_ID_SECRET;
  if (!secret) throw new Error("PATIENT_ID_SECRET is not set");
  const normalized = raw.trim().toLowerCase().replace(/\s+/g, "");
  return createHmac("sha256", secret).update(normalized).digest("hex");
}

export function formatSummary(
  e: EncounterInput,
  maskedPatient: number,
  encounterNumber: number,
  createdAt: Date,
) {
  const dash = (s: string) => s.trim() || "None reported";
  return [
    `ENCOUNTER #${encounterNumber}`,
    `Date: ${createdAt.toLocaleDateString("en-US", { timeZone: "America/New_York" })}`,
    `Patient: ${maskedPatient}`,
    `Drug: ${e.drugName}`,
    `Start of therapy: ${e.therapyStart || "Not specified"}`,
    `Indication: ${e.indication}`,
    `Medication list changes: ${medListStatus(e.medChanges)}`,
    `Events reported by patient: ${dash(e.eventsReported)}`,
    `ADEs (parsed): ${parseAdes(e.eventsReported) || "None"}`,
    `Interventions provided: ${dash(e.interventions)}`,
  ].join("\n");
}

/**
 * Splits the events field on "-" (or new lines), then normalizes each ADE:
 * lowercase, letters/digits only (no spaces). Duplicates dropped, order kept.
 * Returned dash-joined, e.g. "Nausea - Hair loss" -> "nausea-hairloss".
 */
export function parseAdes(raw: string) {
  const ades = raw
    .split(/[-\n]/)
    .map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, ""))
    .filter(Boolean);
  return [...new Set(ades)].join("-");
}

/** What gets stored in med_changes_details and shown in the note. */
export function medListStatus(changed: boolean) {
  return changed ? "updated" : "confirmed";
}
