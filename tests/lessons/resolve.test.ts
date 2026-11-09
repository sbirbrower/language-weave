import { describe, expect, it } from 'vitest';
import { basics } from '../../src/lessons/basics';
import { matchLessonResponse, matchLines, normalizeLemma, resolveLocal } from '../../src/lessons/resolve';
import type { WeaveLine } from '../../src/weave/parse';

const line = (original: string, replacement: string, lemma: string): WeaveLine => ({
  original,
  replacement,
  lemma,
  gender: '-',
  pos: 'verb',
  gloss: '',
});

const text = 'She said she had one apple and said nothing else.';
const candidates = basics.findCandidates(text);
const { local, remote } = resolveLocal(basics, text, candidates);

describe('resolveLocal', () => {
  it('splits fixed words from model words', () => {
    expect(local.map((r) => [r.original, r.replacement, r.category])).toEqual([['and', 'et', 'everyday']]);
    expect(remote.map((c) => c.text)).toEqual(['said', 'one', 'said']);
  });
});

describe('numerals', () => {
  it('attaches digits to number replacements, written in code or by the model', () => {
    const t = 'Twelve boats and one apple.';
    const { local, remote } = resolveLocal(basics, t, basics.findCandidates(t));
    expect(local.map((r) => [r.replacement, r.numeral])).toEqual([['douze', '12'], ['et', undefined]]);
    const { accepted } = matchLines(basics, t, [line('one apple', 'une pomme', 'une')], remote, local);
    expect(accepted[0]?.numeral).toBe('1');
  });
});

describe('matchLines', () => {
  it('accepts a line covering a candidate with an allowed lemma', () => {
    const { accepted, rejected } = matchLines(basics, text, [line('She said', 'Elle a dit', 'dire')], remote, local);
    expect(rejected).toEqual([]);
    expect(accepted).toMatchObject([{ start: 0, end: 8, replacement: 'Elle a dit', category: 'classroom' }]);
  });

  it('accepts a span extended for agreement', () => {
    const { accepted } = matchLines(basics, text, [line('one apple', 'une pomme', 'une')], remote, local);
    expect(accepted).toMatchObject([{ original: 'one apple', term: 'one', category: 'numbers' }]);
  });

  it('matches repeated words to separate candidates', () => {
    const lines = [line('said', 'a dit', 'dire'), line('said', 'n’a rien dit', 'dire')];
    const { accepted } = matchLines(basics, text, lines, remote, local);
    expect(accepted.map((r) => r.start)).toEqual([4, 31]);
  });

  it('rejects lemmas the lesson does not allow, and spans with no candidate', () => {
    const lines = [line('said', 'déclara', 'déclarer'), line('apple', 'pomme', 'pomme'), line('elephant', 'éléphant', 'éléphant')];
    const { accepted, rejected } = matchLines(basics, text, lines, remote, local);
    expect(accepted).toEqual([]);
    expect(rejected.map((r) => r.reason)).toEqual(['off-lesson', 'off-lesson', 'not-found']);
  });

  it('does not overlap words already written in code', () => {
    const { rejected } = matchLines(basics, text, [line('apple and', 'pomme et', 'et')], remote, local);
    expect(rejected.map((r) => r.reason)).toEqual(['overlap']);
  });
});

describe('normalizeLemma', () => {
  it('ignores case, apostrophe style and end punctuation', () => {
    expect(normalizeLemma('Comment ça va ?')).toBe('comment ça va');
    expect(normalizeLemma('Qu’est-ce que ça veut dire')).toBe("qu'est-ce que ça veut dire");
  });
});

describe('matchLessonResponse', () => {
  const t = 'The teacher said the dog ran into the big garden and slept.';
  const { local, remote } = resolveLocal(basics, t, basics.findCandidates(t));

  it('accepts candidate lines and on-list top-up words within the top-up budget', () => {
    const lines = [
      line('The teacher', 'Le professeur', 'professeur'),
      line('the dog', 'le chien', 'chien'),
      line('the big garden', 'le grand jardin', 'jardin'),
    ];
    const { accepted, rejected } = matchLessonResponse(basics, t, lines, remote, local, 2);
    expect(accepted.map((r) => [r.original, r.category])).toEqual([
      ['The teacher', 'classroom'],
      ['the dog', 'extra'],
    ]);
    expect(rejected.map((r) => r.reason)).toEqual(['over-budget']);
  });

  it('rejects top-up words that are not on the list', () => {
    const { accepted, rejected } = matchLessonResponse(basics, t, [line('slept', 'dormit', 'roupiller')], remote, local, 3);
    expect(accepted).toEqual([]);
    expect(rejected.map((r) => r.reason)).toEqual(['off-lesson']);
  });

  it('accepts no top-up words when none were asked for', () => {
    const { accepted } = matchLessonResponse(basics, t, [line('the dog', 'le chien', 'chien')], remote, local, 0);
    expect(accepted).toEqual([]);
  });
});
