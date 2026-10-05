import type { SAMPLE_RECOMMENDATION } from "./sampleData";

export default function RecommendationsPanel({
  recommendations,
}: {
  recommendations: (typeof SAMPLE_RECOMMENDATION)[];
}) {
  return (
    <section aria-labelledby="recs-h" className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 id="recs-h" className="mb-1 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Recommendations
      </h2>
      <p className="mb-3 text-xs text-zinc-500">
        Talking points for you to use or ignore, in your own words.
      </p>
      <div aria-live="polite" className="space-y-3">
        {recommendations.length === 0 && (
          <p className="text-sm text-zinc-500">Nothing matched yet.</p>
        )}
        {recommendations.map((r) => (
          <article key={r.ruleId} className="rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-700">
            <div className="mb-1 flex items-center justify-between gap-2">
              <h3 className="font-semibold">{r.label}</h3>
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
                Rule {r.ruleId}
              </span>
            </div>
            <p>{r.text}</p>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              <span className="font-medium">Contact the doctor when:</span> {r.contactWhen}
            </p>
            <p className="mt-1 text-xs text-zinc-500">Source: {r.source}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
