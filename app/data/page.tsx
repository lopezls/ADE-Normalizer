import { getAuditStats, getDrugStats, type AuditStats, type Count } from "@/lib/stats";
import { PASS_PERCENT } from "@/lib/call/score";

export const dynamic = "force-dynamic";

function CountList({ items, empty, bars = false }: { items: Count[]; empty: string; bars?: boolean }) {
  if (items.length === 0)
    return <p className="text-sm text-zinc-500">{empty}</p>;
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <ul className="space-y-2 text-sm">
      {items.map((i) => (
        <li key={i.name}>
          <div className="flex justify-between gap-4">
            <span>{i.name}</span>
            <span className="font-medium tabular-nums">{i.count}</span>
          </div>
          {bars && (
            // Decorative: the name and count above carry the information.
            <div aria-hidden className="mt-1 h-2 rounded-full bg-lime-100 dark:bg-zinc-800">
              <div
                className="h-2 rounded-full bg-emerald-700 dark:bg-lime-300"
                style={{ width: `${(i.count / max) * 100}%` }}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function scoreTone(percent: number) {
  return percent >= PASS_PERCENT
    ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
    : "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200";
}

function AuditSection({ audit }: { audit: AuditStats }) {
  const card = "mb-5 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900";
  const h3 = "mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500";
  if (audit.calls === 0)
    return (
      <section className={card}>
        <h2 className="text-lg font-semibold">Pharmacist audit</h2>
        <p className="mt-2 text-sm text-zinc-500">No scored calls yet. Submit a finished call to start the audit.</p>
      </section>
    );
  const maxMissed = Math.max(...audit.missed.map((m) => m.missed), 1);
  return (
    <section className={card}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Pharmacist audit</h2>
        <div className={`rounded-xl px-4 py-2 ${scoreTone(audit.avgPercent)}`}>
          <span className="text-2xl font-semibold tabular-nums">{audit.avgPercent}%</span>{" "}
          <span className="text-sm font-medium">
            average over {audit.calls} call{audit.calls === 1 ? "" : "s"} ·{" "}
            {audit.avgPercent >= PASS_PERCENT ? "meets" : "below"} the {PASS_PERCENT}% goal
          </span>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className={h3}>Most often missed</h3>
          {audit.missed.length === 0 ? (
            <p className="text-sm text-zinc-500">Nothing missed so far.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {audit.missed.map((m) => (
                <li key={m.id}>
                  <div className="flex justify-between gap-4">
                    <span>{m.label}</span>
                    <span className="font-medium tabular-nums">
                      {m.missed} of {m.applicable} ({Math.round((m.missed / m.applicable) * 100)}%)
                    </span>
                  </div>
                  <div aria-hidden className="mt-1 h-2 rounded-full bg-red-100 dark:bg-zinc-800">
                    <div
                      className="h-2 rounded-full bg-red-600 dark:bg-red-400"
                      style={{ width: `${(m.missed / maxMissed) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className={h3}>By pharmacist</h3>
          <ul className="space-y-1 text-sm">
            {audit.byRph.map((r) => (
              <li key={r.name} className="flex items-center justify-between gap-4">
                <span>
                  {r.name}{" "}
                  <span className="text-xs text-zinc-500">
                    ({r.calls} call{r.calls === 1 ? "" : "s"})
                  </span>
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${scoreTone(r.avgPercent)}`}
                >
                  {r.avgPercent}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default async function DataPage() {
  let stats;
  let audit;
  try {
    [stats, audit] = await Promise.all([getDrugStats(), getAuditStats()]);
  } catch (err) {
    console.error("getDrugStats failed", err);
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-10">
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          Could not load data. Check the database connection.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-4xl font-normal tracking-tight"><span className="highlight">Data</span></h1>
      <p className="mb-8 mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Encounters by drug and indication, with ADEs reported for each drug.
      </p>
      <AuditSection audit={audit} />
      <div className="grid gap-5 md:grid-cols-2">
        {stats.map((s) => (
          <section
            key={s.drug}
            className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
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
            <CountList items={s.ades} empty="None reported yet" bars />
          </section>
        ))}
      </div>
    </main>
  );
}
