import type { Piece, PieceLine } from './passage/piece';
import { PRACTICE_STYLES } from './practice/styles';
import type { SectionKind, Textbook } from './passage/textbook';
import { italicSpans } from './passage/textbook';
import type { ReadingLine } from './reading/formats';
import { setDirection } from './direction';
import { readingsOnly, rubyNodes, SCRIPT_VIEWS, scriptStyles, withoutReadings, type ScriptView } from './ruby';

/**
 * A small panel fixed to the corner of the screen, so it stays in view as the
 * reader scrolls; dragging its title bar moves it, dragging any edge or corner resizes it. It lives in a shadow root: the page's styles can't reach
 * it, and the weave (which walks the page's own DOM) never touches its text.
 * Built with DOM calls only, never innerHTML.
 */
export interface WidgetOptions {
  title: string;
  /** Reading formats to choose from; the picker is for trying them out. None = no picker. */
  formats?: Array<{ id: string; label: string }>;
  selected?: string;
  onSelect?(id: string): void;
  /** Tabs, each with its own pane; `show` fills the first. None = one pane, no tab bar. */
  tabs?: Array<{ id: string; label: string }>;
  /** The tab shown first; none = the first. */
  tab?: string;
  /** The reader picked a tab. */
  onTab?(id: string): void;
  /** The reader closed the widget. */
  onClose?(): void;
  /** Opens minimised. */
  collapsed?: boolean;
  /** The reader minimised it or opened it out. */
  onCollapse?(collapsed: boolean): void;
  /** Where it was last dragged to, on any page; none = the corner. */
  position?: WidgetPosition | null;
  /** The reader dragged it somewhere (null = double-clicked back to the corner). */
  onMove?(position: WidgetPosition | null): void;
  /** The size the reader last dragged it to, on any page; none = the default. */
  size?: WidgetSize | null;
  /** The reader resized it (null = double-clicked the grip back to the default size). */
  onResize?(size: WidgetSize | null): void;
  /** Text size, a multiple of the default (`TEXT_SCALES`); none = 1. */
  textScale?: number;
  /** The reader made the text bigger or smaller. */
  onTextScale?(scale: number): void;
  /** For a language with a romanisation: how it's shown, a word to label the choices with, and the reader switching. */
  script?: { view: ScriptView; sample: { script: string; roman: string }; onChange(view: ScriptView): void };
}

/** The text sizes A− and A+ step through, as multiples of the default. */
export const TEXT_SCALES = [0.85, 1, 1.15, 1.3, 1.5, 1.75];

/** The next size up (`step` 1) or down (-1) from `scale`, staying within `TEXT_SCALES`. */
export function stepTextScale(scale: number, step: 1 | -1): number {
  const at = TEXT_SCALES.findIndex((s) => s >= scale - 0.001);
  const i = at < 0 ? TEXT_SCALES.length - 1 : at;
  return TEXT_SCALES[Math.max(0, Math.min(i + step, TEXT_SCALES.length - 1))]!;
}

/**
 * Where the reader dragged the widget: its distance from the nearer side and
 * the nearer of top and bottom, so it keeps to that corner in any window.
 */
export interface WidgetPosition {
  x: number;
  y: number;
  fromRight: boolean;
  fromBottom: boolean;
}

/** The panel's size in CSS pixels, set by dragging its corner grip. */
export interface WidgetSize {
  width: number;
  height: number;
}

export interface WidgetContent {
  lines?: ReadingLine[];
  /** Shown instead of lines, or under them: "Writing…", an error, a hint. */
  note?: string;
}

/** Speaker buttons for a pane's lines: one per line, and Listen for them all; words only without `onLine`. */
export interface SpeakControls {
  /** The line being read, -1 for none. */
  playing: number;
  /** Listen is reading every line, not just one. */
  all: boolean;
  onLine?(index: number): void;
  onAll?(): void;
  /** Reads one word slowly (the match-the-words quiz). */
  onWord(text: string): void;
  /** Which words `onWord` can read (`Speaker.can`); unset, any. */
  canWord?(text: string): boolean;
  /** Which lines `onLine` can read (only those recorded); unset, all. */
  canLine?(index: number): boolean;
}

export interface Widget {
  host: HTMLElement;
  show(content: WidgetContent): void;
  setTitle(title: string): void;
  /** A tab's pane, to fill with `fillLines`, `fillTextbook` or `fillPractice`. */
  pane(id: string): HTMLElement;
}

export const WIDGET_ATTR = 'data-tissage-widget';

/** Colours, buttons and reading lines, shared with the highlight notes (`notes.ts`). */
export const BASE_STYLES = `
:host {
  all: initial;
  --bg: #ffffff; --fg: #1c1c1e; --muted: #6b6b70; --border: #d8d8dc; --accent: #2f5bd3; --on-accent: #ffffff;
}
@media (prefers-color-scheme: dark) {
  :host { --bg: #1f1f22; --fg: #f2f2f4; --muted: #a0a0a8; --border: #3a3a40; --accent: #8fb0ff; --on-accent: #10172a; }
}
button {
  all: unset; cursor: pointer; width: 24px; height: 24px; border-radius: 6px;
  display: grid; place-items: center; color: var(--muted); font-size: 16px; line-height: 1;
}
button:hover { background: rgb(127 127 127 / 0.15); color: var(--fg); }
button:focus-visible, select:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.line { display: grid; }
.fr { font-weight: 500; }
.en { color: var(--muted); font-size: 12.5px; }
.note { margin: 0; color: var(--muted); font-size: 13px; }
`;

