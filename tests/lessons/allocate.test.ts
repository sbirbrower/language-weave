import { describe, expect, it } from 'vitest';
import { allocate } from '../../src/lessons/allocate';
import type { Candidate, LessonCaps, Tier } from '../../src/lessons/types';
import { findAll } from '../../src/weave/locate';

const noCaps: LessonCaps = { perEntryPerSegment: {}, maxShare: {}, minGapWords: 0 };

/** Candidates for each listed word (tier per word), at every occurrence. */
function seg(text: string, tiers: Record<string, Tier>) {
  const candidates: Candidate[] = Object.entries(tiers).flatMap(([word, tier]) =>
    findAll(text, word).map((s) => ({ ...s, entryId: word, tier, text: word, words: 1 })),
  );
  return { text, candidates: candidates.sort((a, b) => a.start - b.start) };
}

const chosen = (perSegment: Candidate[][]) => perSegment.map((cs) => cs.map((c) => c.text));

describe('allocate', () => {
  // 20 words per segment.
  const filler = 'w '.repeat(16);
  const a = seg(`and hello and soon ${filler}`, { hello: 1, soon: 3, and: 4 });
  const b = seg(`soon and hello ${filler}x`, { hello: 1, soon: 3, and: 4 });

  it('spends the budget on higher tiers first, across the whole page', () => {
    const { perSegment, budget, spent } = allocate([a, b], 0.1, noCaps); // 40 words → 4
    expect(budget).toBe(4);
    expect(spent).toBe(4);
    expect(chosen(perSegment)).toEqual([['hello', 'soon'], ['soon', 'hello']]);
  });

  it('is deterministic', () => {
    expect(allocate([a, b], 0.2, noCaps)).toEqual(allocate([a, b], 0.2, noCaps));
  });

  it('never exceeds the budget', () => {
    expect(allocate([a, b], 0.05, noCaps).spent).toBe(2);
    expect(allocate([a, b], 0, noCaps).spent).toBe(0);
  });

  it('caps an entry per segment', () => {
    const caps = { ...noCaps, perEntryPerSegment: { 4: 1 } as const };
    expect(chosen(allocate([a], 1, caps).perSegment)).toEqual([['and', 'hello', 'soon']]);
  });

  it("caps a tier's share of the page", () => {
    // 2 hello + 2 soon allocated first; and ≤ 0.2/0.8 × 4 = 1.
    const caps = { ...noCaps, maxShare: { 4: 0.2 } as const };
    const { perSegment } = allocate([a, b], 1, caps);
    expect(perSegment.flat().filter((c) => c.tier === 4)).toHaveLength(1);
  });

  it('keeps a gap between spans, except for tier 1', () => {
    const s = seg(`and soon w w and hello ${filler}`, { hello: 1, soon: 3, and: 4 });
    const caps = { ...noCaps, minGapWords: 2 };
    // "soon" taken; the first "and" is 0 words from it, the second is 2 words away; hello is exempt.
    expect(chosen(allocate([s], 1, caps).perSegment)).toEqual([['soon', 'and', 'hello']]);
  });
});
