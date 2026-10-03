"use client";

import { useActionState, useState } from "react";
import { submitEncounter, type FormState } from "@/app/actions";
import { DRUGS, DRUG_INDICATIONS, type DrugName } from "@/lib/drugs";

const field =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
const label = "mb-1 block text-sm font-medium text-zinc-800 dark:text-zinc-200";

export default function EncounterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    submitEncounter,
    { status: "idle" },
  );
  const [medChanges, setMedChanges] = useState("no");
  const [drug, setDrug] = useState<DrugName | "">("");
  const [dismissed, setDismissed] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const result = state.status === "success" ? state.result : null;
  const open = result !== null && dismissed !== result.encounterNumber;

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked; text is still selectable */
    }
  }

  return (
    <>
      <form
        action={action}
        onReset={() => {
          setDrug("");
          setMedChanges("no");
        }}
        className="space-y-5"
      >
        <div>
          <label className={label} htmlFor="patientId">Patient ID #</label>
          <input id="patientId" name="patientId" required autoComplete="off" className={field} />
          <p className="mt-1 text-xs text-zinc-500">
            Never stored or shown again — replaced with a sequential patient number.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="drugName">Drug name</label>
            <select
              id="drugName"
              name="drugName"
              required
              value={drug}
              onChange={(e) => setDrug(e.target.value as DrugName | "")}
              className={field}
            >
              <option value="" disabled>Select a drug…</option>
              {DRUGS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="therapyStart">Start of therapy</label>
            <input id="therapyStart" name="therapyStart" type="date" className={field} />
          </div>
        </div>

        <div>
          <label className={label} htmlFor="indication">Indication</label>
          <select
            key={drug}
            id="indication"
            name="indication"
            required
            disabled={!drug}
            defaultValue=""
            className={field}
          >
            <option value="" disabled>
              {drug ? "Select an indication…" : "Select a drug first"}
            </option>
            {drug &&
              DRUG_INDICATIONS[drug].map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
          </select>
        </div>

        <fieldset>
          <legend className={label}>Changes to the medication list?</legend>
          <div className="flex gap-6 text-sm">
            {["no", "yes"].map((v) => (
              <label key={v} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="medChanges"
                  value={v}
                  checked={medChanges === v}
                  onChange={() => setMedChanges(v)}
                />
                {v === "yes" ? "Yes" : "No"}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label className={label} htmlFor="eventsReported">Events reported by patient</label>
          <textarea
            id="eventsReported"
            name="eventsReported"
            rows={4}
            placeholder="e.g. Diarrhea - Hair loss - Injection site redness"
            className={field}
          />
          <p className="mt-1 text-xs text-zinc-500">
            Separate each event with a dash (-). Saved as lowercase with no spaces, e.g. diarrhea-hairloss.
          </p>
        </div>

        <div>
          <label className={label} htmlFor="interventions">Interventions provided</label>
          <textarea
            id="interventions"
            name="interventions"
            rows={4}
            placeholder="e.g. Recommended loperamide 4 mg then 2 mg after each loose stool"
            className={field}
          />
        </div>

        {state.status === "error" && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {pending ? "Submitting…" : "Submit encounter"}
        </button>
      </form>

      {open && result && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="enc-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl dark:bg-zinc-900">
            <h2 id="enc-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Encounter saved
            </h2>
            <pre className="mt-3 max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-md bg-zinc-100 p-3 text-sm text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
              {result.summary}
            </pre>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={copy}
                className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
              >
                {copied ? "Copied!" : "Copy to clipboard"}
              </button>
              <button
                onClick={() => setDismissed(result.encounterNumber)}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
