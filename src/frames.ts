/** What a frame of the tab holds, as the background's probe saw it before injecting. */
export interface FrameText {
  frameId: number;
  /** Words of visible text in the frame's own document (not its frames'). */
  words: number;
  /** Language Weave already runs there. */
  tissage: boolean;
}

/** A top page with fewer words than this is a frame around the text (an ebook reader's), not the text. */
export const SHELL_WORDS = 100;

/**
 * The frame Language Weave runs in: the one it already runs in, else the top page,
 * unless that's a shell around a frame with more text (Google Play Books
 * draws the book in a frame of its own), where it's that frame.
 */
export function pickFrame(frames: FrameText[]): number {
  const held = frames.find((f) => f.tissage);
  if (held) return held.frameId;
  const top = frames.find((f) => f.frameId === 0);
  if (!top || top.words >= SHELL_WORDS) return 0;
  return frames.reduce((best, f) => (f.words > best.words ? f : best), top).frameId;
}
