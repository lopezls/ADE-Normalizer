export const DRUG_INDICATIONS = {
  Dupixent: [
    "Atopic dermatitis",
    "Chronic obstructive pulmonary disease",
    "Asthma",
  ],
  Nemluvio: ["Atopic dermatitis", "Prurigo nodularis"],  Jascayd: [
    "Pulmonary fibrosis",
    "Idiopathic pulmonary fibrosis",
    "Interstitial lung disease",
  ],
  Tymlos: ["Osteoporosis"],
  Rezdiffra: ["Noncirrhotic metabolic dysfunction-associated steatohepatitis"],
} as const satisfies Record<string, readonly string[]>;

export type DrugName = keyof typeof DRUG_INDICATIONS;

export const DRUGS = Object.keys(DRUG_INDICATIONS) as DrugName[];

export function isValidPair(drug: string, indication: string) {
  return (
    Object.hasOwn(DRUG_INDICATIONS, drug) &&
    (DRUG_INDICATIONS[drug as DrugName] as readonly string[]).includes(indication)
  );
}
