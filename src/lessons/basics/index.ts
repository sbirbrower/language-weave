import { A1_WORDS, a1TopUp } from '../a1';
import { EASY_WORDS } from '../easy';
import { createBankLesson } from '../bank';
import { normalizeLemma } from '../resolve';
import { basicsEntries } from './bank';

export const basics = createBankLesson({
  id: 'basics',
  name: 'Les bases',
  language: 'French',
  categories: [
    { id: 'greetings', label: 'Greetings & goodbyes' },
    { id: 'ca-va', label: 'Comment ça va ?' },
    { id: 'classroom', label: 'Classroom' },
    { id: 'numbers', label: 'Numbers 0–20' },
    { id: 'everyday', label: 'Everyday words' },
  ],
  caps: {
    perEntryPerSegment: { 3: 2, 4: 1 },
    // Small words like "et" match everywhere; past a few they crowd out the rest.
    perEntryPer1000Words: { 4: 2 },
    maxShare: { 4: 0.4 },
    minGapWords: 3,
  },
  entries: basicsEntries,
  // A beginner lesson: the very easiest words first (rank 1 before rank 2 in each paragraph).
  easyWords: EASY_WORDS,
  topUpVocabulary: a1TopUp(A1_WORDS, normalizeLemma, basicsEntries.flatMap((e) => e.lemmas)),
  promptFragment: `Lesson: Les bases (A1). The reader is a beginner learning greetings, "comment ça va ?", classroom expressions and numbers 0–20.
- Replace the candidates listed below. Skip a candidate if no correct French fits where it stands.
- Each span must contain its candidate. You may extend it by a word or two when French needs them (an article, a subject pronoun, the noun after "one"), up to 5 words.
- Use the lemma given for the candidate.
- Use vous for classroom commands ("Répétez"); use informal "salut" and "comment ça va ?" for hi, bye and how are you.
- In French, put a narrow no-break space (U+202F) before ? and !.`,
  brief: {
    level: 'A1',
    teaches:
      "greetings and goodbyes (bonjour, bonsoir, salut, au revoir, à bientôt, à demain), comment ça va ? and its answers (très bien, bien, pas mal, comme ci comme ça, merci, et toi ?), classroom phrases (répétez, s'il vous plaît ; je ne comprends pas ; je ne sais pas ; comment dit-on… ? ; qu'est-ce que ça veut dire ?) and numbers 0–20",
  },
});
