import type { Kit } from '../passage/kit';
import { dayOf, type Ledger, type LessonLedger, type Tally } from '../practice/ledger';
import type { SyllabusLesson } from '../syllabus/types';

/**
 * What the Progress page shows, worked out from the practice ledger
 * (`src/practice/ledger.ts`) and the lessons' kits: how each topic and word
 * stands, the calendar and streaks, each level, milestones and a recap.
 * Pure: days come in as "2026-11-08", as the ledger keys them.
 */

/**
 * Learned: right last time, and right on two days or more. Needs work: wrong
 * last time, or wrong more often than right. Practising: anything else answered.
 */
export type Standing = 'learned' | 'practising' | 'needs-work';

export function standing(t: Tally): Standing {
  if (t.last === 'wrong' || t.wrong > t.right) return 'needs-work';
  if (t.firstRight && t.lastRight && t.firstRight !== t.lastRight) return 'learned';
  return 'practising';
}

/** A day counts towards a streak with this many exercises answered. */
export const DAY_GOAL = 3;

function parseDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y!, m! - 1, d!);
}

export function addDays(day: string, n: number): string {
  const date = parseDay(day);
  return dayOf(new Date(date.getFullYear(), date.getMonth(), date.getDate() + n));
}

const answered = (days: Ledger['days'], day: string) => days[day]?.total ?? 0;

/**
 * The streak going on (today's, or yesterday's while today has yet to count), the
 * longest, and the day the longest-so-far first reached each length (`reached[n - 1]`).
 */
export function streaks(days: Ledger['days'], today: string): { current: number; best: number; reached: string[] } {
  const active = Object.keys(days).filter((d) => answered(days, d) > 0 && d <= today).sort();
  const reached: string[] = [];
  let run = 0;
  let best = 0;
  for (let day = active[0]; day && day <= today; day = addDays(day, 1)) {
    run = answered(days, day) >= DAY_GOAL ? run + 1 : 0;
    if (run > best) {
      best = run;
      reached.push(day);
    }
  }
  const current = answered(days, today) >= DAY_GOAL ? run : streakEnding(days, addDays(today, -1));
  return { current, best, reached };
}

function streakEnding(days: Ledger['days'], day: string): number {
  let n = 0;
  while (answered(days, day) >= DAY_GOAL) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

export interface CalendarDay {
  day: string;
  total: number;
  right: number;
  /** 0 (nothing) to 4 (a lot), for its shade. */
  shade: number;
  future: boolean;
}

/** Exercises answered for this many weeks up to today's, Monday first, one array per week. */
export function calendar(days: Ledger['days'], today: string, weeks = 26): CalendarDay[][] {
  const monday = addDays(today, -((parseDay(today).getDay() + 6) % 7));
  const out: CalendarDay[][] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const week: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(monday, i - w * 7);
      const { total = 0, right = 0 } = days[day] ?? {};
      week.push({ day, total, right, shade: shadeOf(total), future: day > today });
    }
    out.push(week);
  }
  return out;
}

const shadeOf = (total: number) => (total === 0 ? 0 : total < DAY_GOAL ? 1 : total < 10 ? 2 : total < 20 ? 3 : 4);

export interface Item {
  /** A topic's id or the word itself, as the ledger keys it. */
  key: string;
  /** A topic's label, or the word. */
  label: string;
  /** A word's English. */
  gloss?: string;
  /** None: not practised yet. */
  standing?: Standing;
  tally?: Tally;
}

export interface LessonProgress {
  lesson: SyllabusLesson;
  /** The lesson's topics (its kit's points) and theme words, in the kit's order; without a kit, only those practised. */
  topics: Item[];
  words: Item[];
  /** Exercises answered in it. */
  answered: number;
  /** Every topic learned. */
  done: boolean;
}

function items(listed: Array<{ key: string; label: string; gloss?: string }>, counts: Record<string, Tally>): Item[] {
  const known = new Set(listed.map((l) => l.key));
  // Practised under a kit since rebuilt: still shown, by its key.
  const extra = Object.keys(counts).filter((k) => !known.has(k)).map((key) => ({ key, label: key }));
  return [...listed, ...extra].map((l) => {
    const tally = counts[l.key];
    return { ...l, ...(tally ? { tally, standing: standing(tally) } : {}) };
  });
}

export function lessonProgress(lesson: SyllabusLesson, kit: Kit | undefined, ledger: LessonLedger | undefined): LessonProgress {
  const topics = items(kit?.points.map((p) => ({ key: p.id, label: p.label })) ?? [], ledger?.points ?? {});
  const words = items(kit?.themeVocab.map((w) => ({ key: w.word, label: w.word, gloss: w.gloss })) ?? [], ledger?.words ?? {});
  const answered = Object.values(ledger?.types ?? {}).reduce((n, t) => n + t.right + t.wrong, 0);
  return { lesson, topics, words, answered, done: topics.length > 0 && topics.every((t) => t.standing === 'learned') };
}

export interface LevelProgress {
  /** As the syllabus states it ("CEFR A1"). */
  level: string;
  lessons: number;
  started: number;
  done: number;
  topics: number;
  learned: number;
}

/** Each level in syllabus order. */
export function levels(lessons: readonly LessonProgress[]): LevelProgress[] {
  const out = new Map<string, LevelProgress>();
  for (const p of lessons) {
    const level = p.lesson.level;
    const l = out.get(level) ?? { level, lessons: 0, started: 0, done: 0, topics: 0, learned: 0 };
    l.lessons++;
    if (p.answered) l.started++;
    if (p.done) l.done++;
    l.topics += p.topics.length;
    l.learned += p.topics.filter((t) => t.standing === 'learned').length;
    out.set(level, l);
  }
  return [...out.values()];
}

