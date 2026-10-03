"use server";

import { ensureSchema, getSql } from "@/lib/db";
import { isValidPair } from "@/lib/drugs";
import {
  formatSummary,
  hashPatientId,
  type EncounterResult,
} from "@/lib/encounter";

export type FormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; result: EncounterResult };

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

export async function submitEncounter(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const input = {
    patientId: text(fd, "patientId"),
    drugName: text(fd, "drugName"),
    therapyStart: text(fd, "therapyStart"),
    indication: text(fd, "indication"),
    medChanges: text(fd, "medChanges") === "yes",
    medChangesDetails: text(fd, "medChangesDetails"),
    eventsReported: text(fd, "eventsReported"),
    interventions: text(fd, "interventions"),
  };

  if (!input.patientId) return { status: "error", message: "Patient ID is required." };
  if (!input.drugName) return { status: "error", message: "Drug name is required." };
  if (!input.indication) return { status: "error", message: "Indication is required." };
  if (!isValidPair(input.drugName, input.indication))
    return { status: "error", message: "Select a valid drug and indication." };
  if (input.therapyStart && !/^\d{4}-\d{2}-\d{2}$/.test(input.therapyStart))
    return { status: "error", message: "Start of therapy is not a valid date." };
  if (input.medChanges && !input.medChangesDetails)
    return { status: "error", message: "Describe the medication list changes." };

  try {
    await ensureSchema();
    const sql = getSql();
    const hash = hashPatientId(input.patientId);

    // SELECT first so the serial (masked number) doesn't skip on repeat patients.
    let rows = await sql`SELECT id FROM patients WHERE pt_hash = ${hash}`;
    if (rows.length === 0) {
      await sql`INSERT INTO patients (pt_hash) VALUES (${hash}) ON CONFLICT (pt_hash) DO NOTHING`;
      rows = await sql`SELECT id FROM patients WHERE pt_hash = ${hash}`;
    }
    const maskedPatient = rows[0].id as number;

    const inserted = await sql`
      INSERT INTO encounters
        (patient_id, drug_name, therapy_start, indication, med_changes,
         med_changes_details, events_reported, interventions)
      VALUES
        (${maskedPatient}, ${input.drugName}, ${input.therapyStart || null},
         ${input.indication}, ${input.medChanges},
         ${input.medChanges ? input.medChangesDetails : ""},
         ${input.eventsReported}, ${input.interventions})
      RETURNING id, created_at`;

    const createdAt = new Date(inserted[0].created_at as string);
    const encounterNumber = inserted[0].id as number;
    return {
      status: "success",
      result: {
        encounterNumber,
        maskedPatient,
        createdAt: createdAt.toISOString(),
        summary: formatSummary(input, maskedPatient, encounterNumber, createdAt),
      },
    };
  } catch (err) {
    console.error("submitEncounter failed", err);
    return { status: "error", message: "Could not save the encounter. Please try again." };
  }
}
