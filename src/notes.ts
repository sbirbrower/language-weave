import { BASE_STYLES, el, fillLines, type WidgetContent } from './widget';

/**
 * Summaries of the reader's highlights, next to the passage they summarise: a
 * note in the page's margin, level with the highlight, or a bubble under it
 * when there's no margin to spare. Both sit at page coordinates, so they
 * scroll with the text. A "Summarise" button at the end of a highlight opens
 * one. Like the widget, everything lives in a shadow root outside <body>, so
 * the weave never touches it; built with DOM calls only.
 */

export const NOTES_ATTR = 'data-tissage-notes';

/** A box in page coordinates (viewport plus scroll). */
export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface Placement {
  side: 'right' | 'left' | 'below';
  left: number;
  top: number;
  width: number;
}

const GAP = 16; // between the text and a margin note
const EDGE = 12; // between a note and the window's edge
const MARGIN_WIDTH = 300;
const MIN_MARGIN_WIDTH = 220;
const BUBBLE_WIDTH = 340;
const STACK_GAP = 8;

/**
 * Where a note goes: in the margin right of the highlight's paragraph, else
 * left of it, else under the highlight. `view` is the visible width of the page.
 */
export function placeNote(highlight: Box, column: Box, view: { left: number; width: number }): Placement {
  const viewRight = view.left + view.width - EDGE;
  const right = viewRight - (column.right + GAP);
  if (right >= MIN_MARGIN_WIDTH) {
    return { side: 'right', left: column.right + GAP, top: highlight.top, width: Math.min(MARGIN_WIDTH, right) };
  }
  const left = column.left - GAP - (view.left + EDGE);
  if (left >= MIN_MARGIN_WIDTH) {
    const width = Math.min(MARGIN_WIDTH, left);
    return { side: 'left', left: column.left - GAP - width, top: highlight.top, width };
  }
  const width = Math.min(BUBBLE_WIDTH, view.width - 2 * EDGE);
  const x = Math.max(view.left + EDGE, Math.min(highlight.left, viewRight - width));
  return { side: 'below', left: x, top: highlight.bottom + 8, width };
}

/** Tops for notes down one margin, in page order: each moves down until it clears the one above. */
export function stack(tops: number[], heights: number[], gap = STACK_GAP): number[] {
  const out: number[] = [];
  tops.forEach((top, i) => out.push(i ? Math.max(top, out[i - 1]! + heights[i - 1]! + gap) : top));
  return out;
}

export interface Note {
  show(content: WidgetContent): void;
  /** False once the reader closed it. */
  readonly open: boolean;
}

export interface Notes {
  host: HTMLElement;
  /** Puts a "Summarise" button at the end of the highlight; `onPick` runs when it's clicked. */
  offer(range: Range, onPick: () => void): void;
  withdraw(): void;
  /** Opens a note beside the highlight; `column` is the paragraph it's in. */
  open(range: Range, column: Element): Note;
  /** Places the notes again, after the page reflowed or the window changed size. */
  layout(): void;
  remove(): void;
}

const STYLES = `${BASE_STYLES}
:host { position: absolute; top: 0; left: 0; z-index: 2147483646; }
.card {
  position: absolute; box-sizing: border-box; display: grid; gap: 6px; padding: 8px 10px 10px;
  background: var(--bg); color: var(--fg); border: 1px solid var(--border); border-left: 3px solid var(--accent);
  border-radius: 8px; box-shadow: 0 2px 10px rgb(0 0 0 / 0.1);
  font: 13.5px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif;
}
.card.bubble { border-left-width: 1px; box-shadow: 0 6px 24px rgb(0 0 0 / 0.18); }
.card-bar { display: flex; align-items: center; }
.card-title { flex: 1; color: var(--muted); font-size: 11.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
.card-bar button { width: 20px; height: 20px; font-size: 14px; }
.lines { display: grid; gap: 6px; }
.chip {
  position: absolute; width: auto; height: auto; padding: 3px 10px; border-radius: 999px;
  background: var(--accent); color: var(--on-accent); box-shadow: 0 2px 8px rgb(0 0 0 / 0.2);
  font: 600 12px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif;
}
.chip:hover { background: var(--accent); color: var(--on-accent); filter: brightness(1.1); }
.chip[hidden] { display: none; }
`;

// jsdom gives ranges no boxes; there, the box of the element the range starts in.
function rangeRects(range: Range): DOMRect[] {
  if (typeof range.getClientRects === 'function') {
    const rects = [...range.getClientRects()];
    if (rects.length) return rects;
  }
  const start = range.startContainer;
  const el = start instanceof Element ? start : start.parentElement;
  return el ? [el.getBoundingClientRect()] : [];
}

interface Open {
  card: HTMLElement;
  column: Element;
  /** The highlight, relative to the column's top left, so it follows the column when the page reflows. */
  offset: Box;
  side?: Placement['side'];
}

