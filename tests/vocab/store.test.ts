import { describe, expect, it } from 'vitest';
import { ankiCsv, applyEvent, LISTED_LISTENS, MAX_CONTEXTS, newVocab, PROMOTION, wordLists, type Vocab, type WordContext } from '../../src/vocab/store';

const info = (key = 'chien', english = 'dog') => ({ key, word: `le ${key}`, gloss: 'dog', english });
const context = (sentence: string): WordContext => ({ sentence, start: 0, end: 5, title: 'Dogs', url: 'https://example.com', day: '2026-11-08' });
const seen = (v: Vocab, n: number, key = 'chien') => {
  for (let i = 0; i < n; i++) applyEvent(v, { kind: 'seen', info: info(key) }, '2026-11-08');
};
const listen = (v: Vocab, n: number, key = 'chien') => {
  for (let i = 0; i < n; i++) applyEvent(v, { kind: 'listen', key }, '2026-11-08');
};

describe('applyEvent', () => {
  it('counts pages and keeps the English it replaced', () => {
    const v = newVocab();
    applyEvent(v, { kind: 'seen', info: info('chien', 'dog') }, '2026-11-01');
    applyEvent(v, { kind: 'seen', info: info('chien', 'hound') }, '2026-11-08');
    expect(v.words['chien']).toMatchObject({ status: 'seen', pages: 2, english: ['dog', 'hound'], firstSeen: '2026-11-01', lastSeen: '2026-11-08' });
  });

  it('keeps sentences for saved words only, latest first, no repeats', () => {
    const v = newVocab();
    applyEvent(v, { kind: 'seen', info: info(), context: context('A dog.') }, '2026-11-08');
    expect(v.words['chien']!.contexts).toEqual([]);
    applyEvent(v, { kind: 'set', info: info(), status: 'saved', context: context('A dog.') }, '2026-11-08');
    for (const s of ['B dog.', 'A dog.', 'C dog.', 'D dog.']) applyEvent(v, { kind: 'seen', info: info(), context: context(s) }, '2026-11-08');
    expect(v.words['chien']!.contexts.map((c) => c.sentence)).toEqual(['D dog.', 'C dog.', 'A dog.']);
    expect(v.words['chien']!.contexts).toHaveLength(MAX_CONTEXTS);
  });

  it('makes a word known after listening to it, and only the reader undoes it', () => {
    const v = newVocab();
    seen(v, 1);
    listen(v, PROMOTION.listens - 1);
    applyEvent(v, { kind: 'set', info: info(), status: 'saved' }, '2026-11-08');
    expect(v.words['chien']!.status).toBe('saved');
    // Saving keeps the listens so far.
    listen(v, 1);
    expect(v.words['chien']).toMatchObject({ status: 'known', knownBy: 'listening' });
    applyEvent(v, { kind: 'peek', key: 'chien' }, '2026-11-08');
    applyEvent(v, { kind: 'answer', key: 'chien', right: false }, '2026-11-08');
    expect(v.words['chien']).toMatchObject({ status: 'known', peeks: 1, wrong: 1 });
    // Unmarked: counted afresh, so the next listen doesn't make it known again.
    applyEvent(v, { kind: 'set', info: info(), status: 'saved' }, '2026-11-08');
    listen(v, 1);
    expect(v.words['chien']).toMatchObject({ status: 'saved', listens: PROMOTION.listens + 1 });
  });

  it('counts a listen to a word it doesn’t have only with its info', () => {
    const v = newVocab();
    applyEvent(v, { kind: 'listen', key: 'chat' }, '2026-11-08');
    expect(v.words).toEqual({});
    applyEvent(v, { kind: 'listen', key: 'chat', info: info('chat', 'cat') }, '2026-11-08');
    expect(v.words['chat']).toMatchObject({ listens: 1, pages: 0 });
  });

  it('makes a word known when practice has it right', () => {
    const v = newVocab();
    const answer = (right: boolean, day: string) =>
      applyEvent(v, { kind: 'answer', key: 'le chien', right, info: { key: 'le chien', word: 'le chien', gloss: 'dog', english: '' } }, day);
    seen(v, 1);
    answer(false, '2026-11-01');
    expect(v.words['chien']!.status).toBe('seen');
    answer(true, '2026-11-02');
    expect(v.words['chien']).toMatchObject({ status: 'known', knownBy: 'practice', right: 1, wrong: 1 });
    // Found by its citation form: no second entry for "le chien".
    expect(Object.keys(v.words)).toEqual(['chien']);
  });

  it('adds a word first met in practice, with the kit’s gloss', () => {
    const v = newVocab();
    applyEvent(v, { kind: 'answer', key: 'la maison', right: true, info: { key: 'la maison', word: 'la maison', gloss: 'house', english: '' } }, '2026-11-08');
    expect(v.words['la maison']).toMatchObject({ word: 'la maison', gloss: 'house', pages: 0, right: 1, status: 'known', knownBy: 'practice' });
  });

  it('leaves a word the reader marked known, peeked or not', () => {
    const v = newVocab();
    applyEvent(v, { kind: 'set', info: info(), status: 'known' }, '2026-11-08');
    applyEvent(v, { kind: 'peek', key: 'chien' }, '2026-11-08');
    expect(v.words['chien']).toMatchObject({ status: 'known', knownBy: 'reader' });
  });

  it('ignores a peek at a word it has never seen', () => {
    const v = newVocab();
    applyEvent(v, { kind: 'peek', key: 'chat' }, '2026-11-08');
    expect(v.words).toEqual({});
  });
});

