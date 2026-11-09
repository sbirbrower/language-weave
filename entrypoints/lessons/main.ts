import { browser } from 'wxt/browser';
import { BUILD_ID } from '@/src/build';
import { formatUsd } from '@/src/cost';
import { setDirection } from '@/src/direction';
import { languages } from '@/src/languages';
import type { ResponseFor } from '@/src/messages';
import { CEFR } from '@/src/practice/exercises';
import { rubyNodes, scriptStyles } from '@/src/ruby';
import { getSettings, saveSettings } from '@/src/settings';
import type { CustomLesson, LessonRequest } from '@/src/syllabus/custom';
import { customLessonsFor, deleteCustomLesson, saveCustomLesson } from '@/src/syllabus/stored';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const languageSelect = $<HTMLSelectElement>('language');
const askForm = $<HTMLFormElement>('ask');
const topicInput = $<HTMLInputElement>('topic');
const levelSelect = $<HTMLSelectElement>('level');
const detailsInput = $<HTMLTextAreaElement>('details');
const writeButton = $<HTMLButtonElement>('write');
const askStatus = $<HTMLSpanElement>('askStatus');
const draftSection = $<HTMLElement>('draftSection');
const draftForm = $<HTMLFormElement>('draft');
const titleInput = $<HTMLInputElement>('title');
const pointsInput = $<HTMLTextAreaElement>('points');
const notesInput = $<HTMLTextAreaElement>('notes');
const draftStatus = $<HTMLSpanElement>('draftStatus');

document.head.append(Object.assign(document.createElement('style'), { textContent: scriptStyles(false) }));
for (const input of [topicInput, detailsInput, titleInput, pointsInput, notesInput]) input.dir = 'auto';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Text with target-language words in it, with their readings and direction. */
function withReadings(tag: 'li' | 'p', text: string): HTMLElement {
  const node = el(tag);
  node.append(...rubyNodes(document, text));
  return setDirection(node, text);
}

const lines = (text: string) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

/** The lesson written, to check before it's saved; it keeps its id when it's a saved one written again. */
let draft: CustomLesson | undefined;
/** The saved lesson being changed: written again, it keeps its id (and its practice). */
let changing: string | undefined;

function showDraft(lesson: CustomLesson) {
  draft = lesson;
  titleInput.value = lesson.title;
  $<HTMLParagraphElement>('draftLevel').textContent = `${languages[lesson.lang]?.displayName ?? lesson.lang}, ${lesson.level}`;
  pointsInput.value = lesson.points.join('\n');
  notesInput.value = lesson.notes ?? '';
  draftStatus.textContent = '';
  showLeftOut('');
  draftSection.hidden = false;
}

/** What of the request the lesson doesn't teach, as it was written; nothing for a saved lesson. */
function showLeftOut(text: string) {
  const p = $<HTMLParagraphElement>('leftOut');
  p.textContent = text && `Not in this lesson: ${text}`;
  p.hidden = !text;
}

function clearDraft() {
  draft = undefined;
  changing = undefined;
  draftSection.hidden = true;
  writeButton.textContent = 'Write the lesson';
}

askForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const request: LessonRequest = { lang: languageSelect.value, level: levelSelect.value, topic: topicInput.value.trim(), details: detailsInput.value.trim() };
  writeButton.disabled = true;
  askStatus.textContent = 'Writing… this takes up to half a minute.';
  try {
    const res: ResponseFor['custom-lesson'] = await browser.runtime.sendMessage({ type: 'custom-lesson', buildId: BUILD_ID, request, id: changing });
    if (!res.ok) throw new Error(res.error);
    showDraft(res.value.lesson);
    askStatus.textContent = res.value.usd === null ? 'Written.' : `Written for ${formatUsd(res.value.usd)}.`;
    showLeftOut(res.value.leftOut);
    draftSection.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    askStatus.textContent = err instanceof Error ? err.message : String(err);
  } finally {
    writeButton.disabled = false;
  }
});

draftForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!draft) return;
  const { notes: _, ...rest } = draft;
  const notes = lines(notesInput.value).join('\n');
  const lesson: CustomLesson = { ...rest, title: titleInput.value.trim(), points: lines(pointsInput.value), ...(notes ? { notes } : {}) };
  if (!lesson.points.length) return void (draftStatus.textContent = 'A lesson needs at least one point.');
  await saveCustomLesson(lesson);
  // The popup opens on it next, in lesson mode.
  await saveSettings({ language: lesson.lang, lessonId: lesson.id });
  clearDraft();
  askForm.reset();
  levelSelect.value = lesson.request.level;
  askStatus.textContent = `Saved “${lesson.title}”: pick Lesson in the popup to start it.`;
  await showSaved();
});

$<HTMLButtonElement>('discard').addEventListener('click', () => {
  clearDraft();
  askStatus.textContent = '';
});

/** The saved lesson back in the forms: its request to write again, the lesson itself to change by hand. */
function change(lesson: CustomLesson) {
  changing = lesson.id;
  topicInput.value = lesson.request.topic;
  levelSelect.value = lesson.request.level;
  detailsInput.value = lesson.request.details;
  writeButton.textContent = 'Write it again';
  askStatus.textContent = '';
  showDraft(lesson);
  askForm.scrollIntoView({ behavior: 'smooth' });
}

async function remove(lesson: CustomLesson) {
  if (!confirm(`Delete “${lesson.title}”? Its practice so far stays on the Progress page.`)) return;
  await deleteCustomLesson(lesson.id);
  if ((await getSettings()).lessonId === lesson.id) await saveSettings({ lessonId: 'none' });
  if (changing === lesson.id) clearDraft();
  await showSaved();
}

async function showSaved() {
  const lang = languageSelect.value;
  const own = await customLessonsFor(lang);
  if (languageSelect.value !== lang) return;
  $<HTMLParagraphElement>('none').hidden = own.length > 0;
  $<HTMLDivElement>('saved').replaceChildren(
    ...own.map((lesson) => {
      const details = el('details', 'lesson');
      const summary = el('summary');
      summary.append(el('span', 'title', lesson.title), el('span', 'muted', ` ${lesson.level.replace(/^CEFR\s*/i, '')}`));
      const points = el('ul');
      points.append(...lesson.points.map((p) => withReadings('li', p)));
      const actions = el('div', 'actions');
      const changeButton = el('button', 'quiet', 'Change');
      changeButton.type = 'button';
      changeButton.addEventListener('click', () => change(lesson));
      const deleteButton = el('button', 'quiet', 'Delete');
      deleteButton.type = 'button';
      deleteButton.addEventListener('click', () => void remove(lesson));
      actions.append(changeButton, deleteButton);
      details.append(summary, points);
      if (lesson.notes) details.append(el('p', 'muted', 'Notes for the writers:'), ...lines(lesson.notes).map((n) => withReadings('p', n)));
      details.append(actions);
      return details;
    }),
  );
}

languageSelect.addEventListener('change', () => {
  clearDraft();
  askStatus.textContent = '';
  void showSaved();
});

async function init() {
  const settings = await getSettings();
  const asked = new URLSearchParams(location.search).get('lang');
  languageSelect.replaceChildren(...Object.values(languages).map((l) => new Option(`${l.flag} ${l.displayName}`, l.code)));
  languageSelect.value = asked && languages[asked] ? asked : settings.language;
  levelSelect.replaceChildren(...CEFR.map((l) => new Option(l, l)));
  levelSelect.value = settings.level;
  await showSaved();
}

void init();
