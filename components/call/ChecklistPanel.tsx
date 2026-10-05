import type { ChecklistItem } from "@/lib/call/checklist";

export default function ChecklistPanel({ items }: { items: ChecklistItem[] }) {
  return (
    <section aria-labelledby="checklist-h" className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 id="checklist-h" className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Checklist
      </h2>
      <ul aria-live="polite" className="space-y-2">
        {items.map((i) => (
          <li
            key={i.id}
            className={`rounded-md border-l-4 px-3 py-2 text-sm ${
              i.done
                ? "border-green-600 bg-green-50 text-green-950 dark:bg-green-950/40 dark:text-green-100"
                : "border-red-600 bg-red-50 text-red-950 dark:bg-red-950/40 dark:text-red-100"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span>{i.label}</span>
              <span className="shrink-0 font-semibold">
                {i.done ? "✓ Done" : "✗ Not done"}
              </span>
            </div>
            <div className="mt-0.5 text-xs opacity-70">
              {i.id}
              {i.conditional && " · added because a missed dose was reported"}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
