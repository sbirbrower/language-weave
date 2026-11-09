import type { LanguageConfig } from './types';

// Readings: every Hangul word carries its romanisation in 《》 (src/ruby.ts), so a beginner can read it and
// code can drop it. Revised Romanization as the standard applies it, following pronunciation (먹어요 meogeoyo,
// 한국말 hangungmal), plain ASCII. Korean has spaces between words, and particles join the word before them,
// so a reading covers the word with its particles. Polite 해요체 throughout, as most courses teach it.
const READINGS =
  'Write standard South Korean in Hangul, never Hanja, with the spacing Korean uses, particles joined to the word before them (학교에서, 저는), and give every Hangul word its romanisation in 《》 straight after it: 학교에《hakgyoe》, 먹어요《meogeoyo》, 감사합니다《gamsahamnida》, 한국어《hangugeo》. One reading per word as spaced, never one for a phrase: 저는《jeoneun》 학생이에요《haksaengieyo》. Romanise with the Revised Romanization of Korean as the standard applies it, following pronunciation: a final consonant carries over to a vowel after it (먹어요《meogeoyo》, 한국어《hangugeo》); ㄱ ㄷ ㅂ are g d b before a vowel and k t p before a consonant or at the end (학교《hakgyo》, 밥《bap》); ㄹ is r before a vowel and l elsewhere, ll when doubled (서울《seoul》, 빨리《ppalli》, 설날《seollal》); nasalisation as said (한국말《hangungmal》, 합니다《hamnida》, 십만《simman》); ㅎ with a consonant gives its aspirate (좋고《joko》, 축하해요《chukahaeyo》), and a silent ㅎ is left out (좋아요《joayo》); palatalisation as said (같이《gachi》, 굳이《guji》); tense consonants that are only heard are not marked (학교《hakgyo》, 식당《sikdang》). Vowels: ㅓ eo, ㅡ eu, ㅐ ae, ㅔ e, ㅚ oe, ㅟ wi, ㅢ ui, ㅘ wa, ㅝ wo, ㅙ wae, ㅞ we, ㅕ yeo, ㅛ yo, ㅠ yu. Lower case, except a capital for the names of people and places (서울《Seoul》, 김민지《Gim Minji》). A number in digits keeps its digits and takes the reading of the whole with ｜, so it shows how the number is said: ｜3시《se si》, ｜2024년《icheonisipsanyeon》. Write in the polite 해요체 style (-아요/-어요) unless a line is an announcement, the news or a sign (합니다체) or two friends talking (반말); never mix styles in one line. Punctuate as English does: . , ? ! and “ ”.';

export const ko: LanguageConfig = {
  code: 'ko',
  displayName: 'Korean',
  flag: '🇰🇷',
  bcp47: 'ko-KR',
  genders: [],
  grammarNotes: [
    '- Replace nouns, adjectives and verbs. English word order stays around the span, so keep inside it whatever Korean orders differently.',
    '- Korean has no articles and seldom marks the plural: "the dogs" → "개《gae》", with the article inside the span. A noun that is the subject or object in English stays bare, without 이/가 or 을/를, since the English around it shows its role.',
    '- English prepositions are particles after the noun in Korean; put the preposition in the span and join the particle to the noun ("in the house" → "집에서《jibeseo》", "to school" → "학교에《hakgyoe》", "by bus" → "버스로《beoseuro》"). Pick the particle’s form by whether the noun ends in a consonant (으로/로, 과/와, 이/가, 을/를, 은/는).',
    '- "of" and \'s turn round: the owner comes first, mostly without 의 ("the edge of the forest" → "숲《sup》 가장자리《gajangjari》", "the king’s horse" → "왕의《wangui》 말《mal》"); include both nouns.',
    '- Adjectives are verbs in Korean. Before a noun they take the modifier form (큰《keun》 집《jip》, 작은《jageun》 개《gae》, 빠른《ppareun》 차《cha》); include the noun in the span. After "is" or "are", put the verb in the span and use the polite form ("is big" → "커요《keoyo》", "was cold" → "추웠어요《chuwosseoyo》").',
    '- A verb comes last in Korean, after its object: replace a verb only with its object inside the span, in Korean order ("eat apples" → "사과를《sagwareul》 먹어요《meogeoyo》"), in the polite form for the tense the English uses. Otherwise skip the verb, and skip honorific forms and verbs that need a clause before them; pick a noun or an adjective instead.',
    '- A number takes a counter after the noun; include the number in the span ("three books" → "책《chaek》 세《se》 권《gwon》").',
    `- ${READINGS}`,
  ].join('\n'),
  lemmaForms: 'the dictionary form, with its reading: verbs and adjectives ending in -다 (먹다《meokda》, 크다《keuda》), nouns without particles or 들 (개《gae》)',
  weaveExample: [
    'at the edge of the forest||숲《sup》 가장자리에《gajangjarie》||가장자리《gajangjari》||-||noun||edge',
    'strangers||낯선《natseon》 사람들《saramdeul》||낯선《natseon》 사람《saram》||-||noun||stranger',
  ].join('\n'),
  pickExample: ['dog|dogs||개《gae》', 'run|runs|running|ran||달리다《dallida》', 'fast||빠르다《ppareuda》'].join('\n'),
  // Hangul is told from English by its script (`notEnglish`); the romanised forms catch a Korean line the model
  // wrote in Latin letters. Romanised words that are also English (i, a, go, do, an, son, man, bad) are left out.
  functionWords: [
    ...'저는 나는 저 나 우리 제 내 이 그 저것 이것 그것 여기 거기 네 아니요 있어요 없어요 이에요 예요 아니에요 그리고 하지만 그래서 아주 정말 좀 안 못 뭐 어디 언제 누가 왜 어떻게 많이 더 잘 다 또'.split(' '),
    ...'jeoneun naneun jeo na uri je nae geu igeot geugeot igeo geugeo yeogi geogi ne aniyo isseoyo eopseoyo ieyo yeyo anieyo geurigo hajiman geuraeseo aju jeongmal jom mot mwo eodi eonje nuga wae eotteoke mani deo jal tto juseyo haeyo'.split(' '),
  ],
  writingNotes: READINGS,
  romanSample: { script: '한글', roman: 'hangeul' },
  genderColors: {},
  citationForm(lemma) {
    return lemma;
  },
};
