import { describe, expect, it } from 'vitest';
import { getExerciseType } from '../../src/practice/exercises';
import { buildHintPrompt, describeExercise, hasHint, parseHint, quotesAnswer } from '../../src/practice/hint';
import { parsePractice } from '../../src/practice/prompt';
import type { Step } from '../../src/practice/types';
import { SAMPLES } from './samples';

const step = (type: string): Step => parsePractice(JSON.stringify(SAMPLES[type]), { type: getExerciseType(type)!, setting: '', seed: 's' })!.step;

describe('hints', () => {
  it('describe every exercise with a hint, answer included', () => {
    for (const type of Object.keys(SAMPLES)) {
      const s = step(type);
      if (!hasHint(s)) continue;
      const { exercise, answer } = describeExercise(s);
      expect(exercise, type).toContain(s.instruction);
      expect(answer, type).not.toBe('');
    }
    expect(describeExercise(step('gap')).answer).toContain('voudrais');
    expect(buildHintPrompt(step('gap'), 'French', 'A1')).toContain('learner of French at A1');
  });

  it('none for pairs and conversations', () => {
    expect(hasHint(step('pairs'))).toBe(false);
    expect(hasHint(step('talk'))).toBe(false);
  });

  it('a hint that quotes the answer is caught, as a whole word', () => {
    const gap = step('gap');
    expect(quotesAnswer(gap, 'Use *voudrais*, the polite form.')).toBe(true);
    expect(quotesAnswer(gap, 'Which form of *vouloir* is the polite one?')).toBe(false);
    expect(quotesAnswer(step('fix'), 'Is *limonade* masculine or feminine?')).toBe(false);
    expect(quotesAnswer(step('fix'), 'It should be *une*.')).toBe(true);
  });

  it('an Arabic answer is caught with a letter joined to its front, not inside another word', () => {
    const gap = parsePractice(JSON.stringify({ ...SAMPLES.gap, sentence: 'أنا《anā》 ___ الآن《al-ān》.', options: ['البيت《al-bayt》', 'المدرسة《al-madrasa》', 'السوق《as-sūq》'], answer: 'البيت《al-bayt》' }), { type: getExerciseType('gap')!, setting: '', seed: 's' })!.step;
    expect(quotesAnswer(gap, 'Think of *بالبيت*, at home.')).toBe(true);
    expect(quotesAnswer(gap, 'Where do you sleep? Not in *المدرسة*.')).toBe(false);
    expect(quotesAnswer(gap, 'Think of *البيتين*.')).toBe(false);
  });

  it('parses one paragraph, without a label or quotes', () => {
    expect(parseHint('Hint: "Think about politeness."\n\nMore.')).toBe('Think about politeness.');
    expect(parseHint('  ')).toBeNull();
  });
});
