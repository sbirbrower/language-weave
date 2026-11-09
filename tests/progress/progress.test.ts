import { describe, expect, it } from 'vitest';
import type { Kit } from '../../src/passage/kit';
import { newLedger, recordAnswer, type Ledger } from '../../src/practice/ledger';
import { addDays, calendar, currentLevel, DAY_GOAL, lessonProgress, levels, milestones, needsWork, recap, standing, streaks } from '../../src/progress/progress';
import type { SyllabusLesson } from '../../src/syllabus/types';

const lesson = (id: string, level = 'CEFR A1'): SyllabusLesson => ({ id, lang: 'fr', title: id, level, points: [] });
const kit = (points: string[], words: string[]) =>
  ({ points: points.map((id) => ({ id, label: `Label ${id}` })), themeVocab: words.map((word) => ({ word, gloss: `en ${word}` })) }) as unknown as Kit;

/** `n` answers on `day`, all on one point and word. */
function answer(ledger: Ledger, lessonId: string, day: string, right: boolean, n = 1, point = 'greet', word = 'bonjour', type = 'gap-fill') {
  for (let i = 0; i < n; i++) recordAnswer(ledger, lessonId, { index: 0, type, point, words: [word] }, right, day);
}

describe('standing', () => {
  it('needs work when last wrong or wrong more often than right', () => {
    expect(standing({ right: 5, wrong: 1, last: 'wrong' })).toBe('needs-work');
    expect(standing({ right: 1, wrong: 2, last: 'right', firstRight: '2026-11-01', lastRight: '2026-11-02' })).toBe('needs-work');
  });
  it('learned only once right on two days', () => {
    expect(standing({ right: 3, wrong: 0, last: 'right', firstRight: '2026-11-08', lastRight: '2026-11-08' })).toBe('practising');
    expect(standing({ right: 2, wrong: 0, last: 'right', firstRight: '2026-11-07', lastRight: '2026-11-08' })).toBe('learned');
  });
});

