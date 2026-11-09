import type { Plan } from './schedule';

/**
 * An exercise on a syllabus lesson, for the widget's Practice tab: one at a
 * time, the next written while the reader does this one. The model writes it
 * in its type's shape (`exercises.ts`); code checks it and turns it into one
 * of a few kinds the widget knows how to draw, with options already shuffled.
 *
 * Target-language text may carry readings (日本語《にほんご》); `en` is English.
 */
export interface Line {
  text: string;
  en: string;
}

/** What an exercise asks about, above its answers. Each part is optional. */
export interface Prompt {
  /** English, always shown: a question, a situation, the meaning to build. */
  question?: string;
  /** Target-language text shown large; may have `___` (a gap) or `*marked*` words. */
  text?: string;
  /** `text`'s English, shown once the exercise is answered. */
  en?: string;
  emoji?: string;
  /** Target-language text to play; without speech, it can be shown instead. */
  audio?: string;
  /** A message or short text the question is about; its English shows once answered. */
  message?: { from: string; lines: Line[] };
  /**
   * A drill on reading the script: `text` and the options are shown as written, with no readings or
   * romaji, and no 🔊 on `text`, until answered.
   */
  plain?: true;
  /** No 🔊 on `text` until answered: hearing it would give the answer away. */
  quiet?: true;
}

export interface Option {
  text: string;
  emoji?: string;
  /** English under a target-language label. */
  en?: string;
  /** English shown under it only once answered, since before that it would give the answer away. */
  enAfter?: string;
}

export type Exercise =
  /** One right option. `full` is shown once answered (a gap's sentence filled in), and `more` under it (a guess's explanation). */
  | { kind: 'choice'; prompt: Prompt; options: Option[]; answer: number; why: string; full?: Line; more?: Line[] }
  /** Every item gets one of the labels. */
  | {
      kind: 'label';
      prompt: Prompt;
      labels: Option[];
      items: Array<{ text: string; en: string; label: number; why: string; fix: string }>;
      why: string;
      /** Each item gets a 🔊: a sort by sound. */
      say?: true;
    }
  /**
   * Tiles put in order: `accepted` are the right orders, as tile indexes (a distractor tile is in
   * none). `full` is the answer as it's shown once checked: the sentence, or the lines in order.
   */
  | {
      kind: 'order';
      prompt: Prompt;
      tiles: string[];
      accepted: number[][];
      layout: 'inline' | 'list';
      ends?: [string, string];
      full: Line[];
      why: string;
      /** What the tiles placed so far make, shown above them: letters joined as written (Arabic), or a Hangul block. */
      preview?: 'join' | 'block';
    }
  /** Tap a word, then its partner; `shuffle` is the order the right column shows them in. */
  | { kind: 'pairs'; pairs: Array<{ left: string; right: string }>; shuffle: number[] }
  /** Tap the right line, or with `gaps` the gap between lines where `insert` goes (`answer` lines before it). */
  | { kind: 'tap'; prompt: Prompt; lines: Array<Line & { speaker: string }>; answer: number; gaps: boolean; insert?: Line; why: string }
  /**
   * Tap every wrong word in a paragraph, or every use of a form (no `fix`): a word's `error`
   * points into `errors`, -1 for none.
   */
  | {
      kind: 'proofread';
      prompt: Prompt;
      tokens: Array<{ text: string; error: number }>;
      errors: Array<{ text: string; fix: string; why: string }>;
      /** The form to tap every use of, in English (no `fix`); for Jev's check on the key. */
      form?: string;
      /** The paragraph's English (as it should read), shown once answered. */
      en?: string;
    }
  /** Tap the wrong chunk, then pick what replaces it; `chunksEn` and `optionsEn` (their English) show once answered. */
  | {
      kind: 'fix';
      prompt: Prompt;
      chunks: string[];
      layout: 'inline' | 'list';
      wrong: number;
      options: string[];
      answer: number;
      full: Line;
      why: string;
      chunksEn?: string[];
      optionsEn?: string[];
    }
  /**
   * Tap letters or syllables, word by word (`words`): every one in `answer` (flat indexes), or with `single`
   * just the one. `boxed` draws each unit as a tile (syllables); `full` shows once answered.
   */
  | { kind: 'units'; prompt: Prompt; words: string[][]; answer: number[]; single: boolean; boxed: boolean; full?: Line; why: string }
  /** Type what's heard; compared strictly, accents and all (`sameSpelling`). */
  | { kind: 'write'; prompt: Prompt; answer: string; why: string }
  /** A sentence to say aloud (`say`), heard by the microphone and marked leniently (`speaking.ts`). */
  | { kind: 'speak'; prompt: Prompt; say: Line; why: string }
  /** A conversation: a choice at each turn; a wrong one gets a reaction and another try. */
  | {
      kind: 'dialogue';
      partner: string;
      turns: Array<{ line: Line; choices: Array<{ text: string; en: string; correct: boolean; reaction: string }> }>;
      closing?: Line;
    };

/**
 * An exercise with its type (`exercises.ts`, or a drill's) and the instruction above it, in English.
 * A drill (`drills/`) is built by code, not written: `drill.name` is on its chip, and it has no hint.
 */
export type Step = Exercise & { type: string; instruction: string; drill?: { name: string } };

export interface Practice {
  step: Step;
  /** Short praise in the language, for a right answer; '' for the default. */
  praise: string;
  /** The kit's everyday situation it's set in. */
  setting: string;
  /** How it was written, for the eval. */
  meta?: { model: string; version: string; usd: number | null; secs?: number };
  /** What it was planned to practise (`schedule.ts`); set by the Practice tab once it's written. */
  plan?: Plan;
}
