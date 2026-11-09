import { readingsOnly, withoutReadings } from '../ruby';

/**
 * Marking a sentence said aloud, leniently, for learners: how much of it the
 * transcript heard, not whether it was said perfectly. Picked on recordings in
 * `evals/speak/` (`npm run speak`), where exact matching failed beginners on
 * one word Whisper misheard.
 */

/** Share of the sentence's words heard for "great"; at least `SPEECH_ALMOST` still passes. */
export const SPEECH_GREAT = 0.8;
export const SPEECH_ALMOST = 0.5;
/** A heard word counts as the expected one when this close by characters (grand ≈ grande, schon ≈ schön). */
export const WORD_CLOSE = 0.6;

export type SpeechTier = 'great' | 'almost' | 'retry';

export interface Heard {
  /** What the transcript said. */
  text: string;
  tier: SpeechTier;
  /** Share of the sentence's words heard, 0–1. */
  score: number;
  /** The sentence's words (characters for scripts without spaces), and whether each was heard. */
  words: Array<{ text: string; heard: boolean }>;
  /** The words are written with spaces between them. */
  spaced: boolean;
}

const UNSPACED = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}]/u;

/**
 * For comparing: no case, accents (Latin only: Devanagari vowel signs are marks too), punctuation,
 * nukta or chandrabindu (written either way), and katakana as hiragana.
 */
function key(s: string): string {
  return s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[’‘ʼ]/g, "'")
    .normalize('NFD')
    .replace(/[̀-़ͯ]/g, '')
    .replace(/ँ/g, 'ं')
    .normalize('NFC')
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/[^\p{L}\p{M}\p{N}']+/gu, '');
}

/** Words as written (characters without spaces), dropping any that are only punctuation. */
function units(text: string, unspaced: boolean): Array<{ text: string; key: string }> {
  const parts = unspaced ? [...text] : text.split(/\s+/);
  return parts.map((t) => ({ text: t, key: key(t) })).filter((u) => u.key);
}

function distance(a: string[], b: string[]): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) row[j] = Math.min(prev[j]! + 1, row[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = row;
  }
  return prev[b.length]!;
}

const closeness = (a: string, b: string) => 1 - distance([...a], [...b]) / Math.max([...a].length, [...b].length, 1);

/** Which of `expected` were heard, matched in order (the longest common subsequence). */
function heardInOrder(expected: string[], heard: string[], same: (a: string, b: string) => boolean): boolean[] {
  const n = expected.length;
  const m = heard.length;
  const L = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--) L[i]![j] = same(expected[i]!, heard[j]!) ? L[i + 1]![j + 1]! + 1 : Math.max(L[i + 1]![j]!, L[i]![j + 1]!);
  const got = new Array<boolean>(n).fill(false);
  for (let i = 0, j = 0; i < n && j < m; ) {
    if (same(expected[i]!, heard[j]!) && L[i]![j] === L[i + 1]![j + 1]! + 1) {
      got[i] = true;
      i++;
      j++;
    } else if (L[i + 1]![j]! >= L[i]![j + 1]!) i++;
    else j++;
  }
  return got;
}

/**
 * How well `transcript` heard `sentence` (target-language text, readings allowed): against the sentence
 * as written, or as its readings (a Japanese transcript in kana), whichever matches better.
 */
export function markSpeech(transcript: string, sentence: string): Heard {
  const unspaced = UNSPACED.test(sentence);
  const heard = units(transcript, unspaced).map((u) => u.key);
  const same = unspaced ? (a: string, b: string) => a === b : (a: string, b: string) => closeness(a, b) >= WORD_CLOSE;
  const forms = [...new Set([withoutReadings(sentence), readingsOnly(sentence)])];
  let best: { score: number; words: Heard['words'] } | undefined;
  for (const form of forms) {
    const expected = units(form, unspaced);
    const got = heardInOrder(expected.map((u) => u.key), heard, same);
    const score = got.filter(Boolean).length / Math.max(expected.length, 1);
    if (!best || score > best.score) best = { score, words: expected.map((u, i) => ({ text: u.text, heard: got[i]! })) };
  }
  const { score, words } = best!;
  return { text: transcript.trim(), tier: score >= SPEECH_GREAT ? 'great' : score >= SPEECH_ALMOST ? 'almost' : 'retry', score, words, spaced: !unspaced };
}
