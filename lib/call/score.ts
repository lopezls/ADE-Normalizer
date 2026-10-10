import { itemLabel } from "./checklist";
import { ITEM_IDS, type CallState, type ItemId } from "./types";

export const POINTS_PER_ITEM = 10;
export const PASS_PERCENT = 90;

export type ScoreRow = { id: string; label: string; done: boolean; extra: boolean; points: number };
/** The part of a score row that is stored with the encounter. */
export type AuditRow = { id: string; label: string; done: boolean; extra: boolean };

/** Percent from stored rows (each worth the same points). The server recomputes it rather than trusting the browser. */
export function percentOf(rows: Pick<AuditRow, "done">[]): number {
  return rows.length === 0 ? 0 : Math.round((rows.filter((r) => r.done).length / rows.length) * 100);
}

export type CallScore = {
  rows: ScoreRow[];
  earned: number;
  possible: number;
  percent: number;
  passed: boolean;
};

/**
 * Scores a finished call. The core steps (every checklist item except the conditional one)
 * are worth 10 points each. Extras join the total only when the call triggers them:
 * adherence support after a reported missed dose, and addressing any reported ADE.
 * A missed item still counts in the total, so it lowers the percentage.
 */
export function scoreCall(s: CallState): CallScore {
  const rows: ScoreRow[] = [];

  for (const id of ITEM_IDS) {
    if (id === "G-01") continue;
    rows.push({ id, label: itemLabel(id as ItemId), done: s.checklist[id].done, extra: false, points: POINTS_PER_ITEM });
  }

  if (s.checklist["G-01"].triggeredAtTurn !== undefined) {
    rows.push({ id: "G-01", label: itemLabel("G-01"), done: s.checklist["G-01"].done, extra: true, points: POINTS_PER_ITEM });
  }

  if (s.events.length > 0) {
    rows.push({
      id: "ADE",
      label: "Address the reported ADE (guidance given)",
      done: s.interventions.length > 0,
      extra: true,
      points: POINTS_PER_ITEM,
    });
  }

  const possible = rows.reduce((n, r) => n + r.points, 0);
  const earned = rows.reduce((n, r) => n + (r.done ? r.points : 0), 0);
  const percent = percentOf(rows);
  return { rows, earned, possible, percent, passed: percent >= PASS_PERCENT };
}
