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
