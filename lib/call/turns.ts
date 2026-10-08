export type Word = { word: string; punctuated_word?: string; speaker?: number };
export type RawTurn = { speaker: number; text: string };

/**
 * Turns Deepgram's finalized words into whole turns. Words from the same
 * speaker join into one turn, even across results. A turn is handed over when
 * the speaker changes, when Deepgram reports a pause (speech_final), or on flush().
 */
export class TurnBuilder {
  private pending: RawTurn | null = null;

  /** Add the words of one finalized result. Returns the turns that are now complete. */
  add(words: Word[], speechFinal: boolean): RawTurn[] {
    const done: RawTurn[] = [];
    for (const w of words) {
      const speaker = w.speaker ?? this.pending?.speaker ?? 0;
      const text = w.punctuated_word ?? w.word;
      if (this.pending && this.pending.speaker === speaker) {
        this.pending.text += ` ${text}`;
      } else {
        if (this.pending) done.push(this.pending);
        this.pending = { speaker, text };
      }
    }
    if (speechFinal && this.pending) {
      done.push(this.pending);
      this.pending = null;
    }
    return done;
  }

  /** Whatever is still waiting, for when the call is paused or ended. */
  flush(): RawTurn[] {
    const left = this.pending ? [this.pending] : [];
    this.pending = null;
    return left;
  }
}

/** The first voice heard is the pharmacist (they open the call). `swapped` flips that. */
export function roleFor(speaker: number, firstSpeaker: number, swapped: boolean): "pharmacist" | "patient" {
  const isFirst = speaker === firstSpeaker;
  return isFirst !== swapped ? "pharmacist" : "patient";
}
