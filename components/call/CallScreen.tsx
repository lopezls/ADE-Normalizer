"use client";

import { useEffect, useReducer, useState } from "react";
import { visibleChecklist } from "@/lib/call/checklist";
import { callReducer, initialState } from "@/lib/call/reducer";
import { replayFor } from "@/lib/call/replay";
import { getRule, type Rule } from "@/lib/call/rules";
import { DEMO_CALL_1, lineDelayMs } from "@/lib/call/script";
import ChecklistPanel from "./ChecklistPanel";
import EncounterPanel from "./EncounterPanel";
import RecommendationsPanel from "./RecommendationsPanel";
import ReviewPanel from "./ReviewPanel";
import TranscriptStrip from "./TranscriptStrip";

const script = DEMO_CALL_1;
const btn =
  "rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800";
const primary =
  "rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50";

export default function CallScreen() {
  // Everything about the call lives in browser memory only. A refresh clears it.
  const [state, dispatch] = useReducer(callReducer, script.setup, initialState);
  const [playing, setPlaying] = useState(false);

  const cursor = state.transcript.length;
  const finished = cursor >= script.lines.length;
  const running = playing && !finished && !state.ended;

  // Stage 1 / step 5: the "AI" is a recorded replay. Step 6-7 swap in the real analyzer.
  function deliverNext() {
    const line = script.lines[cursor];
    if (line) dispatch({ type: "deliver", line, update: replayFor(line.turn) });
  }

  useEffect(() => {
    if (!running) return;
    const delay = cursor === 0 ? 300 : lineDelayMs(script.lines[cursor - 1]);
    const t = setTimeout(() => {
      const line = script.lines[cursor];
      dispatch({ type: "deliver", line, update: replayFor(line.turn) });
    }, delay);
    return () => clearTimeout(t);
  }, [running, cursor]);

  const rules = state.matched
    .map((m) => getRule(m.ruleId))
    .filter((r): r is Rule => r !== undefined);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Live Call</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {script.title}. Fictional scripted call. AI results are a recorded replay for now.
          </p>
          <p className="mt-1 text-xs text-zinc-500" role="status">
            {state.ended ? "Call ended. " : ""}Line {cursor} of {script.lines.length}
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
              className={primary}
              disabled={finished || state.ended}
              onClick={() => setPlaying(true)}
            >
              {cursor === 0 ? "Start call" : "Resume"}
            </button>
          )}
          <button
            type="button"
            className={btn}
            disabled={running || finished || state.ended}
            onClick={deliverNext}
          >
            Next line
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => {
              setPlaying(false);
              dispatch({ type: "reset", setup: script.setup });
            }}
          >
            Reset
          </button>
          <button
            type="button"
            className={primary}
            disabled={cursor === 0 || state.ended}
            onClick={() => {
              setPlaying(false);
              dispatch({ type: "end" });
            }}
          >
            End call
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)]">
        <ChecklistPanel items={visibleChecklist(state)} />
        <div className="space-y-4">
          <EncounterPanel
            state={state}
            onEdit={(field, value) => dispatch({ type: "edit", field, value })}
          />
          <TranscriptStrip transcript={state.transcript} />
        </div>
        <RecommendationsPanel rules={rules} />
      </div>

      {state.ended && (
        <ReviewPanel
          state={state}
          onConfirmSeriousness={(value) => dispatch({ type: "confirmSeriousness", value })}
        />
      )}
    </main>
  );
}
