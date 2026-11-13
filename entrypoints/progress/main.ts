import { browser } from 'wxt/browser';
import { startPageTheme, themeSwitch } from '@/src/pageTheme';
import { setDirection } from '@/src/direction';
import { languages, scriptViewFor } from '@/src/languages';
import { dayOf, type Ledger } from '@/src/practice/ledger';
import { loadProgress } from '@/src/progress/load';
import {
  calendar,
  currentLevel,
  DAY_GOAL,
  lessonProgress,
  levels,
  milestones,
  needsWork,
  recap,
  streaks,
  type Item,
  type LessonProgress,
  type Span,
} from '@/src/progress/progress';
import { rubyNodes, SCRIPT_ATTR, scriptStyles } from '@/src/ruby';
import { getSettings, type Settings } from '@/src/settings';

startPageTheme();

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const languageSelect = $<HTMLSelectElement>('language');

document.head.append(Object.assign(document.createElement('style'), { textContent: scriptStyles(false) }));

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Target-language text, with its readings and direction. */
function inLanguage(text: string, className = ''): HTMLSpanElement {
  const span = el('span', className);
  span.append(...rubyNodes(document, text));
  return setDirection(span, text);
}

const short = (level: string) => level.replace(/^CEFR\s*/i, '');
const percent = (s: Span) => (s.total ? `${Math.round((s.right / s.total) * 100)}% right` : '');
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const dayLabel = (day: string) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
};

function showRecap(ledger: Ledger, lessons: LessonProgress[], today: string) {
  const r = recap(ledger, lessons, today);
  const s = streaks(ledger.days, today);
  const week = r.week.total
    ? `This week: ${plural(r.week.total, 'exercise')} on ${plural(r.week.days, 'day')}, ${percent(r.week)}.`
    : 'Nothing practised this week yet.';
  const last = r.lastWeek.total ? ` The week before: ${plural(r.lastWeek.total, 'exercise')}, ${percent(r.lastWeek)}.` : '';
  $('recapWeek').textContent = r.all.total ? week + last : 'Nothing practised yet. Open a lesson and try its Practice tab.';
  const fresh = [r.newTopics && plural(r.newTopics, 'topic'), r.newWords && plural(r.newWords, 'word')].filter(Boolean);
  $('recapNew').textContent = fresh.length ? `Right for the first time this week: ${fresh.join(' and ')}.` : '';
  const stat = (value: string | number, label: string, className = '') => {
    const box = el('div', `stat ${className}`.trim());
    box.append(el('strong', '', String(value)), el('span', '', label));
    return box;
  };
  $('stats').replaceChildren(
    stat(s.current, 'day streak', s.current ? 'lit' : ''),
    stat(s.best, 'best streak'),
    stat(r.learnedTopics, 'topics learned'),
    stat(r.learnedWords, 'words learned'),
    stat(r.needsWork, 'need work', r.needsWork ? 'warn' : ''),
    stat(r.all.total, `exercises in all${r.all.total ? `, ${percent(r.all)}` : ''}`),
  );
}

function showCalendar(ledger: Ledger, today: string) {
  const weeks = calendar(ledger.days, today);
  const grid = $('calendar');
  const active = weeks.flat().filter((d) => d.total).length;
  grid.setAttribute('aria-label', `${plural(active, 'day')} practised in the last ${weeks.length} weeks`);
  grid.replaceChildren(
    ...weeks.map((week) => {
      const column = el('div', 'week');
      for (const d of week) {
        const cell = el('span', `cell shade-${d.shade}${d.future ? ' future' : ''}${d.day === today ? ' today' : ''}`);
        if (!d.future) cell.title = `${dayLabel(d.day)}: ${d.total ? `${plural(d.total, 'exercise')}, ${d.right} right` : 'none'}`;
        column.append(cell);
      }
      return column;
    }),
  );
  $('goal').textContent = ` · A day counts towards a streak with ${DAY_GOAL} exercises.`;
}

function showLevels(lessons: LessonProgress[]) {
  const all = levels(lessons);
  const current = currentLevel(all);
  $('levels').replaceChildren(
    ...all.map((l) => {
      const row = el('div', `level${l === current ? ' current' : ''}`);
      const head = el('div', 'level-head');
      head.append(el('strong', '', short(l.level)), el('span', 'muted', `${l.done} of ${plural(l.lessons, 'lesson')} done · ${l.learned} of ${plural(l.topics, 'topic')} learned`));
      if (l === current) head.append(el('span', 'badge', 'working on'));
      const bar = el('div', 'bar');
      const fill = el('span');
      fill.style.width = `${l.topics ? (l.learned / l.topics) * 100 : 0}%`;
      bar.append(fill);
      row.append(head, bar);
      return row;
    }),
  );
}

