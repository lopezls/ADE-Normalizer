import type { Line } from "./script";

export const ITEM_IDS = ["S-01", "S-02", "S-03", "S-04", "S-05", "S-06", "G-01"] as const;
export type ItemId = (typeof ITEM_IDS)[number];

export type Consent = "patient" | "doctor" | "either" | "none";
export type ErAnswer = "none" | "er" | "hospitalized" | "unclear";

/**
 * What the analyzer (replay file now, Claude later) may report about ONE line.
 * There is deliberately no field for seriousness, causality or advice.
 */
export type ModelOutput = {
  itemsCompleted: ItemId[];
  drug: { name?: string; strength?: string; frequency?: string } | null;
  consent: Consent | null;
  missedDose: { whichDose: string; reason?: string; schedule?: string } | null;
  events: {
    ref: "new" | string; // "new", or the ID of an event already recorded
    verbatim?: string;
    ruleId?: string | null;
    duration?: string;
    treatmentsTried?: string;
    patientAttribution?: string;
  }[];
  erOrHospital: ErAnswer | null;
  interventions: { summary: string }[];
};

export const EMPTY_OUTPUT: ModelOutput = {
  itemsCompleted: [],
  drug: null,
  consent: null,
  missedDose: null,
  events: [],
  erOrHospital: null,
  interventions: [],
};

export type FormField =
  | "drug"
  | "indication"
  | "therapyStart"
  | "medChanges"
  | "events"
  | "interventions"
  | "consent"
  | "missedDose"
  | "erOrHospital"
  | "seriousness";

export type EventRecord = {
  id: string;
  verbatim: string;
  ruleId: string | null;
  label: string | null;
  duration?: string;
  treatmentsTried?: string;
  patientAttribution?: string;
};

export type CallState = {
  transcript: Line[];
  ended: boolean;
  checklist: Record<ItemId, { done: boolean; doneAtTurn?: number; triggeredAtTurn?: number }>;
  form: Record<FormField, string>;
  /** Fields the pharmacist changed. The AI never overwrites these. */
  edited: Partial<Record<FormField, true>>;
  /** Fields the AI has written to. */
  aiFilled: Partial<Record<FormField, true>>;
  drugDetail: string;
  events: EventRecord[];
  missedDose: { whichDose: string; reason?: string; schedule?: string } | null;
  interventions: { id: string; text: string; turn: number }[];
  matched: { ruleId: string; turn: number }[];
  /** Seriousness was pre-filled by code, not chosen by the pharmacist. */
  seriousnessIsDefault: boolean;
  seriousnessConfirmed: boolean;
  warnings: string[];
};
