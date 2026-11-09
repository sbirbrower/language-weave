import { describe, expect, it } from 'vitest';
import { fr } from '../src/languages/fr';
import { PageVocab } from '../src/pageVocab';
import type { Replacement } from '../src/weave/select';
import type { Written } from '../src/weave/write';

function written(original: string, lemma: string, extra: Partial<Replacement> = {}): Written {
  const element = document.createElement('span');
  document.body.append(element);
  return {
    replacement: { original, replacement: lemma, lemma, gender: '-', pos: 'verb', gloss: '', start: 0, end: 1, words: 1, ...extra },
    element,
  };
}

describe('PageVocab', () => {
  it('groups by lemma and category, counting words and English forms', () => {
    const v = new PageVocab(fr);
    v.add([written('said', 'dire', { category: 'classroom' }), written('says', 'Dire', { category: 'classroom' })], 'extra');
    v.add([written('the Sanskrit word', 'mot', { gender: 'm', pos: 'noun', category: 'classroom', term: 'word', words: 3 })], 'extra');
    v.add([written('the forest', 'forêt', { gender: 'f', pos: 'noun', words: 2 })], 'extra');
    expect(v.list().map((i) => [i.french, i.english, i.count, i.category])).toEqual([
      ['dire', ['said', 'says'], 2, 'classroom'],
      ['la forêt', ['the forest'], 1, 'extra'],
      ['le mot', ['word'], 1, 'classroom'],
    ]);
    expect(v.wovenWords).toBe(7);
  });

  it('cycles through occurrences and skips removed ones', () => {
    const v = new PageVocab(fr);
    const a = written('and', 'et');
    const b = written('and', 'et');
    v.add([a, b], 'everyday');
    const key = v.list()[0]!.key;
    expect(v.next(key)).toBe(a.element);
    expect(v.next(key)).toBe(b.element);
    b.element.remove();
    expect(v.next(key)).toBe(a.element);
    v.clear();
    expect(v.next(key)).toBeUndefined();
  });
});
