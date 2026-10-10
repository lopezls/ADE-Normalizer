// Plays the presentation call (content/scripts/john-smith-call.json) through the REAL model,
// the same way the browser does, and checks what the screen would show at the end.
// Costs real money and is not deterministic. Run: npm run eval   (RUNS=3 npm run eval)
import { describe, expect, it } from "vitest";
import smith from "../../content/scripts/john-smith-call.json";
import { analyzeLine } from "../../lib/call/analyze";
import { buildChartNote } from "../../lib/call/chartNote";
import { compactState } from "../../lib/call/compact";
import { callReducer, initialState } from "../../lib/call/reducer";
import { scoreCall } from "../../lib/call/score";
import type { Line } from "../../lib/call/script";
import type { CallState } from "../../lib/call/types";

const lines = smith.lines as Line[];
const done = (s: CallState, id: string) => s.checklist[id as keyof CallState["checklist"]].done;

const CHECKS: { name: string; ok: (s: CallState) => boolean }[] = [
  { name: "RPH name is Alex", ok: (s) => /^alex$/i.test(s.form.rphName.trim()) },
  { name: "S-01 self-identify", ok: (s) => done(s, "S-01") },
  { name: "S-02 recording disclosure", ok: (s) => done(s, "S-02") },
  { name: "S-03 identity verified", ok: (s) => done(s, "S-03") },
  { name: "S-11 directions (SIG)", ok: (s) => done(s, "S-11") },
  { name: "S-10 barriers", ok: (s) => done(s, "S-10") },
  { name: "S-08 medication list question", ok: (s) => done(s, "S-08") },
  { name: "S-07 missed doses question", ok: (s) => done(s, "S-07") },
  { name: "S-06 ER question", ok: (s) => done(s, "S-06") },
  { name: "S-09 any questions", ok: (s) => done(s, "S-09") },
  // On purpose: this call never says when the pharmacist will reach out again.
  { name: "S-05 closing timeline is MISSED (never said)", ok: (s) => !done(s, "S-05") },
  { name: "score is 91% (10 of 11 points steps), still green", ok: (s) => scoreCall(s).percent === 91 && scoreCall(s).passed },
  { name: "drug Dupixent, 300 mg", ok: (s) => s.form.drug === "Dupixent" && /300/.test(s.drugDetail) },
  { name: "medication list = yes, multivitamin started", ok: (s) => s.form.medChanges === "yes" && s.medChangeList.some((m) => /multivitamin/i.test(m.name) && m.action === "started") },
  { name: "one ADE, back pain, in the patient's words", ok: (s) => s.events.length === 1 && /back pain/i.test(s.events[0].verbatim) },
  { name: "back pain matched the joint/muscle/back pain rule", ok: (s) => s.events[0]?.ruleId === "D1-05" || /pain/i.test(s.events[0]?.label ?? "") },
  { name: "no missed dose recorded", ok: (s) => s.missedDose === null },
  { name: "no adherence item triggered", ok: (s) => s.checklist["G-01"].triggeredAtTurn === undefined },
  { name: "ER answer = none", ok: (s) => s.form.erOrHospital === "none" },
  { name: "guidance (Aleve/Tylenol) documented", ok: (s) => /aleve|tylenol/i.test(s.form.interventions) },
  { name: "no date of birth in the form or events", ok: (s) => !/1954|october/i.test(JSON.stringify(s.form) + JSON.stringify(s.events)) },
];

const RUNS = Number(process.env.RUNS ?? 1);

describe("Presentation call (John Smith) against the live model", () => {
  it(`fills the screen as expected (${RUNS} run${RUNS === 1 ? "" : "s"})`, async () => {
    const tally = new Map<string, number>();
    let last: CallState | null = null;
    for (let run = 1; run <= RUNS; run++) {
      let s = initialState(smith.setup);
      for (const line of lines) {
        s = callReducer(s, { type: "hear", line });
        const { update, warnings } = await analyzeLine({
          scriptId: smith.id,
          line,
          recent: s.transcript.filter((l) => l.turn < line.turn).slice(-4),
          state: compactState(s),
        });
        s = callReducer(s, { type: "apply", turn: line.turn, update, warnings });
      }
      s = callReducer(s, { type: "end" });
      for (const c of CHECKS) tally.set(c.name, (tally.get(c.name) ?? 0) + (c.ok(s) ? 1 : 0));
      last = s;
    }

    if (last) {
      const score = scoreCall(last);
      console.log(`\nScore: ${score.percent}% (${score.earned}/${score.possible})`);
      console.log("Missed:", score.rows.filter((r) => !r.done).map((r) => r.label).join("; ") || "nothing");
      console.log("Matched rules:", last.matched.map((m) => m.ruleId).join(", ") || "none");
      console.log("Events:", JSON.stringify(last.events.map((e) => [e.verbatim, e.ruleId])));
      console.log("Med list:", JSON.stringify(last.medChangeList.map((m) => [m.name, m.action])));
      console.log("Warnings:", last.warnings.join(" | ") || "none");
      console.log("\n" + buildChartNote(last));
    }

    let failures = 0;
    console.log(`\nPass rate over ${RUNS} run(s):`);
    for (const [name, n] of tally) {
      if (n < RUNS) failures++;
      console.log(`  ${n === RUNS ? "PASS" : "FAIL"} ${n}/${RUNS}  ${name}`);
    }
    expect(failures, "some rows failed").toBe(0);
  });
});
