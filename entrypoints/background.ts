import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';
import { BUILD_ID, STALE_BUILD_ERROR } from '@/src/build';
import { addSpend, addToCalibration, dayKey, estimateRequest, SPEND_KEY, type DailySpend, priceFor, usageCost, type Calibration, type RequestEstimate, type TokenUsage } from '@/src/cost';
import { getLanguage, languageNamed } from '@/src/languages';
import { pickFrame } from '@/src/frames';
import { decodeLessonState } from '@/src/lessonState';
import { getLesson, type Lesson } from '@/src/lessons';
import { createLimiter } from '@/src/limit';
import {
  MARKS_PORT,
  PASSAGE_PORT,
  READING_PORT,
  type MarksPortMessage,
  type MarksRequest,
  type PassagePortMessage,
  type PassageRequest,
  type ReadingPortMessage,
  type ReadingRequest,
  type Request,
  type ResponseFor,
  type TissageRun,
  type WeaveResult,
} from '@/src/messages';
import { grammarFor } from '@/src/grammar';
import { CHECK_MODEL, CHECK_SYSTEM, LENIENT_CHECK_MODEL } from '@/src/marks/check';
import { askJev, jevProbability, JEV_MODEL } from '@/src/marks/jev';
import { MARK_MODEL, MARK_SYSTEM, maxMarks, type MarkJob } from '@/src/marks/prompt';
import { markSection, type ShownMark } from '@/src/marks/stream';
import { buildKitPrompt, KIT_MODEL, KIT_SCHEMA, KIT_SYSTEM, kitCacheKey, KIT_VERSION, parseKit, type Kit } from '@/src/passage/kit';
import { cleanPiece, wholeIssues } from '@/src/passage/checks';
import { sectionContext } from '@/src/passage/context';
import { PASSAGE_MODEL, writePiece, type Complete, type Piece, type PieceJob } from '@/src/passage/piece';
import {
  buildPracticePrompt,
  choosePagePractice,
  choosePractice,
  parsePractice,
  PRACTICE_MODEL,
  PRACTICE_SYSTEM,
  PRACTICE_VERSION,
  type PracticeInput,
} from '@/src/practice/prompt';
import { keyCheck, keyFlagged } from '@/src/practice/key';
import { jevPairsQuestions, jevPairsState, PAIRS_THRESHOLD } from '@/src/practice/unique';
import { buildHintPrompt, HINT_MODEL, HINT_SYSTEM, HINT_THRESHOLD, jevHintQuestions, jevHintState, parseHint, quotesAnswer } from '@/src/practice/hint';
import { createVerifier } from '@/src/passage/verify';
import {
  buildTextbookPrompt,
  parseTextbook,
  TEXTBOOK_MODEL,
  TEXTBOOK_SCHEMA,
  TEXTBOOK_SYSTEM,
  textbookCacheKey,
  TEXTBOOK_VERSION,
  type Textbook,
} from '@/src/passage/textbook';
import { lessonsFor, type SyllabusLesson } from '@/src/syllabus';
import { buildCustomLessonPrompt, CUSTOM_LESSON_MODEL, CUSTOM_LESSON_SCHEMA, CUSTOM_LESSON_SYSTEM, customLessonId, parseCustomLesson } from '@/src/syllabus/custom';
import { findLesson } from '@/src/syllabus/stored';
import { makeProvider } from '@/src/providers';
import { apiKeyFor, routeModel } from '@/src/providers/route';
import { providerThinks } from '@/src/providers/thinking';
import {
  buildReadingPrompt,
  buildReadingSystemPrompt,
  finishedLines,
  getFormat,
  parseReadingLines,
  READING_MODEL,
  readingBrief,
  type ReadingLine,
} from '@/src/reading/formats';
import { getSettings, saveSettings, type Effort, type Settings } from '@/src/settings';
import { recordingKey, recordingPath, toBase64, type RecordingIndex } from '@/src/recordings';
import { SPEECH_ENDPOINT, speechBody, speechCost, speechError } from '@/src/speech';
import { fromBase64, parseWhisper, WHISPER_ENDPOINT, whisperError, whisperForm } from '@/src/listen';
import type { OffscreenRequest, OffscreenResponseFor } from '@/src/messages';
import { withExtras } from '@/src/lessons/extras';
import { forLevel } from '@/src/lessons/level';
import { buildDefinePrompt, DEFINE_BATCH, DEFINE_MODEL, DEFINE_SCHEMA, DEFINE_SYSTEM, definitionKey, DEFINITIONS_STORE, parseDefinitions, type Definition } from '@/src/vocab/definitions';
import { buildPickPrompt, buildPickSystemPrompt, parsePageWords } from '@/src/lessons/pageWords';
import { parseLines } from '@/src/weave/parse';
import { buildLessonPrompt, buildSystemPrompt, buildUserPrompt } from '@/src/weave/prompt';

// Enough for a screenful of paragraphs to go out in one wave.
const MAX_CONCURRENT = 10;
// Room for adaptive thinking plus a handful of short lines (or a page's word list).
const MAX_TOKENS = 16000;

const limit = createLimiter(MAX_CONCURRENT);
// Jev answers in about 0.15s; a chunk's marks arrive together, so they're spread a little to avoid 429s.
const jevLimit = createLimiter(8);
const inFlight = new Map<number, number>();

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

async function setBadge(tabId: number, text: string, title?: string) {
  await browser.action.setBadgeText({ tabId, text });
  if (title !== undefined) await browser.action.setTitle({ tabId, title });
}

