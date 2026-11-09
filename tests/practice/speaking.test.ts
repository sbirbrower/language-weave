import { describe, expect, it } from 'vitest';
import { seededRng } from '../../src/passage/rng';
import { getExerciseType } from '../../src/practice/exercises';
import { grade, newAnswer, playsOut } from '../../src/practice/session';
import { markSpeech } from '../../src/practice/speaking';
import type { Step } from '../../src/practice/types';
import { SAMPLES } from './samples';

const missed = (h: ReturnType<typeof markSpeech>) => h.words.filter((w) => !w.heard).map((w) => w.text);

describe('markSpeech', () => {
  it('passes a sentence heard as said, whatever the case and punctuation', () => {
    const h = markSpeech('la maison est grande', 'La maison est grande.');
    expect(h).toMatchObject({ tier: 'great', score: 1 });
    expect(h.words.map((w) => w.text)).toEqual(['La', 'maison', 'est', 'grande.']);
  });

  it('forgives a word heard a little differently, and accents', () => {
    expect(markSpeech('Das Wetter ist heute schon.', 'Das Wetter ist heute schön.').tier).toBe('great');
    expect(markSpeech('La maison est grand.', 'La maison est grande.').tier).toBe('great');
  });

  it('still passes with a word or two lost, showing which', () => {
    // Heard from a beginner in evals/speak/.
    const h = markSpeech('Wir ziehen. einen Bruder.', 'Ich habe einen Bruder.');
    expect(h.tier).toBe('almost');
    expect(missed(h)).toEqual(['Ich', 'habe']);
  });

  it('asks again for something else, or nothing', () => {
    expect(markSpeech('Je vais te appeler.', 'J’habite à Paris.').tier).toBe('retry');
    expect(markSpeech('', 'J’habite à Paris.')).toMatchObject({ tier: 'retry', score: 0 });
  });

  it('matches words in order, so a word heard twice counts once', () => {
    expect(markSpeech('Paris Paris Paris', 'J’habite à Paris.').score).toBeCloseTo(1 / 3);
  });

  it('compares Japanese by character, against the kanji or the readings', () => {
    const kanji = markSpeech('東京に行きます。', '東京《とうきょう》に行《い》きます。');
    expect(kanji).toMatchObject({ tier: 'great', spaced: false });
    expect(markSpeech('とうきょうにいきます', '東京《とうきょう》に行《い》きます。').tier).toBe('great');
    expect(markSpeech('トウキョウにいきます', '東京《とうきょう》に行《い》きます。').tier).toBe('great');
  });

  it('reads Hindi without its romanisation, nukta and chandrabindu either way', () => {
    expect(markSpeech('मैं चाय पीता हूं।', 'मैं《maiṃ》 चाय《cāy》 पीता《pītā》 हूँ《hūṃ》।').score).toBe(1);
  });
});

describe('the say exercise', () => {
  const step = { ...getExerciseType('say')!.parse(SAMPLES.say!, seededRng('s'))!, type: 'say', instruction: '' } as Step;

  it('shows the English to say, and passes once heard well enough', () => {
    if (step.kind !== 'speak') throw new Error('not speak');
    expect(step.prompt.question).toBe("I'd like a coffee, please.");
    expect(playsOut(step)).toBe(true);
    const a = newAnswer();
    expect(grade(step, a)).toBeUndefined();
    a.spoken = { tries: 1, heard: markSpeech('Je voudrais un café.', step.say.text) };
    expect(grade(step, a)).toBe(true);
    a.spoken.heard = markSpeech('Bonjour', step.say.text);
    expect(grade(step, a)).toBe(false);
  });

  it('is dropped without a sentence or its English', () => {
    expect(getExerciseType('say')!.parse({ ...SAMPLES.say!, en: '' }, seededRng('s'))).toBeNull();
  });
});
