import { browser } from 'wxt/browser';
import { defineContentScript } from 'wxt/utils/define-content-script';
import { BUILD_ID } from '@/src/build';
import { estimateRequest, type PageEstimate } from '@/src/cost';
import { getLanguage, scriptViewFor, type LanguageConfig } from '@/src/languages';
import { SCRIPT_ATTR, scriptStyles, type ScriptView } from '@/src/ruby';
import { getLesson, type Lesson } from '@/src/lessons';
import {
  buildPickPrompt,
  buildPickSystemPrompt,
  fitToPage,
  PAGE_CATEGORY,
  PAGE_WORD_TARGET,
  type PageWord,
} from '@/src/lessons/pageWords';
import { EASY_CATEGORY } from '@/src/lessons/easy';
import { withExtras, type LessonParts } from '@/src/lessons/extras';
import { aboveBeginner, forLevel } from '@/src/lessons/level';
import { matchLessonResponse, normalizeLemma } from '@/src/lessons/resolve';
import {
  MARKS_PORT,
  PASSAGE_PORT,
  READING_PORT,
  type MarksPortMessage,
  type MarksRequest,
  type PageVocab as PageVocabSnapshot,
  type PassagePortMessage,
  type PassageRequest,
  type ReadingPortMessage,
  type ReadingRequest,
  type Request,
  type ResponseFor,
  type TabRequest,
  type TabResponseFor,
  type TissageRun,
  type WeaveConfig,
} from '@/src/messages';
import { decodeLessonState, encodeLessonState, newRev, type LessonState } from '@/src/lessonState';
import { PageVocab } from '@/src/pageVocab';
import type { Effort } from '@/src/settings';
import type { Level } from '@/src/grammar/types';
import { estimatePlan, planPage, systemFor, type PlannedRequest, type SegmentPlan } from '@/src/weave/plan';
import { carryLimit, DensityCarry } from '@/src/weave/carry';
import { headings, onScreenText } from '@/src/reading/collect';
import { BLOCK_ATTR, collectSegments, findPageText, GLOSS_CLASS, inPageOrder, isGone, MIN_SEGMENT, WOVEN_CLASS, type Segment } from '@/src/weave/segment';
import { countWords, selectReplacements, type Rejection, type Replacement } from '@/src/weave/select';
import { applyReplacements, EN_CLASS, FR_CLASS, restoreAll, SHOW_SOURCE_CLASS, toggleSource } from '@/src/weave/write';
import { onScreen } from '@/src/reading/collect';
import { startReading, type Reading } from '@/src/reading/controller';
import { READING_MODEL, type ReadingLine } from '@/src/reading/formats';
import { thinks as modelThinks } from '@/src/providers/thinking';
import { removeWidget, type WidgetPosition, type WidgetSize } from '@/src/widget';
import { WordTracker } from '@/src/vocab/tracker';
import { showWordButton, wordText, type WordButton } from '@/src/wordButton';
import { pageSections, sectionChunks, sectionOnScreen, selectionText, withSelection } from '@/src/passage/context';
import { startMarks, type Marker } from '@/src/marks/controller';
import { showMarkPopup, type MarkPopup } from '@/src/marks/popup';
import type { ShownMark } from '@/src/marks/stream';
import { MARK_STYLES, removeMarks } from '@/src/marks/write';
import { startPassage, type PassageDeps, type PassageWidget } from '@/src/passage/controller';
import type { Piece } from '@/src/passage/piece';
import { recordingKey } from '@/src/recordings';
import { createSpeaker, type Speaker } from '@/src/speaker';
import type { Listener } from '@/src/practice/controller';
import { lessonCoverage } from '@/src/practice/coverage';
import { practiceLedger } from '@/src/practice/ledger';
import { drillsFor } from '@/src/practice/drills';
import type { SyllabusLesson } from '@/src/syllabus';

/** The reading-format widget (`src/reading/`), hidden while lessons move to a passage widget. True brings it back. */
const SHOW_READING_WIDGET = false;

function send<T extends Request>(msg: T): Promise<ResponseFor[T['type']]> {
  return browser.runtime.sendMessage(msg);
}

/** The widget's piece over a port: notes while a lesson kit is built, then the piece as its lines are written. */
function streamPassage(
  msg: PassageRequest,
  onNote: (note: string) => void,
  onPiece: (piece: Piece) => void,
): Promise<ResponseFor['passage']> {
  return new Promise((resolve) => {
    const port = browser.runtime.connect({ name: PASSAGE_PORT });
    let done = false;
    port.onMessage.addListener((m: PassagePortMessage) => {
      if (m.type === 'note') return onNote(m.note);
      if (m.type === 'piece') return onPiece(m.piece);
      done = true;
      port.disconnect();
      resolve(m.result);
    });
    port.onDisconnect.addListener(() => {
      if (!done) resolve({ ok: false, error: 'Language Weave stopped answering. Reload it in chrome://extensions.' });
    });
    port.postMessage(msg);
  });
}

/** A chunk's marks over a port, each one as its check passes. */
function streamMarks(msg: MarksRequest, onMark: (mark: ShownMark) => void): Promise<ResponseFor['marks']> {
  return new Promise((resolve) => {
    const port = browser.runtime.connect({ name: MARKS_PORT });
    let done = false;
    port.onMessage.addListener((m: MarksPortMessage) => {
      if (m.type === 'note') return;
      if (m.type === 'mark') return onMark(m.mark);
      done = true;
      port.disconnect();
      resolve(m.result);
    });
    port.onDisconnect.addListener(() => {
      if (!done) resolve({ ok: false, error: 'Language Weave stopped answering. Reload it in chrome://extensions.' });
    });
    port.postMessage(msg);
  });
}

/** A reading text over a port, so its lines show as they're written. */
function streamReading(msg: ReadingRequest, onLines: (lines: ReadingLine[]) => void): Promise<ResponseFor['reading']> {
  return new Promise((resolve) => {
    const port = browser.runtime.connect({ name: READING_PORT });
    let done = false;
    port.onMessage.addListener((m: ReadingPortMessage) => {
      if (m.type === 'lines') return onLines(m.lines);
      done = true;
      port.disconnect();
      resolve(m.result);
    });
    // A background from before the port existed (rebuilt, not reloaded) drops it unanswered.
    port.onDisconnect.addListener(() => {
      if (!done) resolve({ ok: false, error: 'Language Weave stopped answering. Reload it in chrome://extensions.' });
    });
    port.postMessage(msg);
  });
}

