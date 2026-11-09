import type { DrillData } from './types';

const U = 'For u, round your lips as for oo but put your tongue where it is for ee; ou is a plain oo.';

export const FR_DRILLS: DrillData = {
  lessons: 4,
  pairs: [
    { words: [{ text: 'tu', en: 'you' }, { text: 'tout', en: 'all' }], why: U },
    { words: [{ text: 'vu', en: 'seen' }, { text: 'vous', en: 'you' }], why: U },
    { words: [{ text: 'rue', en: 'street' }, { text: 'roue', en: 'wheel' }], why: U },
    { words: [{ text: 'dessus', en: 'on top' }, { text: 'dessous', en: 'underneath' }], why: U },
    { words: [{ text: 'deux', en: 'two' }, { text: 'des', en: 'some' }], why: 'For eu, round your lips as for o and say e; des has the e of café.' },
    { words: [{ text: 'le', en: 'the (one)' }, { text: 'les', en: 'the (more than one)' }], why: 'le has a short, rounded e; les has the e of café.' },
    { words: [{ text: 'vin', en: 'wine' }, { text: 'vent', en: 'wind' }], why: 'Both are nasal: in with the lips spread, en with the mouth open wider, like an.', at: 2 },
    { words: [{ text: 'pain', en: 'bread' }, { text: 'pont', en: 'bridge' }], why: 'Both are nasal: ain with the lips spread, on with them rounded.', at: 2 },
    { words: [{ text: 'beau', en: 'handsome' }, { text: 'bon', en: 'good' }], why: 'eau is a plain o; on is nasal, the sound going through the nose.', at: 2 },
    { words: [{ text: 'poisson', en: 'fish' }, { text: 'poison', en: 'poison' }], why: 'ss is said s; one s between vowels is said z.', at: 1 },
  ],
  silent: {
    at: 1,
    why: 'A consonant at the end of a word is mostly not said. Some come back before a vowel, in liaison: un petit ami is said peti-t-ami.',
    sentences: [
      { text: 'Le peti[t] cha[t] e[st] gri[s].', en: 'The little cat is grey.' },
      { text: 'Il[s] parl[ent] trè[s] for[t].', en: 'They speak very loudly.' },
      { text: 'Je vai[s] che[z] le docteur.', en: 'I’m going to the doctor’s.' },
      { text: 'Il fai[t] froi[d] e[t] gri[s].', en: 'It’s cold and grey.' },
      { text: 'Le ri[z] e[st] tro[p] chau[d].', en: 'The rice is too hot.' },
    ],
  },
  dictation: ['frère', 'mère', 'école', 'café', 'très', 'élève', 'fenêtre', 'garçon', 'français', 'hôpital', 'fête', 'où', 'déjà'],
};
