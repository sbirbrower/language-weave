/**
 * Hangul blocks from their letters (compatibility jamo, as a keyboard types them: ㅎ ㅏ ㄴ → 한),
 * by Unicode's formula: a first consonant, a vowel, and a final consonant or none.
 */
const FIRST = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const VOWEL = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
const FINAL = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

/** Vowels written beside the first consonant (ㅏ), under it (ㅗ), or both (ㅘ). */
export function vowelPlace(vowel: string): 'beside' | 'under' | 'both' {
  if ('ㅗㅛㅜㅠㅡ'.includes(vowel)) return 'under';
  if ('ㅘㅙㅚㅝㅞㅟㅢ'.includes(vowel)) return 'both';
  return 'beside';
}

/**
 * The letters as written so far: a block once there's a consonant and a vowel, with a final
 * consonant if the third letter can be one; letters that make no block are left as they are.
 */
export function composeBlock(letters: readonly string[]): string {
  const [a, b] = letters;
  const first = a?.length === 1 ? FIRST.indexOf(a) : -1;
  const vowel = b?.length === 1 ? VOWEL.indexOf(b) : -1;
  if (first < 0 || vowel < 0) return letters.join('');
  const final = letters[2] ? FINAL.indexOf(letters[2]) : 0;
  const block = String.fromCharCode(0xac00 + (first * 21 + vowel) * 28 + Math.max(final, 0));
  return block + letters.slice(final > 0 ? 3 : 2).join('');
}
