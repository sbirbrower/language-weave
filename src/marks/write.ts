import type { LanguageConfig } from '../languages';
import { setDirection } from '../direction';
import { rubyNodes } from '../ruby';
import { GLOSS_CLASS, relocate, toDomPoint, WOVEN_CLASS, type Segment } from '../weave/segment';
import type { ShownMark } from './stream';

/** The marked English: stays page text (it isn't `.tissage`), so the weave and later marks still see it. */
export const MARK_CLASS = `${WOVEN_CLASS}-mark`;
export { GLOSS_CLASS };

/** Point colours repeat after this many. */
const HUES = 6;

/** For the page's stylesheet: the English underlined in its point's colour, the gloss after it in brackets. */
export const MARK_STYLES = `
.${MARK_CLASS} { cursor: pointer; text-decoration: underline 2px; text-underline-offset: 0.22em; text-decoration-color: var(--tissage-hue); }
.${GLOSS_CLASS} {
  cursor: pointer; margin-left: 0.25em; padding: 0 0.3em; border-radius: 0.3em; font-size: 0.88em; font-style: normal;
  color: var(--tissage-hue); background: var(--tissage-tint);
}
.${GLOSS_CLASS}::before { content: "("; } .${GLOSS_CLASS}::after { content: ")"; }
${['#b4462f', '#2f6f8a', '#5f7a14', '#8a4a8f', '#a86b12', '#3d7a5c']
  .map((hue, i) => `[data-tissage-point="${i + 1}"] { --tissage-hue: ${hue}; --tissage-tint: color-mix(in srgb, ${hue} 12%, transparent); }`)
  .join('\n')}
@media (prefers-color-scheme: dark) {
${['#f0937c', '#7fc3dd', '#b9cf6a', '#d39ad8', '#e8b45e', '#84cfa8']
  .map((hue, i) => `  [data-tissage-point="${i + 1}"] { --tissage-hue: ${hue}; --tissage-tint: color-mix(in srgb, ${hue} 18%, transparent); }`)
  .join('\n')}
}
`;

/** The colour slot for a lesson point (1-based), so every mark of a point matches. */
export const hueFor = (point: number) => String(((Math.max(1, point) - 1) % HUES) + 1);

/**
 * Writes one mark into its segment: the English, with its markup, moves into
 * a span, and the gloss follows it. `innerHTML` is never touched. Marks of a
 * segment can arrive in any order; the segment's range is widened over a mark
 * at its edge so the next one still finds the text. Returns the English's
 * span, or null if the segment's text changed since it was collected.
 */
export function applyMark(seg: Segment, mark: ShownMark, lang: LanguageConfig): HTMLElement | null {
  if (!relocate(seg)) return null;
  const doc = seg.block.ownerDocument;
  const start = toDomPoint(seg, mark.start, 'start');
  const end = toDomPoint(seg, mark.end, 'end');
  const range = doc.createRange();
  range.setStart(start.node, start.offset);
  range.setEnd(end.node, end.offset);
  widen(range, seg.block);

  const span = doc.createElement('span');
  span.className = MARK_CLASS;
  span.dataset.tissagePoint = hueFor(mark.point);
  span.dataset.target = mark.target;
  span.dataset.note = mark.note;
  span.dataset.pointLabel = mark.pointLabel;
  span.dataset.pointNumber = String(mark.point);
  span.tabIndex = 0;
  span.append(range.extractContents());
  range.insertNode(span);

  const gloss = doc.createElement('span');
  gloss.className = GLOSS_CLASS;
  gloss.dataset.tissagePoint = span.dataset.tissagePoint;
  gloss.lang = lang.bcp47;
  gloss.append(...rubyNodes(doc, mark.target));
  setDirection(gloss, mark.target);
  span.after(gloss);

  if (mark.start === 0) seg.range.setStartBefore(span);
  if (mark.end === seg.text.length) seg.range.setEndAfter(span);
  relocate(seg);
  return span;
}

/**
 * Moves a range's ends out over inline elements it starts or ends exactly at
 * the edge of, so a link or bold word goes into the mark whole instead of
 * being split, which would leave an empty copy behind when it comes off.
 */
function widen(range: Range, block: Element) {
  const length = (n: Node) => (n.nodeType === Node.TEXT_NODE ? (n as Text).length : n.childNodes.length);
  if (range.startOffset === 0) {
    let n: Node = range.startContainer;
    while (!n.previousSibling && n.parentNode && n.parentNode !== block) n = n.parentNode;
    if (n !== range.startContainer) range.setStartBefore(n);
  }
  if (range.endOffset === length(range.endContainer)) {
    let n: Node = range.endContainer;
    while (!n.nextSibling && n.parentNode && n.parentNode !== block) n = n.parentNode;
    if (n !== range.endContainer) range.setEndAfter(n);
  }
}

/** The English span of a mark, from a click on it or on its gloss. */
export function markFor(target: Element | null): HTMLElement | null {
  const el = target?.closest?.(`.${MARK_CLASS}, .${GLOSS_CLASS}`) ?? null;
  if (!el) return null;
  if (el.classList.contains(MARK_CLASS)) return el as HTMLElement;
  const prev = el.previousElementSibling;
  return prev?.classList.contains(MARK_CLASS) ? (prev as HTMLElement) : null;
}

/** Takes every mark off the page under `root`: the English goes back as it was, the glosses go. */
export function removeMarks(root: ParentNode): void {
  for (const gloss of root.querySelectorAll(`.${GLOSS_CLASS}`)) gloss.remove();
  for (const span of root.querySelectorAll(`.${MARK_CLASS}`)) {
    const parent = span.parentNode;
    span.replaceWith(...Array.from(span.childNodes));
    parent?.normalize();
  }
}
