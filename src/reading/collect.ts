import { WOVEN_CLASS, type Segment } from '../weave/segment';
import { EN_CLASS, FR_CLASS } from '../weave/write';

// What the reading formats read from the page. These look at layout, so they
// run in the content script; with no layout (tests) nothing counts as on screen.

const HEADING = /^H[1-6]$/;

export function isHeading(seg: Segment): boolean {
  return HEADING.test(seg.block.tagName);
}

export function onScreen(el: Element, lookahead = 0): boolean {
  const r = el.getBoundingClientRect();
  // Across too: a reader that turns pages sideways keeps the pages either side laid out off screen.
  return r.height > 0 && r.bottom > 0 && r.top < innerHeight * (1 + lookahead) && r.right > 0 && r.left < innerWidth;
}

/** Paragraphs on screen; from the top of the page when nothing is laid out yet. */
export function onScreenText(segments: Segment[], lookahead = 0): string[] {
  const body = segments.filter((s) => !isHeading(s));
  const visible = body.filter((s) => onScreen(s.block, lookahead));
  return (visible.length ? visible : body.slice(0, 8)).map((s) => s.text);
}

/**
 * Section headings, read from the page itself: short ones like "Diet" are
 * too short to be woven segments, but they name the section.
 */
export function headingElements(root: Element): Element[] {
  return [...root.querySelectorAll('h1, h2, h3, h4')].filter(
    (h) => headingText(h) && !h.closest('nav, aside, [role="navigation"], [hidden], [aria-hidden="true"]'),
  );
}

/** A heading's text without Wikipedia's "[edit]" links. */
export function headingText(h: Element): string {
  return (h.textContent ?? '').replace(/\[\s*edit\s*\]/gi, '').replace(/\s+/g, ' ').trim();
}

const MIN_OPENING_WORDS = 10;

/** The first real paragraphs of the article: prose, not info-box cells or captions. */
export function openingText(segments: Segment[], max = 4): string[] {
  return segments
    .filter((s) => s.block.tagName === 'P' && s.text.split(/\s+/).filter(Boolean).length >= MIN_OPENING_WORDS)
    .slice(0, max)
    .map((s) => s.text);
}

export function headings(root: Element): string[] {
  return [...new Set(headingElements(root).map(headingText))];
}

/** Woven spans on screen as "French (English)". */
export function wovenOnScreen(doc: Document, max = 12): string[] {
  const out: string[] = [];
  for (const w of doc.querySelectorAll(`.${WOVEN_CLASS}`)) {
    if (!onScreen(w)) continue;
    const fr = w.querySelector(`.${FR_CLASS}`)?.textContent?.trim();
    const en = w.querySelector(`.${EN_CLASS}`)?.textContent?.trim();
    if (fr && en) out.push(`${fr} (${en})`);
    if (out.length >= max) break;
  }
  return out;
}

// Wikipedia-style reference marks: [14], [a], [citation needed].
const REFERENCE = /\[\s*(?:\d+|[a-z]|citation needed|note \d+)\s*\]/gi;

/**
 * The reader's highlight inside the article, in the page's English: woven
 * words read as their original, reference marks dropped. Read from a copy
 * of the range, so the page is never touched.
 */
export function selectedText(doc: Document, root: Element): string {
  const sel = doc.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return '';
  const range = sel.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) return '';
  const copy = doc.createElement('div');
  copy.append(range.cloneContents());
  for (const fr of copy.querySelectorAll(`.${FR_CLASS}`)) fr.remove();
  return (copy.textContent ?? '').replace(REFERENCE, '').replace(/\s+/g, ' ').trim();
}
