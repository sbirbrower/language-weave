import { beforeEach, describe, expect, it, vi } from 'vitest';
import { collectSegments, contentRoot } from '../src/weave/segment';
import { removeWidget, showWidget, stepTextScale, TEXT_SCALES, WIDGET_ATTR } from '../src/widget';

const shadow = () => document.querySelector(`[${WIDGET_ATTR}]`)!.shadowRoot!;
const formats = [
  { id: 'facts', label: 'Lesson-lens facts' },
  { id: 'text', label: 'Short text' },
];

beforeEach(() => {
  document.body.innerHTML = '<main><p>The teacher said hello to the twelve students in the morning.</p></main>';
  removeWidget(document);
});

describe('widget', () => {
  it('shows lines in a fixed panel, with the format picker', () => {
    const w = showWidget(document, { title: 'Les bases', formats, selected: 'text', onSelect: () => {} });
    w.show({ lines: [{ fr: 'Bonjour !', en: 'Hello!' }] });
    expect(shadow().querySelector('.title')!.textContent).toBe('Les bases');
    expect(shadow().querySelector('.fr')!.textContent).toBe('Bonjour !');
    expect(shadow().querySelector('.en')!.textContent).toBe('Hello!');
    expect(shadow().querySelector<HTMLSelectElement>('select')!.value).toBe('text');
    expect(shadow().querySelector('style')!.textContent).toContain('position: fixed');
  });

  it('reports the chosen format and shows notes', () => {
    const onSelect = vi.fn();
    const w = showWidget(document, { title: 't', formats, selected: 'facts', onSelect });
    const select = shadow().querySelector<HTMLSelectElement>('select')!;
    select.value = 'text';
    select.dispatchEvent(new Event('change'));
    expect(onSelect).toHaveBeenCalledWith('text');
    w.show({ note: 'Writing…' });
    expect(shadow().querySelector('.note')!.textContent).toBe('Writing…');
    expect(shadow().querySelectorAll('.line')).toHaveLength(0);
  });

  it('is never woven: it sits outside the body, in a shadow root', () => {
    showWidget(document, { title: 't', formats, selected: 'facts', onSelect: () => {} }).show({ lines: [{ fr: 'Salut', en: 'Hi' }] });
    expect(document.body.contains(document.querySelector(`[${WIDGET_ATTR}]`))).toBe(false);
    expect(collectSegments(contentRoot(document)).map((s) => s.text)).toEqual([
      'The teacher said hello to the twelve students in the morning.',
    ]);
  });

  it('minimises, expands and closes', () => {
    const onClose = vi.fn();
    showWidget(document, { title: 't', formats, selected: 'facts', onSelect: () => {}, onClose });
    const panel = shadow().querySelector('.panel')!;
    const collapse = shadow().querySelector<HTMLButtonElement>('.collapse')!;
    collapse.click();
    expect(panel.classList.contains('collapsed')).toBe(true);
    expect(collapse.getAttribute('aria-expanded')).toBe('false');
    collapse.click();
    expect(panel.classList.contains('collapsed')).toBe(false);
    shadow().querySelector<HTMLButtonElement>('.close')!.click();
    expect(document.querySelector(`[${WIDGET_ATTR}]`)).toBeNull();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('keeps one widget per page', () => {
    showWidget(document, { title: 'a', formats, selected: 'facts', onSelect: () => {} });
    showWidget(document, { title: 'b', formats, selected: 'facts', onSelect: () => {} });
    expect(document.querySelectorAll(`[${WIDGET_ATTR}]`)).toHaveLength(1);
    removeWidget(document);
    expect(document.querySelector(`[${WIDGET_ATTR}]`)).toBeNull();
  });
});

describe('text size', () => {
  it('steps through the sizes and stops at either end', () => {
    expect(stepTextScale(1, 1)).toBe(1.15);
    expect(stepTextScale(1, -1)).toBe(0.85);
    expect(stepTextScale(TEXT_SCALES[0]!, -1)).toBe(TEXT_SCALES[0]);
    expect(stepTextScale(TEXT_SCALES.at(-1)!, 1)).toBe(TEXT_SCALES.at(-1));
    expect(stepTextScale(1.2, 1)).toBe(1.5);
  });

  it('A+ and A− resize the panel and report the new size', () => {
    const sizes: number[] = [];
    showWidget(document, { title: 'Language Weave', textScale: 1.75, onTextScale: (s) => sizes.push(s) });
    const panel = shadow().querySelector<HTMLElement>('.panel')!;
    const bigger = shadow().querySelector<HTMLButtonElement>('.bigger')!;
    expect(panel.style.getPropertyValue('--scale')).toBe('1.75');
    expect(bigger.disabled).toBe(true);
    shadow().querySelector<HTMLButtonElement>('.smaller')!.click();
    expect(panel.style.getPropertyValue('--scale')).toBe('1.5');
    expect(bigger.disabled).toBe(false);
    expect(sizes).toEqual([1.5]);
  });
});
