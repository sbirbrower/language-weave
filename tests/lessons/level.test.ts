import { describe, expect, it } from 'vitest';
import { a1WordsFor } from '../../src/lessons/a1';
import { aboveBeginner } from '../../src/lessons/level';
import type { WeaveLine } from '../../src/weave/parse';

const line = (lemma: string): WeaveLine => ({ original: 'x', replacement: lemma, lemma, gender: '-', pos: 'noun', gloss: 'x' });

describe('aboveBeginner', () => {
  const a1 = a1WordsFor('hi')![0]!.lemma;
  const lines = [line(a1), line('प्रवृत्ति《pravṛtti》')];

  it('turns away A1 lemmas from B1, whatever the reading says', () => {
    const { kept, rejected } = aboveBeginner([...lines, line(a1.replace(/《.*》/u, '《other》'))], 'B1', 'hi');
    expect(kept.map((l) => l.lemma)).toEqual(['प्रवृत्ति《pravṛtti》']);
    expect(rejected.map((r) => r.reason)).toEqual(['off-lesson', 'off-lesson']);
  });

  it('keeps every line up to A2, and in a language without an A1 list', () => {
    expect(aboveBeginner(lines, 'A2', 'hi').kept).toEqual(lines);
    expect(aboveBeginner(lines, 'B2', 'xx').kept).toEqual(lines);
  });
});
