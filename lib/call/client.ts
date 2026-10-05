import { compactState } from "./compact";
import type { AnalyzeRequest } from "./schema";
import type { Line } from "./script";
import { DEMO_CALL_1 } from "./script";
import type { CallState, ModelOutput } from "./types";

const TIMEOUT_MS = 25_000;

export type AnalyzeResult = { update: Partial<ModelOutput>; warnings: string[] };

/** Browser side: ask /api/analyze what one line shows. Throws an Error with a readable message. */
export async function analyzeRemote(line: Line, transcript: Line[], state: CallState): Promise<AnalyzeResult> {
  const recent = transcript.filter((l) => l.turn < line.turn).slice(-4);
  const body: AnalyzeRequest = {
    scriptId: DEMO_CALL_1.id,
    line,
    recent,
    state: compactState(state),
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const json = (await res.json().catch(() => null)) as
      | { ok: true; update: Partial<ModelOutput>; warnings: string[] }
      | { ok: false; error: string }
      | null;
    if (!json) throw new Error(`Unexpected response (${res.status})`);
    if (!json.ok) throw new Error(json.error);
    return { update: json.update, warnings: json.warnings };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError")
      throw new Error("The AI took too long to answer");
    if (err instanceof TypeError) throw new Error("Could not reach the server");
    throw err instanceof Error ? err : new Error("Unknown error");
  } finally {
    clearTimeout(timer);
  }
}
