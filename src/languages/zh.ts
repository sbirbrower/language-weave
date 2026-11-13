import type { LanguageConfig } from './types';

// Readings: every word carries its pinyin in 《》 (src/ruby.ts), so a beginner can read it and code can
// drop it. Simplified characters, as in mainland China; pinyin with tone marks, word by word, the
// citation tones a dictionary gives. Chinese has no gender and no spaces between words. Chinese puts
// book titles in 《》, which would read as a reading, so titles go in “”.
const READINGS =
  'Write standard Mandarin in simplified characters, as used in mainland China, and give every word its pinyin with tone marks in 《》 straight after it, one reading per word as a dictionary splits them: 我《wǒ》是《shì》学生《xuéshēng》。 A reading covers every character back to the last reading or punctuation mark, so even a one-character word has its own (的《de》, 了《le》, 吗《ma》, 很《hěn》), and none is ever left out. Write each word’s pinyin as the dictionary has it: the tone mark on the vowel that takes it (hǎo, xiè, duō), the tone a character has on its own even where speech changes it (不《bù》, 一《yī》, 你《nǐ》好《hǎo》), no mark on a light syllable (喜欢《xǐhuan》, 东西《dōngxi》, 我们《wǒmen》), ü after n and l (女《nǚ》, 绿《lǜ》), an apostrophe before a syllable that starts with a, o or e inside a word (西安《Xī’ān》), a capital for names and places (中国《Zhōngguó》, 北京《Běijīng》), and no 儿 endings. Use Chinese punctuation (，。、？！：“”), no spaces between words. Never use 《》 for a book or film title: put titles in “”.';

export const zh: LanguageConfig = {
  code: 'zh',
  displayName: 'Chinese',
  flag: '🇨🇳',
  greeting: '你好',
  bcp47: 'zh-CN',
  speechLocale: 'cmn-CN',
  genders: [],
  grammarNotes: [
    '- Replace nouns, adjectives and verbs. English word order stays around the span, so keep inside it whatever Chinese orders differently.',
    '- Chinese has no articles and doesn’t mark the plural of things: "the dogs" → "狗《gǒu》", with the article inside the span.',
    '- A number takes a measure word; include the number in the span ("three books" → "三《sān》本《běn》书《shū》").',
    '- "of" and \'s turn round, with 的 inside the span ("the edge of the forest" → "森林《sēnlín》的《de》边缘《biānyuán》", "the king’s horse" → "国王《guówáng》的《de》马《mǎ》").',
    '- A place with in, on or under is framed by 在 and a word after the noun; include the preposition ("in the house" → "在《zài》房子《fángzi》里《lǐ》", "on the table" → "在《zài》桌子《zhuōzi》上《shàng》").',
    '- An adjective before a noun: one syllable straight before it (大《dà》房子《fángzi》), longer ones with 的 (漂亮《piàoliang》的《de》花《huā》); include the noun in the span. After "is" or "are", Chinese has no verb and uses 很: include the verb ("is big" → "很《hěn》大《dà》").',
    '- Verbs don’t change for person or tense: use the plain verb. Skip a verb whose Chinese needs its object or a complement in another place (a result like 完 or 到, a direction like 进来, 把, the passive with 被); pick a noun or an adjective instead.',
    `- ${READINGS}`,
  ].join('\n'),
  lemmaForms: 'the word as a dictionary lists it, with its pinyin: verbs and adjectives without 了, 过, 着 or 很 (跑《pǎo》, 快《kuài》), nouns without a measure word or 们 (狗《gǒu》)',
  weaveExample: [
    'at the edge of the forest||在《zài》森林《sēnlín》的《de》边缘《biānyuán》||边缘《biānyuán》||-||noun||edge',
    'were wary of strangers||提防《dīfang》陌生人《mòshēngrén》||提防《dīfang》||-||verb||to be wary of',
  ].join('\n'),
  pickExample: ['dog|dogs||狗《gǒu》', 'run|runs|running|ran||跑《pǎo》', 'fast||快《kuài》'].join('\n'),
  // Hanzi are told from English by their script (`notEnglish`); the pinyin (without tone marks) catches a
  // Chinese line the model wrote in Latin letters. Pinyin that is also English (you, he, women) is left out.
  functionWords: [
    ...'的 了 是 在 我 你 他 她 它 们 不 也 很 和 有 这 那 吗 呢 吧 就 都 一 个 说 要 会 去 没'.split(' '),
    ...'de le shi zai wo ni ta men tamen bu ye hen zhe na ma ne ba jiu dou yi ge shuo yao hui qu mei'.split(' '),
  ],
  writingNotes: READINGS,
  romanSample: { script: '中文', roman: 'zhōngwén' },
  genderColors: {},
  citationForm(lemma) {
    return lemma;
  },
};
