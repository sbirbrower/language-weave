import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fr } from '../../src/languages/fr';
import { chunkOnScreen, startMarks, type MarkChunk, type MarkDeps } from '../../src/marks/controller';
import type { ShownMark } from '../../src/marks/stream';
import { MARK_CLASS } from '../../src/marks/write';
import { SCROLL_SETTLE_MS } from '../../src/passage/controller';
import { sectionChunks } from '../../src/passage/context';
import { collectSegments } from '../../src/weave/segment';

const PAGE = `
<main>
  <p>The snow leopard lives in the mountains of Central Asia, high above the trees.</p>
  <h2>Diet</h2>
  <p>It hunts wild sheep and goats on the steep slopes where few others can follow.</p>
  <p>In winter it follows its prey down to lower ground, closer to the villages.</p>
  <h2>Range</h2>
  <p>Its range covers twelve countries, from Afghanistan in the west to Mongolia.</p>
</main>`;

let chunks: MarkChunk[];
let visible: Set<Element>;

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = PAGE;
  const root = document.querySelector('main')!;
  chunks = sectionChunks(root, collectSegments(root));
  visible = new Set([chunks[0]!.paras[0]!.block]);
});
afterEach(() => vi.useRealTimers());

const mark = (chunk: MarkChunk, english: string, target: string): ShownMark => {
  const start = chunk.paras[0]!.text.indexOf(english);
  return { para: 1, at: 0, start, end: start + english.length, english, target, point: 1, note: '', pointLabel: 'p' };
};

function deps(over: Partial<MarkDeps> = {}): MarkDeps {
  return {
    doc: document,
    lang: fr,
    chunks,
    onScreen: (el) => visible.has(el),
    request: async () => ({ ok: true, value: { usd: 0.01 } }),
    onSpend: () => {},
    ...over,
  };
}

const settle = async () => {
  window.dispatchEvent(new Event('scroll'));
  await vi.advanceTimersByTimeAsync(SCROLL_SETTLE_MS);
};

describe('sectionChunks', () => {
  it('follows the headings, and cuts a long section into chunks of whole paragraphs', () => {
    expect(chunks.map((c) => [c.heading, c.paras.length])).toEqual([
      ['', 1],
      ['Diet', 2],
      ['Range', 1],
    ]);
    const root = document.querySelector('main')!;
    const small = sectionChunks(root, collectSegments(root), 20);
    expect(small.map((c) => [c.heading, c.paras.length])).toEqual([
      ['', 1],
      ['Diet', 1],
      ['Diet', 1],
      ['Range', 1],
    ]);
  });

  it('finds the chunk with the most paragraphs on screen', () => {
    visible = new Set([chunks[0]!.paras[0]!.block, ...chunks[1]!.paras.map((p) => p.block)]);
    expect(chunkOnScreen(chunks, (el) => visible.has(el))).toBe(1);
    expect(chunkOnScreen(chunks, () => false)).toBe(-1);
  });
});

describe('startMarks', () => {
  it('marks the chunk on screen as marks arrive, then the one the reader scrolls to, each once', async () => {
    const asked: string[] = [];
    const spent: Array<number | null> = [];
    const marker = startMarks(
      deps({
        request: async (chunk, onMark) => {
          asked.push(chunk.heading);
          if (chunk.heading === '') onMark(mark(chunk, 'snow leopard', 'panthère des neiges'));
          return { ok: true, value: { usd: 0.01 } };
        },
        onSpend: (usd) => spent.push(usd),
      }),
    );
    await vi.advanceTimersByTimeAsync(0);
    expect(document.querySelector(`.${MARK_CLASS}`)?.textContent).toBe('snow leopard');
    visible = new Set([chunks[2]!.paras[0]!.block]);
    await settle();
    visible = new Set([chunks[0]!.paras[0]!.block]);
    await settle();
    expect(asked).toEqual(['', 'Range']);
    expect(spent).toEqual([0.01, 0.01]);
    marker.stop();
  });

  it('asks for a failed chunk again only after the reader scrolls', async () => {
    const errors: string[] = [];
    let calls = 0;
    startMarks(
      deps({
        request: async () => {
          calls++;
          return calls === 1 ? { ok: false, error: 'overloaded' } : { ok: true, value: { usd: 0 } };
        },
        onError: (e) => errors.push(e),
      }),
    );
    await vi.advanceTimersByTimeAsync(0);
    expect([calls, errors]).toEqual([1, ['overloaded']]);
    await vi.advanceTimersByTimeAsync(5000);
    expect(calls).toBe(1);
    await settle();
    expect(calls).toBe(2);
  });

  it('draws nothing once stopped', async () => {
    let finish: (() => void) | undefined;
    const marker = startMarks(
      deps({
        request: (chunk, onMark) =>
          new Promise((resolve) => {
            finish = () => {
              onMark(mark(chunk, 'snow leopard', 'panthère des neiges'));
              resolve({ ok: true, value: { usd: 0 } });
            };
          }),
      }),
    );
    marker.stop();
    finish!();
    await vi.advanceTimersByTimeAsync(0);
    expect(document.querySelector(`.${MARK_CLASS}`)).toBeNull();
  });
});
