import { locate, type Span } from './locate';
import type { WeaveLine } from './parse';

export interface Replacement extends WeaveLine, Span {
  /** English words replaced; this is what the density budget counts. */
  words: number;
  /** Vocab-list group, e.g. a lesson category. */
  category?: string;
  /** The lesson word inside a span the model extended ("word" in "the Sanskrit word"); the vocab list shows this. */
  term?: string;
  /** Digits shown before the French: "12 (douze)". */
  numeral?: string;
}

export type RejectReason =
  | 'not-found'
  | 'overlap'
  | 'span-too-long'
  | 'replacement-too-long'
  | 'unchanged'
  | 'over-budget'
  | 'off-lesson';

export interface Rejection {
  line: WeaveLine;
  reason: RejectReason;
}

export interface SelectOptions {
  /** Max English words this segment may replace. */
  budget: number;
  maxSpanWords?: number;
  /** Spans already claimed in this segment (e.g. by a lesson); new ones must not overlap them. */
  taken?: Span[];
  category?: string;
}

export const MAX_SPAN_WORDS = 5;

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** French usually runs longer than English, but not 3× plus a sentence. */
function replacementTooLong(original: string, replacement: string): boolean {
  return replacement.length > original.length * 3 + 12;
}

/** Checks that don't depend on where the span is. */
export function checkLine(line: WeaveLine, maxSpanWords = MAX_SPAN_WORDS): RejectReason | null {
  if (countWords(line.original) > maxSpanWords) return 'span-too-long';
  if (line.replacement.trim().toLowerCase() === line.original.trim().toLowerCase()) return 'unchanged';
  if (replacementTooLong(line.original, line.replacement)) return 'replacement-too-long';
  return null;
}

/**
 * Turns the model's lines into validated, located replacements for one
 * segment. Lines are located in the order the model gave them (earlier lines
 * win overlaps); the word budget is then spent in document order so the
 * result doesn't depend on how the model ordered its output.
 */
export function selectReplacements(
  text: string,
  lines: WeaveLine[],
  { budget, maxSpanWords = MAX_SPAN_WORDS, taken = [], category }: SelectOptions,
): { accepted: Replacement[]; rejected: Rejection[] } {
  const located: Replacement[] = [];
  const rejected: Rejection[] = [];

  for (const line of lines) {
    const problem = checkLine(line, maxSpanWords);
    if (problem) {
      rejected.push({ line, reason: problem });
      continue;
    }
    const found = locate(text, line.original, { taken: [...taken, ...located] });
    if (!found.ok) {
      rejected.push({ line, reason: found.reason });
      continue;
    }
    located.push({ ...line, ...found.span, words: countWords(line.original), category });
  }

  located.sort((a, b) => a.start - b.start);

  const accepted: Replacement[] = [];
  let spent = 0;
  for (const r of located) {
    if (spent + r.words > budget) {
      rejected.push({ line: r, reason: 'over-budget' });
      continue;
    }
    spent += r.words;
    accepted.push(r);
  }
  return { accepted, rejected };
}

/**
 * Splits a page-wide word budget across segments. Each segment's share is
 * the difference of cumulative floors, so the shares sum to
 * floor(totalWords × density) and each depends only on the words before it,
 * not on which response arrives first.
 */
export function segmentBudgets(wordCounts: number[], density: number): number[] {
  let cumulative = 0;
  return wordCounts.map((n) => {
    const before = Math.floor(cumulative * density);
    cumulative += n;
    return Math.floor(cumulative * density) - before;
  });
}
