import { getDrugStats, type Count } from "@/lib/stats";

export const dynamic = "force-dynamic";

function CountList({ items, empty }: { items: Count[]; empty: string }) {
  if (items.length === 0)
    return <p className="text-sm text-zinc-500">{empty}</p>;
  return (
    <ul className="space-y-1 text-sm">
      {items.map((i) => (
        <li key={i.name} className="flex justify-between gap-4">
          <span>{i.name}</span>
          <span className="font-medium tabular-nums">{i.count}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function DataPage() {
  let stats;
  try {
    stats = await getDrugStats();
  } catch (err) {
    console.error("getDrugStats failed", err);
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-10">
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          Could not load data. Check the database connection.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Data</h1>
      <p className="mb-8 mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Encounters by drug and indication, with ADEs reported for each drug.
      </p>
      <div className="grid gap-5 md:grid-cols-2">
        {stats.map((s) => (
          <section
            key={s.drug}
            className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-lg font-semibold">{s.drug}</h2>
              <span className="text-sm text-zinc-500">
                {s.total} encounter{s.total === 1 ? "" : "s"}
              </span>
            </div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Indications
            </h3>
            <CountList items={s.indications} empty="No encounters yet" />
            <h3 className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              ADEs reported
            </h3>
            <CountList items={s.ades} empty="None reported yet" />
          </section>
        ))}
      </div>
    </main>
  );
}
