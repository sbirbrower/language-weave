import { csLessons } from './cs';
import { deLessons } from './de';
import { esLessons } from './es';
import { ptLessons } from './pt';
import { itLessons } from './it';
import { ruLessons } from './ru';
import { frLessons } from './fr';
import { gdLessons } from './gd';
import { heLessons } from './he';
import { arLessons } from './ar';
import { hiLessons } from './hi';
import { jaLessons } from './ja';
import { koLessons } from './ko';
import { zhLessons } from './zh';
import type { SyllabusLesson } from './types';

export const syllabusLessons: SyllabusLesson[] = [...frLessons, ...deLessons, ...jaLessons, ...zhLessons, ...koLessons, ...hiLessons, ...heLessons, ...arLessons, ...csLessons, ...esLessons, ...ptLessons, ...ruLessons, ...itLessons, ...gdLessons];

/** 'none' (or an unknown id) means no lesson: the widget stays hidden. */
export function getSyllabusLesson(id: string): SyllabusLesson | undefined {
  return syllabusLessons.find((l) => l.id === id);
}

export function lessonsFor(lang: string): SyllabusLesson[] {
  return syllabusLessons.filter((l) => l.lang === lang);
}

/** A short hash of what the prompts are given about the lesson, so a cached kit or page is rebuilt when its points change. */
export function lessonStamp(lesson: SyllabusLesson): string {
  let h = 0x811c9dc5;
  const given = lesson.notes ? [lesson.title, lesson.level, lesson.points, lesson.notes] : [lesson.title, lesson.level, lesson.points];
  for (const ch of JSON.stringify(given)) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193);
  return (h >>> 0).toString(36);
}

/** A lesson the reader wrote: their notes, for the kit and textbook prompts' <lesson> block; '' for the course's own. */
export const lessonNotes = (lesson: SyllabusLesson) => (lesson.notes ? `\nThe learner also asked for:\n${lesson.notes}` : '');

export type { SyllabusLesson } from './types';
