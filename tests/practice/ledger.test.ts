import { describe, expect, it } from 'vitest';
import { dayOf, newLedger, recordAnswer } from '../../src/practice/ledger';
import type { Plan } from '../../src/practice/schedule';

const plan: Plan = { index: 0, type: 'gap-fill', point: 'greet', words: ['bonjour', 'salut'] };

describe('recordAnswer', () => {
  it('counts the day, and the type, point and words in the lesson', () => {
    const ledger = newLedger();
    recordAnswer(ledger, 'fr-a1-bases', plan, true, '2026-11-08');
    recordAnswer(ledger, 'fr-a1-bases', plan, false, '2026-11-08');
    expect(ledger.days['2026-11-08']).toEqual({ right: 1, total: 2 });
    const lesson = ledger.lessons['fr-a1-bases']!;
    expect(lesson.types['gap-fill']).toEqual({ right: 1, wrong: 1, last: 'wrong', firstRight: '2026-11-08', lastRight: '2026-11-08' });
    expect(lesson.points['greet']).toMatchObject({ right: 1, wrong: 1 });
    expect(lesson.words['salut']).toMatchObject({ right: 1, wrong: 1 });
  });

  it('keeps the first day right and moves the last', () => {
    const ledger = newLedger();
    recordAnswer(ledger, 'fr-a1-bases', plan, true, '2026-11-08');
    recordAnswer(ledger, 'fr-a1-bases', plan, true, '2026-11-10');
    expect(ledger.lessons['fr-a1-bases']!.points['greet']).toMatchObject({ firstRight: '2026-11-08', lastRight: '2026-11-10' });
  });

  it('records a drill with no point or words under its type only', () => {
    const ledger = newLedger();
    recordAnswer(ledger, 'ja-a1-hajimemashite', { index: 0, type: 'drill-kana', words: [] }, false, '2026-11-08');
    const lesson = ledger.lessons['ja-a1-hajimemashite']!;
    expect(lesson.types['drill-kana']).toEqual({ right: 0, wrong: 1, last: 'wrong' });
    expect(lesson.points).toEqual({});
    expect(lesson.words).toEqual({});
  });
});

describe('dayOf', () => {
  it('gives the local day, padded', () => {
    expect(dayOf(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });
});