describe('wordLists', () => {
  it('lists a word met only by listening once it’s been heard enough', () => {
    const v = newVocab();
    const hear = () => applyEvent(v, { kind: 'listen', key: 'chat', info: info('chat', 'cat') }, '2026-11-08');
    for (let i = 1; i < LISTED_LISTENS; i++) hear();
    expect(wordLists(v).seen).toHaveLength(0);
    hear();
    expect(wordLists(v).seen.map((w) => w.key)).toEqual(['chat']);
  });

  it('splits by status, finds by word, gloss or English, latest first', () => {
    const v = newVocab();
    applyEvent(v, { kind: 'seen', info: info('chien') }, '2026-11-01');
    seen(v, 3, 'chat');
    seen(v, 5, 'oiseau');
    applyEvent(v, { kind: 'set', info: info('maison', 'house'), status: 'saved' }, '2026-11-08');
    const lists = wordLists(v);
    expect(lists.seen.map((w) => w.key)).toEqual(['oiseau', 'chat', 'chien']);
    expect(lists.saved.map((w) => w.key)).toEqual(['maison']);
    expect(wordLists(v, 'HOUSE').saved).toHaveLength(1);
    expect(wordLists(v, 'house').seen).toHaveLength(0);
  });

  it('lists woven or practised words before those only listened to', () => {
    const v = newVocab();
    applyEvent(v, { kind: 'seen', info: info('chien') }, '2026-11-01');
    applyEvent(v, { kind: 'answer', key: 'chat', right: true, info: info('chat', 'cat') }, '2026-11-02');
    for (let i = 0; i < LISTED_LISTENS; i++) applyEvent(v, { kind: 'listen', key: 'oiseau', info: info('oiseau', 'bird') }, '2026-11-08');
    applyEvent(v, { kind: 'set', info: info('chat', 'cat'), status: 'seen' }, '2026-11-08');
    expect(wordLists(v).seen.map((w) => w.key)).toEqual(['chat', 'chien', 'oiseau']);
  });

  it('keeps a word in the list it was shown in', () => {
    const v = newVocab();
    applyEvent(v, { kind: 'seen', info: info('chien') }, '2026-11-01');
    applyEvent(v, { kind: 'set', info: info('chien'), status: 'known' }, '2026-11-08');
    const lists = wordLists(v, '', new Map([['chien', 'seen']]));
    expect(lists.seen.map((w) => [w.key, w.status])).toEqual([['chien', 'known']]);
    expect(lists.known).toHaveLength(0);
  });
});

describe('ankiCsv', () => {
  it('writes saved words with the gloss and sentence, quoted and escaped', () => {
    const v = newVocab();
    applyEvent(v, { kind: 'set', info: { ...info(), gloss: 'a "dog"' }, status: 'saved', context: context('The <b> chien.') }, '2026-11-08');
    seen(v, 1, 'chat');
    expect(ankiCsv(v)).toBe('"le chien","a ""dog""<br><i>The &lt;b&gt; chien.</i>"');
  });
});
