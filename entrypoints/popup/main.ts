import { browser } from 'wxt/browser';
import { BUILD_ID } from '@/src/build';
import { dayKey, formatUsd, SPEND_KEY, type DailySpend } from '@/src/cost';
import { setDirection } from '@/src/direction';
import { LEVELS, type Level } from '@/src/grammar';
import { languages, scriptViewFor, type LanguageConfig } from '@/src/languages';
import { EASY_CATEGORY } from '@/src/lessons/easy';
import { PAGE_CATEGORY } from '@/src/lessons/pageWords';
import type { PageVocab, ResponseFor, TabRequest, TabResponseFor } from '@/src/messages';
import { apiKeyFor, PROVIDER_NAMES } from '@/src/providers/route';
import type { ChatProvider } from '@/src/providers/types';
import { recordingKey } from '@/src/recordings';
import { readingsInBrackets, rubyNodes, SCRIPT_ATTR, scriptStyles, type ScriptView } from '@/src/ruby';
import { getSettings, saveSettings, type Settings } from '@/src/settings';
import { lessonsFor, type SyllabusLesson } from '@/src/syllabus';
import { customLessonsFor } from '@/src/syllabus/stored';
import { STATUS_TIPS, vocabKey, vocabStore, type WordStatus } from '@/src/vocab/store';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const languageGroup = $<HTMLDivElement>('languages');
const lessonSelect = $<HTMLSelectElement>('lesson');
const levelSlider = $<HTMLInputElement>('level');
const levelMarks = $<HTMLDivElement>('levelMarks');
const weavePageInput = $<HTMLInputElement>('weavePage');
const markButton = $<HTMLButtonElement>('markPage');
const weaveWordsButton = $<HTMLButtonElement>('weaveWords');
const modeInputs = [...document.querySelectorAll<HTMLInputElement>('input[name="mode"]')];
const summary = $<HTMLParagraphElement>('summary');
const cost = $<HTMLParagraphElement>('cost');
const notice = $<HTMLParagraphElement>('notice');
const list = $<HTMLDivElement>('list');
const weaveButton = $<HTMLButtonElement>('weave');
const restoreButton = $<HTMLButtonElement>('restore');
const reloadButton = $<HTMLButtonElement>('reloadExtension');

const POLL_MS = 500;
/** After starting a weave, how many polls may still find no weave running before giving up. */
const STARTUP_POLLS = 10;
let tabId: number | undefined;
let hasKey = false;
let provider: ChatProvider = 'anthropic';
let pollTimer: ReturnType<typeof setTimeout> | undefined;
let startupPolls = 0;

function toTab<K extends TabRequest['type']>(msg: Extract<TabRequest, { type: K }>): Promise<TabResponseFor[K]> {
  return browser.tabs.sendMessage(tabId!, msg);
}

/** The page's vocab, or null if Language Weave hasn't been injected into this tab yet. */
async function pageVocab(): Promise<PageVocab | null> {
  try {
    return await toTab({ type: 'page-vocab' });
  } catch {
    return null;
  }
}

/** The popup is loaded from disk, so after a rebuild it can be newer than the running background. */
function showStale(error: string) {
  showNotice(error);
  reloadButton.hidden = false;
  weaveButton.hidden = true;
}

/** Lesson mode: `weave` or `mark` this page as well as opening the lesson. */
async function startWeave(also: { weave?: boolean; mark?: boolean } = {}) {
  const res: ResponseFor['weave-tab'] = await browser.runtime.sendMessage({ type: 'weave-tab', tabId, buildId: BUILD_ID, ...also });
  if (!res.ok) {
    if (res.code === 'stale') showStale(res.error);
    else showNotice(`Can't weave this page: ${res.error}`);
    return;
  }
  startupPolls = STARTUP_POLLS;
  schedule();
}

function showNotice(text: string) {
  notice.textContent = text;
  notice.hidden = !text;
}

function percent(n: number): string {
  return `${(n * 100).toFixed(1).replace(/\.0$/, '')}%`;
}

function renderCost(vocab: PageVocab) {
  const e = vocab.estimate;
  cost.title = e
    ? `${e.requests} requests to ${vocab.model}, ~${Math.round(e.inputTokens / 1000)}k tokens in, ~${Math.round(e.outputTokens / 1000)}k out.` +
      (e.calibrated ? ' Adjusted from what past requests actually used.' : ' Rough until a few requests have been made with this model.')
    : '';
  if (!e) {
    cost.textContent = '';
  } else if (e.requests === 0) {
    cost.textContent = 'No API calls needed.';
  } else if (e.usd === null) {
    cost.textContent = `Cost unknown: Language Weave has no price for ${vocab.model}.`;
  } else {
    const spent = vocab.status === 'confirm' || vocab.spentUsd === null ? '' : ` · spent ${formatUsd(vocab.spentUsd)}`;
    cost.textContent = `Estimated ${formatUsd(e.usd)} (${e.requests} requests)${spent}`;
  }
}