/** The level being worked on: the first with a lesson not done, or the last once all are. */
export function currentLevel(levelList: readonly LevelProgress[]): LevelProgress | undefined {
  return levelList.find((l) => l.done < l.lessons) ?? levelList[levelList.length - 1];
}

export interface Flagged extends Item {
  lessonId: string;
  kind: 'topic' | 'word';
}

/** Topics and words that need work, in every lesson, the most missed first. */
export function needsWork(lessons: readonly LessonProgress[]): Flagged[] {
  const out: Flagged[] = [];
  for (const p of lessons) {
    for (const t of p.topics) if (t.standing === 'needs-work') out.push({ ...t, lessonId: p.lesson.id, kind: 'topic' });
    for (const w of p.words) if (w.standing === 'needs-work') out.push({ ...w, lessonId: p.lesson.id, kind: 'word' });
  }
  const missed = (f: Flagged) => (f.tally?.wrong ?? 0) - (f.tally?.right ?? 0);
  return out.sort((a, b) => missed(b) - missed(a) || (b.tally?.wrong ?? 0) - (a.tally?.wrong ?? 0));
}

export interface Span {
  total: number;
  right: number;
  /** Days with an exercise answered. */
  days: number;
}

export interface Recap {
  all: Span;
  /** The last 7 days, today's included, and the 7 before. */
  week: Span;
  lastWeek: Span;
  /** Answered right for the first time in the last 7 days. */
  newTopics: number;
  newWords: number;
  learnedTopics: number;
  learnedWords: number;
  needsWork: number;
}

function span(days: Ledger['days'], from: string, to: string): Span {
  const out = { total: 0, right: 0, days: 0 };
  for (const [day, d] of Object.entries(days)) {
    if (day < from || day > to || !d.total) continue;
    out.total += d.total;
    out.right += d.right;
    out.days++;
  }
  return out;
}

export function recap(ledger: Ledger, lessons: readonly LessonProgress[], today: string): Recap {
  const weekStart = addDays(today, -6);
  const all = lessons.flatMap((p) => [...p.topics.map((t) => ['topic', t] as const), ...p.words.map((w) => ['word', w] as const)]);
  const count = (kind: 'topic' | 'word', test: (i: Item) => boolean) => all.filter(([k, i]) => k === kind && test(i)).length;
  const isNew = (i: Item) => (i.tally?.firstRight ?? '') >= weekStart;
  const learned = (i: Item) => i.standing === 'learned';
  return {
    all: span(ledger.days, '', today),
    week: span(ledger.days, weekStart, today),
    lastWeek: span(ledger.days, addDays(weekStart, -7), addDays(weekStart, -1)),
    newTopics: count('topic', isNew),
    newWords: count('word', isNew),
    learnedTopics: count('topic', learned),
    learnedWords: count('word', learned),
    needsWork: all.filter(([, i]) => i.standing === 'needs-work').length,
  };
}

export interface Milestone {
  id: string;
  title: string;
  reached: boolean;
  /** The day it was reached, when the ledger can tell. */
  on?: string;
}

/** The day the running total of `days` first reached `n`. */
function dayReaching(days: Ledger['days'], n: number, of: (d: { total: number }) => number): string | undefined {
  let sum = 0;
  for (const day of Object.keys(days).sort()) {
    sum += of(days[day]!);
    if (sum >= n) return day;
  }
  return undefined;
}

const short = (level: string) => level.replace(/^CEFR\s*/i, '');

export function milestones(ledger: Ledger, lessons: readonly LessonProgress[], today: string): Milestone[] {
  const out: Milestone[] = [];
  const add = (id: string, title: string, reached: boolean, on?: string) => out.push({ id, title, reached, ...(reached && on ? { on } : {}) });

  for (const n of [1, 50, 100, 500, 1000]) {
    const on = dayReaching(ledger.days, n, (d) => d.total);
    add(`exercises-${n}`, n === 1 ? 'First exercise' : `${n} exercises`, Boolean(on), on);
  }
  for (const n of [10, 50]) {
    const on = dayReaching(ledger.days, n, (d) => (d.total ? 1 : 0));
    add(`days-${n}`, `${n} days of practice`, Boolean(on), on);
  }
  const { reached } = streaks(ledger.days, today);
  for (const n of [3, 7, 30]) add(`streak-${n}`, `${n}-day streak`, reached.length >= n, reached[n - 1]);

  const topics = lessons.flatMap((p) => p.topics).filter((t) => t.standing === 'learned').length;
  const words = lessons.flatMap((p) => p.words).filter((w) => w.standing === 'learned').length;
  add('topic-1', 'First topic learned', topics >= 1);
  for (const n of [25, 100]) add(`words-${n}`, `${n} words learned`, words >= n);
  add('lesson-1', 'First lesson done', lessons.some((p) => p.done));
  for (const l of levels(lessons)) add(`level-${short(l.level)}`, `Every ${short(l.level)} lesson done`, l.done === l.lessons);

  const said = lessons.map((p) => ledger.lessons[p.lesson.id]?.types['say']?.firstRight).filter((d): d is string => Boolean(d)).sort()[0];
  add('say-1', 'First sentence said aloud', Boolean(said), said);
  return out;
}
