import { browser } from 'wxt/browser';
import type { Plan } from './schedule';

/**
 * Every exercise answered in lesson mode, per language: by day (for streaks)
 * and by lesson (its points, words and types, right or wrong). Unlike
 * `Coverage`, which counts what was shown so the scheduler can plan, this is
 * history: "Start afresh" doesn't clear it.
 */
export interface Ledger {
  /** Local days ("2026-11-08"): exercises answered, and how many right. */
  days: Record<string, { right: number; total: number }>;
  /** By syllabus lesson id. */
  lessons: Record<string, LessonLedger>;
}

export interface LessonLedger {
  points: Record<string, Tally>;
  words: Record<string, Tally>;
  /** Exercise and drill types. */
  types: Record<string, Tally>;
}

export interface Tally {
  right: number;
  wrong: number;
  /** How it was answered last time. */
  last?: 'right' | 'wrong';
  /** The day it was first answered right, and last. */
  firstRight?: string;
  lastRight?: string;
}

export const newLedger = (): Ledger => ({ days: {}, lessons: {} });
const newLessonLedger = (): LessonLedger => ({ points: {}, words: {}, types: {} });

/** A date's local day, as the ledger keys it. */
export function dayOf(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function tally(counts: Record<string, Tally>, key: string, right: boolean, day: string) {
  const t = (counts[key] ??= { right: 0, wrong: 0 });
  t.last = right ? 'right' : 'wrong';
  if (!right) return void t.wrong++;
  t.right++;
  t.firstRight ??= day;
  t.lastRight = day;
}

/** One exercise answered: its day, and in its lesson its type, point and words. */
export function recordAnswer(ledger: Ledger, lessonId: string, plan: Plan, right: boolean, day: string): void {
  const d = (ledger.days[day] ??= { right: 0, total: 0 });
  d.total++;
  if (right) d.right++;
  const lesson = (ledger.lessons[lessonId] ??= newLessonLedger());
  tally(lesson.types, plan.type, right, day);
  if (plan.point) tally(lesson.points, plan.point, right, day);
  for (const w of plan.words) tally(lesson.words, w, right, day);
}

const keyFor = (lang: string) => `practice-ledger|${lang}`;

/** A language's ledger in `chrome.storage.local`. Answers are written one after another, each read afresh, since another browser tab may have written since. */
export function practiceLedger(lang: string, now: () => Date = () => new Date()): { load(): Promise<Ledger>; record(lessonId: string, plan: Plan, right: boolean): Promise<void> } {
  const key = keyFor(lang);
  const load = async (): Promise<Ledger> => {
    const stored = (await browser.storage.local.get(key))[key] as Partial<Ledger> | undefined;
    return { ...newLedger(), ...stored };
  };
  let queue = Promise.resolve();
  return {
    load,
    record(lessonId, plan, right) {
      const day = dayOf(now());
      queue = queue
        .then(async () => {
          const ledger = await load();
          recordAnswer(ledger, lessonId, plan, right, day);
          await browser.storage.local.set({ [key]: ledger });
        })
        .catch(() => {});
      return queue;
    },
  };
}