function render(vocab: PageVocab | null) {
  const active = vocab && (vocab.status === 'weaving' || vocab.status === 'done');
  weaveButton.hidden = Boolean(active);
  restoreButton.hidden = !active;
  const lesson = mode() === 'lesson';
  weaveButton.textContent = lesson || !weavePageInput.checked ? 'Open the lesson' : 'Weave this page';
  restoreButton.textContent = lesson || !weavePageInput.checked ? 'Close the lesson' : 'Restore English';
  // Lesson mode: the page is marked or woven only when asked, this page only.
  $('lessonActions').hidden = !lesson;
  markButton.textContent = vocab?.marked ? 'Remove marks' : 'Mark this page';
  weaveWordsButton.textContent = active && vocab.weaving ? 'Remove words' : 'Weave this page';
  weaveWordsButton.disabled = vocab?.status === 'confirm' || vocab?.status === 'weaving';

  if (!vocab || vocab.status === 'idle') {
    summary.textContent = 'This page isn’t woven.';
    cost.textContent = '';
    list.replaceChildren();
    return;
  }

  if (!vocab.weaving) {
    summary.textContent = 'The lesson is open in the corner of the page. Words aren’t woven.';
    cost.textContent = vocab.spentUsd ? `Spent ${formatUsd(vocab.spentUsd)}` : '';
    list.replaceChildren();
    return;
  }

  renderCost(vocab);
  if (vocab.status === 'confirm') {
    const usd = vocab.estimate?.usd;
    summary.textContent =
      usd == null
        ? 'Language Weave can’t price this model, so it’s asking before weaving.'
        : `This page would cost about ${formatUsd(usd)}, over your limit for weaving automatically.`;
    weaveButton.textContent = usd == null ? 'Weave anyway' : `Weave for ~${formatUsd(usd)}`;
    list.replaceChildren();
    return;
  }

  const share = vocab.totalWords ? vocab.wovenWords / vocab.totalWords : 0;
  const words = `${vocab.wovenWords} word${vocab.wovenWords === 1 ? '' : 's'} woven · ${percent(share)} of ${percent(vocab.density)}`;
  const progress = [
    vocab.picking ? 'picking words for this page' : '',
    vocab.pending ? `weaving ${vocab.pending} paragraph${vocab.pending === 1 ? '' : 's'}` : '',
    vocab.queued ? `${vocab.queued} more as you scroll` : '',
  ].filter(Boolean);
  summary.textContent = vocab.status === 'weaving' && progress.length ? `${words} · ${progress.join(', ')}` : words;

  const groups = vocab.categories
    .filter((cat) => !FOLDED.has(cat.id))
    .map((cat) => ({ cat, items: vocab.items.filter((i) => i.category === cat.id) }))
    .filter((g) => g.items.length > 0);
  // Page words and easy words are one list, folded away: they're most of the words but the least to read.
  const folded = vocab.categories
    .filter((cat) => FOLDED.has(cat.id))
    .flatMap((cat) => vocab.items.filter((i) => i.category === cat.id));

  const children: HTMLElement[] = groups.flatMap(({ cat, items }) => {
    const heading = document.createElement('h2');
    heading.textContent = cat.label;
    return [heading, wordList(items)];
  });
  if (folded.length) {
    const details = Object.assign(document.createElement('details'), { open: foldedOpen });
    // The list is drawn again on every poll, so the fold remembers whether it was open.
    details.addEventListener('toggle', () => {
      foldedOpen = details.open;
      if (details.open) void prefetchSpeech(folded.filter((i) => sayable(i.french)));
    });
    const label = Object.assign(document.createElement('summary'), {
      textContent: `Page and easy words (${folded.length})`,
    });
    details.append(label, wordList(folded, sayable));
    children.push(details);
  }
  list.replaceChildren(...children);
}

/** Each folded word read aloud, fetched only once the fold is opened (most readers never open it), one at a time. */
const spoken = new Map<string, Promise<string | null>>();

