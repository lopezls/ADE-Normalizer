import type { Line } from "@/lib/call/script";

export default function TranscriptStrip({ transcript }: { transcript: Line[] }) {
  return (
    <details open className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <summary className="cursor-pointer text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        What the AI heard
      </summary>
      <p className="mt-2 text-xs text-zinc-500">Shown for this session only. Never stored.</p>
      {transcript.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">Nothing yet. Start the call.</p>
      ) : (
        <ol className="mt-3 max-h-64 space-y-2 overflow-auto text-sm">
          {transcript.map((l) => (
            <li key={l.turn}>
              <span className="mr-1 text-xs text-zinc-500">{l.turn}.</span>
              <span className="font-medium capitalize">{l.speaker}:</span> {l.text}
            </li>
          ))}
        </ol>
      )}
    </details>
  );
}
