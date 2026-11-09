import { describe, expect, it } from 'vitest';
import { createLimiter } from '../src/limit';

describe('createLimiter', () => {
  it('caps concurrency and starts tasks in order', async () => {
    const limit = createLimiter(2);
    let active = 0;
    let peak = 0;
    const started: number[] = [];

    await Promise.all(
      [0, 1, 2, 3, 4].map((i) =>
        limit(async () => {
          started.push(i);
          active++;
          peak = Math.max(peak, active);
          await new Promise((r) => setTimeout(r, 5));
          active--;
        }),
      ),
    );
    expect(peak).toBe(2);
    expect(started).toEqual([0, 1, 2, 3, 4]);
  });

  it('frees the slot when a task throws', async () => {
    const limit = createLimiter(1);
    await expect(limit(() => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    await expect(limit(async () => 'ok')).resolves.toBe('ok');
  });
});
