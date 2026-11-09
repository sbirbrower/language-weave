import { describe, expect, it } from 'vitest';
import { seededRng } from '../../src/passage/rng';
import { getExerciseType, type Raw } from '../../src/practice/exercises';
import { keyCheck, keyFlagged } from '../../src/practice/key';
import type { Step } from '../../src/practice/types';

const step = (raw: Raw): Step => ({ ...getExerciseType(String(raw.type))!.parse(raw, seededRng('t'))!, type: String(raw.type), instruction: String(raw.instruction) });
const noul = (ps: Record<string, number>) => Object.fromEntries(Object.entries(ps).map(([k, noul]) => [k, { type: 'noul', noul }]));

const cafe = step({
  type: 'spot_form',
  instruction: 'Tap every use of the form',
  form: 'number words (0–20)',
  parts: ['Ich habe „Zwei“ gesagt, und er ', { target: 'hat gekocht', why: '' }, '. Es kostet ', { target: 'drei', why: '' }, ' Euro.'],
});

const gap = step({ type: 'gap', instruction: 'Fill in the blank', sentence: 'Ich ___ aus Berlin.', en: 'I come from Berlin.', options: ['komme', 'kommst', 'kommt'], answer: 'komme', why: '' });

describe('keyCheck', () => {
  it('asks about every use of the form and every other word, numbered in the text', () => {
    const check = keyCheck(cafe, 'German', 'A1')!;
    expect(check.state).toEqual({
      language: 'German',
      level: 'A1',
      group: 'number words (0–20)',
      text: 'Ich[3] habe[4] „Zwei“[5] gesagt,[6] und[7] er[8] hat gekocht[1]. Es[9] kostet[10] drei[2] Euro.[11]',
    });
    expect(check.keyed).toMatchObject({ w1: true, w2: true, w5: false, w11: false });
    expect(check.questions.w5!.instructions).toContain('word [5] ("Zwei")');
  });

  it('asks about every option of a gap fill, filled in', () => {
    const check = keyCheck(gap, 'German', 'A1')!;
    const right = Object.entries(check.keyed).find(([, k]) => k)![0];
    const filled = (check.state as { filled: Record<string, string> }).filled;
    expect(filled[`option ${right.slice(1)}`]).toBe('Ich komme aus Berlin.');
    expect(Object.values(check.keyed).filter(Boolean)).toHaveLength(1);
  });

  it('asks about every particle in every sentence of a particles exercise', () => {
    const particles = step({
      type: 'particles',
      instruction: 'Which particle goes in each gap?',
      particles: ['を', 'で', 'に'],
      items: [
        { target: '図書館《としょかん》___本《ほん》を読《よ》みます。', en: 'I read books at the library.', answer: 'で', why: '' },
        { target: 'コーヒー___飲《の》みます。', en: 'I drink coffee.', answer: 'を', why: '' },
        { target: '七時《しちじ》___起《お》きます。', en: 'I get up at seven.', answer: 'に', why: '' },
      ],
    });
    const check = keyCheck(particles, 'Japanese', 'A1')!;
    expect(Object.keys(check.questions)).toHaveLength(9);
    expect(Object.values(check.keyed).filter(Boolean)).toHaveLength(3);
    const sentences = (check.state as { sentences: Record<string, { text: string; filled: Record<string, string> }> }).sentences;
    const coffee = Object.entries(sentences).find(([, s]) => s.text.startsWith('コーヒー'))!;
    expect(coffee[1].filled['を']).toBe('コーヒーを飲みます。');
    const n = coffee[0].replace('sentence ', '');
    expect(check.keyed[`s${n}p1`]).toBe(true);
    expect(check.questions[`s${n}p1`]!.instructions).toContain(`を in the gap of sentence ${n}`);
  });

  it('skips other exercises', () => {
    const proofread = step({ type: 'proofread', instruction: 'Find the mistakes', parts: ['Ich habe gestern ', { target: 'gegesst', fix: 'gegessen', why: '' }, ' und dann bin ich nach Hause gegangen.'] });
    expect(keyCheck(proofread, 'German', 'A1')).toBeNull();
  });
});

describe('keyFlagged', () => {
  const check = keyCheck(gap, 'German', 'A1')!;
  const qs = Object.keys(check.keyed);
  const agree = Object.fromEntries(qs.map((q) => [q, check.keyed[q] ? 0.9 : 0.1]));

  it('passes a key Jev agrees with, and one it left unanswered', () => {
    expect(keyFlagged(check, noul(agree))).toBe(false);
    expect(keyFlagged(check, {})).toBe(false);
  });

  it('flags a second right option, or a right one Jev rejects', () => {
    const wrong = qs.find((q) => !check.keyed[q])!;
    const right = qs.find((q) => check.keyed[q])!;
    expect(keyFlagged(check, noul({ ...agree, [wrong]: 0.8 }))).toBe(true);
    expect(keyFlagged(check, noul({ ...agree, [right]: 0.2 }))).toBe(true);
  });
});
