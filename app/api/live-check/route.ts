import { checkLiveAccess } from "@/lib/call/liveAccess";

// Lets the call screen tell the pharmacist whether the passcode is right before the call starts.
export async function POST(request: Request) {
  const denied = checkLiveAccess(request);
  if (denied) return Response.json({ ok: false, error: denied }, { status: 401 });
  return Response.json({ ok: true });
}
