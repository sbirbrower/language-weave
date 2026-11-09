import type { Calibration, PageEstimate, RequestEstimate } from './cost';
import type { PageWord } from './lessons/pageWords';
import type { Candidate } from './lessons/types';
import type { PageSection } from './passage/context';
import type { Level } from './grammar/types';
import type { ShownMark } from './marks/stream';
import type { Piece, PieceMode, TeachWord } from './passage/piece';
import type { Textbook } from './passage/textbook';
import type { Practice, Step } from './practice/types';
import type { ReadingInput, ReadingLine } from './reading/formats';
import type { ScriptView } from './ruby';
import type { CustomLesson, LessonRequest } from './syllabus/custom';
import type { SyllabusLesson } from './syllabus/types';
import type { ChatProvider } from './providers/types';
import type { Effort } from './settings';
import type { Definition } from './vocab/definitions';
import type { WordStatus } from './vocab/store';
import type { WeaveLine } from './weave/parse';
import type { WidgetPosition, WidgetSize } from './widget';

/** What an injection of the content script is for, set on its global just before. */
export interface TissageRun {
  /** Skip the cost confirmation. */
  force?: boolean;
  /** Lesson mode: weave this page too, or mark it for the lesson. */
  weave?: boolean;
  mark?: boolean;
  /** Lesson mode: the reader switched to this tab with the widget open; show it as they left it, nothing else. */
  follow?: boolean;
}

/** Content script or popup → background. */
export type Request =
  | { type: 'weave-config'; buildId: string }
  | { type: 'weave-segment'; text: string; budget: number; levelNote?: string; estimate: RequestEstimate }
  | {
      type: 'weave-lesson';
      text: string;
      lessonId: string;
      candidates: Candidate[];
      /** Extra words from the lesson's vocabulary, and the spans already woven in code. */
      topUpWords: number;
      taken: string[];
      /** Send the lesson's vocabulary in the system prompt. */
      vocabulary: boolean;
      /** Words picked for this page; some candidates may be theirs. */
      pageWords?: PageWord[];
      /** The reader's level, for the lesson's beginner lists (`forLevel`). */
      level: Level;
      estimate: RequestEstimate;
    }
  | {
      type: 'pick-page-words';
      title: string;
      headings: string[];
      /** The paragraphs on screen. */
      passages: string[];
      /** Lemmas a lesson already teaches. */
      exclude: string[];
      level: Level;
      estimate: RequestEstimate;
    }
  | {
      type: 'reading';
      buildId: string;
      lessonId: string;
      /** Themed words: the page's words are what the lesson teaches. */
      pageWords?: PageWord[];
      formatId: string;
      input: ReadingInput;
      estimate: RequestEstimate;
    }
  | { type: 'set-reading-format'; formatId: string }
  | { type: 'set-widget-position'; position: WidgetPosition | null }
  | { type: 'set-widget-size'; size: WidgetSize | null }
  | { type: 'set-text-scale'; scale: number }
  | { type: 'set-script-view'; language: string; view: ScriptView }
  | {
      type: 'passage';
      buildId: string;
      mode: PieceMode;
      /** `src/passage/formats.ts`. */
      formatId: string;
      /** Lesson mode: the syllabus lesson (`src/syllabus/`). */
      lessonId?: string;
      /** Page mode: the page, the section on screen (the passage is about it), the reader's level and the words woven on the page. */
      title?: string;
      sections?: PageSection[];
      focus?: number;
      level?: Level;
      pageWords?: TeachWord[];
    }
  /** Lesson mode: one chunk of the page marked for the syllabus lesson (`src/marks/`); its paragraphs as the page has them. */
  | { type: 'marks'; buildId: string; lessonId: string; title: string; heading: string; paragraphs: string[] }
  /** The syllabus lesson's textbook page, for the widget's Lesson tab. */
  | { type: 'textbook'; buildId: string; lessonId: string }
  /**
   * One exercise for the Practice tab; `exercise` is its type (`src/practice/exercises.ts`). Lesson mode: on
   * the syllabus lesson, practising the kit point `point` with the theme words `words`, as planned by
   * `src/practice/schedule.ts`. Page mode: on the section `focus`, like the passage, with the words woven on the page.
   * `like`: the exercise the reader asked for more like, and (lesson mode) the `setting` it was in.
   */
  | {
      type: 'practice';
      buildId: string;
      mode: PieceMode;
      exercise: string;
      lessonId?: string;
      point?: string;
      words?: string[];
      title?: string;
      sections?: PageSection[];
      focus?: number;
      level?: Level;
      pageWords?: TeachWord[];
      setting?: string;
      like?: Step;
    }
  /** The lesson's kit point ids and theme words, for the Practice tab to plan exercises with (`src/practice/schedule.ts`). */
  | { type: 'practice-lesson'; buildId: string; lessonId: string }
  /** A lesson the reader asked for, written as a syllabus lesson (`src/syllabus/custom.ts`); not saved until they save it. `id` keeps an edited lesson's. */
  | { type: 'custom-lesson'; buildId: string; request: LessonRequest; id?: string }
  /** A hint for the exercise on screen (`src/practice/hint.ts`); `lang` is a language code, `level` the exercise's. */
  | { type: 'practice-hint'; buildId: string; lang: string; level: string; step: Step }
  /** One passage line read aloud; `lang` is a language code (`src/languages/`). */
  | { type: 'speak'; buildId: string; lang: string; text: string; slow?: boolean }
  /** The words recorded locally in `lang` (`src/recordings.ts`), as `recordingKey` writes them. */
  | { type: 'recorded-words'; buildId: string; lang: string }
  /** The Words page's definitions and examples (`src/vocab/definitions.ts`), stored or written now; `words` are the words as listed. */
  | { type: 'define-words'; buildId: string; lang: string; level: Level; words: Array<{ word: string; gloss: string }> }
  /**
   * A speaking exercise (`src/listen.ts`): the microphone starts recording; stops, and what was said
   * comes back as text, `expected` being the sentence in `lang`; or stops and the recording is thrown away.
   */
  | { type: 'listen-start'; buildId: string }
  | { type: 'listen-stop'; buildId: string; lang: string; expected: string }
  | { type: 'listen-cancel'; buildId: string }
  /** Opens Language Weave on a tab; lesson mode also weaves it with `weave`, marks it with `mark`. */
  | { type: 'weave-tab'; tabId: number; buildId: string; weave?: boolean; mark?: boolean }
  /** Lesson mode's widget, shared by every tab (`src/lessonState.ts`): null when none was opened this session. */
  | { type: 'get-lesson-state'; buildId: string }
  | { type: 'set-lesson-state'; buildId: string; state: string }
  | { type: 'list-models'; provider: ChatProvider; apiKey: string };

