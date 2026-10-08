import type { Line } from "@/lib/call/script";

type Props = {
  transcript: Line[];
  /** Optional note per turn, such as "read, ticked S-01" or why the AI could not read it. */
  status?: Record<number, string>;
  /** Microphone calls: lets the pharmacist correct who said a line. */
  onFlip?: (turn: number) => void;
};

export default function TranscriptStrip({ transcript, status = {}, onFlip }: Props) {
  return (
    <details open className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <summary className="cursor-pointer text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        What the AI heard
      </summary>
      <p className="mt-2 text-xs text-zinc-500">
        Shown for this session only. Never stored.
        {onFlip && " Wrong speaker on a line? Click its label to switch it; the AI then reads it again."}
      </p>
      {transcript.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">Nothing yet. Start the call.</p>
      ) : (
        <ol className="mt-3 max-h-64 space-y-2 overflow-auto text-sm">
          {transcript.map((l) => (
            <li key={l.turn}>
              <span className="mr-1 text-xs text-zinc-500">{l.turn}.</span>
              {onFlip ? (
                <button
                  type="button"
                  onClick={() => onFlip(l.turn)}
                  title="Wrong speaker? Click to switch and have the AI read this line again"
                  className="rounded-full bg-lime-100 px-2 py-0.5 text-xs font-medium capitalize text-zinc-900 hover:bg-lime-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  {l.speaker} ⇄
                </button>
              ) : (
                <span className="font-medium capitalize">{l.speaker}:</span>
              )}{" "}
              {l.text}
              {status[l.turn] && (
                <span
                  className={`ml-2 text-xs ${
                    status[l.turn].startsWith("could not")
                      ? "text-red-700 dark:text-red-300"
                      : "text-zinc-500"
                  }`}
                >
                  ({status[l.turn]})
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </details>
  );
}
