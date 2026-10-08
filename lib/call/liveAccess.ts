import { timingSafeEqual } from "node:crypto";
import { PASSCODE_HEADER } from "./liveConstants";


/**
 * Server only. Live microphone lines are free text, so these endpoints could be
 * used as a free chatbot or to burn the Deepgram budget. In production a passcode
 * is required; in local development it is optional. Returns an error or null.
 */
export function checkLiveAccess(request: Request): string | null {
  const expected = process.env.LIVE_CALL_PASSCODE?.trim();
  if (!expected) {
    return process.env.NODE_ENV === "production" ? "Live microphone is not enabled on this server" : null;
  }
  const given = Buffer.from(request.headers.get(PASSCODE_HEADER) ?? "");
  const want = Buffer.from(expected);
  return given.length === want.length && timingSafeEqual(given, want) ? null : "Wrong passcode";
}
