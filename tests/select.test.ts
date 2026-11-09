import { describe, expect, it } from 'vitest';
import type { WeaveLine } from '../src/weave/parse';
import { countWords, segmentBudgets, selectReplacements } from '../src/weave/select';

const line = (original: string, replacement: string): WeaveLine => ({
  original,
  replacement,
  lemma: replacement,
  gender: '-',
  pos: 'phrase',
  gloss: original,
});

const text = 'The dog ran out of the house and ate the apple under the old tree.';

describe('selectReplacements', () => {
  it('locates lines and returns them in document order', () => {
    const { accepted, rejected } = selectReplacements(
      text,
      [line('the apple', 'la pomme'), line('of the house', 'de la maison')],
      { budget: 10 },
    );
    expect(accepted.map((r) => r.replacement)).toEqual(['de la maison', 'la pomme']);
    expect(accepted[0]).toMatchObject({ start: 16, end: 28, words: 3 });
    expect(rejected).toEqual([]);
  });

  it('rejects spans that are missing, too long, unchanged or overlapping', () => {
    const { accepted, rejected } = selectReplacements(
      text,
      [
        line('the cat', 'le chat'),
        line('ran out of the house and', 'est sorti de la maison et'),
        line('dog', 'Dog'),
        line('the apple', 'la pomme'),
        line('ate the apple', 'a mangé la pomme'),
        line('tree', 'un arbre très très très très très très très vieux et grand'),
      ],
      { budget: 10 },
    );
    expect(accepted.map((r) => r.original)).toEqual(['the apple']);
    expect(rejected.map((r) => r.reason)).toEqual([
      'not-found',
      'span-too-long',
      'unchanged',
      'overlap',
      'replacement-too-long',
    ]);
  });

  it('does not match inside longer words', () => {
    const { rejected } = selectReplacements('concatenate', [line('cat', 'chat')], { budget: 5 });
    expect(rejected[0]?.reason).toBe('not-found');
  });

  it('spends the budget in document order, skipping spans that do not fit', () => {
    const { accepted, rejected } = selectReplacements(
      text,
      [line('the old tree', 'le vieil arbre'), line('the house', 'la maison'), line('dog', 'chien')],
      { budget: 3 },
    );
    expect(accepted.map((r) => r.original)).toEqual(['dog', 'the house']);
    expect(rejected).toMatchObject([{ reason: 'over-budget', line: { original: 'the old tree' } }]);
  });
});

describe('countWords', () => {
  it('counts whitespace-separated words', () => {
    expect(countWords('  of the   house ')).toBe(3);
    expect(countWords('')).toBe(0);
  });
});

describe('segmentBudgets', () => {
  it('sums to floor(total × density)', () => {
    const counts = [30, 12, 55, 7, 80, 41];
    const budgets = segmentBudgets(counts, 0.08);
    expect(budgets.reduce((a, b) => a + b, 0)).toBe(Math.floor(225 * 0.08));
  });

  it('gives each segment a share based only on the words before it', () => {
    expect(segmentBudgets([25, 25, 25, 25], 0.08)).toEqual([2, 2, 2, 2]);
    expect(segmentBudgets([10, 10, 10, 10], 0.08)).toEqual([0, 1, 1, 1]);
    expect(segmentBudgets([10, 10], 0.08)).toEqual(segmentBudgets([10, 10, 10, 10], 0.08).slice(0, 2));
  });
});
