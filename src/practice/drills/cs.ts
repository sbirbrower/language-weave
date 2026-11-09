import type { DrillData } from './types';

const LONG = 'A vowel with a čárka (á, é, í, ó, ú, ý) or a kroužek (ů) is held about twice as long.';

export const CS_DRILLS: DrillData = {
  lessons: 4,
  pairs: [
    { words: [{ text: 'byt', en: 'a flat' }, { text: 'být', en: 'to be' }], why: LONG },
    { words: [{ text: 'pas', en: 'a passport' }, { text: 'pás', en: 'a belt' }], why: LONG },
    { words: [{ text: 'rada', en: 'advice' }, { text: 'ráda', en: 'glad (said by a woman)' }], why: LONG },
    { words: [{ text: 'dráha', en: 'a track' }, { text: 'drahá', en: 'dear (of a woman)' }], why: `${LONG} The stress stays on the first syllable either way.` },
    { words: [{ text: 'sud', en: 'a barrel' }, { text: 'soud', en: 'a court' }], why: 'ou glides from o to u, as in the English “go”; u is a plain short u.' },
  ],
  dictation: ['čaj', 'škola', 'žena', 'řeka', 'děti', 'chléb', 'dům', 'kůň', 'měsíc', 'příjmení', 'čtyři', 'dobrý den'],
};
