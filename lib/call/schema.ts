import { z } from "zod";
import { RULES } from "./rules";
import { DEMO_CALL_1 } from "./script";
import { ITEM_IDS } from "./types";

/**
 * What Claude may return for one line. Every ID is an enum built from rules.json,
 * so the model cannot invent a rule. There is no field for seriousness,
 * causality or advice. Optional values are `nullable` (not optional) because
 * structured outputs want every key present.
 */
const ADE_IDS = RULES.filter((r) => r.kind === "ade").map((r) => r.id) as [string, ...string[]];
const str = z.string().nullable();

export const ModelOutputSchema = z.object({
  itemsCompleted: z.array(z.enum(ITEM_IDS)),
  drug: z.object({ name: str, strength: str, frequency: str }).nullable(),
  pharmacistName: str,
  missedDose: z.object({ whichDose: z.string(), reason: str, schedule: str }).nullable(),
  medChanges: z.array(z.object({ name: z.string(), action: z.enum(["started", "stopped"]) })),
  events: z.array(
    z.object({
      ref: z.string(),
      verbatim: str,
      ruleId: z.enum(ADE_IDS).nullable(),
      duration: str,
      treatmentsTried: str,
      patientAttribution: str,
    }),
  ),
  erOrHospital: z.enum(["none", "er", "hospitalized", "unclear"]).nullable(),
  interventions: z.array(z.object({ summary: z.string() })),
});
export type RawModelOutput = z.infer<typeof ModelOutputSchema>;

const LineSchema = z.object({
  turn: z.number().int().min(1).max(500),
  speaker: z.enum(["pharmacist", "patient"]),
  text: z.string().min(1).max(2000),
});

/** Small summary of the call so far. No transcript, no free text beyond event wording. */
export const CompactStateSchema = z.object({
  doneItems: z.array(z.enum(ITEM_IDS)).max(10),
  missedDoseReported: z.boolean(),
  erOrHospital: z.string().max(20),
  events: z
    .array(z.object({ id: z.string().max(10), verbatim: z.string().max(300), ruleId: z.string().max(10).nullable() }))
    .max(20),
});
export type CompactState = z.infer<typeof CompactStateSchema>;

export const AnalyzeRequestSchema = z.object({
  scriptId: z.string().max(60),
  line: LineSchema,
  recent: z.array(LineSchema).max(4),
  state: CompactStateSchema,
  /** Live calls only: the drug and indication on the form. Checked against the drug list before use. */
  setup: z.object({ drug: z.string().max(40), indication: z.string().max(80) }).optional(),
});
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

/**
 * Stage-1 guard: the server only analyzes text that is in its own copy of the
 * script. Without this, the public URL could be used as a free general-purpose
 * LLM endpoint. Stage 2 (live speech) replaces this with real authentication.
 */
export function checkAgainstScript(req: AnalyzeRequest): string | null {
  if (req.scriptId !== DEMO_CALL_1.id) return "Unknown script";
  const same = (l: { turn: number; speaker: string; text: string }) => {
    const known = DEMO_CALL_1.lines.find((k) => k.turn === l.turn);
    return known !== undefined && known.speaker === l.speaker && known.text === l.text;
  };
  if (!same(req.line)) return "Line does not match the script";
  if (!req.recent.every(same)) return "Context lines do not match the script";
  return null;
}
