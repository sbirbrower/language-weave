import { describe, expect, it } from 'vitest';
import { pickFrame, SHELL_WORDS } from '../src/frames';

describe('pickFrame', () => {
  it('runs in the top page when it has text', () => {
    expect(pickFrame([{ frameId: 0, words: SHELL_WORDS, tissage: false }, { frameId: 4, words: 5000, tissage: false }])).toBe(0);
  });

  it('runs in the frame with the most text when the top page is a shell', () => {
    const frames = [
      { frameId: 0, words: 12, tissage: false },
      { frameId: 3, words: 40, tissage: false },
      { frameId: 7, words: 600, tissage: false },
    ];
    expect(pickFrame(frames)).toBe(7);
  });

  it('stays in the frame it already runs in', () => {
    expect(pickFrame([{ frameId: 0, words: 500, tissage: false }, { frameId: 2, words: 10, tissage: true }])).toBe(2);
  });

  it('keeps the top page when no frame has more', () => {
    expect(pickFrame([{ frameId: 0, words: 30, tissage: false }, { frameId: 1, words: 20, tissage: false }])).toBe(0);
    expect(pickFrame([])).toBe(0);
  });
});