async function trackTab<T>(tabId: number | undefined, task: () => Promise<T>): Promise<T> {
  if (tabId === undefined) return task();
  const bump = async (delta: number) => {
    const n = (inFlight.get(tabId) ?? 0) + delta;
    inFlight.set(tabId, n);
    await setBadge(tabId, n > 0 ? String(n) : '').catch(() => {});
  };
  await bump(1);
  try {
    return await task();
  } finally {
    await bump(-1);
  }
}

const CALIBRATION_KEY = 'calibration';
// Thinking on and off produce very different output sizes, so they calibrate separately.
const calibrationKey = (model: string, effort: Effort, thinking: boolean) => `${model}|${effort}|${thinking ? 'thinks' : 'no-thinking'}`;

async function getCalibration(model: string, effort: Effort, thinking: boolean): Promise<Calibration | undefined> {
  const stored = await browser.storage.local.get(CALIBRATION_KEY);
  return (stored[CALIBRATION_KEY] as Record<string, Calibration> | undefined)?.[calibrationKey(model, effort, thinking)];
}

// Requests finish concurrently; chaining the read-modify-writes keeps them from losing updates.
let calibrationWrites = Promise.resolve();
function recordCalibration(model: string, effort: Effort, thinking: boolean, estimate: RequestEstimate, usage: TokenUsage) {
  calibrationWrites = calibrationWrites.then(async () => {
    const stored = await browser.storage.local.get(CALIBRATION_KEY);
    const all = (stored[CALIBRATION_KEY] as Record<string, Calibration> | undefined) ?? {};
    const key = calibrationKey(model, effort, thinking);
    all[key] = addToCalibration(all[key], estimate, usage);
    await browser.storage.local.set({ [CALIBRATION_KEY]: all });
  }).catch(() => {});
}

function recordSpend(usd: number) {
  calibrationWrites = calibrationWrites.then(async () => {
    const stored = await browser.storage.local.get(SPEND_KEY);
    const spend = addSpend(stored[SPEND_KEY] as DailySpend | undefined, dayKey(new Date()), usd);
    await browser.storage.local.set({ [SPEND_KEY]: spend });
  }).catch(() => {});
}

type ModelChoice = Pick<Settings, 'model' | 'effort' | 'thinking'> & { maxTokens?: number };

/**
 * Streams one request and prices what it used. `choice` overrides the
 * settings' model; `onText` sees the text so far after every chunk.
 */
async function runModel(
  system: string,
  user: string,
  estimate: RequestEstimate,
  choice?: ModelChoice,
  onText?: (text: string) => void,
  schema?: Record<string, unknown>,
): Promise<{ text: string; usd: number | null }> {
  const stored = await getSettings();
  const apiKey = apiKeyFor(stored);
  if (!apiKey) throw new Error('No API key. Add one in Language Weave options.');
  const settings = { ...stored, ...choice };
  const model = routeModel(settings, settings.model);
  const provider = makeProvider(settings.provider, { apiKey, model, effort: settings.effort, thinking: settings.thinking });

  let text = '';
  let usage: TokenUsage | undefined;
  const stream = provider.complete({ system, user, maxTokens: choice?.maxTokens ?? MAX_TOKENS, schema, onUsage: (u) => (usage = u) });
  for await (const chunk of stream) {
    text += chunk;
    onText?.(text);
  }

  if (!usage) return { text, usd: null };
  recordCalibration(model, settings.effort, providerThinks(settings.provider, model, settings.thinking), estimate, usage);
  const price = priceFor(model);
  const usd = price ? usageCost(usage, price) : null;
  if (usd !== null) recordSpend(usd);
  return { text, usd };
}

async function runWeave(user: string, estimate: RequestEstimate, vocabularyFrom?: Lesson): Promise<WeaveResult> {
  const { language } = await getSettings();
  // A lesson's vocabulary rides in the system prompt so it is cached across requests.
  const { text, usd } = await runModel(buildSystemPrompt(getLanguage(language), vocabularyFrom), user, estimate);
  return { lines: parseLines(text), usd };
}

/** A reading text; `onLines` gets its lines so far each time another one is finished. */
async function runReading(
  msg: ReadingRequest,
  tabId: number | undefined,
  onLines?: (lines: ReadingLine[]) => void,
): Promise<ResponseFor['reading']> {
  const lang = getLanguage((await getSettings()).language);
  const lesson = getLesson(msg.lessonId, lang);
  const format = getFormat(msg.formatId);
  if (!lesson) throw new Error(`Unknown lesson: ${msg.lessonId}`);
  if (format.local) throw new Error(`${format.label} is written without the model.`);
  const brief = readingBrief(lesson, msg.pageWords);
  const user = buildReadingPrompt(format, msg.input);
  const opts = { maxLines: format.maxLines, source: user };
  let shown = 0;
  const onText =
    onLines &&
    ((text: string) => {
      const lines = finishedLines(text, opts);
      if (lines.length <= shown) return;
      shown = lines.length;
      onLines(lines);
    });
  const system = buildReadingSystemPrompt(lang, brief);
  const { text, usd } = await trackTab(tabId, () => limit(() => runModel(system, user, msg.estimate, READING_MODEL, onText)));
  return { ok: true, value: { lines: parseReadingLines(text, opts), usd } };
}

// Built once per lesson and kept in storage; two tabs asking at once share the build.
const building = new Map<string, Promise<{ value: unknown; usd: number | null }>>();

