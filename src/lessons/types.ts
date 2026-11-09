import type { Span } from '../weave/locate';
import type { EasyWord } from './easy';
import type { WeaveLine } from '../weave/parse';

/** 1 = the lesson's own phrases, down to 4 = small filler words. Higher tiers are spent first. */
export type Tier = 1 | 2 | 3 | 4;
export const TIERS: readonly Tier[] = [1, 2, 3, 4];

/** A place in a segment where the lesson could weave. Plain data, so it can cross messages. */
export interface Candidate extends Span {
  entryId: string;
  tier: Tier;
  /** The English matched, as it appears in the segment. */
  text: string;
  words: number;
}

export interface LessonCaps {
  /** Max candidates of the same entry per segment, by tier. Unset = no cap. */
  perEntryPerSegment: Partial<Record<Tier, number>>;
  /** Max candidates of the same entry per 1000 words of page, by tier (at least 1). Unset = no cap. */
  perEntryPer1000Words?: Partial<Record<Tier, number>>;
  /** Max share of the page's replacements a tier may take, 0–1. Unset = no cap. */
  maxShare: Partial<Record<Tier, number>>;
  /** Min words between two woven spans in a segment; tier 1 is exempt. */
  minGapWords: number;
}

export interface Category {
  id: string;
  label: string;
}

/**
 * A lesson changes what is selected, not the rest of the pipeline. Code finds
 * and allocates candidates; the model only writes French for the candidates
 * that can't be replaced with a fixed string.
 */
export interface Lesson {
  id: string;
  name: string;
  /** The language woven, by its name in prompts ("French"). */
  language: string;
  /** True = only this lesson's words change (unless top-up is on). */
  exclusive: boolean;
  density?: number;
  categories: Category[];
  caps: LessonCaps;
  /** Deterministic pre-pass; regex only, so it's cheap to run on a whole page. */
  findCandidates(segment: string): Candidate[];
  /** The fixed French for a candidate, or null if the model must write it. */
  resolveLocally(c: Candidate, segment: string): WeaveLine | null;
  /** Lemmas a model line may carry for this candidate; anything else is off-lesson. */
  lemmasFor(c: Candidate): readonly string[];
  categoryOf(c: Candidate): string;
  /** Digits to show before the French, e.g. "12" → "12 (douze)", where the French alone is hard to read in context. */
  numeralFor?(c: Candidate): string | undefined;
  /** One line for the prompt: which occurrence, the expected lemma and usage hints. */
  describeCandidate(c: Candidate, segment: string): string;
  /** What the lesson teaches, for the widget's reading texts (`src/reading`). */
  brief?: { level: string; teaches: string; grammar?: string };
  /** Easy words found by code in every paragraph, spent once the lesson's own words run out (`easy.ts`). */
  easyWords?: readonly EasyWord[];
  /** Picks its words for each page (themed words) instead of from a word bank. */
  pickPageWords?: boolean;
  /** Main lemmas the lesson teaches, so page words can leave them out. */
  teaches?: readonly string[];
  /** Lesson-wide instructions for the model. */
  promptFragment: string;
  /**
   * Words the model may add to reach the density once the lesson's own words
   * run out ("top-up"). The list goes in the system prompt so it is cached.
   */
  topUpVocabulary?: { promptList: string; lemmas: ReadonlySet<string> };
  /** Lemmas the top-up must not add, because code already places and caps them (page words). */
  topUpExclude?: readonly string[];
}
