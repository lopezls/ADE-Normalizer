"use client";

import { useState } from "react";
import { DRUGS, DRUG_INDICATIONS, type DrugName } from "@/lib/drugs";

const field =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
const labelCls = "text-sm font-medium text-zinc-800 dark:text-zinc-200";

type Source = "ai" | "pharmacist" | "empty";

// Starts blank. Drug and indication come from the call setup; the rest are filled by the AI from step 5 on.
const INITIAL = {
  drug: "Dupixent",
  indication: "Asthma",
  therapyStart: "",
  medChanges: "no",
  events: "",
  interventions: "",
  consent: "",
  missedDose: "",
  erOrHospital: "",
  seriousness: "",
};
type Values = typeof INITIAL;

const AI_FILLED: (keyof Values)[] = [
  "events", "consent", "missedDose", "erOrHospital", "interventions",
];

function Badge({ source }: { source: Source }) {
  if (source === "empty") return null;
  const ai = source === "ai";
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
        ai
          ? "bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200"
          : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
      }`}
    >
      {ai ? "AI-filled" : "Edited by you"}
    </span>
  );
}

export default function EncounterPanel() {
  const [values, setValues] = useState<Values>(INITIAL);
  const [edited, setEdited] = useState<Set<keyof Values>>(new Set());

  const sourceOf = (k: keyof Values): Source =>
    edited.has(k) ? "pharmacist" : AI_FILLED.includes(k) && values[k] ? "ai" : "empty";

  function set<K extends keyof Values>(k: K, v: Values[K]) {
    setValues((s) => ({ ...s, [k]: v }));
    setEdited((s) => new Set(s).add(k));
  }

  const drug = values.drug as DrugName;

  const row = (k: keyof Values, id: string, text: string, control: React.ReactNode) => (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label htmlFor={id} className={labelCls}>{text}</label>
        <Badge source={sourceOf(k)} />
      </div>
      {control}
    </div>
  );

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
          {row("drug", "drug", "Drug name",
            <select id="drug" className={field} value={values.drug}
              onChange={(e) => { set("drug", e.target.value); set("indication", ""); }}>
              {DRUGS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>)}
          {row("therapyStart", "therapyStart", "Start of therapy",
            <input id="therapyStart" type="date" className={field} value={values.therapyStart}
              onChange={(e) => set("therapyStart", e.target.value)} />)}
        </div>

        {row("indication", "indication", "Indication",
          <select id="indication" className={field} value={values.indication}
            onChange={(e) => set("indication", e.target.value)}>
            <option value="" disabled>Select an indication…</option>
            {DRUG_INDICATIONS[drug].map((i) => <option key={i} value={i}>{i}</option>)}
          </select>)}

        <fieldset>
          <div className="mb-1 flex items-center justify-between gap-2">
            <legend className={labelCls}>Any changes to the medication list?</legend>
            <Badge source={sourceOf("medChanges")} />
          </div>
          <div className="flex gap-6 text-sm">
            {["no", "yes"].map((v) => (
              <label key={v} className="flex items-center gap-2">
                <input type="radio" name="medChanges" value={v}
                  checked={values.medChanges === v}
                  onChange={() => set("medChanges", v)} />
                {v === "yes" ? "Yes" : "No"}
              </label>
            ))}
          </div>
        </fieldset>

        {row("events", "events", "Events reported by patient",
          <>
            <textarea id="events" rows={3} className={field} value={values.events}
              onChange={(e) => set("events", e.target.value)} />
            <p className="mt-1 text-xs text-zinc-500">
              The patient&apos;s own words. Matched label:{" "}
              <span className="font-medium">Diarrhea</span> (rule D1-01)
            </p>
          </>)}

        {row("interventions", "interventions", "Interventions provided",
          <textarea id="interventions" rows={3} className={field} value={values.interventions}
            placeholder="Filled in from what the pharmacist actually says"
            onChange={(e) => set("interventions", e.target.value)} />)}

        <hr className="border-zinc-200 dark:border-zinc-800" />
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Call details
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {row("consent", "consent", "Follow-up contact consent",
            <select id="consent" className={field} value={values.consent}
              onChange={(e) => set("consent", e.target.value)}>
              <option value="">Not captured</option>
              <option value="patient">Contact patient</option>
              <option value="doctor">Contact doctor only</option>
              <option value="either">Contact either</option>
              <option value="none">No contact</option>
            </select>)}
          {row("erOrHospital", "er", "ER visit or hospitalization",
            <select id="er" className={field} value={values.erOrHospital}
              onChange={(e) => set("erOrHospital", e.target.value)}>
              <option value="">Not asked</option>
              <option value="none">None reported</option>
              <option value="er">ER visit</option>
              <option value="hospitalized">Hospitalized</option>
              <option value="unclear">Unclear</option>
            </select>)}
        </div>

        {row("missedDose", "missedDose", "Missed dose",
          <textarea id="missedDose" rows={2} className={field} value={values.missedDose}
            onChange={(e) => set("missedDose", e.target.value)} />)}

        {row("seriousness", "seriousness", "Seriousness (you decide)",
          <select id="seriousness" className={field} value={values.seriousness}
            onChange={(e) => set("seriousness", e.target.value)}>
            <option value="">Pharmacist to assess</option>
            <option value="non-serious">Non-serious</option>
            <option value="serious">Serious</option>
          </select>)}
      </div>
    </section>
  );
}
