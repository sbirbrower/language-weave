import { EXERCISE_TYPES, fitsLang, fitsLevel, levelIndex, type ExerciseType, type Stage } from './exercises';
import { DRILL_SHARE, RECENT_EXERCISES, SPEAKING_SHARE, STAGE_WEIGHTS } from './plan';

/**
 * What each exercise practises, decided by code: a lesson point, a few of its
 * words and an exercise type. It looks random but works through everything.
 *
 * - Points come in small clusters (the same point two or three times running,
 *   each time as another type), least practised first, so a lesson's points
 *   are all reached; clusters shorten once every point has had its turn.
 * - A point answered wrong comes back a couple of exercises later, once the
 *   cluster on screen is done, as another type; at most `MISSED_MAX` times
 *   running, so one the reader keeps missing waits for its next cluster (this
 *   session only).
 * - Types start from a small working set, so the reader gets used to them,
 *   and a type is added every few exercises; stages follow the level's
 *   weights through a shuffled bag.
 * - Points, types and words practised are counted per lesson across sessions
 *   (`Coverage`), so a new session starts with what was practised least.
 * - In a lesson with drills (the language's first few), about `DRILL_SHARE` of
 *   exercises are one: on its sounds or script, no point or words, least used first.
 */

/** Per lesson, kept across sessions until the reader clears it. */
export interface Coverage {
  points: Record<string, number>;
  types: Record<string, number>;
  words: Record<string, number>;
}

/** This session only: thrown away when the widget closes. */
export interface Session {
  /** Exercises picked so far. */
  count: number;
  /** Per point, this session. */
  points: Record<string, number>;
  /** Per type, this session. */
  types: Record<string, number>;
  cluster?: { point: string; left: number };
  /** Stages still to come in this round, drawn from the end. */
  bag: Stage[];
  /** The types this session draws from; grows as it goes. */
  working: string[];
  /** Types picked lately, the latest last. */
  recent: string[];
  /** Words in the last exercise, not focused on again straight away. */
  lastWords: string[];
  /** Points answered wrong, to come back at exercise `due`. */
  missed: Array<{ point: string; due: number }>;
  /** Per point, how often it came back for being missed since its last cluster. */
  backs: Record<string, number>;
}

/** One exercise's plan. */
export interface Plan {
  /** Its place in the session, from 0. */
  index: number;
  type: string;
  /** The lesson point it practises; none on a page or a lesson without points. */
  point?: string;
  /** Theme words it should use. */
  words: string[];
  /** A point that was answered wrong, back again. */
  again?: boolean;
  /** Page mode: the section it's on, when it must be that one ("More like this"), not the one on screen. */
  section?: number;
}

export interface Plannable {
  /** "CEFR A2–B1" or "A2". */
  level: string;
  /** The language's code: some types come up only in some languages (`ExerciseType.langs`). */
  lang?: string;
  /** Point ids, in the lesson's order. */
  points: readonly string[];
  words: readonly string[];
}

export interface ScheduleOptions {
  listening: boolean;
  speaking?: boolean;
  /** The lesson's drill types (`drills/`), already without the listening ones if nothing reads aloud. */
  drills?: readonly string[];
}

/** Cluster lengths before every point has had `ROUND` exercises this session, then after. */
export const CLUSTER_EARLY: readonly number[] = [2, 3, 3];
export const CLUSTER_LATE: readonly number[] = [1, 2, 2];
const ROUND = 2;
/** A missed point comes back at least this many exercises after it was asked (the next one is already written when the answer comes). */
export const MISSED_GAP = 3;
/** A point comes back for being missed at most this many times between its clusters. */
export const MISSED_MAX = 2;
/** Types in the working set at the start, and one more every `GROW_EVERY` exercises. */
export const WORKING_START = 5;
export const GROW_EVERY = 3;
/** Stages in one round of the bag. */
const BAG_SIZE = 10;
/** Focus words per exercise. */
export const FOCUS_WORDS = 4;

export const newCoverage = (): Coverage => ({ points: {}, types: {}, words: {} });
export const newSession = (): Session => ({ count: 0, points: {}, types: {}, bag: [], working: [], recent: [], lastWords: [], missed: [], backs: {} });

const n = (counts: Record<string, number>, key: string) => counts[key] ?? 0;

/** One of `xs` with the lowest score, ties (within `slack`) broken at random. */
function leastBy<T>(xs: readonly T[], score: (x: T) => number, random: () => number, slack = 0): T | undefined {
  if (!xs.length) return undefined;
  const min = Math.min(...xs.map(score));
  const near = xs.filter((x) => score(x) <= min + slack);
  return near[Math.floor(random() * near.length)];
}

