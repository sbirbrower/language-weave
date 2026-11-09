import { describe, expect, it } from 'vitest';
import { findAll, locate } from '../src/weave/locate';

describe('findAll', () => {
  it('respects word boundaries', () => {
    expect(findAll('concatenate the cat', 'cat')).toEqual([{ start: 16, end: 19 }]);
    expect(findAll('cats and a cat.', 'cat')).toEqual([{ start: 11, end: 14 }]);
  });

  it('treats accented letters as word characters', () => {
    expect(findAll('café cafés', 'café')).toEqual([{ start: 0, end: 4 }]);
  });

  it("matches before an apostrophe or hyphen", () => {
    expect(findAll("the dog's bone", 'the dog')).toEqual([{ start: 0, end: 7 }]);
    expect(findAll('well-known', 'known')).toEqual([{ start: 5, end: 10 }]);
  });

  it('only checks a boundary where the needle has a word character', () => {
    expect(findAll('in the U.S.A today', 'U.S.')).toEqual([{ start: 7, end: 11 }]);
  });

  it('is case-sensitive', () => {
    expect(findAll('The dog', 'the dog')).toEqual([]);
  });

  it('finds every occurrence', () => {
    expect(findAll('the dog saw the dog', 'the dog')).toHaveLength(2);
  });
});

describe('locate', () => {
  const text = 'the dog saw the dog';

  it('picks the first free occurrence', () => {
    expect(locate(text, 'the dog')).toEqual({ ok: true, span: { start: 0, end: 7 } });
    expect(locate(text, 'the dog', { taken: [{ start: 0, end: 7 }] })).toEqual({
      ok: true,
      span: { start: 12, end: 19 },
    });
  });

  it('reports overlap separately from not-found', () => {
    const taken = [{ start: 0, end: 19 }];
    expect(locate(text, 'the dog', { taken })).toEqual({ ok: false, reason: 'overlap' });
    expect(locate(text, 'the cat')).toEqual({ ok: false, reason: 'not-found' });
  });

  it('picks the occurrence nearest a hint', () => {
    expect(locate(text, 'the dog', { near: 14 })).toEqual({ ok: true, span: { start: 12, end: 19 } });
  });
});
