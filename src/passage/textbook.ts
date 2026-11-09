import { writingNotesFor } from '../languages';
import { lessonNotes, lessonStamp } from '../syllabus';
import type { SyllabusLesson } from '../syllabus/types';
import { KIT_MODEL } from './kit';

/**
 * The lesson's textbook page: the grammar and vocabulary taught as a course
 * book would, shown in the widget's Lesson tab. Built from the lesson alone
 * (never the page), once per lesson by a stronger model, and cached like the kit.
 * One section per syllabus point, in the order the model teaches them, each with
 * whatever parts it needs: a rule and its table, the words to learn, or both.
 */
export type SectionKind = 'grammar' | 'words' | 'phrases';

export interface TextbookSection {
  kind: SectionKind;
  heading: string;
  /** English paragraphs; target-language words are between asterisks, set in italics. */
  explanation: string[];
  /** The forms to learn; no columns = no table. */
  table: { columns: string[]; rows: string[][] };
  words: Array<{ word: string; english: string }>;
  examples: Array<{ target: string; english: string }>;
  watchOut: string[];
}

export interface Textbook {
  intro: string;
  sections: TextbookSection[];
  meta?: { model: string; version: string; usd: number | null; secs?: number };
}

/** Accuracy matters more than speed: it's written once and the widget asks for it before the tab is opened. */
export const TEXTBOOK_MODEL = KIT_MODEL;
/** Bump when the prompt or schema changes, so cached pages are rewritten. */
export const TEXTBOOK_VERSION = 'v2';

export const textbookCacheKey = (lesson: SyllabusLesson) => `${lesson.id}|${lessonStamp(lesson)}|${TEXTBOOK_VERSION}|${TEXTBOOK_MODEL.model}`;

export const TEXTBOOK_SYSTEM = 'You write the lesson pages of a language textbook for English-speaking adults. Follow the instructions exactly.';

export function buildTextbookPrompt(lesson: SyllabusLesson, language: string): string {
  const L = language;
  const level = lesson.level;
  const writing = writingNotesFor(L);
  return `Write the textbook page for one lesson in a ${L} course for English speakers (${level}). The learner keeps it open beside short practice texts, to learn the lesson and to look things up while reading. Write it as a good textbook does: teach each point, show the forms, give examples, and warn about the usual mistakes. Teach the rules in general, for any sentence the learner might meet.

<lesson>
Title: ${lesson.title}
Syllabus points:
${lesson.points.map((p) => `- ${p}`).join('\n')}${lessonNotes(lesson)}
</lesson>

Write one section per syllabus point. A point is often partly grammar and partly words to learn (nationalities and their feminine forms, numbers and how they combine, adverbs and where they go): its section teaches both, with a rule, its forms and the words together.

Order the sections as a good teacher would teach them, which need not be the syllabus order: a section comes after any section whose words or forms it relies on (the words a rule's examples use come before the rule; a rule comes before the words that only make sense inside it), and ready-made phrases the learner can use at once come before rules that take them apart. Where nothing decides it, keep the syllabus order.

Fill in the JSON schema:
- "intro": two or three sentences in English saying what the lesson teaches and what the learner will be able to say or understand after it.
- "sections": the sections in teaching order. Each:
  - "kind": what the section mostly teaches: "grammar" (how words change and combine), "words" (vocabulary to learn) or "phrases" (set expressions to use as they are).
  - "heading": a short textbook heading in English, with the ${L} forms it is about where that helps.
  - "explanation": 1–4 short paragraphs in English that teach the point. For grammar: what it is, how it is formed, when it is used, and how it differs from English. For words or phrases: how and when to use them, and any pattern or form to remember; one sentence is enough for a plain word list. Explain any grammar term the first time it appears, in words a ${level} learner follows.
  - "table": the forms to learn, when the point has some (a conjugation, articles by gender and number, pronouns, masculine and feminine forms, a pattern with its parts): "columns" are the header cells and each of "rows" has one cell per column. If a table would not help, both are [].
  - "words": the words and phrases the point teaches, the most useful first: everything the syllabus point lists, for a theme 15–25 common words at this level, and for a grammar point the words it names (verbs, adverbs, question words) that the table does not already show; [] when there are none. Each "word" is written as a learner's dictionary for ${L} gives it (nouns with their article, and their gender where the article does not show it); "english" is a short gloss.
  - "examples": 3–5 short, natural ${L} sentences that show the point, each with its English "translation"; 0–2 for a plain word list.
  - "watch_out": 1–3 mistakes English speakers typically make with this point, each one sentence saying what to do instead; [] if there are none worth a warning.

In "intro", "explanation" and "watch_out", put every ${L} word or phrase between asterisks, *like this*, so it can be set in italics. Use no other formatting: no Markdown, bold, bullets or numbering. Every form, example and gloss must be correct, standard ${L}.${writing ? `\n\n${writing} This goes for every ${L} word on the page, in the tables and word lists too.` : ''}`;
}

const obj = (properties: Record<string, unknown>) => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});
const STR = { type: 'string' };
const STRS = { type: 'array', items: STR };

export const TEXTBOOK_SCHEMA = obj({
  intro: STR,
  sections: {
    type: 'array',
    items: obj({
      kind: { type: 'string', enum: ['grammar', 'words', 'phrases'] },
      heading: STR,
      explanation: STRS,
      table: obj({ columns: STRS, rows: { type: 'array', items: STRS } }),
      words: { type: 'array', items: obj({ word: STR, english: STR }) },
      examples: { type: 'array', items: obj({ target: STR, translation: STR }) },
      watch_out: STRS,
    }),
  },
});

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const strs = (v: unknown) => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);
const records = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === 'object') : []);

/** Rows padded or cut to the header's width; a table with no header or rows is dropped. */
function parseTable(v: unknown): TextbookSection['table'] {
  const t = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  const columns = Array.isArray(t.columns) ? t.columns.map(str) : [];
  const rows = (Array.isArray(t.rows) ? t.rows : [])
    .map((r) => (Array.isArray(r) ? r.map(str) : []))
    .filter((r) => r.some(Boolean))
    .map((r) => columns.map((_, i) => r[i] ?? ''));
  return columns.length && rows.length ? { columns, rows } : { columns: [], rows: [] };
}

const KINDS: SectionKind[] = ['grammar', 'words', 'phrases'];

/** The textbook page from the model's JSON, in the model's order; throws if it teaches nothing. */
export function parseTextbook(text: string): Textbook {
  const raw = JSON.parse(text) as Record<string, unknown>;
  const sections = records(raw.sections)
    .map((s): TextbookSection => ({
      kind: KINDS.find((k) => k === s.kind) ?? 'grammar',
      heading: str(s.heading),
      explanation: strs(s.explanation),
      table: parseTable(s.table),
      words: records(s.words)
        .map((w) => ({ word: str(w.word), english: str(w.english) }))
        .filter((w) => w.word),
      examples: records(s.examples)
        .map((e) => ({ target: str(e.target), english: str(e.translation) }))
        .filter((e) => e.target),
      watchOut: strs(s.watch_out),
    }))
    .filter((s) => s.heading && (s.explanation.length || s.examples.length || s.words.length));
  if (!sections.length) throw new Error('The lesson page came back empty.');
  return { intro: str(raw.intro), sections };
}

/** Text with `*target-language*` spans split out, for italics. */
export function italicSpans(text: string): Array<{ text: string; italic: boolean }> {
  return text
    .split(/\*([^*\n]+)\*/)
    .map((part, i) => ({ text: part, italic: i % 2 === 1 }))
    .filter((p) => p.text);
}
