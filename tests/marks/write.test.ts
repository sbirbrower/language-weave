import { describe, expect, it } from 'vitest';
import { fr } from '../../src/languages/fr';
import { MARK_POPUP_ATTR, popupSpot, showMarkPopup } from '../../src/marks/popup';
import type { ShownMark } from '../../src/marks/stream';
import { applyMark, GLOSS_CLASS, hueFor, MARK_CLASS, markFor, removeMarks } from '../../src/marks/write';
import { collectSegments, currentText, relocate, type Segment } from '../../src/weave/segment';

const HTML = '<p>Sir <a href="/w">William</a> stayed only a week, and then they <b>departed</b> for home.</p>';

function setup(html = HTML) {
  document.body.innerHTML = html;
  const [seg] = collectSegments(document.body) as [Segment];
  const mark = (english: string, target: string, point = 1, from = 0): ShownMark => {
    const start = seg.text.indexOf(english, from);
    return { para: 1, at: 0, start, end: start + english.length, english, target, point, note: `note on ${english}`, pointLabel: `point ${point}` };
  };
  return { seg, mark, p: document.querySelector('p')! };
}

const glosses = () => [...document.querySelectorAll(`.${GLOSS_CLASS}`)].map((g) => g.textContent);
const marked = () => [...document.querySelectorAll(`.${MARK_CLASS}`)].map((m) => m.textContent);

describe('applyMark', () => {
  it('keeps the English, with its markup, and puts the gloss after it', () => {
    const { seg, mark, p } = setup();
    const span = applyMark(seg, mark('Sir William stayed only a week', 'Sir William est resté une semaine', 2), fr)!;
    expect(span.querySelector('a')?.textContent).toBe('William');
    expect(span.nextElementSibling?.className).toBe(GLOSS_CLASS);
    expect((span.nextElementSibling as HTMLElement).lang).toBe(fr.bcp47);
    expect(span.dataset).toMatchObject({ target: 'Sir William est resté une semaine', pointNumber: '2', pointLabel: 'point 2', tissagePoint: '2' });
    expect(p.textContent).toBe('Sir William stayed only a weekSir William est resté une semaine, and then they departed for home.');
  });

  it('writes marks in any order, at either edge of the segment', () => {
    const { seg, mark } = setup();
    const end = mark('for home.', 'à la maison.');
    const start = mark('Sir', 'Monsieur');
    const middle = mark('they departed', 'ils sont partis');
    for (const m of [end, start, middle]) expect(applyMark(seg, m, fr)).not.toBeNull();
    expect(marked()).toEqual(['Sir', 'they departed', 'for home.']);
    expect(glosses()).toEqual(['Monsieur', 'ils sont partis', 'à la maison.']);
    // The gloss isn't page text: the segment still reads as the English.
    expect(relocate(seg)).toBe(true);
    expect(currentText(seg)).toBe(seg.text);
    expect(collectSegments(document.body)[0]?.text).toBe(seg.text);
  });

  it('refuses a segment whose text changed', () => {
    const { seg, mark, p } = setup();
    p.firstChild!.textContent = 'Lady ';
    expect(applyMark(seg, mark('only a week', 'une semaine'), fr)).toBeNull();
  });

  it('comes off again, leaving the page as it was', () => {
    const { seg, mark, p } = setup();
    applyMark(seg, mark('they departed', 'ils sont partis'), fr);
    applyMark(seg, mark('Sir William', 'Sir William'), fr);
    removeMarks(document.body);
    expect(p.outerHTML).toBe(HTML);
  });
});

  it('takes an element it starts or ends at whole, so nothing is left split', () => {
    const { seg, mark, p } = setup();
    const span = applyMark(seg, mark('departed for home', 'partis'), fr)!;
    expect(span.firstElementChild?.tagName).toBe('B');
    expect(p.querySelectorAll('b')).toHaveLength(1);
    removeMarks(document.body);
    expect(p.outerHTML).toBe(HTML);
  });

describe('the mark popup', () => {
  it('opens on a click on a mark, even inside a link, with its target and point', () => {
    const { seg, mark } = setup();
    applyMark(seg, mark('William', 'Guillaume', 3), fr);
    const said: string[] = [];
    const popup = showMarkPopup(document, (t) => said.push(t));
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    document.querySelector('a')!.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    const pop = document.querySelector(`[${MARK_POPUP_ATTR}]`)!.shadowRoot!.querySelector<HTMLElement>('.pop')!;
    expect(pop.hidden).toBe(false);
    expect([...pop.querySelectorAll('div')].map((d) => d.textContent)).toEqual(['Guillaume', 'Guillaume', 'William', 'point 3']);
    pop.querySelector('button')!.click();
    expect(said).toEqual(['Guillaume']);
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(pop.hidden).toBe(true);
    popup.stop();
    expect(document.querySelector(`[${MARK_POPUP_ATTR}]`)).toBeNull();
  });
});

describe('markFor', () => {
  it('finds the mark from its English or its gloss', () => {
    const { seg, mark } = setup();
    const span = applyMark(seg, mark('they departed', 'ils sont partis'), fr)!;
    expect(markFor(span.querySelector('b'))).toBe(span);
    expect(markFor(span.nextElementSibling)).toBe(span);
    expect(markFor(document.querySelector('a'))).toBeNull();
  });
});

describe('hueFor', () => {
  it('gives each point a colour, repeating after six', () => {
    expect([1, 2, 6, 7, 0].map(hueFor)).toEqual(['1', '2', '6', '1', '1']);
  });
});

describe('popupSpot', () => {
  const view = { width: 800, height: 600 };
  it('goes under the mark, inside the window', () => {
    expect(popupSpot({ left: 100, top: 100, bottom: 120 }, { width: 300, height: 80 }, view)).toEqual({ left: 100, top: 126 });
    expect(popupSpot({ left: 700, top: 100, bottom: 120 }, { width: 300, height: 80 }, view).left).toBe(492);
  });
  it('goes above it when there’s no room below', () => {
    expect(popupSpot({ left: 100, top: 560, bottom: 580 }, { width: 300, height: 80 }, view).top).toBe(474);
  });
});
