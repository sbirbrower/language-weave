import { describe, expect, it } from 'vitest';
import { seededRng } from '../../src/passage/rng';
import { EXERCISE_TYPES, findOption, getExerciseType, levelIndex } from '../../src/practice/exercises';
import { buildPracticePrompt, choosePagePractice, parsePractice } from '../../src/practice/prompt';
import { grade, newAnswer } from '../../src/practice/session';
import type { Exercise, Step } from '../../src/practice/types';
import { SAMPLES } from './samples';

const parse = (raw: Record<string, unknown>, seed = 's') => getExerciseType(String(raw.type))!.parse(raw, seededRng(seed));
const step = (e: Exercise): Step => ({ ...e, type: 'x', instruction: '' }) as Step;

describe('exercise types', () => {
  it('every type has a sample that parses, and an instruction and shape for the prompt', () => {
    for (const t of EXERCISE_TYPES) {
      expect(SAMPLES[t.id], t.id).toBeDefined();
      expect(parse(SAMPLES[t.id]!), t.id).not.toBeNull();
      expect(t.ask('German')).toContain('German');
      expect(() => JSON.parse(t.shape('German').replace(/<[^>]*>/g, 'x'))).not.toThrow();
      expect(t.levels[0]).toBeLessThanOrEqual(t.levels[1]);
    }
  });

  it('keeps the answer through the shuffle', () => {
    for (const seed of ['a', 'b', 'c', 'd']) {
      const e = parse(SAMPLES.gap!, seed);
      if (e?.kind !== 'choice') throw new Error('not a choice');
      expect(e.options[e.answer]!.text).toBe('voudrais');
      expect(e.full).toEqual({ text: 'Je voudrais un café, s’il vous plaît.', en: "I'd like a coffee, please." });
    }
  });

  it('never offers the wrong chunk as its own fix, and shows a label’s English once', () => {
    const fix = parse({ ...SAMPLES.fix!, options: ['une', 'un', 'des'] });
    if (fix?.kind !== 'fix') throw new Error('not a fix');
    expect(fix.options.sort()).toEqual(['des', 'une']);
    const sort = parse({ ...SAMPLES.sort!, groups: [{ label: 'tu (informal)', en: 'informal', items: ['Salut !', 'Et toi ?'] }, { label: 'vous (formal)', en: 'formal', items: ['Et vous ?', 'Bonjour, madame.'] }] });
    if (sort?.kind !== 'label') throw new Error('not a label');
    expect(sort.labels).toEqual([{ text: 'tu (informal)' }, { text: 'vous (formal)' }]);
  });

  it('shows each particles sentence filled in, and drops one with a gap missing or one particle for all', () => {
    const e = parse(SAMPLES.particles!);
    if (e?.kind !== 'label') throw new Error('not a label');
    expect(e.labels.map((l) => l.text)).toEqual(['を', 'で', 'に']);
    const library = e.items.find((i) => i.en === 'I read books at the library.')!;
    expect(e.labels[library.label]!.text).toBe('で');
    expect(library.fix).toBe('図書館《としょかん》で本《ほん》を読《よ》みます。');
    const items = SAMPLES.particles!.items as Array<Record<string, unknown>>;
    expect(parse({ ...SAMPLES.particles!, items: [{ ...items[0], target: '本を読みます。' }, ...items.slice(1)] })).toBeNull();
    expect(parse({ ...SAMPLES.particles!, items: items.map((i) => ({ ...i, answer: 'を' })) })).toBeNull();
    expect(parse({ ...SAMPLES.particles!, items: [{ ...items[0], answer: 'が' }, ...items.slice(1)] })).toBeNull();
  });

  it('drops an exercise whose answer is not among its options, or whose indexes are out of range', () => {
    expect(parse({ ...SAMPLES.meaning!, answer: 'jam' })).toBeNull();
    expect(parse({ ...SAMPLES.gap!, sentence: 'No gap here.' })).toBeNull();
    expect(parse({ ...SAMPLES.fix!, wrong: 9 })).toBeNull();
    expect(parse({ ...SAMPLES.fix!, answer: 'un' })).toBeNull();
    expect(parse({ ...SAMPLES.evidence!, answer: 5 })).toBeNull();
    expect(parse({ ...SAMPLES.meaning!, options: ['croissant', 'croissant', 'cake'] })).toBeNull();
    expect(parse({ ...SAMPLES.right_or_wrong!, items: (SAMPLES.right_or_wrong!.items as Array<Record<string, unknown>>).map((i) => ({ ...i, ok: true })) })).toBeNull();
    expect(parse({ ...SAMPLES.build!, extra: ['Je'] })).toBeNull();
    const talk = SAMPLES.talk!;
    const turns = talk.turns as Array<{ choices: Array<Record<string, unknown>> }>;
    expect(parse({ ...talk, turns: [{ ...turns[0], choices: turns[0]!.choices.map((c) => ({ ...c, correct: true })) }] })).toBeNull();
  });

  it('finds an answer written a little differently, but not one that matches two options', () => {
    expect(findOption(['Je voudrais un café.', 'Je veux un café.'], 'je voudrais un café')).toBe(0);
    expect(findOption(['食《た》べる', '飲《の》む'], '食べる')).toBe(0);
    expect(findOption(['café', 'Café'], 'CAFÉ')).toBe(-1);
  });

  it('builds a sentence from tiles, in any order the model allows', () => {
    const e = parse({ ...SAMPLES.build!, answer: ['Hier', 'je suis', 'allé', 'au café'], also: [['je suis', 'allé', 'au café', 'Hier']], extra: ['j’ai'] });
    if (e?.kind !== 'order') throw new Error('not an order');
    const a = newAnswer();
    const tile = (t: string) => e.tiles.indexOf(t);
    a.order = ['Hier', 'je suis', 'allé', 'au café'].map(tile);
    expect(grade(step(e), a)).toBe(true);
    a.order = ['je suis', 'allé', 'au café', 'Hier'].map(tile);
    expect(grade(step(e), a)).toBe(true);
    a.order = ['Hier', 'j’ai', 'allé', 'au café'].map(tile);
    expect(grade(step(e), a)).toBe(false);
  });

  it('splits a proofreading paragraph into words, the mistake marked', () => {
    const e = parse(SAMPLES.proofread!);
    if (e?.kind !== 'proofread') throw new Error('not proofread');
    expect(e.tokens.map((t) => t.text).join('')).toBe('Le matin, je vais au café. Actuellement, je préfère le thé et je lis le journal tous les jours.');
    expect(e.tokens.filter((t) => t.error === 0).map((t) => t.text)).toEqual(['Actuellement,']);
    expect(e.prompt.question).toBe('There is 1 mistake. Tap it.');
  });

  it('marks every use of the form to spot, compound tenses as one', () => {
    const e = parse(SAMPLES.spot_form!);
    if (e?.kind !== 'proofread') throw new Error('not proofread');
    expect(e.errors.map((x) => x.fix)).toEqual(['', '']);
    expect(e.tokens.filter((t) => t.error === 1).map((t) => t.text.trim())).toEqual(['je', 'suis', 'allé']);
    expect(e.prompt.question).toBe('verbs in the passé composé: there are 2. Tap them.');
  });

  it('keeps a guess’s explanation for after the answer', () => {
    const e = parse(SAMPLES.guess!);
    if (e?.kind !== 'choice') throw new Error('not a choice');
    expect(e.options[e.answer]!.text).toBe('La Finlande');
    expect(e.more).toHaveLength(2);
    expect(parse({ ...SAMPLES.guess!, reveal: [] })).toBeNull();
  });

  it('reads a lesson level as its lower CEFR level', () => {
    expect(levelIndex('CEFR A1')).toBe(0);
    expect(levelIndex('CEFR A2–B1')).toBe(1);
    expect(levelIndex('B2–C1')).toBe(3);
    expect(levelIndex('')).toBe(0);
  });
});

