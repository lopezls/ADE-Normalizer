import { describe, expect, it } from "vitest";
import { roleFor, TurnBuilder, type Word } from "../lib/call/turns";

const w = (word: string, speaker: number): Word => ({ word, punctuated_word: word, speaker });

describe("TurnBuilder", () => {
  it("joins words from the same speaker across results and hands over on a pause", () => {
    const b = new TurnBuilder();
    expect(b.add([w("Hi", 0), w("this", 0)], false)).toEqual([]);
    expect(b.add([w("is", 0), w("Sam", 0)], true)).toEqual([{ speaker: 0, text: "Hi this is Sam" }]);
    expect(b.flush()).toEqual([]);
  });

  it("hands over the earlier turn when the speaker changes", () => {
    const b = new TurnBuilder();
    const done = b.add([w("Ready?", 0), w("Yes.", 1), w("Sure", 1)], false);
    expect(done).toEqual([{ speaker: 0, text: "Ready?" }]);
    expect(b.flush()).toEqual([{ speaker: 1, text: "Yes. Sure" }]);
  });

  it("flush returns what is left, once", () => {
    const b = new TurnBuilder();
    b.add([w("hello", 2)], false);
    expect(b.flush()).toEqual([{ speaker: 2, text: "hello" }]);
    expect(b.flush()).toEqual([]);
  });

  it("falls back to the punctuation-free word and the current speaker", () => {
    const b = new TurnBuilder();
    b.add([{ word: "hello", speaker: 1 }, { word: "there" }], true);
    expect(b.flush()).toEqual([]);
    expect(new TurnBuilder().add([{ word: "hi" }], true)).toEqual([{ speaker: 0, text: "hi" }]);
  });
});

describe("roleFor", () => {
  it("first voice is the pharmacist unless swapped", () => {
    expect(roleFor(3, 3, false)).toBe("pharmacist");
    expect(roleFor(1, 3, false)).toBe("patient");
    expect(roleFor(3, 3, true)).toBe("patient");
    expect(roleFor(1, 3, true)).toBe("pharmacist");
  });
});
