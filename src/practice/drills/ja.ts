import type { DrillData, Letter } from './types';

/**
 * Kana as the first two lessons teach them (`src/syllabus/ja.ts`): hiragana in the first, katakana
 * in the second, in Hepburn romaji. を, ぢ and づ are left out, since they say what お, じ and ず say.
 */
const ROMAJI = 'a i u e o ka ki ku ke ko sa shi su se so ta chi tsu te to na ni nu ne no ha hi fu he ho ma mi mu me mo ya yu yo ra ri ru re ro wa n ga gi gu ge go za ji zu ze zo da de do ba bi bu be bo pa pi pu pe po'.split(' ');
const HIRAGANA = [...'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわんがぎぐげござじずぜぞだでどばびぶべぼぱぴぷぺぽ'];
const KATAKANA = [...'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワンガギグゲゴザジズゼゾダデドバビブベボパピプペポ'];
const LIKE: Record<string, string> = { r: 'between r, l and d', fu: 'breathed through the lips, not bitten', tsu: 'as in cats', n: 'a beat of its own' };

const kana = (letters: string[], set: string, at: number): Letter[] =>
  letters.map((letter, i) => {
    const sound = ROMAJI[i]!;
    const like = LIKE[sound] ?? (sound.startsWith('r') ? LIKE.r : undefined);
    return { letter, sound, say: letter, at, set, ...(like ? { like } : {}) };
  });

const KANJI = [...'一二三四五六七八九十'];
const SINO = ['いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう', 'じゅう'];
/** The numbers cut short before a counter that becomes p: いっぽん. */
const CUT: Record<number, string> = { 1: 'いっ', 6: 'ろっ', 8: 'はっ', 10: 'じゅっ' };

/**
 * 1 to 10 of a counter starting with h (本, 杯): its readings, and as wrong answers the number with each of
 * the counter's sounds (h, b, p), or cut short before p; `also` are right too, so never wrong answers.
 */
function hCounter(kanji: string, sounds: [string, string, string], readings: string[], also: string[]) {
  return readings.map((reading, i) => {
    const n = i + 1;
    const guesses = [...sounds.map((s) => SINO[i] + s), ...(CUT[n] ? [CUT[n] + sounds[2]] : [])];
    return { n, text: KANJI[i] + kanji, reading, wrong: guesses.filter((g) => g !== reading && !also.includes(g)) };
  });
}

/** 1 to 10 with つ, in Japanese numbers (10 has no つ), with the readings a learner gives instead. */
const TSU: Array<[string, string, string[]]> = [
  ['一つ', 'ひとつ', ['いちつ', 'ひとっつ']],
  ['二つ', 'ふたつ', ['につ', 'ふたっつ']],
  ['三つ', 'みっつ', ['さんつ', 'みつ']],
  ['四つ', 'よっつ', ['よんつ', 'しつ']],
  ['五つ', 'いつつ', ['ごつ', 'いっつ']],
  ['六つ', 'むっつ', ['ろくつ', 'ろっつ']],
  ['七つ', 'ななつ', ['しちつ', 'なつ']],
  ['八つ', 'やっつ', ['はちつ', 'はっつ']],
  ['九つ', 'ここのつ', ['きゅうつ', 'ここのっつ']],
  ['十', 'とお', ['じゅうつ', 'とおつ']],
];

/** An u-verb's ending, its て-form ending, and its ます-stem's (the い row). */
const GODAN: Record<string, { te: string; i: string }> = {
  う: { te: 'って', i: 'い' },
  つ: { te: 'って', i: 'ち' },
  る: { te: 'って', i: 'り' },
  む: { te: 'んで', i: 'み' },
  ぶ: { te: 'んで', i: 'び' },
  ぬ: { te: 'んで', i: 'に' },
  く: { te: 'いて', i: 'き' },
  ぐ: { te: 'いで', i: 'ぎ' },
  す: { te: 'して', i: 'し' },
};