describe('parsePractice', () => {
  const input = { type: getExerciseType('meaning')!, setting: 'a café', seed: 's' };
  const line = JSON.stringify({ ...SAMPLES.meaning, praise: 'Bravo !' });

  it('reads the exercise and its praise', () => {
    const p = parsePractice(line, input)!;
    expect(p.step.type).toBe('meaning');
    expect(p.step.instruction).toBe('What does this mean?');
    expect(p.praise).toBe('Bravo !');
    expect(p.setting).toBe('a café');
  });

  it('finds the JSON inside a code fence', () => {
    expect(parsePractice('```json\n' + line + '\n```', input)).not.toBeNull();
  });

  it('turns down one that is broken, not JSON, or of another type', () => {
    expect(parsePractice(JSON.stringify({ ...SAMPLES.meaning, answer: 'jam' }), input)).toBeNull();
    expect(parsePractice('Here you go!', input)).toBeNull();
    expect(parsePractice(JSON.stringify(SAMPLES.gap), input)).toBeNull();
  });

  it('shuffles the same way for the same seed', () => {
    expect(parsePractice(line, input)).toEqual(parsePractice(line, input));
  });
});

describe('a page exercise', () => {
  const sections = [
    { heading: '', text: 'The snow leopard lives in the mountains of Central Asia.' },
    { heading: 'Diet', text: 'It hunts wild sheep and goats, and eats about one large animal every ten days.' },
  ];
  const input = choosePagePractice({
    language: 'French',
    type: 'gap',
    seed: 's',
    title: 'Snow leopard',
    sections,
    focus: 1,
    level: 'A2',
    pageWords: [{ target: 'le tigre', english: ['tiger'] }, { target: 'la chèvre', english: ['goat', 'goats'] }],
    grammar: [{ id: 'g', level: 'A2', label: 'Passé composé', instruction: 'Use it for a finished action.', example: 'Il a mangé.' }],
  })!;

  it('is about the section on screen, with the words in it first, true to the page', () => {
    expect(input.setting).toBe('Diet');
    if (input.mode !== 'page') throw new Error('not a page');
    expect(input.words[0]!.target).toBe('la chèvre');
    const prompt = buildPracticePrompt(input);
    expect(prompt).toContain('It hunts wild sheep and goats');
    expect(prompt).toContain('la chèvre (goat)');
    expect(prompt).toContain('Passé composé: Use it for a finished action.');
    expect(prompt).toContain("true according to the page");
    expect(prompt).not.toContain('<lesson>');
  });
});

