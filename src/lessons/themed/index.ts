import type { LanguageConfig } from '../../languages';
import { fr } from '../../languages/fr';
import { a1TopUp, a1WordsFor } from '../a1';
import { easyWordsFor } from '../easy';
import { createBankLesson } from '../bank';
import { normalizeLemma } from '../resolve';
import type { Lesson } from '../types';

/**
 * Themed words: no word bank of its own. Before weaving, the model picks
 * about 25 words for the page, at the reader's level, from its title, headings and what's on
 * screen (see `pageWords.ts`); code repeats them across the page and, up to
 * A2 (`forLevel`), the language's beginner list tops up the rest.
 */
export function themedFor(lang: LanguageConfig): Lesson {
  const L = lang.displayName;
  const a1 = a1WordsFor(lang.code);
  return {
    ...createBankLesson({
      id: 'themed',
      name: 'Themed words',
      language: L,
      categories: [],
      caps: { perEntryPerSegment: {}, maxShare: {}, minGapWords: 3 },
      entries: [],
      easyWords: easyWordsFor(lang.code),
      topUpVocabulary: a1 && a1TopUp(a1, normalizeLemma),
      brief: { level: 'A1', teaches: 'easy words picked for this page' },
      promptFragment: `Lesson: themed words. The candidates below are words picked for this page.
- Replace the candidates listed below. Skip a candidate if no correct ${L} fits where it stands.
- Each span must contain its candidate. You may extend it by a word or two when ${L} needs them (an article, a noun's adjective), up to 5 words.
- Use the lemma given for the candidate.`,
    }),
    pickPageWords: true,
  };
}

/** French themed words, for the evals and tests. */
export const themed = themedFor(fr);
