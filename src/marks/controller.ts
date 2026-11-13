import type { LanguageConfig } from '../languages';
import type { Result } from '../messages';
import { SCROLL_SETTLE_MS } from '../passage/controller';
import type { Segment } from '../weave/segment';
import type { ShownMark } from './stream';
import { applyMark } from './write';

/** Up to about `CONTEXT_WORDS` of one section's paragraphs (`sectionChunks`). */
export interface MarkChunk {
  heading: string;
  paras: Segment[];
}

export interface MarkDeps {
  doc: Document;
  lang: LanguageConfig;
  chunks: MarkChunk[];
  onScreen(el: Element): boolean;
  /** Marks a chunk: `onMark` for each kept mark as its check passes, then what it all cost. */
  request(chunk: MarkChunk, onMark: (mark: ShownMark) => void): Promise<Result<{ usd: number | null }>>;
  onSpend(usd: number | null): void;
  onError?(error: string): void;
  /** A mark was drawn on the page. */
  onMarked?(): void;
}

export interface Marker {
  stop(): void;
}

/** The chunk with the most paragraphs on screen (the first, on a tie), or -1 when none is. */
export function chunkOnScreen(chunks: MarkChunk[], onScreen: (el: Element) => boolean): number {
  let best = -1;
  let most = 0;
  chunks.forEach((c, i) => {
    const n = c.paras.filter((p) => onScreen(p.block)).length;
    if (n > most) [best, most] = [i, n];
  });
  return best;
}

/**
 * Lesson mode's marks on the page: the chunk on screen is marked, and again
 * whichever the reader settles on after scrolling. One request at a time; a
 * chunk is marked once, and one that failed is asked for again only after
 * the reader scrolls, so an error isn't repeated. Marks are drawn as they arrive.
 */
export function startMarks(deps: MarkDeps): Marker {
  const win = deps.doc.defaultView;
  const marked = new Set<number>();
  const failedHere = new Set<number>();
  let busy = false;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function update() {
    if (stopped || busy) return;
    const i = chunkOnScreen(deps.chunks, deps.onScreen);
    if (i < 0 || marked.has(i) || failedHere.has(i)) return;
    const chunk = deps.chunks[i]!;
    busy = true;
    marked.add(i);
    const draw = (mark: ShownMark) => {
      const seg = chunk.paras[mark.at];
      if (!stopped && seg && applyMark(seg, mark, deps.lang)) deps.onMarked?.();
    };
    const failed = (error: string) => {
      marked.delete(i);
      failedHere.add(i);
      deps.onError?.(error);
    };
    void deps
      .request(chunk, draw)
      .then(
        (res) => (res.ok ? deps.onSpend(res.value.usd) : failed(res.error)),
        (e) => failed(e instanceof Error ? e.message : String(e)),
      )
      .finally(() => {
        busy = false;
        update();
      });
  }

  const onScroll = () => {
    failedHere.clear();
    clearTimeout(timer);
    timer = setTimeout(update, SCROLL_SETTLE_MS);
  };
  win?.addEventListener('scroll', onScroll, { passive: true });
  update();

  return {
    stop() {
      stopped = true;
      clearTimeout(timer);
      win?.removeEventListener('scroll', onScroll);
    },
  };
}
