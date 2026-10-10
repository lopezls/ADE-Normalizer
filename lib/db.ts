import { neon } from "@neondatabase/serverless";

function client() {
  // Vercel's Neon integration prefixes names (here STORAGE_), so accept both.
  const e = process.env;
  const url =
    e.STORAGE_URL ?? e.STORAGE_DATABASE_URL ?? e.DATABASE_URL ?? e.POSTGRES_URL;
  if (!url) throw new Error("Database URL (STORAGE_URL / DATABASE_URL) is not set");
  return neon(url);
}

let schemaReady: Promise<void> | null = null;

/** Creates tables on first use per server instance (idempotent). */
export function ensureSchema() {
  schemaReady ??= (async () => {
    const sql = client();
    await sql`
      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
        pt_hash TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await sql`
      CREATE TABLE IF NOT EXISTS encounters (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL REFERENCES patients(id),
        drug_name TEXT NOT NULL,
        therapy_start DATE,
        indication TEXT NOT NULL,
        med_changes BOOLEAN NOT NULL,
        med_changes_details TEXT NOT NULL DEFAULT '',
        events_reported TEXT NOT NULL DEFAULT '',
        interventions TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    // Added after first deploy; existing rows get ''.
    await sql`ALTER TABLE encounters ADD COLUMN IF NOT EXISTS ades TEXT NOT NULL DEFAULT ''`;
    // Audit data: who made the call, how it scored, and which steps were covered or missed.
    await sql`ALTER TABLE encounters ADD COLUMN IF NOT EXISTS rph_name TEXT NOT NULL DEFAULT ''`;
    await sql`ALTER TABLE encounters ADD COLUMN IF NOT EXISTS score_percent INTEGER`;
    await sql`ALTER TABLE encounters ADD COLUMN IF NOT EXISTS audit JSONB`;
    // Call-screen encounters have no patient ID (stage 1 never asks for one).
    await sql`ALTER TABLE encounters ALTER COLUMN patient_id DROP NOT NULL`;
  })().catch((e) => {
    schemaReady = null;
    throw e;
  });
  return schemaReady;
}

export function getSql() {
  return client();
}
