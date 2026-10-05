import type { SAMPLE_TRANSCRIPT } from "./sampleData";

export default function TranscriptStrip({
  transcript,
}: {
  transcript: typeof SAMPLE_TRANSCRIPT;
}) {
  return (
    <details className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <summary className="cursor-pointer text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        What the AI heard
      </summary>
      <p className="mt-2 text-xs text-zinc-500">Shown for this session only. Never stored.</p>
      <ol className="mt-3 space-y-2 text-sm">
        {transcript.map((l, idx) => (
          <li key={idx}>
            <span className="font-medium">{l.speaker}:</span> {l.text}
          </li>
        ))}
      </ol>
    </details>
  );
}
