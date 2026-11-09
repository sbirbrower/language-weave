import type { BankEntry } from '../bank';

export const FRENCH_0_20 = [
  'zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
  'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf', 'vingt',
] as const;

const ENGLISH_0_20 = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
] as const;

/** French cardinal for 0–20; the oracle the Numbers lesson will extend. */
export function numberToFrench(n: number): string | null {
  return Number.isInteger(n) && n >= 0 && n <= 20 ? FRENCH_0_20[n]! : null;
}

// A bare integer: not part of a decimal, time, ratio, range, price or
// percentage ("3.5", "5:30", "1/2", "-4", "$5", "10%"). Letters and other
// digits around it are already excluded by the word boundaries.
const digit = (n: number) => String.raw`(?<![\d.,:/$£€\-−–])${n}(?![.,:/\-−–]\d)(?!\s?%)`;

export function numberEntries(): BankEntry[] {
  return FRENCH_0_20.map((french, n) => {
    const base = {
      id: `num-${n}`,
      tier: 2 as const,
      category: 'numbers',
      english: `${digit(n)}|${ENGLISH_0_20[n]}`,
      french,
      lemmas: [french],
      pos: 'num',
      gloss: String(n),
      numeral: String(n),
    };
    if (n !== 1) return { ...base, fixed: true };
    // Un/une agrees with its noun, and "one" is often a pronoun.
    return {
      ...base,
      lemmas: ['un', 'une'],
      hint: 'un or une to agree with the noun that follows; include that noun in the span ("one apple" → "une pomme"). Skip "one" used as a pronoun ("one of", "no one", "one must").',
    };
  });
}
