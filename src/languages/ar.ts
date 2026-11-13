import type { LanguageConfig } from './types';

// Readings: every Arabic word carries its romanisation in 《》 (src/ruby.ts), since a beginner can't read
// unvoweled Arabic, and the romanisation gives the vowels the script leaves out. Modern Standard Arabic as
// it's read aloud today: no case endings on nouns, no final -u on present verbs. Textbook transliteration
// (macrons, dotted emphatics, ʿ and ʾ). Arabic has spaces between words and is written right to left
// (src/direction.ts); the reader is spoken to in the masculine, as most courses do.
const READINGS =
  'Write Modern Standard Arabic as it is written on the web: without vowel marks (no fatha, kasra, damma, sukun, tanwin or shadda), with every hamza on its seat (أ, إ, آ, ؤ, ئ, ء), ة and ى where they belong (مدينة, على, مستشفى), and give every Arabic word its romanisation in 《》 straight after it: سلام《salām》, كتاب《kitāb》, شكرا《shukran》, مصر《miṣr》. One reading per word, never one for a phrase; a letter that joins the front of a word (و, ف, ب, ل, ك) and the article ال are part of it: البيت《al-bayt》, بالبيت《bil-bayt》, والكتاب《wal-kitāb》, للولد《lil-walad》, with a hyphen after a joined letter before a word without the article too: وكتب《wa-kutub》, بسرعة《bi-surʿa》, سيذهب《sa-yadhhab》. Never join a letter to a number; write a separate word (في《fī》 1948), and write numbers in Western digits. Romanise as MSA is read aloud today: leave off a noun\'s or adjective\'s case ending at the end of a word (kitāb, not kitābun; al-madīna kabīra) and a present verb\'s final -u (yaktub), but keep the past tense\'s endings (kataba, katabat, katabtu), the -an of adverbs and set phrases (shukran, jiddan, ahlan), and a word in full before a pronoun ending (baytuhu, baytī, baytunā). ة is -a at the end of a word (madrasa) and -at before the noun it belongs to (madrasat al-banāt). The article is al-, said as the next letter before a sun letter (ash-shams, ad-dars, an-nās, as-sayyāra). Use ā ī ū for long vowels, ay and aw for diphthongs, ḥ for ح, kh for خ, sh for ش, th for ث, dh for ذ, gh for غ, q for ق, j for ج, ṣ ḍ ṭ ẓ for ص ض ط ظ, ʿ for ع and ʾ for a hamza inside or at the end of a word (suʾāl, samāʾ; not at the start: amīr), and write a doubled consonant twice (ḥammām, madrasa). When a line speaks to the reader, use the masculine singular (أنت《anta》 تريد《turīd》). Punctuate with Arabic\'s comma، question mark؟ and semicolon؛, and . and ! as English does.';

export const ar: LanguageConfig = {
  code: 'ar',
  displayName: 'Arabic',
  flag: '🇸🇦',
  greeting: 'مرحبا',
  bcp47: 'ar',
  // Google's one Arabic voice is "Arabic (Generic)", ar-XA; ar is the page's lang and Whisper's language.
  speechLocale: 'ar-XA',
  genders: ['m', 'f'],
  grammarNotes: [
    '- The article ال joins the front of its noun, and there is no word for "a": "the house" → "البيت《al-bayt》", with the article inside the span. An adjective after a definite noun takes ال too ("the big house" → "البيت《al-bayt》 الكبير《al-kabīr》"); include the noun in the span when you replace such an adjective.',
    '- The prepositions ب (in, with, by), ل (for, to) and ك (like) and the conjunctions و (and) and ف join the front of the next word, and ل with the article is لل ("for the boy" → "للولد《lil-walad》", "with the pen" → "بالقلم《bil-qalam》"); في《fī》 (in), من《min》 (from), إلى《ilā》 (to) and على《ʿalā》 (on) stand apart ("in the house" → "في《fī》 البيت《al-bayt》"). Put the preposition in the span.',
    '- "Of" is usually the construct (iḍāfa): the first noun loses its article and its ة is read -at, the second takes ال when the whole is definite ("the edge of the forest" → "حافة《ḥāffat》 الغابة《al-ghāba》", "the door of the house" → "باب《bāb》 البيت《al-bayt》").',
    '- Adjectives follow the noun and agree in gender, number and definiteness: كبير《kabīr》, كبيرة《kabīra》; a plural of things or animals takes a feminine singular adjective ("the big houses" → "البيوت《al-buyūt》 الكبيرة《al-kabīra》"). Plurals are often irregular (كتاب《kitāb》, كتب《kutub》): use the right one.',
    '- The present tense has no "is" or "are": never weave them alone. Verbs agree with their subject in person, gender and number; keep the English order, subject first. Skip a verb whose object would have to join it as an ending (رأيته《raʾaytuhu》); pick a noun or an adjective instead.',
    '- "This" and "that" come before a noun with ال and agree with it: "this house" → "هذا《hādhā》 البيت《al-bayt》", "this city" → "هذه《hādhihi》 المدينة《al-madīna》"; include the noun in the span.',
    '- Skip a number with its noun: 3 to 10 take the opposite gender and two is a dual ending (كتابان《kitābān》). Weave the noun alone.',
    `- ${READINGS}`,
  ].join('\n'),
  lemmaForms: 'with its reading: nouns in the singular without the article (كتاب《kitāb》), adjectives in the masculine singular (كبير《kabīr》), verbs in the past tense\'s "he" form, as dictionaries give them (كتب《kataba》)',
  weaveExample: [
    'at the edge of the forest||على《ʿalā》 حافة《ḥāffat》 الغابة《al-ghāba》||حافة《ḥāffa》||f||noun||edge',
    'were wary of strangers||كانوا《kānū》 يحذرون《yaḥdharūn》 من《min》 الغرباء《al-ghurabāʾ》||حذر《ḥadhira》||-||verb||to be wary',
  ].join('\n'),
  pickExample: ['dog|dogs||كلب《kalb》', 'run|runs|running|ran||ركض《rakaḍa》', 'fast||سريع《sarīʿ》'].join('\n'),
  // Arabic is told from English by its script (`notEnglish`); the romanised forms catch an Arabic line the model
  // wrote in Latin letters, given without their macrons and dots. Romanised words that are also English (an, aw, anti, hum) are left out.
  functionWords: [
    ...'في من إلى على عن مع هذا هذه ذلك تلك هو هي هم أنا أنت نحن كان كانت ليس لا لم لن قد ما هل التي الذي كل بين عند أو ثم لكن أيضا جدا'.split(' '),
    ...'fi min ila ʿala ala ʿan maʿa hadha hadhihi dhalika tilka huwa hiya ana anta nahnu kana kanat laysa la lam lan qad ma hal alladhi allati kull bayna ʿinda thumma lakin lakinna aydan jiddan wa al shukran naʿam'.split(' '),
  ],
  writingNotes: READINGS,
  romanSample: { script: 'سلام', roman: 'salām' },
  genderColors: { m: '#2b6cb0', f: '#b83280' },
  citationForm(lemma, gender, pos) {
    return pos === 'noun' && gender !== '-' ? `${lemma} (${gender})` : lemma;
  },
};
