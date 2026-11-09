import { writingNotesFor } from '../languages';
import type { SyllabusLesson } from './types';

/**
 * Lessons the reader writes: a topic and as many specifics as they like ("expressions of quantity,
 * with the partitive after negation, in a kitchen"), turned once by a strong model into a syllabus
 * lesson like the course's own. Kept in `chrome.storage.local` (`src/syllabus/stored.ts`) and listed
 * after the course's lessons; the kit, textbook, passages and practice are built from it as from any other.
 */
export interface LessonRequest {
  /** Language code (`fr`). */
  lang: string;
  /** CEFR level, `A1`–`C2`. */
  level: string;
  topic: string;
  /** Whatever else the reader wants, in their words; may be long. */
  details: string;
}

/** A lesson the reader wrote, with what they asked for, to change and write again. */
export interface CustomLesson extends SyllabusLesson {
  request: LessonRequest;
}

/** Written once per lesson, by the reader's choice: quality matters far more than speed or cost. */
export const CUSTOM_LESSON_MODEL = { model: 'claude-opus-5-5', effort: 'default', thinking: 'on', maxTokens: 16000 } as const;

export const CUSTOM_LESSON_SYSTEM = 'You design lessons for language courses. Follow the instructions exactly.';

/** Up to two of the course's lessons nearest the level, to show how points are written. */
function examplesFor(course: readonly SyllabusLesson[], level: string): SyllabusLesson[] {
  const exact = course.filter((l) => l.level === `CEFR ${level}`);
  const near = [...exact, ...course.filter((l) => !exact.includes(l) && l.level.includes(level))];
  return (near.length >= 2 ? near : course.slice(-2)).slice(0, 2);
}

const lessonBlock = (l: SyllabusLesson) => `<example>\nTitle: ${l.title}\nLevel: ${l.level}\nSyllabus points:\n${l.points.map((p) => `- ${p}`).join('\n')}\n</example>`;

/** `course` is the language's own lessons, in order; `language` its display name. */
export function buildCustomLessonPrompt(req: LessonRequest, language: string, course: readonly SyllabusLesson[]): string {
  const L = language;
  const writing = writingNotesFor(L);
  const examples = examplesFor(course, req.level);
  const details = req.details.trim();
  return `A learner of ${L} has asked for a lesson of their own, to add to their ${L} course for English speakers. Turn the request into one syllabus lesson written like the course's others. Other models build everything else from it, once: a textbook page that teaches each point, a theme with its words and everyday situations, then many short practice texts and exercises. They see only what you write, so the points must say exactly what to teach, with the ${L} forms named.

<request>
Level: CEFR ${req.level}
Topic: ${req.topic.trim()}${details ? `\nDetails:\n${details}` : ''}
</request>

<course>
The course's own lessons, in order:
${course.map((l) => `- ${l.title} (${l.level})`).join('\n')}
</course>
${examples.length ? `\nHow the course writes a lesson:\n\n${examples.map(lessonBlock).join('\n\n')}\n` : ''}
Fill in the JSON schema:
- "title": a short English title in the style of the course's (2–5 words), naming what the request is about.
- "points": 3–7 syllabus points that together teach what the request asks for, at CEFR ${req.level}, in the order a teacher would take them. Write each as the course does: what is taught, in English, then the ${L} forms or words in parentheses, enough of them that a writer knows exactly what to use. Cover everything the request asks to be taught; if it asks for more than one lesson can hold, keep what matters most. Teach what the request asks even where the course teaches it elsewhere.
- "notes": what the request asks for that the points don't say, for the writers: themes or situations to set scenes in, words to include, contrasts to draw, what to stress or to avoid, register. Short instructions in English, one per line, keeping every specific the learner gave that the points don't already state, and adding nothing they didn't ask for. "" if there is nothing.
- "left_out": for the learner, in a sentence or two: what of the request the lesson doesn't teach and why (too much for one lesson, far from CEFR ${req.level}), and any form or rule the request got wrong that the lesson teaches correctly instead. "" if there is nothing.

Every ${L} form must be correct, standard ${L}. If the request gets a form or rule of ${L} wrong, teach the right one. If it asks for something far above or below CEFR ${req.level}, teach the part that suits the level.${writing ? `\n\n${writing}` : ''}`;
}

const obj = (properties: Record<string, unknown>) => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

export const CUSTOM_LESSON_SCHEMA = obj({
  title: { type: 'string' },
  points: { type: 'array', items: { type: 'string' } },
  notes: { type: 'string' },
  left_out: { type: 'string' },
});

/** A new lesson's id: unique, and never one of the course's (theirs have no `custom`). */
export function customLessonId(lang: string, title: string, now = Date.now()): string {
  const slug = title
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32)
    .replace(/-$/, '');
  return `${lang}-custom-${slug || 'lesson'}-${now.toString(36)}`;
}

export const isCustomLessonId = (id: string) => /^[a-z]+-custom-/.test(id);

/** The lesson from the model's JSON, and what it leaves out of the request (for the reader, not kept); throws if it has no title or points. */
export function parseCustomLesson(text: string, req: LessonRequest, id: string): { lesson: CustomLesson; leftOut: string } {
  const raw = JSON.parse(text) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const title = str(raw.title);
  const points = (Array.isArray(raw.points) ? raw.points : []).map(str).filter(Boolean);
  if (!title || !points.length) throw new Error('The lesson came back without a title or points.');
  const notes = str(raw.notes);
  const lesson: CustomLesson = { id, lang: req.lang, title, level: `CEFR ${req.level}`, points, ...(notes ? { notes } : {}), request: req };
  return { lesson, leftOut: str(raw.left_out) };
}

/** `lessons` with `lesson` in place of the one with its id, or added last. */
export function withLesson<T extends SyllabusLesson>(lessons: readonly T[], lesson: T): T[] {
  const at = lessons.findIndex((l) => l.id === lesson.id);
  return at < 0 ? [...lessons, lesson] : lessons.map((l, i) => (i === at ? lesson : l));
}
