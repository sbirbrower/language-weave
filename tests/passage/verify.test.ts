import { describe, expect, it } from 'vitest';
import type { JevResult } from '../../src/marks/jev';
import type { Piece, PieceLine } from '../../src/passage/piece';
import { checkItemFor, createVerifier, filled, jevAsk, keeps, type AskJev } from '../../src/passage/verify';

const SECTION = 'The snow leopard rests near cliffs and ridges. It is mostly active at dawn.';
const tf = (en: string, answer: boolean): PieceLine => ({ kind: 'tf', fr: en, en, answer });
const piece = (formatId: string, lines: PieceLine[]): Piece => ({ formatId, title: { fr: 'T', en: 'T' }, lines });
const answer = (p: number): JevResult => ({ answers: { a: { type: 'noul', noul: p } }, model: 'jev-1.14.0', inputTokens: 100, usd: 0.000004, secs: 0.1 });

describe('what Jev checks', () => {
  it('checks statements, gaps and the lines of a fact format, nothing else', () => {
    expect(checkItemFor(tf('It hunts on cliffs.', true), 'true_false', 'French', SECTION)?.kind).toBe('statement');
    expect(checkItemFor({ kind: 'gap', fr: 'Il ____ (vivre) seul.', en: 'It lives alone.', answer: 'vit' }, 'gap_fill', 'French', SECTION)?.kind).toBe('gap');
    expect(checkItemFor({ kind: 'line', fr: 'x', en: 'x' }, 'key_facts', 'French', SECTION)?.kind).toBe('fact');
    expect(checkItemFor({ kind: 'line', fr: 'x', en: 'x' }, 'dialogue', 'French', SECTION)).toBeNull();
    expect(checkItemFor({ kind: 'pair', fr: 'x', en: 'x' }, 'match_up', 'French', SECTION)).toBeNull();
  });

  it('fills the gap for the question, and keeps by kind', () => {
    expect(filled({ fr: 'Il ____ (vivre) seul.', answer: 'vit' })).toBe('Il vit seul.');
    expect(jevAsk({ kind: 'gap', language: 'French', section: SECTION, fr: 'Il ____ (vivre) seul.', en: 'It lives alone.', answer: 'vit' }).state).toMatchObject({ sentence: 'Il vit seul.', sentence_language: 'French' });
    const statement = { kind: 'statement' as const, language: 'French', section: SECTION, fr: '', en: '' };
    expect([keeps({ ...statement, key: true }, 0.8), keeps({ ...statement, key: true }, 0.2), keeps({ ...statement, key: false }, 0.2)]).toEqual([true, false, true]);
    expect([keeps({ ...statement, kind: 'fact' }, 0.35), keeps({ ...statement, kind: 'gap' }, 0.35)]).toEqual([false, true]);
  });
});

describe('createVerifier', () => {
  /** Jev answers by the statement's English; `release` lets a test decide when. */
  function fakeJev(ps: Record<string, number>, fail?: string) {
    const waiting: Array<() => void> = [];
    const jev: AskJev = (state) =>
      new Promise((resolve, reject) => {
        const s = (state as { statement: string }).statement;
        waiting.push(() => (s === fail ? reject(new Error('Jev 500')) : resolve(answer(ps[s] ?? 0.9))));
      });
    return { jev, release: () => waiting.splice(0).forEach((go) => go()) };
  }

  it('shows lines only once checked, in order, and never the ones Jev drops', async () => {
    const { jev, release } = fakeJev({ 'It hunts on cliffs.': 0.13 });
    let changes = 0;
    const v = createVerifier({ formatId: 'true_false', language: 'French', section: SECTION, jev, onChange: () => changes++ });
    const p = piece('true_false', [tf('It rests near cliffs.', true), tf('It hunts on cliffs.', true), tf('It is active at noon.', false)]);
    expect(v.see(p).lines).toEqual([]);
    release();
    const done = await v.settle(p);
    expect(v.see(p).lines.map((l) => l.en)).toEqual(['It rests near cliffs.']);
    expect(done.lines.map((l) => l.en)).toEqual(['It rests near cliffs.']);
    expect(changes).toBe(3);
    expect(v.usd()).toBeCloseTo(0.000012);
  });

  it('keeps a line Jev failed on, and lines it doesn’t check', async () => {
    const { jev, release } = fakeJev({}, 'It rests near cliffs.');
    const v = createVerifier({ formatId: 'true_false', language: 'French', section: SECTION, jev });
    const p = piece('true_false', [{ kind: 'line', fr: 'Vrai ou faux', en: 'True or false' }, tf('It rests near cliffs.', true)]);
    const settled = v.settle(p);
    release();
    expect((await settled).lines).toHaveLength(2);
  });
});
