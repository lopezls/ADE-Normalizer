"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { visibleChecklist } from "@/lib/call/checklist";
import { analyzeRemote } from "@/lib/call/client";
import { callReducer, initialState } from "@/lib/call/reducer";
import { replayFor } from "@/lib/call/replay";
import { getRule, type Rule } from "@/lib/call/rules";
import { DEMO_CALL_1, lineDelayMs, type Line } from "@/lib/call/script";
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

type Mode = "live" | "replay";

export default function CallScreen() {
  // Everything about the call lives in browser memory only. A refresh clears it.
  const [state, dispatch] = useReducer(callReducer, script.setup, initialState);
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState<Mode>("live");
  const [pending, setPending] = useState<number | null>(null); // turn being analyzed
  const [failed, setFailed] = useState<{ turn: number; message: string } | null>(null);

  // The latest state, readable from async code without stale closures.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  // Bumped on reset so an answer that arrives after a reset is ignored.
  const runId = useRef(0);

  const cursor = state.transcript.length;
  const finished = cursor >= script.lines.length;
  const busy = pending !== null || failed !== null;
  const running = playing && !finished && !state.ended && !busy;

  async function analyze(line: Line) {
    const myRun = runId.current;
    setFailed(null);
    setPending(line.turn);
    try {
      if (mode === "replay") {
        dispatch({ type: "apply", turn: line.turn, update: replayFor(line.turn) });
      } else {
        const s = stateRef.current;
        const result = await analyzeRemote(line, s.transcript, s);
        if (myRun !== runId.current) return;
        dispatch({ type: "apply", turn: line.turn, update: result.update, warnings: result.warnings });
      }
      setPending(null);
    } catch (err) {
      if (myRun !== runId.current) return;
      setPending(null);
      setPlaying(false);
      setFailed({ turn: line.turn, message: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  function deliverNext() {
    const line = script.lines[stateRef.current.transcript.length];
    if (!line) return;
    dispatch({ type: "hear", line });
    void analyze(line);
  }

  // Autoplay: deliver the next line after a short, length-based pause.
  // It waits while a line is still being analyzed or has failed.
  useEffect(() => {
    if (!running) return;
    const delay = cursor === 0 ? 300 : lineDelayMs(script.lines[cursor - 1]);
    const t = setTimeout(deliverNext, delay);
    return () => clearTimeout(t);
    // deliverNext only reads refs and the chosen mode
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, cursor]);

  const rules = state.matched
    .map((m) => getRule(m.ruleId))
    .filter((r): r is Rule => r !== undefined);

  const failedLine = failed ? script.lines.find((l) => l.turn === failed.turn) : undefined;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Live Call</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {script.title}. Fictional scripted call.
          </p>
          <p className="mt-1 text-xs text-zinc-500" role="status">
            {state.ended ? "Call ended. " : ""}Line {cursor} of {script.lines.length}
            {pending !== null && ` · AI is reading line ${pending}…`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <fieldset className="mr-2 flex items-center gap-3 text-sm" disabled={cursor > 0}>
            <legend className="sr-only">Where the analysis comes from</legend>
            {(
              [
                ["live", "Live AI"],
                ["replay", "Replay (no API)"],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex items-center gap-1.5">
                <input type="radio" name="mode" checked={mode === value} onChange={() => setMode(value)} />
                {label}
              </label>
            ))}
          </fieldset>
          {running ? (
            <button type="button" className={btn} onClick={() => setPlaying(false)}>
              Pause
            </button>
          ) : (
            <button
              type="button"
              className={primary}
              disabled={finished || state.ended || busy}
              onClick={() => setPlaying(true)}
            >
              {cursor === 0 ? "Start call" : "Resume"}
            </button>
          )}
          <button
            type="button"
            className={btn}
            disabled={running || finished || state.ended || busy}
            onClick={deliverNext}
          >
            Next line
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => {
              runId.current += 1;
              setPlaying(false);
              setPending(null);
              setFailed(null);
              dispatch({ type: "reset", setup: script.setup });
            }}
          >
            Reset
          </button>
          <button
            type="button"
            className={primary}
            disabled={cursor === 0 || state.ended || pending !== null}
            onClick={() => {
              setPlaying(false);
              dispatch({ type: "end" });
            }}
          >
            End call
          </button>
        </div>
      </div>

      {failed && failedLine && (
        <div
          role="alert"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
        >
          <span>
            The AI could not read line {failed.turn}: {failed.message}. Nothing was filled in from it.
          </span>
          <span className="flex gap-2">
            <button type="button" className={btn} onClick={() => void analyze(failedLine)}>
              Retry
            </button>
            <button type="button" className={btn} onClick={() => setFailed(null)}>
              Skip this line
            </button>
          </span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)]">
        <ChecklistPanel items={visibleChecklist(state)} />
        <div className="space-y-4">
          <EncounterPanel
            state={state}
            onEdit={(field, value) => dispatch({ type: "edit", field, value })}
          />
          <TranscriptStrip transcript={state.transcript} />
          {state.warnings.length > 0 && (
            <details className="rounded-lg border border-zinc-200 bg-white p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900">
              <summary className="cursor-pointer font-medium text-zinc-600 dark:text-zinc-400">
                Safety checks adjusted {state.warnings.length} AI answer
                {state.warnings.length === 1 ? "" : "s"}
              </summary>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-600 dark:text-zinc-400">
                {state.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </details>
          )}
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
