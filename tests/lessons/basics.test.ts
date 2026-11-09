import { describe, expect, it } from 'vitest';
import { basics } from '../../src/lessons/basics';
import { numberToFrench } from '../../src/lessons/basics/numbers';

/** "entryId:matched text" for every candidate, in document order. */
const found = (text: string) => basics.findCandidates(text).map((c) => `${c.entryId}:${c.text}`);
const ids = (text: string) => basics.findCandidates(text).map((c) => c.entryId);

describe('basics bank', () => {
  it('has unique entry ids', () => {
    const all = basics.entries.map((e) => e.id);
    expect(new Set(all).size).toBe(all.length);
  });

  it('finds the lesson phrases, preferring them over their parts', () => {
    expect(found('Well, see you soon!')).toEqual(['well:Well', 'see-you-soon:see you soon']);
    expect(found('Hello, how are you?')).toEqual(['hello:Hello', 'how-are-you:how are you']);
    expect(found('I don’t understand, please repeat that.')).toEqual([
      'dont-understand:I don’t understand',
      'please-repeat:please repeat that',
    ]);
    expect(ids('Thank you very much, and you?')).toEqual(['thank-you', 'and-you']);
  });

  it('skips lookalikes and fixed expressions', () => {
    expect(ids('Concatenate the strings')).toEqual([]);
    expect(ids('the very thing she wanted')).toEqual([]);
    expect(ids('everything but the kitchen sink')).toEqual([]);
    expect(ids('thanks to the river')).toEqual([]);
    expect(ids('as soon as possible')).toEqual([]);
    expect(ids('a well-known teacher’s book')).toEqual([]);
    expect(ids('How many apples?')).toEqual([]);
    expect(ids('the classroom and/or hall')).toEqual([]);
  });

  it('matches titles by case', () => {
    expect(ids('Mr. Darcy met Mrs. Bennet and Miss Lucas.')).toEqual(['mr', 'mrs', 'and', 'miss']);
    expect(ids('I miss them, sir.')).toEqual(['sir']);
  });

  describe('numbers 0–20', () => {
    it('finds bare digits and number words', () => {
      expect(found('There are 3 rivers, twelve bridges and 20 boats.')).toEqual([
        'num-3:3',
        'num-12:twelve',
        'and:and',
        'num-20:20',
      ]);
    });

    it('skips decimals, times, ranges, prices, percentages, years and ordinals', () => {
      for (const text of ['3.5 km', 'at 5:30 today', 'pages 4-7', 'years 1914–18', 'costs $5', '10% of', 'in 1998', 'the 5th day', '1,000 people']) {
        expect(ids(text).filter((id) => id.startsWith('num-')), text).toEqual([]);
      }
    });

    it('keeps the number but not "No." in "No. 7"', () => {
      expect(ids('No. 7')).toEqual(['num-7']);
    });

    it('skips hyphenated compounds', () => {
      expect(ids('twenty-one guns')).toEqual([]);
    });

    it('has a 0–20 oracle', () => {
      expect([0, 1, 7, 16, 17, 20].map(numberToFrench)).toEqual(['zéro', 'un', 'sept', 'seize', 'dix-sept', 'vingt']);
      expect(numberToFrench(21)).toBeNull();
      expect(numberToFrench(2.5)).toBeNull();
    });
  });

  describe('resolveLocally', () => {
    const local = (text: string) =>
      basics.findCandidates(text).map((c) => basics.resolveLocally(c, text)?.replacement ?? null);

    it('writes fixed words with matching case', () => {
      expect(local('And very soon, 7 boats.')).toEqual(['Et', 'très', 'bientôt', 'sept']);
    });

    it('keeps number words lowercase, since digits lead', () => {
      expect(local('Twelve boats.')).toEqual(['douze']);
    });

    it('capitalises titles only at the start of a sentence', () => {
      expect(local('Mr. Darcy left. Then Mr. Bingley came.')).toEqual(['Monsieur', 'monsieur']);
    });

    it('leaves context-dependent words to the model', () => {
      expect(local('She said hello to one friend.')).toEqual([null, null, null, null]);
    });
  });

  it('describes candidates with occurrence, lemma and hint', () => {
    const text = 'He said no, then said yes.';
    const second = basics.findCandidates(text).filter((c) => c.entryId === 'say')[1]!;
    expect(basics.describeCandidate(second, text)).toMatch(/^"said" \(2nd occurrence\) → dire \[lemma: dire\] — conjugate/);
  });
});

describe('class', () => {
  it('is a school class, not a category', () => {
    const found = (t: string) => basics.findCandidates(t).filter((c) => c.entryId === 'lesson').map((c) => c.text);
    expect(found('Starfish are a class of echinoderms in the taxonomic class Asteroidea.')).toEqual([]);
    expect(found('The working class. After class, the lessons ended.')).toEqual(['class', 'lessons']);
  });
});