describe('addDays', () => {
  it('crosses months and years', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('streaks', () => {
  const days = (counts: Record<string, number>) => Object.fromEntries(Object.entries(counts).map(([d, total]) => [d, { total, right: total }]));

  it('counts days with the goal met; today still to come keeps yesterday’s', () => {
    const s = streaks(days({ '2026-11-05': DAY_GOAL, '2026-11-06': DAY_GOAL, '2026-11-07': DAY_GOAL, '2026-11-08': 1 }), '2026-11-08');
    expect(s).toEqual({ current: 3, best: 3, reached: ['2026-11-05', '2026-11-06', '2026-11-07'] });
  });

  it('breaks on a day missed', () => {
    const s = streaks(days({ '2026-11-01': DAY_GOAL, '2026-11-02': DAY_GOAL, '2026-11-04': DAY_GOAL }), '2026-11-08');
    expect(s.current).toBe(0);
    expect(s.best).toBe(2);
  });

  it('includes today once it counts', () => {
    expect(streaks(days({ '2026-11-07': DAY_GOAL, '2026-11-08': DAY_GOAL }), '2026-11-08').current).toBe(2);
  });
});

describe('calendar', () => {
  it('ends with the week of today, Monday first, later days marked future', () => {
    // 2026-11-05 is a Thursday.
    const weeks = calendar({ '2026-11-05': { total: 12, right: 10 } }, '2026-11-05', 2);
    expect(weeks).toHaveLength(2);
    expect(weeks[1]!.map((d) => d.day)).toEqual(['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08']);
    expect(weeks[1]![3]).toMatchObject({ total: 12, shade: 3, future: false });
    expect(weeks[1]![4]!.future).toBe(true);
    expect(weeks[0]![0]!.day).toBe('2026-10-26');
  });
});

describe('lessonProgress', () => {
  it('lists the kit’s topics and words, practised or not, and is done when every topic is learned', () => {
    const ledger = newLedger();
    answer(ledger, 'a', '2026-11-07', true, 1, 'greet');
    answer(ledger, 'a', '2026-11-08', true, 1, 'greet');
    const p = lessonProgress(lesson('a'), kit(['greet', 'count'], ['bonjour', 'un']), ledger.lessons['a']);
    expect(p.topics.map((t) => [t.label, t.standing])).toEqual([['Label greet', 'learned'], ['Label count', undefined]]);
    expect(p.words[0]).toMatchObject({ label: 'bonjour', gloss: 'en bonjour', standing: 'learned' });
    expect(p.answered).toBe(2);
    expect(p.done).toBe(false);
    answer(ledger, 'a', '2026-11-07', true, 1, 'count');
    answer(ledger, 'a', '2026-11-08', true, 1, 'count');
    expect(lessonProgress(lesson('a'), kit(['greet', 'count'], []), ledger.lessons['a']).done).toBe(true);
  });

  it('without a kit, shows what was practised by its key', () => {
    const ledger = newLedger();
    answer(ledger, 'a', '2026-11-08', false, 1, 'greet');
    const p = lessonProgress(lesson('a'), undefined, ledger.lessons['a']);
    expect(p.topics).toMatchObject([{ key: 'greet', label: 'greet', standing: 'needs-work' }]);
    expect(p.done).toBe(false);
  });
});

describe('levels', () => {
  it('groups by level in order; the current is the first not done', () => {
    const ledger = newLedger();
    answer(ledger, 'a', '2026-11-07', true, 1, 'greet');
    answer(ledger, 'a', '2026-11-08', true, 1, 'greet');
    const all = [lessonProgress(lesson('a'), kit(['greet'], []), ledger.lessons['a']), lessonProgress(lesson('b', 'CEFR A2'), kit(['past'], []), undefined)];
    const l = levels(all);
    expect(l).toEqual([
      { level: 'CEFR A1', lessons: 1, started: 1, done: 1, topics: 1, learned: 1 },
      { level: 'CEFR A2', lessons: 1, started: 0, done: 0, topics: 1, learned: 0 },
    ]);
    expect(currentLevel(l)?.level).toBe('CEFR A2');
  });
});

describe('needsWork', () => {
  it('lists topics and words that need work, the most missed first', () => {
    const ledger = newLedger();
    answer(ledger, 'a', '2026-11-08', false, 1, 'greet', 'bonjour');
    answer(ledger, 'a', '2026-11-08', false, 3, 'count', 'un');
    const flagged = needsWork([lessonProgress(lesson('a'), kit(['greet', 'count'], ['bonjour', 'un']), ledger.lessons['a'])]);
    expect(flagged.map((f) => `${f.kind}:${f.key}`)).toEqual(['topic:count', 'word:un', 'topic:greet', 'word:bonjour']);
  });
});

describe('recap', () => {
  it('compares this week with the one before and counts what was first right this week', () => {
    const ledger = newLedger();
    answer(ledger, 'a', '2026-10-30', false, 2, 'old', 'vieux');
    answer(ledger, 'a', '2026-11-07', true, 3);
    answer(ledger, 'a', '2026-11-08', false, 1);
    const r = recap(ledger, [lessonProgress(lesson('a'), kit(['greet', 'old'], ['bonjour', 'vieux']), ledger.lessons['a'])], '2026-11-08');
    expect(r.week).toEqual({ total: 4, right: 3, days: 2 });
    expect(r.lastWeek).toEqual({ total: 2, right: 0, days: 1 });
    expect(r.all.total).toBe(6);
    expect([r.newTopics, r.newWords, r.needsWork]).toEqual([1, 1, 4]);
  });
});

describe('milestones', () => {
  it('dates the ones the ledger can and leaves the rest undated', () => {
    const ledger = newLedger();
    answer(ledger, 'a', '2026-11-06', true, DAY_GOAL);
    answer(ledger, 'a', '2026-11-07', true, DAY_GOAL);
    answer(ledger, 'a', '2026-11-08', true, 50);
    answer(ledger, 'a', '2026-11-08', true, 1, 'greet', 'bonjour', 'say');
    const m = Object.fromEntries(milestones(ledger, [lessonProgress(lesson('a'), kit(['greet'], []), ledger.lessons['a'])], '2026-11-08').map((x) => [x.id, x]));
    expect(m['exercises-1']).toMatchObject({ reached: true, on: '2026-11-06' });
    expect(m['exercises-50']).toMatchObject({ reached: true, on: '2026-11-08' });
    expect(m['exercises-100']!.reached).toBe(false);
    expect(m['streak-3']).toMatchObject({ reached: true, on: '2026-11-08' });
    expect(m['lesson-1']).toEqual({ id: 'lesson-1', title: 'First lesson done', reached: true });
    expect(m['level-A1']!.reached).toBe(true);
    expect(m['say-1']).toMatchObject({ reached: true, on: '2026-11-08' });
  });
});
