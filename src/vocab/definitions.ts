import { writingNotesFor } from '../languages';
import { normalizeLemma } from '../lessons/resolve';

/**
 * What the Words page shows for each word besides the word itself: a short
 * definition in English and an example sentence in the language, with its
 * English. Written by Haiku in batches the first time a word is shown there,
 * then kept in storage (`DEFINITIONS_STORE`) for good.
 */
export interface Definition {
  definition: string;
  example: string;
  /** The example in English. */
  english: string;
}

/** Haiku with thinking off: a batch in a few seconds, once a word. */
export const DEFINE_MODEL = { model: 'claude-haiku-5-5', effort: 'default', thinking: 'off', maxTokens: 8000 } as const;
/** Bump when the prompt or schema changes, so stored definitions are written again. */
export const DEFINE_VERSION = 'v1';
/** Words per request. */
export const DEFINE_BATCH = 20;
export const DEFINITIONS_STORE = 'definitions';

export const definitionKey = (lang: string, word: string) => `${lang}|${normalizeLemma(word)}|${DEFINE_VERSION}`;

/** Byte-stable; the words are in the user message. */
export const DEFINE_SYSTEM = 'You write entries for a learner’s dictionary. Follow the instructions exactly.';

export function buildDefinePrompt(words: Array<{ word: string; gloss: string }>, language: string, level: string): string {
  const L = language;
  const writing = writingNotesFor(L);
  return `These ${L} words are in an English speaker’s word list (level ${level}). For each, in the same order, fill in the JSON schema:
- "word": the word exactly as given.
- "definition": what it means, in plain English, in at most about 12 words. Start with its usual English equivalent; add a few words on how it’s used only when the equivalent alone could mislead.
- "example": a short, natural ${L} sentence or phrase using the word in that meaning, in grammar and words a ${level} learner knows.
- "english": the example in natural English.

The gloss is the meaning the reader met the word with: define that meaning.${writing ? `\n\n${writing}` : ''}

<words>
${words.map((w) => `${w.word}${w.gloss ? ` (gloss: ${w.gloss})` : ''}`).join('\n')}
</words>`;
}

const STR = { type: 'string' };
export const DEFINE_SCHEMA = {
  type: 'object',
  properties: {
    entries: {
      type: 'array',
      items: {
        type: 'object',
        properties: { word: STR, definition: STR, example: STR, english: STR },
        required: ['word', 'definition', 'example', 'english'],
        additionalProperties: false,
      },
    },
  },
  required: ['entries'],
  additionalProperties: false,
};

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** Each asked-for word's entry, found by its word (or its place when the model changed the word). */
export function parseDefinitions(text: string, words: string[]): Record<string, Definition> {
  const raw = JSON.parse(text) as { entries?: unknown };
  const entries = Array.isArray(raw.entries) ? raw.entries.filter((e): e is Record<string, unknown> => Boolean(e) && typeof e === 'object') : [];
  const out: Record<string, Definition> = {};
  entries.forEach((e, i) => {
    const named = words.find((w) => normalizeLemma(w) === normalizeLemma(str(e.word)));
    const word = named ?? (entries.length === words.length ? words[i] : undefined);
    const entry = { definition: str(e.definition), example: str(e.example), english: str(e.english) };
    if (word && entry.definition && !out[word]) out[word] = entry;
  });
  return out;
}
