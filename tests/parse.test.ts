import { describe, expect, it } from 'vitest';
import { LineSplitter, parseLine, parseLines } from '../src/weave/parse';

describe('parseLine', () => {
  it('parses six fields', () => {
    expect(parseLine('of the house||de la maison||maison||f||noun||house')).toEqual({
      original: 'of the house',
      replacement: 'de la maison',
      lemma: 'maison',
      gender: 'f',
      pos: 'noun',
      gloss: 'house',
    });
  });

  it('trims fields and strips list markers and backticks', () => {
    expect(parseLine('  - the dog || le chien ||chien|| M ||Noun|| dog ')).toMatchObject({
      original: 'the dog',
      replacement: 'le chien',
      gender: 'm',
      pos: 'noun',
    });
    expect(parseLine('2. `the dog||le chien||chien||m||noun||dog`')?.original).toBe('the dog');
  });

  it('maps unknown genders to -', () => {
    expect(parseLine('quickly||rapidement||rapidement||x||adv||quickly')?.gender).toBe('-');
  });

  it('drops malformed lines', () => {
    expect(parseLine('Here are the replacements:')).toBeNull();
    expect(parseLine('the dog||le chien||chien||m||noun')).toBeNull();
    expect(parseLine('the dog||le chien||chien||m||noun||dog||extra')).toBeNull();
    expect(parseLine('||le chien||chien||m||noun||dog')).toBeNull();
  });

  it('parses a block and skips junk', () => {
    const text = 'the dog||le chien||chien||m||noun||dog\n\nnot a line\nthe apple||la pomme||pomme||f||noun||apple';
    expect(parseLines(text).map((l) => l.replacement)).toEqual(['le chien', 'la pomme']);
  });
});

describe('LineSplitter', () => {
  it('emits complete lines across chunk boundaries', () => {
    const s = new LineSplitter();
    expect(s.push('the dog||le ch')).toEqual([]);
    expect(s.push('ien||chien||m||noun||dog\nthe ap')).toEqual(['the dog||le chien||chien||m||noun||dog']);
    expect(s.push('ple||la pomme')).toEqual([]);
    expect(s.flush()).toEqual(['the apple||la pomme']);
    expect(s.flush()).toEqual([]);
  });

  it('handles CRLF', () => {
    const s = new LineSplitter();
    expect(s.push('a\r\nb\r\n')).toEqual(['a', 'b']);
  });
});