/** `store`'s entry for `key`, or `build()` run now and stored; `usd` is what this call spent (0 if cached or shared). */
async function storedOrBuilt<T>(store: string, key: string, build: () => Promise<{ value: T; usd: number | null }>, onBuild?: () => void) {
  const stored = (await browser.storage.local.get(store))[store] as Record<string, T> | undefined;
  const cached = stored?.[key];
  if (cached) return { value: cached, usd: 0 };
  onBuild?.();
  const id = `${store}|${key}`;
  const shared = building.get(id) as Promise<{ value: T; usd: number | null }> | undefined;
  if (shared) return { value: (await shared).value, usd: 0 };
  const run = (async () => {
    const built = await build();
    const latest = (await browser.storage.local.get(store))[store] as Record<string, T> | undefined;
    await browser.storage.local.set({ [store]: { ...latest, [key]: built.value } });
    return built;
  })().finally(() => building.delete(id));
  building.set(id, run);
  return run;
}

/** The lesson's kit, from storage or built now. */
async function getKit(lesson: SyllabusLesson, language: string, tabId: number | undefined, onNote?: (note: string) => void) {
  const { value: kit, usd } = await storedOrBuilt<Kit>(
    'kits',
    kitCacheKey(lesson),
    async () => {
      const user = buildKitPrompt(lesson, language);
      const estimate = estimateRequest(KIT_SYSTEM, user, 80, KIT_MODEL.effort);
      const started = Date.now();
      const { text, usd } = await trackTab(tabId, () => runModel(KIT_SYSTEM, user, estimate, KIT_MODEL, undefined, KIT_SCHEMA));
      const meta = { model: KIT_MODEL.model, version: KIT_VERSION, usd, secs: (Date.now() - started) / 1000 };
      return { value: { ...parseKit(text), meta }, usd };
    },
    () => onNote?.('Preparing this lesson. This happens once and takes about a minute…'),
  );
  return { kit, usd };
}

/** The lesson's textbook page, from storage or written now: from the lesson alone, never the page. */
async function runTextbook(msg: Extract<Request, { type: 'textbook' }>, tabId: number | undefined): Promise<ResponseFor['textbook']> {
  const lesson = await findLesson(msg.lessonId);
  if (!lesson) throw new Error(`Unknown lesson: ${msg.lessonId}`);
  const { value: textbook, usd } = await storedOrBuilt<Textbook>('textbooks', textbookCacheKey(lesson), async () => {
    const user = buildTextbookPrompt(lesson, getLanguage(lesson.lang).displayName);
    const estimate = estimateRequest(TEXTBOOK_SYSTEM, user, 120, TEXTBOOK_MODEL.effort);
    const started = Date.now();
    const { text, usd } = await trackTab(tabId, () => runModel(TEXTBOOK_SYSTEM, user, estimate, TEXTBOOK_MODEL, undefined, TEXTBOOK_SCHEMA));
    const meta = { model: TEXTBOOK_MODEL.model, version: TEXTBOOK_VERSION, usd, secs: (Date.now() - started) / 1000 };
    return { value: { ...parseTextbook(text), meta }, usd };
  });
  return { ok: true, value: { textbook, usd } };
}

/**
 * One exercise for the Practice tab: on the lesson, set in one of the kit's
 * situations, or on the section of the page on screen. One that fails its
 * checks is written once more.
 */
async function runPractice(msg: Extract<Request, { type: 'practice' }>, tabId: number | undefined): Promise<ResponseFor['practice']> {
  let choose: (seed: string) => PracticeInput | null;
  let total: number | null = 0;
  let language: string;
  let level: string;
  const settings = await getSettings();
  const { typesafeApiKey } = settings;
  if (msg.mode === 'lesson') {
    const lesson = await findLesson(msg.lessonId ?? '');
    if (!lesson) throw new Error(`Unknown lesson: ${msg.lessonId}`);
    language = getLanguage(lesson.lang).displayName;
    level = lesson.level;
    const built = await getKit(lesson, language, tabId);
    total = built.usd;
    choose = (seed) => choosePractice({ language, lesson, kit: built.kit, type: msg.exercise, seed, point: msg.point, focus: msg.words, setting: msg.setting, like: msg.like });
  } else {
    const pageLevel = msg.level ?? settings.level;
    level = pageLevel;
    language = getLanguage(settings.language).displayName;
    choose = (seed) =>
      choosePagePractice({
        language,
        type: msg.exercise,
        seed,
        title: msg.title ?? '',
        sections: msg.sections ?? [],
        focus: msg.focus ?? 0,
        level: pageLevel,
        pageWords: msg.pageWords ?? [],
        grammar: grammarFor(settings.language, pageLevel),
        like: msg.like,
      });
  }
  for (const seed of [String(Date.now()), `${Date.now()}|again`]) {
    const input = choose(seed);
    if (!input) throw new Error(`Unknown exercise: ${msg.exercise}`);
    const user = buildPracticePrompt(input);
    const estimate = estimateRequest(PRACTICE_SYSTEM, user, 12, PRACTICE_MODEL.effort, false);
    const started = Date.now();
    const { text, usd } = await trackTab(tabId, () => runModel(PRACTICE_SYSTEM, user, estimate, PRACTICE_MODEL));
    total = total === null || usd === null ? null : total + usd;
    const practice = parsePractice(text, input);
    const step = practice?.step;
    if (step?.kind === 'pairs' && typesafeApiKey) {
      const checked = await trackTab(tabId, () => jevLimit(() => askJev(typesafeApiKey, JEV_MODEL, jevPairsState(step), jevPairsQuestions(language))));
      total = total === null ? null : total + checked.usd;
      if (jevProbability(checked.answers) < PAIRS_THRESHOLD) continue;
    }
    // A key Jev disagrees with is written once more; the second is kept either way, since one in six good ones is flagged.
    const check = step && typesafeApiKey && !seed.endsWith('|again') ? keyCheck(step, language, level) : null;
    if (check) {
      try {
        const checked = await trackTab(tabId, () => jevLimit(() => askJev(typesafeApiKey, JEV_MODEL, check.state, check.questions)));
        total = total === null ? null : total + checked.usd;
        if (keyFlagged(check, checked.answers)) continue;
      } catch {
        // Jev didn't answer: shown unchecked.
      }
    }
    if (practice) {
      const meta = { model: PRACTICE_MODEL.model, version: PRACTICE_VERSION, usd, secs: (Date.now() - started) / 1000 };
      return { ok: true, value: { practice: { ...practice, meta }, usd: total } };
    }
  }
  return { ok: false, error: 'The exercise came back broken. Try another.' };
}

