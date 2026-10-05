import Anthropic from "@anthropic-ai/sdk";
import { AnalyzeError, analyzeLine } from "@/lib/call/analyze";
import { AnalyzeRequestSchema, checkAgainstScript } from "@/lib/call/schema";

export const maxDuration = 30;

const MAX_BODY_BYTES = 16_000;

// Request bodies hold call text. Never log them; log only the kind of failure.
export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return Response.json({ ok: false, error: "Request too large" }, { status: 413 });

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = AnalyzeRequestSchema.safeParse(json);
  if (!parsed.success) return Response.json({ ok: false, error: "Invalid request" }, { status: 400 });

  const notAllowed = checkAgainstScript(parsed.data);
  if (notAllowed) return Response.json({ ok: false, error: notAllowed }, { status: 422 });

  try {
    const { update, warnings } = await analyzeLine(parsed.data);
    return Response.json({ ok: true, turn: parsed.data.line.turn, update, warnings });
  } catch (err) {
    const kind =
      err instanceof AnalyzeError ? err.message
      : err instanceof Anthropic.RateLimitError ? "Rate limited, try again shortly"
      : err instanceof Anthropic.AuthenticationError ? "Server API key was rejected"
      : err instanceof Anthropic.APIError ? `Model request failed (${err.status})`
      : "Unexpected error";
    console.error("analyze failed:", err instanceof Error ? err.name : "unknown", kind);
    const status = err instanceof AnalyzeError && err.message.endsWith("is not set") ? 500 : 502;
    return Response.json({ ok: false, error: kind }, { status });
  }
}
