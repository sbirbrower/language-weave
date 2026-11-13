import type { LanguageConfig } from '../languages';
import { setDirection } from '../direction';
import { rubyNodes } from '../ruby';
import { GLOSS_CLASS, relocate, toDomPoint, WOVEN_CLASS, type Segment } from '../weave/segment';
import type { ShownMark } from './stream';

/** The marked English: stays page text (it isn't `.tissage`), so the weave and later marks still see it. */
export const MARK_CLASS = `${WOVEN_CLASS}-mark`;
export { GLOSS_CLASS };

/** Points are numbered in slots that repeat after this many (`data-tissage-point`), so a page's marks can tell them apart. */
const HUES = 6;

/** For the page's stylesheet: the English underlined in green dots, the gloss after it in green italics, in brackets. */
export const MARK_STYLES = `
.${MARK_CLASS} {
  cursor: pointer; text-decoration: underline dotted 2px; text-underline-offset: 0.24em; text-decoration-color: var(--tissage-mark);
  --tissage-mark: #2e7d5b;
}
.${GLOSS_CLASS} { cursor: pointer; margin-left: 0.25em; font-size: 0.92em; font-style: italic; font-weight: 500; color: #2e7d5b; }
.${GLOSS_CLASS}::before { content: "("; } .${GLOSS_CLASS}::after { content: ")"; }
@media (prefers-color-scheme: dark) {
  .${MARK_CLASS} { --tissage-mark: #6fcf9f; }
  .${GLOSS_CLASS} { color: #6fcf9f; }
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
