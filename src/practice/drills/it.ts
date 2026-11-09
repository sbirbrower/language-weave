import type { DrillData } from './types';

const DOUBLE = 'A double consonant is held a little longer, with a short pause before it.';

export const IT_DRILLS: DrillData = {
  lessons: 4,
  pairs: [
    { words: [{ text: 'pala', en: 'shovel' }, { text: 'palla', en: 'ball' }], why: DOUBLE, at: 1 },
    { words: [{ text: 'nono', en: 'ninth' }, { text: 'nonno', en: 'grandfather' }], why: DOUBLE, at: 1 },
    { words: [{ text: 'sete', en: 'thirst' }, { text: 'sette', en: 'seven' }], why: DOUBLE, at: 1 },
    { words: [{ text: 'pena', en: 'sorrow' }, { text: 'penna', en: 'pen' }], why: DOUBLE, at: 1 },
    { words: [{ text: 'fato', en: 'fate' }, { text: 'fatto', en: 'done' }], why: DOUBLE, at: 1 },
    { words: [{ text: 'caro', en: 'dear' }, { text: 'carro', en: 'cart' }], why: 'A single r is a quick tap; rr is rolled, and held longer.', at: 1 },
    { words: [{ text: 'casa', en: 'house' }, { text: 'cassa', en: 'till' }], why: 'ss is always a long s; one s between vowels is often said z in the north.', at: 1 },
  ],
  sorts: [
    {
      at: 1,
      labels: ['soft, as in ciao', 'hard, as in casa'],
      why: 'c before e or i is soft, like the ch of church (ci before another vowel too: ciao). Before a, o, u, or with an h (che, chi), it’s a hard k.',
      words: [
        { text: '*c*ena', en: 'dinner', label: 0 },
        { text: '*c*iao', en: 'hi, bye', label: 0 },
        { text: '*c*inema', en: 'cinema', label: 0 },
        { text: 'ami*c*i', en: 'friends', label: 0 },
        { text: 'pia*c*ere', en: 'pleasure', label: 0 },
        { text: '*c*asa', en: 'house', label: 1 },
        { text: '*ch*iesa', en: 'church', label: 1 },
        { text: '*c*uore', en: 'heart', label: 1 },
        { text: 'ami*ch*e', en: 'friends (women)', label: 1 },
        { text: '*c*olore', en: 'colour', label: 1 },
      ],
    },
    {
      at: 1,
      labels: ['soft, as in gelato', 'hard, as in gatto'],
      why: 'g before e or i is soft, like the j of jam (gi before another vowel too: giallo). Before a, o, u, or with an h (ghe, ghi), it’s a hard g.',
      words: [
        { text: '*g*elato', en: 'ice cream', label: 0 },
        { text: '*g*iallo', en: 'yellow', label: 0 },
        { text: '*g*iro', en: 'a turn, a tour', label: 0 },
        { text: 'man*g*iare', en: 'to eat', label: 0 },
        { text: '*g*ente', en: 'people', label: 0 },
        { text: '*g*atto', en: 'cat', label: 1 },
        { text: 'spa*gh*etti', en: 'spaghetti', label: 1 },
        { text: '*g*onna', en: 'skirt', label: 1 },
        { text: '*g*usto', en: 'taste', label: 1 },
        { text: 'lun*gh*i', en: 'long', label: 1 },
      ],
    },
  ],
  dictation: ['città', 'caffè', 'perché', 'gnocchi', 'figlio', 'sorella', 'fratello', 'giallo', 'chiesa', 'pesce', 'lunedì', 'gelato'],
};
