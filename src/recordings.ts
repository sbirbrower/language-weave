import { withoutReadings } from './ruby';

/**
 * Word recordings kept locally, in `local/recordings/<lang>/` (gitignored; `wxt.config.ts` copies them
 * into the build and leaves them out of zips): `index.json` maps a word, as `recordingKey` writes it, to
 * its clip's file name. Text with a recording (a word, phrase or sentence, matched whole) plays it, and a
 * language without a voice (`LanguageConfig.noVoice`) offers 🔊 only on what's recorded.
 */
export type RecordingIndex = Record<string, string>;

/** Where a language's index or clip is in the build. */
export const recordingPath = (lang: string, file = 'index.json') => `/recordings/${lang}/${file}`;

/**
 * A word as an index key: no readings, nothing in brackets (a vocab list's "taigh (m)"), lower case, one
 * kind of apostrophe and of space, no punctuation around it.
 */
export function recordingKey(text: string): string {
  return withoutReadings(text)
    .replace(/\([^)]*\)/g, ' ')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[’‘ʼ]/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, '')
    .trim();
}

/** Bytes as base64, in chunks, so a long clip doesn't overflow the call stack. */
export function toBase64(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes);
  let s = '';
  for (let i = 0; i < view.length; i += 0x8000) s += String.fromCharCode(...view.subarray(i, i + 0x8000));
  return btoa(s);
}