function speechFor(text: string): Promise<string | null> {
  const key = `${language()}:${text}`;
  let audio = spoken.get(key);
  if (!audio) {
    const msg = { type: 'speak', buildId: BUILD_ID, lang: language(), text, slow: true };
    audio = (browser.runtime.sendMessage(msg) as Promise<ResponseFor['speak']>).then(
      (res) => (res.ok ? res.value.audio : (console.warn(res.error), null)),
      () => null,
    );
    // A failure isn't kept, so a click tries again.
    audio.then((a) => a ?? spoken.delete(key));
    spoken.set(key, audio);
  }
  return audio;
}

/** Whether a word can be read: any, with a voice; else only one recorded locally (`src/recordings.ts`). */
function sayable(text: string): boolean {
  const lang = language();
  if (!languages[lang]?.noVoice) return true;
  void loadRecorded(lang);
  return recorded.get(lang)?.has(recordingKey(text)) ?? false;
}

/** Each voiceless language's recorded words, asked for once; the list is drawn again when they arrive. */
const recorded = new Map<string, Set<string>>();
const askedRecorded = new Set<string>();
async function loadRecorded(lang: string) {
  if (askedRecorded.has(lang)) return;
  askedRecorded.add(lang);
  const msg = { type: 'recorded-words', buildId: BUILD_ID, lang };
  const res = (await browser.runtime.sendMessage(msg).catch(() => null)) as ResponseFor['recorded-words'] | null;
  recorded.set(lang, new Set(res?.ok ? res.value : []));
  if (recorded.get(lang)!.size) void refresh();
}

async function prefetchSpeech(items: PageVocab['items']) {
  for (const item of items) await speechFor(item.french);
}

async function speak(text: string) {
  const audio = await speechFor(text);
  if (audio) void new Audio(`data:audio/mp3;base64,${audio}`).play();
}

/** The reader's saved and known words in the popup's language, by lemma (`src/vocab/`). */
let statuses: Record<string, WordStatus> = {};
async function loadStatuses() {
  const vocab = await vocabStore(language()).load();
  statuses = Object.fromEntries(Object.entries(vocab.words).map(([k, e]) => [k, e.status]));
}

/** ☆ or ✓ on a row: set on the page, which keeps the sentence the word is in. */
function statusToggle(item: PageVocab['items'][number], status: WordStatus, label: string, pressed: string, aria: string) {
  const on = statuses[item.lemma] === status;
  const toggle = Object.assign(document.createElement('button'), { type: 'button', className: 'toggle', textContent: on ? pressed : label });
  toggle.setAttribute('aria-pressed', String(on));
  toggle.setAttribute('aria-label', `${aria}: ${item.french}`);
  toggle.title = status === 'saved' ? (on ? STATUS_TIPS.saved : STATUS_TIPS.save) : on ? STATUS_TIPS.known : STATUS_TIPS.know;
  toggle.addEventListener('click', async () => {
    const next = on ? 'seen' : status;
    if (await toTab({ type: 'vocab-set', key: item.key, status: next }).catch(() => false)) {
      statuses[item.lemma] = next;
      void refresh();
    }
  });
  return toggle;
}

const FOLDED = new Set([PAGE_CATEGORY.id, EASY_CATEGORY.id]);
let foldedOpen = false;

/** Words `spoken` can read are read aloud on a click as well as found on the page. */
function wordList(items: PageVocab['items'], spoken: (text: string) => boolean = () => false): HTMLUListElement {
  const ul = document.createElement('ul');
  for (const item of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'row';
    button.title = `${item.gloss} — click to find it on the page`;
    const fr = Object.assign(document.createElement('span'), { className: 'fr' });
    fr.append(...rubyNodes(document, item.french));
    setDirection(fr, item.french);
    // Changing the language weaves the page again, so the page's words are in the one chosen.
    fr.lang = language();
    const en = Object.assign(document.createElement('span'), { className: 'en', textContent: item.english.join(', ') });
    const count = Object.assign(document.createElement('span'), { className: 'count', textContent: `×${item.count}` });
    button.append(fr, en, count);
    button.addEventListener('click', () => {
      if (spoken(item.french)) {
        void speak(item.french);
        const info = { key: item.lemma, word: item.french, gloss: item.gloss, english: item.english[0] ?? '' };
        void vocabStore(language()).record([{ kind: 'listen', key: item.lemma, info }]);
      }
      void toTab({ type: 'reveal', key: item.key });
    });
    const li = document.createElement('li');
    li.append(button, statusToggle(item, 'saved', '☆', '★', 'Save to learn'), statusToggle(item, 'known', '✓', '✓', 'I know this'));
    ul.append(li);
  }
  return ul;
}

