import { describe, expect, it } from 'vitest';
import { buildDefinePrompt, definitionKey, parseDefinitions } from '../../src/vocab/definitions';

const entry = (word: string, definition = 'word') => ({ word, definition, example: 'Ein Wort.', english: 'A word.' });

describe('parseDefinitions', () => {
  it('finds each entry by its word', () => {
    const text = JSON.stringify({ entries: [entry('der Hund', 'dog'), entry('das Wort')] });
    const parsed = parseDefinitions(text, ['das Wort', 'der Hund']);
    expect(parsed['das Wort']).toEqual({ definition: 'word', example: 'Ein Wort.', english: 'A word.' });
    expect(parsed['der Hund']?.definition).toBe('dog');
  });

  it('falls back to the order when the model changed a word', () => {
    const text = JSON.stringify({ entries: [entry('Wort'), entry('der Hund', 'dog')] });
    expect(Object.keys(parseDefinitions(text, ['das Wort', 'der Hund']))).toEqual(['das Wort', 'der Hund']);
  });

  it('drops entries with no definition', () => {
    expect(parseDefinitions(JSON.stringify({ entries: [entry('das Wort', '')] }), ['das Wort'])).toEqual({});
  });
});

describe('buildDefinePrompt', () => {
  it('names the language and level, never another', () => {
    const prompt = buildDefinePrompt([{ word: 'das Wort', gloss: 'word' }], 'German', 'A2');
    expect(prompt).toContain('German');
    expect(prompt).toContain('A2');
    expect(prompt).not.toContain('French');
  });
});

it('keys definitions by language and lemma', () => {
  expect(definitionKey('de', 'das Wort')).toBe(definitionKey('de', 'das Wort'));
  expect(definitionKey('de', 'das Wort')).not.toBe(definitionKey('nl', 'das Wort'));
});
