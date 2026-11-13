import { browser } from 'wxt/browser';
import { BUILD_ID } from '@/src/build';
import { dayKey, formatUsd, SPEND_KEY, type DailySpend } from '@/src/cost';
import { setDirection } from '@/src/direction';
import { LEVELS, type Level } from '@/src/grammar';
import { icon, iconButton } from '@/src/icons';
import { languages, scriptViewFor, type LanguageConfig } from '@/src/languages';
import { askToFollowTabs, canFollowTabs, stopFollowingTabs } from '@/src/follow';
import { EASY_CATEGORY } from '@/src/lessons/easy';
import { PAGE_CATEGORY } from '@/src/lessons/pageWords';
import type { PageVocab, ResponseFor, TabRequest, TabResponseFor } from '@/src/messages';
import { looksDark, startPageTheme, themeSwitch } from '@/src/pageTheme';
import { dayOf } from '@/src/practice/ledger';
import { lessonStatuses, loadProgress, type LessonStatus } from '@/src/progress/load';
import { streaks } from '@/src/progress/progress';
import { apiKeyFor, PROVIDER_NAMES } from '@/src/providers/route';
import type { ChatProvider } from '@/src/providers/types';
import { recordingKey } from '@/src/recordings';
import { readingsInBrackets, rubyNodes, SCRIPT_ATTR, scriptStyles, type ScriptView } from '@/src/ruby';
import { getSettings, saveSettings, type Settings } from '@/src/settings';
import { lessonsFor, type SyllabusLesson } from '@/src/syllabus';
import { customLessonsFor } from '@/src/syllabus/stored';
import { STATUS_TIPS, vocabKey, vocabStore, type WordStatus } from '@/src/vocab/store';

startPageTheme();

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const languageGroup = $<HTMLDivElement>('languages');
const levelGroup = $<HTMLDivElement>('levels');
const lessonPicked = $<HTMLButtonElement>('lessonPicked');
const lessonList = $<HTMLDivElement>('lessonList');
const weavePageInput = $<HTMLInputElement>('weavePage');
const markButton = $<HTMLButtonElement>('markPage');
const weaveWordsButton = $<HTMLButtonElement>('weaveWords');
const modeInputs = [...document.querySelectorAll<HTMLInputElement>('input[name="mode"]')];
const stats = $<HTMLDivElement>('stats');
const summary = $<HTMLParagraphElement>('summary');
const cost = $<HTMLParagraphElement>('cost');
const notice = $<HTMLParagraphElement>('notice');
const list = $<HTMLDivElement>('list');
const weaveButton = $<HTMLButtonElement>('weave');
const restoreButton = $<HTMLButtonElement>('restore');
const reloadButton = $<HTMLButtonElement>('reloadExtension');
const followInput = $<HTMLInputElement>('followTabs');
const themeButton = $<HTMLButtonElement>('theme');

const POLL_MS = 500;
/** After starting a weave, how many polls may still find no weave running before giving up. */
const STARTUP_POLLS = 10;
let tabId: number | undefined;
let hasKey = false;
let provider: ChatProvider = 'anthropic';
let pollTimer: ReturnType<typeof setTimeout> | undefined;
let startupPolls = 0;
/** API spend today, for the stats row. */
let spentToday = 0;
/** Lesson mode: exercises answered today and the days in a row, for the stats row. */
let practice = { today: 0, streak: 0 };

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
    cost.textContent = `Estimated ${formatUsd(e.usd)} for the page (${e.requests} requests)`;
  }
}

/** A figure in the stats row, under its label; `green` for the reader's own practice. */
function stat(label: string, value: string, title = '', green = false) {
  const box = Object.assign(document.createElement('div'), { className: `stat${green ? ' green' : ''}`, title });
  box.append(Object.assign(document.createElement('span'), { className: 'label', textContent: label }), Object.assign(document.createElement('b'), { textContent: value }));
  return box;
}

function renderStats(vocab: PageVocab | null) {
  const today = stat('today', formatUsd(spentToday), 'API spend today (priced from usage; unknown models not counted)');
  if (mode() === 'lesson') {
    return stats.replaceChildren(
      stat('today', String(practice.today), 'Exercises answered today', true),
      stat('in a row', `${practice.streak} day${practice.streak === 1 ? '' : 's'}`, 'Days practised in a row'),
      today,
    );
  }
  const woven = vocab?.weaving && vocab.status !== 'idle' && vocab.status !== 'confirm';
  stats.replaceChildren(
    ...(woven ? [stat('woven', String(vocab.wovenWords), 'Words woven into this page'), stat('this page', formatUsd(vocab.spentUsd ?? 0), 'Spent on this page')] : []),
    today,
  );
}