function shuffle<T>(xs: T[], random: () => number): T[] {
  for (let i = xs.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [xs[i], xs[j]] = [xs[j]!, xs[i]!];
  }
  return xs;
}

/** The level's stage weights, over the stages it has types for. */
function stageWeights(level: number, stages: readonly Stage[]): Array<[Stage, number]> {
  const base = STAGE_WEIGHTS[Math.min(level, STAGE_WEIGHTS.length - 1)]!;
  return stages.filter((s) => base[s] > 0).map((s) => [s, base[s]]);
}

/** A new round of stages in the weights' proportions (largest remainders), shuffled. */
function fillBag(weights: Array<[Stage, number]>, random: () => number): Stage[] {
  const total = weights.reduce((t, [, w]) => t + w, 0);
  const exact = weights.map(([s, w]) => [s, (w / total) * BAG_SIZE] as const);
  const bag: Stage[] = exact.flatMap(([s, x]) => Array<Stage>(Math.floor(x)).fill(s));
  const byRemainder = [...exact].sort((a, b) => (b[1] % 1) - (a[1] % 1));
  for (let i = 0; bag.length < BAG_SIZE; i++) bag.push(byRemainder[i % byRemainder.length]![0]);
  return shuffle(bag, random);
}

/** The next stage from the bag, refilled when empty; one with no type left to give is skipped. */
function nextStage(session: Session, weights: Array<[Stage, number]>, random: () => number, usable: (s: Stage) => boolean): Stage | undefined {
  for (let tries = 0; tries < 2; tries++) {
    if (!session.bag.length) session.bag = fillBag(weights, random);
    for (let i = session.bag.length - 1; i >= 0; i--) {
      if (usable(session.bag[i]!)) return session.bag.splice(i, 1)[0];
    }
    session.bag = [];
  }
  return undefined;
}

/** The least practised type (across sessions) not yet in the working set, from `stage` if given. */
function grow(session: Session, usable: readonly ExerciseType[], coverage: Coverage, random: () => number, stage?: Stage): string | undefined {
  const out = usable.filter((t) => !session.working.includes(t.id) && (!stage || t.stage === stage));
  const t = leastBy(out, (t) => n(coverage.types, t.id), random);
  if (t) session.working.push(t.id);
  return t?.id;
}

/** The working set at the start: the least practised type of each stage first, then the least practised of the rest. */
function startWorking(session: Session, usable: readonly ExerciseType[], weights: Array<[Stage, number]>, coverage: Coverage, random: () => number) {
  for (const [stage] of [...weights].sort((a, b) => b[1] - a[1])) grow(session, usable, coverage, random, stage);
  while (session.working.length < WORKING_START && grow(session, usable, coverage, random));
}

function pickType(lesson: Plannable, coverage: Coverage, session: Session, random: () => number, options: ScheduleOptions): string {
  const level = levelIndex(lesson.level);
  const fits = (t: ExerciseType) => !t.off && fitsLevel(t, level) && fitsLang(t, lesson.lang);
  const usable = EXERCISE_TYPES.filter((t) => fits(t) && (options.listening || !t.listening) && !t.speaking);
  const recent = new Set(session.recent.slice(-RECENT_EXERCISES));
  const speakable = options.speaking ? EXERCISE_TYPES.filter((t) => t.speaking && fits(t) && !recent.has(t.id)) : [];
  if (speakable.length && random() < SPEAKING_SHARE) return leastBy(speakable, (t) => n(session.types, t.id), random)!.id;

  const stages = [...new Set(usable.map((t) => t.stage))];
  const weights = stageWeights(level, stages);
  if (!session.working.length) startWorking(session, usable, weights, coverage, random);
  while (session.working.length < WORKING_START + Math.floor(session.count / GROW_EVERY) && grow(session, usable, coverage, random));

  const fresh = (t: ExerciseType) => !recent.has(t.id);
  const stage = nextStage(session, weights, random, (s) => usable.some((t) => t.stage === s && fresh(t)));
  const ofStage = usable.filter((t) => (!stage || t.stage === stage) && fresh(t));
  let pool = ofStage.filter((t) => session.working.includes(t.id));
  if (!pool.length) {
    // Nothing in the working set for this stage: it grows by one from it.
    const added = grow(session, ofStage, coverage, random, stage);
    pool = ofStage.filter((t) => t.id === added);
  }
  if (!pool.length) pool = usable.filter(fresh).length ? usable.filter(fresh) : usable;
  // Least used this session, so the working set is gone through before any type comes back.
  return leastBy(pool, (t) => n(session.types, t.id), random)!.id;
}

