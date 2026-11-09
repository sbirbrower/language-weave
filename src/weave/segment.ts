/** A slice of one text node that belongs to a segment. Offsets are in the node. */
export interface Piece {
  node: Text;
  start: number;
  end: number;
}

export interface Segment {
  /** Concatenated text of all pieces; replacement offsets refer to this. */
  text: string;
  pieces: Piece[];
  block: Element;
  /**
   * Live range over the segment. Writing another segment of the same block
   * splits shared text nodes and stales `pieces`; the browser keeps this
   * range current, so pieces can be rebuilt from it.
   */
  range: Range;
}

export const MIN_SEGMENT = 20;
export const MAX_SEGMENT = 400;

/** Marks woven spans and blocks so a second pass leaves them alone. */
export const WOVEN_CLASS = 'tissage';
export const BLOCK_ATTR = 'data-tissage';
/** Lesson mode's glosses (`src/marks/`): the target language after a marked English span, never page text. */
export const GLOSS_CLASS = `${WOVEN_CLASS}-gloss`;

const SKIP_CONTENT = [
  'script', 'style', 'noscript', 'template', 'code', 'pre', 'kbd', 'samp', 'var',
  'textarea', 'input', 'select', 'option', 'button', 'svg', 'math', 'iframe', 'canvas',
  // Page chrome, citation markers and titles of works.
  'nav', 'header', 'footer', 'aside', 'sup', 'cite',
  '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]', '[role="complementary"]',
  '[hidden]', '[aria-hidden="true"]', '[inert]',
  '[contenteditable=""]', '[contenteditable="true"]', '[contenteditable="plaintext-only"]',
  `.${WOVEN_CLASS}`, `.${GLOSS_CLASS}`,
].join(',');

/** Also skips blocks that an earlier pass already took. */
const SKIP_SELECTOR = `${SKIP_CONTENT},[${BLOCK_ATTR}]`;

const BLOCK_SELECTOR = [
  'p', 'li', 'dd', 'dt', 'blockquote', 'figcaption', 'caption', 'td', 'th', 'summary',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
].join(',');

/** Blocks where more than this share of the text is links are menus, TOCs or reference lists. */
const MAX_LINK_DENSITY = 0.5;

