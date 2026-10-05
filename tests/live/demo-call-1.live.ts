// Runs Demo Call 1 through the REAL model, line by line, the same way the browser does:
// send the line + last 4 lines + compact state, sanitize, apply with the reducer.
// Costs real money and is not deterministic. Run: npm run eval   (RUNS=3 npm run eval)
import { describe, expect, it } from "vitest";
import { analyzeLine } from "../../lib/call/analyze";
import { compactState } from "../../lib/call/compact";
import { callReducer, initialState } from "../../lib/call/reducer";
import { DEMO_CALL_1 } from "../../lib/call/script";
import type { CallState } from "../../lib/call/types";

const done = (s: CallState, id: string) => s.checklist[id as keyof CallState["checklist"]].done;

// Rows from "What the tool should do" in docs/Demo-Call.md, checked right after each turn.
const CHECKS: { turn: number; name: string; ok: (s: CallState) => boolean }[] = [
  { turn: 1, name: "S-01 self-identify", ok: (s) => done(s, "S-01") },
  { turn: 3, name: "S-02 recording disclosure", ok: (s) => done(s, "S-02") },
  { turn: 4, name: "S-03 not done before the patient replies", ok: (s) => !done(s, "S-03") },
  { turn: 5, name: "S-03 identity verified", ok: (s) => done(s, "S-03") },
  { turn: 6, name: "drug is Dupixent", ok: (s) => s.form.drug === "Dupixent" && /300/.test(s.drugDetail) },
  { turn: 6, name: "S-04 not done before the patient replies", ok: (s) => !done(s, "S-04") },
  { turn: 7, name: "S-04 consent step done", ok: (s) => done(s, "S-04") },
  { turn: 7, name: "consent = doctor only", ok: (s) => s.form.consent === "doctor" },
  { turn: 9, name: "one event with exact wording", ok: (s) => s.events.length === 1 && /i've also had some diarrhea/i.test(s.events[0].verbatim) },
  { turn: 9, name: "event matched D1-01", ok: (s) => s.events[0]?.ruleId === "D1-01" },
  { turn: 9, name: "missed dose with reason", ok: (s) => /work late/i.test(s.missedDose?.reason ?? "") },
  { turn: 9, name: "D1-MD matched", ok: (s) => s.matched.some((m) => m.ruleId === "D1-MD") },
  { turn: 9, name: "G-01 triggered and open", ok: (s) => s.checklist["G-01"].triggeredAtTurn === 9 && !done(s, "G-01") },
  { turn: 11, name: "duration recorded", ok: (s) => /day/i.test(s.events[0]?.duration ?? "") },
  { turn: 13, name: "treatments tried recorded", ok: (s) => !!s.events[0]?.treatmentsTried },
  { turn: 14, name: "intervention documented", ok: (s) => s.interventions.length >= 1 },
  { turn: 14, name: "G-01 still open", ok: (s) => !done(s, "G-01") },
  { turn: 14, name: "still exactly one event", ok: (s) => s.events.length === 1 },
  { turn: 16, name: "S-06 ER question asked", ok: (s) => done(s, "S-06") },
  { turn: 17, name: "ER answer = none", ok: (s) => s.form.erOrHospital === "none" },
  { turn: 18, name: "S-05 closing reminder", ok: (s) => done(s, "S-05") },
  { turn: 20, name: "all required steps done", ok: (s) => ["S-01", "S-02", "S-03", "S-04", "S-05", "S-06"].every((id) => done(s, id)) },
  { turn: 20, name: "G-01 still open at the end", ok: (s) => !done(s, "G-01") },
  { turn: 20, name: "no date of birth anywhere", ok: (s) => !/2002|january/i.test(JSON.stringify(s.form) + JSON.stringify(s.events)) },
];

const RUNS = Number(process.env.RUNS ?? 1);

describe("Demo Call 1 against the live model", () => {
  it(`passes the expected-behavior table (${RUNS} run${RUNS === 1 ? "" : "s"})`, async () => {
    const tally = new Map<string, number>();
    for (let run = 1; run <= RUNS; run++) {
      let s = initialState(DEMO_CALL_1.setup);
      for (const line of DEMO_CALL_1.lines) {
        s = callReducer(s, { type: "hear", line });
        const { update, warnings } = await analyzeLine({
          scriptId: DEMO_CALL_1.id,
          line,
          recent: s.transcript.filter((l) => l.turn < line.turn).slice(-4),
          state: compactState(s),
        });
        s = callReducer(s, { type: "apply", turn: line.turn, update, warnings });
        for (const c of CHECKS.filter((c) => c.turn === line.turn)) {
          const key = `turn ${String(c.turn).padStart(2)}  ${c.name}`;
          tally.set(key, (tally.get(key) ?? 0) + (c.ok(s) ? 1 : 0));
        }
      }
      if (s.warnings.length) console.log(`run ${run}: safety checks adjusted:`, s.warnings);
    }
    let failures = 0;
    console.log(`\nPass rate over ${RUNS} run(s):`);
    for (const [key, n] of tally) {
      if (n < RUNS) failures++;
      console.log(`  ${n === RUNS ? "PASS" : "FAIL"} ${n}/${RUNS}  ${key}`);
    }
    expect(failures, "some rows of the expected-behavior table failed").toBe(0);
  });
});
