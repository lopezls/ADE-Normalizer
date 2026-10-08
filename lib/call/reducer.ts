import { DRUGS } from "../drugs";
import { getRule } from "./rules";
import type { Line } from "./script";
import {
  EMPTY_OUTPUT,
  ITEM_IDS,
  type CallState,
  type EventRecord,
  type FormField,
  type ItemId,
  type ModelOutput,
} from "./types";

export type CallAction =
  | { type: "deliver"; line: Line; update: Partial<ModelOutput> }
  // Live mode: the line shows up first, its analysis arrives a moment later.
  | { type: "hear"; line: Line }
  | { type: "apply"; turn: number; update: Partial<ModelOutput>; warnings?: string[] }
  | { type: "relabel"; turn: number; speaker: Line["speaker"] }
  | { type: "edit"; field: FormField; value: string }
  | { type: "confirmSeriousness"; value: boolean }
  | { type: "end" }
  | { type: "reset"; setup: { drug: string; indication: string } };

export function initialState(setup: { drug: string; indication: string }): CallState {
  return {
    transcript: [],
    ended: false,
    checklist: Object.fromEntries(ITEM_IDS.map((id) => [id, { done: false }])) as CallState["checklist"],
    form: {
      drug: setup.drug,
      indication: setup.indication,
      therapyStart: "",
      medChanges: "no",
      events: "",
      interventions: "",
      consent: "",
      missedDose: "",
      erOrHospital: "",
      seriousness: "",
    },
    edited: {},
    aiFilled: {},
    drugDetail: "",
    events: [],
    missedDose: null,
    interventions: [],
    matched: [],
    seriousnessIsDefault: false,
    seriousnessConfirmed: false,
    warnings: [],
  };
}

