import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fr } from '../../src/languages/fr';
import { basics } from '../../src/lessons/basics';
import { themed } from '../../src/lessons/themed';
import { startReading, type ReadingDeps } from '../../src/reading/controller';
import { collectSegments, contentRoot } from '../../src/weave/segment';
import { NOTES_ATTR } from '../../src/notes';
import { WIDGET_ATTR } from '../../src/widget';

const body = () => document.querySelector(`[${WIDGET_ATTR}]`)!.shadowRoot!.querySelector('.body')!.textContent;
const select = () => document.querySelector(`[${WIDGET_ATTR}]`)!.shadowRoot!.querySelector<HTMLSelectElement>('select')!;
const flush = () => new Promise((r) => setTimeout(r, 0));

function deps(over: Partial<ReadingDeps> = {}): ReadingDeps {
  return {
    doc: document,
    root: contentRoot(document),
    segments: collectSegments(contentRoot(document)),
    lesson: basics,
    lang: fr,
    pageWords: () => undefined,
    vocab: () => ({ items: [{ french: 'deux', category: 'numbers', count: 2 }], categories: basics.categories }),
    request: vi.fn(async () => ({ ok: true as const, value: { lines: [{ fr: 'Bonjour !', en: 'Hello!' }], usd: 0.001 } })),
    estimate: () => ({ input: 100, output: 50 }),
    saveFormat: vi.fn(),
    onSpend: vi.fn(),
    ...over,
  };
}

beforeEach(() => {
  document.documentElement.querySelectorAll(`[${WIDGET_ATTR}], [${NOTES_ATTR}]`).forEach((e) => e.remove());
  document.body.innerHTML = `<main><h2>Diet</h2><p>The snow leopard eats blue sheep and other animals in the mountains.</p>
    <figure><img alt="A snow leopard" width="300"><figcaption>In the Himalayas</figcaption></figure></main>`;
});