const STYLES = `${BASE_STYLES}
.panel {
  --scale: 1;
  position: fixed; right: 16px; bottom: 16px; z-index: 2147483647;
  width: min(calc(340px * var(--scale)), calc(100vw - 32px)); max-height: min(60vh, calc(480px * var(--scale)));
  display: flex; flex-direction: column;
  background: var(--bg); color: var(--fg); border: 1px solid var(--border); border-radius: 10px;
  box-shadow: 0 6px 24px rgb(0 0 0 / 0.18);
  font: 14px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif;
}
.bar {
  display: flex; align-items: center; gap: 4px; padding: 8px 8px 8px 12px; border-bottom: 1px solid var(--border);
  cursor: grab; user-select: none; touch-action: none;
}
.panel.dragging .bar { cursor: grabbing; }
/* Text size: everything inside grows with it, the panel only as wide as the window allows. */
.panel > * { zoom: var(--scale); }
.size { width: auto; padding: 0 5px; font-size: 13px; font-weight: 600; }
.size[disabled] { opacity: 0.35; cursor: default; background: none; }
.script { width: auto; flex: none; padding: 1px 2px; font-size: 12px; border-color: transparent; cursor: pointer; }
.script:hover { border-color: var(--border); }
.title { flex: 1; font-weight: 600; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.picker { padding: 8px 12px 0; }
select {
  width: 100%; font: inherit; font-size: 13px; color: var(--fg); background: var(--bg);
  border: 1px solid var(--border); border-radius: 6px; padding: 3px 6px;
}
.tabs { display: flex; gap: 2px; padding: 0 8px; border-bottom: 1px solid var(--border); }
.tab {
  width: auto; height: auto; padding: 6px 8px; border-radius: 0; font-size: 12.5px; font-weight: 500;
  border-bottom: 2px solid transparent; margin-bottom: -1px;
}
.tab:hover { background: none; }
.tab[aria-selected="true"] { color: var(--fg); border-bottom-color: var(--accent); }
.scroll { overflow-y: auto; flex: 1 1 auto; min-height: 0; }
.grip {
  position: absolute; right: 0; bottom: 0; width: 14px; height: 14px; cursor: nwse-resize; touch-action: none;
  background: linear-gradient(135deg, transparent 50%, var(--border) 50%, var(--border) 60%, transparent 60%, transparent 72%, var(--border) 72%, var(--border) 82%, transparent 82%);
  border-bottom-right-radius: 10px;
}
.edge { position: absolute; touch-action: none; z-index: 1; }
.edge.n, .edge.s { left: 10px; right: 10px; height: 6px; cursor: ns-resize; }
.edge.e, .edge.w { top: 10px; bottom: 10px; width: 6px; cursor: ew-resize; }
.edge.n { top: -3px; } .edge.s { bottom: -3px; } .edge.e { right: -3px; } .edge.w { left: -3px; }
.edge.ne, .edge.nw, .edge.sw { width: 12px; height: 12px; }
.edge.ne { top: -3px; right: -3px; cursor: nesw-resize; }
.edge.nw { top: -3px; left: -3px; cursor: nwse-resize; }
.edge.sw { bottom: -3px; left: -3px; cursor: nesw-resize; }
.grip { z-index: 2; }
.scroll[hidden] { display: none; }
.body { padding: 10px 12px 12px; display: grid; gap: 8px; }
.panel.collapsed { width: auto !important; height: auto !important; }
.panel.collapsed .grip, .panel.collapsed .edge { display: none; }
.panel.collapsed .scroll, .panel.collapsed .picker, .panel.collapsed .tabs { display: none; }
:host {
  --tl: #1d7a55; --soft: rgb(47 91 211 / 0.07); --card: rgb(127 127 127 / 0.05);
  --warn-bg: #fff6e5; --warn-edge: #e3a008; --warn-fg: #8a5300;
}
@media (prefers-color-scheme: dark) {
  :host { --tl: #6fd6a6; --soft: rgb(143 176 255 / 0.1); --card: rgb(255 255 255 / 0.04);
    --warn-bg: rgb(227 160 8 / 0.12); --warn-edge: #e3a008; --warn-fg: #f2c25c; }
}
.tb { gap: 10px; }
.tb p { margin: 0; }
.tb i { color: var(--tl); font-weight: 500; }
.tb .intro {
  font-size: 13.5px; padding: 8px 10px; border-radius: 8px;
  background: var(--soft); border-left: 3px solid var(--accent);
}
.tb .sec {
  display: grid; gap: 6px; padding: 9px 10px 10px; border-radius: 8px;
  background: var(--card); border: 1px solid var(--border);
}
.tb h4 { margin: 0; font-size: 14px; font-weight: 600; display: flex; gap: 8px; align-items: baseline; }
.tb .num {
  flex: none; min-width: 18px; height: 18px; border-radius: 9px; display: inline-grid; place-items: center;
  font-size: 11px; font-weight: 700; background: var(--accent); color: var(--on-accent);
}
.tb h4 > span:nth-child(2) { flex: 1; }
.tb .kind {
  flex: none; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
  padding: 1px 6px; border-radius: 4px; color: var(--muted); border: 1px solid var(--border);
}
.tb .kind.words, .tb .kind.phrases { color: var(--tl); }
.tb table {
  display: block; width: fit-content; max-width: 100%; overflow-x: auto; border-collapse: collapse; font-size: 12.5px;
  border-radius: 6px; border: 1px solid var(--border);
}
.tb th, .tb td { text-align: start; padding: 4px 10px; vertical-align: top; }
.tb th { font-weight: 600; color: var(--accent); background: var(--soft); border-bottom: 1px solid var(--border); }
.tb tr:nth-child(odd) td { background: var(--card); }
.tb .examples { display: grid; gap: 5px; padding: 2px 0 2px 10px; border-left: 3px solid var(--tl); }
.tb .examples .fr { color: var(--tl); }
.tb .watch {
  font-size: 13px; padding: 7px 9px; border-radius: 6px; display: grid; gap: 3px;
  background: var(--warn-bg); border-left: 3px solid var(--warn-edge);
}
.tb .watch b { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--warn-fg); }
.tb .words { display: grid; grid-template-columns: fit-content(60%) minmax(0, 1fr); gap: 3px 12px; margin: 0; }
/* Block, not flex: in a flex row each text run and <ruby> is its own item, and the row can't wrap mixed scripts. */
.tb dt { font-weight: 500; color: var(--tl); min-width: 0; overflow-wrap: anywhere; }
.say-word { display: inline-grid; vertical-align: middle; margin-inline-end: 2px; width: 22px; height: 22px; font-size: 12px; }
.tb dd { margin: 0; color: var(--muted); min-width: 0; overflow-wrap: anywhere; }
.wl { list-style: none; margin: 0; padding: 0; }
.wl li { display: flex; gap: 6px; padding: 7px 0; border-bottom: 1px solid var(--border); }
.wl li:last-child { border-bottom: 0; }
.wl .body { flex: 1; min-width: 0; }
.wl .head { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 4px; }
.wl .word { font-weight: 600; }
.wl .say { display: inline-grid; vertical-align: middle; width: 22px; height: 22px; font-size: 12px; margin-inline-start: 2px; }
.wl p { margin: 2px 0 0; overflow-wrap: anywhere; }
.wl .definition, .wl .english { color: var(--muted); font-size: 12.5px; }
.wl .example { margin-top: 4px; }
.wl .actions { display: flex; gap: 2px; align-items: flex-start; }
.wl .toggle[aria-pressed="true"] { background: var(--accent); color: var(--on-accent); }
.panel.collapsed .bar { border-bottom: 0; }
.listen {
  justify-self: start; width: auto; height: auto; padding: 3px 10px 3px 8px; gap: 6px; display: inline-flex; align-items: center;
  border: 1px solid var(--border); border-radius: 999px; font-size: 12.5px; font-weight: 500; color: var(--accent);
}
.listen[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
.line.speakable { grid-template-columns: auto 1fr; column-gap: 6px; }
.line.speakable > .say { grid-row: span 2; width: 22px; height: 22px; font-size: 10px; color: var(--accent); }
.line.playing .fr { color: var(--accent); }
.line.playing > .say { background: var(--accent); color: var(--on-accent); }
:host { --ok: #1d7a55; --ok-bg: rgb(29 122 85 / 0.12); --bad: #b3261e; --bad-bg: rgb(179 38 30 / 0.1); }
@media (prefers-color-scheme: dark) {
  :host { --ok: #6fd6a6; --ok-bg: rgb(111 214 166 / 0.14); --bad: #ff8a80; --bad-bg: rgb(255 138 128 / 0.12); }
}
.head { display: grid; gap: 2px; }
.chip {
  justify-self: start; font-size: 10.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--accent); background: var(--soft); border-radius: 999px; padding: 1px 8px;
}
.chip.pick { font-family: inherit; border: 0; cursor: pointer; padding-right: 4px; }
.head .fr { font-size: 15px; font-weight: 650; }
.mark { color: var(--accent); font-weight: 650; }
.quiz { display: grid; gap: 4px; padding: 6px 8px; border-radius: 8px; background: var(--card); border: 1px solid var(--border); }
.quiz .row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.pill {
  width: auto; height: auto; padding: 3px 10px; border: 1px solid var(--border); border-radius: 999px;
  font-size: 12.5px; font-weight: 500; color: var(--fg);
}
.pill.right, .pill.done { background: var(--ok-bg); border-color: var(--ok); color: var(--ok); }
.pill.wrong { background: var(--bad-bg); border-color: var(--bad); color: var(--bad); }
.pill.picked { border-color: var(--accent); color: var(--accent); background: var(--soft); }
.pill[disabled] { cursor: default; }
.verdict { font-size: 12.5px; font-weight: 600; }
.verdict.right { color: var(--ok); }
.verdict.wrong { color: var(--bad); }
.fix { font-size: 13px; }
.gap-input {
  font: inherit; font-weight: 500; width: 9em; padding: 0 4px; color: var(--fg); background: var(--bg);
  border: 0; border-bottom: 2px solid var(--accent); border-radius: 0;
}
.gap-input.wrong { border-bottom-color: var(--bad); }
.filled { font-weight: 650; padding: 0 2px; border-radius: 3px; }
.filled.right { color: var(--ok); background: var(--ok-bg); }
.filled.shown { color: var(--accent); background: var(--soft); }
.match { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.match .col { display: grid; gap: 6px; align-content: start; }
.match .pill { border-radius: 8px; padding: 4px 8px; text-align: start; }
.match .word { display: flex; align-items: center; gap: 2px; }
.match .word .pill { flex: 1; }
.hint { color: var(--muted); font-size: 12px; margin: 0; }
.again {
  justify-self: start; width: auto; height: auto; padding: 4px 10px; margin-top: 2px;
  border: 1px solid var(--border); border-radius: 999px; font-size: 12.5px; font-weight: 500; color: var(--accent);
}
${PRACTICE_STYLES}
${scriptStyles(true)}
`;