/** The lesson's kit point ids and theme words: what the Practice tab plans its exercises over. */
async function runPracticeLesson(msg: Extract<Request, { type: 'practice-lesson' }>, tabId: number | undefined): Promise<ResponseFor['practice-lesson']> {
  const lesson = await findLesson(msg.lessonId);
  if (!lesson) throw new Error(`Unknown lesson: ${msg.lessonId}`);
  const { kit, usd } = await getKit(lesson, getLanguage(lesson.lang).displayName, tabId);
  return { ok: true, value: { points: kit.points.map((p) => p.id), words: kit.themeVocab.map((w) => w.word), glosses: Object.fromEntries(kit.themeVocab.map((w) => [w.word, w.gloss])), usd } };
}

/** A lesson the reader asked for, as a syllabus lesson: one strong call, nothing cached or saved here. */
async function runCustomLesson(msg: Extract<Request, { type: 'custom-lesson' }>): Promise<ResponseFor['custom-lesson']> {
  const { request } = msg;
  const user = buildCustomLessonPrompt(request, getLanguage(request.lang).displayName, lessonsFor(request.lang));
  const estimate = estimateRequest(CUSTOM_LESSON_SYSTEM, user, 10, CUSTOM_LESSON_MODEL.effort);
  const { text, usd } = await runModel(CUSTOM_LESSON_SYSTEM, user, estimate, CUSTOM_LESSON_MODEL, undefined, CUSTOM_LESSON_SCHEMA);
  const { lesson, leftOut } = parseCustomLesson(text, request, msg.id ?? '');
  return { ok: true, value: { lesson: msg.id ? lesson : { ...lesson, id: customLessonId(request.lang, lesson.title) }, leftOut, usd } };
}

/**
 * A hint for the exercise on screen, by Haiku: one that quotes the answer is
 * dropped, and with a TypeSafe key one Jev thinks gives it away or leads
 * elsewhere. A dropped hint is written once more.
 */
async function runHint(msg: Extract<Request, { type: 'practice-hint' }>, tabId: number | undefined): Promise<ResponseFor['practice-hint']> {
  const { typesafeApiKey } = await getSettings();
  const user = buildHintPrompt(msg.step, getLanguage(msg.lang).displayName, msg.level);
  const estimate = estimateRequest(HINT_SYSTEM, user, 1, HINT_MODEL.effort, false);
  let total: number | null = 0;
  const add = (usd: number | null) => (total = total === null || usd === null ? null : total + usd);
  for (let attempt = 0; attempt < 2; attempt++) {
    const { text, usd } = await trackTab(tabId, () => runModel(HINT_SYSTEM, user, estimate, HINT_MODEL));
    add(usd);
    const hint = parseHint(text);
    if (!hint || quotesAnswer(msg.step, hint)) continue;
    if (typesafeApiKey) {
      const checked = await trackTab(tabId, () => jevLimit(() => askJev(typesafeApiKey, JEV_MODEL, jevHintState(msg.step, hint), jevHintQuestions())));
      add(checked.usd);
      if (jevProbability(checked.answers) < HINT_THRESHOLD) continue;
    }
    return { ok: true, value: { hint, usd: total } };
  }
  return { ok: false, error: 'No hint for this one.' };
}

/**
 * The widget's piece: about the section on screen (page mode) or a scene on the
 * lesson's theme (lesson mode), in the format the widget picked. `onPiece` gets
 * it as its lines are written, then the final piece.
 */
