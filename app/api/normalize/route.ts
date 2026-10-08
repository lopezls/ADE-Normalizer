import { z } from "zod";
import { checkLiveAccess } from "@/lib/call/liveAccess";
import { LIVE_SCRIPT_ID } from "@/lib/call/liveConstants";
import { normalizeAdes } from "@/lib/call/normalize";
import { DEMO_CALL_1 } from "@/lib/call/script";

export const maxDuration = 30;

const RequestSchema = z.object({
  scriptId: z.string().max(60),
  verbatims: z.array(z.string().min(1).max(300)).min(1).max(20),
});

// Same guard as /api/analyze: scripted calls only send wording that is in the
// script; live calls need the passcode. Never log call text.
export async function POST(request: Request) {
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false, error: "Invalid request" }, { status: 400 });
  const { scriptId, verbatims } = parsed.data;

  if (scriptId === LIVE_SCRIPT_ID) {
    const denied = checkLiveAccess(request);
    if (denied) return Response.json({ ok: false, error: denied }, { status: 401 });
  } else {
    if (scriptId !== DEMO_CALL_1.id) return Response.json({ ok: false, error: "Unknown script" }, { status: 422 });
    const patientText = DEMO_CALL_1.lines.filter((l) => l.speaker === "patient").map((l) => l.text);
    if (!verbatims.every((v) => patientText.some((t) => t.includes(v))))
      return Response.json({ ok: false, error: "Wording does not match the script" }, { status: 422 });
  }

  try {
    return Response.json({ ok: true, terms: await normalizeAdes(verbatims) });
  } catch (err) {
    console.error("normalize failed:", err instanceof Error ? err.name : "unknown");
    return Response.json({ ok: false, error: "Could not normalize" }, { status: 502 });
  }
}
