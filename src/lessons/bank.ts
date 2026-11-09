import type { Gender } from '../languages';
import { findAll, overlaps } from '../weave/locate';
import { countWords } from '../weave/select';
import type { Candidate, Category, Lesson, LessonCaps, Tier } from './types';

/** One row of a lesson's word bank. */
export interface BankEntry {
  id: string;
  tier: Tier;
  category: string;
  /** Regex source for the English, without boundaries; they're added when compiled. */
  english: string;
  /** Match case exactly (e.g. "Miss" the title, not "miss" the verb). */
  caseSensitive?: boolean;
  /** The French: written in code when `fixed`, otherwise shown to the model as the target. */
  french: string;
  /** Lemmas the model may return; the first is canonical and used for fixed replacements. */
  lemmas: string[];
  gender?: Gender;
  pos: string;
  gloss: string;
  /** Replace with `french` in code, without the model. Only for context-free words. */
  fixed?: boolean;
  /** Usage notes for the model. */
  hint?: string;
  /** Shown before the French as "12 (douze)". */
  numeral?: string;
}

// Word boundaries for English. Hyphenated compounds ("well-known") and
// possessives ("teacher's") are excluded: the French would read as nonsense.
const BEFORE = String.raw`(?<![\p{L}\p{N}_]|\p{L}[-‐])`;
const AFTER = String.raw`(?![\p{L}\p{N}_]|[-‐]\p{L}|['’]s(?!\p{L}))`;

export function compileEntry(e: BankEntry): RegExp {
  return new RegExp(`${BEFORE}(?:${e.english})${AFTER}`, e.caseSensitive ? 'gu' : 'giu');
}

/**
 * Finds every match of every entry, then resolves overlaps: higher tier wins,
 * then the longer match, so "see you soon" beats "soon".
 */
export function findBankCandidates(text: string, entries: BankEntry[], patterns: RegExp[]): Candidate[] {
  const all: Candidate[] = [];
  entries.forEach((entry, i) => {
    for (const m of text.matchAll(patterns[i]!)) {
      all.push({
        start: m.index,
        end: m.index + m[0].length,
        entryId: entry.id,
        tier: entry.tier,
        text: m[0],
        words: countWords(m[0]),
      });
    }
  });

  all.sort((a, b) => a.tier - b.tier || b.end - b.start - (a.end - a.start) || a.start - b.start);
  const kept: Candidate[] = [];
  for (const c of all) if (!kept.some((k) => overlaps(k, c))) kept.push(c);
  return kept.sort((a, b) => a.start - b.start);
}

export function isSentenceStart(text: string, start: number): boolean {
  const before = text.slice(0, start).trimEnd();
  return before === '' || /[.!?…:"“«]$/.test(before);
}

/**
 * Case for a fixed replacement. Most words copy the English capital
 * ("And" → "Et"); case-sensitive entries like titles are capitalised only at
 * the start of a sentence ("Mr. Darcy" → "monsieur Darcy").
 */
export function applyCase(french: string, entry: BankEntry, text: string, start: number): string {
  const first = text[start] ?? '';
  // The digits lead ("12 (douze)"), so the French stays lowercase.
  if (entry.numeral) return french;
  const capital = entry.caseSensitive
    ? isSentenceStart(text, start)
    : first !== first.toLowerCase();
  return capital ? french.charAt(0).toUpperCase() + french.slice(1) : french;
}

function ordinal(n: number): string {
  const suffix = n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th';
  return `${n}${suffix}`;
}

/** Which occurrence of its own text a candidate is, so the model can tell repeats apart. */
function occurrence(c: Candidate, segment: string): number {
  return Math.max(findAll(segment, c.text).filter((s) => s.start <= c.start).length, 1);
}

export function describeEntryCandidate(c: Candidate, entry: BankEntry, segment: string): string {
  const where = ordinal(occurrence(c, segment));
  const lemmas = entry.lemmas.join(' or ');
  return `"${c.text}" (${where} occurrence) → ${entry.french} [lemma: ${lemmas}]${entry.hint ? ` — ${entry.hint}` : ''}`;
}

export interface BankLessonConfig {
  id: string;
  name: string;
  language: string;
  categories: Category[];
  caps: LessonCaps;
  entries: BankEntry[];
  promptFragment: string;
  density?: number;
  topUpVocabulary?: Lesson['topUpVocabulary'];
  brief?: Lesson['brief'];
  easyWords?: Lesson['easyWords'];
}

/** Builds a Lesson from a word bank. */
export function createBankLesson(config: BankLessonConfig): Lesson & { entries: BankEntry[] } {
  const { entries } = config;
  const patterns = entries.map(compileEntry);
  const byId = new Map(entries.map((e) => [e.id, e]));
  const entryOf = (c: Candidate) => {
    const e = byId.get(c.entryId);
    if (!e) throw new Error(`Unknown bank entry: ${c.entryId}`);
    return e;
  };

  return {
    id: config.id,
    name: config.name,
    language: config.language,
    exclusive: true,
    density: config.density,
    categories: config.categories,
    caps: config.caps,
    entries,
    promptFragment: config.promptFragment,
    teaches: [...new Set(entries.map((e) => e.lemmas[0]!))],
    topUpVocabulary: config.topUpVocabulary,
    brief: config.brief,
    easyWords: config.easyWords,

    findCandidates: (segment) => findBankCandidates(segment, entries, patterns),

    resolveLocally(c, segment) {
      const e = entryOf(c);
      if (!e.fixed) return null;
      return {
        original: c.text,
        replacement: applyCase(e.french, e, segment, c.start),
        lemma: e.lemmas[0]!,
        gender: e.gender ?? '-',
        pos: e.pos,
        gloss: e.gloss,
      };
    },

    lemmasFor: (c) => entryOf(c).lemmas,
    categoryOf: (c) => entryOf(c).category,
    numeralFor: (c) => entryOf(c).numeral,
    describeCandidate: (c, segment) => describeEntryCandidate(c, entryOf(c), segment),
  };
}
