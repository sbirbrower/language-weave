import type { LanguageConfig } from './types';

// Readings: every Cyrillic word carries its romanisation in 《》 (src/ruby.ts), since a beginner can't read
// Cyrillic yet, and the romanisation marks the stress, which Russian spelling leaves out. A simple textbook
// scheme (zh, kh, ts, ch, sh, shch, ya, yu); the Cyrillic itself is written without stress marks.
const READINGS =
  'Write standard modern Russian in Cyrillic, without stress marks, with ё wherever it is said (ещё, её, всё, ёлка), and give every Cyrillic word its romanisation in 《》 straight after it: привет《privét》, книга《kníga》, дом《dom》, хорошо《khoroshó》. One reading per word, never one for a phrase: в《v》 большом《bol\'shóm》 доме《dóme》; a hyphenated word takes one (по-русски《po-rússki》). Romanise letter by letter: zh for ж, kh for х, ts for ц, ch for ч, sh for ш, shch for щ, y for й and ы (ый yy, ий iy: новый《nóvyy》, синий《síniy》), yu for ю, ya for я, e for е after a consonant and ye at the start of a word or after a vowel, ь or ъ (есть《yest\'》, моё《moyó》), yo for ё (o after ж, ч, ш, щ: ещё《yeshchó》, чёрный《chórnyy》), e for э, \' for ь, and nothing for ъ (подъезд《podyézd》). Write unstressed vowels as spelled (молоко《molokó》, not malakó), except г said as v in -ого and -его (его《yevó》, сегодня《sevódnya》, нового《nóvovo》). Mark the stressed vowel of every word of more than one syllable with an acute accent (мама《máma》, вода《vodá》, ёлка《yólka》), and leave one-syllable words bare (дом《dom》, кот《kot》). Write the names of real places and people in their usual Russian spelling. Punctuate as Russians do: a comma before что, который, где, когда and потому что; « » for quotes.';

export const ru: LanguageConfig = {
  code: 'ru',
  displayName: 'Russian',
  flag: '🇷🇺',
  greeting: 'Привет',
  bcp47: 'ru-RU',
  genders: ['m', 'f', 'n'],
  grammarNotes: [
    '- Russian has no articles: "the house" → "дом《dom》", with the article inside the span.',
    '- Nouns, adjectives and pronouns take the case the sentence needs. Include a preceding preposition in the span, since it decides the case ("in the forest" → "в《v》 лесу《lesú》", "with the dog" → "с《s》 собакой《sobákoy》", "to the town" → "в《v》 город《górod》", "the book" as object → "книгу《knígu》").',
    '- "Of" is the genitive after the noun: "the edge of the forest" → "край《kray》 леса《lésa》"; include both nouns in the span.',
    '- Adjectives agree with their noun in gender, number and case (большой《bol\'shóy》 дом《dom》, большая《bol\'sháya》 река《reká》, большое《bol\'shóye》 озеро《ózero》, в《v》 большом《bol\'shóm》 доме《dóme》). Include the noun in the span when you replace such an adjective.',
    '- The present has no "is" or "are": never weave them alone. Conjugate other verbs for their subject and tense; the past agrees with the subject in gender and number (был《byl》, была《bylá》, было《býlo》, были《býli》). Use a perfective verb for one completed event, an imperfective one for what went on or was repeated.',
    '- Write ы, й, ь and ъ where they belong, and ё wherever it is said.',
    `- ${READINGS}`,
  ].join('\n'),
  lemmaForms: 'with its reading: nouns in the nominative singular (дом《dom》), adjectives in the masculine nominative singular (большой《bol\'shóy》), verbs in the infinitive (читать《chitát\'》)',
  weaveExample: [
    'at the edge of the forest||на《na》 краю《krayú》 леса《lésa》||край《kray》||m||noun||edge',
    'were wary of strangers||не《ne》 доверяли《doveryáli》 незнакомцам《neznakómtsam》||доверять《doveryát\'》||-||verb||to trust',
  ].join('\n'),
  pickExample: ['dog|dogs||собака《sobáka》', 'run|runs|running|ran||бежать《bezhát\'》', 'fast||быстрый《býstryy》'].join('\n'),
  // Russian is told from English by its script (`notEnglish`); the romanised forms catch a Russian line the
  // model wrote in Latin letters. Romanised words that are also English (a, i, on, no, my, u) are left out.
  functionWords: [
    ...'и в не на я что он она оно они мы вы ты с а как это все всё но по из у же за от так её его был была было были есть для уже ещё или только'.split(' '),
    ...'ne na ya chto ona ono oni vy ty kak eto vse vsyo zhe za ot tak yeyo eyo yego byl byla bylo byli yest dlya uzhe yeshcho yeshchyo ili tolko'.split(' '),
  ],
  writingNotes: READINGS,
  romanSample: { script: 'привет', roman: 'privét' },
  genderColors: { m: '#2b6cb0', f: '#b83280', n: '#2f855a' },
  citationForm(lemma, gender, pos) {
    return pos === 'noun' && gender !== '-' ? `${lemma} (${gender})` : lemma;
  },
};