const EXTRA_ID = 'extra';
const extraCategory = (lang: LanguageConfig) => ({ id: EXTRA_ID, label: `Extra (general ${lang.displayName})` });
const GENERAL = { id: 'general', label: 'Woven words' };

/**
 * Page state lives on the content script's global, not in module scope: the
 * script is injected again on every weave, and each injection gets fresh
 * modules but the same isolated world.
 */
interface PageState {
  status: PageVocabSnapshot['status'];
  /** False when only the lesson widget is open. */
  weaving: boolean;
  /** Segments waiting on the model now. */
  pending: number;
  picking: boolean;
  /** Segments not sent yet because they haven't come near the screen. */
  queued: number;
  observer?: IntersectionObserver;
  /** Watches for text the page shows after the weave began. */
  live?: LiveText;
  /** Bumped by Restore so responses for an older weave are dropped. */
  generation: number;
  /** The weave lesson. */
  weave: string;
  density: number;
  totalWords: number;
  categories: Array<{ id: string; label: string }>;
  vocab: PageVocab;
  model: string;
  estimate: PageEstimate | null;
  spentUsd: number | null;
  /** Starts a planned weave that is waiting for cost confirmation. */
  confirm?: () => void;
  /** The widget's reading texts, while a lesson weaves. */
  reading?: Reading;
  /** The passage widget, in either mode. */
  passage?: PassageWidget;
  /** The buttons (🔊, EN, ☆, ✓) beside a woven word under the pointer. */
  wordButton?: WordButton;
  /** The reader's words in the page's language (`src/vocab/`): kept across a restore, so weaving again doesn't count a page twice. */
  words?: WordTracker;
  /** Lesson mode's marks on the page, and the popup a click on one opens. */
  marks?: Marker;
  /** The lesson the marks on the page are for. */
  marksLesson?: string;
  markPopup?: MarkPopup;
  /** One per language, so a word and a passage line never play at once. */
  speakers?: Map<string, Speaker>;
  /** The settings the page's words were woven with: switching mode with the same ones keeps them. */
  weaveKey?: string;
  /** Opens the page-mode passage for the words already woven. */
  startPagePassage?: (level: Level) => PassageWidget;
  /** Lesson mode: the lesson the widget shows, the shared state it last saved or showed, and a save not sent yet. */
  lessonId?: string;
  lessonRev?: string;
  lessonUnsaved?: boolean;
  saveTimer?: ReturnType<typeof setTimeout>;
  /** Comparing a shared state with what's shown, so only one runs at a time. */
  following?: boolean;
  /** Text size last picked, which the mark popup follows. */
  textScale: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __tissage: PageState | undefined;
  // eslint-disable-next-line no-var
  var __tissageRun: TissageRun | undefined;
}

const STYLE_ID = 'tissage-style';
const FLASH_CLASS = `${WOVEN_CLASS}--flash`;

const STYLES = `
.${WOVEN_CLASS} {
  cursor: pointer;
  text-decoration: underline dotted 1px;
  text-underline-offset: 0.2em;
}
.${WOVEN_CLASS} > .${FR_CLASS}[hidden], .${WOVEN_CLASS} > .${EN_CLASS}[hidden] { display: none !important; }
@keyframes tissage-flash { from { background-color: rgb(253 224 71 / 0.9); } to { background-color: transparent; } }
.${FLASH_CLASS} { animation: tissage-flash 1.6s ease-out; border-radius: 2px; }
${MARK_STYLES}
${scriptStyles(false)}`;

function snapshot(state: PageState): PageVocabSnapshot {
  return {
    status: state.status,
    weaving: state.weaving,
    pending: state.pending,
    picking: state.picking,
    queued: state.queued,
    weave: state.weave,
    categories: state.categories,
    density: state.density,
    totalWords: state.totalWords,
    wovenWords: state.vocab.wovenWords,
    items: state.vocab.list(),
    model: state.model,
    estimate: state.estimate,
    spentUsd: state.spentUsd,
    marked: Boolean(state.marks),
  };
}

function flash(el: HTMLElement) {
  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  el.classList.remove(FLASH_CLASS);
  void el.offsetWidth; // restart the animation
  el.classList.add(FLASH_CLASS);
  el.addEventListener('animationend', () => el.classList.remove(FLASH_CLASS), { once: true });
}

/** Takes lesson mode's marks off the page. */
function stopMarking(state: PageState) {
  state.marks?.stop();
  state.marks = undefined;
  state.marksLesson = undefined;
  state.markPopup?.stop();
  state.markPopup = undefined;
  removeMarks(document);
}

/** Flips a woven word between its language and English; to English is a peek. */
function flipWord(state: PageState, wrapper: HTMLElement) {
  toggleSource(wrapper);
  if (wrapper.classList.contains(SHOW_SOURCE_CLASS)) state.words?.peeked(wrapper);
}

/** The reader's words in `lang`, one tracker a page per language. */
function wordsFor(state: PageState, lang: LanguageConfig): WordTracker {
  if (state.words?.lang.code !== lang.code) {
    state.words?.stop();
    state.words = new WordTracker(lang);
  }
  return state.words;
}

/** The widget's Words tab (`src/vocab/wordsTab.ts`): the page's copy of the reader's words, and their definitions. */
function wordsTabFor(tracker: WordTracker, level: Level): NonNullable<PassageDeps['words']> {
  const lang = tracker.lang.code;
  return {
    lang,
    load: () => tracker.current(),
    record: (events) => tracker.record(events),
    define: (words) => send({ type: 'define-words', buildId: BUILD_ID, lang, level, words }),
  };
}

