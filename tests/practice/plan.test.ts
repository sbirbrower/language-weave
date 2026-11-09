import { describe, expect, it } from 'vitest';
import { getExerciseType, fitsLevel, levelIndex } from '../../src/practice/exercises';
import { pickExercise, RECENT_EXERCISES } from '../../src/practice/plan';
import { seededRng } from '../../src/passage/rng';

/** `n` picks in a row, as the widget makes them. */
function picks(level: string, n: number, listening = true, seed = 'a', speaking = false): string[] {
  const random = seededRng(seed).next;
  const recent: string[] = [];
  return Array.from({ length: n }, () => {
    const type = pickExercise(level, random, { listening, speaking, recent });
    recent.push(type);
    if (recent.length > RECENT_EXERCISES) recent.shift();
    return type;
  });
}

describe('pickExercise', () => {
  it('picks only types that fit the level', () => {
    for (const level of ['CEFR A1', 'CEFR A2', 'CEFR A2–B1', 'CEFR B1', 'B2–C1']) {
      for (const id of picks(level, 40)) expect(fitsLevel(getExerciseType(id)!, levelIndex(level)), `${id} at ${level}`).toBe(true);
    }
  });

  it('never repeats one of the last few types', () => {
    const run = picks('CEFR A2', 60);
    run.forEach((id, i) => expect(run.slice(Math.max(0, i - RECENT_EXERCISES), i)).not.toContain(id));
  });

  it('gives beginners words and no texts, and later levels mostly texts', () => {
    const stage = (id: string) => getExerciseType(id)!.stage;
    const a1 = picks('CEFR A1', 80).map(stage);
    expect(a1).not.toContain('texts');
    expect(a1.filter((s) => s === 'words').length).toBeGreaterThan(a1.filter((s) => s === 'talk').length);
    const b2 = picks('B2–C1', 80).map(stage);
    expect(b2.filter((s) => s === 'texts').length).toBeGreaterThan(b2.filter((s) => s === 'words').length);
  });

  it('has no listening without speech', () => {
    expect(picks('CEFR A1', 60, false).some((id) => getExerciseType(id)!.listening)).toBe(false);
  });

  it('says sentences aloud only with speaking on, and then now and then', () => {
    const speaks = (id: string) => Boolean(getExerciseType(id)!.speaking);
    expect(picks('CEFR A1', 100).some(speaks)).toBe(false);
    const on = picks('CEFR A1', 200, true, 'b', true).filter(speaks).length;
    expect(on).toBeGreaterThan(10);
    expect(on).toBeLessThan(60);
  });
});
