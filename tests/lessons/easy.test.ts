import { describe, expect, it } from 'vitest';
import { basics } from '../../src/lessons/basics';
import { EASY_WORDS, easyWordsLesson } from '../../src/lessons/easy';
import { withExtras } from '../../src/lessons/extras';
import { allocatePageWords } from '../../src/lessons/pageWords';

const easy = easyWordsLesson(EASY_WORDS, [], 'French');
const found = (text: string) => easy.findCandidates(text).map((c) => c.text);

describe('easy words', () => {
  it('finds the easiest words in a paragraph, in all their forms', () => {
    expect(found('The dogs ran to the old house in the snow.')).toEqual(['dogs', 'ran', 'old', 'house', 'snow']);
  });

  it('skips names: capitalised mid-sentence, or followed by another capital', () => {
    expect(found('Star Wars: a film. It sat near Green Bay with Mr Brown.')).toEqual(['film']);
    expect(found('Snow fell at night.')).toEqual(['Snow', 'night']);
  });

  it('includes the most common small words, after the nouns', () => {
    expect(found('The dog is from the sea.')).toEqual(['dog', 'is', 'from', 'sea']);
    const [dog, is] = easy.findCandidates('The dog is here.');
    expect(dog!.tier).toBeLessThan(is!.tier);
  });

  it('skips hyphenated compounds and possessives', () => {
    expect(found("A well-known dog-friendly car's engine.")).toEqual([]);
  });

  it('accepts any of the lemmas listed for a word', () => {
    const [c] = easy.findCandidates('Our people.');
    expect(easy.lemmasFor(c!)).toEqual(['gens', 'personne']);
  });

  it('spends the very easiest words first', () => {
    const text = 'The children often played together with the dog in the garden.';
    const picks = allocatePageWords([{ text, candidates: easy.findCandidates(text), taken: [] }], [2]);
    // Rank 1 (children, dog, garden) before rank 2 (often, played, together).
    expect(picks[0]!.map((c) => c.text)).toEqual(['children', 'dog']);
  });

  it('leaves out what the lesson or the page already covers, keeping ids stable', () => {
    const without = easyWordsLesson(EASY_WORDS, ['chien'], 'French');
    expect(without.findCandidates('The dog and the cat.').map((c) => c.text)).toEqual(['cat']);
    expect(without.findCandidates('The cat.')[0]!.entryId).toBe(easy.findCandidates('The cat.')[0]!.entryId);
  });

  it('comes with Les bases and is matched by the combined lesson', () => {
    const { lesson, easy: e } = withExtras(basics);
    expect(e).toBeDefined();
    const text = 'The teacher drove a red car.';
    const ids = lesson.findCandidates(text).map((c) => [c.text, lesson.categoryOf(c)]);
    expect(ids).toEqual([['teacher', 'classroom'], ['red', 'easy'], ['car', 'easy']]);
  });
});

describe('easy words without top-up', () => {
  it('are still planned when the free top-up is off', async () => {
    const { planPage } = await import('../../src/weave/plan');
    const { collectSegments } = await import('../../src/weave/segment');
    document.body.innerHTML = '<p>Many species are red or orange, while others are blue, grey or brown, and live in the sea.</p>';
    const plans = planPage(collectSegments(document.body), { density: 0.2, lesson: basics, easyWords: withExtras(basics).easy, topUp: false, level: 'A1', hasKey: true });
    expect(plans[0]!.remote.filter((c) => c.entryId.startsWith('easy:')).length).toBeGreaterThan(0);
    expect(plans[0]!.topUpWords).toBe(0);
  });
});