function render(vocab: PageVocab | null) {
  renderStats(vocab);
  const active = vocab && (vocab.status === 'weaving' || vocab.status === 'done');
  weaveButton.hidden = Boolean(active);
  restoreButton.hidden = !active;
  const lesson = mode() === 'lesson';
  weaveButton.textContent = lesson || !weavePageInput.checked ? 'Open the lesson' : 'Weave this page';
  restoreButton.textContent = lesson || !weavePageInput.checked ? 'Close the lesson' : 'Restore English';
  markButton.textContent = vocab?.marked ? 'Remove marks' : 'Mark this page';
  weaveWordsButton.textContent = active && vocab.weaving ? 'Remove words' : 'Weave this page';
  weaveWordsButton.disabled = vocab?.status === 'confirm' || vocab?.status === 'weaving';

  if (!vocab || vocab.status === 'idle') {
    summary.textContent = lesson ? '' : 'This page isn’t woven.';
    cost.textContent = '';
    list.replaceChildren();
    return;
  }

  if (!vocab.weaving) {
    summary.textContent = 'The lesson is open in the corner of the page.';
    cost.textContent = '';
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
  const words = `${percent(share)} of the page woven, aiming for ${percent(vocab.density)}`;
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
    details.append(label, wordList(folded));
    children.push(details);
  }
  list.replaceChildren(...children);
}

/** Each word read aloud, fetched when its play button is clicked (or the fold of page words is opened), once. */
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

