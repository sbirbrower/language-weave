import { describe, expect, it } from 'vitest';
import { buildKitPrompt } from '../../src/passage/kit';
import { buildTextbookPrompt } from '../../src/passage/textbook';
import { lessonStamp, lessonsFor } from '../../src/syllabus';
import { buildCustomLessonPrompt, customLessonId, isCustomLessonId, parseCustomLesson, withLesson, type LessonRequest } from '../../src/syllabus/custom';

const req: LessonRequest = { lang: 'fr', level: 'A2', topic: 'Expressions of quantity', details: 'beaucoup de, un kilo de\nAt a market.' };
const course = lessonsFor('fr');

describe('custom lessons', () => {
  it('parses the model’s lesson, keeping the request and dropping empty notes', () => {
    const json = JSON.stringify({ title: ' Quantities ', points: ['beaucoup de', ' ', 'un kilo de'], notes: '', left_out: 'The subjunctive.' });
    const { lesson, leftOut } = parseCustomLesson(json, req, 'fr-custom-x');
    expect(lesson).toEqual({ id: 'fr-custom-x', lang: 'fr', title: 'Quantities', level: 'CEFR A2', points: ['beaucoup de', 'un kilo de'], request: req });
    expect(leftOut).toBe('The subjunctive.');
    expect(() => parseCustomLesson(JSON.stringify({ title: 'x', points: [] }), req, 'id')).toThrow();
  });

  it('makes ids that are never a course lesson’s', () => {
    const id = customLessonId('fr', 'Les quantités, à la française!', 36 ** 3);
    expect(id).toBe('fr-custom-les-quantites-a-la-francaise-1000');
    expect(customLessonId('ja', '数え方', 0)).toBe('ja-custom-lesson-0');
    expect(isCustomLessonId(id)).toBe(true);
    expect(course.some((l) => isCustomLessonId(l.id))).toBe(false);
  });

  it('replaces a lesson by id, or adds it last', () => {
    const [a, b] = course;
    expect(withLesson([a!, b!], { ...a!, title: 'New' }).map((l) => l.title)).toEqual(['New', b!.title]);
    expect(withLesson([a!], b!)).toEqual([a, b]);
  });

  it('puts the request and the course in the prompt', () => {
    const prompt = buildCustomLessonPrompt(req, 'French', course);
    expect(prompt).toContain('Topic: Expressions of quantity');
    expect(prompt).toContain('At a market.');
    expect(prompt).toContain(`- ${course[0]!.title} (${course[0]!.level})`);
    expect(prompt).toContain('Level: CEFR A2');
    expect(prompt).not.toContain('Details:\n\n');
  });

  it('leaves the course’s lessons, their stamps and prompts as they were', () => {
    const lesson = course[0]!;
    const noted = { ...lesson, notes: 'Set it in a kitchen.' };
    expect(lessonStamp({ ...lesson, notes: undefined })).toBe(lessonStamp(lesson));
    expect(lessonStamp(noted)).not.toBe(lessonStamp(lesson));
    expect(buildKitPrompt(lesson, 'French')).not.toContain('also asked for');
    expect(buildKitPrompt(noted, 'French')).toContain('The learner also asked for:\nSet it in a kitchen.\n</lesson>');
    expect(buildTextbookPrompt(noted, 'French')).toContain('Set it in a kitchen.\n</lesson>');
  });
});
