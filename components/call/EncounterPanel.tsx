"use client";

import { DRUGS, DRUG_INDICATIONS, type DrugName } from "@/lib/drugs";
import type { CallState, FormField } from "@/lib/call/types";

const field =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
const labelCls = "text-sm font-medium text-zinc-800 dark:text-zinc-200";

type Props = {
  state: CallState;
  onEdit: (field: FormField, value: string) => void;
};

function Badge({ text, tone }: { text: string; tone: "ai" | "you" | "rule" }) {
  const cls = {
    ai: "bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200",
    you: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
    rule: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
  }[tone];
  return <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${cls}`}>{text}</span>;
}

export default function EncounterPanel({ state, onEdit }: Props) {
  const { form } = state;

  const badge = (k: FormField) => {
    if (state.edited[k]) return <Badge text="Edited by you" tone="you" />;
    if (k === "seriousness" && state.seriousnessIsDefault)
      return <Badge text="Default, please confirm" tone="rule" />;
    if (state.aiFilled[k]) return <Badge text="AI-filled" tone="ai" />;
    return null;
  };

  const row = (k: FormField, id: string, text: string, control: React.ReactNode) => (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label htmlFor={id} className={labelCls}>{text}</label>
        {badge(k)}
      </div>
      {control}
    </div>
  );

  const drug = form.drug as DrugName;
  const indications: readonly string[] = DRUG_INDICATIONS[drug] ?? [];

  return (
    <section
      aria-labelledby="enc-h"
      className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 id="enc-h" className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Encounter (typed by the AI, editable by you)
      </h2>
      <p className="mb-4 mt-1 text-xs text-zinc-500">
        Fields the AI fills are tagged. Once you edit one, the AI stops changing it.
      </p>

      <div aria-live="polite" className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            {row("drug", "drug", "Drug name",
              <select id="drug" className={field} value={form.drug}
                onChange={(e) => { onEdit("drug", e.target.value); onEdit("indication", ""); }}>
                {DRUGS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>)}
            {state.drugDetail && (
              <p className="mt-1 text-xs text-zinc-500">Stated on the call: {state.drugDetail}</p>
            )}
          </div>
          {row("therapyStart", "therapyStart", "Start of therapy",
            <input id="therapyStart" type="date" className={field} value={form.therapyStart}
              onChange={(e) => onEdit("therapyStart", e.target.value)} />)}
        </div>

        {row("indication", "indication", "Indication",
          <select id="indication" className={field} value={form.indication}
            onChange={(e) => onEdit("indication", e.target.value)}>
            <option value="" disabled>Select an indication…</option>
            {indications.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>)}

        <fieldset>
          <div className="mb-1 flex items-center justify-between gap-2">
            <legend className={labelCls}>Any changes to the medication list?</legend>
            {badge("medChanges")}
          </div>
          <div className="flex gap-6 text-sm">
            {["no", "yes"].map((v) => (
              <label key={v} className="flex items-center gap-2">
                <input type="radio" name="medChanges" value={v}
                  checked={form.medChanges === v}
                  onChange={() => onEdit("medChanges", v)} />
                {v === "yes" ? "Yes" : "No"}
              </label>
            ))}
          </div>
        </fieldset>

        {row("events", "events", "Events reported by patient",
          <>
            <textarea id="events" rows={4} className={field} value={form.events}
              placeholder="The patient's own words appear here as they speak"
              onChange={(e) => onEdit("events", e.target.value)} />
            {state.events.length > 0 && (
              <ul className="mt-1 space-y-0.5 text-xs text-zinc-500">
                {state.events.map((e) => (
                  <li key={e.id}>
                    Matched label:{" "}
                    {e.ruleId ? (
                      <>
                        <span className="font-medium">{e.label}</span> (rule {e.ruleId})
                      </>
                    ) : (
                      <span className="font-medium">no rule matched; pharmacist to assess</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>)}

        {row("interventions", "interventions", "Interventions provided",
          <textarea id="interventions" rows={4} className={field} value={form.interventions}
            placeholder="Filled in from what the pharmacist actually says"
            onChange={(e) => onEdit("interventions", e.target.value)} />)}

        <hr className="border-zinc-200 dark:border-zinc-800" />
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Call details</p>

        <div className="grid gap-4 sm:grid-cols-2">
          {row("consent", "consent", "Follow-up contact consent",
            <select id="consent" className={field} value={form.consent}
              onChange={(e) => onEdit("consent", e.target.value)}>
              <option value="">Not captured</option>
              <option value="patient">Contact patient</option>
              <option value="doctor">Contact doctor only</option>
              <option value="either">Contact either</option>
              <option value="none">No contact</option>
            </select>)}
          {row("erOrHospital", "er", "ER visit or hospitalization",
            <select id="er" className={field} value={form.erOrHospital}
              onChange={(e) => onEdit("erOrHospital", e.target.value)}>
              <option value="">Not asked</option>
              <option value="none">None reported</option>
              <option value="er">ER visit</option>
              <option value="hospitalized">Hospitalized</option>
              <option value="unclear">Unclear</option>
            </select>)}
        </div>

        {row("missedDose", "missedDose", "Missed dose",
          <textarea id="missedDose" rows={2} className={field} value={form.missedDose}
            onChange={(e) => onEdit("missedDose", e.target.value)} />)}

        {row("seriousness", "seriousness", "Seriousness (you decide)",
          <select id="seriousness" className={field} value={form.seriousness}
            onChange={(e) => onEdit("seriousness", e.target.value)}>
            <option value="">Pharmacist to assess</option>
            <option value="non-serious">Non-serious</option>
            <option value="serious">Serious</option>
          </select>)}
      </div>
    </section>
  );
}