export function el<K extends keyof HTMLElementTagNameMap>(doc: Document, tag: K, className: string, text?: string) {
  const node = doc.createElement(tag);
  node.className = className;
  // Target-language text may carry readings (日本語《にほんご》), shown as ruby, and Japanese gets romaji.
  if (text && /[《\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(text)) node.append(...rubyNodes(doc, text));
  else if (text !== undefined) node.textContent = text;
  // Right to left for a script that is (Hebrew), so the line aligns right and its punctuation stays at its end.
  if (text) setDirection(node, text);
  return node;
}

/** Where it was last dragged to on this page (null = back to the corner), ahead of the position it was shown with. */
const placed = new WeakMap<Document, WidgetPosition | null>();

/** How much of the panel stays in the window, so its title bar can still be grabbed. */
const KEEP_VISIBLE = 40;

/**
 * Puts the panel at `pos`; none = the corner, as is a minimised panel (its
 * position is kept for when it opens out). It can go mostly off the left,
 * right or bottom edge, but its title bar stays in the window.
 */
function place(panel: HTMLElement, pos: WidgetPosition | null | undefined) {
  if (!pos || panel.classList.contains('collapsed')) {
    Object.assign(panel.style, { left: '', top: '', right: '', bottom: '' });
    return;
  }
  const win = panel.ownerDocument.defaultView;
  const { width, height } = panel.getBoundingClientRect();
  const innerWidth = win?.innerWidth ?? 0;
  const innerHeight = win?.innerHeight ?? 0;
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));
  const x = `${clamp(pos.x, KEEP_VISIBLE - width, innerWidth - KEEP_VISIBLE)}px`;
  // The bar is at the top: the top edge stays on screen, the bottom can go off it.
  const y = `${pos.fromBottom
    ? clamp(pos.y, KEEP_VISIBLE - height, innerHeight - height)
    : clamp(pos.y, 0, innerHeight - KEEP_VISIBLE)}px`;
  Object.assign(panel.style, {
    left: pos.fromRight ? 'auto' : x,
    right: pos.fromRight ? x : 'auto',
    top: pos.fromBottom ? 'auto' : y,
    bottom: pos.fromBottom ? y : 'auto',
  });
}