/** Puts the page's English back; the widget stays. */
function unweave(state: PageState) {
  state.live?.stop();
  state.live = undefined;
  restoreAll(document);
  state.reading?.stop();
  state.reading = undefined;
  state.wordButton?.stop();
  state.wordButton = undefined;
  state.vocab.clear();
  state.generation++;
  state.weaving = false;
  state.categories = [];
  state.pending = 0;
  state.picking = false;
  state.queued = 0;
  state.observer?.disconnect();
  state.observer = undefined;
  state.totalWords = 0;
  state.estimate = null;
  state.spentUsd = 0;
  state.confirm = undefined;
  state.weaveKey = undefined;
  state.startPagePassage = undefined;
}

/** Puts the page's English back and closes the widgets; lesson mode's is closed in every tab. */
function restore(state: PageState) {
  unweave(state);
  if (state.lessonId) saveLesson(state, false);
  closeLesson(state);
  state.passage?.stop();
  state.passage = undefined;
  stopMarking(state);
  removeWidget(document);
  state.status = 'idle';
}

/** Styles and listeners survive re-injection, so they're installed once per page. */
function install(lang: LanguageConfig): PageState {
  if (globalThis.__tissage) return globalThis.__tissage;

  const state: PageState = {
    status: 'idle',
    weaving: false,
    pending: 0,
    picking: false,
    queued: 0,
    generation: 0,
    weave: 'none',
    density: 0,
    totalWords: 0,
    categories: [],
    vocab: new PageVocab(lang),
    model: '',
    estimate: null,
    spentUsd: 0,
    textScale: 1,
  };
  globalThis.__tissage = state;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = STYLES;
  document.head.append(style);

  document.addEventListener(
    'click',
    (e) => {
      const wrapper = (e.target as Element | null)?.closest?.(`.${WOVEN_CLASS}`);
      if (!wrapper) return;
      // Woven text inside a link is flipped instead of navigating.
      e.preventDefault();
      e.stopPropagation();
      // To its English and back (🔊 on its buttons reads it aloud).
      flipWord(state, wrapper as HTMLElement);
    },
    true,
  );

  browser.runtime.onMessage.addListener((msg: TabRequest, _sender, sendResponse) => {
    const reply = <K extends TabRequest['type']>(value: TabResponseFor[K]) => sendResponse(value);
    switch (msg.type) {
      case 'page-vocab':
        reply<'page-vocab'>(snapshot(state));
        return;
      case 'confirm-weave':
        state.confirm?.();
        reply<'confirm-weave'>(null);
        return;
      case 'restore':
        restore(state);
        reply<'restore'>(null);
        return;
      case 'unmark':
        stopMarking(state);
        reply<'unmark'>(null);
        return;
      case 'unweave':
        unweave(state);
        state.status = 'done';
        reply<'unweave'>(null);
        return;
      case 'reveal': {
        const el = state.vocab.next(msg.key);
        if (el) flash(el);
        reply<'reveal'>(Boolean(el));
        return;
      }
      case 'vocab-set': {
        const el = state.vocab.element(msg.key);
        if (el) state.words?.set(el, msg.status);
        reply<'vocab-set'>(Boolean(el && state.words));
        return;
      }
    }
  });

  // Lesson mode's widget is shared by every tab: what changed here is saved as the reader leaves,
  // and what changed elsewhere is shown on coming back (closed elsewhere, it closes here).
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (state.lessonUnsaved) saveLesson(state);
    } else if (state.lessonId) void followLesson();
  });

  return state;
}

// ---- Lesson mode's widget, the same in every tab ----

/** How long after a change the widget's state is saved for the other tabs; leaving the tab saves at once. */
const SAVE_MS = 150;

function saveLesson(state: PageState, open = true) {
  clearTimeout(state.saveTimer);
  state.lessonUnsaved = false;
  if (!state.passage || !state.lessonId) return;
  const shared: LessonState = { rev: newRev(), open, lessonId: state.lessonId, widget: state.passage.state() };
  state.lessonRev = shared.rev;
  void send({ type: 'set-lesson-state', buildId: BUILD_ID, state: encodeLessonState(shared) });
}

function lessonChanged(state: PageState) {
  // Only the tab the reader is in saves: a hidden one finishing a request mustn't overwrite what they're doing.
  if (document.visibilityState !== 'visible') return;
  state.lessonUnsaved = true;
  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(() => saveLesson(state), SAVE_MS);
}

async function loadLesson(): Promise<LessonState | null> {
  const res = await send({ type: 'get-lesson-state', buildId: BUILD_ID });
  return res.ok && res.value ? decodeLessonState(res.value) : null;
}

/** Takes lesson mode's widget off this page (marks stay until "Remove marks" or Restore). */
function closeLesson(state: PageState) {
  if (!state.lessonId) return;
  clearTimeout(state.saveTimer);
  state.lessonId = undefined;
  state.lessonRev = undefined;
  state.lessonUnsaved = false;
  state.passage?.stop();
  state.passage = undefined;
}

/**
 * One speaker per language, kept on the page, so a word and a passage line never play at once. A
 * language without a voice gets one that reads only its locally recorded words (`src/recordings.ts`).
 */
function speechFor(state: PageState, canSpeak: boolean, lang: string): Speaker | undefined {
  const recordedOnly = getLanguage(lang).noVoice;
  if (!canSpeak && !recordedOnly) return undefined;
  const speakers = (state.speakers ??= new Map<string, Speaker>());
  let speaker = speakers.get(lang);
  if (!speaker) {
    // Empty until the list arrives, so a button asked for before then doesn't show.
    const recorded = new Set<string>();
    if (recordedOnly)
      void send({ type: 'recorded-words', buildId: BUILD_ID, lang }).then((res) => res.ok && res.value.forEach((w) => recorded.add(w)));
    speaker = createSpeaker({
      fetch: (text, slow) => send({ type: 'speak', buildId: BUILD_ID, lang, text, slow }),
      onSpend: (usd) => addSpend(state, usd),
      can: recordedOnly ? (text) => recorded.has(recordingKey(text)) : undefined,
    });
    speakers.set(lang, speaker);
  }
  return speaker;
}

