import type { Level } from '../grammar/types';
import type { LanguageConfig } from '../languages';
import type { Candidate, Lesson } from '../lessons/types';

/**
 * The stable part of the prompt. It depends only on the language, so it is
 * byte-identical across requests and providers can cache it. Anything that
 * varies per request belongs in `buildUserPrompt`.
 */
export function buildSystemPrompt(lang: LanguageConfig, lesson?: Pick<Lesson, 'topUpVocabulary'>): string {
  const base = baseSystemPrompt(lang);
  if (!lesson?.topUpVocabulary) return base;
  return `${base}

Beginner word list, as "lemma (meaning)". When a request says to use it, every lemma you return outside the listed candidates must be on it:
${lesson.topUpVocabulary.promptList}`;
}

function baseSystemPrompt(lang: LanguageConfig): string {
  const L = lang.displayName;
  const genders = [...lang.genders, '-'].join(', ');
  return `You weave ${L} into English web pages for a language learner. Given a passage, you choose a few English spans and give the ${L} that should replace each one. The reader sees the ${L} in place of the English, inside the original sentence, so every replacement must read as correct ${L} exactly where it stands.

Choosing spans:
- Pick the smallest English span that contains everything the ${L} needs to be grammatical in context. Spans are at most 5 words.
- Choose words that suit the reader's level, which the request gives.
- Prefer words and phrases with strong context clues, so the reader can guess the meaning.
- Spread replacements across the passage instead of clustering them.
- Never replace proper nouns, names of people, places, brands or works, code, URLs, numbers, dates, or text in another language.
- A request may include a lesson or a level note. Where it differs from the guidance above, follow the request.

${L} grammar to apply inside each span:
${lang.grammarNotes}

Output format. Write one replacement per line, with six fields separated by ||:
original span||${L} replacement||lemma||gender||part of speech||English gloss

- original span: copied character for character from the passage, including case and punctuation, so it can be found by exact search. Copy only one occurrence's words; don't merge text from different places.
- ${L} replacement: what the reader will see instead.
- lemma: the dictionary form of the main word (${lang.lemmaForms}).
- gender: one of ${genders}. Use - when the main word is not a noun.
- part of speech: noun, verb, adj, adv, or phrase.
- English gloss: a short meaning of the lemma.

Example, for the passage "The village sits at the edge of the forest, and its inhabitants were wary of strangers.":
${lang.weaveExample}

Write only these lines: no numbering, headings, blank lines or commentary. If nothing in the passage is worth replacing, write nothing.`;
}

/** What the general weave picks at each level; it goes in the user message, so the system prompt is the same for every reader. */
const LEVEL_NOTES: Record<Level, string> = {
  A1: 'The reader is a beginner (A1): choose everyday beginner words and short phrases.',
  A2: 'The reader is at A2: choose everyday words and short phrases, common nouns, verbs and adjectives first.',
  B1: 'The reader is at B1: favor common B1 vocabulary and set phrases over the most basic nouns.',
  B2: 'The reader is at B2: favor B2–C1 vocabulary, idioms and set phrases over basic nouns (skip words like "house", "dog", "day" unless part of a richer phrase).',
};

export const levelNote = (level: Level): string => LEVEL_NOTES[level];

export interface UserPromptInput {
  passage: string;
  /** Target number of English words to replace in this passage. */
  targetWords: number;
  /** The reader's level (`levelNote`), or an eval's own note. */
  levelNote?: string;
  /** Lemmas the reader is learning; reuse them when they fit. */
  priority?: string[];
  /** Lemmas never to weave. */
  exclude?: string[];
}

export function buildUserPrompt({ passage, targetWords, levelNote, priority = [], exclude = [] }: UserPromptInput): string {
  const parts = [
    `Replace about ${targetWords} English word${targetWords === 1 ? '' : 's'} in total (count the words of each original span). Never go over this.`,
  ];
  if (levelNote) parts.push(levelNote);
  if (priority.length) parts.push(`Reuse these lemmas where they fit naturally: ${priority.join(', ')}`);
  if (exclude.length) parts.push(`Never use these lemmas: ${exclude.join(', ')}`);
  parts.push(`<passage>\n${passage}\n</passage>`);
  return parts.join('\n\n');
}

export interface LessonPromptInput {
  passage: string;
  lesson: Pick<Lesson, 'promptFragment' | 'describeCandidate' | 'topUpExclude'>;
  /** The candidates the model must write French for, in document order. */
  candidates: Candidate[];
  /** Extra words to add from the beginner list, and spans already woven that it must avoid. */
  topUp?: { words: number; taken: string[] };
}

// The model adds about a third of the top-up it's asked for, so it's asked
// for more; code still accepts only the planned number, in document order.
export const TOP_UP_ASK = 1.5;

export function buildLessonPrompt({ passage, lesson, candidates, topUp }: LessonPromptInput): string {
  const list = candidates.map((c, i) => `${i + 1}. ${lesson.describeCandidate(c, passage)}`).join('\n');
  const ask = topUp ? Math.ceil(topUp.words * TOP_UP_ASK) : 0;
  const scope =
    topUp && topUp.words > 0
      ? [
          `Then add ${ask} more English word${ask === 1 ? '' : 's'} (count the words of each original span), using only lemmas from the beginner word list. Prefer varied, everyday words with clear context.`,
          lesson.topUpExclude?.length ? `For these extra words, don't use these lemmas: ${lesson.topUpExclude.join(', ')}.` : '',
          topUp.taken.length ? `Already woven, leave these alone: ${topUp.taken.map((t) => `"${t}"`).join(', ')}.` : '',
        ]
          .filter(Boolean)
          .join('\n')
      : 'Replace nothing else.';
  return [
    lesson.promptFragment,
    scope,
    candidates.length ? `Candidates:\n${list}` : 'No candidates in this passage.',
    `<passage>\n${passage}\n</passage>`,
  ].join('\n\n');
}
