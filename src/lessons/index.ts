import type { LanguageConfig } from '../languages';
import { themedFor } from './themed';
import type { Lesson } from './types';

/**
 * What can be woven (Options → Words to weave), built for each language.
 * Syllabus lessons are taught in the widget instead (`src/syllabus/`);
 * `basics` is the old word-bank weave of Les bases, kept for its tests and
 * evals but no longer offered.
 */
const builders: Array<(lang: LanguageConfig) => Lesson> = [themedFor];
const built = new Map<string, Lesson[]>();

export function lessonsFor(lang: LanguageConfig): Lesson[] {
  let lessons = built.get(lang.code);
  if (!lessons) built.set(lang.code, (lessons = builders.map((b) => b(lang))));
  return lessons;
}

/** 'none' (or an unknown id) means the general weave. */
export function getLesson(id: string, lang: LanguageConfig): Lesson | undefined {
  return lessonsFor(lang).find((l) => l.id === id);
}

export type { Candidate, Category, Lesson, Tier } from './types';
