/**
 * What a language's drills are built from (`drills/<code>.ts`): letter tables, hand-checked word
 * lists and minimal pairs. Each drill (`build.ts`) uses the parts it needs, and comes up only in a
 * lesson where its data has something taught by then. Lessons are counted from 0, in the order
 * `drillLessons(lang)` lists them: the syllabus without its culture lessons.
 *
 * Target-language text may carry readings (`ресторан《restorán》`), shown once the drill is answered;
 * a drill shows the script without them.
 */
export interface DrillData {
  /** Drills on sounds and script come up in the language's first this-many lessons; the rest in the lesson that teaches theirs (`Drill.taught`). */
  lessons: number;
  letters?: Letters;
  /** Loanwords a reader knows from English, to read in the script. */
  loans?: Word[];
  /** Russian words to read with the letters still to come romanised (`roman`). */
  fade?: { roman: Record<string, string>; words: Word[] };
  /** Words cut into syllables, with the stressed one (`text` has the reading), and notes on a letter unstressed. */
  stress?: { at: number; words: Array<{ syllables: string[]; stressed: number; text: string; en: string }>; notes: Array<{ letter: string; note: string }> };
  /** Groups of katakana that look alike, matched to their hiragana (found in `letters` by sound). */
  kanaPairs?: string[][];
  /**
   * Hangul blocks to build, each from its letters, for a word with it (`word`, with its reading); how
   * a final consonant is said, and what to call a first consonant that's silent (ㅇ).
   */
  blocks?: { list: Array<{ letters: string[]; reading: string; word: string; en: string; at: number }>; finals: Record<string, string>; silent: string };
  /**
   * Devanagari's vowel signs, with what each says (`''` is the inherent a) and where it's written; they go on
   * the taught letters marked `base`, or on `fallback` before any are.
   */
  vowelSigns?: { signs: Array<{ sign: string; sound: string; where: string }>; alike: string[][]; at: number; fallback: { letter: string; sound: string } };
  /** Arabic words to spell letter by letter, watching them join; `nonJoining` never join the letter after them. */
  join?: { words: Word[]; nonJoining: string };
  /** Nouns with ال (text with the reading), sorted by the `sun` letters, which the l becomes. */
  sunMoon?: { sun: string; words: Word[]; at: number; why: string };
  /** A sentence with one word (`*marked*`) that has several readings unvoweled: the right one first. */
  unvoweled?: Array<{ sentence: string; en: string; spelled: string; options: Array<{ reading: string; en: string }>; at: number }>;
  /** Two-syllable Chinese words, their pinyin cut into syllables, and how each tone is described. */
  tones?: { words: Array<{ text: string; syllables: string[]; en: string }>; names: Record<number, string> };
  /** Words that differ in one sound, with a tip on telling them apart. */
  pairs?: Array<{ words: [Word, Word]; why: string; at?: number }>;
  /** Words sorted by how a letter (`*marked*`) is said, into two groups. */
  sorts?: Array<{ labels: [string, string]; words: Array<{ text: string; en: string; label: 0 | 1 }>; why: string; at: number }>;
  /** Sentences with their silent letters in brackets: `Le peti[t] cha[t]`. */
  silent?: { sentences: Array<{ text: string; en: string }>; why: string; at: number };
  /**
   * Words with one written accent, to put back; the lesson's own words too, without their `articles`.
   * `rule` explains it for the word without its accent; `mark` is the combining accent (acute if unset).
   */
  accents?: { list: Word[]; articles: string[]; rule(plain: string): string; at: number; mark?: string };
  /** Words to write as heard (strictly, accents and all), when the lesson's own words won't do. */
  dictation?: string[];
  /** Words spelled to a rule (`why`), each with misspellings that break it. */
  spelling?: { at: number; why: string; words: Array<{ text: string; en: string; wrong: string[] }> };
  /**
   * Phrases with one `*marked*` word after something that lenites it (an h after its first letter) or
   * doesn't; `why` says which. `sounds` gives how each lenited pair is said, unless a phrase's `sound`
   * says otherwise, and the sound before lenition; `base` is the word unlenited, if not just without its h.
   */
  lenition?: {
    sounds: Record<string, { sound: string; unlenited: string }>;
    phrases: Array<{ text: string; en: string; why: string; at: number; sound?: string; base?: string }>;
  };
  /**
   * Yes-or-no questions answered with their verb, for a language with no yes or no: each group's
   * answers, and wrong ones a learner gives (`traps`).
   */
  echoes?: Array<{ at: number; yes: string; no: string; traps: string[]; why: string; questions: Word[] }>;
  /**
   * Counters, taught in lesson `at`: what each counts, things it counts (`en` plural), and how some
   * numbers of it are said (`text` in kanji, `reading` in kana), with readings a learner gives instead.
   */
  counters?: {
    at: number;
    list: Array<{ counter: string; counts: string; things: Word[]; rule?: string; numbers: Array<{ n: number; text: string; reading: string; wrong: string[] }> }>;
  };
  /** Words with small kana to spell from tiles (`roman` their reading); each small kana's full-size one is a wrong tile, and `note` says what it does. */
  smallKana?: { words: Word[]; small: Record<string, { big: string; note: string }> };
  /** Sentences with the letters said otherwise than written in brackets (`わたし[は]`); `ask` is the instruction. */
  saidAs?: { at: number; ask: string; sentences: Array<{ text: string; en: string }>; why: string };
  /** Words sorted into two groups by what they are (verb groups), in the lesson `at` that teaches them; `ask` is the instruction. */
  wordSorts?: Array<{ at: number; ask: string; labels: [string, string]; words: Array<{ text: string; en: string; label: 0 | 1 }>; why: string }>;
  /** A form to make of each word (`name`, such as "て-form"), taught in lesson `at`, with the forms a learner makes instead. */
  forms?: { at: number; name: string; list: Array<{ text: string; en: string; form: string; wrong: string[]; why: string }> };
  /** Numbers read in a way of their own (times, people, dates): each set taught in lesson `at`, its readings with wrong ones. */
  readings?: Array<{ at: number; rule: string; list: Array<{ text: string; reading: string; en: string; wrong: string[] }> }>;
  /**
   * This and that by where the thing is (`places`: the word alone and before a noun, and its English),
   * with sentences to put them in (`___` the gap, `{noun}` a noun from `nouns`).
   */
  demonstratives?: {
    at: number;
    places: Array<{ where: string; alone: string; before: string; en: string }>;
    nouns: Word[];
    alone: Array<{ text: string; en: string }>;
    before: Array<{ text: string; en: string }>;
    why: string;
  };
  /** Set phrases and when they're said; ones in the same `group` are easily mixed up, so they're the wrong answers first. */
  phrases?: Array<Word & { when: string; group: string }>;
  /**
   * Nouns (`en` with the article) to give the article: `article` writes it and says why, `forms` are the ones to choose among.
   * `guess`: the gender is what's asked (German der, die, das), so it isn't shown.
   */
  articles?: { at: number; nouns: Array<Word & { gender: string }>; article(noun: string, gender: string): { text: string; why: string }; forms(noun: string): string[]; guess?: true };
  /** Telling the time, taught in lesson `at`: how `h:mm` (1–12, minutes in fives) is said and why, and the sentence it goes in (`{t}`). */
  clock?: { at: number; say(h: number, m: number): { text: string; why: string }; sentence: { text: string; en: string } };
  /**
   * Answering yes or no to a question, taught in lesson `at`, where a negative one is contradicted with its own
   * word (German doch, French si): `answers` and why each is right, and questions with what yes and no say (`yes`, `no`, `en` first person).
   */
  contradict?: {
    at: number;
    answers: { yes: string; no: string; contra: string };
    why: { contra: string; agree: string; yes: string; no: string };
    questions: Array<Word & { negative: boolean; yes: Word; no: Word }>;
  };
  /** Phrases with a gap for an adjective's ending, in the lessons that teach them: every one for lesson `at` (none in the rest), its right form and the wrong ones. */
  endings?: { phrases(at: number): Array<{ text: string; en: string; right: string; wrong: string[]; why: string }> };
}

/** A word to read or hear: `text` may have a reading; `roman` is one for text whose readings aren't Latin (kana). */
export interface Word {
  text: string;
  en: string;
  /** The first lesson it can come up in (its letters taught by then). */
  at?: number;
  roman?: string;
}

export interface Letters {
  list: Letter[];
  /** Letters that look or sound alike: the wrong answers come from these first. */
  alike: string[][];
}

export interface Letter {
  letter: string;
  /** How it's romanised, as the language's readings write it. */
  sound: string;
  /** For an English speaker: "as in loch". */
  like?: string;
  /** What to play for it: the letter itself, or a syllable with it. None = not in listening drills. */
  say?: string;
  /** What an English reader might take it for, by its look (в for b): another wrong answer. */
  trap?: string;
  /** The lesson that teaches it. */
  at: number;
  /** Which of the language's scripts it's in (hiragana, katakana): options stay in one. */
  set?: string;
  /** A consonant a vowel sign goes on (`vowelSigns`). */
  base?: true;
}
