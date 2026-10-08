"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { visibleChecklist } from "@/lib/call/checklist";
import { analyzeRemote, checkLivePasscode } from "@/lib/call/client";
import { startMic, type MicSession } from "@/lib/call/mic";
import { callReducer, initialState } from "@/lib/call/reducer";
import { replayFor } from "@/lib/call/replay";
import { getRule, type Rule } from "@/lib/call/rules";
import { DEMO_CALL_1, lineDelayMs, type Line } from "@/lib/call/script";
import { roleFor, type RawTurn } from "@/lib/call/turns";
import ChecklistPanel from "./ChecklistPanel";
import EncounterPanel from "./EncounterPanel";
import RecommendationsPanel from "./RecommendationsPanel";
import SubmitDialog from "./SubmitDialog";
import TranscriptStrip from "./TranscriptStrip";

const script = DEMO_CALL_1;
const btn =
  "rounded-full bg-lime-100 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-lime-200 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700";
const primary =
  "rounded-full bg-zinc-900 dark:bg-lime-200 dark:text-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:hover:bg-lime-100 disabled:opacity-50";

type Mode = "live" | "replay" | "mic";

export default function CallScreen() {
  // Everything about the call lives in browser memory only. A refresh clears it.
  const [state, dispatch] = useReducer(callReducer, script.setup, initialState);
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState<Mode>("live");
  const [pending, setPending] = useState<number | null>(null); // turn being analyzed
  const [failed, setFailed] = useState<{ turn: number; message: string } | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);

  // Microphone mode. Turns arrive from speech-to-text and are analyzed one at a time.
  const [micOn, setMicOn] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [interim, setInterim] = useState("");
  const [passcode, setPasscode] = useState("");
  // null = not checked yet. Microphone mode needs true before it can start.
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  // What happened to each line: reading, read (and what it ticked), or why it failed.
  const [lineStatus, setLineStatus] = useState<Record<number, string>>({});
  const [swapped, setSwapped] = useState(false);
  const [ending, setEnding] = useState(false);
  const micRef = useRef<MicSession | null>(null);
  const chain = useRef<Promise<void>>(Promise.resolve());
  const nextTurn = useRef(1);
  const firstSpeaker = useRef<number | null>(null);
  const swappedRef = useRef(false);

  // The latest state, readable from async code without stale closures.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  // Bumped on reset so an answer that arrives after a reset is ignored.
  const runId = useRef(0);

  const cursor = state.transcript.length;
  const isMic = mode === "mic";
  const finished = !isMic && cursor >= script.lines.length;
  const busy = !isMic && (pending !== null || failed !== null);
  const running = playing && !finished && !state.ended && !busy;

  const setStatus = (turn: number, text: string) => setLineStatus((m) => ({ ...m, [turn]: text }));

  async function analyze(line: Line) {
    const myRun = runId.current;
    setFailed(null);
    setPending(line.turn);
    setStatus(line.turn, "reading…");
    try {
      if (mode === "replay") {
        dispatch({ type: "apply", turn: line.turn, update: replayFor(line.turn) });
      } else {
        const s = stateRef.current;
        const result = await analyzeRemote(line, s.transcript, s, isMic);
        if (myRun !== runId.current) return;
        dispatch({ type: "apply", turn: line.turn, update: result.update, warnings: result.warnings });
        const ticked = result.update.itemsCompleted ?? [];
        setStatus(line.turn, ticked.length ? `read, ticked ${ticked.join(", ")}` : "read");
      }
      setPending(null);
    } catch (err) {
      if (myRun !== runId.current) return;
      const message = err instanceof Error ? err.message : "Unknown error";
      setPending(null);
      setPlaying(false);
      setFailed({ turn: line.turn, message });
      setStatus(line.turn, `could not read: ${message}`);
    }
  }

  // A finished turn from the microphone: show it, then queue its analysis behind earlier ones.
  function handleTurn(raw: RawTurn) {
    firstSpeaker.current ??= raw.speaker;
    const speaker = roleFor(raw.speaker, firstSpeaker.current, swappedRef.current);
    const line: Line = { turn: nextTurn.current++, speaker, text: raw.text };
    dispatch({ type: "hear", line });
    chain.current = chain.current.then(() => analyze(line));
  }

  // The pharmacist fixes a wrongly labelled line, and the AI reads it again as the other speaker.
  function flipSpeaker(turn: number) {
    const old = stateRef.current.transcript.find((l) => l.turn === turn);
    if (!old || stateRef.current.ended) return;
    const line: Line = { ...old, speaker: old.speaker === "pharmacist" ? "patient" : "pharmacist" };
    dispatch({ type: "relabel", turn, speaker: line.speaker });
    chain.current = chain.current.then(() => analyze(line));
  }

  async function stopListening() {
    const mic = micRef.current;
    micRef.current = null;
    setMicOn(false);
    setInterim("");
    await mic?.stop();
  }

  async function startListening() {
    setMicError(null);
    try {
      micRef.current = await startMic({
        onTurn: handleTurn,
        onInterim: setInterim,
        onError: (message) => {
          micRef.current = null;
          setMicOn(false);
          setInterim("");
          setMicError(message);
        },
      });
      setMicOn(true);
    } catch (err) {
      setMicError(err instanceof Error ? err.message : "Could not start the microphone");
    }
  }

  async function unlock(code: string) {
    setUnlockError(null);
    const res = await checkLivePasscode(code);
    setUnlocked(res.ok);
    if (!res.ok) setUnlockError(res.error);
  }

  async function endCall() {
    setPlaying(false);
    setEnding(true);
    await stopListening();
    await chain.current; // let the last turns finish being analyzed
    setEnding(false);
    dispatch({ type: "end" });
  }

  // Never leave the microphone open if the page is closed or navigated away.
  useEffect(() => () => void micRef.current?.stop(), []);

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

  const failedLine = failed ? state.transcript.find((l) => l.turn === failed.turn) : undefined;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl font-normal tracking-tight"><span className="highlight">Patient Encounter</span></h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {isMic ? "Live microphone call." : `${script.title}. Fictional scripted call.`}
          </p>
          <p className="mt-1 text-xs text-zinc-500" role="status">
            {state.ended ? "Call ended. " : ""}Line {cursor}
            {isMic ? (micOn ? " · listening" : "") : ` of ${script.lines.length}`}
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
                ["mic", "Microphone"],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex items-center gap-1.5">
                <input type="radio" name="mode" checked={mode === value} onChange={() => {
                    setMode(value);
                    // If the server does not ask for a passcode, unlock without typing one.
                    if (value === "mic" && unlocked === null) void unlock("");
                  }} />
                {label}
              </label>
            ))}
          </fieldset>
          {isMic ? (
            micOn ? (
              <button type="button" className={btn} onClick={() => void stopListening()}>
                Pause
              </button>
            ) : (
              <button
                type="button"
                className={primary}
                disabled={state.ended || ending || !unlocked}
                onClick={() => void startListening()}
              >
                {cursor === 0 ? "Start listening" : "Resume"}
              </button>
            )
          ) : running ? (
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
          {!isMic && (
            <button
              type="button"
              className={btn}
              disabled={running || finished || state.ended || busy}
              onClick={deliverNext}
            >
              Next line
            </button>
          )}
          <button
            type="button"
            className={btn}
            onClick={() => {
              runId.current += 1;
              void stopListening();
              chain.current = Promise.resolve();
              nextTurn.current = 1;
              firstSpeaker.current = null;
              setMicError(null);
              setLineStatus({});
              setEnding(false);
              setPlaying(false);
              setPending(null);
              setFailed(null);
              setSubmitOpen(false);
              dispatch({ type: "reset", setup: script.setup });
            }}
          >
            Reset
          </button>
          <button
            type="button"
            className={primary}
            disabled={cursor === 0 || state.ended || ending || (!isMic && pending !== null)}
            onClick={() => void endCall()}
          >
            End call
          </button>
        </div>
      </div>

      {isMic && !state.ended && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-white px-3 py-2 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          {unlocked ? (
            <span role="status" className="font-medium text-emerald-800 dark:text-emerald-300">
              Microphone unlocked
            </span>
          ) : (
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void unlock(passcode);
              }}
            >
              <label className="flex items-center gap-2">
                Passcode
                <input
                  type="password"
                  autoComplete="off"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-32 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </label>
              <button type="submit" className={btn}>
                Unlock
              </button>
              {unlockError && (
                <span role="alert" className="text-red-700 dark:text-red-300">
                  {unlockError}
                </span>
              )}
            </form>
          )}
          <span>
            The first voice heard is labelled <strong>pharmacist</strong>, the other{" "}
            <strong>patient</strong>. If that is backwards, swap (affects new lines only).
          </span>
          <button
            type="button"
            className={btn}
            onClick={() => {
              swappedRef.current = !swappedRef.current;
              setSwapped(swappedRef.current);
            }}
          >
            {swapped ? "Swapped: first voice = patient" : "Swap pharmacist / patient"}
          </button>
        </div>
      )}

      {micError && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
        >
          {micError}
        </div>
      )}

      {failed && failedLine && (
        <div
          role="alert"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
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
            onSubmit={() => setSubmitOpen(true)}
          />
          <TranscriptStrip transcript={state.transcript} status={lineStatus}
            onFlip={isMic && !state.ended ? flipSpeaker : undefined}
          />
          {isMic && interim && (
            <p className="px-2 text-xs italic text-zinc-500" aria-hidden>
              Hearing: {interim}
            </p>
          )}
          {state.warnings.length > 0 && (
            <details className="rounded-2xl border border-zinc-200 bg-white p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900">
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
        <SubmitDialog
          state={state}
          open={submitOpen}
          useAi={mode !== "replay"}
          live={isMic}
          onClose={() => setSubmitOpen(false)}
          onConfirmSeriousness={(value) => dispatch({ type: "confirmSeriousness", value })}
        />
      )}
    </main>
  );
}
