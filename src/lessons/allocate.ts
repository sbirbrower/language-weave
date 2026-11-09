import { overlaps } from '../weave/locate';
import { countWords } from '../weave/select';
import { TIERS, type Candidate, type LessonCaps } from './types';

export interface Allocation {
  /** Chosen candidates per segment, in document order. */
  perSegment: Candidate[][];
  totalWords: number;
  /** floor(totalWords × density). */
  budget: number;
  /** English words allocated; ≤ budget. */
  spent: number;
}

function tooClose(text: string, a: Candidate, b: Candidate, minGap: number): boolean {
  const between = a.end <= b.start ? text.slice(a.end, b.start) : text.slice(b.end, a.start);
  return countWords(between) < minGap;
}

/**
 * Spends the page's word budget on lesson candidates: tier 1 first, then 2,
 * 3, 4, each in document order, subject to the lesson's caps. Pure and
 * deterministic: the same page always gets the same words.
 */
export function allocate(
  segments: Array<{ text: string; candidates: Candidate[] }>,
  density: number,
  caps: LessonCaps,
): Allocation {
  const totalWords = segments.reduce((n, s) => n + countWords(s.text), 0);
  const budget = Math.floor(totalWords * density);
  const perSegment: Candidate[][] = segments.map(() => []);
  let spent = 0;
  let count = 0;
  const perEntry = new Map<string, number>();

  for (const tier of TIERS) {
    // A tier's share is of the final total: n / (count + n) ≤ s  ⇔  n ≤ s/(1−s) × count.
    // Lower tiers run last, so `count` is already known.
    const share = caps.maxShare[tier];
    const maxInTier = share === undefined ? Infinity : Math.floor((share / (1 - share)) * count);
    const perEntryCap = caps.perEntryPerSegment[tier] ?? Infinity;
    const rate = caps.perEntryPer1000Words?.[tier];
    const perPageCap = rate === undefined ? Infinity : Math.max(1, Math.round((rate * totalWords) / 1000));
    let inTier = 0;

    segments.forEach(({ text, candidates }, i) => {
      const chosen = perSegment[i]!;
      for (const c of candidates) {
        if (c.tier !== tier) continue;
        if (inTier >= maxInTier) return;
        if (spent + c.words > budget) continue;
        if (chosen.some((k) => overlaps(k, c))) continue;
        if (chosen.filter((k) => k.entryId === c.entryId).length >= perEntryCap) continue;
        if ((perEntry.get(c.entryId) ?? 0) >= perPageCap) continue;
        if (tier !== 1 && chosen.some((k) => k.tier !== 1 && tooClose(text, k, c, caps.minGapWords))) continue;
        chosen.push(c);
        perEntry.set(c.entryId, (perEntry.get(c.entryId) ?? 0) + 1);
        spent += c.words;
        inTier++;
      }
    });
    count += inTier;
  }

  for (const chosen of perSegment) chosen.sort((a, b) => a.start - b.start);
  return { perSegment, totalWords, budget, spent };
}
