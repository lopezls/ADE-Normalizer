import { getRule } from "./rules";
import type { CallState, ItemId } from "./types";
import { ITEM_IDS } from "./types";

export type ChecklistItem = {
  id: ItemId;
  label: string;
  done: boolean;
  conditional: boolean;
};

/** Wording for the conditional item, as written in Demo-Call.md. */
const G01_LABEL = "Offer adherence tips (alarms, pill boxes, calendars)";

export function itemLabel(id: ItemId): string {
  if (id === "G-01") return G01_LABEL;
  return getRule(id)?.label ?? id;
}

/** Required steps always show; conditional G-01 appears only once triggered. */
export function visibleChecklist(s: CallState): ChecklistItem[] {
  return ITEM_IDS.filter((id) => id !== "G-01" || s.checklist["G-01"].triggeredAtTurn !== undefined).map(
    (id) => ({
      id,
      label: itemLabel(id),
      done: s.checklist[id].done,
      conditional: id === "G-01",
    }),
  );
}