/** A panel at `left`, `top`, measured from the sides it's nearer. */
function positionAt(win: Window, left: number, top: number, width: number, height: number): WidgetPosition {
  const fromRight = left + width / 2 > win.innerWidth / 2;
  const fromBottom = top + height / 2 > win.innerHeight / 2;
  return {
    x: Math.round(fromRight ? win.innerWidth - left - width : left),
    y: Math.round(fromBottom ? win.innerHeight - top - height : top),
    fromRight,
    fromBottom,
  };
}

/** Drag the title bar (not its buttons) to move the panel; double-click it to send it back to the corner. */
function makeDraggable(doc: Document, panel: HTMLElement, bar: HTMLElement, onMove?: (position: WidgetPosition | null) => void) {
  const win = doc.defaultView;
  // Minimised, it stays in the corner.
  bar.addEventListener('dblclick', (e) => {
    if (panel.classList.contains('collapsed') || (e.target as Element).closest('button, select')) return;
    placed.set(doc, null);
    place(panel, null);
    onMove?.(null);
  });
  bar.addEventListener('pointerdown', (e) => {
    if (!win || e.button !== 0 || panel.classList.contains('collapsed') || (e.target as Element).closest('button, select')) return;
    const start = panel.getBoundingClientRect();
    const dx = e.clientX - start.left;
    const dy = e.clientY - start.top;
    let moved = false;
    bar.setPointerCapture(e.pointerId);
    panel.classList.add('dragging');
    const move = (m: PointerEvent) => {
      const { width, height } = panel.getBoundingClientRect();
      const pos = positionAt(win, m.clientX - dx, m.clientY - dy, width, height);
      placed.set(doc, pos);
      place(panel, pos);
      moved = true;
    };
    const end = () => {
      panel.classList.remove('dragging');
      bar.removeEventListener('pointermove', move);
      bar.removeEventListener('pointerup', end);
      bar.removeEventListener('pointercancel', end);
      if (moved) onMove?.(placed.get(doc) ?? null);
    };
    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', end);
    bar.addEventListener('pointercancel', end);
    e.preventDefault();
  });
}

/** The smallest the grip makes it, and how far it keeps from the window's edges. */
const MIN_SIZE = { width: 240, height: 160 };
const EDGE = 16;

/** Sets the panel to `size`, fitted to the window; none = the default size from the stylesheet. */
function sizeTo(panel: HTMLElement, size: WidgetSize | null | undefined) {
  if (!size) {
    Object.assign(panel.style, { width: '', height: '', maxHeight: '' });
    return;
  }
  const win = panel.ownerDocument.defaultView;
  const fit = (n: number, min: number, room: number | undefined) => Math.max(min, Math.min(n, (room ?? n + EDGE) - EDGE));
  Object.assign(panel.style, {
    width: `${fit(size.width, MIN_SIZE.width, win?.innerWidth)}px`,
    height: `${fit(size.height, MIN_SIZE.height, win?.innerHeight)}px`,
    maxHeight: 'none',
  });
}

/** Where it was last resized to on this page (null = back to the default), ahead of the size it was shown with. */
const sized = new WeakMap<Document, WidgetSize | null>();

/** Which edges a handle moves: the corner grip is `se`. */
type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

/**
 * Drag a handle to resize the panel from that edge or corner, the opposite
 * side staying put (so the position is saved too); double-click it for the default size.
 */
function makeResizable(
  doc: Document,
  panel: HTMLElement,
  grip: HTMLElement,
  edge: ResizeEdge,
  onResize?: (size: WidgetSize | null) => void,
  onMove?: (position: WidgetPosition | null) => void,
) {
  const win = doc.defaultView;
  grip.addEventListener('dblclick', () => {
    sized.set(doc, null);
    sizeTo(panel, null);
    onResize?.(null);
  });
  grip.addEventListener('pointerdown', (e) => {
    if (!win || e.button !== 0) return;
    const start = panel.getBoundingClientRect();
    let moved = false;
    grip.setPointerCapture(e.pointerId);
    const move = (m: PointerEvent) => {
      const dx = m.clientX - e.clientX;
      const dy = m.clientY - e.clientY;
      const w = edge.includes('e') ? start.width + dx : edge.includes('w') ? start.width - dx : start.width;
      const h = edge.includes('s') ? start.height + dy : edge.includes('n') ? start.height - dy : start.height;
      const size = { width: Math.round(w), height: Math.round(h) };
      sized.set(doc, size);
      sizeTo(panel, size);
      const { width, height } = panel.getBoundingClientRect();
      // Dragging the left or top edge keeps the right or bottom one where it was.
      const left = edge.includes('w') ? start.right - width : start.left;
      const top = edge.includes('n') ? Math.max(0, start.bottom - height) : start.top;
      const pos = positionAt(win, left, top, width, height);
      placed.set(doc, pos);
      place(panel, pos);
      moved = true;
    };
    const end = () => {
      grip.removeEventListener('pointermove', move);
      grip.removeEventListener('pointerup', end);
      grip.removeEventListener('pointercancel', end);
      if (!moved) return;
      onResize?.(sized.get(doc) ?? null);
      onMove?.(placed.get(doc) ?? null);
    };
    grip.addEventListener('pointermove', move);
    grip.addEventListener('pointerup', end);
    grip.addEventListener('pointercancel', end);
    e.preventDefault();
    e.stopPropagation();
  });
}

