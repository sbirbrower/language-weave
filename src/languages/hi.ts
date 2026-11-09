import type { LanguageConfig } from './types';

// Readings: every Devanagari word carries its romanisation in 《》 (src/ruby.ts), so a beginner can read
// it and code can drop it. Textbook romanisation, with diacritics; Hindi has spaces between words.
const READINGS =
  'Write standard everyday Hindi in Devanagari, with the English loanwords people really use (स्कूल, बस, फ़ोन) rather than Sanskritised words, and give every Devanagari word its romanisation in 《》 straight after it: घर《ghar》, बैठना《baiṭhnā》, नमस्ते《namaste》, हिंदी《hindī》. One reading per word, never one for a phrase: बड़ा《baṛā》 घर《ghar》. Romanise as textbooks do: ā ī ū for long vowels; ṭ ṭh ḍ ḍh ṇ for retroflex consonants and ṛ ṛh for ड़ ढ़; c and ch for च and छ (चाय《cāy》, छोटा《choṭā》); ś and ṣ for श and ष; v for व; q, z and f for क़, ज़ and फ़; ṃ after a nasal vowel (हैं《haiṃ》, में《meṃ》, माँ《māṃ》) and n or m for a nasal said before a consonant (हिंदी《hindī》, लंबा《lambā》). Write the word as it is said, without an inherent a that is not pronounced (कमल《kamal》, not kamala; लड़का《laṛkā》; समझना《samajhnā》). Write nukta letters where standard spelling has them (ज़, फ़). End a sentence with । and keep ? and ! as they are.';

export const hi: LanguageConfig = {
  code: 'hi',
  displayName: 'Hindi',
  flag: '🇮🇳',
  bcp47: 'hi-IN',
  genders: ['m', 'f'],
  grammarNotes: [
    '- Hindi has no articles: "the house" → "घर《ghar》", with the article inside the span.',
    '- Postpositions follow the noun; include them in the span ("in the house" → "घर《ghar》 में《meṃ》").',
    '- A noun before a postposition takes its oblique form: लड़का《laṛkā》 → लड़के《laṛke》 से《se》, लड़के《laṛke》 (boys) → लड़कों《laṛkoṃ》 को《ko》.',
    '- Adjectives ending in -ā agree with their noun: बड़ा《baṛā》 (m. sg.), बड़े《baṛe》 (m. pl. or oblique), बड़ी《baṛī》 (f.). Include the noun in the span when you replace such an adjective.',
    '- Verbs agree with their subject in gender and number, and in the perfective past with ने they agree with the object, which English word order can’t show: skip past-tense verbs with a transitive subject, and prefer nouns and adjectives to verbs.',
    `- ${READINGS}`,
  ].join('\n'),
  lemmaForms: 'with its reading: nouns in the direct singular (घर《ghar》), adjectives in the masculine -ā form (बड़ा《baṛā》), verbs in the infinitive ending in -nā (खाना《khānā》)',
  weaveExample: [
    'at the edge of the forest||जंगल《jangal》 के《ke》 किनारे《kināre》 पर《par》||किनारा《kinārā》||m||noun||edge',
    'strangers||अजनबियों《ajnabiyoṃ》||अजनबी《ajnabī》||m||noun||stranger',
  ].join('\n'),
  pickExample: ['dog|dogs||कुत्ता《kuttā》', 'run|runs|running|ran||दौड़ना《dauṛnā》', 'fast||तेज़《tez》'].join('\n'),
  // Devanagari is told from English by its script (`notEnglish`); the romanised forms (without accents)
  // catch a Hindi line the model wrote in Latin letters. Romanised words that are also English (the, to, main) are left out.
  functionWords: [
    ...'है हैं था थी थे का की के में को से ने पर और नहीं भी तो यह वह एक मैं हम आप तुम'.split(' '),
    ...'hai haim hain tha thi ka ki ke mem mein ko se ne aur nahim nahin nahi bhi yah yeh vah voh ek maim ham hum ap aap tum kya mera meri mere'.split(' '),
  ],
  writingNotes: READINGS,
  romanSample: { script: 'घर', roman: 'ghar' },
  genderColors: { m: '#2b6cb0', f: '#b83280' },
  citationForm(lemma, gender, pos) {
    return pos === 'noun' && gender !== '-' ? `${lemma} (${gender})` : lemma;
  },
};
