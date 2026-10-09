import { fetchLiveToken } from "./client";
import { TurnBuilder, type RawTurn, type Word } from "./turns";

const DEEPGRAM_URL =
  "wss://api.deepgram.com/v1/listen?model=nova-3&language=en-US&diarize=true&smart_format=true" +
  "&interim_results=true&endpointing=300&utterance_end_ms=1000";

// Deepgram does not always say when a speaker has paused (speech_final), so a turn
// is also handed over after this long with no new words.
const IDLE_FLUSH_MS = 700;

export type MicHandlers = {
  /** A finished turn of speech. `speaker` is Deepgram's voice number, not yet a role. */
  onTurn: (turn: RawTurn & { lagMs?: number }) => void;
  /** Words still being recognized, for a "hearing..." line. Empty string clears it. */
  onInterim: (text: string) => void;
  /** The connection or microphone failed. The mic is already stopped. */
  onError: (message: string) => void;
};

export type MicSession = { stop: () => Promise<void> };

type DeepgramMessage = {
  type?: string;
  is_final?: boolean;
  speech_final?: boolean;
  channel?: { alternatives?: { transcript?: string; words?: Word[] }[] };
};

/** Browser only. Opens the microphone and streams it to Deepgram for live, speaker-labelled text. */
export async function startMic(h: MicHandlers): Promise<MicSession> {
  if (typeof MediaRecorder === "undefined") throw new Error("This browser cannot record audio");
  const token = await fetchLiveToken();

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    throw new Error("Microphone permission was denied or no microphone was found");
  }

  const ws = new WebSocket(DEEPGRAM_URL, ["bearer", token]);
  const builder = new TurnBuilder();
  let recorder: MediaRecorder | null = null;
  let closed = false;
  let idle: ReturnType<typeof setTimeout> | null = null;
  const clearIdle = () => {
    if (idle) clearTimeout(idle);
    idle = null;
  };

  const cleanup = () => {
    closed = true;
    clearIdle();
    if (recorder && recorder.state !== "inactive") recorder.stop();
    stream.getTracks().forEach((t) => t.stop());
  };
  // lagMs: how long after the last word was spoken the turn was handed over (Deepgram's
  // pause detection plus our wait). Approximate: audio is sent in 100 ms pieces.
  let startedAt = 0;
  const emit = (turns: RawTurn[]) =>
    turns.forEach((t) =>
      h.onTurn({ ...t, lagMs: t.endAt === undefined ? undefined : Math.max(0, Date.now() - startedAt - t.endAt * 1000) }),
    );

  await new Promise<void>((resolve, reject) => {
    ws.onopen = () => resolve();
    ws.onerror = () => {
      cleanup();
      reject(new Error("Could not connect to the speech service"));
    };
  });

  recorder = new MediaRecorder(stream);
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) ws.send(e.data);
  };
  recorder.start(100);
  startedAt = Date.now();

  ws.onmessage = (ev) => {
    let msg: DeepgramMessage;
    try {
      msg = JSON.parse(String(ev.data));
    } catch {
      return;
    }
    if (msg.type === "UtteranceEnd") {
      clearIdle();
      emit(builder.flush());
      return;
    }
    if (msg.type !== "Results") return;
    const alt = msg.channel?.alternatives?.[0];
    if (!alt) return;
    if (msg.is_final) {
      h.onInterim("");
      if (alt.words?.length) {
        emit(builder.add(alt.words, !!msg.speech_final));
        clearIdle();
        idle = setTimeout(() => emit(builder.flush()), IDLE_FLUSH_MS);
      }
    } else {
      h.onInterim(alt.transcript ?? "");
    }
  };
  ws.onerror = () => {
    if (closed) return;
    cleanup();
    h.onError("The speech service connection failed");
  };
  ws.onclose = () => {
    if (closed) return;
    cleanup();
    emit(builder.flush());
    h.onError("The speech service closed the connection");
  };

  return {
    async stop() {
      if (closed) return;
      cleanup();
      // Ask Deepgram to finish what it has, then hand over the last words.
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "CloseStream" }));
        await new Promise((r) => setTimeout(r, 1200));
      }
      ws.onclose = null;
      ws.onmessage = null;
      ws.close();
      emit(builder.flush());
      h.onInterim("");
    },
  };
}
