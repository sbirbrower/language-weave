import { browser } from 'wxt/browser';
import { withLesson, type CustomLesson } from './custom';
import { getSyllabusLesson, lessonsFor } from './index';
import type { SyllabusLesson } from './types';

/** The reader's own lessons (`src/syllabus/custom.ts`), every language, in the order written. */
export const CUSTOM_LESSONS_KEY = 'customLessons';

export async function loadCustomLessons(): Promise<CustomLesson[]> {
  const stored = await browser.storage.local.get(CUSTOM_LESSONS_KEY);
  return (stored[CUSTOM_LESSONS_KEY] as CustomLesson[] | undefined) ?? [];
}

export async function customLessonsFor(lang: string): Promise<CustomLesson[]> {
  return (await loadCustomLessons()).filter((l) => l.lang === lang);
}

/** A course lesson or one of the reader's; undefined for 'none' or an unknown id. */
export async function findLesson(id: string): Promise<SyllabusLesson | undefined> {
  return getSyllabusLesson(id) ?? (await loadCustomLessons()).find((l) => l.id === id);
}

/** The course's lessons, then the reader's, as the popup lists them. */
export async function allLessonsFor(lang: string): Promise<SyllabusLesson[]> {
  return [...lessonsFor(lang), ...(await customLessonsFor(lang))];
}

/** Added, or put in place of the one with its id: a changed lesson's kit and textbook are rebuilt (`lessonStamp`). */
export async function saveCustomLesson(lesson: CustomLesson): Promise<void> {
  await browser.storage.local.set({ [CUSTOM_LESSONS_KEY]: withLesson(await loadCustomLessons(), lesson) });
}

/** Gone, with its cached kits and textbook pages; its practice stays in the ledger. */
export async function deleteCustomLesson(id: string): Promise<void> {
  const stored = await browser.storage.local.get([CUSTOM_LESSONS_KEY, 'kits', 'textbooks']);
  const lessons = ((stored[CUSTOM_LESSONS_KEY] as CustomLesson[] | undefined) ?? []).filter((l) => l.id !== id);
  const drop = (cache: unknown) => Object.fromEntries(Object.entries((cache ?? {}) as Record<string, unknown>).filter(([k]) => !k.startsWith(`${id}|`)));
  await browser.storage.local.set({ [CUSTOM_LESSONS_KEY]: lessons, kits: drop(stored['kits']), textbooks: drop(stored['textbooks']) });
}
