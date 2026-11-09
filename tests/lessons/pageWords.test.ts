import { beforeEach, describe, expect, it } from 'vitest';
import { fr } from '../../src/languages/fr';
import { getLesson } from '../../src/lessons';
import { basics } from '../../src/lessons/basics';
import { themed } from '../../src/lessons/themed';
import { withExtras } from '../../src/lessons/extras';
import { forLevel } from '../../src/lessons/level';
import {
  allocatePageWords,
  buildPickPrompt,
  buildPickSystemPrompt,
  fitToPage,
  pageWordsLesson,
  parsePageWords,
  withPageWords,
  type PageWord,
} from '../../src/lessons/pageWords';
import { matchLessonResponse } from '../../src/lessons/resolve';
import { planPage } from '../../src/weave/plan';
import { buildLessonPrompt, levelNote } from '../../src/weave/prompt';
import { collectSegments } from '../../src/weave/segment';
import { countWords } from '../../src/weave/select';

const words: PageWord[] = [
  { forms: ['dog', 'dogs'], lemma: 'chien' },
  { forms: ['run', 'running', 'ran'], lemma: 'courir' },
  { forms: ['fast'], lemma: 'rapide' },
];
const page = pageWordsLesson(words, 'French');

describe('parsePageWords', () => {
  it('reads English forms and the French lemma', () => {
    const parsed = parsePageWords('dog|Dogs||chien\n- run|running||courir');
    expect(parsed).toEqual([
      { forms: ['dog', 'dogs'], lemma: 'chien' },
      { forms: ['run', 'running'], lemma: 'courir' },
    ]);
  });

  it('drops malformed lines, repeated lemmas and forms, and forms that are not words', () => {
    const parsed = parsePageWords(
      ['Here are the words:', 'dog||chien', 'hound|dog||chien', 'puppy|dog||chiot', '1990s||années', 'a b c d||x', 'cat||chat||m'].join('\n'),
    );
    expect(parsed.map((w) => [w.forms, w.lemma])).toEqual([[['dog'], 'chien'], [['puppy'], 'chiot']]);
  });
});

describe('fitToPage', () => {
  const texts = ['Our dogs love running in the cold.', 'A dog is a good friend.'];

  it('keeps words that occur on the page', () => {
    expect(fitToPage([{ forms: ['dog', 'dogs'], lemma: 'chien' }], texts)).toEqual([{ forms: ['dog', 'dogs'], lemma: 'chien' }]);
  });

  it('swaps fields written the wrong way round', () => {
    const parsed = parsePageWords('chien||dog|dogs\nfroid||cold');
    expect(fitToPage(parsed, texts)).toEqual([
      { forms: ['dog', 'dogs'], lemma: 'chien' },
      { forms: ['cold'], lemma: 'froid' },
    ]);
  });

  it('drops words that occur nowhere on the page', () => {
    expect(fitToPage([{ forms: ['horse'], lemma: 'cheval' }], texts)).toEqual([]);
  });
});

describe('buildPickPrompt', () => {
  it('sends the title, headings and on-screen text, and what the lesson already teaches', () => {
    const user = buildPickPrompt({ title: 'Whippet', headings: ['History', 'Racing'], passages: ['The whippet is a dog.'], exclude: ['et'], level: 'A2' });
    expect(user).toContain('<title>Whippet</title>');
    expect(user).toContain('History\nRacing');
    expect(user).toContain('The whippet is a dog.');
    expect(user).toContain('leave them out: et');
  });

  it("asks for the reader's level in the request, never in the system prompt", () => {
    const at = (level: 'A1' | 'B1') => buildPickPrompt({ title: 't', headings: [], passages: ['x'], level });
    expect(at('A1')).toContain('beginner (A1)');
    expect(at('B1')).toContain('B1');
    expect(at('B1')).not.toContain('A1');
    expect(buildPickSystemPrompt(fr)).not.toMatch(/\b(A1|A2|B1|B2)\b/);
  });

  it('stops adding passages past the size limit', () => {
    const user = buildPickPrompt({ title: 't', headings: [], passages: ['x'.repeat(2000), 'z'.repeat(2000)], level: 'A2' });
    expect(user).toContain('x'.repeat(2000));
    expect(user).not.toContain('z');
  });
});

