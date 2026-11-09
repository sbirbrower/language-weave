import type { Noul } from '../marks/jev';
import { withoutReadings } from '../ruby';
import type { Step } from './types';

/**
 * Jev's check on a pairs exercise, with a TypeSafe key: is there only one way
 * to match them? Two formal questions matched to two formal people can be
 * swapped, and the reader is marked wrong for a right answer.
 */

/** Below it the exercise is written once more. Not yet tuned by an eval. */
export const PAIRS_THRESHOLD = 0.5;

export function jevPairsQuestions(language: string): Record<string, Noul> {
  return {
    unique: {
      type: 'noul',
      instructions: `A learner who knows ${language} well can match the pairs in only one way: every left item fits its own partner and no other partner in the list.`,
      criteria: {
        true: 'Each left item fits only its own partner; swapping any two partners makes a match wrong.',
        false: 'At least two left items could be swapped between their partners and both matches would still be right.',
      },
    },
  };
}

/** What Jev sees for one pairs exercise. */
export function jevPairsState(step: Extract<Step, { kind: 'pairs' }>) {
  return {
    instruction: step.instruction,
    left: step.pairs.map((p) => withoutReadings(p.left)),
    partners: step.pairs.map((p) => withoutReadings(p.right)),
    intended_pairs: step.pairs.map((p) => `${withoutReadings(p.left)} → ${withoutReadings(p.right)}`),
  };
}
