import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buttonSpot, HIDE_DELAY_MS, removeWordButton, showWordButton, WORD_BUTTON_ATTR } from '../src/wordButton';
import { WOVEN_CLASS } from '../src/weave/segment';
import { FR_CLASS, toggleSource } from '../src/weave/write';

const shadow = () => document.querySelector(`[${WORD_BUTTON_ATTR}]`)!.shadowRoot!;
const bar = () => shadow().querySelector<HTMLElement>('.bar')!;
const button = (action: string) => shadow().querySelector<HTMLButtonElement>(`button[data-action="${action}"]`)!;
const word = () => document.querySelector<HTMLElement>(`.${WOVEN_CLASS}`)!;
const hover = (el: Element) => el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
const leave = (el: Element) => el.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
const rect = { left: 100, top: 40, right: 160, bottom: 60, width: 60, height: 20, x: 100, y: 40, toJSON() {} } as DOMRect;

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML =
    `<p>The <span class="${WOVEN_CLASS}"><span class="${FR_CLASS}">der Hund</span><span class="${WOVEN_CLASS}-source" hidden>dog</span></span> runs.</p>`;
  vi.spyOn(word(), 'getClientRects').mockReturnValue([rect] as unknown as DOMRectList);
});

afterEach(() => {
  removeWordButton(document);
  vi.useRealTimers();
});

describe('buttonSpot', () => {
  const view = { width: 1000, height: 800 };
  it('sits just after the word, centred on its line', () => {
    expect(buttonSpot({ right: 160, top: 40, height: 20 }, view)).toEqual({ left: 162, top: 34 });
  });
  it('stays inside the window, however many buttons', () => {
    expect(buttonSpot({ right: 995, top: 795, height: 20 }, view)).toEqual({ left: 968, top: 768 });
    expect(buttonSpot({ right: 995, top: 795, height: 20 }, view, 70)).toEqual({ left: 930, top: 768 });
  });
});

describe('showWordButton', () => {
  it('shows beside a woven word, with no EN (a click on the word flips it)', () => {
    showWordButton(document, { set: vi.fn() });
    expect(bar().hidden).toBe(true);
    hover(word().firstElementChild!);
    expect(bar().hidden).toBe(false);
    expect(bar().style.left).toBe('162px');
    expect(shadow().querySelector('button[data-action="flip"]')).toBeNull();
  });

  it('🔊 reads the word and stays; a click on the word or elsewhere hides it', () => {
    const say = vi.fn();
    showWordButton(document, { say });
    hover(word());
    button('say').click();
    expect(say).toHaveBeenCalledWith(word());
    expect(bar().hidden).toBe(false);
    word().click();
    expect(bar().hidden).toBe(true);
    hover(word());
    document.body.click();
    expect(bar().hidden).toBe(true);
  });

  it('offers no 🔊 for a word that cannot be read', () => {
    showWordButton(document, { say: vi.fn(), canSay: () => false, set: vi.fn() });
    hover(word());
    expect(button('say').hidden).toBe(true);
    expect(button('save').hidden).toBe(false);
  });

  it('hides a moment after the pointer leaves, unless it reaches the button', () => {
    showWordButton(document, { set: vi.fn() });
    hover(word());
    leave(word());
    bar().dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(HIDE_DELAY_MS);
    expect(bar().hidden).toBe(false);
    bar().dispatchEvent(new MouseEvent('mouseleave'));
    vi.advanceTimersByTime(HIDE_DELAY_MS);
    expect(bar().hidden).toBe(true);
  });

  it('offers only the buttons it has actions for', () => {
    showWordButton(document, {});
    hover(word());
    expect(bar().hidden).toBe(true);
    showWordButton(document, { set: vi.fn() });
    hover(word());
    expect(bar().hidden).toBe(false);
    expect(button('say').hidden).toBe(true);
    expect(button('save').hidden).toBe(false);
  });

  it('saves a word and marks it known, each a toggle', () => {
    let status: 'seen' | 'saved' | 'known' | undefined;
    const set = vi.fn((_el: HTMLElement, s: typeof status) => (status = s));
    showWordButton(document, { set, status: () => status });
    hover(word());
    expect(button('save').getAttribute('aria-pressed')).toBe('false');
    expect(button('save').title).toMatch(/Save to learn/);
    expect(button('know').title).toMatch(/I know this/);
    button('save').click();
    expect(set).toHaveBeenLastCalledWith(word(), 'saved');
    expect(button('save').getAttribute('aria-pressed')).toBe('true');
    button('save').click();
    expect(set).toHaveBeenLastCalledWith(word(), 'seen');
    button('know').click();
    expect(set).toHaveBeenLastCalledWith(word(), 'known');
    expect(button('know').getAttribute('aria-pressed')).toBe('true');
  });

  it('is not offered while the word shows its English', () => {
    showWordButton(document, { set: vi.fn() });
    toggleSource(word());
    hover(word());
    expect(bar().hidden).toBe(true);
  });

  it('goes away when stopped', () => {
    const b = showWordButton(document, { set: vi.fn() });
    b.stop();
    expect(document.querySelector(`[${WORD_BUTTON_ATTR}]`)).toBeNull();
  });
});