async function runPassage(
  msg: PassageRequest,
  tabId: number | undefined,
  onPiece?: (piece: Piece) => void,
  onNote?: (note: string) => void,
): Promise<ResponseFor['passage']> {
  const seed = String(Date.now());
  let job: PieceJob;
  let kitUsd: number | null = 0;
  if (msg.mode === 'lesson') {
    const lesson = await findLesson(msg.lessonId ?? '');
    if (!lesson) throw new Error(`Unknown lesson: ${msg.lessonId}`);
    const language = getLanguage(lesson.lang).displayName;
    const built = await getKit(lesson, language, tabId, onNote);
    kitUsd = built.usd;
    job = { mode: 'lesson', formatId: msg.formatId, language, seed, lesson, kit: built.kit };
  } else {
    const { language, level } = await getSettings();
    job = {
      mode: 'page',
      formatId: msg.formatId,
      language: getLanguage(language).displayName,
      seed,
      level: msg.level ?? level,
      title: msg.title ?? '',
      sections: msg.sections ?? [],
      focus: msg.focus ?? 0,
      pageWords: msg.pageWords ?? [],
      grammar: grammarFor(language, msg.level ?? level),
    };
  }
  onNote?.('Writing…');
  const complete: Complete = ({ system, user }, onText) => {
    const estimate = estimateRequest(system, user, 12, PASSAGE_MODEL.effort, false);
    return trackTab(tabId, () => limit(() => runModel(system, user, estimate, PASSAGE_MODEL, onText)));
  };
  // Page mode, with a TypeSafe key: Jev checks each quiz and fact line against the section as it streams in.
  const { typesafeApiKey } = await getSettings();
  const jev =
    job.mode === 'page' && typesafeApiKey
      ? (state: unknown, questions: Parameters<typeof askJev>[3]) => trackTab(tabId, () => jevLimit(() => askJev(typesafeApiKey, JEV_MODEL, state, questions)))
      : undefined;
  const section = job.mode === 'page' ? sectionContext(job.sections, job.focus).text : '';
  const words = languageNamed(job.language)?.functionWords;
  const target = words && new Set(words);
  /** One piece: broken lines (checks in code) and lines Jev drops are never shown. */
  const attempt = async (seed: string) => {
    let latest: Piece | undefined;
    const verifier = jev && createVerifier({ formatId: msg.formatId, language: job.language, section, jev, target, onChange: () => latest && onPiece?.(shown(latest)) });
    const shown = (p: Piece) => cleanPiece(verifier ? verifier.see(p) : p, undefined, { target });
    const run = await writePiece({ ...job, seed }, complete, onPiece && ((p) => onPiece(shown((latest = p)))));
    const piece = cleanPiece(verifier ? await verifier.settle(run.piece) : run.piece, undefined, { target });
    return { piece, usd: run.usd === null ? null : run.usd + (verifier?.usd() ?? 0), broken: wholeIssues(piece).length };
  };
  let best = await attempt(seed);
  // Still broken (a riddle with no options, too few quiz lines): written once more, and the better one kept.
  if (best.broken) {
    onNote?.('Writing that again…');
    const again = await attempt(`${seed}|again`);
    const usd = best.usd === null || again.usd === null ? null : best.usd + again.usd;
    best = { ...(again.broken <= best.broken ? again : best), usd };
  }
  onPiece?.(best.piece);
  if (!best.piece.lines.length) return { ok: false, error: 'The passage came back empty.' };
  const usd = kitUsd === null || best.usd === null ? null : kitUsd + best.usd;
  return { ok: true, value: { piece: best.piece, usd } };
}

/**
 * Lesson mode's marks on one chunk of the page: the lesson's kit, then the
 * marking call streamed, each mark checked on its own as soon as it's whole:
 * by Jev, then a lenient Sonnet for the marks it isn't sure of, with a
 * TypeSafe key; by Haiku without one. `onMark` gets each mark the check keeps.
 */
async function runMarks(
  msg: MarksRequest,
  tabId: number | undefined,
  onMark?: (mark: ShownMark) => void,
  onNote?: (note: string) => void,
): Promise<ResponseFor['marks']> {
  const lesson = await findLesson(msg.lessonId);
  if (!lesson) throw new Error(`Unknown lesson: ${msg.lessonId}`);
  const language = getLanguage(lesson.lang).displayName;
  const { kit, usd: kitUsd } = await getKit(lesson, language, tabId, onNote);
  const job: MarkJob = { language, lesson, kit, title: msg.title, heading: msg.heading, paragraphs: msg.paragraphs };
  const run = (system: string, choice: ModelChoice, lines: number) => (user: string, onText?: (text: string) => void) => {
    const estimate = estimateRequest(system, user, lines, choice.effort, false);
    return trackTab(tabId, () => limit(() => runModel(system, user, estimate, choice, onText)));
  };
  const { typesafeApiKey } = await getSettings();
  const jev = typesafeApiKey ? (state: unknown, questions: Parameters<typeof askJev>[3]) => trackTab(tabId, () => jevLimit(() => askJev(typesafeApiKey, JEV_MODEL, state, questions))) : undefined;
  // The sweep asks for about twice the marks.
  const mark = run(MARK_SYSTEM, MARK_MODEL, 2 * maxMarks(job));
  const check = run(CHECK_SYSTEM, jev ? LENIENT_CHECK_MODEL : CHECK_MODEL, 1);
  const marked = await markSection(job, { mark, check, jev }, (m) => onMark?.(m));
  const usd = kitUsd === null || marked.usd === null ? null : kitUsd + marked.usd;
  return { ok: true, value: { usd, marks: marked.marks.length, dropped: marked.dropped, toModel: marked.toModel } };
}

/** Each language's local recordings (`src/recordings.ts`), {} when it has none. */
const recordingIndexes = new Map<string, Promise<RecordingIndex>>();
function recordingsFor(lang: string): Promise<RecordingIndex> {
  let index = recordingIndexes.get(lang);
  if (!index) {
    index = fetch(extensionUrl(recordingPath(lang))).then(
      (res) => (res.ok ? (res.json() as Promise<RecordingIndex>) : {}),
      () => ({}),
    );
    recordingIndexes.set(lang, index);
  }
  return index;
}

// The build's files are typed (PublicPath); recordings are copied in by wxt.config.ts, so they aren't among them.
const extensionUrl = (path: string) => (browser.runtime.getURL as (path: string) => string)(path);

/**
 * One line read aloud by Google Text-to-Speech, in the lesson's language, `slow` for a word on its own;
 * or its local recording, when there is one.
 */