/** The point for the next exercise: the cluster going on, one answered wrong and due, or the least practised. */
function pickPoint(lesson: Plannable, coverage: Coverage, session: Session, random: () => number): { point?: string; again?: boolean } {
  const { points } = lesson;
  if (!points.length) return {};
  const cluster = session.cluster;
  if (cluster && cluster.left > 0) {
    cluster.left--;
    return { point: cluster.point };
  }
  const due = session.missed.findIndex((m) => m.due <= session.count && points.includes(m.point));
  if (due >= 0) {
    const point = session.missed.splice(due, 1)[0]!.point;
    session.backs[point] = n(session.backs, point) + 1;
    return { point, again: true };
  }
  const others = points.length > 1 ? points.filter((p) => p !== cluster?.point) : points;
  // Least practised this session, then across sessions; within one of the least, at random.
  const point = leastBy(others, (p) => n(session.points, p) * 1000 + n(coverage.points, p), random, 0) ?? others[0]!;
  const round = points.every((p) => n(session.points, p) >= ROUND);
  const sizes = round ? CLUSTER_LATE : CLUSTER_EARLY;
  const size = sizes[Math.floor(random() * sizes.length)]!;
  session.cluster = { point, left: size - 1 };
  session.backs[point] = 0;
  return { point };
}

/** Theme words least practised across sessions, not those of the exercise just before. */
function pickWords(lesson: Plannable, coverage: Coverage, session: Session, random: () => number): string[] {
  const pool = lesson.words.filter((w) => !session.lastWords.includes(w));
  const out: string[] = [];
  const left = [...(pool.length >= FOCUS_WORDS ? pool : lesson.words)];
  while (out.length < FOCUS_WORDS && left.length) {
    const w = leastBy(left, (w) => n(coverage.words, w), random, 0)!;
    out.push(w);
    left.splice(left.indexOf(w), 1);
  }
  return out;
}

/**
 * The next exercise's point, words and type. Moves the session on (its
 * cluster, bag, working set and recent types); coverage is counted only once
 * the exercise is shown (`countShown`), since one written ahead may never be.
 */
export function planNext(lesson: Plannable, coverage: Coverage, session: Session, random: () => number, options: ScheduleOptions): Plan {
  const drill = pickDrill(session, random, options.drills);
  if (drill) return advance(session, { index: session.count, type: drill, words: [] });
  const { point, again } = pickPoint(lesson, coverage, session, random);
  const type = pickType(lesson, coverage, session, random, options);
  const words = pickWords(lesson, coverage, session, random);
  return advance(session, { index: session.count, type, ...(point ? { point } : {}), words, ...(again ? { again } : {}) });
}

/** A drill, about `DRILL_SHARE` of the time: the one least used this session, not one used lately. Leaves the point's cluster where it is. */
function pickDrill(session: Session, random: () => number, drills: readonly string[] | undefined): string | undefined {
  if (!drills?.length || random() >= DRILL_SHARE) return undefined;
  const recent = new Set(session.recent.slice(-RECENT_EXERCISES));
  return leastBy(drills.filter((d) => !recent.has(d)), (d) => n(session.types, d), random);
}

/** Counts `plan` in the session: its place, type, point and words. */
function advance(session: Session, plan: Plan): Plan {
  session.count++;
  session.recent = [...session.recent, plan.type].slice(-RECENT_EXERCISES);
  session.types[plan.type] = n(session.types, plan.type) + 1;
  if (plan.point) session.points[plan.point] = n(session.points, plan.point) + 1;
  session.lastWords = plan.words;
  return plan;
}

/**
 * "More like this": another exercise of `like`'s type on its point, with new words.
 * The session moves on as for any exercise, but its cluster and missed points are left alone.
 */
export function planLike(like: Pick<Plan, 'type' | 'point' | 'section'>, lesson: Plannable, coverage: Coverage, session: Session, random: () => number): Plan {
  const words = pickWords(lesson, coverage, session, random);
  const { type, point, section } = like;
  return advance(session, { index: session.count, type, ...(point ? { point } : {}), words, ...(section !== undefined ? { section } : {}) });
}

/** The exercise was shown: its point, type and words count as practised. */
export function countShown(coverage: Coverage, plan: Plan) {
  coverage.types[plan.type] = n(coverage.types, plan.type) + 1;
  if (plan.point) coverage.points[plan.point] = n(coverage.points, plan.point) + 1;
  for (const w of plan.words) coverage.words[w] = n(coverage.words, w) + 1;
}

/** The reader answered: a point answered wrong comes back a little later, unless its cluster is about to bring it anyway. */
export function countResult(session: Session, plan: Plan, right: boolean) {
  const { point } = plan;
  if (right || !point || n(session.backs, point) >= MISSED_MAX) return;
  if (session.cluster?.point === point && session.cluster.left > 0) return;
  if (session.missed.some((m) => m.point === point)) return;
  session.missed.push({ point, due: plan.index + MISSED_GAP });
}