/** Save (a star) or known (a tick) on a row: set on the page, which keeps the sentence the word is in. */
function statusToggle(item: PageVocab['items'][number], status: WordStatus, aria: string) {
  const on = statuses[item.lemma] === status;
  const toggle = Object.assign(document.createElement('button'), { type: 'button', className: status === 'known' ? 'toggle known' : 'toggle' });
  iconButton(toggle, status === 'known' ? 'check' : 'star', `${aria}: ${item.french}`);
  toggle.setAttribute('aria-pressed', String(on));
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

/** The words, each with a play button where it can be heard; a click on a word finds it on the page. */
function wordList(items: PageVocab['items']): HTMLUListElement {
  const ul = document.createElement('ul');
  for (const item of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'row';
    button.title = `${item.gloss} · ${item.count}× on the page · click to find it`;
    const fr = Object.assign(document.createElement('span'), { className: 'fr' });
    fr.append(...rubyNodes(document, item.french));
    setDirection(fr, item.french);
    // Changing the language weaves the page again, so the page's words are in the one chosen.
    fr.lang = language();
    const en = Object.assign(document.createElement('span'), { className: 'en', textContent: item.english.join(', ') });
    button.append(fr, en);
    button.addEventListener('click', () => void toTab({ type: 'reveal', key: item.key }));
    const li = document.createElement('li');
    if (sayable(item.french)) {
      const say = Object.assign(document.createElement('button'), { type: 'button', className: 'say' });
      iconButton(say, 'play', `Listen: ${item.french}`, 9);
      say.addEventListener('click', () => {
        void speak(item.french);
        const info = { key: item.lemma, word: item.french, gloss: item.gloss, english: item.english[0] ?? '' };
        void vocabStore(language()).record([{ kind: 'listen', key: item.lemma, info }]);
      });
      li.append(say);
    }
    li.append(button, statusToggle(item, 'saved', 'Save to learn'), statusToggle(item, 'known', 'I know this'));
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
  $('lessons').hidden = mode() !== 'lesson';
  void showFollow();
}

/** Lesson mode: whether every site is allowed (`src/follow.ts`), so the lesson follows the reader. */
async function showFollow() {
  followInput.checked = await canFollowTabs();
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
  if (tabId === undefined) return render(null);
  const vocab = await pageVocab();
  if (!vocab || vocab.status === 'idle') return render(vocab);
  if (!(keepWords && vocab.weaving)) await toTab({ type: 'restore' });
  await startWeave();
}

// The weave is the same in both modes: when the new mode weaves too, the page keeps its words and only the widget changes.
// Lesson mode asks for every site in the same click; the setting is saved first, since the prompt can close the popup.
for (const input of modeInputs) {
  input.addEventListener('change', () => {
    void restart({ mode: mode() }, mode() === 'page');
    if (mode() === 'lesson') void askToFollowTabs().then(showFollow, () => {});
  });
}
// Chrome asks only in answer to the click, so the request comes before anything is awaited.
followInput.addEventListener('change', () => {
  const asked = followInput.checked ? askToFollowTabs() : stopFollowingTabs();
  void asked.then(showFollow, showFollow);
});
// Each language opens on the lesson last picked in it.
languageGroup.addEventListener('change', async () => {
  const lessonId = (await getSettings()).lessonByLanguage[language()] ?? 'none';
  await showLessons(language(), lessonId);
  await loadStatuses();
  void restart({ language: language(), lessonId });
});
levelGroup.addEventListener('change', () => void restart({ level: level() }));
// Off: the lesson keeps the page's words, but the page goes back to English.
weavePageInput.addEventListener('change', () => void restart({ weavePage: weavePageInput.checked }));

lessonPicked.addEventListener('click', () => {
  const open = lessonList.hidden;
  lessonList.hidden = !open;
  lessonPicked.setAttribute('aria-expanded', String(open));
  if (open) lessonList.querySelector<HTMLElement>('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' });
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

/** The moon in the corner: light or dark here, on the page and on every page of Language Weave. */
const drawTheme = themeSwitch(themeButton, 15);
// The page's widget follows at once (other tabs take it the next time they're woven).
themeButton.addEventListener('click', () => {
  if (tabId !== undefined) void toTab({ type: 'set-theme', theme: looksDark() ? 'dark' : 'light' }).catch(() => {});
});

const openPage = (id: string, path: string) =>
  $<HTMLAnchorElement>(id).addEventListener('click', (e) => {
    e.preventDefault();
    void browser.tabs.create({ url: browser.runtime.getURL(path as '/progress.html') });
  });
$<HTMLAnchorElement>('options').addEventListener('click', (e) => {
  e.preventDefault();
  void browser.runtime.openOptionsPage();
});
openPage('progress', '/progress.html');
openPage('words', '/words.html');
$<HTMLAnchorElement>('lessons').addEventListener('click', (e) => {
  e.preventDefault();
  void browser.tabs.create({ url: browser.runtime.getURL(`/lessons.html?lang=${language()}`) });
});

function updateKeyNotice() {
  if (hasKey) return showNotice('');
  showNotice(`Add an ${PROVIDER_NAMES[provider]} API key in Options to weave and to see the lesson.`);
}

const language = () => languageGroup.querySelector<HTMLInputElement>('input:checked')?.value ?? '';
const level = (): Level => (levelGroup.querySelector<HTMLInputElement>('input:checked')?.value as Level | undefined) ?? LEVELS[0]!;

/** How many language tiles show before "more": the rest open out on a click. */
const TILES_SHOWN = 4;
let allTiles = false;

/** One language as a tile: its code and hello in it; its name is the radio's label for screen readers and the tooltip. */
function languageTile(lang: LanguageConfig, checked: boolean) {
  const label = Object.assign(document.createElement('label'), { title: lang.displayName });
  const input = Object.assign(document.createElement('input'), { type: 'radio', name: 'language', value: lang.code, checked });
  input.setAttribute('aria-label', lang.displayName);
  const code = Object.assign(document.createElement('b'), { textContent: lang.code.toUpperCase(), ariaHidden: 'true' });
  const hello = Object.assign(document.createElement('small'), { textContent: lang.greeting, lang: lang.bcp47 });
  hello.setAttribute('aria-hidden', 'true');
  label.append(input, code, hello);
  return label;
}

/** The first few languages and the one picked; "+N" opens out the rest. */
function showLanguages(current: string) {
  const all = Object.values(languages);
  const first = all.slice(0, TILES_SHOWN);
  const shown = allTiles ? all : first.some((l) => l.code === current) ? first : [...first.slice(0, -1), languages[current]!].filter(Boolean);
  const tiles: HTMLElement[] = shown.map((l) => languageTile(l, l.code === current));
  if (!allTiles && all.length > shown.length) {
    const more = Object.assign(document.createElement('button'), { type: 'button', className: 'more' });
    more.append(Object.assign(document.createElement('b'), { textContent: `+${all.length - shown.length}` }), Object.assign(document.createElement('small'), { textContent: 'more' }));
    more.setAttribute('aria-label', `${all.length - shown.length} more languages`);
    more.addEventListener('click', () => {
      allTiles = true;
      showLanguages(language());
    });
    tiles.push(more);
  }
  languageGroup.replaceChildren(...tiles);
}

/** The levels as a row of choices. */
function showLevels(current: Level) {
  levelGroup.replaceChildren(
    ...LEVELS.map((l) => {
      const label = document.createElement('label');
      label.append(Object.assign(document.createElement('input'), { type: 'radio', name: 'level', value: l, checked: l === current }), l);
      return label;
    }),
  );
}

document.head.append(Object.assign(document.createElement('style'), { textContent: scriptStyles(false) }));

/** As the widget last showed each language's script and romanisation (`Settings.scriptViews`). */
let scriptViews: Partial<Record<string, ScriptView>> = {};

/** The word list's script and romanisation as the page shows them, at its level: the lesson's in lesson mode, the reader's in page mode. */
function showScript() {
  const lang = languages[language()];
  const lesson = mode() === 'lesson' ? shownLessons.find((l) => l.id === chosenLesson) : undefined;
  const view = lang && scriptViewFor(lang, lesson?.level ?? level(), scriptViews);
  if (view) document.documentElement.setAttribute(SCRIPT_ATTR, view);
  else document.documentElement.removeAttribute(SCRIPT_ATTR);
}

/** The language's lessons as the list shows them: the course's, then the reader's own. */
let shownLessons: SyllabusLesson[] = [];
let chosenLesson = '';
let statusOf = new Map<string, LessonStatus>();

const STATUS_LABELS: Record<LessonStatus, string> = { learned: 'learned', practising: 'practising', 'needs-work': 'needs work', 'not-yet': '' };
const short = (level: string) => level.replace(/^CEFR\s*/i, '');

async function showLessons(language: string, lessonId: string) {
  const course = lessonsFor(language);
  const own = await customLessonsFor(language);
  shownLessons = [...course, ...own];
  // 'none', or a lesson in another language, is the first one, as the background takes it.
  chosenLesson = shownLessons.some((l) => l.id === lessonId) ? lessonId : (shownLessons[0]?.id ?? '');
  drawLessons(course, own);
  void loadProgress(language).then((loaded) => {
    statusOf = lessonStatuses(loaded);
    const today = dayOf(new Date());
    practice = { today: loaded.ledger.days[today]?.total ?? 0, streak: streaks(loaded.ledger.days, today).current };
    drawLessons(course, own);
    if (mode() === 'lesson') void refresh();
  });
}

function drawLessons(course: SyllabusLesson[], own: SyllabusLesson[]) {
  const picked = shownLessons.find((l) => l.id === chosenLesson);
  lessonPicked.replaceChildren(
    Object.assign(document.createElement('span'), { className: 'lesson-level', textContent: picked ? short(picked.level) : '' }),
    Object.assign(document.createElement('span'), { className: 'title', textContent: picked ? readingsInBrackets(picked.title) : 'No lessons yet' }),
    icon(document, 'chevron', 14),
  );
  const option = (l: SyllabusLesson) => {
    const status = statusOf.get(l.id) ?? 'not-yet';
    const b = Object.assign(document.createElement('button'), { type: 'button', className: 'lesson-option' });
    b.setAttribute('aria-current', String(l.id === chosenLesson));
    b.append(
      Object.assign(document.createElement('span'), { className: `dot ${status}` }),
      Object.assign(document.createElement('span'), { className: 'name', textContent: readingsInBrackets(l.title) }),
      Object.assign(document.createElement('span'), { className: 'state', textContent: STATUS_LABELS[status] }),
    );
    b.title = `${short(l.level)} · ${STATUS_LABELS[status] || 'not started'}`;
    b.addEventListener('click', () => {
      chosenLesson = l.id;
      lessonList.hidden = true;
      lessonPicked.setAttribute('aria-expanded', 'false');
      drawLessons(course, own);
      void restart({ lessonId: chosenLesson });
    });
    return b;
  };
  // "New lesson…" opens the lessons page and leaves the lesson as it was.
  const write = Object.assign(document.createElement('button'), { type: 'button', className: 'lesson-option new', textContent: 'New lesson…' });
  write.addEventListener('click', () => void browser.tabs.create({ url: browser.runtime.getURL(`/lessons.html?lang=${language()}`) }));
  const levels = [...new Set(course.map((l) => l.level))];
  lessonList.replaceChildren(
    ...levels.flatMap((lv) => [Object.assign(document.createElement('h3'), { textContent: short(lv) }), ...course.filter((l) => l.level === lv).map(option)]),
    ...(own.length ? [Object.assign(document.createElement('h3'), { textContent: 'Your lessons' }), ...own.map(option)] : []),
    write,
  );
}

async function showTodaySpend() {
  const stored = await browser.storage.local.get(SPEND_KEY);
  spentToday = (stored[SPEND_KEY] as DailySpend | undefined)?.[dayKey(new Date())] ?? 0;
}

async function init() {
  drawTheme();
  await showTodaySpend();
  const settings = await getSettings();
  hasKey = Boolean(apiKeyFor(settings));
  provider = settings.provider;
  scriptViews = settings.scriptViews;
  for (const input of modeInputs) input.checked = input.value === settings.mode;
  weavePageInput.checked = settings.weavePage;
  showLevels(settings.level);
  showLanguages(settings.language);
  await showLessons(settings.language, settings.lessonId);
  showModeSettings();
  showScript();
  updateKeyNotice();
  render(null);
  drawTheme();

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
