import { writingNotesFor } from '../languages';
import { lessonNotes, lessonStamp } from '../syllabus';
import type { SyllabusLesson } from '../syllabus/types';

/**
 * A lesson kit: what a syllabus lesson becomes once, before any passage, so
 * the fast passage call only has to write. Built by a stronger model with
 * structured output and cached per lesson. Lesson passages are about the
 * lesson's theme, never the page, so the kit gives the theme, its words and
 * everyday settings to write scenes in.
 */
export interface KitPoint {
  id: string;
  label: string;
  /** One checkable sentence telling the writer what to include. */
  instruction: string;
  /** For the learner, in English. */
  explanation: string;
  /** Regexes that find a correct use of the point (`compilePattern`); the eval counts them. */
  patterns: string[];
  example: string;
}

export interface Kit {
  /** In English; every lesson has one, a grammar lesson too (a theme its grammar suits). */
  theme: string;
  /** `gloss` is English. */
  themeVocab: Array<{ word: string; gloss: string }>;
  /** Everyday situations on the theme, in English, one picked per passage. */
  settings: string[];
  points: KitPoint[];
  /** "wrong -> right". */
  pitfalls: string[];
  /** How it was built, for the eval's report and to spot stale kits. */
  meta?: { model: string; version: string; usd: number | null; secs?: number };
}

/** The kit's model: once per lesson, so quality matters more than speed. */
// Long JSON in scripts that cost many tokens a word (Hebrew, Greek) overran 16k with thinking.
export const KIT_MODEL = { model: 'claude-sonnet-5-5', effort: 'default', thinking: 'on', maxTokens: 32000 } as const;
/** Bump when the kit prompt or schema changes, so cached kits are rebuilt. */
export const KIT_VERSION = 'v6-scenes';

export const kitCacheKey = (lesson: SyllabusLesson) => `${lesson.id}|${lessonStamp(lesson)}|${KIT_VERSION}|${KIT_MODEL.model}`;

export const KIT_SYSTEM = 'You prepare teaching materials for language courses. Follow the instructions exactly.';

export function buildKitPrompt(lesson: SyllabusLesson, language: string): string {
  const L = language;
  const level = lesson.level;
  const writing = writingNotesFor(L);
  return `You are preparing reusable materials for one lesson in a ${L} course for English speakers (${level}). A small, fast model will use them to write many short pieces in ${L} for this lesson: summaries, dialogues, quizzes, postcards and other formats, each about a made-up everyday scene on the lesson's theme. The small model cannot reason much, so make everything concrete, unambiguous and correct for ${L}.

<lesson>
Title: ${lesson.title}
Syllabus points:
${lesson.points.map((p) => `- ${p}`).join('\n')}${lessonNotes(lesson)}
</lesson>

Fill in the JSON schema:
- "theme": the lesson's vocabulary theme in a few English words. If the lesson is about grammar only, choose an everyday theme its grammar suits well (for example weekends and holidays for a past tense, plans for a future tense, people and places for comparisons).
- "theme_vocab": 20–30 common ${level} ${L} words for the theme (nouns with their article where ${L} uses articles), each with a "gloss" of one or two simple English words.
- "settings": 8–10 everyday situations on the theme for short scenes, in English, each a few words (for example "choosing clothes for a wedding", "a rainy Saturday at home"). Make them varied, and ones the lesson's grammar fits naturally.
- "points": one entry per syllabus point:
  - "id": short_snake_case.
  - "label": the point as the learner sees it.
  - "instruction": one sentence telling the writer exactly what to include, checkable in the text.
  - "explanation": one or two sentences for the learner, in English.
  - "patterns": 2–4 JavaScript regular expressions, matched with the i and u flags (\\b works for letters with accents), that find correct uses of the point in ${L} text. Keep them simple and allow the different correct forms.
  - "example": a short, natural ${L} sentence using the point.
- "pitfalls": 3–5 typical mistakes with this lesson in ${L}, each written "wrong -> right".${writing ? `\n\n${writing} Patterns are matched on the text with its readings taken out.` : ''}`;
}

const obj = (properties: Record<string, unknown>) => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});
const STR = { type: 'string' };
const STRS = { type: 'array', items: STR };

export const KIT_SCHEMA = obj({
  theme: STR,
  theme_vocab: { type: 'array', items: obj({ word: STR, gloss: STR }) },
  settings: STRS,
  points: {
    type: 'array',
    items: obj({ id: STR, label: STR, instruction: STR, explanation: STR, patterns: STRS, example: STR }),
  },
  pitfalls: STRS,
});

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const strs = (v: unknown) => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);

/** The kit from the model's JSON; throws if it has no usable points. */
export function parseKit(text: string): Kit {
  const raw = JSON.parse(text) as Record<string, unknown>;
  const records = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === 'object') : []);
  const points = records(raw.points)
    .map((p, i): KitPoint => ({
      id: str(p.id) || `point_${i + 1}`,
      label: str(p.label),
      instruction: str(p.instruction),
      explanation: str(p.explanation),
      patterns: strs(p.patterns),
      example: str(p.example),
    }))
    .filter((p) => p.instruction);
  if (!points.length) throw new Error('The lesson kit came back with no points.');
  return {
    theme: str(raw.theme),
    themeVocab: records(raw.theme_vocab)
      .map((v) => ({ word: str(v.word), gloss: str(v.gloss) }))
      .filter((v) => v.word),
    settings: strs(raw.settings),
    points,
    pitfalls: strs(raw.pitfalls),
  };
}
