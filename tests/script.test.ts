import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DEMO_CALL_1, lineDelayMs } from "../lib/call/script";

describe("demo-call-1 script", () => {
  it("has 20 lines numbered 1..20 in order", () => {
    expect(DEMO_CALL_1.lines.map((l) => l.turn)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });

  it("matches the speakers and text in docs/Demo-Call.md", () => {
    const md = readFileSync(resolve(__dirname, "../docs/Demo-Call.md"), "utf8");
    for (const l of DEMO_CALL_1.lines) {
      const who = l.speaker === "patient" ? "Patient" : "Pharmacist";
      expect(md, `turn ${l.turn}`).toContain(`${l.turn}. **${who}:** ${l.text}`);
    }
  });

  it("keeps line delays between 1.5s and 6s", () => {
    for (const l of DEMO_CALL_1.lines) {
      const d = lineDelayMs(l);
      expect(d).toBeGreaterThanOrEqual(1500);
      expect(d).toBeLessThanOrEqual(6000);
    }
  });
});