describe('pageWordsLesson', () => {
  it('finds every form, preferring the longest', () => {
    const found = page.findCandidates('Dogs love running; a dog ran fast, but not dogsled racing.');
    expect(found.map((c) => c.text)).toEqual(['Dogs', 'running', 'dog', 'ran', 'fast']);
  });

  it('is always written by the model, with the picked lemma', () => {
    const [c] = page.findCandidates('The dog.');
    expect(page.resolveLocally(c!, 'The dog.')).toBeNull();
    expect(page.lemmasFor(c!)).toEqual(['chien']);
    expect(page.describeCandidate(c!, 'The dog.')).toContain('"dog" (1st occurrence) → chien');
  });
});

describe('withPageWords', () => {
  it('sends each candidate to the lesson it came from', () => {
    const both = withPageWords(basics, page);
    const text = 'The teacher and her dog ran.';
    const found = both.findCandidates(text);
    const by = (t: string) => found.find((c) => c.text === t)!;
    expect(both.categoryOf(by('teacher'))).toBe('classroom');
    expect(both.categoryOf(by('dog'))).toBe('page');
    expect(both.resolveLocally(by('and'), text)?.replacement).toBe('et');
    expect(both.lemmasFor(by('ran'))).toEqual(['courir']);
    expect(both.topUpVocabulary).toBe(basics.topUpVocabulary);
  });
});

describe('allocatePageWords', () => {
  const seg = (text: string) => ({ text, candidates: page.findCandidates(text), taken: [] });

  it('takes turns between words instead of repeating the most frequent', () => {
    // The second segment starts with "dog", but "dog" was already used and "ran" wasn't.
    const texts = ['The dog is fast and the dog will run.', 'A dog ran past another dog that was fast.'];
    const picks = allocatePageWords(texts.map(seg), [1, 1]);
    expect(picks.map((cs) => cs.map((c) => c.text))).toEqual([['dog'], ['ran']]);
  });

  it('caps a word per page and keeps to each share', () => {
    const texts = Array.from({ length: 8 }, () => 'The quiet dog slept in the sun all afternoon.');
    const picks = allocatePageWords(texts.map(seg), texts.map(() => 1), { perEntryPerPage: 3, minGapWords: 3 });
    expect(picks.flat()).toHaveLength(3);
    expect(allocatePageWords(texts.map(seg), texts.map(() => 0)).flat()).toHaveLength(0);
  });

  it('leaves words the lesson already took', () => {
    const text = 'The dog sat at the door, then ran home.';
    const [dog] = page.findCandidates(text);
    const picks = allocatePageWords([{ text, candidates: page.findCandidates(text), taken: [dog!] }], [5]);
    expect(picks[0]!.map((c) => c.text)).toEqual(['ran']);
  });
});

