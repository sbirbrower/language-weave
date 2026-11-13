import type { JevAnswer, Noul } from '../marks/jev';
import { withoutReadings } from '../ruby';
import { loose } from './exercises';
import { describeExercise } from './hint';
import type { Exercise, Step } from './types';

/**
 * Whether an exercise gives its answer away: what decides it is on screen before it's answered, so
 * reading it is enough and the lesson isn't needed. The same test for every language and type, on
 * what the reader sees:
 * - a sort whose items show their own group, half of them or more: "du lernst" under "du",
 *   "lernst" under "-st", "o livro" under "o";
 * - pairs whose halves show each other ("du" and "du lernst"), half of them or more;
 * - a choice whose question or text has the answer in it and no other option.
 * `parsePractice` drops one, as it does a broken one, so it's written again.
 */
export function givesAway(ex: Exercise): boolean {
  switch (ex.kind) {
    case 'label': {
      // A word of the label that only its own group's items have: "du" of "faire du" in "Je fais du tennis", "hace" of "hace…".
      const own = (i: { text: string; label: number }) =>
        pieces(ex.labels[i.label]?.text ?? '').some((p) => has(i.text, p) && ex.items.every((o) => o.label === i.label || !has(o.text, p)));
      return mostly(ex.items.map((i) => shows(i.text, ex.labels[i.label]?.text ?? '') || shows(i.text, ex.labels[i.label]?.en ?? '') || own(i)));
    }
    case 'pairs':
      return mostly(ex.pairs.map((p) => shows(p.left, p.right) || shows(p.right, p.left)));
    case 'choice': {
      const seen = `${ex.prompt.question ?? ''}\n${ex.prompt.text ?? ''}`;
      const shown = ex.options.map((o) => Boolean(o.text) && shows(seen, o.text));
      return Boolean(shown[ex.answer]) && shown.filter(Boolean).length === 1;
    }
    default:
      return false;
  }
}

const mostly = (xs: boolean[]) => xs.length > 0 && xs.filter(Boolean).length * 2 >= xs.length;

const UNSPACED = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}]/u;

/**
 * Whether `text` shows `mark`: as a whole word or words, or, for an ending or beginning ("-st",
 * "ge-"), on one of its words. A mark is read as each of its parts: split at "/" ("er/sie/es"), and
 * what's in brackets apart from the rest ("informal (tu)").
 */
function shows(text: string, mark: string): boolean {
  const t = loose(text);
  const words = t.split(' ');
  const inBrackets = [...mark.matchAll(/\(([^)]*)\)/g)].map((m) => m[1]!);
  const parts = [mark.replace(/\([^)]*\)/g, ' '), ...inBrackets].flatMap((p) => p.split('/')).map(loose);
  return parts.some((m) => {
    if (!/\p{L}/u.test(m)) return false;
    const end = /^[-‐–](\S+)$/u.exec(m)?.[1];
    if (end) return words.some((w) => w.length > end.length && w.endsWith(end));
    const start = /^(\S+)[-‐–]$/u.exec(m)?.[1];
    if (start) return words.some((w) => w.length > start.length && w.startsWith(start));
    return has(text, m);
  });
}

/**
 * Whether `text` has `m` (already `loose`): as a whole word or words, or anywhere in a script without
 * spaces, and in Korean, which joins particles to words (마지막 in 마지막으로), anywhere but a single syllable.
 */
function has(text: string, m: string): boolean {
  const t = loose(text);
  if (UNSPACED.test(m) || (/\p{Script=Hangul}/u.test(m) && m.length > 1)) return t.includes(m);
  return ` ${t} `.includes(` ${m} `);
}

/** A label's words, split at spaces and at what marks a pattern ("hace…", "〜と思います", "lam + present", "一边…一边…"). */
const pieces = (label: string) =>
  loose(label)
    .split(/[\s/()+…~〜,]+|\.{2,}/u)
    .filter((p) => /\p{L}/u.test(p) && !/^[-‐–]|[-‐–]$/u.test(p));

/**
 * Jev's chance at or above which a sort counts as giving its answer away. On 122 sorts (2026-11-13,
 * `npm run eval -- practice`) those from 0.8 up were nearly all real ones; below, the scores were noise.
 */
export const GIVEAWAY_THRESHOLD = 0.8;

/**
 * Jev's question for what the code check can't see: whether a learner who hasn't learned the point
 * could still get the exercise right by reading it (a look-alike, a letter only some items have).
 * The exercise as shown, and its answer, as the hint check sees them (`describeExercise`). Sorts only:
 * on meanings, gaps and pairs its chances sat around 0.5 whatever the exercise.
 */
export function jevGiveaway(step: Step, language: string, level: string): { state: unknown; questions: Record<string, Noul> } | null {
  if (step.kind !== 'label' || step.type !== 'sort') return null;
  const { exercise, answer } = describeExercise(step);
  return {
    state: { language, level, exercise: withoutReadings(exercise), answer: withoutReadings(answer) },
    questions: {
      reading: {
        type: 'noul',
        instructions: `A learner of ${language} who hasn't learned what this exercise practises could still get it right just by reading what's shown.`,
        criteria: {
          true: 'What is shown gives the answer: an item carries the word, ending or letter its group is named by; a partner repeats its pair; the question or sentence contains the answer; only the answer looks like the prompt (the same word, an English look-alike); or something on the surface of the spelling decides it (a letter, accent or character only some have, length, capitals).',
          false: 'Getting it right takes knowing a meaning, a rule or a form the exercise practises.',
        },
      },
    },
  };
}

/** Whether Jev thinks the sort gives its answer away; one it didn't answer counts as not. */
export const giveawayFlagged = (answers: Record<string, JevAnswer>) => (answers.reading?.noul ?? 0) >= GIVEAWAY_THRESHOLD;
