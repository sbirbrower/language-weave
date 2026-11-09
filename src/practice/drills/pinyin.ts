/** Pinyin syllables' tones, from their tone marks: 1–4, or 0 for the light tone (no mark). */
const MARKS: Record<string, number> = { '̄': 1, '́': 2, '̌': 3, '̀': 4 };
const BY_TONE = ['', '̄', '́', '̌', '̀'];

export function toneOf(syllable: string): number {
  for (const ch of syllable.normalize('NFD')) if (MARKS[ch]) return MARKS[ch]!;
  return 0;
}

/**
 * The syllable with tone `tone` instead: the mark goes on a or e, on the o of ou,
 * or else on the last vowel (lǎo, shī, duì, liù, nǚ).
 */
export function retone(syllable: string, tone: number): string {
  const bare = [...syllable.normalize('NFD')].filter((ch) => !MARKS[ch]).join('');
  const lower = bare.toLowerCase();
  let at = lower.search(/[ae]/);
  if (at < 0) at = lower.indexOf('ou');
  if (at < 0) {
    for (let i = lower.length - 1; i >= 0; i--) if ('iou'.includes(lower[i]!)) {
      at = i;
      break;
    }
  }
  if (at < 0) return syllable;
  // ü is u + U+0308 here: the tone mark goes after the diaeresis.
  const end = bare[at + 1] === '̈' ? at + 2 : at + 1;
  return (bare.slice(0, end) + (BY_TONE[tone] ?? '') + bare.slice(end)).normalize('NFC');
}
