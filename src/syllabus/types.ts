/**
 * A syllabus lesson: what a course week teaches, as a title and its points.
 * The widget teaches it with one short passage per page (`src/passage/`);
 * the weave is unaffected.
 */
export interface SyllabusLesson {
  id: string;
  /** Language code, matching `src/languages/` (`fr`). */
  lang: string;
  title: string;
  /** The reader's level, as the course states it ("CEFR A1"). */
  level: string;
  /** The syllabus points, as written in the course. */
  points: string[];
  /**
   * A culture or geography lesson, like a textbook's culture pages ("Culture: …", "Geography: …"): the places
   * and customs where the language is spoken, with their words, and no new grammar. It has no drills, and
   * drills count lessons without it (`drillLessons`). Unset for the course's language lessons.
   */
  kind?: 'culture';
  /**
   * A lesson the reader wrote (`src/syllabus/custom.ts`): what their request asks for that the points
   * don't hold (themes, words, emphases, what to leave out), for the kit and textbook prompts. Unset
   * for the course's own lessons, whose prompts and caches stay as they were.
   */
  notes?: string;
}