/** Verbs by their stem (with its reading), last kana and group; `trap` for an u-verb that looks like a る-verb. */
const VERBS: Array<{ stem: string; end: string; en: string; group: 'u' | 'ru'; trap?: true }> = [
  { stem: '書《か》', end: 'く', en: 'write', group: 'u' },
  { stem: '聞《き》', end: 'く', en: 'listen', group: 'u' },
  { stem: '泳《およ》', end: 'ぐ', en: 'swim', group: 'u' },
  { stem: '話《はな》', end: 'す', en: 'speak', group: 'u' },
  { stem: '待《ま》', end: 'つ', en: 'wait', group: 'u' },
  { stem: '買《か》', end: 'う', en: 'buy', group: 'u' },
  { stem: '飲《の》', end: 'む', en: 'drink', group: 'u' },
  { stem: '読《よ》', end: 'む', en: 'read', group: 'u' },
  { stem: '遊《あそ》', end: 'ぶ', en: 'play', group: 'u' },
  { stem: '作《つく》', end: 'る', en: 'make', group: 'u' },
  { stem: '帰《かえ》', end: 'る', en: 'go home', group: 'u', trap: true },
  { stem: '入《はい》', end: 'る', en: 'go in', group: 'u', trap: true },
  { stem: '走《はし》', end: 'る', en: 'run', group: 'u', trap: true },
  { stem: '知《し》', end: 'る', en: 'get to know', group: 'u', trap: true },
  { stem: '食《た》べ', end: 'る', en: 'eat', group: 'ru' },
  { stem: '見《み》', end: 'る', en: 'see', group: 'ru' },
  { stem: '起《お》き', end: 'る', en: 'get up', group: 'ru' },
  { stem: '寝《ね》', end: 'る', en: 'sleep', group: 'ru' },
  { stem: '教《おし》え', end: 'る', en: 'teach', group: 'ru' },
  { stem: '出《で》かけ', end: 'る', en: 'go out', group: 'ru' },
];

/** Each verb's て-form, and as wrong ones the other groups' endings and the ます-stem with て. */
function teForms() {
  const regular = VERBS.map((v) => {
    const dict = v.stem + v.end;
    if (v.group === 'ru') {
      return { text: dict, en: v.en, form: `${v.stem}て`, wrong: [`${v.stem}って`, `${v.stem}りて`, `${v.stem}んで`], why: `${dict} is a る-verb: drop る and add て.` };
    }
    const g = GODAN[v.end]!;
    const form = v.stem + g.te;
    const wrong = [...new Set([`${v.stem}${g.i}て`, ...['って', 'んで', 'いて'].map((e) => v.stem + e)])].filter((w) => w !== form);
    const why = v.trap ? `${dict} looks like a る-verb but is an u-verb: る → って.` : `${dict} is an u-verb: ${v.end} → ${g.te}.`;
    return { text: dict, en: v.en, form, wrong, why };
  });
  return [
    ...regular,
    { text: '行《い》く', en: 'go', form: '行《い》って', wrong: ['行《い》いて', '行《い》きて', '行《い》んで'], why: '行《い》く is the one く-verb that doesn’t take いて: 行《い》って.' },
    { text: 'する', en: 'do', form: 'して', wrong: ['すって', 'すて', 'しって'], why: 'する is irregular: して.' },
    { text: '来《く》る', en: 'come', form: '来《き》て', wrong: ['来《く》って', '来《く》て', '来《こ》て'], why: '来《く》る is irregular: 来《き》て, said きて.' },
  ];
}

