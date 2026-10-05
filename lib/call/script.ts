import demoCall1 from "@/content/scripts/demo-call-1.json";

export type Speaker = "pharmacist" | "patient";
export type Line = { turn: number; speaker: Speaker; text: string };

export type CallScript = {
  id: string;
  title: string;
  setup: { drug: string; indication: string };
  lines: Line[];
};

export const DEMO_CALL_1 = demoCall1 as CallScript;

/** How long to show a line before the next one, so it reads like speech. */
export function lineDelayMs(line: Line): number {
  return Math.min(1500 + line.text.length * 20, 6000);
}
