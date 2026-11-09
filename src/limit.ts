/**
 * Runs at most `max` tasks at once; the rest wait in FIFO order, so segments
 * sent in document order also start in document order.
 */
export function createLimiter(max: number) {
  let active = 0;
  const waiting: Array<() => void> = [];

  const next = () => {
    active--;
    waiting.shift()?.();
  };

  return async function run<T>(task: () => Promise<T>): Promise<T> {
    if (active >= max) await new Promise<void>((resolve) => waiting.push(resolve));
    active++;
    try {
      return await task();
    } finally {
      next();
    }
  };
}