/** The microphone for speaking exercises, when the reader turned them on; `lang` is the sentence's language. */
function listenerFor(canListen: boolean, lang: string): Listener | undefined {
  if (!canListen || getLanguage(lang).notHeard) return undefined;
  return {
    start: () => send({ type: 'listen-start', buildId: BUILD_ID }),
    stop: (expected) => send({ type: 'listen-stop', buildId: BUILD_ID, lang, expected }),
    cancel: () => void send({ type: 'listen-cancel', buildId: BUILD_ID }),
  };
}

/**
 * Shows the language's script and romanisation as the reader last picked, or as suits the level: the
 * lesson's in lesson mode, the reader's in page mode. Woven words, marks and the widget all follow it.
 */
function showScript(config: WeaveConfig): ScriptView | undefined {
  const level = (config.mode === 'lesson' ? syllabusFor(config)?.level : undefined) ?? config.level;
  const view = scriptViewFor(getLanguage(config.language), level, config.scriptViews);
  if (view) document.documentElement.setAttribute(SCRIPT_ATTR, view);
  else document.documentElement.removeAttribute(SCRIPT_ATTR);
  return view;
}

/**
 * Wherever the reader last dragged the widget, on any page, the text size last picked there (the
 * mark popup follows it), and the switch between the script and its romanisation.
 */
function placementFor(state: PageState, config: WeaveConfig) {
  state.textScale = config.textScale;
  const lang = getLanguage(config.language);
  const view = showScript(config);
  return {
    script: view &&
      lang.romanSample && {
        view,
        sample: lang.romanSample,
        onChange: (next: ScriptView) => {
          config.scriptViews = { ...config.scriptViews, [lang.code]: next };
          document.documentElement.setAttribute(SCRIPT_ATTR, next);
          void send({ type: 'set-script-view', language: lang.code, view: next });
        },
      },
    position: config.widgetPosition,
    onMove: (position: WidgetPosition | null) => void send({ type: 'set-widget-position', position }),
    size: config.widgetSize,
    onResize: (size: WidgetSize | null) => void send({ type: 'set-widget-size', size }),
    textScale: config.textScale,
    onTextScale: (scale: number) => {
      state.textScale = scale;
      void send({ type: 'set-text-scale', scale });
    },
  };
}

/**
 * Lesson mode's widget: a scene on the lesson's theme, the same on any page. With `shared` (this
 * lesson's, from another tab) it opens as the reader left it there; otherwise it starts afresh.
 */
function openLesson(state: PageState, config: WeaveConfig, syllabus: SyllabusLesson, shared: LessonState | null) {
  if (!config.hasKey) return;
  const saved = shared?.lessonId === syllabus.id ? shared : undefined;
  closeLesson(state);
  const speech = speechFor(state, config.canSpeak, syllabus.lang);
  const ledger = practiceLedger(syllabus.lang);
  const words = wordsFor(state, getLanguage(syllabus.lang));
  // The kit's glosses, so a word first met in practice has one in the reader's words.
  let glosses: Record<string, string> = {};
  // The lesson's words in its textbook and kit, by lemma: one read aloud in the widget is added to the reader's words.
  const lessonWords = new Map<string, string>();
  const learn = (word: string, english: string) => lessonWords.set(normalizeLemma(word), english);
  state.passage = startPassage({
    doc: document,
    mode: 'lesson',
    title: syllabus.title,
    request: ({ formatId }, onNote, onPiece) =>
      streamPassage({ type: 'passage', buildId: BUILD_ID, mode: 'lesson', formatId, lessonId: syllabus.id }, onNote, onPiece),
    textbook: () =>
      send({ type: 'textbook', buildId: BUILD_ID, lessonId: syllabus.id }).then((res) => {
        if (res.ok) for (const s of res.value.textbook.sections) for (const w of s.words) learn(w.word, w.english);
        return res;
      }),
    practice: {
      level: syllabus.level,
      lang: syllabus.lang,
      request: (plan, like) =>
        send({ type: 'practice', buildId: BUILD_ID, mode: 'lesson', lessonId: syllabus.id, exercise: plan.type, point: plan.point, words: plan.words, setting: like?.setting, like: like?.step }),
      lesson: {
        plan: () =>
          send({ type: 'practice-lesson', buildId: BUILD_ID, lessonId: syllabus.id }).then((res) => {
            if (res.ok) {
              glosses = res.value.glosses;
              for (const [w, g] of Object.entries(glosses)) learn(w, g);
            }
            return res;
          }),
        coverage: lessonCoverage(syllabus.id),
        record: (plan, right) => {
          void ledger.record(syllabus.id, plan, right);
          words.answered(plan.words, right, glosses);
        },
      },
      drills: drillsFor(syllabus),
      hint: (step) => send({ type: 'practice-hint', buildId: BUILD_ID, lang: syllabus.lang, level: syllabus.level, step }),
      listen: listenerFor(config.canListen, syllabus.lang),
    },
    onSpend: (usd) => addSpend(state, usd),
    speech,
    onWordSaid: (word) => words.listenedTo(word, lessonWords.get(normalizeLemma(word))),
    words: wordsTabFor(words, config.level),
    saved: saved?.widget,
    onChange: () => lessonChanged(state),
    // Closed here, closed in every tab.
    onClose: () => {
      saveLesson(state, false);
      closeLesson(state);
    },
    ...placementFor(state, config),
  });
  state.lessonId = syllabus.id;
  state.lessonRev = saved?.rev;
  state.passage.ready();
}

/** The syllabus lesson lesson mode teaches: the one picked (the course's or the reader's), or the language's first. */
const syllabusFor = (config: WeaveConfig) => config.lesson;

/**
 * The reader is on this tab: lesson mode's widget, if it's open, as they
 * left it in the last tab. Never weaves or marks.
 */
async function followLesson() {
  const state = globalThis.__tissage;
  if (state?.following) return;
  if (state) state.following = true;
  try {
    const config = await send({ type: 'weave-config', buildId: BUILD_ID });
    if (!config.ok || config.value.mode !== 'lesson') return;
    const shared = await loadLesson();
    const syllabus = syllabusFor(config.value);
    if (!syllabus || !shared?.open || shared.lessonId !== syllabus.id) {
      if (state) closeLesson(state);
      return;
    }
    const lang = getLanguage(config.value.language);
    const page = install(lang);
    if (page.passage && page.lessonId === syllabus.id && page.lessonRev === shared.rev) return;
    showScript(config.value);
    if (page.status === 'idle') {
      page.status = 'done';
      page.weaving = false;
      page.estimate = null;
    }
    openLesson(page, config.value, syllabus, shared);
  } finally {
    if (state) state.following = false;
  }
}

