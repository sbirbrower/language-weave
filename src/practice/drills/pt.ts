import type { DrillData } from './types';

const O = 'ó is an open o, as in law; ô is a closed o, as in go.';

/** Brazilian Portuguese, as the voice (pt-BR) says it. */
export const PT_DRILLS: DrillData = {
  lessons: 4,
  pairs: [
    { words: [{ text: 'avó', en: 'grandmother' }, { text: 'avô', en: 'grandfather' }], why: O },
    { words: [{ text: 'vovó', en: 'grandma' }, { text: 'vovô', en: 'grandpa' }], why: O },
    { words: [{ text: 'lá', en: 'there' }, { text: 'lã', en: 'wool' }], why: 'ã is nasal: let the sound go through your nose.' },
    { words: [{ text: 'irmão', en: 'brother' }, { text: 'irmã', en: 'sister' }], why: 'ão ends in a nasal w sound; ã is a plain nasal a.', at: 1 },
    { words: [{ text: 'caro', en: 'expensive' }, { text: 'carro', en: 'car' }], why: 'A single r between vowels is a quick tap; rr is said like an English h.', at: 1 },
    { words: [{ text: 'pais', en: 'parents' }, { text: 'país', en: 'country' }], why: 'pais is one syllable, like “pice”; país is two, pa-ÍS.', at: 2 },
  ],
  dictation: ['irmão', 'mãe', 'pão', 'avó', 'você', 'café', 'coração', 'filho', 'amanhã', 'obrigado', 'açúcar', 'trabalho'],
};
