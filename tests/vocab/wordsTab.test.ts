import { describe, expect, it } from 'vitest';
import { applyEvent, newVocab, type VocabEvent } from '../../src/vocab/store';
import { wordsTab } from '../../src/vocab/wordsTab';

const info = (key: string, gloss: string) => ({ key, word: `das ${key}`, gloss, english: gloss });

describe('wordsTab', () => {
  it('lists the latest words first, then shows their definitions and examples', async () => {
    const vocab = newVocab();
    applyEvent(vocab, { kind: 'seen', info: info('Haus', 'house') }, '2026-11-01');
    applyEvent(vocab, { kind: 'seen', info: info('Wort', 'word') }, '2026-11-09');
    const pane = document.createElement('div');
    const recorded: VocabEvent[] = [];
    const tab = wordsTab(pane, {
      lang: 'de',
      load: () => vocab,
      record: (events) => {
        recorded.push(...events);
        for (const e of events) applyEvent(vocab, e, '2026-11-09');
      },
      define: async (words) => ({
        ok: true,
        value: { usd: 0, definitions: Object.fromEntries(words.map((w) => [w.word, { definition: `a ${w.gloss}`, example: `Ein ${w.word}.`, english: `A ${w.gloss}.` }])) },
      }),
      onSpend: () => {},
    });
    tab.open();
    expect([...pane.querySelectorAll('.word')].map((w) => w.textContent)).toEqual(['das Wort', 'das Haus']);
    expect(pane.querySelector('.definition')?.textContent).toBe('word');
    await new Promise((r) => setTimeout(r));
    expect(pane.querySelector('.definition')?.textContent).toBe('a word');
    expect(pane.querySelector('.english')?.textContent).toBe('A word.');

    pane.querySelector<HTMLButtonElement>('.toggle')!.click();
    expect(recorded).toMatchObject([{ kind: 'set', status: 'saved' }]);
    expect(pane.querySelector('.toggle')?.getAttribute('aria-pressed')).toBe('true');
  });
});