/** Shows the notes layer, replacing any that's already on the page. */
export function showNotes(doc: Document): Notes {
  removeNotes(doc);
  const win = doc.defaultView!;
  const host = doc.createElement('div');
  host.setAttribute(NOTES_ATTR, '');
  const root = host.attachShadow({ mode: 'open' });
  const style = doc.createElement('style');
  style.textContent = STYLES;

  const chip = el(doc, 'button', 'chip', 'Summarise');
  chip.hidden = true;
  chip.setAttribute('aria-label', 'Summarise the highlight');
  // Keeps the highlight: a mousedown on the page would collapse it.
  chip.addEventListener('mousedown', (e) => e.preventDefault());
  let pick: (() => void) | undefined;
  chip.addEventListener('click', () => {
    const run = pick;
    withdraw();
    run?.();
  });
  root.append(style, chip);
  // Outside <body>, so nothing that walks the page's content finds it.
  doc.documentElement.append(host);

  const notes: Open[] = [];
  const page = (r: DOMRect): Box => ({
    left: r.left + win.scrollX,
    top: r.top + win.scrollY,
    right: r.right + win.scrollX,
    bottom: r.bottom + win.scrollY,
  });

  function layout() {
    const view = { left: win.scrollX, width: doc.documentElement.clientWidth || win.innerWidth };
    const placed = notes.map((n) => {
      const col = page(n.column.getBoundingClientRect());
      const hl = {
        left: col.left + n.offset.left,
        top: col.top + n.offset.top,
        right: col.left + n.offset.right,
        bottom: col.top + n.offset.bottom,
      };
      const p = placeNote(hl, col, view);
      n.side = p.side;
      n.card.classList.toggle('bubble', p.side === 'below');
      n.card.style.left = `${p.left}px`;
      n.card.style.width = `${p.width}px`;
      return { n, p };
    });
    for (const side of ['right', 'left', 'below'] as const) {
      const down = placed.filter((x) => x.p.side === side).sort((a, b) => a.p.top - b.p.top);
      // Bubbles go under their own highlight; there's at most one at a time.
      const tops = side === 'below' ? down.map((x) => x.p.top) : stack(down.map((x) => x.p.top), down.map((x) => x.n.card.offsetHeight));
      down.forEach((x, i) => (x.n.card.style.top = `${tops[i]}px`));
    }
  }

  let frame = 0;
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(layout);
  };
  win.addEventListener('resize', schedule);
  // The page reflows as it's woven and as images load.
  const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(schedule);
  if (doc.body) observer?.observe(doc.body);

  function close(n: Open) {
    n.card.remove();
    notes.splice(notes.indexOf(n), 1);
    layout();
  }
  // A bubble covers the text, so it goes at the next click or Escape; margin notes stay until closed.
  const closeBubbles = () => notes.filter((n) => n.side === 'below').forEach(close);
  const onMouseDown = (e: MouseEvent) => {
    if (e.target !== host) closeBubbles();
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') closeBubbles();
  };
  doc.addEventListener('mousedown', onMouseDown, true);
  doc.addEventListener('keydown', onKeyDown);

  function withdraw() {
    chip.hidden = true;
    pick = undefined;
  }

  return {
    host,
    offer(range, onPick) {
      pick = onPick;
      const rects = rangeRects(range);
      const end = rects[rects.length - 1];
      if (!end) return;
      chip.hidden = false;
      const box = page(end);
      const maxLeft = win.scrollX + (doc.documentElement.clientWidth || win.innerWidth) - EDGE - chip.offsetWidth;
      chip.style.left = `${Math.max(win.scrollX + EDGE, Math.min(box.right + 4, maxLeft))}px`;
      chip.style.top = `${box.bottom + 4}px`;
    },
    withdraw,
    open(range, column) {
      const card = el(doc, 'aside', 'card');
      card.setAttribute('aria-label', 'Summary of your highlight');
      const bar = el(doc, 'div', 'card-bar');
      const dismiss = el(doc, 'button', 'dismiss', '×');
      dismiss.setAttribute('aria-label', 'Close summary');
      bar.append(el(doc, 'span', 'card-title', 'Summary'), dismiss);
      const lines = el(doc, 'div', 'lines');
      card.append(bar, lines);
      root.append(card);

      const col = column.getBoundingClientRect();
      const rects = rangeRects(range);
      const hl = rects.length
        ? {
            left: Math.min(...rects.map((r) => r.left)),
            top: Math.min(...rects.map((r) => r.top)),
            right: Math.max(...rects.map((r) => r.right)),
            bottom: Math.max(...rects.map((r) => r.bottom)),
          }
        : col;
      const n: Open = {
        card,
        column,
        offset: { left: hl.left - col.left, top: hl.top - col.top, right: hl.right - col.left, bottom: hl.bottom - col.top },
      };
      notes.push(n);
      dismiss.addEventListener('click', () => close(n));
      layout();
      return {
        show(content) {
          if (!card.isConnected) return;
          fillLines(lines, content);
          layout();
        },
        get open() {
          return card.isConnected;
        },
      };
    },
    layout,
    remove() {
      cancelAnimationFrame(frame);
      win.removeEventListener('resize', schedule);
      observer?.disconnect();
      doc.removeEventListener('mousedown', onMouseDown, true);
      doc.removeEventListener('keydown', onKeyDown);
      host.remove();
    },
  };
}

export function removeNotes(doc: Document) {
  for (const host of doc.querySelectorAll(`[${NOTES_ATTR}]`)) host.remove();
}