describe('startReading', () => {
  it('asks for the chosen format and shows the lines, once per format', async () => {
    const d = deps();
    const r = startReading(d, 'text');
    r.ready();
    await flush();
    expect(d.request).toHaveBeenCalledTimes(1);
    expect(vi.mocked(d.request).mock.calls[0]![0]).toBe('text');
    expect(body()).toContain('Bonjour');
    expect(d.onSpend).toHaveBeenCalledWith(0.001);

    select().value = 'facts';
    select().dispatchEvent(new Event('change'));
    select().value = 'text';
    select().dispatchEvent(new Event('change'));
    await flush();
    expect(d.request).toHaveBeenCalledTimes(2); // the short text came from the cache
    expect(d.saveFormat).toHaveBeenLastCalledWith('text');
    r.stop();
  });

  it('waits for the page words before asking', async () => {
    const d = deps({ lesson: themed });
    const r = startReading(d, 'facts');
    expect(body()).toContain('Picking words');
    expect(d.request).not.toHaveBeenCalled();
    r.ready();
    await flush();
    expect(d.request).toHaveBeenCalledTimes(1);
    r.stop();
  });

  it('writes "What you met" in code, without a request', () => {
    const d = deps();
    const r = startReading(d, 'recap');
    expect(body()).toContain('deux');
    expect(d.request).not.toHaveBeenCalled();
    r.stop();
  });

  it('asks for "Why it\'s said this way" only once woven words are on screen', () => {
    const d = deps();
    const r = startReading(d, 'why');
    r.ready();
    expect(body()).toContain('No woven words on screen yet');
    expect(d.request).not.toHaveBeenCalled();
    r.stop();
    expect(document.querySelector(`[${WIDGET_ATTR}]`)).toBeNull();
  });

  it('offers to summarise a highlighted passage, and asks only when the button is clicked', async () => {
    document.body.innerHTML = `<main><p id="p">Today, Islay has over 3,000 inhabitants, and the main commercial activities are agriculture, malt whisky distillation and tourism.</p></main>`;
    const d = deps();
    const r = startReading(d, 'recap');
    const notes = () => document.querySelector(`[${NOTES_ATTR}]`)!.shadowRoot!;
    const chip = () => notes().querySelector<HTMLButtonElement>('.chip')!;
    const range = document.createRange();
    range.selectNodeContents(document.getElementById('p')!);
    document.getSelection()!.addRange(range);
    document.dispatchEvent(new MouseEvent('mouseup'));
    await flush();
    expect(chip().hidden).toBe(false);
    expect(d.request).not.toHaveBeenCalled();

    chip().click();
    await flush();
    expect(chip().hidden).toBe(true);
    expect(d.request).toHaveBeenCalledTimes(1);
    const [formatId, input] = vi.mocked(d.request).mock.calls[0]!;
    expect(formatId).toBe('summary');
    expect(input.highlighted).toContain('over 3,000 inhabitants');
    expect(notes().querySelector('.card')!.textContent).toContain('Bonjour');
    expect(body()).toContain('deux'); // the format's lines stay in the widget

    document.dispatchEvent(new MouseEvent('mouseup')); // same highlight, e.g. a click on the note
    await flush();
    expect(chip().hidden).toBe(true);

    // Closed, then asked for again: from the cache.
    notes().querySelector<HTMLButtonElement>('.dismiss')!.click();
    document.getSelection()!.removeAllRanges();
    document.dispatchEvent(new MouseEvent('mouseup'));
    await flush();
    document.getSelection()!.addRange(range);
    document.dispatchEvent(new MouseEvent('mouseup'));
    await flush();
    chip().click();
    await flush();
    expect(d.request).toHaveBeenCalledTimes(1);
    expect(notes().querySelectorAll('.card')).toHaveLength(1);
    document.getSelection()!.removeAllRanges();
    r.stop();
    expect(document.querySelector(`[${NOTES_ATTR}]`)).toBeNull();
  });

  it('shows the summary line by line as it streams', async () => {
    document.body.innerHTML = `<main><p id="p">Today, Islay has over 3,000 inhabitants, and the main commercial activities are agriculture, malt whisky distillation and tourism.</p></main>`;
    let finish!: () => void;
    const request: ReadingDeps['request'] = (_id, _input, _estimate, onLines) =>
      new Promise((resolve) => {
        onLines?.([{ fr: 'Islay est une île.', en: 'Islay is an island.' }]);
        const lines = [
          { fr: 'Islay est une île.', en: 'Islay is an island.' },
          { fr: 'On fait du whisky.', en: 'People make whisky.' },
        ];
        finish = () => resolve({ ok: true, value: { lines, usd: 0.001 } });
      });
    const r = startReading(deps({ request }), 'recap');
    const notes = document.querySelector(`[${NOTES_ATTR}]`)!.shadowRoot!;
    const range = document.createRange();
    range.selectNodeContents(document.getElementById('p')!);
    document.getSelection()!.addRange(range);
    document.dispatchEvent(new MouseEvent('mouseup'));
    await flush();
    notes.querySelector<HTMLButtonElement>('.chip')!.click();
    const card = notes.querySelector('.card')!;
    expect([...card.querySelectorAll('.fr')].map((e) => e.textContent)).toEqual(['Islay est une île.']);
    expect(card.querySelector('.note')!.textContent).toBe('…');
    finish();
    await flush();
    expect(card.querySelectorAll('.fr')).toHaveLength(2);
    expect(card.querySelector('.note')).toBeNull();
    document.getSelection()!.removeAllRanges();
    r.stop();
  });

  it("doesn't offer a summary for a word or a phrase", async () => {
    document.body.innerHTML = `<main><p id="p">Malt whisky distillation</p></main>`;
    const r = startReading(deps(), 'recap');
    const range = document.createRange();
    range.selectNodeContents(document.getElementById('p')!);
    document.getSelection()!.addRange(range);
    document.dispatchEvent(new MouseEvent('mouseup'));
    await flush();
    expect(document.querySelector(`[${NOTES_ATTR}]`)!.shadowRoot!.querySelector<HTMLElement>('.chip')!.hidden).toBe(true);
    document.getSelection()!.removeAllRanges();
    r.stop();
  });

  it('shows the error when a request fails', async () => {
    const d = deps({ request: vi.fn(async () => ({ ok: false as const, error: 'No API key.' })) });
    const r = startReading(d, 'facts');
    r.ready();
    await flush();
    expect(body()).toContain("Couldn't write this: No API key.");
    r.stop();
  });
});