export const JA_DRILLS: DrillData = {
  lessons: 4,
  letters: {
    list: [...kana(HIRAGANA, 'hiragana', 0), ...kana(KATAKANA, 'katakana', 1)],
    alike: [
      ['ね', 'れ', 'わ'],
      ['ぬ', 'め'],
      ['は', 'ほ', 'け'],
      ['ま', 'も'],
      ['さ', 'き', 'ち'],
      ['る', 'ろ'],
      ['い', 'り', 'こ'],
      ['あ', 'お'],
      ['く', 'へ'],
      ['し', 'つ'],
      ['た', 'な'],
      ['シ', 'ツ', 'ソ', 'ン'],
      ['ク', 'ケ', 'タ'],
      ['ウ', 'ワ', 'フ'],
      ['コ', 'ユ', 'ロ'],
      ['ナ', 'メ', 'ノ'],
      ['チ', 'テ'],
      ['ス', 'ヌ'],
      ['マ', 'ム', 'ア'],
    ],
  },
  kanaPairs: [['シ', 'ツ', 'ソ', 'ン'], ['ク', 'ケ', 'タ'], ['ウ', 'ワ', 'フ'], ['コ', 'ユ', 'ロ'], ['ナ', 'メ', 'ノ'], ['チ', 'テ'], ['ス', 'ヌ'], ['マ', 'ム', 'ア']],
  loans: [
    { text: 'コーヒー', roman: 'kōhī', en: 'coffee', at: 1 },
    { text: 'テレビ', roman: 'terebi', en: 'television', at: 1 },
    { text: 'パン', roman: 'pan', en: 'bread', at: 1 },
    { text: 'ホテル', roman: 'hoteru', en: 'hotel', at: 1 },
    { text: 'バス', roman: 'basu', en: 'bus', at: 1 },
    { text: 'タクシー', roman: 'takushī', en: 'taxi', at: 1 },
    { text: 'カメラ', roman: 'kamera', en: 'camera', at: 1 },
    { text: 'ピザ', roman: 'piza', en: 'pizza', at: 1 },
    { text: 'ケーキ', roman: 'kēki', en: 'cake', at: 1 },
    { text: 'ジュース', roman: 'jūsu', en: 'juice', at: 1 },
    { text: 'ノート', roman: 'nōto', en: 'notebook', at: 1 },
    { text: 'テスト', roman: 'tesuto', en: 'test', at: 1 },
    { text: 'レストラン', roman: 'resutoran', en: 'restaurant', at: 1 },
    { text: 'アイスクリーム', roman: 'aisukurīmu', en: 'ice cream', at: 1 },
  ],
  // Words told apart by a beat: a long vowel, a small っ, a small ゃ or ょ, or ん; the third lesson's pronunciation point.
  pairs: [
    { words: [{ text: 'おばさん', en: 'aunt' }, { text: 'おばあさん', en: 'grandmother' }], why: 'ばあ is held for two beats, ば for one: Japanese counts every beat.', at: 2 },
    { words: [{ text: 'おじさん', en: 'uncle' }, { text: 'おじいさん', en: 'grandfather' }], why: 'じい is held for two beats, じ for one.', at: 2 },
    { words: [{ text: 'ここ', en: 'here' }, { text: 'こうこう', en: 'high school' }], why: 'こう is a long o, held for two beats.', at: 2 },
    { words: [{ text: 'とり', en: 'bird' }, { text: 'とおり', en: 'street' }], why: 'とお is a long o, held for two beats.', at: 2 },
    { words: [{ text: 'ゆき', en: 'snow' }, { text: 'ゆうき', en: 'courage' }], why: 'ゆう is a long u, held for two beats.', at: 2 },
    { words: [{ text: 'おと', en: 'sound' }, { text: 'おっと', en: 'husband' }], why: 'The small っ is a beat of silence: a short stop before the next sound.', at: 2 },
    { words: [{ text: 'さか', en: 'slope' }, { text: 'さっか', en: 'writer' }], why: 'The small っ is a beat of silence: a short stop before the next sound.', at: 2 },
    { words: [{ text: 'かこ', en: 'the past' }, { text: 'かっこ', en: 'brackets' }], why: 'The small っ is a beat of silence: a short stop before the next sound.', at: 2 },
    { words: [{ text: 'びょういん', en: 'hospital' }, { text: 'びよういん', en: 'beauty salon' }], why: 'びょ, with a small ょ, is one beat; び and よ are two.', at: 2 },
    { words: [{ text: 'じゅう', en: 'ten' }, { text: 'じゆう', en: 'freedom' }], why: 'じゅ, with a small ゅ, is one beat; じ and ゆ are two.', at: 2 },
    { words: [{ text: 'きんえん', en: 'no smoking' }, { text: 'きねん', en: 'anniversary' }], why: 'ん is a beat of its own: きん-えん, not き-ねん.', at: 2 },
    { words: [{ text: 'たんい', en: 'unit' }, { text: 'たに', en: 'valley' }], why: 'ん is a beat of its own: たん-い, not た-に.', at: 2 },
    { words: [{ text: 'ビル', en: 'building' }, { text: 'ビール', en: 'beer' }], why: 'ー holds the vowel for another beat.', at: 2 },
    { words: [{ text: 'セル', en: 'cell' }, { text: 'セール', en: 'sale' }], why: 'ー holds the vowel for another beat.', at: 2 },
  ],
  // As the food lesson teaches them (`ja-a1-tabemono`).
  counters: {
    at: 10,
    list: [
      {
        counter: '本《ほん》',
        counts: 'long, thin things',
        things: [{ text: '鉛筆《えんぴつ》', en: 'pencils' }, { text: '傘《かさ》', en: 'umbrellas' }, { text: 'バナナ', en: 'bananas' }, { text: 'ペン', en: 'pens' }],
        rule: 'ほん becomes ぽん after 1, 6, 8 and 10 (いっぽん, ろっぽん, はっぽん, じゅっぽん) and ぼん after 3 (さんぼん); after the others it stays ほん.',
        numbers: hCounter('本', ['ほん', 'ぼん', 'ぽん'], ['いっぽん', 'にほん', 'さんぼん', 'よんほん', 'ごほん', 'ろっぽん', 'ななほん', 'はっぽん', 'きゅうほん', 'じゅっぽん'], ['はちほん', 'じっぽん', 'しちほん']),
      },
      {
        counter: '杯《はい》',
        counts: 'cups, glasses and bowls of something',
        things: [{ text: 'コーヒー', en: 'cups of coffee' }, { text: 'お茶《ちゃ》', en: 'cups of tea' }, { text: '水《みず》', en: 'glasses of water' }, { text: 'ご飯《はん》', en: 'bowls of rice' }],
        rule: 'はい becomes ぱい after 1, 6, 8 and 10 (いっぱい, ろっぱい, はっぱい, じゅっぱい) and ばい after 3 (さんばい); after the others it stays はい.',
        numbers: hCounter('杯', ['はい', 'ばい', 'ぱい'], ['いっぱい', 'にはい', 'さんばい', 'よんはい', 'ごはい', 'ろっぱい', 'ななはい', 'はっぱい', 'きゅうはい', 'じゅっぱい'], ['はちはい', 'じっぱい', 'しちはい']),
      },
      {
        counter: '枚《まい》',
        counts: 'flat, thin things',
        things: [{ text: '切手《きって》', en: 'stamps' }, { text: '紙《かみ》', en: 'sheets of paper' }, { text: 'シャツ', en: 'shirts' }, { text: '皿《さら》', en: 'plates' }, { text: '写真《しゃしん》', en: 'photos' }],
        numbers: [],
      },
      {
        counter: 'つ',
        counts: 'things with no counter of their own',
        things: [{ text: 'りんご', en: 'apples' }, { text: '卵《たまご》', en: 'eggs' }, { text: 'みかん', en: 'mandarins' }, { text: 'おにぎり', en: 'rice balls' }],
        rule: 'With つ, 1 to 9 take the Japanese numbers (ひと, ふた, みっ, よっ, いつ, むっ, なな, やっ, ここの), and 10 is とお, with no つ.',
        numbers: TSU.map(([text, reading, wrong], i) => ({ n: i + 1, text, reading, wrong })),
      },
    ],
  },
  // Hiragana's small kana, in the first lesson; katakana's in the second.
  smallKana: {
    small: {
      ゃ: { big: 'や', note: 'so it joins the kana before it in one beat' },
      ゅ: { big: 'ゆ', note: 'so it joins the kana before it in one beat' },
      ょ: { big: 'よ', note: 'so it joins the kana before it in one beat' },
      っ: { big: 'つ', note: 'a beat of silence before the next sound' },
      ャ: { big: 'ヤ', note: 'so it joins the kana before it in one beat' },
      ュ: { big: 'ユ', note: 'so it joins the kana before it in one beat' },
      ョ: { big: 'ヨ', note: 'so it joins the kana before it in one beat' },
      ッ: { big: 'ツ', note: 'a beat of silence before the next sound' },
    },
    words: [
      { text: 'きょう', roman: 'kyō', en: 'today', at: 0 },
      { text: 'しゃしん', roman: 'shashin', en: 'photo', at: 0 },
      { text: 'ちょっと', roman: 'chotto', en: 'a little', at: 0 },
      { text: 'がっこう', roman: 'gakkō', en: 'school', at: 0 },
      { text: 'きって', roman: 'kitte', en: 'stamp', at: 0 },
      { text: 'りょこう', roman: 'ryokō', en: 'travel', at: 0 },
      { text: 'おちゃ', roman: 'ocha', en: 'tea', at: 0 },
      { text: 'しゅくだい', roman: 'shukudai', en: 'homework', at: 0 },
      { text: 'きゅうり', roman: 'kyūri', en: 'cucumber', at: 0 },
      { text: 'にっき', roman: 'nikki', en: 'diary', at: 0 },
      { text: 'シャツ', roman: 'shatsu', en: 'shirt', at: 1 },
      { text: 'チョコ', roman: 'choko', en: 'chocolate', at: 1 },
      { text: 'ベッド', roman: 'beddo', en: 'bed', at: 1 },
      { text: 'ニュース', roman: 'nyūsu', en: 'news', at: 1 },
    ],
  },
  // English words in katakana, with the second lesson's ー and ッ.
  spelling: {
    at: 1,
    why: 'English words are written in katakana as Japanese says them: a long vowel with ー, a doubled consonant with ッ, and a vowel after every consonant but ン',
    words: [
      { text: 'コンピューター', en: 'computer', wrong: ['コンピュタ', 'コンプーター', 'コンピューダー'] },
      { text: 'サッカー', en: 'soccer', wrong: ['サカー', 'サッカ', 'ザッカー'] },
      { text: 'ホテル', en: 'hotel', wrong: ['ホーテル', 'ホテール', 'ホテッル'] },
      { text: 'チケット', en: 'ticket', wrong: ['チケト', 'チッケト', 'チケートゥ'] },
      { text: 'スーパー', en: 'supermarket', wrong: ['スパー', 'スーパ', 'スッパー'] },
      { text: 'インターネット', en: 'internet', wrong: ['インタネト', 'インターネト', 'インタネット'] },
      { text: 'ハンバーガー', en: 'hamburger', wrong: ['ハンバガー', 'ハンバーガ', 'ハムバーガー'] },
      { text: 'テーブル', en: 'table', wrong: ['テブル', 'テーブール', 'テブール'] },
      { text: 'エレベーター', en: 'elevator', wrong: ['エレベタ', 'エレベーダー', 'エレベター'] },
      { text: 'ベッド', en: 'bed', wrong: ['ベド', 'ベット', 'ベッドゥ'] },
    ],
  },
  // は, へ and を as particles, from the second lesson's pronunciation point; は and へ in other words keep their sound.
  saidAs: {
    at: 1,
    ask: 'Tap every kana not said the way it’s written.',
    why: 'As particles, は is said わ, へ is said え and を is said お; in other words (はな, へや) they keep their own sound.',
    sentences: [
      { text: 'わたし[は] がっこう[へ] いきます。', en: 'I go to school.' },
      { text: 'はなこさん[は] はなが すきです。', en: 'Hanako likes flowers.' },
      { text: 'へやで ほん[を] よみます。', en: 'I read a book in my room.' },
      { text: 'はは[は] へやに います。', en: 'My mother is in her room.' },
      { text: 'こんにち[は]。', en: 'Hello.' },
      { text: 'こんばん[は]。', en: 'Good evening.' },
      { text: 'あした うち[へ] かえります。', en: 'Tomorrow I’m going home.' },
      { text: 'はい、 みず[を] ください。', en: 'Yes, water, please.' },
    ],
  },
  // これ and この, from the third lesson.
  demonstratives: {
    at: 2,
    places: [
      { where: 'near you', alone: 'これ', before: 'この', en: 'this' },
      { where: 'near the person you’re talking to', alone: 'それ', before: 'その', en: 'that' },
      { where: 'away from you both', alone: 'あれ', before: 'あの', en: 'that' },
    ],
    nouns: [{ text: 'かばん', en: 'bag' }, { text: '本《ほん》', en: 'book' }, { text: '傘《かさ》', en: 'umbrella' }, { text: '時計《とけい》', en: 'watch' }, { text: '車《くるま》', en: 'car' }],
    alone: [
      { text: '___は何《なん》ですか。', en: 'What is ___?' },
      { text: '___は私《わたし》のです。', en: '___ is mine.' },
      { text: '___をください。', en: 'I’ll have ___, please.' },
    ],
    before: [
      { text: '___{noun}はいくらですか。', en: 'How much is ___ {noun}?' },
      { text: '___{noun}は誰《だれ》のですか。', en: 'Whose is ___ {noun}?' },
      { text: '___{noun}をください。', en: 'I’ll have ___ {noun}, please.' },
    ],
    why: 'これ, それ and あれ stand alone; この, その and あの go before a noun.',
  },
  // Greetings and introductions from the first lesson; at home, at meals and on a visit from the third.
  phrases: [
    { when: 'Meeting your teacher in the morning', text: 'おはようございます', en: 'Good morning', group: 'greet', at: 0 },
    { when: 'Meeting a neighbour in the afternoon', text: 'こんにちは', en: 'Hello', group: 'greet', at: 0 },
    { when: 'Meeting a neighbour in the evening', text: 'こんばんは', en: 'Good evening', group: 'greet', at: 0 },
    { when: 'Going to bed', text: 'おやすみなさい', en: 'Good night', group: 'greet', at: 0 },
    { when: 'Meeting someone for the first time, before your name', text: 'はじめまして', en: 'Nice to meet you', group: 'meet', at: 0 },
    { when: 'Ending your introduction', text: 'よろしくお願《ねが》いします', en: 'I hope we get on well', group: 'meet', at: 0 },
    { when: 'Leaving home in the morning', text: 'いってきます', en: 'I’m off', group: 'home', at: 2 },
    { when: 'Someone in your family leaves home', text: 'いってらっしゃい', en: 'See you later', group: 'home', at: 2 },
    { when: 'Coming home', text: 'ただいま', en: 'I’m home', group: 'home', at: 2 },
    { when: 'Someone in your family comes home', text: 'おかえりなさい', en: 'Welcome home', group: 'home', at: 2 },
    { when: 'Before you start eating', text: 'いただきます', en: 'Let’s eat (thank you for this food)', group: 'meal', at: 2 },
    { when: 'After a meal', text: 'ごちそうさまでした', en: 'Thank you for the meal', group: 'meal', at: 2 },
    { when: 'Going into a friend’s home', text: 'おじゃまします', en: 'Sorry to intrude', group: 'visit', at: 2 },
    { when: 'Leaving your teacher’s office', text: '失礼《しつれい》します', en: 'Excuse me (for leaving)', group: 'visit', at: 2 },
  ],
  // The time in the daily life lesson (`ja-a1-mainichi`), people in the family one (`ja-a1-kazoku`), dates in the weather one (`ja-a1-tenki`).
  readings: [
    {
      at: 3,
      rule: 'Most hours are the number and 時《じ》, but 4 o’clock is よじ and 9 o’clock is くじ.',
      list: [
        { text: '四時', reading: 'よじ', en: '4 o’clock', wrong: ['よんじ', 'しじ', 'よっじ'] },
        { text: '九時', reading: 'くじ', en: '9 o’clock', wrong: ['きゅうじ', 'ここのじ', 'くうじ'] },
        { text: '四時半', reading: 'よじはん', en: 'half past 4', wrong: ['よんじはん', 'しじはん'] },
        { text: '九時半', reading: 'くじはん', en: 'half past 9', wrong: ['きゅうじはん', 'ここのじはん'] },
        { text: '一時', reading: 'いちじ', en: '1 o’clock', wrong: ['ひとじ', 'いっじ'] },
        { text: '六時', reading: 'ろくじ', en: '6 o’clock', wrong: ['むじ', 'ろっじ'] },
        { text: '十時', reading: 'じゅうじ', en: '10 o’clock', wrong: ['とおじ', 'じゅっじ'] },
        { text: '何時', reading: 'なんじ', en: 'what time', wrong: ['なにじ', 'なんにち'] },
      ],
    },
    {
      at: 8,
      rule: 'One and two people are ひとり and ふたり; from three it’s the number and 人《にん》, with four as よにん.',
      list: [
        { text: '一人', reading: 'ひとり', en: '1 person', wrong: ['いちにん', 'ひとにん'] },
        { text: '二人', reading: 'ふたり', en: '2 people', wrong: ['ににん', 'ふたにん'] },
        { text: '三人', reading: 'さんにん', en: '3 people', wrong: ['みにん', 'さんり'] },
        { text: '四人', reading: 'よにん', en: '4 people', wrong: ['よんにん', 'しにん'] },
        { text: '五人', reading: 'ごにん', en: '5 people', wrong: ['いつにん', 'ごり'] },
        { text: '何人', reading: 'なんにん', en: 'how many people', wrong: ['なにじん', 'なんり'] },
      ],
    },
    {
      at: 9,
      rule: 'The 1st to the 10th of the month have Japanese readings (ついたち, ふつか, みっか…), as do the 14th and the 20th (じゅうよっか, はつか); the rest are the number and 日《にち》. April, July and September are しがつ, しちがつ and くがつ.',
      list: [
        { text: '一日', reading: 'ついたち', en: 'the 1st of the month', wrong: ['いちにち', 'ひとひ'] },
        { text: '二日', reading: 'ふつか', en: 'the 2nd', wrong: ['ににち', 'ふたか'] },
        { text: '三日', reading: 'みっか', en: 'the 3rd', wrong: ['さんにち', 'みか'] },
        { text: '四日', reading: 'よっか', en: 'the 4th', wrong: ['よんにち', 'よか'] },
        { text: '五日', reading: 'いつか', en: 'the 5th', wrong: ['ごにち', 'いっか'] },
        { text: '六日', reading: 'むいか', en: 'the 6th', wrong: ['ろくにち', 'むっか'] },
        { text: '七日', reading: 'なのか', en: 'the 7th', wrong: ['しちにち', 'ななか'] },
        { text: '八日', reading: 'ようか', en: 'the 8th', wrong: ['はちにち', 'やっか'] },
        { text: '九日', reading: 'ここのか', en: 'the 9th', wrong: ['くにち', 'きゅうにち'] },
        { text: '十日', reading: 'とおか', en: 'the 10th', wrong: ['じゅうにち', 'とおにち'] },
        { text: '十四日', reading: 'じゅうよっか', en: 'the 14th', wrong: ['じゅうよんにち', 'じゅうしにち'] },
        { text: '二十日', reading: 'はつか', en: 'the 20th', wrong: ['にじゅうにち', 'ふたじゅうか'] },
        { text: '四月', reading: 'しがつ', en: 'April', wrong: ['よんがつ', 'よがつ'] },
        { text: '七月', reading: 'しちがつ', en: 'July', wrong: ['ななつき', 'ななげつ'] },
        { text: '九月', reading: 'くがつ', en: 'September', wrong: ['きゅうがつ', 'ここのつき'] },
      ],
    },
  ],
  // The て-form lesson (`ja-a1-te-kudasai`).
  forms: { at: 7, name: 'て-form', list: teForms() },
  wordSorts: [
    {
      at: 7,
      ask: 'Is each verb a る-verb or an u-verb?',
      labels: ['る-verb', 'u-verb'],
      words: VERBS.map((v) => ({ text: v.stem + v.end, en: v.en, label: v.group === 'ru' ? 0 : 1 })),
      why: 'A る-verb ends in -iru or -eru (食《た》べる, 見《み》る); every verb that doesn’t is an u-verb. Some that do are u-verbs all the same (帰《かえ》る, 入《はい》る, 走《はし》る, 知《し》る): learn them as you meet them.',
    },
  ],
};
