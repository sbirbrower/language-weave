import { easyWordsLesson } from './easy';
import { pageWordsLesson, withPageWords, type PageWord } from './pageWords';
import type { Lesson } from './types';

export interface LessonParts {
  /** The lesson with its extras, for prompts and matching. */
  lesson: Lesson;
  page?: Lesson;
  easy?: Lesson;
}

/**
 * A lesson with the words added to it on this page: page words (themed
 * words) and easy words. The plan, the content script and the background all
 * build it here, so candidate ids mean the same thing everywhere.
 */
export function withExtras(base: Lesson, pageWords?: PageWord[]): LessonParts {
  const page = pageWords?.length ? pageWordsLesson(pageWords, base.language) : undefined;
  const easy = base.easyWords?.length
    ? easyWordsLesson(base.easyWords, [...(base.teaches ?? []), ...(pageWords ?? []).map((w) => w.lemma)], base.language)
    : undefined;
  let lesson = base;
  if (page) lesson = withPageWords(lesson, page);
  if (easy) lesson = withPageWords(lesson, easy);
  return { lesson, page, easy };
}
