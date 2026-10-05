import { getRule } from "./rules";
import type { Line } from "./script";
import type { RawModelOutput } from "./schema";
import { EMPTY_OUTPUT, type ModelOutput } from "./types";

const MAX_LEN = 400;

// Dates of birth must never reach the chart note, even if the model echoes one.
const DOB_PATTERNS = [
  /\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b/,
  /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(st|nd|rd|th)?,?\s+(19|20)\d{2}\b/i,
  /\b\d{1,2}(st|nd|rd|th)?\s+(of\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?,?\s+(19|20)\d{2}\b/i,
];
const looksLikeDob = (s: string) => DOB_PATTERNS.some((p) => p.test(s));

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .replace(/[.!?,;:"]+$/g, "")
    .trim();

/** True when `quote` appears word-for-word in the line (ignoring case, spacing, end punctuation). */
export function isQuoteOf(quote: string, lineText: string): boolean {
  const q = norm(quote);
  return q.length > 0 && norm(lineText).includes(q);
}

export type SanitizeContext = { line: Line; knownEventIds: string[] };
export type Sanitized = { update: ModelOutput; warnings: string[] };

/**
 * Turns the model's answer into a ModelOutput the reducer can trust.
 * The model proposes; this code decides what is allowed to count.
 */
export function sanitize(raw: RawModelOutput, ctx: SanitizeContext): Sanitized {
  const { line } = ctx;
  const turn = line.turn;
  const warnings: string[] = [];
  const warn = (m: string) => warnings.push(`Turn ${turn}: ${m}`);
  const out: ModelOutput = { ...EMPTY_OUTPUT, itemsCompleted: [], events: [], interventions: [] };
  const patient = line.speaker === "patient";

  // Free text: trim, cap length, and never let a date of birth through.
  const clean = (s: string | null | undefined, what: string): string | undefined => {
    if (!s) return undefined;
    const t = s.trim().slice(0, MAX_LEN);
    if (!t) return undefined;
    if (looksLikeDob(t)) {
      warn(`${what} looked like a date of birth and was dropped`);
      return undefined;
    }
    return t;
  };
  // Words attributed to the patient must really be theirs.
  const patientQuote = (s: string | null | undefined, what: string): string | undefined => {
    const t = clean(s, what);
    if (!t) return undefined;
    if (!patient || !isQuoteOf(t, line.text)) {
      warn(`${what} was not in the patient's words and was dropped`);
      return undefined;
    }
    return t;
  };

  // Checklist items. The conditional adherence item can only come from the pharmacist.
  for (const id of raw.itemsCompleted) {
    if (id === "G-01" && patient) {
      warn("G-01 reported on a patient line and was dropped");
      continue;
    }
    if (!out.itemsCompleted.includes(id)) out.itemsCompleted.push(id);
  }

  // Drug may be stated by either side.
  if (raw.drug && (raw.drug.name || raw.drug.strength || raw.drug.frequency)) {
    out.drug = {
      name: clean(raw.drug.name, "drug name"),
      strength: clean(raw.drug.strength, "drug strength"),
      frequency: clean(raw.drug.frequency, "drug frequency"),
    };
  }

  // Consent, missed dose, events and the ER answer come from the patient only.
  if (raw.consent) {
    if (patient) {
      out.consent = raw.consent;
      // Any consent answer, including "no contact", completes the consent step.
      if (!out.itemsCompleted.includes("S-04")) out.itemsCompleted.push("S-04");
    } else warn("consent reported on a pharmacist line and was dropped");
  }
  if (raw.missedDose) {
    if (patient) {
      const whichDose = clean(raw.missedDose.whichDose, "missed dose");
      if (whichDose)
        out.missedDose = {
          whichDose,
          reason: patientQuote(raw.missedDose.reason, "missed-dose reason"),
          schedule: clean(raw.missedDose.schedule, "schedule"),
        };
    } else warn("missed dose reported on a pharmacist line and was dropped");
  }
  if (raw.erOrHospital) {
    if (patient) out.erOrHospital = raw.erOrHospital;
    else warn("ER answer reported on a pharmacist line and was dropped");
  }

  if (raw.events.length > 0 && !patient) {
    warn("events reported on a pharmacist line were dropped");
  } else {
    for (const ev of raw.events) {
      const isNew = ev.ref === "new";
      if (!isNew && !ctx.knownEventIds.includes(ev.ref)) {
        warn(`unknown event ${ev.ref} was dropped`);
        continue;
      }
      let ruleId: string | null = null;
      if (ev.ruleId) {
        const rule = getRule(ev.ruleId);
        if (rule && rule.kind === "ade") ruleId = rule.id;
        else warn(`rule ${ev.ruleId} is not an ADE rule and was ignored`);
      }
      const verbatim = patientQuote(ev.verbatim, "event wording");
      if (isNew && !verbatim) {
        warn("a new event without the patient's exact words was dropped");
        continue;
      }
      out.events.push({
        ref: ev.ref,
        verbatim,
        ruleId: isNew ? ruleId : undefined,
        duration: clean(ev.duration, "duration"),
        treatmentsTried: clean(ev.treatmentsTried, "treatments tried"),
        patientAttribution: patientQuote(ev.patientAttribution, "patient's explanation"),
      });
    }
  }

  // Interventions are what the pharmacist said, so only pharmacist lines count.
  if (raw.interventions.length > 0 && patient) {
    warn("interventions reported on a patient line were dropped");
  } else {
    for (const iv of raw.interventions.slice(0, 5)) {
      const summary = clean(iv.summary, "intervention");
      if (summary) out.interventions.push({ summary });
    }
  }

  return { update: out, warnings };
}
