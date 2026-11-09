import type { LanguageConfig } from './types';

// Readings: every Hebrew word carries its romanisation in 《》 (src/ruby.ts), since a beginner can't read
// unpointed Hebrew, and the romanisation gives the vowels the script leaves out. Israeli pronunciation,
// stress marked when it isn't on the last syllable. Hebrew has spaces between words and is written right
// to left (src/direction.ts); the reader is spoken to in the masculine, as most courses do.
const READINGS =
  'Write modern Israeli Hebrew as Israelis write it: without vowel points (niqqud), in full spelling with ו and י for vowels (שולחן, not שלחן), and give every Hebrew word its romanisation in 《》 straight after it: שלום《shalom》, ספר《séfer》, תודה《toda》, ישראל《yisra\'el》. One reading per word, never one for a phrase; a letter that joins the front of a word (ה, ו, ב, ל, מ, ש, כ) is part of it: הילד《hayéled》, בבית《babáyit》, ולכן《velakhen》. Before a number or a foreign word, such a letter takes a hyphen and its own reading: ב《be》-1948. Romanise as an Israeli says it: kh for ח and for a soft כ (khaver, lekh), k for ק and a hard כ, ts for צ, sh for שׁ, s for שׂ and ס, v for a soft ב and for ו as a consonant, f for a soft פ, e for both e sounds, and \' between two vowels said apart or where א or ע starts a syllable after a consonant (sha\'ar, ma\'arav). Mark the stressed vowel with an acute accent when the stress is not on the last syllable (bóker, yéled, babáyit), and leave a word stressed on its last syllable bare (shalom, mishpakha, gadol). Write a geresh ׳ for borrowed sounds (ג׳ינס《jins》, צ׳יפס《chips》, ז׳קט《zhaket》) and in abbreviations, and ״ in acronyms (צה״ל《tsahal》). When a line speaks to the reader, use the masculine singular (אתה《ata》 רוצה《rotse》). Punctuate as English does: . , ? !';

export const he: LanguageConfig = {
  code: 'he',
  displayName: 'Hebrew',
  flag: '🇮🇱',
  bcp47: 'he-IL',
  genders: ['m', 'f'],
  grammarNotes: [
    '- The article ה joins the front of its noun: "the house" → "הבית《habáyit》", with the article inside the span. An adjective after a definite noun takes ה too ("the big house" → "הבית《habáyit》 הגדול《hagadol》"); include the noun in the span when you replace such an adjective.',
    '- The prepositions ב (in, at), ל (to, for) and מ (from) and the conjunction ו (and) join the front of the next word, and ב and ל swallow the article ("in the house" → "בבית《babáyit》", "to the sea" → "לים《layam》", "from the city" → "מהעיר《meha\'ir》"); put the preposition in the span.',
    '- "Of" is usually the construct: the first noun loses its article and a feminine ־ה becomes ־ת ("the edge of the forest" → "קצה《ktse》 היער《hayá\'ar》", "the cake of the day" → "עוגת《ugat》 היום《hayom》"), or של《shel》 between two nouns ("the dog of the boy" → "הכלב《hakélev》 של《shel》 הילד《hayéled》").',
    '- A definite direct object takes את《et》 before it; when you replace one, put את in the span ("I saw the dog" → "I saw את《et》 הכלב《hakélev》").',
    '- Adjectives follow the noun and agree in gender and number: גדול《gadol》, גדולה《gdola》, גדולים《gdolim》, גדולות《gdolot》.',
    '- The present tense has no "is" or "are": never weave them alone. Verbs agree with their subject in gender and number in every tense (הוא《hu》 אוכל《okhel》, היא《hi》 אוכלת《okhélet》, הם《hem》 אוכלים《okhlim》). Skip a verb whose subject or object would have to join it as an ending (ראיתיו《re\'itiv》); pick a noun or an adjective instead.',
    '- "This" and "that" follow the noun, which takes ה: "this house" → "הבית《habáyit》 הזה《haze》"; include the noun in the span.',
    `- ${READINGS}`,
  ].join('\n'),
  lemmaForms: 'with its reading: nouns in the singular without the article (בית《báyit》), adjectives in the masculine singular (גדול《gadol》), verbs in the infinitive with ל (ללכת《lalékhet》)',
  weaveExample: [
    'at the edge of the forest||בקצה《biktse》 היער《hayá\'ar》||קצה《katse》||m||noun||edge',
    'were wary of strangers||חשדו《khashdu》 בזרים《bezarim》||לחשוד《lakhshod》||-||verb||to suspect',
  ].join('\n'),
  pickExample: ['dog|dogs||כלב《kélev》', 'run|runs|running|ran||לרוץ《laruts》', 'fast||מהיר《mahir》'].join('\n'),
  // Hebrew is told from English by its script (`notEnglish`); the romanised forms catch a Hebrew line the model
  // wrote in Latin letters. Romanised words that are also English (at, hi, hen, be, ha) are left out.
  functionWords: [
    ...'של את הוא היא זה זאת לא כן יש אין אני אתה אנחנו הם הן גם אבל עם על כל רק עוד מה מי איפה היה הייתה היו כי אם'.split(' '),
    ...'ani ata anakhnu atem aten hu ze zot zeh shel et ve lo ken yesh eyn ein ma mi eyfo efo gam aval im al kol rak od kmo haya hayta hayu ki sheli shelo shela toda'.split(' '),
  ],
  writingNotes: READINGS,
  romanSample: { script: 'שלום', roman: 'shalom' },
  genderColors: { m: '#2b6cb0', f: '#b83280' },
  citationForm(lemma, gender, pos) {
    return pos === 'noun' && gender !== '-' ? `${lemma} (${gender})` : lemma;
  },
};
