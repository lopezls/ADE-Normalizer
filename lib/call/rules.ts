import data from "@/content/rules.json";

// content/rules.json is generated from docs/Rules.md (npm run rules:build).
export type Rule = {
  id: string;
  kind: "ade" | "missed-dose" | "call-step" | "general";
  drug: string | null;
  triggerPhrases: string[];
  label: string | null;
  recommendation: string | null;
  contactPhysicianWhen: string | null;
  description: string | null;
  source: { name: string; url?: string };
};

export const RULES_REVIEWED: string = data.reviewed;
export const RULES: Rule[] = data.rules as Rule[];

const byId = new Map(RULES.map((r) => [r.id, r]));

/** Look up a rule by ID. Recommendation text only ever comes from here. */
export function getRule(id: string): Rule | undefined {
  return byId.get(id);
}

export function isRuleId(id: string): boolean {
  return byId.has(id);
}
