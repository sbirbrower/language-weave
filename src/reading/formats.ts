import type { LanguageConfig } from '../languages';
import type { PageWord } from '../lessons/pageWords';
import type { Lesson } from '../lessons/types';

/**
 * Short reading texts for the widget: generic templates that any lesson fills
 * in through its brief.
 */
/** The widget's texts run on their own model, whatever the weave uses. */
export const READING_MODEL = { model: 'claude-haiku-5-5', effort: 'medium', thinking: 'on' } as const;

export interface LessonBrief {
  level: string;
  /** What the reader is learning, as the model should see it. */
  teaches: string;
  /** The lesson's one grammar point, if it has one. */
  grammar?: string;
}

/** Which part of the page a format reads. */
export type ReadingSource =
  | 'page' // title, headings and the text on screen
  | 'woven' // the woven words on screen; refreshed as the reader scrolls
  | 'selection'; // the passage the reader highlighted

export interface ReadingFormat {
  id: string;
  label: string;
  source: ReadingSource;
  /** The task line. */
  task: string;
  maxLines: number;
  /** Written by code from the page's vocabulary, no model. */
  local?: boolean;
}

export const READING_FORMATS: ReadingFormat[] = [
  {
    id: 'facts',
    label: 'Lesson-lens facts',
    source: 'page',
    maxLines: 8,
    task: "Write 6 to 8 true facts about the page's subject that can be said with what the lesson teaches, one short sentence each, each about something different. Facts about the subject itself, never about the page (its title, headings, maps, lists or names). Use something the lesson teaches (its words, phrases or grammar) in as many as the facts allow, but never bend a fact to fit the lesson: a true sentence is better than a lesson word. Write fewer only if fewer fit; if none fit, write nothing.",
  },
  {
    id: 'why',
    label: "Why it's said this way",
    source: 'woven',
    maxLines: 2,
    task: 'Pick up to 2 of the woven French words listed and explain why each has this form in its sentence (gender, agreement, tense, register…). The French is the woven word; the English is a one-line explanation. If none are worth explaining, write nothing.',
  },
  {
    id: 'text',
    label: 'Short text',
    source: 'page',
    maxLines: 6,
    task: 'Write a short text or dialogue of 4 to 6 sentences about the page that uses as much of the lesson as fits.',
  },
  {
    id: 'recap',
    label: 'What you met',
    source: 'page',
    maxLines: 8,
    task: '',
    local: true,
  },
];

/** Not in the picker: the widget shows it above any format when the reader highlights a passage. */
export const SUMMARY_FORMAT: ReadingFormat = {
  id: 'summary',
  label: 'Summary of the highlight',
  source: 'selection',
  maxLines: 8,
  task: "Summarise the highlighted passage in its order, in plain short sentences the reader can follow at their level, one idea each: split a long sentence into several, and give every main point its own. Leave out citations, asides and minor detail. At most 8 sentences. Use the lesson where it fits, but keep the summary true to the passage.",
};

export function getFormat(id: string): ReadingFormat {
  return [...READING_FORMATS, SUMMARY_FORMAT].find((f) => f.id === id) ?? READING_FORMATS[0]!;
}

/** A lesson's brief; themed words list the page's own words as what is taught. */
export function readingBrief(lesson: Lesson, pageWords: PageWord[] = []): LessonBrief {
  const base = lesson.brief ?? { level: 'A1', teaches: lesson.name };
  const words = pageWords.map((w) => `${w.lemma} (${w.forms[0]})`).join(', ');
  return {
    ...base,
    teaches: lesson.pickPageWords && words ? `${base.teaches}: ${words}` : base.teaches,
  };
}

/** Fixed for a lesson (and, for themed words, a page), so it's cached across formats. */
export function buildReadingSystemPrompt(lang: LanguageConfig, brief: LessonBrief): string {
  const L = lang.displayName;
  return `You write tiny ${L} reading texts for an English-speaking learner at level ${brief.level} who is reading an English web page. Their lesson teaches: ${brief.teaches}.${brief.grammar ? ` Grammar point: ${brief.grammar}.` : ''}

- Use the lesson's words and grammar wherever the page allows, plus the page words given and very common ${brief.level} words.
- Every fact must come from the page text given. Never invent facts or numbers.
- Short sentences, at most 12 words each.
- When a number helps, write it in ${L} followed by the digits in brackets: "trois (3)". Use brackets for nothing else.
- Put a narrow no-break space (U+202F) before ? ! : ; and inside « ».

Output one line per sentence, with two fields separated by ||:
${L}||English

Write only these lines: no numbering, headings, blank lines or commentary.`;
}

