"use client";

import { useEffect, useRef, useState } from "react";
import { saveCallEncounter } from "@/app/actions";
import { cleanTerm, initialRows, type AdeRow } from "@/lib/call/ades";
import { buildChartNote } from "@/lib/call/chartNote";
import { scoreCall } from "@/lib/call/score";
import { normalizeRemote } from "@/lib/call/client";
import type { CallState } from "@/lib/call/types";

type Props = {
  state: CallState;
  open: boolean;
  /** Replay mode never calls the API, so terms come from rule labels. */
  useAi: boolean;
  /** Microphone call: normalizing goes through the passcode-protected path. */
  live: boolean;
  onClose: () => void;
  onConfirmSeriousness: (value: boolean) => void;
};

const btn =
  "rounded-full bg-lime-100 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-lime-200 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700";
const primary =
  "rounded-full bg-zinc-900 dark:bg-lime-200 dark:text-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:hover:bg-lime-100 disabled:opacity-50";
const input =
  "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export default function SubmitDialog({ state, open, useAi, live, onClose, onConfirmSeriousness }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [rows, setRows] = useState<AdeRow[]>(() => initialRows(state.events));
  const [normalizing, setNormalizing] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAs, setSavedAs] = useState<number | null>(null);
  const normalizedOnce = useRef(false);
  // Rows the pharmacist has typed in; the AI answer never overwrites these.
  const touched = useRef(new Set<string>());

  const note = buildChartNote(state);
  const needsConfirm = state.seriousnessIsDefault && !state.seriousnessConfirmed;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // Ask the AI for standard terms once, the first time the dialog opens.
  useEffect(() => {
    if (!open || normalizedOnce.current || !useAi || rows.length === 0) return;
    normalizedOnce.current = true;
    setNormalizing(true);
    normalizeRemote(rows.map((r) => r.verbatim), live)
      .then((terms) => {
        setRows((cur) =>
          cur.map((r, i) => {
            const t = cleanTerm(terms[i]);
            return t && !touched.current.has(r.id) ? { ...r, term: t } : r;
          }),
        );
      })
      .catch(() =>
        setAiNote("The AI could not normalize these, so the patient's words are shown. Edit as needed."),
      )
      .finally(() => setNormalizing(false));
    // rows is only read once, on first open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, useAi]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(note);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked; the text is still selectable */
    }
  }

  function edit(id: string, term: string) {
    touched.current.add(id);
    setRows((cur) => cur.map((r) => (r.id === id ? { ...r, term } : r)));
  }

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const res = await saveCallEncounter({
        drugName: state.form.drug,
        indication: state.form.indication,
        therapyStart: state.form.therapyStart,
        medChanges: state.form.medChanges === "yes",
        medChangeList: state.medChangeList.filter((m) => m.name.trim()).map((m) => ({ name: m.name.trim(), action: m.action })),
        eventsReported: state.form.events,
        interventions: state.form.interventions,
        ades: rows.map((r) => r.term.trim()).filter(Boolean),
        rphName: state.form.rphName,
        audit: scoreCall(state).rows.map(({ id, label, done, extra }) => ({ id, label, done, extra })),
      });
      if (res.status === "success") setSavedAs(res.encounterNumber);
      else setError(res.message);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="submit-h"
      className="m-auto w-[min(72rem,95vw)] rounded-2xl border border-zinc-300 bg-white p-0 text-zinc-900 backdrop:bg-black/50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
    >
      <div className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="submit-h" className="text-lg font-semibold">Review and submit</h2>
            <p className="text-xs text-zinc-500">
              Copy the note for the chart, check the ADEs, then submit. Nothing is saved until you submit.
            </p>
          </div>
          <button type="button" className={btn} onClick={onClose}>Close</button>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <section aria-labelledby="note-h" className="flex flex-col">
            <h3 id="note-h" className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Chart note (copy and paste)
            </h3>
            {state.seriousnessIsDefault && (
              <label className="mb-2 flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={state.seriousnessConfirmed}
                  onChange={(e) => onConfirmSeriousness(e.target.checked)}
                />
                <span>
                  I confirm this event is <strong>non-serious</strong>. (Pre-filled because the
                  patient reported no ER visit or hospitalization.)
                </span>
              </label>
            )}
            <pre className="max-h-[50vh] flex-1 overflow-auto whitespace-pre-wrap rounded-xl bg-zinc-100 p-3 text-sm dark:bg-zinc-800">
              {note}
            </pre>
            <div className="mt-3 flex items-center gap-3">
              <button type="button" className={primary} onClick={copy}>
                {copied ? "Copied!" : "Copy note"}
              </button>
              {needsConfirm && (
                <span role="status" className="text-xs text-amber-800 dark:text-amber-300">
                  Seriousness is still waiting for your confirmation.
                </span>
              )}
            </div>
          </section>

          <section aria-labelledby="ades-h" className="flex flex-col">
            <h3 id="ades-h" className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              ADEs to save
            </h3>
            <p className="mb-2 text-xs text-zinc-500" role="status">
              {normalizing
                ? "AI is normalizing the patient's words…"
                : "Each ADE is shown as a standard term. If it could not be normalized, the patient's words are kept. Edit any of them."}
            </p>
            {aiNote && (
              <p role="alert" className="mb-2 text-xs text-amber-800 dark:text-amber-300">{aiNote}</p>
            )}

            {rows.length === 0 ? (
              <p className="rounded-xl bg-zinc-100 p-3 text-sm dark:bg-zinc-800">
                No ADEs were reported on this call. The encounter will be saved without any.
              </p>
            ) : (
              <ul className="space-y-3">
                {rows.map((r) => (
                  <li key={r.id}>
                    <label htmlFor={`ade-${r.id}`} className="mb-1 block text-xs text-zinc-500">
                      Patient said: “{r.verbatim}”
                    </label>
                    <div className="flex gap-2">
                      <input
                        id={`ade-${r.id}`}
                        className={input}
                        value={r.term}
                        disabled={savedAs !== null}
                        onChange={(e) => edit(r.id, e.target.value)}
                      />
                      <button
                        type="button"
                        className={btn}
                        disabled={savedAs !== null}
                        aria-label={`Remove ${r.term || "this ADE"}`}
                        onClick={() => setRows((cur) => cur.filter((x) => x.id !== r.id))}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-auto pt-4">
              {error && (
                <p role="alert" className="mb-2 text-sm text-red-700 dark:text-red-300">{error}</p>
              )}
              {savedAs !== null ? (
                <p role="status" className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  Saved as encounter #{savedAs}.
                </p>
              ) : (
                <button type="button" className={primary} disabled={saving || normalizing} onClick={submit}>
                  {saving ? "Saving…" : "Submit"}
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </dialog>
  );
}