const SENTENCE_END = /[.!?…]+["'”’)\]]*\s+/g;

/**
 * Picks where to cut `text` into chunks of at most `max` characters. Cuts go
 * at sentence ends first (so the model sees whole sentences), then at text
 * node boundaries, then at whitespace. Chunks shorter than `min` non-space
 * characters are dropped. Returns [start, end) pairs.
 */
export function chunkText(
  text: string,
  nodeBreaks: number[],
  { min = MIN_SEGMENT, max = MAX_SEGMENT } = {},
): Array<[number, number]> {
  const sentenceBreaks = [...text.matchAll(SENTENCE_END)].map((m) => m.index + m[0].length);
  const chunks: Array<[number, number]> = [];

  let pos = 0;
  while (pos < text.length) {
    let end = text.length;
    if (text.length - pos > max) {
      const limit = pos + max;
      const inWindow = (b: number) => b > pos + min && b <= limit;
      end =
        lastMatching(sentenceBreaks, inWindow) ??
        lastMatching(nodeBreaks, inWindow) ??
        lastWhitespace(text, pos + 1, limit) ??
        limit;
    }
    chunks.push([pos, end]);
    pos = end;
  }
  return chunks.filter(([s, e]) => text.slice(s, e).replace(/\s/g, '').length >= min);
}

function lastMatching(xs: number[], pred: (x: number) => boolean): number | undefined {
  for (let i = xs.length - 1; i >= 0; i--) if (pred(xs[i]!)) return xs[i];
  return undefined;
}

function lastWhitespace(text: string, from: number, to: number): number | undefined {
  for (let i = to; i > from; i--) if (/\s/.test(text[i - 1]!)) return i;
  return undefined;
}

function isSkipped(node: Text, selector = SKIP_SELECTOR): boolean {
  const parent = node.parentElement;
  return !parent || parent.closest(selector) !== null;
}

function isVisible(el: Element): boolean {
  // jsdom has no checkVisibility; treat everything as visible there.
  return typeof el.checkVisibility !== 'function' || el.checkVisibility({ visibilityProperty: true });
}

/** Read loosely, a block of fewer words than this is a label, a count or a name, not prose. */
const LOOSE_MIN_WORDS = 6;

const NOT_BLOCKS = new Set(['inline', 'contents', 'none']);

const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;

/** The nearest element below `root` laid out as a block (or flex, grid, a cell): where a page built from spans keeps a paragraph. */
function displayBlock(el: Element, root: Element, displays: Map<Element, boolean>): Element | null {
  const win = el.ownerDocument.defaultView;
  for (let e: Element | null = el; e && e !== root; e = e.parentElement) {
    let isBlock = displays.get(e);
    if (isBlock === undefined) {
      isBlock = !NOT_BLOCKS.has(win?.getComputedStyle(e).display ?? 'inline');
      displays.set(e, isBlock);
    }
    if (isBlock) return e;
  }
  return null;
}

/**
 * Groups visible text nodes by their nearest block element, in document order.
 * `loose` also takes text outside paragraph tags, by its nearest element laid
 * out as a block, for pages built from spans and custom elements.
 */
function textByBlock(root: Element, loose: boolean): Map<Element, Text[]> {
  const doc = root.ownerDocument;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const blocks = new Map<Element, Text[]>();
  const looseBlocks = new Set<Element>();
  const displays = new Map<Element, boolean>();

  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const node = n as Text;
    if (isSkipped(node)) continue;
    let block = node.parentElement!.closest(BLOCK_SELECTOR);
    if (!block && loose && node.data.trim()) {
      block = displayBlock(node.parentElement!, root, displays);
      if (block) looseBlocks.add(block);
    }
    if (!block || !root.contains(block)) continue;
    const list = blocks.get(block);
    if (list) list.push(node);
    else blocks.set(block, [node]);
  }

  for (const [block, nodes] of blocks) {
    const empty = nodes.every((n) => !n.data.trim());
    const short = looseBlocks.has(block) && wordCount(nodes.map((n) => n.data).join(' ')) < LOOSE_MIN_WORDS;
    if (empty || short || !isVisible(block) || linkDensity(nodes) > MAX_LINK_DENSITY) blocks.delete(block);
  }
  return blocks;
}

function linkDensity(nodes: Text[]): number {
  let total = 0;
  let linked = 0;
  for (const n of nodes) {
    const len = n.data.trim().length;
    total += len;
    if (n.parentElement?.closest('a')) linked += len;
  }
  return total === 0 ? 0 : linked / total;
}

const MAIN_SELECTOR = 'main, [role="main"], article';

/** Where to look for text: the page's main content if it marks one. */
export function contentRoot(doc: Document): Element {
  return doc.querySelector(MAIN_SELECTOR) ?? doc.body;
}

/** Fewer words of paragraphs than this in the main content, and the whole body is read instead. */
export const MIN_PAGE_WORDS = 50;

export interface PageText {
  root: Element;
  /** Read loosely (see `collectSegments`); text that arrives later is read the same way. */
  loose: boolean;
  segments: Segment[];
}

/**
 * Where the page's text is and how to read it: the paragraphs of its main
 * content, else of the whole body (the first with `MIN_PAGE_WORDS` outside
 * headings, failing that the first with any), and only on a page with no
 * paragraphs at all, any block of prose (a page built from spans, like a
 * video's description and comments), so a short article's page around it
 * isn't woven.
 */
export function findPageText(doc: Document): PageText {
  const main = doc.querySelector(MAIN_SELECTOR);
  const found = [...(main ? [main] : []), doc.body].map((root) => {
    const segments = collectSegments(root);
    const words = segments.filter((s) => !/^H[1-6]$/.test(s.block.tagName)).reduce((n, s) => n + wordCount(s.text), 0);
    return { root, loose: false, segments, words };
  });
  const strict = found.find((f) => f.words >= MIN_PAGE_WORDS) ?? found.find((f) => f.words > 0);
  if (strict) return { root: strict.root, loose: false, segments: strict.segments };
  return { root: doc.body, loose: true, segments: collectSegments(doc.body, { loose: true }) };
}