export interface ReadingInput {
  title: string;
  headings: string[];
  /** The article's opening paragraphs: on many pages the first screen is an info box. */
  opening?: string[];
  /** Paragraphs on screen. */
  onScreen: string[];
  /** Woven spans on screen, as "French (English)". */
  woven?: string[];
  /** The passage the reader highlighted, in the page's English. */
  highlighted?: string;
  pageWords?: PageWord[];
}

const MAX_TEXT = 3000;

function clip(parts: string[], max = MAX_TEXT): string {
  let out = '';
  for (const p of parts) {
    if (out && out.length + p.length > max) break;
    out += (out ? '\n\n' : '') + p.slice(0, max);
  }
  return out;
}

export function buildReadingPrompt(format: ReadingFormat, input: ReadingInput): string {
  const parts = [`<title>${input.title}</title>`];
  if (format.source === 'page') {
    if (input.headings.length) parts.push(`<headings>\n${input.headings.slice(0, 40).join('\n')}\n</headings>`);
    if (input.opening?.length) parts.push(`<opening>\n${clip(input.opening, 2000)}\n</opening>`);
  }
  if (format.source === 'selection') parts.push(`<highlighted>\n${clip([input.highlighted ?? ''])}\n</highlighted>`);
  else parts.push(`<on_screen>\n${clip(input.onScreen)}\n</on_screen>`);
  if (format.source === 'woven') parts.push(`<woven>\n${(input.woven ?? []).join('\n')}\n</woven>`);
  if (input.pageWords?.length) parts.push(`<page_words>${input.pageWords.map((w) => w.lemma).join(', ')}</page_words>`);
  parts.push(`Task: ${format.task}`);
  return parts.join('\n\n');
}

export interface ReadingLine {
  fr: string;
  en: string;
}

const MAX_WORDS = 25;

/**
 * Parses `French||English` lines. Drops malformed lines, repeats, notes the
 * model wrote to itself ("(see below)"), and any line whose bracketed digits
 * ("trois (3)") don't appear in the page text it was given.
 */
export function parseReadingLines(text: string, { maxLines, source }: { maxLines: number; source: string }): ReadingLine[] {
  // "3,000" on the page is "(3000)" in a line.
  const plain = source.replace(/(\d)[,\u00a0\u202f](?=\d{3}(?!\d))/g, '$1');
  const out: ReadingLine[] = [];
  const seen = new Set<string>();
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim().replace(/^(?:[-*•]|\d+[.)])\s+/, '').replace(/^`+|`+$/g, '');
    const fields = line.split('||').map((f) => f.trim());
    if (fields.length !== 2 || !fields[0] || !fields[1]) continue;
    const [fr, en] = fields as [string, string];
    if (fr.split(/\s+/).length > MAX_WORDS) continue;
    if (/^[*_]*\(/.test(en)) continue;
    const norm = fr.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    if (seen.has(norm)) continue;
    seen.add(norm);
    const digits = [...fr.matchAll(/\((\d+)(?:\s*[–-]\s*(\d+))?\)/g)].flatMap((m) => [m[1], m[2]]).filter(Boolean) as string[];
    if (digits.some((d) => !new RegExp(`(?<![\\d.,])${d}(?![\\d])`).test(plain))) continue;
    out.push({ fr, en });
    if (out.length >= maxLines) break;
  }
  return out;
}

/** The lines of a response still streaming: only those whose newline has arrived, so a half-written one isn't shown. */
export function finishedLines(text: string, opts: { maxLines: number; source: string }): ReadingLine[] {
  return parseReadingLines(text.slice(0, text.lastIndexOf('\n') + 1), opts);
}

/** "What you met": the woven words grouped by category, from the page's vocabulary. Code only. */
export function recapLines(
  items: Array<{ french: string; category: string; count: number }>,
  categories: Array<{ id: string; label: string }>,
  maxPerCategory = 8,
): ReadingLine[] {
  return categories
    .map((c) => {
      const words = items
        .filter((i) => i.category === c.id)
        .sort((a, b) => b.count - a.count)
        .slice(0, maxPerCategory)
        .map((i) => i.french);
      return words.length ? { fr: words.join(', '), en: c.label } : null;
    })
    .filter((l): l is ReadingLine => l !== null);
}