/** Text the AI types into "Events reported": the patient's own words, plus what they said about it. */
export function eventsText(events: EventRecord[]): string {
  return events
    .map((e) =>
      [
        e.verbatim,
        e.duration && `Duration: ${e.duration}`,
        e.treatmentsTried && `Tried: ${e.treatmentsTried}`,
        e.patientAttribution && `Patient's explanation: ${e.patientAttribution}`,
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");
}

export function missedDoseText(m: NonNullable<CallState["missedDose"]>): string {
  return [
    m.whichDose,
    m.reason && `Reason per patient: "${m.reason}"`,
    m.schedule && `Schedule: ${m.schedule}`,
  ]
    .filter(Boolean)
    .join(". ");
}

function applyUpdate(s: CallState, turn: number, u: ModelOutput): CallState {
  const next: CallState = {
    ...s,
    checklist: { ...s.checklist },
    form: { ...s.form },
    aiFilled: { ...s.aiFilled },
    events: s.events.map((e) => ({ ...e })),
    interventions: [...s.interventions],
    matched: [...s.matched],
    warnings: [...s.warnings],
  };

  // The AI may fill a form field only if the pharmacist has not edited it.
  const aiSet = (field: FormField, value: string) => {
    if (s.edited[field]) return;
    next.form[field] = value;
    next.aiFilled[field] = true;
  };
  const match = (ruleId: string) => {
    if (!next.matched.some((m) => m.ruleId === ruleId)) next.matched.push({ ruleId, turn });
  };

  // Drug
  if (u.drug?.name) {
    if ((DRUGS as string[]).includes(u.drug.name)) aiSet("drug", u.drug.name);
    else next.warnings.push(`Turn ${turn}: unknown drug "${u.drug.name}" ignored`);
  }
  if (u.drug && (u.drug.strength || u.drug.frequency))
    next.drugDetail = [u.drug.strength, u.drug.frequency].filter(Boolean).join(", ");

  // Consent
  if (u.consent) aiSet("consent", u.consent);

  // Missed dose. Code (not the model) turns this into D1-MD and the conditional item G-01.
  if (u.missedDose && !s.missedDose) {
    next.missedDose = u.missedDose;
    match("D1-MD");
    if (next.checklist["G-01"].triggeredAtTurn === undefined)
      next.checklist["G-01"] = { done: false, triggeredAtTurn: turn };
  }
  if (next.missedDose) aiSet("missedDose", missedDoseText(next.missedDose));

  // Events. Only patient lines may create or change them (enforced by the analyzer).
  for (const ev of u.events) {
    if (ev.ref === "new") {
      if (!ev.verbatim) continue;
      const rule = ev.ruleId ? getRule(ev.ruleId) : undefined;
      if (ev.ruleId && !rule) next.warnings.push(`Turn ${turn}: unknown rule ${ev.ruleId} ignored`);
      next.events.push({
        id: `e${next.events.length + 1}`,
        verbatim: ev.verbatim,
        ruleId: rule ? rule.id : null,
        label: rule?.label ?? null,
        duration: ev.duration,
        treatmentsTried: ev.treatmentsTried,
        patientAttribution: ev.patientAttribution,
      });
      if (rule) match(rule.id);
    } else {
      const target = next.events.find((e) => e.id === ev.ref);
      if (!target) {
        next.warnings.push(`Turn ${turn}: unknown event ${ev.ref} ignored`);
        continue;
      }
      if (ev.duration) target.duration = ev.duration;
      if (ev.treatmentsTried) target.treatmentsTried = ev.treatmentsTried;
      if (ev.patientAttribution) target.patientAttribution = ev.patientAttribution;
    }
  }
  if (next.events.length > 0) aiSet("events", eventsText(next.events));

  // ER / hospital. Code pre-fills seriousness only when the patient reports none.
  if (u.erOrHospital) {
    aiSet("erOrHospital", u.erOrHospital);
    if (u.erOrHospital === "none" && !s.edited.seriousness && next.form.seriousness === "") {
      next.form.seriousness = "non-serious";
      next.seriousnessIsDefault = true;
    }
  }

  // Interventions: what the pharmacist actually said.
  for (const iv of u.interventions) {
    next.interventions.push({ id: `i${next.interventions.length + 1}`, text: iv.summary, turn });
  }
  if (next.interventions.length > 0)
    aiSet("interventions", next.interventions.map((i) => i.text).join("\n"));

  // Checklist
  for (const id of u.itemsCompleted) {
    if (!ITEM_IDS.includes(id as ItemId)) continue;
    // A conditional item can only be completed after it has been triggered.
    if (id === "G-01" && next.checklist["G-01"].triggeredAtTurn === undefined) continue;
    if (!next.checklist[id].done)
      next.checklist[id] = { ...next.checklist[id], done: true, doneAtTurn: turn };
  }

  return next;
}

export function callReducer(s: CallState, a: CallAction): CallState {
  switch (a.type) {
    case "deliver": {
      const withLine = { ...s, transcript: [...s.transcript, a.line] };
      return applyUpdate(withLine, a.line.turn, { ...EMPTY_OUTPUT, ...a.update });
    }
    case "hear":
      return { ...s, transcript: [...s.transcript, a.line] };
    case "apply": {
      const applied = applyUpdate(s, a.turn, { ...EMPTY_OUTPUT, ...a.update });
      return a.warnings?.length ? { ...applied, warnings: [...applied.warnings, ...a.warnings] } : applied;
    }
    case "relabel":
      return { ...s, transcript: s.transcript.map((l) => (l.turn === a.turn ? { ...l, speaker: a.speaker } : l)) };
    case "edit":
      return {
        ...s,
        form: { ...s.form, [a.field]: a.value },
        edited: { ...s.edited, [a.field]: true },
        seriousnessIsDefault: a.field === "seriousness" ? false : s.seriousnessIsDefault,
        seriousnessConfirmed: a.field === "seriousness" ? false : s.seriousnessConfirmed,
      };
    case "confirmSeriousness":
      return { ...s, seriousnessConfirmed: a.value };
    case "end":
      return { ...s, ended: true };
    case "reset":
      return initialState(a.setup);
  }
}
