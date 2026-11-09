/**
 * The widget's passage formats: page mode starts each section as a simple
 * summary, with the rest in a menu; lesson mode picks one at random.
 * Each says what to write about part of a web page (webpage mode) and about
 * a made-up everyday scene on a lesson's theme (lesson mode). Instructions
 * are in English and name the language through `L`; labels inside a piece
 * ("Then:", "Q:") are written in that language.
 *
 * Quiz formats ask for a third field on some lines, which the widget turns
 * into something to tap or type (`src/passage/piece.ts` parses them).
 */
export type FormatKind = 'lines' | 'true_false' | 'gap_fill' | 'match' | 'riddle';

export interface Format {
  id: string;
  /** In English: the widget shows it above the passage. */
  name: string;
  kind: FormatKind;
  /** Mainly teaches words (it lists, defines or groups them). */
  vocab?: boolean;
  /** What to write about part of a page. */
  page(L: string): string;
  /** What to write in lesson mode, about a scene on the lesson's theme. */
  lesson(L: string): string;
}

/** The extra fields a quiz format's lines carry, for the prompt's output section. */
export const QUIZ_FIELDS: Record<Exclude<FormatKind, 'lines'>, (L: string) => string> = {
  true_false: (L) =>
    `Statement lines have a third field: "true", or "false" followed by the corrected statement and its English, as in\n${L} statement || English || true\n${L} statement || English || false || corrected ${L} statement || its English\nEvery line of the piece is a statement with its true or false field: no title or question line (the title goes in <title>).`,
  gap_fill: (L) =>
    `Gap lines have a third field, "gap:" and the missing ${L} word or words, as in\n${L} sentence with ____ (hint) || English translation of the whole sentence || gap: missing words`,
  match: (L) => `Word lines have a third field, "pair", as in\n${L} word || its English meaning || pair\nEvery word line ends with || pair.`,
  riddle: (L) =>
    `The question line has a third field, "answer:" and three ${L} options separated by single | (the right one first, the other two plausible), as in\n${L} question || English || answer: right option | wrong option | wrong option\nThe answer field comes after its own ||, like every field. Write the question line once, as the last line. No clue line names the answer.`,
};

const numberLine = (L: string) => `then a short sentence that explains it, all in the ${L} text before the ||, as in:\n12 – a ${L} sentence about the 12 || 12 – its English translation`;