export type ReadingRequest = Extract<Request, { type: 'reading' }>;

/**
 * The port a reading text streams over: the content script posts one
 * `reading` request, the background posts its lines as each one finishes,
 * then the result.
 */
export const READING_PORT = 'reading';
export type ReadingPortMessage = { type: 'lines'; lines: ReadingLine[] } | { type: 'done'; result: ResponseFor['reading'] };

export type PassageRequest = Extract<Request, { type: 'passage' }>;

/** The port a passage streams over, like `READING_PORT`: a note while the lesson kit is built, the piece as its lines are written. */
export const PASSAGE_PORT = 'passage';
export type PassagePortMessage =
  | { type: 'note'; note: string }
  | { type: 'piece'; piece: Piece }
  | { type: 'done'; result: ResponseFor['passage'] };

export type MarksRequest = Extract<Request, { type: 'marks' }>;

/** The port a chunk's marks stream over: a note while the lesson kit is built, each mark as its check passes. */
export const MARKS_PORT = 'marks';
export type MarksPortMessage = { type: 'note'; note: string } | { type: 'mark'; mark: ShownMark } | { type: 'done'; result: ResponseFor['marks'] };

/** `stale` = the sender comes from a newer build than the running background. */
export type Result<T> = { ok: true; value: T } | { ok: false; error: string; code?: 'stale' };

export interface WeaveConfig {
  density: number;
  language: string;
  mode: 'page' | 'lesson';
  level: Level;
  /** What is woven: a weave lesson id (`src/lessons/`), or 'none' for the general weave. */
  weave: string;
  /** The syllabus lesson lesson mode teaches, or 'none' for the language's first. */
  lessonId: string;
  /** That lesson, the course's or one the reader wrote (`src/syllabus/stored.ts`); undefined for a language with none. */
  lesson?: SyllabusLesson;
  topUp: boolean;
  /** Page mode: false = pick the page's words for the widget, but don't weave them in. */
  weavePage: boolean;
  hasKey: boolean;
  /** A Google Text-to-Speech key is set, so passages can be read aloud. */
  canSpeak: boolean;
  /** Speaking exercises are on and a DeepInfra key is set, so the reader can be heard. */
  canListen: boolean;
  model: string;
  effort: Effort;
  /** False when thinking is off for this model. */
  thinks: boolean;
  confirmAboveUsd: number;
  /** The widget's reading format, last chosen. */
  readingFormat: string;
  /** Where the reader last dragged the widget; null = the corner. */
  widgetPosition: WidgetPosition | null;
  /** The size the reader last dragged the widget to; null = the default. */
  widgetSize: WidgetSize | null;
  /** Text size in the widget and the mark popup. */
  textScale: number;
  /** How each language with a romanisation is shown, as last picked (`Settings.scriptViews`). */
  scriptViews: Partial<Record<string, ScriptView>>;
  /** Past estimate accuracy for this model and effort. */
  calibration?: Calibration;
  debug: boolean;
}

