import { browser } from 'wxt/browser';
import { kitCacheKey, type Kit } from '../passage/kit';
import { newLedger, type Ledger } from '../practice/ledger';
import type { SyllabusLesson } from '../syllabus';
import { allLessonsFor } from '../syllabus/stored';
import { lessonProgress, type LessonProgress } from './progress';

/**
 * A language's practice history (`src/practice/ledger.ts`) and its lessons, the course's and the reader's,
 * each with its kit for its topics' labels: the one now if built under this version, else any older one.
 */
export async function loadProgress(lang: string): Promise<{ ledger: Ledger; kits: Record<string, Kit>; lessons: SyllabusLesson[] }> {
  const key = `practice-ledger|${lang}`;
  const lessons = await allLessonsFor(lang);
  const stored = await browser.storage.local.get([key, 'kits']);
  const ledger = { ...newLedger(), ...(stored[key] as Partial<Ledger> | undefined) };
  const kits = (stored['kits'] ?? {}) as Record<string, Kit>;
  const byLesson: Record<string, Kit> = {};
  for (const lesson of lessons) {
    const kit = kits[kitCacheKey(lesson)] ?? Object.entries(kits).find(([k]) => k.startsWith(`${lesson.id}|`))?.[1];
    if (kit) byLesson[lesson.id] = kit;
  }
  return { ledger, kits: byLesson, lessons };
}

export type LessonStatus = 'learned' | 'practising' | 'needs-work' | 'not-yet';

/** Where a lesson stands, as one word for a list: every topic learned, one needing work, started, or not. */
export function lessonStatus(p: LessonProgress): LessonStatus {
  if (p.done) return 'learned';
  if (p.topics.some((t) => t.standing === 'needs-work')) return 'needs-work';
  return p.answered ? 'practising' : 'not-yet';
}

/** Each lesson's status, by id. */
export function lessonStatuses(loaded: Awaited<ReturnType<typeof loadProgress>>): Map<string, LessonStatus> {
  return new Map(loaded.lessons.map((l) => [l.id, lessonStatus(lessonProgress(l, loaded.kits[l.id], loaded.ledger.lessons[l.id]))]));
}
