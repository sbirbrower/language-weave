import type { Level } from '../grammar/types';

export type Gender = 'm' | 'f' | 'n' | '-';

export interface LanguageConfig {
  /** Short code used as the vocab key prefix, e.g. `fr` in `fr:chien`. */
  code: string;
  displayName: string;
  /** Flag emoji shown beside the name in the pages' language menus. */
  flag: string;
  /** "Hello" in the language, as it's written: under its code on the popup's language tiles. */
  greeting: string;
  /** BCP-47 tag for `lang` attributes and speech synthesis. */
  bcp47: string;
  /** Google Text-to-Speech's locale, where it isn't `bcp47` (Mandarin's voices are cmn-CN, its pages zh-CN). */
  speechLocale?: string;
  /** Google Text-to-Speech has no voice for the language: no listening exercises, and 🔊 only on what's recorded locally (`src/recordings.ts`). */
  noVoice?: true;
  /** Whisper doesn't know the language: no speaking exercises. */
  notHeard?: true;
  /** Genders this language uses, in the order the prompt lists them. */
  genders: Gender[];
  /** Grammar rules the model must apply when choosing a span. */
  grammarNotes: string;
  /** What a lemma is in this language, for prompts: "infinitive for verbs, …". */
  lemmaForms: string;
  /** Two weave lines for the system prompt's example passage ("The village sits at the edge of the forest, …"). */
  weaveExample: string;
  /** Three page-word picker lines, for "dog", "run" and "fast". */
  pickExample: string;
  /**
   * The language's commonest short words (articles, pronouns, small verbs), lower case: the widget's
   * checks count them to tell a line in this language from an English one (`src/passage/checks.ts`).
   */
  functionWords: string[];
  /**
   * How to write the language for a learner, for every prompt that writes it (passages, kits,
   * textbook pages, marks): a script with readings (`src/ruby.ts`), punctuation, a neighbour not
   * to mix it with (Scottish Gaelic and Irish). Unset for the rest.
   */
  writingNotes?: string;
  /**
   * Levels at which a reader sees each word's romaji under it, written by code from the script
   * and its readings (`src/romaji.ts`, `showsRomaji`). Unset for languages without one.
   */
  romajiLevels?: readonly Level[];
  /**
   * A word in the script and romanised, for languages shown with a romanisation (readings in Latin
   * letters, or romaji): the widget's script switch labels its choices with it (`ScriptView`).
   */
  romanSample?: { script: string; roman: string };
  genderColors: Partial<Record<Gender, string>>;
  /** How a word appears in a vocab list, e.g. nouns with their article. */
  citationForm(lemma: string, gender: Gender, pos: string): string;
}
