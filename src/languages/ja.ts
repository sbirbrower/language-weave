import type { LanguageConfig } from './types';

// Readings: every kanji word carries its reading in 《》 (src/ruby.ts), so a beginner can read it
// and code can drop it. Japanese has no grammatical gender and no spaces between words.
const READINGS =
  'Write natural Japanese with kanji where Japanese normally uses them, and give every word written with kanji its reading in hiragana in 《》 straight after the kanji, Aozora Bunko style: 日本語《にほんご》, 食《た》べる, お茶《ちゃ》, 大《おお》きい. A reading covers only the kanji just before it, never the kana after them. Words usually written in kana stay in kana (これ, です, ありがとう). Use Japanese punctuation (。、「」？！), no spaces between words.';

export const ja: LanguageConfig = {
  code: 'ja',
  displayName: 'Japanese',
  flag: '🇯🇵',
  greeting: 'こんにちは',
  bcp47: 'ja-JP',
  genders: [],
  grammarNotes: [
    '- Replace nouns, adjectives and verbs. English word order stays around the span, so leave out the particles (は, が, を, に) English has no place for; の inside a span that is all Japanese is fine ("the edge of the forest" → "森《もり》の端《はし》").',
    '- Japanese has no articles and rarely marks the plural: "the dogs" → "犬《いぬ》", with the article inside the span.',
    '- An adjective before a noun: an い-adjective as it is (大《おお》きい), a な-adjective with な (静《しず》かな). Include the noun in the span.',
    '- Verbs in the plain form for the English tense: the dictionary form for the present (走《はし》る), the た-form for the past (走《はし》った). Skip a verb in the passive, a conditional or a long verb phrase; pick a noun or an adjective instead.',
    `- ${READINGS}`,
  ].join('\n'),
  lemmaForms: 'the dictionary form, with its reading: verbs ending in -u (走《はし》る), い-adjectives ending in い, な-adjectives without な, nouns as they are',
  weaveExample: [
    'the edge of the forest||森《もり》の端《はし》||端《はし》||-||noun||edge',
    'strangers||知《し》らない人《ひと》||知《し》らない人《ひと》||-||phrase||stranger',
  ].join('\n'),
  pickExample: ['dog|dogs||犬《いぬ》', 'run|runs|running|ran||走《はし》る', 'fast||速《はや》い'].join('\n'),
  // The widget tells Japanese from English by its script (`notEnglish`); these are the commonest particles and endings.
  functionWords: 'は が を に で と の も へ から まで です ます でした ました ません だ この その あの これ それ'.split(' '),
  writingNotes: READINGS,
  // A beginner can't read kana yet either.
  romajiLevels: ['A1', 'A2'],
  romanSample: { script: '日本語', roman: 'nihongo' },
  genderColors: {},
  citationForm(lemma) {
    return lemma;
  },
};
