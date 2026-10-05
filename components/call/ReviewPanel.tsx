"use client";

import { useState } from "react";
import { buildChartNote } from "@/lib/call/chartNote";
import type { CallState } from "@/lib/call/types";

type Props = {
  state: CallState;
  onConfirmSeriousness: (value: boolean) => void;
};

export default function ReviewPanel({ state, onConfirmSeriousness }: Props) {
  const [copied, setCopied] = useState(false);
  const note = buildChartNote(state);
  const needsConfirm = state.seriousnessIsDefault && !state.seriousnessConfirmed;

  async function copy() {
    try {
      await navigator.clipboard.writeText(note);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked; the text is still selectable */
    }
  }

  return (
    <section
      aria-labelledby="review-h"
      className="mt-4 rounded-lg border border-teal-300 bg-white p-4 dark:border-teal-800 dark:bg-zinc-900"
    >
      <h2 id="review-h" className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Chart note for your review
      </h2>
      <p className="mb-3 mt-1 text-xs text-zinc-500">
        Built from the form above. Edit the form to change anything. Nothing is submitted
        anywhere; copy it into the chart yourself.
      </p>

      {state.seriousnessIsDefault && (
        <label className="mb-3 flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={state.seriousnessConfirmed}
            onChange={(e) => onConfirmSeriousness(e.target.checked)}
          />
          <span>
            I confirm this event is <strong>non-serious</strong>. (Pre-filled because the patient
            reported no ER visit or hospitalization. You decide.)
          </span>
        </label>
      )}

      <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-zinc-100 p-3 text-sm text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
        {note}
      </pre>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={copy}
          className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
        >
          {copied ? "Copied!" : "Copy note"}
        </button>
        {needsConfirm && (
          <span role="status" className="text-xs text-amber-800 dark:text-amber-300">
            Seriousness is still waiting for your confirmation.
          </span>
        )}
      </div>
    </section>
  );
}