async function runSpeech(msg: Extract<Request, { type: 'speak' }>, tabId: number | undefined): Promise<ResponseFor['speak']> {
  const lang = getLanguage(msg.lang);
  const file = (await recordingsFor(lang.code))[recordingKey(msg.text)];
  if (file) {
    const res = await fetch(extensionUrl(recordingPath(lang.code, file)));
    if (res.ok) return { ok: true, value: { audio: toBase64(await res.arrayBuffer()), usd: 0 } };
  }
  if (lang.noVoice) throw new Error(`No recording of “${msg.text}”, and Google Text-to-Speech has no ${lang.displayName} voice.`);
  const { googleTtsKey } = await getSettings();
  if (!googleTtsKey) throw new Error('No Google Text-to-Speech key. Add one in Language Weave options.');
  const res = await trackTab(tabId, () =>
    fetch(SPEECH_ENDPOINT, {
      method: 'POST',
      headers: { 'x-goog-api-key': googleTtsKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(speechBody(msg.text, lang.speechLocale ?? lang.bcp47, msg.slow)),
    }),
  );
  if (!res.ok) return { ok: false, error: speechError(res.status, await res.text()) };
  const { audioContent } = (await res.json()) as { audioContent?: string };
  if (!audioContent) return { ok: false, error: 'Speech came back empty.' };
  return { ok: true, value: { audio: audioContent, usd: speechCost(msg.text) } };
}

/**
 * The Words page's definitions and examples: stored ones at once, the rest
 * written in batches and stored. A batch that fails leaves its words out, so
 * the page asks again next time.
 */
async function runDefine(msg: Extract<Request, { type: 'define-words' }>): Promise<ResponseFor['define-words']> {
  const stored = ((await browser.storage.local.get(DEFINITIONS_STORE))[DEFINITIONS_STORE] ?? {}) as Record<string, Definition>;
  const definitions: Record<string, Definition> = {};
  const missing = msg.words.filter((w) => {
    const found = stored[definitionKey(msg.lang, w.word)];
    if (found) definitions[w.word] = found;
    return !found;
  });
  if (!missing.length) return { ok: true, value: { definitions, usd: 0 } };
  const language = getLanguage(msg.lang).displayName;
  const batches = Array.from({ length: Math.ceil(missing.length / DEFINE_BATCH) }, (_, i) => missing.slice(i * DEFINE_BATCH, (i + 1) * DEFINE_BATCH));
  const results = await Promise.allSettled(
    batches.map(async (batch) => {
      const user = buildDefinePrompt(batch, language, msg.level);
      const estimate = estimateRequest(DEFINE_SYSTEM, user, batch.length * 2, DEFINE_MODEL.effort, false);
      const { text, usd } = await limit(() => runModel(DEFINE_SYSTEM, user, estimate, DEFINE_MODEL, undefined, DEFINE_SCHEMA));
      return { written: parseDefinitions(text, batch.map((w) => w.word)), usd };
    }),
  );
  let usd: number | null = 0;
  const written: Record<string, Definition> = {};
  for (const r of results) {
    if (r.status === 'rejected') {
      console.warn('Definitions failed:', r.reason);
      continue;
    }
    Object.assign(written, r.value.written);
    usd = usd === null || r.value.usd === null ? null : usd + r.value.usd;
  }
  if (!Object.keys(written).length && results.every((r) => r.status === 'rejected')) {
    const reason = (results[0] as PromiseRejectedResult).reason;
    return { ok: false, error: reason instanceof Error ? reason.message : String(reason) };
  }
  Object.assign(definitions, written);
  const latest = ((await browser.storage.local.get(DEFINITIONS_STORE))[DEFINITIONS_STORE] ?? {}) as Record<string, Definition>;
  const add = Object.fromEntries(Object.entries(written).map(([word, d]) => [definitionKey(msg.lang, word), d]));
  await browser.storage.local.set({ [DEFINITIONS_STORE]: { ...latest, ...add } });
  return { ok: true, value: { definitions, usd } };
}

/** The offscreen document that records (`entrypoints/offscreen/`), opened the first time it's needed. */
let offscreenOpening: Promise<void> | undefined;
async function ensureOffscreen() {
  const url = browser.runtime.getURL('/offscreen.html');
  const open = await browser.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'], documentUrls: [url] });
  if (open.length) return;
  offscreenOpening ??= browser.offscreen
    .createDocument({ url, reasons: ['USER_MEDIA'], justification: 'Records the reader saying a sentence for a speaking exercise.' })
    .finally(() => (offscreenOpening = undefined));
  await offscreenOpening;
}

async function toOffscreen<T extends OffscreenRequest['type']>(type: T): Promise<OffscreenResponseFor[T]> {
  await ensureOffscreen();
  return browser.runtime.sendMessage({ target: 'offscreen', type } satisfies OffscreenRequest);
}

async function listenKey(): Promise<string> {
  const { speaking, deepinfraApiKey } = await getSettings();
  if (!speaking || !deepinfraApiKey) throw new Error('Speaking exercises are off. Turn them on in Language Weave options.');
  return deepinfraApiKey;
}

/** Stops recording and has Whisper hear it, with the sentence expected as its prompt. */
async function runListen(msg: Extract<Request, { type: 'listen-stop' }>, tabId: number | undefined): Promise<ResponseFor['listen-stop']> {
  const key = await listenKey();
  const clip = await toOffscreen('record-stop');
  if (!clip.ok) return clip;
  const res = await trackTab(tabId, () =>
    fetch(WHISPER_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: whisperForm(fromBase64(clip.value.wav), getLanguage(msg.lang).bcp47, msg.expected),
    }),
  );
  const body = await res.text();
  if (!res.ok) return { ok: false, error: whisperError(res.status, body) };
  return { ok: true, value: parseWhisper(body, clip.value.secs) };
}

/** `force` skips the popup's cost confirmation (the keyboard shortcut is already explicit); the rest is `TissageRun`. */
async function injectWeaver(tabId: number, run: TissageRun) {
  try {
    await setBadge(tabId, '', 'Language Weave');
    await runContent(tabId, run);
  } catch (e) {
    await setBadge(tabId, '!', `Can't weave this page: ${errorMessage(e)}`);
    throw e;
  }
}