function showMilestones(ledger: Ledger, lessons: LessonProgress[], today: string) {
  $('milestones').replaceChildren(
    ...milestones(ledger, lessons, today).map((m) => {
      const li = el('li', m.reached ? 'reached' : '');
      li.append(el('span', `dot${m.reached ? ' learned' : ''}`), el('span', '', m.title));
      if (m.on) li.append(el('span', 'muted', dayLabel(m.on)));
      return li;
    }),
  );
}

const tallyText = (i: Item) => (i.tally ? `${i.tally.right} right, ${i.tally.wrong} wrong` : '');

function showNeedsWork(lessons: LessonProgress[]) {
  const titles = new Map(lessons.map((p) => [p.lesson.id, p.lesson.title]));
  const flagged = needsWork(lessons).slice(0, 15);
  const list = $('needsWork');
  if (!flagged.length) return list.replaceChildren(el('li', 'muted', 'Nothing to work on yet: topics and words answered wrong show here.'));
  list.replaceChildren(
    ...flagged.map((f) => {
      const li = el('li');
      li.append(el('span', 'kind', f.kind), f.kind === 'word' ? inLanguage(f.label, 'what') : el('span', 'what', f.label));
      if (f.gloss) li.append(el('span', 'muted', f.gloss));
      li.append(el('span', 'muted where', `${titles.get(f.lessonId) ?? f.lessonId} · ${tallyText(f)}`));
      return li;
    }),
  );
}

function itemRow(item: Item, word: boolean) {
  const li = el('li', item.standing ?? 'unseen');
  li.title = tallyText(item) || 'Not practised yet';
  li.append(el('span', `dot ${item.standing ?? ''}`.trim()), word ? inLanguage(item.label) : el('span', '', item.label));
  if (item.gloss) li.append(el('span', 'muted', item.gloss));
  return li;
}

function showLessons(lessons: LessonProgress[]) {
  $('lessons').replaceChildren(
    ...lessons.map((p) => {
      const details = el('details', 'lesson');
      const learned = p.topics.filter((t) => t.standing === 'learned').length;
      const state = p.done ? 'done' : p.answered ? `${learned} of ${plural(p.topics.length, 'topic')} learned` : 'not started';
      const summary = el('summary');
      summary.append(el('span', 'title', p.lesson.title), el('span', 'muted', `${short(p.lesson.level)} · ${state}`));
      if (p.done) summary.append(el('span', 'badge', 'done'));
      details.append(summary);
      if (!p.topics.length && !p.words.length) {
        details.append(el('p', 'muted', 'Open this lesson once to see its topics and words here.'));
        return details;
      }
      const topics = el('ul', 'items');
      topics.append(...p.topics.map((t) => itemRow(t, false)));
      const words = el('ul', 'items words');
      words.append(...p.words.map((w) => itemRow(w, true)));
      details.append(el('h3', '', 'Topics'), topics, el('h3', '', 'Words'), words);
      return details;
    }),
  );
}

let settings: Settings;

async function render() {
  const lang = languageSelect.value;
  const config = languages[lang];
  const { ledger, kits, lessons: course } = await loadProgress(lang);
  if (languageSelect.value !== lang) return;
  const today = dayOf(new Date());
  const lessons = course.map((l) => lessonProgress(l, kits[l.id], ledger.lessons[l.id]));
  const view = config && scriptViewFor(config, currentLevel(levels(lessons))?.level ?? 'A1', settings.scriptViews ?? {});
  if (view) document.documentElement.setAttribute(SCRIPT_ATTR, view);
  else document.documentElement.removeAttribute(SCRIPT_ATTR);
  showRecap(ledger, lessons, today);
  showCalendar(ledger, today);
  showLevels(lessons);
  showMilestones(ledger, lessons, today);
  showNeedsWork(lessons);
  // Open lessons stay open when it's drawn again.
  const open = new Set([...document.querySelectorAll<HTMLDetailsElement>('details.lesson[open] .title')].map((t) => t.textContent ?? ''));
  showLessons(lessons);
  for (const d of document.querySelectorAll<HTMLDetailsElement>('details.lesson')) {
    if (open.has(d.querySelector('.title')?.textContent ?? '')) d.open = true;
  }
}

async function init() {
  themeSwitch($('theme'));
  settings = await getSettings();
  languageSelect.replaceChildren(
    ...Object.values(languages).map((l) => Object.assign(el('option', '', `${l.flag} ${l.displayName}`), { value: l.code, selected: l.code === settings.language })),
  );
  languageSelect.addEventListener('change', () => void render());
  // An exercise answered in another tab shows here at once.
  browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (`practice-ledger|${languageSelect.value}` in changes || 'kits' in changes)) void render();
  });
  await render();
}

void init();