interface WeaveContext {
  state: PageState;
  generation: number;
  lang: LanguageConfig;
  /** The lesson as chosen in the popup. */
  lessonId: string;
  /** The lesson with the page words added, when there are any. */
  lesson?: Lesson;
  pageWords?: PageWord[];
  level: Level;
  carry: DensityCarry;
  effort: Effort;
  thinks: boolean;
  debug: boolean;
}

function addSpend(state: PageState, usd: number | null) {
  state.spentUsd = usd === null || state.spentUsd === null ? null : state.spentUsd + usd;
}

async function weaveSegment(seg: Segment, plan: SegmentPlan, ctx: WeaveContext) {
  const { lesson, state } = ctx;
  const replacements: Replacement[] = [...plan.local];
  const rejected: Rejection[] = [];
  const estimateFor = (r: PlannedRequest) =>
    estimateRequest(systemFor(ctx.lang, lesson, r), r.user, r.lines, ctx.effort, ctx.thinks);
  const lessonRequest = plan.requests.find((r) => r.kind === 'lesson');
  const generalRequest = plan.requests.find((r) => r.kind === 'general');
  const needsModel = plan.requests.length > 0;
  if (needsModel) state.pending++;
  // Earlier segments' shortfall, asked for here on top of this segment's own top-up, or its general weave.
  const carried = plan.canCarry ? ctx.carry.take(carryLimit(countWords(seg.text))) : 0;
  const toTopUp = Boolean(lessonRequest?.vocabulary);
  const topUpWords = plan.topUpWords + (toTopUp ? carried : 0);
  const generalBudget = plan.generalBudget + (toTopUp ? 0 : carried);
  const planned =
    plan.local.reduce((n, r) => n + r.words, 0) + plan.remote.reduce((n, c) => n + c.words, 0) + topUpWords + generalBudget;

  try {
    // The lesson's words and its top-up (one response, or a general request beside it) go out together.
    const [lessonRes, generalRes] = await Promise.all([
      lesson && lessonRequest
        ? send({
            type: 'weave-lesson',
            text: seg.text,
            lessonId: ctx.lessonId,
            candidates: plan.remote,
            topUpWords,
            taken: plan.local.map((r) => r.original),
            vocabulary: lessonRequest.vocabulary,
            pageWords: ctx.pageWords,
            level: ctx.level,
            estimate: estimateFor(lessonRequest),
          })
        : undefined,
      generalRequest
        ? send({
            type: 'weave-segment',
            text: seg.text,
            budget: generalBudget,
            levelNote: generalRequest.levelNote,
            estimate: estimateFor(generalRequest),
          })
        : undefined,
    ]);

    if (lesson && lessonRes) {
      const res = lessonRes;
      if (res.ok) {
        addSpend(state, res.value.usd);
        const matched = matchLessonResponse(lesson, seg.text, res.value.lines, plan.remote, plan.local, topUpWords);
        replacements.push(...matched.accepted);
        rejected.push(...matched.rejected);
      } else if (ctx.debug) console.warn('[tissage] lesson segment failed:', res.error);
    }

    if (generalRes) {
      const res = generalRes;
      if (res.ok) {
        addSpend(state, res.value.usd);
        const level = aboveBeginner(res.value.lines, ctx.level, ctx.lang.code);
        rejected.push(...level.rejected);
        const selected = selectReplacements(seg.text, level.kept, {
          budget: generalBudget,
          taken: replacements,
          category: lesson ? EXTRA_ID : GENERAL.id,
        });
        replacements.push(...selected.accepted);
        rejected.push(...selected.rejected);
      } else if (ctx.debug) console.warn('[tissage] segment failed:', res.error);
    }

    if (state.generation !== ctx.generation) return; // restored while waiting
    if (needsModel) ctx.carry.settle(planned, replacements.reduce((n, r) => n + r.words, 0));
    const write = () => applyReplacements(seg, replacements, ctx.lang);
    const written = state.live?.ours(write) ?? write();
    state.vocab.add(written, lesson ? EXTRA_ID : GENERAL.id);
    state.words?.woven(written);
    state.reading?.onWoven();
    if (ctx.debug && rejected.length) {
      console.debug('[tissage] rejected', rejected.map((r) => `${r.reason}: ${r.line.original} → ${r.line.replacement}`));
    }
  } finally {
    if (needsModel && state.generation === ctx.generation) state.pending--;
  }
}

/**
 * Sends segments to the model as their paragraphs come within half a screen
 * of view: what's on screen goes out together first, the rest as the reader
 * scrolls. Segments that need no model are written straight away.
 */
/** How far below the screen to start weaving, in screen heights. */
const LOOKAHEAD = 0.5;

interface WeaveSession {
  /** More segments to weave as they come near the screen, with their plans. */
  add(segments: Segment[], plans: SegmentPlan[]): void;
  /** The page took these away: the ones not sent yet never are. */
  forget(segments: Segment[]): void;
}

