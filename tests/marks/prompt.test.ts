import { describe, expect, it } from 'vitest';
import { de } from '../../src/languages/de';
import { buildMarkPrompt, MARK_INPUT, MARK_METHOD, maxMarks, parseMark, parseMarks, placeMarks, type MarkJob } from '../../src/marks/prompt';
import { getSyllabusLesson } from '../../src/syllabus';

const lesson = getSyllabusLesson('de-a1-alltag')!;
const job = (paragraphs: string[]): MarkJob => ({ language: de.displayName, lesson, kit: null, title: 'Daytona 500', heading: 'Qualifying', paragraphs });

describe('buildMarkPrompt', () => {
  it('names the language and level from the lesson, and numbers the paragraphs', () => {
    const p = buildMarkPrompt(MARK_METHOD, MARK_INPUT, job(['The race is on Sunday.', 'Teams arrive on Thursday.']));
    expect(p).toContain('taking a German course (CEFR A1)');
    expect(p).not.toContain('French');
    expect(p).toContain('[1] The race is on Sunday.\n[2] Teams arrive on Thursday.');
    expect(p).toContain('paragraph || English || German || point || note');
  });

  it('asks for about one mark per 40 words, between 2 and 25', () => {
    expect(maxMarks(job(['word '.repeat(10)]))).toBe(2);
    expect(maxMarks(job(['word '.repeat(400)]))).toBe(10);
    expect(maxMarks(job(['word '.repeat(5000)]))).toBe(25);
  });
});

describe('parseMark', () => {
  it('reads paragraph, English, target, point and note', () => {
    expect(parseMark('2 || on the Thursday || am Donnerstag || 1 || am + weekday')).toEqual({
      para: 2,
      english: 'on the Thursday',
      target: 'am Donnerstag',
      point: 1,
      note: 'am + weekday',
    });
  });

  it('takes the why-first order', () => {
    expect(parseMark('1 || they left || 2 || verb second || sie gingen', true)).toMatchObject({ target: 'sie gingen', point: 2, note: 'verb second' });
  });

  it('drops a line the model took back, malformed lines and list markers aside', () => {
    expect(parseMark('1 || the rest || le reste || 1 || weak fit; skip')).toBeNull();
    expect(parseMark('1 || the rest || 1 || skip || skip', true)).toBeNull();
    expect(parseMark('just some text')).toBeNull();
    expect(parseMark('1 || only || three')).toBeNull();
    expect(parseMark('- 3 || the race || das Rennen || 1 || noun')).toMatchObject({ para: 3 });
  });

  it('parses a stream of lines', () => {
    expect(parseMarks('1 || a || b || 1 || n\nnoise\n2 || c || d || 2 || m').map((m) => m.english)).toEqual(['a', 'c']);
  });
});

describe('placeMarks', () => {
  const paras = ['The race is on Sunday.', 'Teams arrive on Thursday, and the race starts on Sunday.'];
  const m = (para: number, english: string) => ({ para, english, target: 'x', point: 1, note: '' });

  it('finds the English in its paragraph, or another when the number is wrong', () => {
    const { placed } = placeMarks([m(1, 'on Sunday'), m(1, 'on Thursday')], paras);
    expect(placed.map((p) => [p.at, p.start])).toEqual([
      [0, 12],
      [1, 13],
    ]);
  });

  it('takes the next free occurrence, and calls a mark with none left an overlap', () => {
    const { placed, missed } = placeMarks([m(2, 'on Sunday'), m(2, 'on Sunday'), m(2, 'race starts on'), m(2, 'on Sunday')], paras);
    expect(placed.map((p) => [p.at, p.start])).toEqual([
      [1, paras[1]!.indexOf('on Sunday')],
      [0, paras[0]!.indexOf('on Sunday')],
    ]);
    expect(missed.map((x) => x.reason)).toEqual(['overlap', 'overlap']);
  });

  it('treats curly and straight apostrophes as the same, and reports what isn’t there', () => {
    const { placed, missed } = placeMarks([m(1, "the race's start"), m(1, 'not on the page')], ['It is the race’s start.']);
    expect(placed).toHaveLength(1);
    expect(missed).toEqual([expect.objectContaining({ reason: 'not-found' })]);
  });
});
