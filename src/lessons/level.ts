import type { Level } from '../grammar/types';
import type { WeaveLine } from '../weave/parse';
import type { Rejection } from '../weave/select';
import { a1WordsFor } from './a1';
import { normalizeLemma } from './resolve';
import type { Lesson } from './types';

/**
 * Whether a weave lesson keeps its beginner lists at each level: the easy
 * words code finds in every paragraph, and the A1 list its top-up picks from.
 * From B1 the reader knows them, so the page words and the general weave,
 * both picked for the reader's level, fill the rest.
 */
const BEGINNER_LISTS: Record<Level, boolean> = { A1: true, A2: true, B1: false, B2: false };

/** The lesson as woven for a reader at this level; the content script and the background both build it here. */
export function forLevel(lesson: Lesson, level: Level): Lesson {
  return BEGINNER_LISTS[level] ? lesson : { ...lesson, easyWords: undefined, topUpVocabulary: undefined };
}

const a1Lemmas = new Map<string, ReadonlySet<string>>();

/**
 * A general request's lines for a reader at this level. From B1 the A1 list
 * is a floor: the model still returns words a beginner knows ("small",
 * "now") about one time in seven, and code turns them away. A language
 * without an A1 list keeps every line.
 */
export function aboveBeginner(lines: WeaveLine[], level: Level, lang: string): { kept: WeaveLine[]; rejected: Rejection[] } {
  if (BEGINNER_LISTS[level]) return { kept: lines, rejected: [] };
  let a1 = a1Lemmas.get(lang);
  if (!a1) a1Lemmas.set(lang, (a1 = new Set((a1WordsFor(lang) ?? []).map((w) => normalizeLemma(w.lemma)))));
  const known = (l: WeaveLine) => a1.has(normalizeLemma(l.lemma));
  return { kept: lines.filter((l) => !known(l)), rejected: lines.filter(known).map((line) => ({ line, reason: 'off-lesson' as const })) };
}
