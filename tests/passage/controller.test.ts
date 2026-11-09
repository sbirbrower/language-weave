import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SCROLL_SETTLE_MS, SELECTION_SETTLE_MS, startPassage, type PassageDeps } from '../../src/passage/controller';
import type { Piece, PieceLine } from '../../src/passage/piece';
import type { Textbook } from '../../src/passage/textbook';
import { WIDGET_ATTR } from '../../src/widget';

const shadow = () => document.querySelector(`[${WIDGET_ATTR}]`)?.shadowRoot;
/** The passage pane: the only one in page mode, the second in lesson mode. */
const pane = () => [...shadow()!.querySelectorAll<HTMLElement>('.body')].at(-1)!;
const lines = () => [...pane().querySelectorAll('.line .fr, .quiz > .fr')].map((e) => e.textContent);
const title = () => shadow()!.querySelector('.title')!.textContent;
const chip = () => {
  const c = pane().querySelector<HTMLElement>('.chip');
  return c instanceof HTMLSelectElement ? c.selectedOptions[0]?.textContent : c?.textContent;
};
const button = (text: string) => [...pane().querySelectorAll<HTMLElement>('button')].find((b) => b.textContent === text);

const lessonPane = () => shadow()!.querySelector('.body')!.textContent;
const tab = (label: string) => [...shadow()!.querySelectorAll<HTMLElement>('.tab')].find((t) => t.textContent === label)!;
const TEXTBOOK: Textbook = {
  intro: 'Say *bonjour*.',
  sections: [
    { kind: 'phrases', heading: 'Greetings', explanation: [], table: { columns: [], rows: [] }, words: [{ word: 'bonjour', english: 'hello' }], examples: [], watchOut: [] },
  ],
};

const piece = (formatId: string, ls: PieceLine[], extra: Partial<Piece> = {}): Piece => ({ formatId, title: { fr: 'Titre', en: 'Title' }, lines: ls, ...extra });
const plain = (fr: string, en = ''): PieceLine => ({ kind: 'line', fr, en });

const HEADINGS = ['', 'Diet', 'Range'];
let focus = 0;

function deps(over: Partial<PassageDeps> = {}): PassageDeps {
  return {
    doc: document,
    mode: 'page',
    title: 'Snow leopard',
    focus: () => ({ index: focus, heading: HEADINGS[focus]! }),
    request: vi.fn(async ({ focus: f, formatId }, _onNote, onPiece) => {
      onPiece(piece(formatId, [plain(`Section ${f}.`)]));
      return { ok: true as const, value: { piece: piece(formatId, [plain(`Section ${f}.`, `Part ${f}.`)]), usd: 0.001 } };
    }),
    onSpend: vi.fn(),
    random: () => 0,
    ...over,
  };
}

const scrollTo = async (index: number) => {
  focus = index;
  window.dispatchEvent(new Event('scroll'));
  await vi.advanceTimersByTimeAsync(SCROLL_SETTLE_MS);
};

beforeEach(() => {
  vi.useFakeTimers();
  focus = 0;
  document.documentElement.querySelectorAll(`[${WIDGET_ATTR}]`).forEach((e) => e.remove());
});
afterEach(() => vi.useRealTimers());