/**
 * Collects paragraph-level segments under `root` that haven't been woven yet.
 * `loose` also reads text outside paragraph tags (see `textByBlock`).
 */
export function collectSegments(root: Element, { loose = false } = {}): Segment[] {
  const segments: Segment[] = [];

  for (const [block, nodes] of textByBlock(root, loose)) {
    let text = '';
    const nodeStarts: number[] = [];
    for (const node of nodes) {
      nodeStarts.push(text.length);
      text += node.data;
    }

    for (const [s, e] of chunkText(text, nodeStarts.slice(1))) {
      const pieces: Piece[] = [];
      nodes.forEach((node, i) => {
        const nodeStart = nodeStarts[i]!;
        const start = Math.max(s, nodeStart);
        const end = Math.min(e, nodeStart + node.data.length);
        if (start < end) pieces.push({ node, start: start - nodeStart, end: end - nodeStart });
      });
      const range = root.ownerDocument.createRange();
      const first = pieces[0]!;
      const last = pieces[pieces.length - 1]!;
      range.setStart(first.node, first.start);
      range.setEnd(last.node, last.end);
      segments.push({ text: text.slice(s, e), pieces, block, range });
    }
  }
  return segments;
}

/** Sorts segments as their blocks come in the page; a block's own segments keep their order. */
export function inPageOrder(a: Segment, b: Segment): number {
  if (a.block === b.block) return 0;
  return a.block.compareDocumentPosition(b.block) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}

/**
 * The page took the segment's text away: its block was removed, or drawn
 * again with other text (any woven words going with it), as pages that load
 * as you go do with what's no longer shown.
 */
export function isGone(seg: Segment): boolean {
  if (!seg.block.isConnected) return true;
  if (seg.block.querySelector(`.${WOVEN_CLASS}`)) return false;
  // A text node taken out keeps its text, so it's checked for first.
  return !seg.pieces.every((p) => seg.block.contains(p.node)) || !relocate(seg);
}

/** The segment's text as the DOM holds it now; differs from `text` if the page changed. */
export function currentText(seg: Segment): string {
  return seg.pieces.map((p) => p.node.data.slice(p.start, p.end)).join('');
}

/**
 * Makes `pieces` match the DOM again after other writes in the same block,
 * by walking the text nodes inside the segment's live range. Returns false
 * if the segment's own text has changed.
 */
export function relocate(seg: Segment): boolean {
  if (currentText(seg) === seg.text) return true;
  const { range } = seg;
  const root = range.commonAncestorContainer;
  const walker = seg.block.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const pieces: Piece[] = [];
  for (let n: Node | null = root.nodeType === Node.TEXT_NODE ? root : walker.nextNode(); n; n = walker.nextNode()) {
    const node = n as Text;
    if (!range.intersectsNode(node) || isSkipped(node, SKIP_CONTENT)) continue;
    const start = node === range.startContainer ? range.startOffset : 0;
    const end = node === range.endContainer ? range.endOffset : node.length;
    if (start < end) pieces.push({ node, start, end });
    if (root === node) break;
  }
  if (pieces.length === 0) return false;
  const previous = seg.pieces;
  seg.pieces = pieces;
  if (currentText(seg) === seg.text) return true;
  seg.pieces = previous;
  return false;
}

/**
 * Maps a segment offset to a DOM position. At a boundary between two pieces,
 * a range start goes to the beginning of the later piece and a range end to
 * the end of the earlier one, so ranges don't swallow neighbouring markup.
 */
export function toDomPoint(
  seg: Segment,
  offset: number,
  edge: 'start' | 'end',
): { node: Text; offset: number } {
  let pos = 0;
  for (const p of seg.pieces) {
    const len = p.end - p.start;
    const inside = edge === 'start' ? offset < pos + len : offset <= pos + len;
    if (inside) return { node: p.node, offset: p.start + (offset - pos) };
    pos += len;
  }
  const last = seg.pieces[seg.pieces.length - 1]!;
  return { node: last.node, offset: last.end };
}
