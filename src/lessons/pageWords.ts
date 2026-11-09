import type { Level } from '../grammar/types';
import type { LanguageConfig } from '../languages';
import { overlaps, type Span } from '../weave/locate';
import { countWords } from '../weave/select';
import { createBankLesson, type BankEntry } from './bank';
import { normalizeLemma } from './resolve';
import type { Candidate, Lesson } from './types';

/**
 * Page words: a short vocabulary the model picks for one page, from its
 * title, section headings and the paragraphs on screen. Code then finds
 * those words across the page and spreads them out, so the reader meets the
 * same few words again and again instead of a different word every time.
 */
export interface PageWord {
  /** English forms on the page this lemma translates: "dog", "dogs". */
  forms: string[];
  /** Dictionary form in the language woven. Gender and gloss come back with each woven line. */
  lemma: string;
}

export const PAGE_CATEGORY = { id: 'page', label: 'Words from this page' };
const ID_PREFIX = 'page:';
export const PAGE_WORD_TARGET = 25;
const MAX_PAGE_WORDS = 40;
const MAX_FORM_WORDS = 3;
/** Characters of on-screen text sent to the picker. */
export const MAX_PICK_TEXT = 3000;
const MAX_HEADINGS = 40;

export interface PageCaps {
  /** Times one page word may be woven on the whole page. */
  perEntryPerPage: number;
  /** Min words between two woven spans in a segment. */
  minGapWords: number;
}

export const PAGE_CAPS: PageCaps = { perEntryPerPage: 5, minGapWords: 3 };

/** Stable, so it caches like the weave prompt. */
export function buildPickSystemPrompt(lang: LanguageConfig): string {
  const L = lang.displayName;
  return `You choose ${L} vocabulary for an English speaker learning ${L}, at the level the request gives. They are about to read an English web page with some of its words woven into ${L}. You see the page's title, its section headings and the text on screen; the rest of the page is about the same topics.

Pick the words most worth learning on this page:
- Words that come up again and again on this page and fit its topic, so the reader meets them many times.
- Words for the reader's level. Mostly nouns, some verbs and adjectives.
- Words whose ${L} translation is the same in almost every sentence of this page. Skip English words with several meanings here.
- Never: proper nouns, numbers, function words (and, with, but, the, of, also, very), or rare technical terms.

Output one word per line, with two fields separated by ||:
English forms||${L} lemma

- English forms (first field, in English): the English words this lemma translates, exactly as they appear in the text, separated by |. Include the inflections the page uses (dog|dogs, run|runs|running|ran). Each form is one word, or a fixed phrase of up to 3 words.
- ${L} lemma (second field, in ${L}): the dictionary form (${lang.lemmaForms}).

Example:
${lang.pickExample}

Write only these lines: no numbering, headings or commentary.`;
}

/** What the picker looks for at each level; it goes in the user message, so the system prompt is the same for every reader. */
const PICK_LEVEL_NOTES: Record<Level, string> = {
  A1: 'The reader is a beginner (A1): concrete nouns, common verbs and adjectives, cognates.',
  A2: 'The reader is at A2: everyday nouns, verbs and adjectives, cognates.',
  B1: 'The reader is at B1 and knows the basics: pick the topic\'s nouns, verbs and adjectives a B1 reader is still learning, not words like "man", "house" or "day".',
  B2: 'The reader is at B2: pick the topic\'s less common nouns, verbs, adjectives and set phrases; skip anything a beginner already knows.',
};

export interface PickInput {
  title: string;
  headings: string[];
  /** The paragraphs on screen, in order. */
  passages: string[];
  /** Lemmas the reader already gets from a lesson; the picker leaves them out. */
  exclude?: string[];
  level: Level;
  target?: number;
}

export function buildPickPrompt({ title, headings, passages, exclude = [], level, target = PAGE_WORD_TARGET }: PickInput): string {
  let text = '';
  for (const p of passages) {
    if (text && text.length + p.length > MAX_PICK_TEXT) break;
    text += (text ? '\n\n' : '') + p.slice(0, MAX_PICK_TEXT);
  }
  const parts = [`Pick about ${target} words.`, PICK_LEVEL_NOTES[level]];
  if (exclude.length) parts.push(`The reader already learns these from a lesson; leave them out: ${exclude.join(', ')}`);
  parts.push(`<title>${title}</title>`);
  if (headings.length) parts.push(`<headings>\n${headings.slice(0, MAX_HEADINGS).join('\n')}\n</headings>`);
  parts.push(`<on_screen>\n${text}\n</on_screen>`);
  return parts.join('\n\n');
}

const FORM = /^[\p{L}][\p{L}'’ -]*$/u;

/** Parses the picker's lines; malformed lines, bad forms and repeated lemmas are dropped. */
export function parsePageWords(text: string): PageWord[] {
  const seenLemmas = new Set<string>();
  const seenForms = new Set<string>();
  const out: PageWord[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim().replace(/^(?:[-*•]|\d+[.)])\s+/, '').replace(/^`+|`+$/g, '');
    const fields = line.split('||').map((f) => f.trim());
    if (fields.length !== 2) continue;
    const [formsRaw, lemma] = fields as [string, string];
    if (!lemma || seenLemmas.has(normalizeLemma(lemma))) continue;
    const forms = formsRaw
      .split('|')
      .map((f) => f.trim().toLowerCase())
      .filter((f) => FORM.test(f) && countWords(f) <= MAX_FORM_WORDS && !seenForms.has(f));
    if (!forms.length) continue;
    forms.forEach((f) => seenForms.add(f));
    seenLemmas.add(normalizeLemma(lemma));
    out.push({ forms, lemma });
    if (out.length >= MAX_PAGE_WORDS) break;
  }
  return out;
}

