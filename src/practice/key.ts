import type { JevAnswer, Noul } from '../marks/jev';
import { withoutReadings } from '../ruby';
import type { Step } from './types';

/**
 * Jev's check on an exercise's key, with a TypeSafe key: every word of a
 * "spot the form" text (is it a use of the form?), every option of a gap
 * fill and every particle in each of a particles exercise's sentences (does
 * it fit?), as one question each in one request. Jev disagreeing
 * with the key on any of them means a word the key missed, a word it
 * shouldn't have, or a second right option, and the reader would be marked
 * wrong for a right tap: the exercise is written once more. On 79
 * hand-labelled exercises (`npm run eval -- exercise`, `batched`) it caught
 * 20 of 23 broken ones and flagged 9 of 56 good ones; a flag costs only a
 * rewrite, written while the reader does the exercise before.
 */

/** A claim is yes at or above it. */
export const KEY_THRESHOLD = 0.5;

export interface KeyCheck {
  state: unknown;
  questions: Record<string, Noul>;
  /** Per question: what the key says. */
  keyed: Record<string, boolean>;
}

const member = (language: string, form: string, n: number, word: string): Noul => ({
  type: 'noul',
  instructions: `In this ${language} text, word [${n}] ("${word}") is one of: ${form}.`,
  criteria: {
    true: `As it's used in this sentence, it is one of: ${form}. Part of a longer form (such as one word of a compound tense) counts.`,
    false: `It is something else here, even if it looks like one: another tense, an article, another kind of word with the same ending.`,
  },
});

const fits = (language: string, filler: number | string): Noul => ({
  type: 'noul',
  instructions: `With ${typeof filler === 'number' ? `option ${filler} in the gap` : filler}, the sentence is correct ${language} and says what the English says.`,
  criteria: {
    true: `Correct grammar and a natural word for the meaning, even if it's not the one the exercise teaches.`,
    false: `A wrong form, ending, case or word, or a meaning the English doesn't have.`,
  },
});

/** The questions for an exercise whose key Jev checks, or null for any other. */
export function keyCheck(step: Step, language: string, level: string): KeyCheck | null {
  if (step.kind === 'proofread' && step.form) {
    // Each use of the form is one claim, each other word one more; spaces and punctuation none.
    const claims: Array<{ text: string; keyed: boolean }> = step.errors.map((e) => ({ text: withoutReadings(e.text), keyed: true }));
    const at = step.tokens.map((t) => {
      if (t.error >= 0) return t.error;
      if (!/\p{L}/u.test(t.text)) return -1;
      claims.push({ text: withoutReadings(t.text).replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''), keyed: false });
      return claims.length - 1;
    });
    // The text with each claim numbered after it: "Zwei[2]".
    const text = step.tokens
      .map((t, i) => {
        const plain = withoutReadings(t.text);
        if (at[i]! < 0 || at[i + 1] === at[i]) return plain;
        const word = plain.trimEnd();
        return `${word}[${at[i]! + 1}]${plain.slice(word.length)}`;
      })
      .join('');
    return {
      state: { language, level, group: step.form, text },
      questions: Object.fromEntries(claims.map((c, i) => [`w${i + 1}`, member(language, step.form!, i + 1, c.text)])),
      keyed: Object.fromEntries(claims.map((c, i) => [`w${i + 1}`, c.keyed])),
    };
  }
  if (step.kind === 'label' && step.type === 'particles') {
    // Each sentence with each particle one claim: only its answer should fit.
    const particles = step.labels.map((l) => l.text);
    const sentences = step.items.map((it) => withoutReadings(it.text));
    const claims = step.items.flatMap((it, i) => particles.map((p, k) => ({ id: `s${i + 1}p${k + 1}`, i, p, keyed: k === it.label })));
    return {
      state: {
        language,
        level,
        sentences: Object.fromEntries(step.items.map((it, i) => [`sentence ${i + 1}`, { text: sentences[i], english: it.en, filled: Object.fromEntries(particles.map((p) => [p, sentences[i]!.replace('___', p)])) }])),
      },
      questions: Object.fromEntries(claims.map((c) => [c.id, fits(language, `${c.p} in the gap of sentence ${c.i + 1}`)])),
      keyed: Object.fromEntries(claims.map((c) => [c.id, c.keyed])),
    };
  }
  if (step.kind === 'choice' && step.type === 'gap' && step.prompt.text?.includes('___')) {
    const sentence = withoutReadings(step.prompt.text);
    const options = step.options.map((o) => withoutReadings(o.text));
    return {
      state: { language, level, sentence, english: step.full?.en ?? '', filled: Object.fromEntries(options.map((o, i) => [`option ${i + 1}`, sentence.replace('___', o)])) },
      questions: Object.fromEntries(options.map((_, i) => [`o${i + 1}`, fits(language, i + 1)])),
      keyed: Object.fromEntries(options.map((_, i) => [`o${i + 1}`, i === step.answer])),
    };
  }
  return null;
}

/** Whether Jev disagrees with the key on any claim; one it didn't answer counts as agreeing. */
export const keyFlagged = (check: KeyCheck, answers: Record<string, JevAnswer>) =>
  Object.entries(check.keyed).some(([q, keyed]) => {
    const p = answers[q]?.noul;
    return p !== undefined && p >= KEY_THRESHOLD !== keyed;
  });
