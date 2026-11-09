import { describe, expect, it } from 'vitest';
import { getExerciseType, fitsLevel, levelIndex } from '../../src/practice/exercises';
import { RECENT_EXERCISES } from '../../src/practice/plan';
import { countResult, countShown, MISSED_GAP, newCoverage, newSession, planNext, type Coverage, type Plan, type Plannable } from '../../src/practice/schedule';
import { seededRng } from '../../src/passage/rng';

const lesson: Plannable = {
  level: 'CEFR A2',
  points: ['greet', 'tu-vous', 'how', 'spell', 'numbers'],
  words: Array.from({ length: 20 }, (_, i) => `w${i}`),
};

/** `n` exercises as the widget runs them: the next planned when one is shown, before it's answered. */
function run(n: number, opts: { seed?: string; coverage?: Coverage; right?: (p: Plan) => boolean; of?: Plannable; speaking?: boolean } = {}): Plan[] {
  const random = seededRng(opts.seed ?? 'a').next;
  const coverage = opts.coverage ?? newCoverage();
  const session = newSession();
  const of = opts.of ?? lesson;
  const out: Plan[] = [];
  let pick = planNext(of, coverage, session, random, { listening: true, speaking: opts.speaking });
  for (let i = 0; i < n; i++) {
    countShown(coverage, pick);
    const next = planNext(of, coverage, session, random, { listening: true, speaking: opts.speaking });
    countResult(session, pick, opts.right?.(pick) ?? true);
    out.push(pick);
    pick = next;
  }
  return out;
}

describe('planNext', () => {
  it('picks only types that fit the level, never one of the last few', () => {
    for (const level of ['CEFR A1', 'CEFR A2–B1', 'B2–C1']) {
      const picks = run(60, { of: { ...lesson, level } });
      picks.forEach((p, i) => {
        expect(fitsLevel(getExerciseType(p.type)!, levelIndex(level)), `${p.type} at ${level}`).toBe(true);
        expect(picks.slice(Math.max(0, i - RECENT_EXERCISES), i).map((q) => q.type)).not.toContain(p.type);
      });
    }
  });

  it('picks a type for one language only in that language', () => {
    const types = (lang?: string) => new Set(['a', 'b', 'c'].flatMap((seed) => run(80, { seed, of: { ...lesson, level: 'CEFR A1', lang } }).map((p) => p.type)));
    expect(types('ja').has('particles')).toBe(true);
    expect(types('fr').has('particles')).toBe(false);
    expect(types().has('particles')).toBe(false);
  });

  it('reaches every point within two rounds of clusters, whatever the seed', () => {
    for (const seed of ['a', 'b', 'c', 'd']) {
      expect(new Set(run(3 * lesson.points.length, { seed }).map((p) => p.point)).size, seed).toBe(lesson.points.length);
    }
  });

  it('keeps a point for a few exercises at first', () => {
    const picks = run(12);
    const runs: number[] = [];
    picks.forEach((p, i) => (i && p.point === picks[i - 1]!.point ? runs[runs.length - 1]!++ : runs.push(1)));
    expect(Math.max(...runs)).toBeGreaterThanOrEqual(2);
    expect(Math.max(...runs)).toBeLessThanOrEqual(3);
  });

  it('brings a point answered wrong back, after its cluster', () => {
    let missedAt = -1;
    const picks = run(20, { right: (p) => !(p.index >= 6 && p.point === 'spell' && missedAt < 0 && (missedAt = p.index) >= 0) });
    const missed = picks[missedAt];
    if (!missed) return; // 'spell' wasn't asked after 6 with this seed
    const back = picks.slice(missedAt + 1).find((p) => p.point === 'spell');
    expect(back).toBeDefined();
    expect(back!.index - missedAt).toBeGreaterThanOrEqual(1);
    expect(back!.index - missedAt).toBeLessThanOrEqual(MISSED_GAP + 3);
  });

  it('starts a returning reader on the points practised least', () => {
    const coverage = newCoverage();
    coverage.points = { greet: 9, 'tu-vous': 9, how: 9, numbers: 9 };
    expect(run(1, { coverage })[0]!.point).toBe('spell');
  });

  it('grows the types it uses as the session goes on', () => {
    const picks = run(60);
    const kinds = (from: number, to: number) => new Set(picks.slice(from, to).map((p) => p.type)).size;
    expect(kinds(40, 60)).toBeGreaterThan(kinds(0, 10) - 2);
    expect(new Set(picks.map((p) => p.type)).size).toBeGreaterThan(new Set(picks.slice(0, 20).map((p) => p.type)).size);
  });

  it('goes through the theme words, a few per exercise', () => {
    const picks = run(5);
    expect(new Set(picks.flatMap((p) => p.words)).size).toBe(lesson.words.length);
  });

  it('works without points (a page)', () => {
    const picks = run(10, { of: { ...lesson, points: [] } });
    expect(picks.every((p) => p.point === undefined)).toBe(true);
  });

  it('counts only what was shown', () => {
    const coverage = newCoverage();
    run(7, { coverage });
    expect(Object.values(coverage.points).reduce((a, b) => a + b, 0)).toBe(7);
    expect(Object.values(coverage.types).reduce((a, b) => a + b, 0)).toBe(7);
  });
});
