import { checkLiveAccess } from "@/lib/call/liveAccess";

// Gives the browser a short-lived Deepgram token so the real key never leaves the server.
export async function POST(request: Request) {
  const denied = checkLiveAccess(request);
  if (denied) return Response.json({ ok: false, error: denied }, { status: 401 });
  // Trim: a pasted key often carries a stray space or newline, which makes fetch throw.
  const key = process.env.DEEPGRAM_API_KEY?.trim();
  if (!key) return Response.json({ ok: false, error: "DEEPGRAM_API_KEY is not set" }, { status: 500 });

  try {
    const res = await fetch("https://api.deepgram.com/v1/auth/grant", {
      method: "POST",
      headers: { Authorization: `Token ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ ttl_seconds: 60 }),
    });
    if (!res.ok) {
      console.error("deepgram grant failed:", res.status);
      return Response.json({ ok: false, error: `Deepgram refused the request (${res.status})` }, { status: 502 });
    }
    const json = (await res.json()) as { access_token?: string };
    if (!json.access_token) return Response.json({ ok: false, error: "No token returned" }, { status: 502 });
    return Response.json({ ok: true, token: json.access_token });
  } catch (err) {
    // Log the kind of failure only; never the key.
    console.error("deepgram grant failed:", err instanceof Error ? `${err.name}: ${err.message}` : "unknown");
    return Response.json(
      { ok: false, error: "Could not reach Deepgram (check DEEPGRAM_API_KEY in the server settings)" },
      { status: 502 },
    );
  }
}
