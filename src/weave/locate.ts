export interface Span {
  start: number;
  end: number;
}

const WORD_CHAR = /[\p{L}\p{N}_]/u;

function isWordChar(ch: string | undefined): boolean {
  return ch !== undefined && WORD_CHAR.test(ch);
}

/**
 * Finds every occurrence of `needle` in `text` that sits on word boundaries:
 * "cat" matches in "the cat sat" but not in "concatenate". A boundary is only
 * required where the needle itself starts or ends with a word character, so
 * spans like "U.S." or "(the dog" still match.
 */
export function findAll(text: string, needle: string): Span[] {
  if (!needle) return [];
  const spans: Span[] = [];
  const needStartBoundary = isWordChar(needle[0]);
  const needEndBoundary = isWordChar(needle[needle.length - 1]);

  let from = 0;
  for (;;) {
    const start = text.indexOf(needle, from);
    if (start === -1) break;
    const end = start + needle.length;
    const okStart = !needStartBoundary || !isWordChar(text[start - 1]);
    const okEnd = !needEndBoundary || !isWordChar(text[end]);
    if (okStart && okEnd) spans.push({ start, end });
    from = start + 1;
  }
  return spans;
}

export function overlaps(a: Span, b: Span): boolean {
  return a.start < b.end && b.start < a.end;
}

export type LocateResult =
  | { ok: true; span: Span }
  | { ok: false; reason: 'not-found' | 'overlap' };

/**
 * Picks one occurrence of `needle` that doesn't overlap any `taken` span.
 * With `near`, picks the free occurrence closest to that offset (used when the
 * text shifted since the request); otherwise the first free one.
 */
export function locate(
  text: string,
  needle: string,
  opts: { taken?: Span[]; near?: number } = {},
): LocateResult {
  const all = findAll(text, needle);
  if (all.length === 0) return { ok: false, reason: 'not-found' };

  const taken = opts.taken ?? [];
  const free = all.filter((s) => !taken.some((t) => overlaps(s, t)));
  if (free.length === 0) return { ok: false, reason: 'overlap' };

  const near = opts.near;
  if (near === undefined) return { ok: true, span: free[0]! };
  const closest = free.reduce((best, s) =>
    Math.abs(s.start - near) < Math.abs(best.start - near) ? s : best,
  );
  return { ok: true, span: closest };
}