/** Each `ScriptView` as the language's sample word shows it. */
function scriptLabel(view: ScriptView, { script, roman }: { script: string; roman: string }): string {
  return { above: `${roman} over ${script}`, below: `${script} over ${roman}`, script: `${script} only`, roman: `${roman} only` }[view];
}

/** The title bar's switch between the script and its romanisation; the page shows the choice (`SCRIPT_ATTR`), so nothing is drawn again. */
function scriptSwitch(doc: Document, script: NonNullable<WidgetOptions['script']>) {
  const select = el(doc, 'select', 'script');
  select.setAttribute('aria-label', 'Script and romanisation');
  select.title = 'Script and romanisation';
  for (const view of SCRIPT_VIEWS) select.append(new Option(scriptLabel(view, script.sample), view, false, view === script.view));
  select.addEventListener('change', () => script.onChange(select.value as ScriptView));
  return select;
}

/** Shows the widget, replacing any that's already on the page. */
export function showWidget(doc: Document, options: WidgetOptions): Widget {
  removeWidget(doc);
  const host = doc.createElement('div');
  host.setAttribute(WIDGET_ATTR, '');
  const root = host.attachShadow({ mode: 'open' });

  const style = doc.createElement('style');
  style.textContent = STYLES;

  const panel = el(doc, 'section', 'panel');
  panel.setAttribute('aria-label', `Language Weave: ${withoutReadings(options.title)}`);

  const bar = el(doc, 'div', 'bar');
  const title = el(doc, 'span', 'title', options.title);
  const collapse = el(doc, 'button', 'collapse', '–');
  collapse.setAttribute('aria-expanded', 'true');
  collapse.setAttribute('aria-label', 'Minimise');
  const close = el(doc, 'button', 'close', '×');
  close.setAttribute('aria-label', 'Close');
  let scale = options.textScale ?? 1;
  const smaller = el(doc, 'button', 'size smaller', 'A−');
  smaller.setAttribute('aria-label', 'Smaller text');
  const bigger = el(doc, 'button', 'size bigger', 'A+');
  bigger.setAttribute('aria-label', 'Bigger text');
  const setScale = (next: number) => {
    scale = next;
    panel.style.setProperty('--scale', String(scale));
    smaller.toggleAttribute('disabled', scale <= TEXT_SCALES[0]!);
    bigger.toggleAttribute('disabled', scale >= TEXT_SCALES[TEXT_SCALES.length - 1]!);
  };
  for (const [button, step] of [[smaller, -1], [bigger, 1]] as const) {
    button.addEventListener('click', () => {
      setScale(stepTextScale(scale, step));
      options.onTextScale?.(scale);
    });
  }
  setScale(scale);
  bar.append(title, ...(options.script ? [scriptSwitch(doc, options.script)] : []), smaller, bigger, collapse, close);

  const picker = el(doc, 'div', 'picker');
  const select = el(doc, 'select', 'format');
  select.setAttribute('aria-label', 'Reading format');
  for (const f of options.formats ?? []) select.append(new Option(f.label, f.id, false, f.id === options.selected));
  select.addEventListener('change', () => options.onSelect?.(select.value));
  picker.append(select);

  // One scrolling pane per tab, so each keeps its place.
  const tabs = options.tabs?.length ? options.tabs : [{ id: '', label: '' }];
  const shownFirst = Math.max(0, tabs.findIndex((t) => t.id === options.tab));
  const panes = new Map<string, { scroll: HTMLElement; body: HTMLElement; tab: HTMLElement }>();
  const tabBar = el(doc, 'div', 'tabs');
  tabBar.setAttribute('role', 'tablist');
  for (const [i, t] of tabs.entries()) {
    const body = el(doc, 'div', 'body');
    const scroll = el(doc, 'div', 'scroll');
    scroll.append(body);
    scroll.hidden = i !== shownFirst;
    const tab = el(doc, 'button', 'tab', t.label);
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', String(i === shownFirst));
    tab.addEventListener('click', () => {
      for (const [id, p] of panes) {
        p.scroll.hidden = id !== t.id;
        p.tab.setAttribute('aria-selected', String(id === t.id));
      }
      options.onTab?.(t.id);
    });
    tabBar.append(tab);
    panes.set(t.id, { scroll, body, tab });
  }
  const first = panes.get(tabs[0]!.id)!;

  let keepInView: (() => void) | undefined;
  const setCollapsed = (collapsed: boolean) => {
    panel.classList.toggle('collapsed', collapsed);
    collapse.textContent = collapsed ? '+' : '–';
    collapse.setAttribute('aria-expanded', String(!collapsed));
    collapse.setAttribute('aria-label', collapsed ? 'Expand' : 'Minimise');
    keepInView?.();
  };
  if (options.collapsed) setCollapsed(true);
  collapse.addEventListener('click', () => {
    setCollapsed(!panel.classList.contains('collapsed'));
    options.onCollapse?.(panel.classList.contains('collapsed'));
  });
  close.addEventListener('click', () => {
    host.remove();
    options.onClose?.();
  });

  panel.append(
    bar,
    ...(options.tabs?.length ? [tabBar] : []),
    ...(options.formats?.length ? [picker] : []),
    ...[...panes.values()].map((p) => p.scroll),
  );
  const grip = el(doc, 'div', 'grip');
  grip.setAttribute('aria-hidden', 'true');
  grip.title = 'Drag to resize; double-click for the default size';
  panel.append(grip);
  const edges = (['n', 's', 'e', 'w', 'ne', 'nw', 'sw'] as const).map((edge) => {
    const handle = el(doc, 'div', `edge ${edge}`);
    handle.setAttribute('aria-hidden', 'true');
    panel.append(handle);
    return [handle, edge] as const;
  });
  root.append(style, panel);
  // Outside <body>, so nothing that walks the page's content finds it.
  doc.documentElement.append(host);

  makeDraggable(doc, panel, bar, options.onMove);
  makeResizable(doc, panel, grip, 'se', options.onResize, options.onMove);
  for (const [handle, edge] of edges) makeResizable(doc, panel, handle, edge, options.onResize, options.onMove);
  // Once moved, its title bar stays in the window as its content grows or the window shrinks.
  keepInView = () => {
    sizeTo(panel, sized.has(doc) ? sized.get(doc) : options.size);
    place(panel, placed.has(doc) ? placed.get(doc) : options.position);
  };
  keepInView();
  const win = doc.defaultView;
  if (win?.ResizeObserver) new win.ResizeObserver(keepInView).observe(panel);
  const onResize = () => (host.isConnected ? keepInView() : win?.removeEventListener('resize', onResize));
  win?.addEventListener('resize', onResize);

  return {
    host,
    show: (content) => fillLines(first.body, content),
    setTitle(text) {
      title.textContent = text;
      panel.setAttribute('aria-label', `Language Weave: ${text}`);
    },
    pane: (id) => (panes.get(id) ?? first).body,
  };
}