describe('startPassage, page mode', () => {
  it('waits for the page, then writes about the section on screen in a format, with no tabs', async () => {
    const d = deps();
    const p = startPassage(d);
    expect(shadow()!.querySelector('.tab')).toBeNull();
    expect(pane().textContent).toContain('Waiting');
    expect(d.request).not.toHaveBeenCalled();

    p.ready();
    await vi.advanceTimersByTimeAsync(0);
    expect(d.request).toHaveBeenCalledTimes(1);
    expect(lines()).toEqual(['Section 0.']);
    expect(chip()).toBe('Simple summary');
    expect(title()).toBe('Snow leopard');
    expect(d.onSpend).toHaveBeenCalledWith(0.001);
  });

  it('writes again when scrolling settles on another section, as a summary, and keeps what it wrote', async () => {
    const d = deps();
    startPassage(d).ready();
    await vi.advanceTimersByTimeAsync(0);

    await scrollTo(1);
    expect(lines()).toEqual(['Section 1.']);
    expect(title()).toBe('Snow leopard · Diet');
    expect(vi.mocked(d.request).mock.calls.map((c) => c[0].formatId)).toEqual(['summary', 'summary']);

    await scrollTo(0);
    expect(lines()).toEqual(['Section 0.']);
    expect(d.request).toHaveBeenCalledTimes(2);
  });

  it('writes about highlighted text, keeps it after the highlight goes, and follows the scroll again', async () => {
    let sel: { text: string; index: number } | undefined;
    const d = deps({ selection: () => sel });
    startPassage(d).ready();
    await vi.advanceTimersByTimeAsync(0);

    sel = { text: 'Snow leopards eat wild sheep and goats.', index: 1 };
    document.dispatchEvent(new Event('selectionchange'));
    await vi.advanceTimersByTimeAsync(SELECTION_SETTLE_MS);
    expect(vi.mocked(d.request).mock.calls.at(-1)![0]).toMatchObject({ focus: 1, selection: sel.text, formatId: 'summary' });
    expect(title()).toBe('Snow leopard · Highlighted');

    sel = undefined;
    document.dispatchEvent(new Event('selectionchange'));
    await vi.advanceTimersByTimeAsync(SELECTION_SETTLE_MS);
    expect(title()).toBe('Snow leopard · Highlighted');

    await scrollTo(0);
    expect(title()).toBe('Snow leopard');
    expect(d.request).toHaveBeenCalledTimes(2);
  });

  it('writes the same section again in the same format on "New passage"', async () => {
    const d = deps();
    startPassage(d).ready();
    await vi.advanceTimersByTimeAsync(0);
    button('↻ New passage')!.click();
    await vi.advanceTimersByTimeAsync(0);
    const calls = vi.mocked(d.request).mock.calls.map((c) => c[0]);
    expect(calls.map((c) => c.focus)).toEqual([0, 0]);
    expect(calls[1]!.formatId).toBe(calls[0]!.formatId);
  });

  it('writes the section in the format picked from the chip', async () => {
    const d = deps();
    startPassage(d).ready();
    await vi.advanceTimersByTimeAsync(0);
    const menu = pane().querySelector<HTMLSelectElement>('select.chip')!;
    expect([...menu.options].map((o) => o.textContent)).toContain('Mini timeline');
    menu.value = 'timeline';
    menu.dispatchEvent(new Event('change'));
    await vi.advanceTimersByTimeAsync(0);
    expect(vi.mocked(d.request).mock.calls.map((c) => c[0])).toEqual([{ focus: 0, formatId: 'summary' }, { focus: 0, formatId: 'timeline' }]);
    expect(chip()).toBe('Mini timeline');
  });

  it('asks for one section at a time, then the one on screen', async () => {
    let finish!: () => void;
    const request = vi.fn(async ({ focus: f, formatId }: { focus: number; formatId: string }) => {
      if (f === 0) await new Promise<void>((r) => (finish = r));
      return { ok: true as const, value: { piece: piece(formatId, [plain(`S${f}`)]), usd: 0 } };
    });
    startPassage(deps({ request })).ready();
    await scrollTo(1);
    await scrollTo(2);
    expect(request).toHaveBeenCalledTimes(1);
    expect(button('↻ New passage')).toBeUndefined();
    finish();
    await vi.advanceTimersByTimeAsync(0);
    expect(request.mock.calls.map((c) => c[0].focus)).toEqual([0, 2]);
    expect(lines()).toEqual(['S2']);
  });

  it('shows the error with a way to try again, and stops listening when closed', async () => {
    const request = vi.fn(async () => ({ ok: false as const, error: 'No key' }));
    const p = startPassage(deps({ request }));
    p.ready();
    await vi.advanceTimersByTimeAsync(0);
    expect(pane().textContent).toContain('No key');
    expect(button('↻ New passage')).toBeDefined();
    p.stop();
    expect(shadow()).toBeUndefined();
    await scrollTo(1);
    expect(request).toHaveBeenCalledTimes(1);
  });
});