export const FORMATS: Format[] = [
  {
    id: 'summary',
    name: 'Simple summary',
    kind: 'lines',
    page: () => 'A simple summary of this part of the page: 5 sentences, one per line.',
    lesson: () => 'A simple text of 5 sentences, one per line, about one person in the scene.',
  },
  {
    id: 'key_facts',
    name: 'Key facts',
    kind: 'lines',
    page: () => 'Five key facts from this part of the page, one per line, each starting with "• ". Each fact is one short sentence.',
    lesson: () => 'Five short facts or tips about the theme that are true in everyday life, one per line, each starting with "• ".',
  },
  {
    id: 'fun_fact',
    name: 'Did you know?',
    kind: 'lines',
    page: (L) => `"Did you know?": choose the most surprising fact in this part of the page. Line 1 is one question starting with the ${L} for "Did you know". Then 3 short sentences that explain it, using only the page.`,
    lesson: (L) => `"Did you know?": one surprising but true and well-known fact about the theme. Line 1 is one question starting with the ${L} for "Did you know". Then 3 short sentences that explain it. No numbers or dates you are not sure of.`,
  },
  {
    id: 'timeline',
    name: 'Mini timeline',
    kind: 'lines',
    page: () =>
      'A mini timeline of the events in this part of the page, in date order: 3 to 6 lines, each "YEAR – one short sentence". Use only dates the page gives. If it gives fewer than two dates, write a 4-sentence summary in time order instead.',
    lesson: (L) => `A day in the life: 4 to 6 lines in time order, each "TIME – one short sentence" about one person's day in the scene, with times written the ${L} way.`,
  },
  {
    id: 'then_now',
    name: 'Then and now',
    kind: 'lines',
    page: (L) =>
      `"Then and now": 2 or 3 lines starting with the ${L} for "Then:" about how things were, then 2 or 3 lines starting with the ${L} for "Now:" about how they are, only as the page states. If the page describes no change over time, use the ${L} for "Before:" and "After:" for a change it does describe.`,
    lesson: (L) =>
      `Two times compared: 2 or 3 lines about one time, then 2 or 3 lines about another, each starting with a short ${L} label for its time (then and now, winter and summer, or weekdays and the weekend). Choose times the grammar points can express.`,
  },
  {
    id: 'compare',
    name: 'Compare',
    kind: 'lines',
    page: () => 'Compare two or three things this part of the page describes (sizes, numbers, dates, features) in 4 or 5 sentences. Compare only what the page gives facts for.',
    lesson: () => 'Compare two or three people, places or things in the scene in 4 or 5 sentences.',
  },
  {
    id: 'whos_who',
    name: "Who's who",
    kind: 'lines',
    page: () =>
      '"Who\'s who": up to 4 people or groups in this part of the page. For each, one line "Name – what they did or do". If it names no people, use its main things (objects, animals, places) instead.',
    lesson: () => '"Who\'s who": 3 or 4 people in the scene. For each, one line "Name – who they are and what they do, wear, eat or like".',
  },
  {
    id: 'numbers',
    name: 'By the numbers',
    kind: 'lines',
    // "followed by a sentence" alone made Haiku put the number and the sentence in the two fields.
    page: (L) =>
      `"By the numbers": 4 or 5 lines, each starting with a number from this part of the page, in digits, ${numberLine(L)} If it has fewer numbers, use what it has.`,
    lesson: (L) => `"By the numbers": 4 or 5 lines, each starting with a number in digits (a price, a time, an age, how many) from the scene, ${numberLine(L)}`,
  },
  {
    id: 'cause_effect',
    name: 'Why it happened',
    kind: 'lines',
    page: (L) =>
      `"Why it happened": 3 or 4 sentences that each join a cause the page states to its result, with the ${L} for because, so or as a result. Use only causes the page itself gives: never supply a reason. If it gives none, write 4 sentences of what happened in order, with the ${L} for first, then and after that.`,
    lesson: (L) => `"Why?": 3 or 4 everyday cause-and-effect sentences from the scene, each with the ${L} for because or so (for example: it is cold, so she puts on a coat).`,
  },
  {
    id: 'news_report',
    name: 'News report',
    kind: 'lines',
    page: () => 'A short news report about the most important event or fact in this part of the page: a headline on line 1, then 4 short sentences. Never invent quotes, people or details.',
    lesson: () => 'A short, light news report about a small local event in the scene (a market, a sale, a sports day): a headline on line 1, then 4 short sentences.',
  },
  {
    id: 'page_speaks',
    name: 'The subject speaks',
    kind: 'lines',
    page: () => 'The subject speaks: 5 sentences in the first person, as if the main thing in this part of the page tells its own story. Every fact comes from the page.',
    lesson: () => 'A thing speaks: 5 sentences in the first person, as if one object from the theme (a coat, a bike, a teapot) tells its day.',
  },
  {
    id: 'interview',
    name: 'Interview',
    kind: 'lines',
    page: (L) =>
      `A short interview: 3 questions from a reporter and 3 answers from a person or thing in this part of the page, 6 lines starting with the ${L} for "Q:" and "A:". Answers use only facts from the page.`,
    lesson: (L) => `A short interview: a reporter asks a person in the scene 3 questions and they answer, 6 lines starting with the ${L} for "Q:" and "A:".`,
  },
  {
    id: 'dialogue',
    name: 'Two friends talk',
    kind: 'lines',
    page: (L) =>
      `Two friends with first names common in ${L}-speaking countries read this part of the page together: 6 short lines of conversation, each starting with the speaker's name and a colon, where they share the facts and react to them. Reactions are fine; facts come from the page.`,
    lesson: (L) => `Two friends with first names common in ${L}-speaking countries talk in the scene: 6 short lines of conversation, each starting with the speaker's name and a colon.`,
  },
  {
    id: 'postcard',
    name: 'Postcard',
    kind: 'lines',
    page: (L) =>
      `A postcard of 5 sentences from someone visiting a real place connected to the subject, or learning about it today, telling a friend what they learned. Start with the ${L} for "Dear Alex," on its own line and end with a first name on its own line. The writer may say what they did and how they feel, but every fact about the subject comes from the page.`,
    lesson: (L) => `A postcard of 5 sentences from someone in the scene to a friend. Start with the ${L} for "Dear Alex," on its own line and end with a first name on its own line.`,
  },
  {
    id: 'everyday_link',
    name: 'In your life',
    kind: 'lines',
    page: () =>
      '"In your life": 2 sentences of facts from this part of the page, then 2 or 3 sentences that speak to the reader (informal you) and connect them to things the reader can really see, use or do. Keep it true and realistic: these sentences add no facts about the subject.',
    lesson: () => '"In your life": 4 or 5 sentences that speak to the reader (informal you) about their own everyday life on the theme, with one or two questions.',
  },
  {
    id: 'true_false',
    name: 'True or false?',
    kind: 'true_false',
    page: () =>
      'A true-or-false quiz: 4 statements about this part of the page, one per line. Make 1 or 2 of them false by changing one detail; the true ones must be true.',
    lesson: () =>
      'A short scene of 3 sentences, one per line, then a true-or-false quiz: 4 statements about the scene. Make 1 or 2 of them false by changing one detail.',
  },
  {
    id: 'gap_fill',
    name: 'Gap fill',
    kind: 'gap_fill',
    page: () =>
      'A gap-fill exercise: 5 sentences about this part of the page, each with one form of the grammar point or one word to teach replaced by ____ and a hint in brackets (the base form, such as a verb\'s infinitive).',
    lesson: () =>
      'A gap-fill exercise: 5 sentences about the scene, each with one form of a grammar point or one word to teach replaced by ____ and a hint in brackets (the base form, such as a verb\'s infinitive).',
  },
  {
    id: 'word_spotlight',
    name: 'Word spotlight',
    kind: 'lines',
    vocab: true,
    page: (L) =>
      `"Word spotlight": 3 of the words to teach. For each, one line "*word* – simple meaning in ${L}", then one example sentence about this part of the page that uses the grammar point.`,
    lesson: (L) => `"Word spotlight": 3 of the words to teach. For each, one line "*word* – simple meaning in ${L}", then one example sentence from the scene that uses a grammar point.`,
  },
  {
    id: 'grammar_spotlight',
    name: 'Grammar spotlight',
    kind: 'lines',
    page: () =>
      '"Grammar spotlight": line 1 explains the grammar point in one simple sentence. Then 4 sentences about this part of the page that show it, each with the grammar form between asterisks, like *this*.',
    lesson: () =>
      '"Grammar spotlight": line 1 explains one grammar point in one simple sentence. Then 4 sentences from the scene that show it, each with the grammar form between asterisks, like *this*.',
  },
  {
    id: 'riddle',
    name: 'Guess what?',
    kind: 'riddle',
    page: (L) =>
      `"Guess what?": a riddle of 4 true clue lines in the first person about one thing in this part of the page, then a line asking the ${L} for "What am I?" (or "Who am I?"). The wrong options are other things from the page.`,
    lesson: (L) => `"Guess what?": a riddle of 4 clue lines in the first person about one thing from the theme, ideally a word to teach, then a line asking the ${L} for "What am I?" (or "Who am I?").`,
  },
  {
    id: 'glossed_summary',
    name: 'Summary with word help',
    kind: 'lines',
    vocab: true,
    page: (L) =>
      `A summary of this part of the page in 5 sentences, one per line, using 4 of the words to teach. The first time each one appears, put a simple ${L} meaning in brackets right after it.`,
    lesson: (L) => `A text of 5 sentences about the scene, one per line, using 4 of the words to teach. The first time each one appears, put a simple ${L} meaning in brackets right after it.`,
  },
  {
    id: 'word_web',
    name: 'Word groups',
    kind: 'lines',
    vocab: true,
    page: (L) =>
      `"Word groups": the words to teach and 2 to 4 other useful words for this part of the page, under 2 or 3 short ${L} headings that show how they fit together or fit the grammar, one heading per line followed by a colon and its words. Then 2 sentences about the page that use several of them.`,
    lesson: (L) =>
      `"Word groups": the words to teach and 2 to 4 other useful words on the theme, under 2 or 3 short ${L} headings that show how they fit together or fit the grammar, one heading per line followed by a colon and its words. Then 2 sentences from the scene that use several of them.`,
  },
  {
    id: 'collocations',
    name: 'Words that go together',
    kind: 'lines',
    vocab: true,
    page: () =>
      '"Words that go together": 4 useful word partnerships for this part of the page (a verb and a noun, an adjective and a noun, or a set phrase). For each, one line "*partnership* – simple meaning", then one sentence about the page that uses it.',
    lesson: () =>
      '"Words that go together": 4 useful word partnerships on the theme (a verb and a noun, an adjective and a noun, or a set phrase). For each, one line "*partnership* – simple meaning", then one sentence from the scene that uses it.',
  },
  {
    id: 'word_families',
    name: 'Word families',
    kind: 'lines',
    vocab: true,
    page: () =>
      '"Word families": 3 words for this part of the page. For each, one line showing its family (for example verb – noun – adjective, with the part of speech in brackets), then one sentence about the page that uses one of the forms.',
    lesson: () =>
      '"Word families": 3 words on the theme. For each, one line showing its family (for example verb – noun – adjective, with the part of speech in brackets), then one sentence from the scene that uses one of the forms.',
  },
  {
    id: 'opposites',
    name: 'Opposites and lookalikes',
    kind: 'lines',
    vocab: true,
    page: () =>
      '"Opposites and lookalikes": 4 words for this part of the page. For each, one line "word ↔ opposite" or "word ≈ similar word", then one sentence about the page that uses the word.',
    lesson: () => '"Opposites and lookalikes": 4 words on the theme. For each, one line "word ↔ opposite" or "word ≈ similar word", then one sentence from the scene that uses the word.',
  },
  {
    id: 'match_up',
    name: 'Match the words',
    kind: 'match',
    vocab: true,
    page: () => '"Match the words": 5 of the words to teach (or other key words of this part of the page), one per line, then one sentence about the page that uses two of them.',
    lesson: () => '"Match the words": 5 of the words to teach, one per line, then one sentence from the scene that uses two of them.',
  },
  {
    id: 'say_it_simply',
    name: 'Say it simply',
    kind: 'lines',
    vocab: true,
    page: (L) =>
      `"Say it simply": 4 key terms of this part of the page in ${L} (they may be above the reader's level). For each, one line "*term* → simple ${L} words", then one simple sentence about the page that uses the term.`,
    lesson: (L) => `"Say it simply": 4 ${L} words or phrases on the theme just above the reader's level. For each, one line "*word* → simple ${L} words", then one simple sentence from the scene that uses it.`,
  },
];

export function getFormat(id: string): Format | undefined {
  return FORMATS.find((f) => f.id === id);
}

/** Page mode writes each section in this first; the widget's format menu offers the rest. */
export const DEFAULT_PAGE_FORMAT = 'summary';

/** How many recent formats a new pick avoids, so "Generate again" and the next sections bring something different. */
export const RECENT_FORMATS = 6;

/** A random format, not one of `avoid` (unless that leaves none). */
export function pickFormat(random: () => number, avoid: readonly string[] = []): Format {
  const pool = FORMATS.filter((f) => !avoid.includes(f.id));
  const from = pool.length ? pool : FORMATS;
  return from[Math.floor(random() * from.length)]!;
}