/** Replaces `target`'s children with reading lines and a note; with `speak`, each line can be read aloud. */
export function fillLines(target: HTMLElement, { lines = [], note }: WidgetContent, speak?: SpeakControls) {
  const doc = target.ownerDocument;
  const listen: Node[] = [];
  const onAll = speak?.onAll;
  const onLine = speak?.onLine;
  if (speak && onAll && lines.length) {
    const on = speak.all && speak.playing >= 0;
    const button = el(doc, 'button', 'listen', on ? '■ Stop' : '▶ Listen');
    button.setAttribute('aria-pressed', String(on));
    button.addEventListener('click', () => onAll());
    listen.push(button);
  }
  target.replaceChildren(
    ...listen,
    ...lines.map((line, i) => {
      const row = el(doc, 'div', 'line');
      if (speak && onLine) {
        const playing = speak.playing === i;
        row.classList.add('speakable');
        row.classList.toggle('playing', playing);
        const say = el(doc, 'button', 'say', playing ? '■' : '▶');
        say.setAttribute('aria-label', playing ? 'Stop' : `Listen: ${withoutReadings(line.fr)}`);
        say.addEventListener('click', () => onLine(i));
        row.append(say);
      }
      row.append(el(doc, 'span', 'fr', line.fr), el(doc, 'span', 'en', line.en));
      return row;
    }),
    ...(note ? [el(doc, 'p', 'note', note)] : []),
  );
}

/** What the reader has answered in a piece's quizzes, kept across redraws (speech redraws the pane). */
export interface QuizState {
  /** Statement line → the reader's answer. */
  tf: Map<number, boolean>;
  /** Gap line → what's typed, and the result once checked. */
  gap: Map<number, { value: string; result?: 'right' | 'wrong' | 'shown' }>;
  /** Question line → the option picked. */
  choice: Map<number, string>;
  /** Pair indexes: the word picked, the ones matched, and a wrong meaning just tapped. */
  match: { picked?: number; done: Set<number>; miss?: number };
}

export const newQuiz = (): QuizState => ({ tf: new Map(), gap: new Map(), choice: new Map(), match: { done: new Set() } });

export interface PieceView {
  piece?: Piece;
  /** The format's name, above the title. */
  formatName?: string;
  /** Page mode, once the piece is finished: the chip becomes a menu of these, and picking one writes the section in it. */
  formats?: { id: string; name: string; current: boolean }[];
  onFormat?(id: string): void;
  /** "Writing…", an error. */
  note?: string;
  /** False while the piece streams in: quizzes wait for all of it. */
  finished: boolean;
  quiz: QuizState;
  /** Shows a "New passage" button under the piece. */
  onAgain?(): void;
}

/**
 * Lenient for typed answers: case, accents, apostrophes and spacing don't count. Only Latin
 * accents (and Hebrew and Arabic vowel points) are dropped (Japanese voicing marks are part of the letter), and an answer with
 * readings is right written either way (食《た》べる: 食べる or たべる; 学生《xuéshēng》: 学生 or xuesheng).
 */