/** The frame to run in (`pickFrame`); the top page if the frames can't be read. */
async function textFrame(tabId: number): Promise<number> {
  try {
    const results = await browser.scripting.executeScript({
      target: { tabId, allFrames: true },
      func: () => ({
        words: (document.body?.innerText ?? '').split(/\s+/).filter(Boolean).length,
        tissage: Boolean((globalThis as { __tissage?: unknown }).__tissage),
      }),
    });
    return pickFrame(results.flatMap((r) => (r.result ? [{ frameId: r.frameId, ...r.result }] : [])));
  } catch {
    return 0;
  }
}

async function runContent(tabId: number, run: TissageRun) {
  const target = { tabId, frameIds: [await textFrame(tabId)] };
  await browser.scripting.executeScript({
    target,
    func: (r: TissageRun) => {
      (globalThis as { __tissageRun?: TissageRun }).__tissageRun = r;
    },
    args: [run],
  });
  await browser.scripting.executeScript({ target, files: ['/content-scripts/content.js'] });
}

const LESSON_STATE_KEY = 'lessonState';

async function getLessonState(): Promise<string | null> {
  const stored = await browser.storage.session.get(LESSON_STATE_KEY);
  return (stored[LESSON_STATE_KEY] as string | undefined) ?? null;
}

/** Lesson mode's widget, while it's open, opens by itself on whichever tab the reader is looking at. */
async function followTo(tabId: number) {
  const s = await getSettings();
  if (s.mode !== 'lesson' || !apiKeyFor(s)) return;
  const text = await getLessonState();
  if (!text || !decodeLessonState(text)?.open) return;
  // Pages Language Weave can't run on (chrome://, the Web Store, or any tab not clicked on when the reader
  // didn't allow every site: src/follow.ts) stay as they are, with no badge.
  await runContent(tabId, { follow: true }).catch(() => {});
}

async function handle(
  msg: Request,
  tabId: number | undefined,
  onLines?: (lines: ReadingLine[]) => void,
  onNote?: (note: string) => void,
  onPiece?: (piece: Piece) => void,
  onMark?: (mark: ShownMark) => void,
): Promise<ResponseFor[Request['type']]> {
  if ('buildId' in msg && msg.buildId !== BUILD_ID) {
    const badgeTab = msg.type === 'weave-tab' ? msg.tabId : tabId;
    if (badgeTab !== undefined) await setBadge(badgeTab, '!', STALE_BUILD_ERROR).catch(() => {});
    return { ok: false, error: STALE_BUILD_ERROR, code: 'stale' };
  }
  switch (msg.type) {
    case 'weave-config': {
      const s = await getSettings();
      const model = routeModel(s, s.model);
      const thinks = providerThinks(s.provider, model, s.thinking);
      return {
        ok: true,
        value: {
          density: s.density,
          language: s.language,
          mode: s.mode,
          level: s.level,
          weave: s.weave,
          lessonId: s.lessonId,
          lesson: (await findLesson(s.lessonId)) ?? lessonsFor(s.language)[0],
          topUp: s.topUp,
          weavePage: s.weavePage,
          hasKey: Boolean(apiKeyFor(s)),
          canSpeak: Boolean(s.googleTtsKey),
          canListen: s.speaking && Boolean(s.deepinfraApiKey),
          model,
          effort: s.effort,
          thinks,
          confirmAboveUsd: s.confirmAboveUsd,
          readingFormat: s.readingFormat,
          widgetPosition: s.widgetPosition,
          widgetSize: s.widgetSize,
          textScale: s.textScale,
          scriptViews: s.scriptViews,
          calibration: await getCalibration(model, s.effort, thinks),
          theme: s.theme,
          debug: s.debug,
        },
      };
    }
    case 'weave-segment': {
      const user = buildUserPrompt({ passage: msg.text, targetWords: msg.budget, levelNote: msg.levelNote });
      return { ok: true, value: await trackTab(tabId, () => limit(() => runWeave(user, msg.estimate))) };
    }
    case 'weave-lesson': {
      const base = getLesson(msg.lessonId, getLanguage((await getSettings()).language));
      const lesson = base ? withExtras(forLevel(base, msg.level), msg.pageWords).lesson : undefined;
      if (!lesson) throw new Error(`Unknown lesson: ${msg.lessonId}`);
      const user = buildLessonPrompt({
        passage: msg.text,
        lesson,
        candidates: msg.candidates,
        topUp: msg.vocabulary ? { words: msg.topUpWords, taken: msg.taken } : undefined,
      });
      const vocabularyFrom = msg.vocabulary ? lesson : undefined;
      return { ok: true, value: await trackTab(tabId, () => limit(() => runWeave(user, msg.estimate, vocabularyFrom))) };
    }
    case 'pick-page-words': {
      const lang = getLanguage((await getSettings()).language);
      const user = buildPickPrompt({ title: msg.title, headings: msg.headings, passages: msg.passages, exclude: msg.exclude, level: msg.level });
      const { text, usd } = await trackTab(tabId, () => limit(() => runModel(buildPickSystemPrompt(lang), user, msg.estimate)));
      return { ok: true, value: { words: parsePageWords(text), usd } };
    }
    case 'reading':
      return runReading(msg, tabId, onLines);
    case 'passage':
      return runPassage(msg, tabId, onPiece, onNote);
    case 'textbook':
      return runTextbook(msg, tabId);
    case 'practice':
      return runPractice(msg, tabId);
    case 'practice-lesson':
      return runPracticeLesson(msg, tabId);
    case 'custom-lesson':
      return runCustomLesson(msg);
    case 'practice-hint':
      return runHint(msg, tabId);
    case 'marks':
      return runMarks(msg, tabId, onMark, onNote);
    case 'speak':
      return runSpeech(msg, tabId);
    case 'define-words':
      return runDefine(msg);
    case 'recorded-words':
      return { ok: true, value: Object.keys(await recordingsFor(msg.lang)) };
    case 'listen-start':
      await listenKey();
      return toOffscreen('record-start');
    case 'listen-stop':
      return runListen(msg, tabId);
    case 'listen-cancel':
      return toOffscreen('record-cancel');
    case 'set-reading-format':
      await saveSettings({ readingFormat: msg.formatId });
      return { ok: true, value: null };
    case 'set-widget-position':
      await saveSettings({ widgetPosition: msg.position });
      return { ok: true, value: null };
    case 'set-widget-size':
      await saveSettings({ widgetSize: msg.size });
      return { ok: true, value: null };
    case 'set-text-scale':
      await saveSettings({ textScale: msg.scale });
      return { ok: true, value: null };
    case 'set-theme':
      await saveSettings({ theme: msg.theme });
      return { ok: true, value: null };
    case 'set-script-view':
      await saveSettings({ scriptViews: { ...(await getSettings()).scriptViews, [msg.language]: msg.view } });
      return { ok: true, value: null };
    case 'weave-tab':
      await injectWeaver(msg.tabId, { force: false, weave: msg.weave, mark: msg.mark });
      return { ok: true, value: null };
    case 'get-lesson-state':
      return { ok: true, value: await getLessonState() };
    case 'set-lesson-state':
      await browser.storage.session.set({ [LESSON_STATE_KEY]: msg.state });
      return { ok: true, value: null };
    case 'list-models': {
      const provider = makeProvider(msg.provider, { apiKey: msg.apiKey, model: '', effort: 'default' });
      return { ok: true, value: await provider.listModels() };
    }
  }
}

