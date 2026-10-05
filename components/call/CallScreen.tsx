"use client";

import { useEffect, useState } from "react";
import { DEMO_CALL_1, lineDelayMs } from "@/lib/call/script";
import ChecklistPanel from "./ChecklistPanel";
import EncounterPanel from "./EncounterPanel";
import RecommendationsPanel from "./RecommendationsPanel";
import TranscriptStrip from "./TranscriptStrip";
import { SAMPLE_CHECKLIST } from "./sampleData";

const script = DEMO_CALL_1;
const btn =
  "rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800";

export default function CallScreen() {
  // Lines delivered so far. Lives in memory only; a refresh clears it.
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);

  const finished = cursor >= script.lines.length;
  const transcript = script.lines.slice(0, cursor);
  const running = playing && !finished; // autoplay stops by itself after the last line

  // Autoplay: deliver the next line after a short, length-based delay.
  useEffect(() => {
    if (!running) return;
    // The first line appears right away; later ones wait as if the last was spoken.
    const delay = cursor === 0 ? 300 : lineDelayMs(script.lines[cursor - 1]);
    const t = setTimeout(() => setCursor(cursor + 1), delay);
    return () => clearTimeout(t);
  }, [running, cursor]);

  // Checklist is all open until analysis exists (later step); conditional item hidden.
  const items = SAMPLE_CHECKLIST.filter((i) => !i.conditional).map((i) => ({ ...i, done: false }));

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Live Call</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {script.title}. Fictional scripted call.
          </p>
          <p className="mt-1 text-xs text-zinc-500" role="status">
            Line {cursor} of {script.lines.length}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {running ? (
            <button type="button" className={btn} onClick={() => setPlaying(false)}>
              Pause
            </button>
          ) : (
            <button
              type="button"
              className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
              disabled={finished}
              onClick={() => setPlaying(true)}
            >
              {cursor === 0 ? "Start call" : "Resume"}
            </button>
          )}
          <button
            type="button"
            className={btn}
            disabled={running || finished}
            onClick={() => setCursor((c) => c + 1)}
          >
            Next line
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => {
              setPlaying(false);
              setCursor(0);
            }}
          >
            Reset
          </button>
          <button
            type="button"
            disabled
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            End call
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)]">
        <ChecklistPanel items={items} />
        <div className="space-y-4">
          <EncounterPanel />
          <TranscriptStrip transcript={transcript} />
        </div>
        <RecommendationsPanel rules={[]} />
      </div>
    </main>
  );
}