export function sameAnswer(a: string, b: string): boolean {
  const norm = (s: string) =>
    // Accents are dropped, and Devanagari's nukta (\u091c\u093c = \u091c) and chandrabindu (\u0901 = \u0902), which many writers leave out,
    // and Hebrew's vowel points, which Israelis don't write; a geresh (ג׳) is an apostrophe, as most type it. Arabic's vowel marks
    // and tatweel go too, and the hamza over or under a letter (أ إ آ are ا once split), and ى is ي, as many type it; romanised ʿ and ʾ are optional.
    withoutReadings(s).normalize('NFKC').normalize('NFD').replace(/[\u0300-\u036f\u093c\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u064b-\u065f\u0670\u0640\u02bf\u02be]/g, '').replace(/\u0901/g, '\u0902').normalize('NFC').toLowerCase()
      .replace(/ى/g, 'ي').replace(/[’‘ʼ\u05f3]/g, "'").replace(/[^\p{L}\p{M}\p{N}']+/gu, ' ').trim();
  // Readings said aloud run together where words aren't spaced (我《wǒ》是《shì》: wǒshì), so typed pinyin's spaces don't count.
  return norm(a) === norm(b) || norm(a).replace(/ /g, '') === norm(readingsOnly(b)).replace(/ /g, '');
}

/** Text with `*marked*` spans in the accent colour. */
function marked(doc: Document, text: string): Node[] {
  return italicSpans(text).flatMap((p) => (p.italic ? [el(doc, 'b', 'mark', p.text)] : rubyNodes(doc, p.text)));
}

function frSpan(doc: Document, text: string) {
  const span = el(doc, 'span', 'fr');
  span.append(...marked(doc, text));
  return setDirection(span, text);
}

/** A speaker button that reads `word` slowly. */
function sayWord(doc: Document, word: string, onWord: (text: string) => void) {
  const b = el(doc, 'button', 'say-word', '🔊');
  b.setAttribute('aria-label', `Listen slowly: ${withoutReadings(word)}`);
  b.addEventListener('click', () => onWord(word));
  return b;
}

function pill(doc: Document, text: string, className: string, onClick?: () => void) {
  const b = el(doc, 'button', `pill ${className}`.trim(), text);
  if (onClick) b.addEventListener('click', onClick);
  else b.setAttribute('disabled', '');
  return b;
}

/**
 * Replaces `target`'s children with a piece: its format and title, its lines
 * (each read aloud with `speak`), and its quizzes, which only become
 * interactive once the piece is finished. Answers live in `view.quiz`.
 */
export function fillPiece(target: HTMLElement, view: PieceView, speak?: SpeakControls) {
  const doc = target.ownerDocument;
  const redraw = () => fillPiece(target, view, speak);
  const { piece, quiz, finished } = view;
  const out: Node[] = [];
  if (piece) {
    const head = el(doc, 'div', 'head');
    if (view.formats && view.onFormat) head.append(formatMenu(doc, view.formats, view.onFormat));
    else if (view.formatName) head.append(el(doc, 'span', 'chip', view.formatName));
    if (piece.title.fr) head.append(frSpan(doc, piece.title.fr), el(doc, 'span', 'en', piece.title.en));
    out.push(head);
    const onAll = speak?.onAll;
    if (speak && onAll && piece.lines.some((l) => l.kind === 'line')) {
      const on = speak.all && speak.playing >= 0;
      const button = el(doc, 'button', 'listen', on ? '■ Stop' : '▶ Listen');
      button.setAttribute('aria-pressed', String(on));
      button.addEventListener('click', () => onAll());
      out.push(button);
    }
    const pairs = piece.lines.flatMap((l, i) => (l.kind === 'pair' ? [{ line: l, i }] : []));
    piece.lines.forEach((line, i) => {
      if (line.kind === 'pair') {
        if (finished && i === pairs[0]!.i) out.push(matchGame(doc, pairs.map((p) => p.line), piece.shuffle, quiz, redraw, speak?.onWord, speak?.canWord));
        return;
      }
      out.push(pieceLine(doc, line, i, view, redraw, speak));
    });
  }
  if (view.note) out.push(el(doc, 'p', 'note', view.note));
  if (view.onAgain) {
    const again = el(doc, 'button', 'again', '↻ New passage');
    again.addEventListener('click', () => view.onAgain?.());
    out.push(again);
  }
  target.replaceChildren(...out);
}

/** The format chip as a menu: the piece's format, and the others to write it in instead. */
function formatMenu(doc: Document, formats: NonNullable<PieceView['formats']>, onFormat: (id: string) => void) {
  const select = el(doc, 'select', 'chip pick');
  select.setAttribute('aria-label', 'Format');
  for (const f of formats) {
    const option = el(doc, 'option', '', f.name);
    option.value = f.id;
    option.selected = f.current;
    select.append(option);
  }
  select.addEventListener('change', () => onFormat(select.value));
  return select;
}

function pieceLine(doc: Document, line: Exclude<PieceLine, { kind: 'pair' }>, i: number, view: PieceView, redraw: () => void, speak?: SpeakControls): Node {
  const { quiz, finished } = view;
  if (line.kind === 'line') {
    const row = el(doc, 'div', 'line');
    const onLine = speak?.onLine;
    if (speak && onLine && (speak.canLine?.(i) ?? true)) {
      const playing = speak.playing === i;
      row.classList.add('speakable');
      row.classList.toggle('playing', playing);
      const say = el(doc, 'button', 'say', playing ? '■' : '▶');
      say.setAttribute('aria-label', playing ? 'Stop' : `Listen: ${withoutReadings(line.fr.replace(/\*/g, ''))}`);
      say.addEventListener('click', () => onLine(i));
      row.append(say);
    }
    row.append(frSpan(doc, line.fr), el(doc, 'span', 'en', line.en));
    return row;
  }

  const box = el(doc, 'div', 'quiz');
  if (line.kind === 'gap') {
    const [before = '', after = ''] = line.fr.split('____');
    const state = quiz.gap.get(i) ?? { value: '' };
    const sentence = setDirection(el(doc, 'span', 'fr'), line.fr);
    sentence.append(...marked(doc, before));
    if (state.result === 'right' || state.result === 'shown') {
      sentence.append(el(doc, 'span', `filled ${state.result}`, line.answer));
    } else if (finished) {
      const input = setDirection(el(doc, 'input', `gap-input${state.result === 'wrong' ? ' wrong' : ''}`), line.answer);
      input.value = state.value;
      input.setAttribute('aria-label', 'Missing word');
      input.addEventListener('input', () => quiz.gap.set(i, { value: input.value }));
      const check = () => {
        quiz.gap.set(i, { value: input.value, result: sameAnswer(input.value, line.answer) ? 'right' : 'wrong' });
        redraw();
      };
      input.addEventListener('keydown', (e) => e.key === 'Enter' && check());
      sentence.append(input);
    } else {
      sentence.append(doc.createTextNode('____'));
    }
    sentence.append(...marked(doc, after));
    box.append(sentence, el(doc, 'span', 'en', line.en));
    if (finished && state.result !== 'right' && state.result !== 'shown') {
      const row = el(doc, 'div', 'row');
      row.append(
        pill(doc, 'Check', '', () => {
          const value = quiz.gap.get(i)?.value ?? '';
          quiz.gap.set(i, { value, result: sameAnswer(value, line.answer) ? 'right' : 'wrong' });
          redraw();
        }),
      );
      if (state.result === 'wrong') {
        row.append(el(doc, 'span', 'verdict wrong', 'Not quite'), pill(doc, 'Show answer', '', () => {
          quiz.gap.set(i, { value: state.value, result: 'shown' });
          redraw();
        }));
      }
      box.append(row);
    }
    return box;
  }

  box.append(frSpan(doc, line.fr), el(doc, 'span', 'en', line.en));
  if (!finished) return box;
  const row = el(doc, 'div', 'row');
  if (line.kind === 'tf') {
    const chosen = quiz.tf.get(i);
    const answer = (value: boolean) => () => {
      quiz.tf.set(i, value);
      redraw();
    };
    if (chosen === undefined) {
      row.append(pill(doc, 'True', '', answer(true)), pill(doc, 'False', '', answer(false)));
    } else {
      const right = chosen === line.answer;
      row.append(
        pill(doc, chosen ? 'True' : 'False', right ? 'right' : 'wrong'),
        el(doc, 'span', `verdict ${right ? 'right' : 'wrong'}`, right ? '✓ Right' : `✗ It's ${line.answer ? 'true' : 'false'}`),
      );
    }
    box.append(row);
    if (chosen !== undefined && line.fix) {
      const fix = el(doc, 'div', 'line fix');
      fix.append(frSpan(doc, line.fix.fr), el(doc, 'span', 'en', line.fix.en));
      box.append(fix);
    }
    return box;
  }
  // A question with options.
  const chosen = quiz.choice.get(i);
  for (const option of line.options) {
    const state = chosen === undefined ? '' : option === line.answer ? 'right' : option === chosen ? 'wrong' : '';
    row.append(
      pill(
        doc,
        option,
        state,
        chosen === undefined
          ? () => {
              quiz.choice.set(i, option);
              redraw();
            }
          : undefined,
      ),
    );
  }
  box.append(row);
  return box;
}

/** Words on the left, their meanings shuffled on the right: tap a word, then its meaning. With `onWord`, each word it `canWord` read can be heard. */
function matchGame(
  doc: Document,
  pairs: Array<{ fr: string; en: string }>,
  shuffle: number[] | undefined,
  quiz: QuizState,
  redraw: () => void,
  onWord?: (text: string) => void,
  canWord?: (text: string) => boolean,
): Node {
  const m = quiz.match;
  const order = shuffle && shuffle.length === pairs.length ? shuffle : pairs.map((_, k) => k);
  const box = el(doc, 'div', 'quiz');
  const all = m.done.size === pairs.length;
  box.append(el(doc, 'p', 'hint', all ? '✓ All matched' : 'Tap a word, then its meaning.'));
  const grid = el(doc, 'div', 'match');
  const left = el(doc, 'div', 'col');
  const right = el(doc, 'div', 'col');
  pairs.forEach((p, k) => {
    const done = m.done.has(k);
    const word = p.fr.replace(/\*/g, '');
    const b = pill(doc, word, done ? 'done' : m.picked === k ? 'picked' : '', done ? undefined : () => {
      m.picked = k;
      m.miss = undefined;
      redraw();
    });
    if (onWord && (canWord?.(word) ?? true)) {
      const row = el(doc, 'div', 'word');
      row.append(sayWord(doc, word, onWord), b);
      left.append(row);
    } else {
      left.append(b);
    }
  });
  for (const k of order) {
    const done = m.done.has(k);
    const b = pill(doc, pairs[k]!.en, done ? 'done' : m.miss === k ? 'wrong' : '', done ? undefined : () => {
      if (m.picked === undefined) return;
      if (m.picked === k) {
        m.done.add(k);
        m.picked = undefined;
        m.miss = undefined;
      } else {
        m.miss = k;
      }
      redraw();
    });
    right.append(b);
  }
  grid.append(left, right);
  box.append(grid);
  return box;
}

/** Text with its `*target-language*` spans in italics. */
function withItalics(doc: Document, text: string): Node[] {
  return italicSpans(text).flatMap((p) => (p.italic ? [el(doc, 'i', '', p.text)] : rubyNodes(doc, p.text)));
}

function para(doc: Document, className: string, text: string) {
  const p = el(doc, 'p', className);
  p.append(...withItalics(doc, text));
  return setDirection(p, text);
}

const KIND_LABELS: Record<SectionKind, string> = { grammar: 'Grammar', words: 'Words', phrases: 'Phrases' };

/**
 * Replaces `target`'s children with the lesson's textbook page: each section
 * on its own card, in teaching order, tagged with what it teaches. With
 * `onWord`, each word it `canWord` read can be heard.
 */
export function fillTextbook(target: HTMLElement, tb: Textbook, onWord?: (text: string) => void, canWord?: (text: string) => boolean) {
  const doc = target.ownerDocument;
  target.classList.add('tb');
  const out: Node[] = [];
  if (tb.intro) out.push(para(doc, 'intro', tb.intro));
  for (const [i, s] of tb.sections.entries()) {
    const sec = el(doc, 'div', 'sec');
    const heading = el(doc, 'h4', '');
    const text = el(doc, 'span', '');
    text.append(...withItalics(doc, s.heading));
    heading.append(el(doc, 'span', 'num', String(i + 1)), text, el(doc, 'span', `kind ${s.kind}`, KIND_LABELS[s.kind]));
    sec.append(heading, ...s.explanation.map((t) => para(doc, '', t)));
    if (s.table.columns.length) {
      const table = el(doc, 'table', '');
      const head = el(doc, 'tr', '');
      head.append(...s.table.columns.map((c) => el(doc, 'th', '', c)));
      table.append(head, ...s.table.rows.map((r) => {
        const row = el(doc, 'tr', '');
        row.append(...r.map((c) => el(doc, 'td', '', c)));
        return row;
      }));
      sec.append(table);
    }
    if (s.words.length) {
      const words = el(doc, 'dl', 'words');
      for (const w of s.words) {
        const dt = setDirection(el(doc, 'dt', ''), w.word);
        if (onWord && (canWord?.(w.word) ?? true)) dt.append(sayWord(doc, w.word, onWord));
        dt.append(...rubyNodes(doc, w.word));
        words.append(dt, el(doc, 'dd', '', w.english));
      }
      sec.append(words);
    }
    if (s.examples.length) {
      const examples = el(doc, 'div', 'examples');
      fillLines(examples, { lines: s.examples.map((e) => ({ fr: e.target, en: e.english })) });
      sec.append(examples);
    }
    if (s.watchOut.length) {
      const watch = el(doc, 'div', 'watch');
      watch.append(el(doc, 'b', '', 'Watch out'), ...s.watchOut.map((t) => para(doc, '', t)));
      sec.append(watch);
    }
    out.push(sec);
  }
  target.replaceChildren(...out);
}

export function removeWidget(doc: Document) {
  for (const host of doc.querySelectorAll(`[${WIDGET_ATTR}]`)) host.remove();
}
