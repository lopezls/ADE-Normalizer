import { scoreCall } from "@/lib/call/score";
import type { CallState } from "@/lib/call/types";

export default function ScorePanel({ state }: { state: CallState }) {
  const shell = "rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900";
  const heading = (
    <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Call score</h2>
  );

  if (!state.ended) {
    return (
      <section aria-label="Call score" className={shell}>
        {heading}
        <p className="mt-2 text-sm text-zinc-500">The score appears when the call ends.</p>
      </section>
    );
  }

  const score = scoreCall(state);
  const missed = score.rows.filter((r) => !r.done);
  const tone = score.passed
    ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
    : "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200";

  return (
    <section aria-label="Call score" className={shell}>
      {heading}
      <div className={`mt-3 rounded-xl px-4 py-3 ${tone}`} role="status">
        <p className="text-4xl font-semibold tabular-nums">{score.percent}%</p>
        <p className="text-sm font-medium">
          {score.earned} of {score.possible} points · {score.passed ? "Meets the 90% goal" : "Below the 90% goal"}
        </p>
      </div>

      {missed.length > 0 && (
        <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
          Missed: {missed.map((m) => `${m.label} (−${m.points})`).join("; ")}
        </p>
      )}

      <ul className="mt-3 space-y-1 text-sm">
        {score.rows.map((r) => (
          <li key={r.id} className="flex items-start justify-between gap-3">
            <span>
              <span aria-hidden>{r.done ? "✓" : "✗"}</span>
              <span className="sr-only">{r.done ? "Covered: " : "Missed: "}</span> {r.label}
              {r.extra && <span className="ml-1 text-xs text-zinc-500">(added by this call)</span>}
            </span>
            <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
              {r.done ? r.points : 0}/{r.points}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
