// The kit's patterns are written by a model and run here on any language's text.
import { withoutReadings } from '../ruby';

const WORD = String.raw`[\p{L}\p{M}\p{N}_]`;
// JavaScript's \b only knows ASCII letters, so "\bété\b" would never match; this one knows every script.
const BOUNDARY = `(?:(?<=${WORD})(?!${WORD})|(?<!${WORD})(?=${WORD}))`;

/** Curly apostrophes and no-break spaces, as plain ones, and no readings: the model writes either, and so do patterns. */
export function plainText(text: string): string {
  return withoutReadings(text).replace(/[’‘ʼ]/g, "'").replace(/[   ]/g, ' ');
}

/**
 * Compiles a model-written pattern case-insensitively, or null if it isn't
 * valid. Python-only syntax (a leading `(?i)`, `(?P<name>`) is converted, and
 * `\b` matches at the edge of words in any script.
 */
export function compilePattern(source: string): RegExp | null {
  const src = plainText(source)
    .replace(/^\(\?[a-z]+\)/, '')
    .replace(/\(\?P</g, '(?<');
  const unicode = src.replace(/\\\\|\\b/g, (m) => (m === '\\b' ? BOUNDARY : m));
  try {
    return new RegExp(unicode, 'iu');
  } catch {
    // Some escapes are fine without the u flag but not with it, like "\'".
    try {
      return new RegExp(src, 'i');
    } catch {
      return null;
    }
  }
}
