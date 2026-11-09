import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NOTES_ATTR, placeNote, removeNotes, showNotes, stack } from '../src/notes';
import { collectSegments, contentRoot } from '../src/weave/segment';

const shadow = () => document.querySelector(`[${NOTES_ATTR}]`)!.shadowRoot!;
const box = (left: number, top: number, right: number, bottom: number) => ({ left, top, right, bottom });
const rect = (left: number, top: number, right: number, bottom: number) =>
  ({ left, top, right, bottom, width: right - left, height: bottom - top, x: left, y: top, toJSON() {} }) as DOMRect;

beforeEach(() => {
  document.body.innerHTML = '<main><p id="p">The teacher said hello to the twelve students in the morning.</p></main>';
  removeNotes(document);
});

function highlight(): Range {
  const range = document.createRange();
  range.selectNodeContents(document.getElementById('p')!);
  return range;
}

describe('placeNote', () => {
  const view = { left: 0, width: 1400 };
  it('goes in the right margin, level with the highlight', () => {
    expect(placeNote(box(300, 500, 700, 540), box(200, 480, 900, 700), view)).toEqual({ side: 'right', left: 916, top: 500, width: 300 });
  });
  it('narrows to the margin there is', () => {
    expect(placeNote(box(300, 500, 700, 540), box(200, 480, 1100, 700), view).width).toBe(272);
  });
  it('goes in the left margin when the right one is too narrow', () => {
    expect(placeNote(box(400, 500, 700, 540), box(400, 480, 1300, 700), view)).toEqual({ side: 'left', left: 84, top: 500, width: 300 });
  });
  it('falls back to a bubble under the highlight, inside the window', () => {
    expect(placeNote(box(300, 500, 700, 540), box(20, 480, 1380, 700), view)).toEqual({ side: 'below', left: 300, top: 548, width: 340 });
    expect(placeNote(box(1200, 500, 1300, 540), box(20, 480, 1380, 700), view).left).toBe(1048);
    expect(placeNote(box(10, 500, 300, 540), box(0, 480, 360, 700), { left: 0, width: 360 })).toMatchObject({ left: 12, width: 336 });
  });
});

describe('stack', () => {
  it('moves a note down until it clears the one above', () => {
    expect(stack([100, 120, 400], [200, 50, 50])).toEqual([100, 308, 400]);
  });
});

describe('notes', () => {
  it('offers a button at the end of the highlight', () => {
    const notes = showNotes(document);
    const onPick = vi.fn();
    const chip = shadow().querySelector<HTMLButtonElement>('.chip')!;
    expect(chip.hidden).toBe(true);
    notes.offer(highlight(), onPick);
    expect(chip.hidden).toBe(false);
    chip.click();
    expect(onPick).toHaveBeenCalledOnce();
    expect(chip.hidden).toBe(true);
    notes.offer(highlight(), onPick);
    notes.withdraw();
    expect(chip.hidden).toBe(true);
    notes.remove();
  });

  it('opens notes in the margin, which stay until closed', () => {
    const notes = showNotes(document);
    const p = document.getElementById('p')!;
    const a = notes.open(highlight(), p);
    a.show({ lines: [{ fr: 'Le professeur dit bonjour.', en: 'The teacher says hello.' }] });
    notes.open(highlight(), p).show({ note: 'Summarising…' });
    const cards = shadow().querySelectorAll<HTMLElement>('.card');
    expect(cards).toHaveLength(2);
    expect(cards[0]!.querySelector('.fr')!.textContent).toBe('Le professeur dit bonjour.');
    expect(cards[0]!.classList.contains('bubble')).toBe(false);

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(shadow().querySelectorAll('.card')).toHaveLength(2);
    cards[0]!.querySelector<HTMLButtonElement>('.dismiss')!.click();
    expect(a.open).toBe(false);
    expect(shadow().querySelectorAll('.card')).toHaveLength(1);
    notes.remove();
  });

  it('shows a bubble when the paragraph fills the window, closed by the next click', () => {
    const notes = showNotes(document);
    const p = document.getElementById('p')!;
    p.getBoundingClientRect = () => rect(0, 100, innerWidth, 200);
    const note = notes.open(highlight(), p);
    expect(shadow().querySelector('.card')!.classList.contains('bubble')).toBe(true);
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(note.open).toBe(false);
    note.show({ note: 'late' }); // a response after it closed
    expect(shadow().querySelector('.card')).toBeNull();
    notes.remove();
    expect(document.querySelector(`[${NOTES_ATTR}]`)).toBeNull();
  });

  it('is never woven: it sits outside the body, in a shadow root', () => {
    showNotes(document).open(highlight(), document.getElementById('p')!).show({ lines: [{ fr: 'Salut', en: 'Hi' }] });
    expect(document.body.contains(document.querySelector(`[${NOTES_ATTR}]`))).toBe(false);
    expect(collectSegments(contentRoot(document)).map((s) => s.text)).toEqual([
      'The teacher said hello to the twelve students in the morning.',
    ]);
  });
});