export interface WeaveResult {
  lines: WeaveLine[];
  /** What the request cost; null if the model's price is unknown. */
  usd: number | null;
}

export interface ResponseFor {
  'weave-config': Result<WeaveConfig>;
  'weave-segment': Result<WeaveResult>;
  'weave-lesson': Result<WeaveResult>;
  'pick-page-words': Result<{ words: PageWord[]; usd: number | null }>;
  reading: Result<{ lines: ReadingLine[]; usd: number | null }>;
  'set-reading-format': Result<null>;
  'set-widget-position': Result<null>;
  'set-widget-size': Result<null>;
  'set-text-scale': Result<null>;
  'set-script-view': Result<null>;
  passage: Result<{ piece: Piece; usd: number | null }>;
  textbook: Result<{ textbook: Textbook; usd: number | null }>;
  practice: Result<{ practice: Practice; usd: number | null }>;
  'practice-lesson': Result<{ points: string[]; words: string[]; glosses: Record<string, string>; usd: number | null }>;
  /** `leftOut`: what of the request the lesson doesn't teach, for the reader; '' if nothing. */
  'custom-lesson': Result<{ lesson: CustomLesson; leftOut: string; usd: number | null }>;
  'practice-hint': Result<{ hint: string; usd: number | null }>;
  marks: Result<{ usd: number | null; marks: number; dropped: number; toModel: number }>;
  /** `audio` is base64 MP3. */
  speak: Result<{ audio: string; usd: number | null }>;
  /** By word as asked for; a word the model left out is missing. */
  'define-words': Result<{ definitions: Record<string, Definition>; usd: number | null }>;
  'recorded-words': Result<string[]>;
  'listen-start': Result<null>;
  'listen-stop': Result<{ text: string; usd: number | null }>;
  'listen-cancel': Result<null>;
  'weave-tab': Result<null>;
  /** Encoded with `encodeLessonState`. */
  'get-lesson-state': Result<string | null>;
  'set-lesson-state': Result<null>;
  'list-models': Result<string[]>;
}

/** Background → the offscreen document that records (`entrypoints/offscreen/`); every other message is left alone. */
export type OffscreenRequest = { target: 'offscreen'; type: 'record-start' | 'record-stop' | 'record-cancel' };

export interface OffscreenResponseFor {
  'record-start': Result<null>;
  /** `wav` is base64, 16 kHz mono. */
  'record-stop': Result<{ wav: string; secs: number }>;
  'record-cancel': Result<null>;
}

/** Popup → content script in the active tab. */
export type TabRequest =
  | { type: 'page-vocab' }
  | { type: 'confirm-weave' }
  | { type: 'restore' }
  /** Lesson mode: takes the marks or the woven words off the page, leaving the widget. */
  | { type: 'unmark' }
  | { type: 'unweave' }
  | { type: 'reveal'; key: string }
  /** Save a word on the page, mark it known, or neither (`src/vocab/`). */
  | { type: 'vocab-set'; key: string; status: WordStatus };

export interface VocabItem {
  key: string;
  /** Its key in the reader's word store (`normalizeLemma`). */
  lemma: string;
  /** Citation form, e.g. "le mot", "dire", "à bientôt". */
  french: string;
  /** Distinct English spans it replaced, in the order seen. */
  english: string[];
  gloss: string;
  category: string;
  count: number;
}

export interface PageVocab {
  /** 'confirm' = planned, waiting for the reader to accept the estimated cost. */
  status: 'idle' | 'confirm' | 'weaving' | 'done';
  /** False when only the lesson widget is open (lesson mode without weaving). */
  weaving: boolean;
  /** Segments waiting on the model now. */
  pending: number;
  /** Waiting for the page's words to be picked; nothing else is sent until then. */
  picking: boolean;
  /** Segments that will be sent when the reader scrolls near them. */
  queued: number;
  /** The weave lesson. */
  weave: string;
  categories: Array<{ id: string; label: string }>;
  /** Target share of words, 0–1. */
  density: number;
  totalWords: number;
  wovenWords: number;
  items: VocabItem[];
  model: string;
  /** Estimated cost of the model requests for this page. */
  estimate: PageEstimate | null;
  /** Actual cost so far; null if the model's price is unknown. */
  spentUsd: number | null;
  /** Lesson mode's marks are on the page. */
  marked: boolean;
}

export interface TabResponseFor {
  'page-vocab': PageVocab;
  'confirm-weave': null;
  restore: null;
  unmark: null;
  unweave: null;
  reveal: boolean;
  'vocab-set': boolean;
}
