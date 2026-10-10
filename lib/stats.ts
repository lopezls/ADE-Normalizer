import { ensureSchema, getSql } from "@/lib/db";
import { DRUGS, DRUG_INDICATIONS } from "@/lib/drugs";

export type Count = { name: string; count: number };
export type DrugStats = {
  drug: string;
  total: number;
  indications: Count[];
  ades: Count[];
};

export async function getDrugStats(): Promise<DrugStats[]> {
  await ensureSchema();
  const sql = getSql();

  const byIndication = await sql`
    SELECT drug_name, indication, count(*)::int AS n
    FROM encounters GROUP BY drug_name, indication`;
  const adeRows = await sql`SELECT drug_name, ades FROM encounters WHERE ades <> ''`;

  const indCounts = new Map<string, number>();
  for (const r of byIndication) indCounts.set(`${r.drug_name}|${r.indication}`, r.n as number);

  const adeCounts = new Map<string, Map<string, number>>();
  for (const r of adeRows) {
    const m = adeCounts.get(r.drug_name as string) ?? new Map<string, number>();
    for (const ade of (r.ades as string).split("-").filter(Boolean))
      m.set(ade, (m.get(ade) ?? 0) + 1);
    adeCounts.set(r.drug_name as string, m);
  }

  return DRUGS.map((drug) => {
    const indications = DRUG_INDICATIONS[drug].map((name) => ({
      name,
      count: indCounts.get(`${drug}|${name}`) ?? 0,
    }));
    const ades = [...(adeCounts.get(drug) ?? [])]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    return {
      drug,
      total: indications.reduce((s, i) => s + i.count, 0),
      indications,
      ades,
    };
  });
}

export type MissedStep = { id: string; label: string; missed: number; applicable: number };
export type RphStat = { name: string; calls: number; avgPercent: number };
export type AuditStats = {
  calls: number;
  avgPercent: number;
  byRph: RphStat[];
  /** Steps ranked by how often they were missed (only steps missed at least once). */
  missed: MissedStep[];
};

type StoredStep = { id: string; label: string; done: boolean };

/** Pure part: turns stored call rows into the audit summary. */
export function summarizeAudit(
  rows: { rph_name: string; score_percent: number; audit: StoredStep[] | null }[],
): AuditStats {
  const byRph = new Map<string, { sum: number; n: number }>();
  const steps = new Map<string, MissedStep>();
  let sum = 0;

  for (const r of rows) {
    sum += r.score_percent;
    const name = r.rph_name.trim() || "(name not recorded)";
    const p = byRph.get(name) ?? { sum: 0, n: 0 };
    byRph.set(name, { sum: p.sum + r.score_percent, n: p.n + 1 });

    for (const step of r.audit ?? []) {
      const s = steps.get(step.id) ?? { id: step.id, label: step.label, missed: 0, applicable: 0 };
      s.applicable += 1;
      if (!step.done) s.missed += 1;
      steps.set(step.id, s);
    }
  }

  return {
    calls: rows.length,
    avgPercent: rows.length ? Math.round(sum / rows.length) : 0,
    byRph: [...byRph]
      .map(([name, v]) => ({ name, calls: v.n, avgPercent: Math.round(v.sum / v.n) }))
      .sort((a, b) => b.calls - a.calls || a.name.localeCompare(b.name)),
    missed: [...steps.values()]
      .filter((s) => s.missed > 0)
      .sort((a, b) => b.missed - a.missed || b.missed / b.applicable - a.missed / a.applicable),
  };
}

export async function getAuditStats(): Promise<AuditStats> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT rph_name, score_percent, audit FROM encounters WHERE score_percent IS NOT NULL`;
  return summarizeAudit(rows as { rph_name: string; score_percent: number; audit: StoredStep[] | null }[]);
}
