import type { DrillData, Letter } from './types';

/**
 * The alef-bet as the first two lessons teach it (`src/syllabus/he.ts`), with each letter's sound as the
 * romanisation writes it. א and ע are left out of the letter drills: mostly silent, they carry a vowel.
 * No listening drill: a letter read alone is said by its name.
 */
const H = (letter: string, sound: string, at: number, like?: string): Letter => ({ letter, sound, at, ...(like ? { like } : {}) });

export const HE_DRILLS: DrillData = {
  lessons: 4,
  letters: {
    list: [
      H('ב', 'b or v', 0, 'b with a dot inside, v without'),
      H('ג', 'g', 0, 'as in go'),
      H('ד', 'd', 0),
      H('ה', 'h', 0, 'often silent at the end of a word'),
      H('ו', 'v, o or u', 0),
      H('ז', 'z', 0),
      H('ח', 'kh', 0, 'from the throat, as in loch'),
      H('ט', 't', 0),
      H('י', 'y or i', 0),
      H('כ', 'k or kh', 1, 'k with a dot inside, kh without'),
      H('ל', 'l', 1),
      H('מ', 'm', 1),
      H('נ', 'n', 1),
      H('ס', 's', 1),
      H('פ', 'p or f', 1, 'p with a dot inside, f without'),
      H('צ', 'ts', 1, 'as in cats'),
      H('ק', 'k', 1),
      H('ר', 'r', 1, 'from the back of the throat'),
      H('ש', 'sh or s', 1),
      H('ת', 't', 1),
      H('ך', 'kh', 1, 'kaf’s shape at the end of a word'),
      H('ם', 'm', 1, 'mem’s shape at the end of a word'),
      H('ן', 'n', 1, 'nun’s shape at the end of a word'),
      H('ף', 'f', 1, 'pe’s shape at the end of a word'),
      H('ץ', 'ts', 1, 'tsadi’s shape at the end of a word'),
    ],
    alike: [['ב', 'כ', 'פ'], ['ד', 'ר', 'ך'], ['ה', 'ח', 'ת'], ['ו', 'ז', 'ן', 'י'], ['ס', 'ם', 'ט'], ['ג', 'נ']],
  },
  loans: [
    { text: 'טלפון《télefon》', en: 'phone', at: 1 },
    { text: 'קפה《kafe》', en: 'coffee', at: 1 },
    { text: 'פיצה《pítsa》', en: 'pizza', at: 1 },
    { text: 'בננה《banána》', en: 'banana', at: 1 },
    { text: 'אוטובוס《ótobus》', en: 'bus', at: 1 },
    { text: 'סלט《salat》', en: 'salad', at: 1 },
    { text: 'שוקולד《shókolad》', en: 'chocolate', at: 1 },
    { text: 'בנק《bank》', en: 'bank', at: 1 },
    { text: 'מוזיקה《múzika》', en: 'music', at: 1 },
    { text: 'טלוויזיה《televízya》', en: 'television', at: 1 },
    { text: 'אינטרנט《ínternet》', en: 'internet', at: 1 },
    { text: 'ג׳ינס《jins》', en: 'jeans', at: 2 },
  ],
  unvoweled: [
    {
      sentence: 'אני《ani》 קורא《kore》 *ספר*.',
      en: 'I’m reading a book.',
      spelled: 'ספר',
      options: [{ reading: 'séfer', en: 'a book' }, { reading: 'sapar', en: 'a barber' }, { reading: 'sfar', en: 'a border' }],
      at: 2,
    },
    {
      sentence: 'אני《ani》 שותה《shote》 *חלב*.',
      en: 'I drink milk.',
      spelled: 'חלב',
      options: [{ reading: 'khalav', en: 'milk' }, { reading: 'khélev', en: 'fat (on meat)' }],
      at: 2,
    },
    {
      sentence: 'יש《yesh》 להם《lahem》 *מלך*.',
      en: 'They have a king.',
      spelled: 'מלך',
      options: [{ reading: 'mélekh', en: 'a king' }, { reading: 'malakh', en: 'he reigned' }],
      at: 2,
    },
    {
      sentence: 'אני《ani》 קונה《kone》 *שמן* זית《záyit》.',
      en: 'I’m buying olive oil.',
      spelled: 'שמן',
      options: [{ reading: 'shémen', en: 'oil' }, { reading: 'shamen', en: 'fat (of a person)' }],
      at: 2,
    },
  ],
};
