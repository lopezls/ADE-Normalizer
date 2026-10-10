import type { Line } from "./script";

export const ITEM_IDS = ["S-01", "S-02", "S-03", "S-11", "S-08", "S-10", "S-07", "S-06", "S-09", "S-05", "G-01"] as const;
export type ItemId = (typeof ITEM_IDS)[number];

export type ErAnswer = "none" | "er" | "hospitalized" | "unclear";

/**
 * What the analyzer (replay file now, Claude later) may report about ONE line.
 * There is deliberately no field for seriousness, causality or advice.
 */
export type ModelOutput = {
  itemsCompleted: ItemId[];
  drug: { name?: string; strength?: string; frequency?: string } | null;
  /** The pharmacist's own name, as they say it when introducing themself. */
  pharmacistName: string | null;
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
  pharmacistName: null,
  missedDose: null,
  events: [],
  erOrHospital: null,
  interventions: [],
};

export type FormField =
  | "rphName"
  | "drug"
  | "indication"
  | "therapyStart"
  | "medChanges"
  | "events"
  | "interventions"
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

/** A medicine the patient started or stopped, typed by the pharmacist when the medication list changed. */
export type MedChange = { id: string; name: string; action: "started" | "stopped" };

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
  medChangeList: MedChange[];
  events: EventRecord[];
  missedDose: { whichDose: string; reason?: string; schedule?: string } | null;
  interventions: { id: string; text: string; turn: number }[];
  matched: { ruleId: string; turn: number }[];
  /** Seriousness was pre-filled by code, not chosen by the pharmacist. */
  seriousnessIsDefault: boolean;
  seriousnessConfirmed: boolean;
  warnings: string[];
};
