import { EXERCISE_TYPES, fitsLang, fitsLevel, levelIndex, type Stage } from './exercises';

/** An exercise type isn't picked again until this many others have been. */
export const RECENT_EXERCISES = 4;

/**
 * How often each stage comes up, by level (A1, A2, B1, then B2 and above):
 * beginners mostly recognise words, later levels mostly read.
 */
export const STAGE_WEIGHTS: ReadonlyArray<Record<Stage, number>> = [
  { words: 5, forms: 4, texts: 0, talk: 1 },
  { words: 2, forms: 4, texts: 3, talk: 1 },
  { words: 1, forms: 4, texts: 4, talk: 1 },
  { words: 0, forms: 4, texts: 5, talk: 1 },
];

/** With speaking exercises on, about this share of exercises are said aloud (less, since a type isn't picked twice running). */
export const SPEAKING_SHARE = 0.2;

/** In a lesson with drills (`drills/`), about this share of exercises are drills on its sounds or script. */
export const DRILL_SHARE = 0.3;

export interface PickOptions {
  /** Something can read the language aloud; without it there are no listening exercises. */
  listening: boolean;
  /** The reader turned speaking exercises on and the microphone can be heard. */
  speaking?: boolean;
  /** Types picked lately, the latest last: avoided while there are others. */
  recent?: readonly string[];
  /** The language's code, for the types only some languages have. */
  lang?: string;
}

/**
 * The next exercise's type for a lesson at `level` ("CEFR A2–B1"): a stage by
 * the level's weights, then one of its types, avoiding the last few. The
 * Practice tab plans with `schedule.ts` now; this is kept as the baseline its
 * simulation compares against (`npm run eval -- schedule`). Speaking
 * has its own share, so turning it on makes it come up, whatever the stage weights.
 */
export function pickExercise(level: string, random: () => number, options: PickOptions): string {
  const lvl = levelIndex(level);
  const recent = new Set((options.recent ?? []).slice(-RECENT_EXERCISES));
  const usable = EXERCISE_TYPES.filter((t) => fitsLevel(t, lvl) && fitsLang(t, options.lang) && (options.listening || !t.listening) && (options.speaking || !t.speaking));
  const fresh = usable.filter((t) => !recent.has(t.id));
  const speakable = fresh.filter((t) => t.speaking);
  if (speakable.length && random() < SPEAKING_SHARE) return speakable[Math.floor(random() * speakable.length)]!.id;
  const silent = (fresh.length ? fresh : usable).filter((t) => !t.speaking);
  const pool = silent.length ? silent : usable;
  const weights = STAGE_WEIGHTS[Math.min(lvl, STAGE_WEIGHTS.length - 1)]!;
  const stages = (Object.keys(weights) as Stage[]).filter((s) => weights[s] > 0 && pool.some((t) => t.stage === s));
  const total = stages.reduce((n, s) => n + weights[s], 0);
  let r = random() * total;
  const stage = stages.find((s) => (r -= weights[s]) < 0) ?? stages.at(-1);
  const types = stage ? pool.filter((t) => t.stage === stage) : pool;
  return types[Math.floor(random() * types.length)]!.id;
}
