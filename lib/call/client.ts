import { compactState } from "./compact";
import type { AnalyzeRequest } from "./schema";
import type { Line } from "./script";
import { DEMO_CALL_1 } from "./script";
import { LIVE_SCRIPT_ID, PASSCODE_HEADER } from "./liveConstants";
import type { CallState, ModelOutput } from "./types";

// Typed by the pharmacist for live microphone calls. Memory only, never stored.
let livePasscode = "";
export function setLivePasscode(p: string) {
  livePasscode = p;
}
const liveHeaders = (): Record<string, string> => (livePasscode ? { [PASSCODE_HEADER]: livePasscode } : {});

const TIMEOUT_MS = 25_000;

export type AnalyzeResult = { update: Partial<ModelOutput>; warnings: string[] };

/** Browser side: ask /api/analyze what one line shows. Throws an Error with a readable message. */
export async function analyzeRemote(
  line: Line,
  transcript: Line[],
  state: CallState,
  live = false,
): Promise<AnalyzeResult> {
  const recent = transcript.filter((l) => l.turn < line.turn).slice(-4);
  const body: AnalyzeRequest = {
    scriptId: live ? LIVE_SCRIPT_ID : DEMO_CALL_1.id,
    line,
    recent,
    state: compactState(state),
    ...(live ? { setup: { drug: state.form.drug, indication: state.form.indication } } : {}),
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json", ...(live ? liveHeaders() : {}) },
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

/** Browser side: standard terms for the patient's wording. One entry per input, null if the AI could not name it. */
export async function normalizeRemote(verbatims: string[], live = false): Promise<(string | null)[]> {
  const res = await fetch("/api/normalize", {
    method: "POST",
    headers: { "content-type": "application/json", ...(live ? liveHeaders() : {}) },
    body: JSON.stringify({ scriptId: live ? LIVE_SCRIPT_ID : DEMO_CALL_1.id, verbatims }),
  });
  const json = (await res.json().catch(() => null)) as
    | { ok: true; terms: (string | null)[] }
    | { ok: false; error: string }
    | null;
  if (!json || !json.ok) throw new Error(json && !json.ok ? json.error : `Unexpected response (${res.status})`);
  return json.terms;
}

/** Browser side: a short-lived Deepgram token from our server (the real key stays there). */
export async function fetchLiveToken(): Promise<string> {
  const res = await fetch("/api/live-token", { method: "POST", headers: liveHeaders() });
  const json = (await res.json().catch(() => null)) as
    | { ok: true; token: string }
    | { ok: false; error: string }
    | null;
  if (!json || !json.ok) throw new Error(json && !json.ok ? json.error : `Unexpected response (${res.status})`);
  return json.token;
}

/** Browser side: is this passcode accepted? An empty one is fine when the server does not ask for it. */
export async function checkLivePasscode(passcode: string): Promise<{ ok: true } | { ok: false; error: string }> {
  setLivePasscode(passcode);
  try {
    const res = await fetch("/api/live-check", { method: "POST", headers: liveHeaders() });
    const json = (await res.json().catch(() => null)) as { ok: boolean; error?: string } | null;
    if (json?.ok) return { ok: true };
    return { ok: false, error: json?.error ?? `Unexpected response (${res.status})` };
  } catch {
    return { ok: false, error: "Could not reach the server" };
  }
}
