import { neon } from "@neondatabase/serverless";

function client() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
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
  })().catch((e) => {
    schemaReady = null;
    throw e;
  });
  return schemaReady;
}

export function getSql() {
  return client();
}