function weaveAsYouScroll(ctx: WeaveContext, onDone: () => void): WeaveSession {
  const { state } = ctx;
  const byBlock = new Map<Element, Array<{ seg: Segment; plan: SegmentPlan }>>();
  let running = 0;
  const checkDone = () => {
    // Blocks that aren't rendered (inside a collapsed or hidden section)
    // still weave if they appear, but don't hold up "done".
    const waiting = [...byBlock.keys()].some((b) => b.getClientRects().length > 0);
    if (state.generation === ctx.generation && state.pending === 0 && running === 0 && !waiting) onDone();
  };
  const run = (seg: Segment, plan: SegmentPlan) => {
    running++;
    void weaveSegment(seg, plan, ctx).finally(() => {
      running--;
      checkDone();
    });
  };

  const start = (block: Element) => {
    const items = byBlock.get(block);
    if (!items) return;
    byBlock.delete(block);
    observer.unobserve(block);
    state.queued -= items.length;
    for (const { seg, plan } of items) run(seg, plan);
  };
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) if (entry.isIntersecting) start(entry.target);
    },
    { rootMargin: `0px 0px ${LOOKAHEAD * 100}% 0px` },
  );
  state.observer?.disconnect();
  state.observer = observer;

  return {
    add(segments, plans) {
      const fresh: Element[] = [];
      segments.forEach((seg, i) => {
        const plan = plans[i]!;
        if (plan.requests.length === 0) return run(seg, plan);
        const items = byBlock.get(seg.block);
        if (items) items.push({ seg, plan });
        else {
          byBlock.set(seg.block, [{ seg, plan }]);
          fresh.push(seg.block);
        }
        state.queued++;
      });
      if (fresh.length && state.status === 'done') state.status = 'weaving';
      for (const block of fresh) observer.observe(block);
      // The observer's first report waits for the page to redraw; what's on
      // screen now goes out immediately instead.
      for (const block of fresh) if (onScreen(block, LOOKAHEAD)) start(block);
      if (running === 0) checkDone();
    },
    forget(segments) {
      for (const seg of segments) {
        const items = byBlock.get(seg.block);
        if (!items) continue;
        const kept = items.filter((item) => item.seg !== seg);
        state.queued -= items.length - kept.length;
        if (kept.length) byBlock.set(seg.block, kept);
        else {
          byBlock.delete(seg.block);
          observer.unobserve(seg.block);
        }
      }
    },
  };
}

/** How long after the page first changes its new text is read: a page loading more changes many times at once. */
const LIVE_SETTLE_MS = 1000;

interface LiveText {
  /** Runs one of Language Weave's own writes to the page, which isn't the page changing. */
  ours<T>(write: () => T): T;
  stop(): void;
}

/**
 * Calls `onChange` when the page shows text after the weave began (more loaded
 * as the reader goes, pages turned, text drawn again), at most once per
 * `LIVE_SETTLE_MS`, so a page that keeps changing is read once a second.
 */
function watchText(root: Element, onChange: () => void): LiveText {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const own = `.${WOVEN_CLASS}, .${GLOSS_CLASS}`;
  const hasText = (node: Node) => (node.textContent?.trim().length ?? 0) >= MIN_SEGMENT;
  // Only changes that can bring text: not a clock ticking, a progress bar's width or a woven word clicked.
  const counts = (r: MutationRecord) => {
    const target = r.target instanceof Element ? r.target : r.target.parentElement;
    if (!target || target.closest(own)) return false;
    if (r.type === 'childList') return [...r.addedNodes, ...r.removedNodes].some(hasText);
    return hasText(r.target);
  };
  const seen = (records: MutationRecord[]) => {
    if (timer !== undefined || !records.some(counts)) return;
    timer = setTimeout(() => {
      timer = undefined;
      onChange();
    }, LIVE_SETTLE_MS);
  };
  const observer = new MutationObserver(seen);
  observer.observe(root, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['class', 'style', 'hidden', 'open', 'aria-hidden'],
  });
  return {
    ours(write) {
      // The page's changes so far count; what the write changes doesn't.
      seen(observer.takeRecords());
      const out = write();
      observer.takeRecords();
      return out;
    },
    stop() {
      observer.disconnect();
      clearTimeout(timer);
    },
  };
}

/** The page's title; a frame with none (an ebook reader's) is named by its first heading. */
const pageTitle = () => document.title || document.querySelector('h1')?.textContent?.trim() || '';

/** What the page-word picker reads: the title, section headings and the paragraphs near the screen, not the whole page. */
function pickInput(root: Element, segments: Segment[]) {
  return { title: pageTitle(), headings: headings(root), passages: onScreenText(segments, LOOKAHEAD) };
}