/**
 * Keeps the words that occur on the page. Models sometimes swap the fields
 * ("chien||dog"); a word is swapped back when only its lemma side appears on
 * the page, and dropped when neither side does.
 */
export function fitToPage(words: PageWord[], texts: string[]): PageWord[] {
  const occurs = (forms: string[]) => {
    // Only its matching is used, so the language doesn't matter.
    const lesson = pageWordsLesson([{ forms, lemma: '-' }], '');
    return texts.some((t) => lesson.findCandidates(t).length > 0);
  };
  const out: PageWord[] = [];
  for (const w of words) {
    if (occurs(w.forms)) out.push(w);
    else {
      const swapped = w.lemma.split('|').map((f) => f.trim().toLowerCase()).filter((f) => FORM.test(f));
      if (swapped.length && occurs(swapped)) out.push({ forms: swapped, lemma: w.forms.join(' ') });
    }
  }
  return out;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/['’]/g, "['’]").replace(/ /g, '\\s+');

export function pageWordEntries(words: PageWord[]): BankEntry[] {
  return words.map((w, i) => ({
    id: `${ID_PREFIX}${i}`,
    tier: 3,
    category: PAGE_CATEGORY.id,
    // Longest first, so "running" isn't cut to "run".
    english: [...w.forms].sort((a, b) => b.length - a.length).map(escape).join('|'),
    french: w.lemma,
    lemmas: [w.lemma],
    pos: '',
    gloss: w.forms[0]!,
  }));
}

const pageFragment = (L: string) => `Replace the candidates listed below with ${L}. Skip a candidate if no correct ${L} fits where it stands.
- Each span must contain its candidate. You may extend it by a word or two when ${L} needs them (an article, a noun's adjective), up to 5 words.
- Use the lemma given for the candidate.`;

/** The page words as a lesson of their own: never written in code, always by the model. `language` is its name in prompts. */
export function pageWordsLesson(words: PageWord[], language: string): Lesson {
  const lesson = createBankLesson({
    id: 'page',
    name: 'Page words',
    language,
    categories: [PAGE_CATEGORY],
    caps: { perEntryPerSegment: { 3: 1 }, maxShare: {}, minGapWords: PAGE_CAPS.minGapWords },
    entries: pageWordEntries(words),
    promptFragment: pageFragment(language),
  });
  // Page words are capped per page; the top-up must not add more of them.
  return { ...lesson, topUpExclude: words.map((w) => w.lemma) };
}

/**
 * A lesson plus a list of extra words (page words or easy words), as one
 * lesson: each candidate is handled by the lesson it came from, told apart
 * by the extra lesson's id at the start of its entry ids ("page:3").
 */
export function withPageWords(base: Lesson, page: Lesson): Lesson {
  const prefix = `${page.id}:`;
  const of = (c: Candidate) => (c.entryId.startsWith(prefix) ? page : base);
  return {
    ...base,
    categories: [...base.categories, ...page.categories],
    findCandidates(segment) {
      const own = base.findCandidates(segment);
      const extra = page.findCandidates(segment).filter((c) => !own.some((o) => overlaps(o, c)));
      return [...own, ...extra].sort((a, b) => a.start - b.start);
    },
    resolveLocally: (c, s) => of(c).resolveLocally(c, s),
    lemmasFor: (c) => of(c).lemmasFor(c),
    categoryOf: (c) => of(c).categoryOf(c),
    numeralFor: (c) => of(c).numeralFor?.(c),
    describeCandidate: (c, s) => of(c).describeCandidate(c, s),
    promptFragment: `${base.promptFragment}\n- Some candidates are ${page.name.toLowerCase()}; treat them the same way, using one of the lemmas given.`,
    topUpExclude: [...(base.topUpExclude ?? []), ...(page.topUpExclude ?? [])],
  };
}

function tooClose(text: string, a: Span, b: Span, minGap: number): boolean {
  const between = a.end <= b.start ? text.slice(a.end, b.start) : text.slice(b.end, a.start);
  return countWords(between) < minGap;
}

/**
 * Spends each segment's share on extra-word candidates. In every segment
 * lower tiers come first (the easiest words, for easy words), then the words
 * used least so far on the page, so the words take turns instead of the most
 * frequent one taking every slot. Pure and deterministic.
 */
export function allocatePageWords(
  segments: Array<{ text: string; candidates: Candidate[]; taken: Span[] }>,
  shares: number[],
  caps: PageCaps = PAGE_CAPS,
): Candidate[][] {
  const used = new Map<string, number>();
  return segments.map(({ text, candidates, taken }, i) => {
    let left = shares[i] ?? 0;
    const chosen: Candidate[] = [];
    const order = candidates
      .filter((c) => !taken.some((t) => overlaps(t, c)))
      .sort((a, b) => a.tier - b.tier || (used.get(a.entryId) ?? 0) - (used.get(b.entryId) ?? 0) || a.start - b.start);
    for (const c of order) {
      if (c.words > left) continue;
      if ((used.get(c.entryId) ?? 0) >= caps.perEntryPerPage) continue;
      if (chosen.some((k) => k.entryId === c.entryId)) continue;
      if ([...taken, ...chosen].some((k) => overlaps(k, c) || tooClose(text, k, c, caps.minGapWords))) continue;
      chosen.push(c);
      used.set(c.entryId, (used.get(c.entryId) ?? 0) + 1);
      left -= c.words;
    }
    return chosen.sort((a, b) => a.start - b.start);
  });
}
