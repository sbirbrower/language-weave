import { withoutReadings } from '../ruby';
import type { Heard } from './speaking';
import type { Step } from './types';

/**
 * What the reader has done in the exercise on screen. Each kind uses its own
 * part; it's thrown away with the exercise.
 */
export interface Answer {
  /** choice: the option; fix: the replacement. */
  pick?: number;
  /** fix: the chunk tapped as wrong. */
  at?: number;
  /** label: item → label. */
  labels: Map<number, number>;
  /** order: tiles placed, in order; dialogue: the choice made at each turn. */
  order: number[];
  /** tap: the line or gap; proofread: the words; units: the letters or syllables. */
  taps: Set<number>;
  /** write: what's been typed. */
  typed?: string;
  /** pairs: the word picked, the pairs matched, a wrong partner just tapped, and how many. */
  pairs: { picked?: number; done: Set<number>; miss?: number; misses: number };
  /** dialogue: wrong choices tried at this turn, and how many in all. */
  tried: Set<number>;
  misses: number;
  /** A listening exercise's text, shown when it can't be played. */
  shown: boolean;
  /** speak: recording or being heard now, what was heard last, how many tries, and why one failed. */
  spoken?: { status?: 'recording' | 'hearing'; heard?: Heard; tries: number; error?: string };
}

export const newAnswer = (): Answer => ({ labels: new Map(), order: [], taps: new Set(), pairs: { done: new Set(), misses: 0 }, tried: new Set(), misses: 0, shown: false });

/** Steps that finish by being played out, not by Check: a sentence said aloud passes once it's heard well enough. */
export const playsOut = (step: Step) => step.kind === 'pairs' || step.kind === 'dialogue' || step.kind === 'speak';

const same = (a: number[], b: number[]) => a.length === b.length && a.every((x, i) => x === b[i]);

/** A typed answer against the right one: case, spacing, apostrophes and end punctuation don't count; accents do. */
export function sameSpelling(typed: string, answer: string): boolean {
  const norm = (s: string) =>
    withoutReadings(s).normalize('NFC').toLowerCase().replace(/[’‘ʼ]/g, "'").replace(/[\s.!?¿¡,;:]+/gu, ' ').trim();
  return norm(typed) === norm(answer);
}

/** Whether the answer is right; undefined while it can't be checked yet. */
export function grade(step: Step, a: Answer): boolean | undefined {
  switch (step.kind) {
    case 'choice':
      return a.pick === undefined ? undefined : a.pick === step.answer;
    case 'label':
      return a.labels.size < step.items.length ? undefined : step.items.every((item, i) => a.labels.get(i) === item.label);
    case 'order': {
      if (!a.order.length || (step.layout === 'list' && a.order.length < step.tiles.length)) return undefined;
      // By text, so two tiles that read the same are interchangeable.
      const placed = a.order.map((i) => step.tiles[i]);
      return step.accepted.some((o) => same(o.map((i) => step.tiles.indexOf(step.tiles[i]!)), placed.map((t) => step.tiles.indexOf(t!))));
    }
    case 'tap':
      return a.taps.size ? a.taps.has(step.answer) : undefined;
    case 'proofread': {
      if (!a.taps.size) return undefined;
      const found = new Set([...a.taps].map((i) => step.tokens[i]!.error));
      return !found.has(-1) && step.errors.every((_, e) => found.has(e));
    }
    case 'fix':
      return a.at === undefined || a.pick === undefined ? undefined : a.at === step.wrong && a.pick === step.answer;
    case 'pairs':
      return a.pairs.done.size < step.pairs.length ? undefined : a.pairs.misses === 0;
    case 'dialogue':
      return a.order.length < step.turns.length ? undefined : a.misses === 0;
    case 'units': {
      if (!a.taps.size) return undefined;
      const want = new Set(step.answer);
      return a.taps.size === want.size && [...a.taps].every((i) => want.has(i));
    }
    case 'write':
      return a.typed?.trim() ? sameSpelling(a.typed, step.answer) : undefined;
    case 'speak':
      return a.spoken?.heard ? a.spoken.heard.tier !== 'retry' : undefined;
    default:
      return undefined;
  }
}