describe('planPage with page words', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <p>The teacher said the dog was fast, and the dog could run for hours across the open fields near the river.</p>
      <p>Every morning the dogs ran along the beach with their owners, who were proud of how fast they were.</p>`;
  });
  const segments = () => collectSegments(document.body);
  const total = () => segments().reduce((n, s) => n + countWords(s.text), 0);
  const spent = (p: ReturnType<typeof planPage>[number]) =>
    p.local.reduce((n, r) => n + r.words, 0) + p.remote.reduce((n, c) => n + c.words, 0) + p.topUpWords + p.generalBudget;

  it('fills what the lesson leaves with page words, then the top-up, within the density', () => {
    const plans = planPage(segments(), { density: 0.2, lesson: basics, pageWords: page, topUp: true, level: 'A1', hasKey: true });
    const remote = plans.flatMap((p) => p.remote.map((c) => c.text));
    expect(remote).toEqual(expect.arrayContaining(['teacher', 'run', 'dogs']));
    expect(plans.reduce((n, p) => n + spent(p), 0)).toBe(Math.floor(total() * 0.2));
    expect(plans.every((p) => p.requests.length === 1 && p.requests[0]!.kind === 'lesson')).toBe(true);
    expect(plans[1]!.requests[0]!.user).toContain('"dogs" (1st occurrence) → chien');
  });

  it('themed words: page words plus the beginner list, in one request per segment', () => {
    const plans = planPage(segments(), { density: 0.2, lesson: themed, pageWords: page, topUp: true, level: 'A1', hasKey: true });
    expect(plans.reduce((n, p) => n + spent(p), 0)).toBe(Math.floor(total() * 0.2));
    expect(plans.every((p) => p.generalBudget === 0 && p.requests.length === 1 && p.requests[0]!.vocabulary)).toBe(true);
    expect(plans.flatMap((p) => p.remote.map((c) => c.text))).toEqual(expect.arrayContaining(['dog', 'dogs']));
  });

  it('themed words from B1: page words, then a general request at the reader’s level, no beginner lists', () => {
    const b1 = forLevel(themed, 'B1');
    const parts = withExtras(b1, words);
    expect(parts.easy).toBeUndefined();
    const plans = planPage(segments(), { density: 0.2, lesson: b1, pageWords: parts.page, easyWords: parts.easy, topUp: true, level: 'B1', hasKey: true });
    expect(plans.reduce((n, p) => n + spent(p), 0)).toBe(Math.floor(total() * 0.2));
    const requests = plans.flatMap((p) => p.requests);
    expect(requests.some((r) => r.vocabulary)).toBe(false);
    const general = requests.filter((r) => r.kind === 'general');
    expect(general.length).toBeGreaterThan(0);
    for (const r of general) expect(r.levelNote).toBe(levelNote('B1'));
    expect(plans.flatMap((p) => p.remote.map((c) => c.text))).toEqual(expect.arrayContaining(['dog', 'dogs']));
  });

  it('keeps the beginner lists up to A2', () => {
    expect(forLevel(themed, 'A2')).toBe(themed);
    expect(withExtras(forLevel(themed, 'A2'), words).easy).toBeDefined();
  });

  it("a lesson without page words doesn't get any", () => {
    const plans = planPage(segments(), { density: 0.2, lesson: basics, topUp: true, level: 'A1', hasKey: true });
    expect(plans.flatMap((p) => p.remote).filter((c) => c.entryId.startsWith('page:'))).toEqual([]);
  });

  it('ignores page words without a key', () => {
    const plans = planPage(segments(), { density: 0.2, lesson: basics, pageWords: page, topUp: true, level: 'A1', hasKey: false });
    expect(plans.flatMap((p) => p.remote).filter((c) => c.entryId.startsWith('page:'))).toEqual([]);
  });
});

describe('top-up next to page words', () => {
  it('tells the top-up to leave page words alone and rejects them if it adds more', () => {
    const both = withPageWords(basics, page);
    const text = 'Our dog loves the beach.';
    const prompt = buildLessonPrompt({ passage: text, lesson: both, candidates: [], topUp: { words: 3, taken: [] } });
    expect(prompt).toContain("don't use these lemmas: chien, courir, rapide");
    const lines = [{ original: 'Our dog', replacement: 'Notre chien', lemma: 'chien', gender: 'm' as const, pos: 'noun', gloss: 'dog' }];
    expect(matchLessonResponse(both, text, lines, [], [], 3).accepted).toEqual([]);
  });

  it("leaves the lesson's own words out of its beginner list", () => {
    expect(basics.topUpVocabulary!.lemmas.has('et')).toBe(false);
    expect(basics.topUpVocabulary!.lemmas.has('chien')).toBe(true);
  });
});

describe('matching page words', () => {
  it('accepts page words and on-list top-up words', () => {
    const text = 'The dog was very happy at the beach.';
    const lesson = withPageWords(themed, page);
    const candidates = lesson.findCandidates(text);
    const lines = [
      { original: 'The dog', replacement: 'Le chien', lemma: 'chien', gender: 'm' as const, pos: 'noun', gloss: 'dog' },
      { original: 'the beach', replacement: 'la plage', lemma: 'plage', gender: 'f' as const, pos: 'noun', gloss: 'beach' },
    ];
    const m = matchLessonResponse(lesson, text, lines, candidates, [], 2);
    expect(m.accepted.map((r) => [r.replacement, r.category])).toEqual([['Le chien', 'page'], ['la plage', 'extra']]);
  });
});

describe('themed lesson', () => {
  it('is its own choice, picks page words, and has no word bank', () => {
    expect(getLesson('themed', fr)?.pickPageWords).toBe(true);
    expect(basics.pickPageWords).toBeUndefined();
    expect(themed.findCandidates('Hello and thank you, twelve times.')).toEqual([]);
  });
});