async function refresh() {
  const vocab = await pageVocab();
  render(vocab);
  if (vocab?.status === 'weaving') {
    startupPolls = 0;
    schedule();
  } else if (startupPolls > 0 && (!vocab || vocab.status === 'idle')) {
    // The injected script hasn't started weaving yet.
    startupPolls--;
    schedule();
  }
}

function schedule() {
  clearTimeout(pollTimer);
  pollTimer = setTimeout(() => void refresh(), POLL_MS);
}

const mode = (): Settings['mode'] => (modeInputs.find((i) => i.checked)?.value === 'lesson' ? 'lesson' : 'page');

function showModeSettings() {
  $('pageSettings').hidden = mode() !== 'page';
  $('lessonSettings').hidden = mode() !== 'lesson';
  $('lessonActions').hidden = mode() !== 'lesson';
}

/**
 * A changed setting starts a woven page again with it; `keepWords` leaves it woven.
 * A page that isn't woven waits for the Weave button.
 */
async function restart(patch: Partial<Settings>, keepWords = false) {
  await saveSettings(patch);
  showModeSettings();
  showScript();
  updateKeyNotice();
  if (tabId === undefined) return;
  const vocab = await pageVocab();
  if (!vocab || vocab.status === 'idle') return render(vocab);
  if (!(keepWords && vocab.weaving)) await toTab({ type: 'restore' });
  await startWeave();
}

// The weave is the same in both modes: when the new mode weaves too, the page keeps its words and only the widget changes.
for (const input of modeInputs) {
  input.addEventListener('change', () => void restart({ mode: mode() }, mode() === 'page'));
}
// Each language opens on the lesson last picked in it.
languageGroup.addEventListener('change', async () => {
  const lessonId = (await getSettings()).lessonByLanguage[language()] ?? 'none';
  await showLessons(language(), lessonId);
  await loadStatuses();
  void restart({ language: language(), lessonId });
});
// input moves the highlighted mark while dragging; change (on release) weaves again.
levelSlider.addEventListener('input', showLevel);
levelSlider.addEventListener('change', () => void restart({ level: level() }));
// Off: the lesson keeps the page's words, but the page goes back to English.
weavePageInput.addEventListener('change', () => void restart({ weavePage: weavePageInput.checked }));
// "New lesson…" opens the lessons page and leaves the lesson as it was.
lessonSelect.addEventListener('change', () => {
  if (lessonSelect.value !== NEW_LESSON) {
    chosenLesson = lessonSelect.value;
    return void restart({ lessonId: chosenLesson });
  }
  lessonSelect.value = chosenLesson;
  void browser.tabs.create({ url: browser.runtime.getURL(`/lessons.html?lang=${language()}`) });
});

markButton.addEventListener('click', async () => {
  const vocab = await pageVocab();
  if (vocab?.marked) {
    await toTab({ type: 'unmark' });
    await refresh();
  } else {
    await startWeave({ mark: true });
  }
});

weaveWordsButton.addEventListener('click', async () => {
  const vocab = await pageVocab();
  if (vocab?.weaving && (vocab.status === 'weaving' || vocab.status === 'done')) {
    await toTab({ type: 'unweave' });
    await refresh();
  } else {
    await startWeave({ weave: true });
  }
});

weaveButton.addEventListener('click', async () => {
  const vocab = await pageVocab();
  if (vocab?.status === 'confirm') {
    await toTab({ type: 'confirm-weave' });
    startupPolls = STARTUP_POLLS;
    schedule();
  } else {
    await startWeave();
  }
});

restoreButton.addEventListener('click', async () => {
  await toTab({ type: 'restore' });
  await refresh();
});

// Reloading closes this popup; tabs woven by the old version need a page reload.
reloadButton.addEventListener('click', () => browser.runtime.reload());

$<HTMLAnchorElement>('options').addEventListener('click', (e) => {
  e.preventDefault();
  void browser.runtime.openOptionsPage();
});

$<HTMLAnchorElement>('progress').addEventListener('click', (e) => {
  e.preventDefault();
  void browser.tabs.create({ url: browser.runtime.getURL('/progress.html') });
});

$<HTMLAnchorElement>('words').addEventListener('click', (e) => {
  e.preventDefault();
  void browser.tabs.create({ url: browser.runtime.getURL('/words.html') });
});

function updateKeyNotice() {
  if (hasKey) return showNotice('');
  showNotice(`Add an ${PROVIDER_NAMES[provider]} API key in Options to weave and to see the lesson.`);
}