export default defineBackground(() => {
  // The toolbar icon opens the popup; this shortcut weaves without it.
  browser.commands.onCommand.addListener(async (command, tab) => {
    if (command !== 'weave-page' || tab?.id === undefined) return;
    await injectWeaver(tab.id, { force: true }).catch(() => {});
  });

  browser.tabs.onActivated.addListener(({ tabId }) => void followTo(tabId));
  // A page loaded in the tab on screen: a link followed, a reload.
  browser.tabs.onUpdated.addListener((tabId, change, tab) => {
    if (change.status === 'complete' && tab.active) void followTo(tabId);
  });
  browser.windows.onFocusChanged.addListener(async (windowId) => {
    if (windowId === browser.windows.WINDOW_ID_NONE) return;
    const [tab] = await browser.tabs.query({ active: true, windowId });
    if (tab?.id !== undefined) void followTo(tab.id);
  });

  browser.runtime.onMessage.addListener((msg: Request, sender, sendResponse) => {
    const tabId = sender.tab?.id;
    handle(msg, tabId).then(sendResponse, async (e) => {
      const error = errorMessage(e);
      if (tabId !== undefined) await setBadge(tabId, '!', `Weave failed: ${error}`).catch(() => {});
      sendResponse({ ok: false, error });
    });
    return true; // keeps the channel open for the async response
  });

  browser.runtime.onConnect.addListener((port) => {
    if (port.name === PASSAGE_PORT) return servePassage(port);
    if (port.name === MARKS_PORT) return serveMarks(port);
    if (port.name !== READING_PORT) return;
    const tabId = port.sender?.tab?.id;
    let open = true;
    port.onDisconnect.addListener(() => (open = false));
    const post = (m: ReadingPortMessage) => open && port.postMessage(m);
    port.onMessage.addListener((msg: Request) => {
      if (msg.type !== 'reading') return;
      handle(msg, tabId, (lines) => post({ type: 'lines', lines })).then(
        (result) => post({ type: 'done', result: result as ResponseFor['reading'] }),
        async (e) => {
          const error = errorMessage(e);
          if (tabId !== undefined) await setBadge(tabId, '!', `Weave failed: ${error}`).catch(() => {});
          post({ type: 'done', result: { ok: false, error } });
        },
      );
    });
  });
});

/** One piece per port: notes while the kit is built, the piece as its lines are written, then the result. */
function servePassage(port: Browser.runtime.Port) {
  const tabId = port.sender?.tab?.id;
  let open = true;
  port.onDisconnect.addListener(() => (open = false));
  const post = (m: PassagePortMessage) => open && port.postMessage(m);
  port.onMessage.addListener((msg: Request) => {
    if (msg.type !== 'passage') return;
    handle(
      msg,
      tabId,
      undefined,
      (note) => post({ type: 'note', note }),
      (piece) => post({ type: 'piece', piece }),
    ).then(
      (result) => post({ type: 'done', result: result as ResponseFor['passage'] }),
      async (e) => {
        const error = errorMessage(e);
        if (tabId !== undefined) await setBadge(tabId, '!', `Lesson failed: ${error}`).catch(() => {});
        post({ type: 'done', result: { ok: false, error } });
      },
    );
  });
}

/** One chunk's marks per port: notes while the kit is built, each mark as its check passes, then the result. */
function serveMarks(port: Browser.runtime.Port) {
  const tabId = port.sender?.tab?.id;
  let open = true;
  port.onDisconnect.addListener(() => (open = false));
  const post = (m: MarksPortMessage) => open && port.postMessage(m);
  port.onMessage.addListener((msg: Request) => {
    if (msg.type !== 'marks') return;
    handle(
      msg,
      tabId,
      undefined,
      (note) => post({ type: 'note', note }),
      undefined,
      (mark) => post({ type: 'mark', mark }),
    ).then(
      (result) => post({ type: 'done', result: result as ResponseFor['marks'] }),
      async (e) => {
        const error = errorMessage(e);
        if (tabId !== undefined) await setBadge(tabId, '!', `Marking failed: ${error}`).catch(() => {});
        post({ type: 'done', result: { ok: false, error } });
      },
    );
  });
}
