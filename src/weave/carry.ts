/**
 * Words a page meant to weave but hasn't, carried to segments sent later so
 * the page still reaches its density. The model often weaves fewer top-up
 * words than asked; segments sent after the shortfall ask for a few more.
 * Segments that weave more than planned (spans extended for an article) pay
 * the debt down.
 */
export class DensityCarry {
  owed = 0;

  /** Extra top-up words for a segment about to be sent: at most `max`. */
  take(max: number): number {
    const n = Math.max(0, Math.min(this.owed, max));
    this.owed -= n;
    return n;
  }

  /** After a segment: the words it was meant to weave (including what it took) and the words it wove. */
  settle(target: number, woven: number) {
    this.owed = Math.max(0, this.owed + target - woven);
  }
}

/** Most extra words one segment may take: enough to matter, not so many that one paragraph is flooded. */
export function carryLimit(segmentWords: number): number {
  return Math.max(1, Math.round(segmentWords * 0.08));
}