const language = () => languageGroup.querySelector<HTMLInputElement>('input:checked')?.value ?? '';
const level = (): Level => LEVELS[Number(levelSlider.value)] ?? LEVELS[0]!;

/** One language as a flag to click; its name is the radio's label for screen readers and the tooltip. */
function flagOption(lang: LanguageConfig, checked: boolean) {
  const label = Object.assign(document.createElement('label'), { title: lang.displayName });
  const input = Object.assign(document.createElement('input'), { type: 'radio', name: 'language', value: lang.code, checked });
  const flag = Object.assign(document.createElement('span'), { textContent: lang.flag, ariaHidden: 'true' });
  const name = Object.assign(document.createElement('span'), { className: 'visually-hidden', textContent: lang.displayName });
  label.append(input, flag, name);
  return label;
}

document.head.append(Object.assign(document.createElement('style'), { textContent: scriptStyles(false) }));

/** As the widget last showed each language's script and romanisation (`Settings.scriptViews`). */
let scriptViews: Partial<Record<string, ScriptView>> = {};

/** The word list's script and romanisation as the page shows them, at its level: the lesson's in lesson mode, the reader's in page mode. */
function showScript() {
  const lang = languages[language()];
  const lesson = mode() === 'lesson' ? shownLessons.find((l) => l.id === lessonSelect.value) : undefined;
  const view = lang && scriptViewFor(lang, lesson?.level ?? level(), scriptViews);
  if (view) document.documentElement.setAttribute(SCRIPT_ATTR, view);
  else document.documentElement.removeAttribute(SCRIPT_ATTR);
}

function showLevel() {
  levelSlider.setAttribute('aria-valuetext', level());
  [...levelMarks.children].forEach((mark, i) => mark.classList.toggle('current', i === Number(levelSlider.value)));
}

/** The dropdown's option that opens the lessons page, to write one. */
const NEW_LESSON = 'new';
/** The language's lessons as the dropdown lists them: the course's, then the reader's own. */
let shownLessons: SyllabusLesson[] = [];
let chosenLesson = '';

async function showLessons(language: string, lessonId: string) {
  const course = lessonsFor(language);
  const own = await customLessonsFor(language);
  shownLessons = [...course, ...own];
  const option = (l: SyllabusLesson) => new Option(readingsInBrackets(l.title), l.id);
  const yours = Object.assign(document.createElement('optgroup'), { label: 'Your lessons' });
  yours.append(...own.map(option), new Option('New lesson…', NEW_LESSON));
  lessonSelect.replaceChildren(...course.map(option), yours);
  // 'none', or a lesson in another language, is the first one, as the background takes it.
  chosenLesson = shownLessons.some((l) => l.id === lessonId) ? lessonId : (shownLessons[0]?.id ?? '');
  lessonSelect.value = chosenLesson;
}

async function showTodaySpend() {
  const stored = await browser.storage.local.get(SPEND_KEY);
  const usd = (stored[SPEND_KEY] as DailySpend | undefined)?.[dayKey(new Date())] ?? 0;
  const today = $<HTMLSpanElement>('today');
  today.textContent = `Today ${formatUsd(usd)}`;
  today.title = 'API spend today (priced from usage; unknown models not counted)';
}

async function init() {
  void showTodaySpend();
  const settings = await getSettings();
  hasKey = Boolean(apiKeyFor(settings));
  provider = settings.provider;
  scriptViews = settings.scriptViews;
  for (const input of modeInputs) input.checked = input.value === settings.mode;
  weavePageInput.checked = settings.weavePage;
  levelSlider.max = String(LEVELS.length - 1);
  levelSlider.value = String(Math.max(0, LEVELS.indexOf(settings.level)));
  levelMarks.replaceChildren(...LEVELS.map((l) => Object.assign(document.createElement('span'), { textContent: l })));
  showLevel();
  languageGroup.replaceChildren(...Object.values(languages).map((l) => flagOption(l, l.code === settings.language)));
  await showLessons(settings.language, settings.lessonId);
  showModeSettings();
  showScript();
  updateKeyNotice();

  const config: ResponseFor['weave-config'] = await browser.runtime.sendMessage({ type: 'weave-config', buildId: BUILD_ID });
  if (!config.ok && config.code === 'stale') return showStale(config.error);

  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  tabId = tab?.id;
  if (tabId === undefined) return;

  await loadStatuses();
  browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && vocabKey(language()) in changes) void loadStatuses().then(refresh);
  });

  // Opening the popup changes nothing on the page: the Weave button does.
  const vocab = await pageVocab();
  render(vocab);
  if (vocab?.status === 'weaving') schedule();
}

void init();
