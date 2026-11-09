/** A seeded random source, so the eval's variants make the same choices and differ only in what they test. */
export interface Rng {
  /** 0 ≤ n < 1. */
  next(): number;
  int(max: number): number;
  pick<T>(xs: readonly T[]): T;
  sample<T>(xs: readonly T[], n: number): T[];
}

// mulberry32, seeded from a string hash (cyrb53's mixing).
export function seededRng(seed: string): Rng {
  let h = 0xdeadbeef;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 2654435761);
  let a = (h ^ (h >>> 16)) >>> 0;
  return rngFrom(() => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  });
}

/** An `Rng` drawing from `next` (Math.random, or a test's). */
export function rngFrom(next: () => number): Rng {
  const int = (max: number) => Math.floor(next() * max);
  return {
    next,
    int,
    pick: (xs) => xs[int(xs.length)]!,
    sample(xs, n) {
      const pool = [...xs];
      const out = [];
      while (out.length < n && pool.length) out.push(pool.splice(int(pool.length), 1)[0]!);
      return out;
    },
  };
}
