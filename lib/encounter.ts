/**
 * Splits the events field on "-" (or new lines), then normalizes each ADE:
 * lowercase, letters/digits only (no spaces). Duplicates dropped, order kept.
 * Returned dash-joined, e.g. "Nausea - Hair loss" -> "nausea-hairloss".
 */
export function parseAdes(raw: string) {
  const ades = raw
    .split(/[-\n]/)
    .map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, ""))
    .filter(Boolean);
  return [...new Set(ades)].join("-");
}

/** What gets stored in med_changes_details. */
export function medListStatus(changed: boolean) {
  return changed ? "updated" : "confirmed";
}
