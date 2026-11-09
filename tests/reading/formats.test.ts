import { describe, expect, it } from 'vitest';
import { fr } from '../../src/languages/fr';
import { basics } from '../../src/lessons/basics';
import { themed } from '../../src/lessons/themed';
import {
  buildReadingPrompt,
  buildReadingSystemPrompt,
  finishedLines,
  getFormat,
  parseReadingLines,
  READING_FORMATS,
  readingBrief,
  recapLines,
  type ReadingInput,
} from '../../src/reading/formats';

const input: ReadingInput = {
  title: 'Snow leopard',
  headings: ['Description', 'Diet'],
  onScreen: ['The snow leopard is a large cat. A litter has two or three cubs.'],
  woven: ['grise (grey)'],
  pageWords: [{ forms: ['cat'], lemma: 'chat' }],
};

describe('formats', () => {
  it('has 4 formats, one written by code', () => {
    expect(READING_FORMATS.map((f) => f.id)).toEqual(['facts', 'why', 'text', 'recap']);
    expect(READING_FORMATS.filter((f) => f.local).map((f) => f.id)).toEqual(['recap']);
    expect(getFormat('board').id).toBe('facts'); // a removed format, still saved in settings
  });

  it('never names a lesson in a task: the brief does that', () => {
    for (const f of READING_FORMATS) expect(f.task).not.toMatch(/bonjour|greeting|numbers 0/i);
  });
});

describe('briefs', () => {
  it("uses the lesson's brief", () => {
    const brief = readingBrief(basics);
    expect(brief.teaches).toContain('comment ça va');
    const system = buildReadingSystemPrompt(fr, brief);
    expect(system).toContain(`Their lesson teaches: ${brief.teaches}`);
    expect(system).toContain('French||English');
  });

  it("themed words teach the page's own words", () => {
    expect(readingBrief(themed, [{ forms: ['dog'], lemma: 'chien' }]).teaches).toContain('chien (dog)');
  });
});

describe('buildReadingPrompt', () => {
  it('sends what the format reads, and its task', () => {
    const page = buildReadingPrompt(getFormat('facts'), input);
    expect(page).toContain('<headings>\nDescription\nDiet');
    expect(page).toContain('two or three cubs');
    expect(page).toContain('<page_words>chat</page_words>');
    expect(page).toContain(`Task: ${getFormat('facts').task}`);
    const summary = buildReadingPrompt(getFormat('summary'), { ...input, highlighted: 'Islay has over 3,000 inhabitants.' });
    expect(summary).toContain('<highlighted>\nIslay has over 3,000 inhabitants.\n</highlighted>');
    expect(summary).not.toContain('<on_screen>');
    expect(READING_FORMATS.map((f) => f.id)).not.toContain('summary'); // shown on a highlight, not picked
    const why = buildReadingPrompt(getFormat('why'), input);
    expect(why).toContain('<woven>\ngrise (grey)');
    expect(why).not.toContain('<headings>');
  });
});

describe('parseReadingLines', () => {
  const source = 'A litter has 2 or 3 cubs. There are 9 films.';
  it('reads French||English lines up to the format’s limit', () => {
    expect(parseReadingLines('1. Bonjour !||Hello!\nnot a line\nSalut||Hi\nCiao||Bye', { maxLines: 2, source })).toEqual([
      { fr: 'Bonjour !', en: 'Hello!' },
      { fr: 'Salut', en: 'Hi' },
    ]);
  });

  it('keeps a number written without its thousands separator', () => {
    expect(parseReadingLines('Environ trois mille (3000) personnes.||About 3,000 people.', { maxLines: 2, source: 'over 3,000 inhabitants' })).toHaveLength(1);
  });

  it('drops repeats and notes the model wrote to itself', () => {
    const text = 'Il est gris.||It is grey.\nIl est gris !||It is grey!\nLucas est allé.||(Avoid — invalid; see below)';
    expect(parseReadingLines(text, { maxLines: 5, source })).toEqual([{ fr: 'Il est gris.', en: 'It is grey.' }]);
  });

  it('drops lines whose bracketed digits are not on the page', () => {
    const text = 'Il y a deux ou trois (2–3) petits.||Two or three cubs.\nIl y a douze (12) films.||Twelve films.\nNeuf (9) films.||Nine films.';
    expect(parseReadingLines(text, { maxLines: 5, source }).map((l) => l.en)).toEqual(['Two or three cubs.', 'Nine films.']);
  });
});

describe('finishedLines', () => {
  it('leaves out the line still being written', () => {
    const opts = { maxLines: 8, source: '' };
    expect(finishedLines('Bonjour !||Hello!\nSalut||H', opts)).toEqual([{ fr: 'Bonjour !', en: 'Hello!' }]);
    expect(finishedLines('Salut||H', opts)).toEqual([]);
    expect(finishedLines('Bonjour !||Hello!\nSalut||Hi\n', opts)).toHaveLength(2);
  });
});

describe('recapLines', () => {
  it('groups woven words by category, most frequent first', () => {
    const lines = recapLines(
      [
        { french: 'deux', category: 'numbers', count: 3 },
        { french: 'trois', category: 'numbers', count: 5 },
        { french: 'le chien', category: 'page', count: 2 },
      ],
      [
        { id: 'greetings', label: 'Greetings' },
        { id: 'numbers', label: 'Numbers' },
        { id: 'page', label: 'Words from this page' },
      ],
    );
    expect(lines).toEqual([
      { fr: 'trois, deux', en: 'Numbers' },
      { fr: 'le chien', en: 'Words from this page' },
    ]);
  });
});