describe('startPassage, lesson mode', () => {
  const lessonDeps = (over: Partial<PassageDeps> = {}) =>
    deps({ mode: 'lesson', title: 'Les vêtements', focus: undefined, textbook: vi.fn(async () => ({ ok: true as const, value: { textbook: TEXTBOOK, usd: 0.05 } })), ...over });

  it('opens on the Lesson tab and writes a scene without following the page', async () => {
    const d = lessonDeps();
    startPassage(d).ready();
    expect(tab('Lesson').getAttribute('aria-selected')).toBe('true');
    await vi.advanceTimersByTimeAsync(0);
    expect(d.textbook).toHaveBeenCalledTimes(1);
    expect(lessonPane()).toBe('Say bonjour.1GreetingsPhrasesbonjourhello');
    expect(d.onSpend).toHaveBeenCalledWith(0.05);
    expect(d.request).toHaveBeenCalledTimes(1);
    await scrollTo(1);
    expect(d.request).toHaveBeenCalledTimes(1);
    expect(title()).toBe('Les vêtements');
  });

  it('shows a piece and its answers from another tab without writing again, and says when it’s closed', async () => {
    const onChange = vi.fn();
    const first = startPassage(lessonDeps({ onChange }));
    first.ready();
    await vi.advanceTimersByTimeAsync(0);
    tab('Passage').click();
    expect(onChange).toHaveBeenCalled();
    shadow()!.querySelector<HTMLElement>('.collapse')!.click();
    const saved = first.state();
    expect(saved.tab).toBe('passage');
    expect(saved.collapsed).toBe(true);
    first.stop();

    const onClose = vi.fn();
    const d = lessonDeps({ saved, onClose });
    startPassage(d).ready();
    await vi.advanceTimersByTimeAsync(0);
    expect(tab('Passage').getAttribute('aria-selected')).toBe('true');
    expect(shadow()!.querySelector('.panel')!.classList.contains('collapsed')).toBe(true);
    expect(shadow()!.querySelector('.collapse')!.getAttribute('aria-label')).toBe('Expand');
    expect(lines()).toEqual(saved.piece!.piece.lines.map((l) => ('fr' in l ? l.fr : '')));
    expect(d.request).not.toHaveBeenCalled();
    shadow()!.querySelector<HTMLElement>('.close')!.click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('asks for the Lesson tab again when it failed and the tab is opened', async () => {
    const textbook = vi.fn(async () => ({ ok: false as const, error: 'Overloaded' }));
    startPassage(lessonDeps({ textbook }));
    await vi.advanceTimersByTimeAsync(0);
    expect(lessonPane()).toBe('Overloaded');
    tab('Lesson').click();
    expect(textbook).toHaveBeenCalledTimes(2);
  });
});

describe('quizzes', () => {
  const show = async (p: Piece) => {
    startPassage(deps({ request: vi.fn(async () => ({ ok: true as const, value: { piece: p, usd: 0 } })) })).ready();
    await vi.advanceTimersByTimeAsync(0);
  };

  it('true or false: answers, then shows the correction', async () => {
    await show(piece('true_false', [{ kind: 'tf', fr: 'Il neige.', en: 'It snows.', answer: false, fix: { fr: 'Il pleut.', en: 'It rains.' } }]));
    button('True')!.click();
    expect(pane().querySelector('.verdict')!.textContent).toBe("✗ It's false");
    expect(lines()).toContain('Il pleut.');
    expect(button('False')).toBeUndefined();
  });

  it('gap fill: checks typed answers leniently, and can show the answer', async () => {
    await show(
      piece('gap_fill', [
        { kind: 'gap', fr: 'Il ____ (être) né.', en: 'He was born.', answer: 'est' },
        { kind: 'gap', fr: 'Elle ____ (aller).', en: 'She went.', answer: 'est allée' },
      ]),
    );
    const inputs = () => [...pane().querySelectorAll<HTMLInputElement>('input')];
    inputs()[0]!.value = 'EST';
    inputs()[0]!.dispatchEvent(new Event('input'));
    inputs()[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(pane().querySelector('.filled.right')!.textContent).toBe('est');

    inputs()[0]!.value = 'va';
    inputs()[0]!.dispatchEvent(new Event('input'));
    button('Check')!.click();
    expect(pane().textContent).toContain('Not quite');
    button('Show answer')!.click();
    expect(pane().querySelector('.filled.shown')!.textContent).toBe('est allée');
  });

  it('match the words: a wrong meaning is marked, a right one is done', async () => {
    await show(
      piece('match_up', [{ kind: 'pair', fr: 'la robe', en: 'dress' }, { kind: 'pair', fr: 'le pull', en: 'jumper' }, plain('Une phrase.')], { shuffle: [1, 0] }),
    );
    button('la robe')!.click();
    button('jumper')!.click();
    expect(button('jumper')!.className).toContain('wrong');
    button('dress')!.click();
    expect(button('dress')!.className).toContain('done');
    button('le pull')!.click();
    button('jumper')!.click();
    expect(pane().textContent).toContain('All matched');
  });

  it('guess what: marks the pick and the right answer', async () => {
    await show(piece('riddle', [plain('Je suis blanc.'), { kind: 'choice', fr: 'Qui suis-je ?', en: 'What am I?', options: ['la pluie', 'la neige'], answer: 'la neige' }]));
    button('la pluie')!.click();
    expect(button('la pluie')!.className).toContain('wrong');
    expect(button('la neige')!.className).toContain('right');
  });
});

describe('speech', () => {
  const buttons = (sel: string) => [...pane().querySelectorAll<HTMLElement>(sel)];
  function fakeSpeech() {
    let onLine: ((i: number) => void) | undefined;
    let onError: ((e: string) => void) | undefined;
    const speech = {
      play: vi.fn((_texts: string[], line: (i: number) => void, error: (e: string) => void) => {
        onLine = line;
        onError = error;
      }),
      stop: vi.fn(() => onLine?.(-1)),
    };
    return { speech, line: (i: number) => onLine!(i), fail: (e: string) => onError!(e) };
  }

  it('offers speech for plain lines once the piece is finished, a line or all of them', async () => {
    const f = fakeSpeech();
    let finish!: () => void;
    const request = vi.fn(async ({ formatId }: { formatId: string }, _n: unknown, onPiece: (p: Piece) => void) => {
      onPiece(piece(formatId, [plain('Un.')]));
      await new Promise<void>((r) => (finish = r));
      return {
        ok: true as const,
        value: { piece: piece(formatId, [plain('Un.', 'One.'), { kind: 'tf', fr: 'Faux.', en: '', answer: true }, plain('*Deux*.', 'Two.')]), usd: 0 },
      };
    });
    startPassage(deps({ request, speech: f.speech })).ready();
    await vi.advanceTimersByTimeAsync(0);
    expect(buttons('.say')).toHaveLength(0);
    finish();
    await vi.advanceTimersByTimeAsync(0);
    expect(buttons('.say')).toHaveLength(2);

    buttons('.say')[1]!.click();
    expect(f.speech.play).toHaveBeenLastCalledWith(['Deux.'], expect.any(Function), expect.any(Function));
    f.line(0);
    expect(buttons('.line.playing .fr').map((e) => e.textContent)).toEqual(['Deux.']);

    buttons('.listen')[0]!.click();
    expect(f.speech.play).toHaveBeenLastCalledWith(['Un.', 'Deux.'], expect.any(Function), expect.any(Function));
    f.line(0);
    expect(buttons('.listen')[0]!.textContent).toBe('■ Stop');
    buttons('.listen')[0]!.click();
    expect(f.speech.stop).toHaveBeenCalled();
    expect(buttons('.listen')[0]!.textContent).toBe('▶ Listen');
  });

  it('shows a speech error under the piece, and stops reading on another section', async () => {
    const f = fakeSpeech();
    startPassage(deps({ speech: f.speech })).ready();
    await vi.advanceTimersByTimeAsync(0);
    buttons('.say')[0]!.click();
    f.fail('Speech failed: API key not valid.');
    expect(pane().textContent).toContain('API key not valid.');
    f.speech.stop.mockClear();
    await scrollTo(1);
    expect(f.speech.stop).toHaveBeenCalled();
  });

  it('with a speaker that reads only what is recorded, only those words and lines get a button, and there is no Listen', async () => {
    const f = fakeSpeech();
    const speech = { ...f.speech, can: (text: string) => text === 'la robe' || text === 'Une phrase.' };
    const pairs = piece('match_up', [{ kind: 'pair', fr: 'la robe', en: 'dress' }, { kind: 'pair', fr: 'le pull', en: 'jumper' }, plain('Une phrase.'), plain('Une autre.')]);
    startPassage(deps({ request: async () => ({ ok: true as const, value: { piece: pairs, usd: 0 } }), speech })).ready();
    await vi.advanceTimersByTimeAsync(0);
    expect(buttons('.listen')).toHaveLength(0);
    expect(buttons('.line.speakable .fr').map((e) => e.textContent)).toEqual(['Une phrase.']);
    expect(buttons('.say-word')).toHaveLength(1);
    buttons('.say-word')[0]!.click();
    expect(f.speech.play).toHaveBeenLastCalledWith(['la robe'], expect.any(Function), expect.any(Function), true);
  });

  it('has no speaker buttons without speech', async () => {
    startPassage(deps()).ready();
    await vi.advanceTimersByTimeAsync(0);
    expect(buttons('.say, .listen')).toHaveLength(0);
  });
});