async function weavePage() {
  const asked = globalThis.__tissageRun ?? {};
  globalThis.__tissageRun = undefined;
  if (asked.follow) return followLesson();
  const force = asked.force ?? true;

  // Nothing on the page changes until the background has answered with a config this build understands.
  const config = await send({ type: 'weave-config', buildId: BUILD_ID });
  if (!config.ok) {
    console.warn(`[tissage] ${config.error}`);
    return;
  }
  const { language, mode, level, weave: weaveId, topUp, weavePage, hasKey, canSpeak, canListen, model, effort, thinks, confirmAboveUsd, readingFormat, calibration, debug } =
    config.value;
  const lang = getLanguage(language);
  const state = install(lang);
  // Lesson mode weaves or marks a page only when the popup's buttons ask; a page woven that way stays woven.
  const weaves = mode === 'page' || Boolean(asked.weave) || state.weaving;
  const weaveKey = JSON.stringify([language, weaveId, config.value.density, topUp, level, hasKey, model, effort, thinks, weavePage]);
  // Page mode without the weave: the page's words are still picked for the widget, but nothing on the page changes.
  const wordsOnly = mode === 'page' && !weavePage && !asked.weave;
  // Woven with these settings already (only the mode changed): keep the words, swap the widget.
  const keepsWords = weaves && state.weaving && (state.status === 'weaving' || state.status === 'done') && state.weaveKey === weaveKey;
  if (!keepsWords) {
    if (state.status === 'weaving') return;
    if (state.status === 'confirm') {
      if (force) state.confirm?.();
      return;
    }
  }
  // The language changed since this page was last woven; restoring cleared its words.
  if (state.status === 'idle' && state.vocab.lang.code !== lang.code) state.vocab = new PageVocab(lang);

  const speech = (code: string) => speechFor(state, canSpeak, code);
  const placement = placementFor(state, config.value);

  // Lesson mode: a scene on the lesson's theme, the same on any page, so it needs nothing from the page.
  const syllabus = mode === 'lesson' ? syllabusFor(config.value) : undefined;
  // The widget as the reader left it in another tab; already open here, it stays as it is.
  const startLesson = async () => {
    if (!syllabus) return;
    if (!(state.passage && state.lessonId === syllabus.id)) {
      openLesson(state, config.value, syllabus, await loadLesson());
      saveLesson(state);
    }
    if (asked.mark) startMarking(syllabus);
  };
  // Lesson mode: the English on screen marked where the lesson applies, chunk by chunk as the reader scrolls.
  const startMarking = (lesson: SyllabusLesson) => {
    // Another lesson or language: its marks come off before this one's go on.
    if (state.marks && state.marksLesson !== lesson.id) stopMarking(state);
    if (state.marks) return;
    state.marksLesson = lesson.id;
    const { root, segments } = findPageText(document);
    const speaker = speech(lesson.lang);
    state.markPopup = showMarkPopup(document, speaker && ((text) => speaker.play([text], () => {}, (error) => console.warn(`[tissage] ${error}`), true)), () => state.textScale, speaker?.can);
    state.marks = startMarks({
      doc: document,
      lang: getLanguage(lesson.lang),
      chunks: sectionChunks(root, segments),
      onScreen: (el) => onScreen(el),
      request: (chunk, onMark) =>
        streamMarks(
          { type: 'marks', buildId: BUILD_ID, lessonId: lesson.id, title: pageTitle(), heading: chunk.heading, paragraphs: chunk.paras.map((p) => p.text) },
          onMark,
        ),
      onSpend: (usd) => addSpend(state, usd),
      onError: (error) => console.warn(`[tissage] marks: ${error}`),
    });
  };
  if (keepsWords) {
    if (syllabus) void startLesson();
    else {
      stopMarking(state);
      const passage = state.startPagePassage?.(level);
      // Still picking: the passage starts once the page's words are in.
      if (!state.picking) passage?.ready();
    }
    return;
  }
  state.weaving = weaves;
  if (!state.weaving) {
    state.status = 'done';
    state.categories = [];
    state.estimate = null;
    void startLesson();
    return;
  }

  const chosen = getLesson(weaveId, lang);
  const lesson = chosen && forLevel(chosen, level);
  const density = lesson?.density ?? config.value.density;
  state.weave = lesson?.id ?? 'none';
  state.density = density;
  // Easy words come with the lesson; page words, if any, after the pick.
  const parts = lesson ? withExtras(lesson) : undefined;
  const categoriesFor = (p: LessonParts) =>
    [...lesson!.categories, ...(p.page ? [PAGE_CATEGORY] : []), ...(p.easy ? [EASY_CATEGORY] : []), extraCategory(lang)];
  state.categories = parts ? categoriesFor(parts) : [GENERAL];
  state.model = model;

  // Grows as the page shows more text, and drops what it takes away; kept in page order.
  const { root, loose, segments } = findPageText(document);
  for (const seg of segments) seg.block.setAttribute(BLOCK_ATTR, '');
  state.totalWords += segments.reduce((n, s) => n + countWords(s.text), 0);

  const picks = Boolean(lesson?.pickPageWords) && hasKey && segments.length > 0;
  const pickRequest = () => {
    const user = buildPickPrompt({ ...pickInput(root, segments), exclude: [...(lesson?.teaches ?? [])], level });
    return { system: buildPickSystemPrompt(lang), user, lines: PAGE_WORD_TARGET };
  };
  // Planned without page words; with them, each segment still makes one request.
  let planFor = (segs: Segment[]) => planPage(segs, { density, lesson, easyWords: parts?.easy, topUp, level, hasKey });
  const plans = wordsOnly ? [] : planFor(segments);
  const estimate = estimatePlan(plans, { lang, lesson, model, effort, thinks, calibration, extra: picks ? [pickRequest()] : [] });
  state.estimate = estimate;

  const ctx: WeaveContext = {
    state,
    generation: state.generation,
    lang,
    lessonId: state.weave,
    lesson: parts?.lesson,
    level,
    carry: new DensityCarry(),
    effort,
    thinks,
    debug,
  };

  const weave = (plansToUse: SegmentPlan[]) => {
    if (wordsOnly) {
      state.status = 'done';
      return;
    }
    const session = weaveAsYouScroll(ctx, () => {
      state.status = 'done';
      if (debug) {
        console.debug(
          `[tissage] ${segments.length} segments, ${state.totalWords} words, ${state.vocab.wovenWords} woven, ` +
            `estimated $${estimate.usd?.toFixed(4) ?? '?'}, spent $${state.spentUsd?.toFixed(4) ?? '?'}`,
        );
      }
    });
    session.add(segments, plansToUse);
    // Text the page shows later (loaded as the reader goes, pages turned, drawn again) is woven the same way.
    const refresh = () => {
      if (state.generation !== ctx.generation) return;
      const gone = new Set(segments.filter(isGone));
      session.forget([...gone]);
      // A block drawn again with other text is read again.
      for (const seg of gone) if (seg.block.isConnected && !segments.some((s) => s.block === seg.block && !gone.has(s))) seg.block.removeAttribute(BLOCK_ATTR);
      const fresh = collectSegments(root, { loose });
      if (!gone.size && !fresh.length) return;
      for (const seg of fresh) seg.block.setAttribute(BLOCK_ATTR, '');
      const kept = [...segments.filter((s) => !gone.has(s)), ...fresh].sort(inPageOrder);
      segments.splice(0, segments.length, ...kept);
      state.totalWords += fresh.reduce((n, s) => n + countWords(s.text), 0);
      if (debug) console.debug(`[tissage] page changed: ${fresh.length} segments new, ${gone.size} gone`);
      session.add(fresh, planFor(fresh));
      state.passage?.refocus();
    };
    state.live?.stop();
    state.live = watchText(root, refresh);
    // What came while the page's words were picked.
    refresh();
  };

  // The passage uses the page's words, so it starts once they're picked (or aren't coming).
  const pageReady = () => {
    state.reading?.ready();
    state.passage?.ready();
  };

  const run = async () => {
    state.confirm = undefined;
    state.status = 'weaving';
    const wordSpeaker = speech(lang.code);
    const tracker = wordsFor(state, lang);
    state.wordButton?.stop();
    state.wordButton = showWordButton(document, {
      // Fetched when 🔊 is clicked, about $0.0002 a word, and kept for the page, so clicking again is free.
      say: wordSpeaker && ((el) => {
        tracker.listened(el);
        wordSpeaker.play([wordText(el)], () => {}, (error) => console.warn(`[tissage] ${error}`), true);
      }),
      canSay: (el) => {
        const text = wordText(el);
        return !!text && (!wordSpeaker?.can || wordSpeaker.can(text));
      },
      status: (el) => tracker.status(el),
      set: (el, status) => tracker.set(el, status),
    });
    state.weaveKey = weaveKey;
    // Page mode: a piece about the section on screen, with the page's words, once they're picked.
    // Kept on the page so switching from lesson mode can open it without weaving again.
    // Read when asked: the page's sections change as it shows more text.
    const sectionsNow = () => pageSections(root, segments);
    state.startPagePassage = !hasKey ? undefined : (level) => {
      closeLesson(state);
      state.passage?.stop();
      const sectionNow = () => sectionOnScreen(root, segments, (el) => onScreen(el));
      // Text highlighted in the article (not in the widget or the page's menus), and the section it's in.
      const highlighted = () => {
        const sel = document.getSelection();
        if (!sel || sel.isCollapsed || !sel.rangeCount) return undefined;
        const range = sel.getRangeAt(0);
        const text = root.contains(range.commonAncestorContainer) ? selectionText(sel.toString()) : '';
        return text ? { text, index: sectionOnScreen(root, segments, (el) => range.intersectsNode(el)) } : undefined;
      };
      // Page words when they were picked; otherwise what's been woven so far.
      const pageWords = () =>
        ctx.pageWords?.length
          ? ctx.pageWords.map((w) => ({ target: w.lemma, english: w.forms }))
          : state.vocab.list().map((i) => ({ target: i.french, english: i.english }));
      state.passage = startPassage({
        doc: document,
        mode: 'page',
        title: pageTitle().split(/ [-–—|] /)[0] || pageTitle(),
        focus: () => {
          const index = sectionNow();
          const section = sectionsNow()[index];
          // By its heading and first words: the same index can be another section once pages turn.
          return { index, heading: section?.heading ?? '', key: section && `${section.heading}\n${section.text.slice(0, 200)}` };
        },
        selection: highlighted,
        request: ({ focus, formatId, selection }, onNote, onPiece) => {
          const sections = sectionsNow();
          const about = selection ? withSelection(sections, focus, selection) : { sections, focus };
          const msg = { type: 'passage', buildId: BUILD_ID, mode: 'page', formatId, title: pageTitle(), ...about, level, pageWords: pageWords() } as const;
          return streamPassage(msg, onNote, onPiece);
        },
        practice: {
          level,
          lang: lang.code,
          focus: sectionNow,
          request: (plan, like) =>
            send({ type: 'practice', buildId: BUILD_ID, mode: 'page', exercise: plan.type, title: pageTitle(), sections: sectionsNow(), focus: plan.section ?? sectionNow(), level, pageWords: pageWords(), like: like?.step }),
          hint: (step) => send({ type: 'practice-hint', buildId: BUILD_ID, lang: lang.code, level, step }),
          listen: listenerFor(canListen, lang.code),
        },
        onSpend: (usd) => addSpend(state, usd),
        speech: speech(lang.code),
        onWordSaid: (word) => tracker.listenedTo(word),
        words: wordsTabFor(tracker, level),
        ...placement,
      });
      return state.passage;
    };
    if (syllabus) void startLesson();
    else state.startPagePassage?.(level);
    if (SHOW_READING_WIDGET && lesson && hasKey) {
      state.reading?.stop();
      state.reading = startReading(
        {
          doc: document,
          root,
          segments,
          lesson,
          lang,
          pageWords: () => ctx.pageWords,
          vocab: () => ({ items: state.vocab.list(), categories: state.categories }),
          request: (formatId, input, estimate, onLines) => {
            const msg = { type: 'reading', buildId: BUILD_ID, lessonId: lesson.id, pageWords: ctx.pageWords, formatId, input, estimate } as const;
            return onLines ? streamReading(msg, onLines) : send(msg);
          },
          estimate: (system, user, lines) =>
            estimateRequest(system, user, lines, READING_MODEL.effort, modelThinks(READING_MODEL.model, READING_MODEL.thinking)),
          saveFormat: (formatId) => void send({ type: 'set-reading-format', formatId }),
          onSpend: (usd) => addSpend(state, usd),
        },
        readingFormat,
      );
    }
    if (!picks) {
      pageReady();
      return weave(plans);
    }

    // Pick the page's words from its headings and what's on screen, then plan again with them.
    state.picking = true;
    const r = pickRequest();
    const res = await send({
      type: 'pick-page-words',
      ...pickInput(root, segments),
      exclude: [...(lesson?.teaches ?? [])],
      level,
      estimate: estimateRequest(r.system, r.user, r.lines, effort, thinks),
    });
    if (state.generation !== ctx.generation) return; // restored while waiting
    state.picking = false;
    if (res.ok) addSpend(state, res.value.usd);
    const words = res.ok ? fitToPage(res.value.words, segments.map((s) => s.text)) : [];
    if (words.length === 0) {
      if (debug) console.warn('[tissage] no page words:', res.ok ? 'none picked that occur on the page' : res.error);
      pageReady();
      return weave(plans);
    }
    if (debug) console.debug(`[tissage] page words: ${words.map((w) => `${w.forms.join('|')} → ${w.lemma}`).join(', ')}`);
    const withPage = withExtras(lesson!, words);
    ctx.pageWords = words;
    ctx.lesson = withPage.lesson;
    state.categories = categoriesFor(withPage);
    planFor = (segs) => planPage(segs, { density, lesson, pageWords: withPage.page, easyWords: withPage.easy, topUp, level, hasKey });
    weave(planFor(segments));
    pageReady();
  };

  // An unknown price can't be checked against the limit, so it asks too.
  const overLimit = estimate.requests > 0 && (estimate.usd === null || estimate.usd > confirmAboveUsd);
  if (overLimit && !force) {
    state.status = 'confirm';
    state.confirm = () => void run();
    return;
  }
  void run();
}

export default defineContentScript({
  registration: 'runtime',
  main() {
    void weavePage();
  },
});
