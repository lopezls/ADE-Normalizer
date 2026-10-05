import replay from "@/content/replay/demo-call-1.json";
import type { ModelOutput } from "./types";

const turns = replay.turns as unknown as Record<string, Partial<ModelOutput>>;

/** Stand-in for the AI in stage 1 step 5: returns the recorded result for a turn. */
export function replayFor(turn: number): Partial<ModelOutput> {
  return turns[String(turn)] ?? {};
}
