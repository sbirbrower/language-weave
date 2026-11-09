import { describe, expect, it } from 'vitest';
import { grammarFor, LEVELS } from '../src/grammar';
import { getLanguage, languages } from '../src/languages';
import { isRtl, setDirection } from '../src/direction';
import { a1WordsFor } from '../src/lessons/a1';
import { easyWordsFor } from '../src/lessons/easy';
import { notEnglish } from '../src/passage/checks';
import { fillPieceReadings, wordPresent, type Piece } from '../src/passage/piece';
import { fillReadings, readingCount, readingsInBrackets, readingsOnly, RTL_CLASS, rubyNodes, rubySpans, splitWords, withoutReadings } from '../src/ruby';
import { speechBody } from '../src/speech';
import { lessonsFor } from '../src/syllabus';
import { sameAnswer } from '../src/widget';

describe('readings', () => {
  const text = 'お茶《ちゃ》を食《た》べる日本語《にほんご》と｜ヶ月《かげつ》。';

  it('splits text into bases with their readings', () => {
    expect(rubySpans(text)).toEqual([
      { text: 'お' }, { text: '茶', reading: 'ちゃ' }, { text: 'を' }, { text: '食', reading: 'た' }, { text: 'べる' },
      { text: '日本語', reading: 'にほんご' }, { text: 'と' }, { text: 'ヶ月', reading: 'かげつ' }, { text: '。' },
    ]);
  });

  it('drops readings, keeps only them, or brackets them', () => {
    expect(withoutReadings(text)).toBe('お茶を食べる日本語とヶ月。');
    expect(readingsOnly(text)).toBe('おちゃをたべるにほんごとかげつ。');
    expect(readingsInBrackets('食《た》べる')).toBe('食(た)べる');
  });

  it('leaves text without readings alone', () => {
    expect(rubySpans('Bonjour !')).toEqual([{ text: 'Bonjour !' }]);
    expect(withoutReadings('Bonjour !')).toBe('Bonjour !');
  });

  it('draws readings as ruby, with romaji under a Japanese word', () => {
    const p = document.createElement('p');
    p.append(...rubyNodes(document, '食《た》べる'));
    expect(p.innerHTML).toBe('<span class="tissage-rm"><span><ruby>食<rt>た</rt></ruby>べる</span><span class="tissage-rm-text">taberu</span></span>');
    p.replaceChildren(...rubyNodes(document, 'घर《ghar》'));
    expect(p.innerHTML).toBe('<ruby class="tissage-rr"><span>घर</span><rt>ghar</rt></ruby>');
  });

  it('speaks the text without its readings', () => {
    expect(speechBody('食《た》べる', 'ja-JP').input.text).toBe('食べる');
  });
});

describe('readingCount', () => {
  it('counts the words that take a reading, and those without one', () => {
    expect(readingCount('日本語《にほんご》の学生')).toEqual({ words: 2, unread: 1 });
    expect(readingCount('お茶《ちゃ》を食《た》べる')).toEqual({ words: 2, unread: 0 });
    expect(readingCount('बड़ा《baṛā》 घर में')).toEqual({ words: 3, unread: 2 });
    expect(readingCount('학교에《hakgyoe》 가요《gayo》, книга')).toEqual({ words: 3, unread: 1 });
    expect(readingCount('Il vit en Asie.')).toEqual({ words: 0, unread: 0 });
  });
});

describe('fillReadings', () => {
  const piece = ['母《はは》は髪《かみ》が長《なが》くて、きれいです。', '友達《ともだち》のお母《かあ》さんは二十歳《はたち》です。'];

  it('copies readings from where the sources write the same kanji', () => {
    expect(fillReadings('The pattern 母は髪が長くて links adjectives.', piece)).toBe('The pattern 母《はは》は髪《かみ》が長《なが》くて links adjectives.');
  });

  it('picks the reading whose kana around it match', () => {
    expect(fillReadings('Use お母さん for a friend’s mother and 母は for yours.', piece)).toBe(
      'Use お母《かあ》さん for a friend’s mother and 母《はは》は for yours.',
    );
  });

  it('copies whole words only, never a compound pieced together', () => {
    expect(fillReadings('二十歳', piece)).toBe('二十歳《はたち》');
    expect(fillReadings('十歳', piece)).toBe('十歳');
    expect(fillReadings('母髪', piece)).toBe('母髪');
    expect(fillReadings('日本語', ['日本《にほん》語《ご》'])).toBe('日本《にほん》語《ご》');
  });

  it('keeps readings already there and changes nothing without sources', () => {
    expect(fillReadings('髪《かみ》と母', piece)).toBe('髪《かみ》と母《はは》');
    expect(fillReadings('母', ['母'])).toBe('母');
    expect(fillReadings('Bonjour', piece)).toBe('Bonjour');
  });

  it('fills a piece’s note, English lines and quiz answers from its lines and words', () => {
    const p: Piece = {
      formatId: 'gap_fill',
      title: { fr: '家族《かぞく》', en: 'Family' },
      lines: [
        { kind: 'line', fr: '父《ちち》は会社員《かいしゃいん》です。', en: '父 is my father.' },
        { kind: 'gap', fr: '____は元気《げんき》です。', en: 'My mother is well.', answer: '母' },
      ],
    };
    const filled = fillPieceReadings(p, ['母《はは》']);
    expect(filled.lines[0]!.en).toBe('父《ちち》 is my father.');
    expect((filled.lines[1] as { answer: string }).answer).toBe('母《はは》');
    const fr: Piece = { formatId: 'summary', title: { fr: 'Le chat', en: 'The cat' }, lines: [{ kind: 'line', fr: 'Il dort.', en: 'He sleeps.' }] };
    expect(fillPieceReadings(fr)).toBe(fr);
  });
});

describe('Japanese in the checks', () => {
  it('tells Japanese from English by its script', () => {
    expect(notEnglish('富士山《ふじさん》はどこにありますか。')).toBe(true);
    expect(notEnglish('Where is Mount Fuji (富士山)?')).toBe(false);
  });

  it('finds a word without spaces, whatever its ending', () => {
    expect(wordPresent('食《た》べる', '鳥《とり》は虫《むし》を食《た》べます。')).toBe(true);
    expect(wordPresent('犬《いぬ》', '猫《ねこ》がいます。')).toBe(false);
  });

  it('takes a typed answer in kanji or kana, but keeps voicing marks', () => {
    expect(sameAnswer('たべる', '食《た》べる')).toBe(true);
    expect(sameAnswer('食べる', '食《た》べる')).toBe(true);
    expect(sameAnswer('かき', 'がき')).toBe(false);
    expect(sameAnswer('ete', 'été')).toBe(true);
  });
});

describe('Hindi readings', () => {
  it('reads a Devanagari word without ｜', () => {
    expect(rubySpans('बड़ा《baṛā》 घर《ghar》 है《hai》।')).toEqual([
      { text: 'बड़ा', reading: 'baṛā' }, { text: ' ' }, { text: 'घर', reading: 'ghar' }, { text: ' ' }, { text: 'है', reading: 'hai' }, { text: '।' },
    ]);
    expect(withoutReadings('बैठना《baiṭhnā》')).toBe('बैठना');
    expect(readingsOnly('घर《ghar》 में《meṃ》')).toBe('ghar meṃ');
    expect(readingsInBrackets('घर《ghar》')).toBe('घर(ghar)');
  });

  it('fills readings for whole words only', () => {
    const piece = ['मेरा《merā》 घर《ghar》 बड़ा《baṛā》 है《hai》।', 'लड़कों《laṛkoṃ》 को《ko》'];
    expect(fillReadings('Use घर for a house.', piece)).toBe('Use घर《ghar》 for a house.');
    expect(fillReadings('मेरा घर', piece)).toBe('मेरा《merā》 घर《ghar》');
    expect(fillReadings('लड़क and घरों', piece)).toBe('लड़क and घरों');
  });

  it('finds a word in its plural and oblique forms, not another word', () => {
    expect(wordPresent('लड़का《laṛkā》', 'दो《do》 लड़के《laṛke》 खेल《khel》 रहे《rahe》 हैं《haiṃ》।')).toBe(true);
    expect(wordPresent('लड़का《laṛkā》', 'लड़कों《laṛkoṃ》 को《ko》')).toBe(true);
    expect(wordPresent('लड़का《laṛkā》', 'एक《ek》 लड़की《laṛkī》 है《hai》।')).toBe(false);
    expect(wordPresent('लड़की《laṛkī》', 'लड़कियाँ《laṛkiyāṃ》 पढ़ती《paṛhtī》 हैं《haiṃ》।')).toBe(true);
    expect(wordPresent('किताब《kitāb》', 'किताबें《kitābeṃ》 मेज़《mez》 पर《par》 हैं《haiṃ》।')).toBe(true);
    expect(wordPresent('घर《ghar》', 'घरेलू《gharelū》 काम《kām》')).toBe(false);
  });

  it('takes a typed answer in Devanagari or romanisation, with or without nukta and chandrabindu', () => {
    expect(sameAnswer('baithna', 'बैठना《baiṭhnā》')).toBe(true);
    expect(sameAnswer('बैठना', 'बैठना《baiṭhnā》')).toBe(true);
    expect(sameAnswer('मेज', 'मेज़《mez》')).toBe(true);
    expect(sameAnswer('मां', 'माँ《māṃ》')).toBe(true);
    expect(sameAnswer('बेटी', 'बेटा《beṭā》')).toBe(false);
  });

  it('tells Hindi from English, in Devanagari or in Latin letters', () => {
    const hindi = new Set(getLanguage('hi').functionWords);
    expect(notEnglish('मेरा《merā》 नाम《nām》 अन्ना《annā》 है《hai》।', hindi)).toBe(true);
    expect(notEnglish('mera naam Anna hai aur main chhatra hoon', hindi)).toBe(true);
    expect(notEnglish('merā nām Annā hai, maiṃ dillī meṃ rahtī hūṃ', hindi)).toBe(true);
    expect(notEnglish('My name is Anna and I live in Delhi.', hindi)).toBe(false);
  });
});

describe('Hebrew readings', () => {
  it('reads a Hebrew word without ｜, with a prefix, a geresh or gershayim inside it', () => {
    expect(rubySpans('הילד《hayéled》 בבית《babáyit》.')).toEqual([
      { text: 'הילד', reading: 'hayéled' }, { text: ' ' }, { text: 'בבית', reading: 'babáyit' }, { text: '.' },
    ]);
    expect(rubySpans("ג'ינס《jins》 ו《ve》 צה\"ל《tsahal》")).toEqual([
      { text: "ג'ינס", reading: 'jins' }, { text: ' ' }, { text: 'ו', reading: 've' }, { text: ' ' }, { text: 'צה"ל', reading: 'tsahal' },
    ]);
    expect(withoutReadings('ב《be》-1969')).toBe('ב-1969');
    expect(readingsOnly('שלום《shalom》 ותודה《vetoda》')).toBe('shalom vetoda');
  });

  it('fills readings for whole words only', () => {
    const piece = ['הבית《habáyit》 שלי《sheli》 גדול《gadol》.', 'בית《báyit》 חדש《khadash》'];
    expect(fillReadings('Use בית for a house.', piece)).toBe('Use בית《báyit》 for a house.');
    expect(fillReadings('הבית שלי', piece)).toBe('הבית《habáyit》 שלי《sheli》');
    expect(fillReadings('בבית', piece)).toBe('בבית');
  });

  it('finds a word with a prefix or a plural ending, not another word', () => {
    expect(wordPresent('בית《báyit》', 'אני《ani》 בבית《babáyit》.')).toBe(true);
    expect(wordPresent('ילד《yéled》', 'הילדים《hayeladim》 משחקים《mesakhakim》.')).toBe(true);
    expect(wordPresent('ילד《yéled》', 'ילדה《yalda》 קטנה《ktana》')).toBe(false);
    expect(wordPresent('ילדה《yalda》', 'שתי《shtey》 ילדות《yeladot》')).toBe(true);
    expect(wordPresent('שולחן《shulkhan》', 'על《al》 השולחנות《hashulkhanot》')).toBe(true);
    expect(wordPresent('ספר《séfer》', 'ספרייה《sifriya》 גדולה《gdola》')).toBe(false);
  });

  it('takes a typed answer in Hebrew or romanisation, with or without vowel points and a geresh', () => {
    expect(sameAnswer('babayit', 'בבית《babáyit》')).toBe(true);
    expect(sameAnswer('בבית', 'בבית《babáyit》')).toBe(true);
    expect(sameAnswer('בַּבַּיִת', 'בבית《babáyit》')).toBe(true);
    expect(sameAnswer("ג'ינס", 'ג׳ינס《jins》')).toBe(true);
    expect(sameAnswer('ילד', 'ילדה《yalda》')).toBe(false);
  });

  it('draws right to left only text that is mostly in a right-to-left script, readings aside', () => {
    const line = setDirection(document.createElement('span'), 'הבית《habáyit》 שלי《sheli》 גדול《gadol》.');
    expect([line.dir, line.classList.contains(RTL_CLASS)]).toEqual(['rtl', true]);
    expect(isRtl('The word בית《báyit》 means house.')).toBe(false);
    expect(isRtl('Google היא חברה גדולה.')).toBe(true);
    expect(setDirection(document.createElement('span'), 'Hello').dir).toBe('');
  });
});

describe('Arabic readings', () => {
  it('reads an Arabic word without ｜, with a prefix, vowel marks or tatweel', () => {
    expect(rubySpans('البيت《al-bayt》 كبير《kabīr》، وبالبيت《wa-bil-bayt》 كتب《kutub》؟')).toEqual([
      { text: 'البيت', reading: 'al-bayt' }, { text: ' ' }, { text: 'كبير', reading: 'kabīr' }, { text: '، ' },
      { text: 'وبالبيت', reading: 'wa-bil-bayt' }, { text: ' ' }, { text: 'كتب', reading: 'kutub' }, { text: '؟' },
    ]);
    expect(rubySpans('كِتَاب《kitāb》 سـ《sa-》 ـون《-ūn》').filter((s) => s.reading).map((s) => s.text)).toEqual(['كِتَاب', 'سـ', 'ـون']);
    expect(withoutReadings('في《fī》 1969')).toBe('في 1969');
    expect(readingsOnly('شكرا《shukran》 جزيلا《jazīlan》')).toBe('shukran jazīlan');
  });

  it('fills readings for whole words only', () => {
    const piece = ['البيت《al-bayt》 الكبير《al-kabīr》.', 'بيت《bayt》 جديد《jadīd》'];
    expect(fillReadings('Use بيت for a house.', piece)).toBe('Use بيت《bayt》 for a house.');
    expect(fillReadings('البيت الكبير', piece)).toBe('البيت《al-bayt》 الكبير《al-kabīr》');
    expect(fillReadings('بالبيت', piece)).toBe('بالبيت');
  });

  it('finds a word with its prefixes, article and endings, not another word', () => {
    expect(wordPresent('بيت《bayt》', 'أنا《anā》 في《fī》 البيت《al-bayt》.')).toBe(true);
    expect(wordPresent('بيت《bayt》', 'وبالبيت《wa-bil-bayt》 ناس《nās》')).toBe(true);
    expect(wordPresent('بيت《bayt》', 'بيتنا《baytunā》 صغير《ṣaghīr》')).toBe(true);
    expect(wordPresent('مدينة《madīna》', 'مدينتنا《madīnatunā》 جميلة《jamīla》')).toBe(true);
    expect(wordPresent('مدينة《madīna》', 'في《fī》 المدينتين《al-madīnatayn》')).toBe(true);
    expect(wordPresent('معلم《muʿallim》', 'المعلمون《al-muʿallimūn》 هنا《hunā》')).toBe(true);
    expect(wordPresent('أم《umm》', 'الأم《al-umm》')).toBe(true);
    expect(wordPresent('كتاب《kitāb》', 'مكتبة《maktaba》 كبيرة《kabīra》')).toBe(false);
    expect(wordPresent('بيت《bayt》', 'بيروت《bayrūt》')).toBe(false);
  });

  it('takes a typed answer in Arabic or romanisation, with or without vowel marks, hamza, ʿ and ʾ', () => {
    expect(sameAnswer('al-bayt', 'البيت《al-bayt》')).toBe(true);
    expect(sameAnswer('البيت', 'البيت《al-bayt》')).toBe(true);
    expect(sameAnswer('البَيْت', 'البيت《al-bayt》')).toBe(true);
    expect(sameAnswer('اسرة', 'أسرة《usra》')).toBe(true);
    expect(sameAnswer('علي', 'على《ʿalā》')).toBe(true);
    expect(sameAnswer('arabi', 'عربي《ʿarabī》')).toBe(true);
    expect(sameAnswer('suال', 'سؤال《suʾāl》')).toBe(false);
    expect(sameAnswer('بيت', 'بنت《bint》')).toBe(false);
  });

  it('draws right to left, and asks for the ar-XA voice', () => {
    const line = setDirection(document.createElement('span'), 'البيت《al-bayt》 كبير《kabīr》.');
    expect([line.dir, line.classList.contains(RTL_CLASS)]).toEqual(['rtl', true]);
    expect(isRtl('The word بيت《bayt》 means house.')).toBe(false);
    const ar = getLanguage('ar');
    expect(speechBody('البيت《al-bayt》 كبير《kabīr》.', ar.speechLocale ?? ar.bcp47)).toMatchObject({ input: { text: 'البيت كبير.' }, voice: { name: 'ar-XA-Chirp3-HD-Leda' } });
  });
});

describe('Korean readings', () => {
  it('reads a Hangul word with its particles without ｜, and a number with ｜', () => {
    expect(rubySpans('저는《jeoneun》 학교에《hakgyoe》 가요《gayo》.')).toEqual([
      { text: '저는', reading: 'jeoneun' }, { text: ' ' }, { text: '학교에', reading: 'hakgyoe' }, { text: ' ' }, { text: '가요', reading: 'gayo' }, { text: '.' },
    ]);
    expect(rubySpans('｜3시《se si》에')).toEqual([{ text: '3시', reading: 'se si' }, { text: '에' }]);
    expect(withoutReadings('먹어요《meogeoyo》')).toBe('먹어요');
    expect(readingsOnly('한국어《hangugeo》 공부해요《gongbuhaeyo》')).toBe('hangugeo gongbuhaeyo');
  });

  it('fills readings for whole words only', () => {
    const piece = ['저는《jeoneun》 학생이에요《haksaengieyo》.', '학교《hakgyo》 앞에《ape》'];
    expect(fillReadings('Use 학교 for a school.', piece)).toBe('Use 학교《hakgyo》 for a school.');
    expect(fillReadings('저는 학교', piece)).toBe('저는《jeoneun》 학교《hakgyo》');
    expect(fillReadings('학교에서', piece)).toBe('학교에서');
  });

  it('finds a noun with its particles, and a verb or adjective by its stem', () => {
    expect(wordPresent('학교《hakgyo》', '학교에서《hakgyoeseo》 공부해요《gongbuhaeyo》.')).toBe(true);
    expect(wordPresent('학교《hakgyo》', '대학교에《daehakgyoe》 가요《gayo》.')).toBe(false);
    expect(wordPresent('개《gae》', '개가《gaega》 짖어요《jijeoyo》.')).toBe(true);
    expect(wordPresent('개《gae》', '개구리가《gaeguriga》 있어요《isseoyo》.')).toBe(false);
    expect(wordPresent('먹다《meokda》', '밥을《babeul》 먹었어요《meogeosseoyo》.')).toBe(true);
    expect(wordPresent('마시다《masida》', '커피를《keopireul》 마셔요《masyeoyo》.')).toBe(true);
    expect(wordPresent('크다《keuda》', '집이《jibi》 커요《keoyo》.')).toBe(true);
    expect(wordPresent('크다《keuda》', '커피를《keopireul》 마셔요《masyeoyo》.')).toBe(false);
    expect(wordPresent('듣다《deutda》', '음악을《eumageul》 들어요《deureoyo》.')).toBe(true);
    expect(wordPresent('춥다《chupda》', '겨울은《gyeoureun》 추워요《chuwoyo》.')).toBe(true);
    expect(wordPresent('모르다《moreuda》', '잘《jal》 몰라요《mollayo》.')).toBe(true);
    expect(wordPresent('공부하다《gongbuhada》', '어제《eoje》 공부했어요《gongbuhaesseoyo》.')).toBe(true);
    expect(wordPresent('바다《bada》', '바다에서《badaeseo》 수영해요《suyeonghaeyo》.')).toBe(true);
  });

  it('takes a typed answer in Hangul or romanisation', () => {
    expect(sameAnswer('hakgyoe', '학교에《hakgyoe》')).toBe(true);
    expect(sameAnswer('학교에', '학교에《hakgyoe》')).toBe(true);
    expect(sameAnswer('jeoneun haksaengieyo', '저는《jeoneun》 학생이에요《haksaengieyo》')).toBe(true);
    expect(sameAnswer('학교', '학교에《hakgyoe》')).toBe(false);
  });

  it('speaks with the ko-KR voice, readings dropped', () => {
    const ko = getLanguage('ko');
    expect(speechBody('저는《jeoneun》 학생이에요《haksaengieyo》.', ko.bcp47)).toMatchObject({ input: { text: '저는 학생이에요.' }, voice: { name: 'ko-KR-Chirp3-HD-Leda' } });
  });
});

describe('Chinese readings', () => {
  const sentence = '我《wǒ》是《shì》学生《xuéshēng》。';

  it('reads each word, with no romaji and a gap between pinyin words', () => {
    expect(rubySpans(sentence)).toEqual([
      { text: '我', reading: 'wǒ' }, { text: '是', reading: 'shì' }, { text: '学生', reading: 'xuéshēng' }, { text: '。' },
    ]);
    expect(withoutReadings(sentence)).toBe('我是学生。');
    const nodes = rubyNodes(document, sentence);
    expect(nodes.map((n) => (n as Element).className ?? '')).toEqual(['tissage-rr', 'tissage-rr tissage-rr-j', 'tissage-rr tissage-rr-j', '']);
  });

  it('fills a bare run word by word, only when every character is read', () => {
    const piece = ['他《tā》是《shì》老师《lǎoshī》。', sentence];
    expect(fillReadings('他是学生 means he is a student.', piece)).toBe('他《tā》是《shì》学生《xuéshēng》 means he is a student.');
    expect(fillReadings('我是', piece)).toBe('我《wǒ》是《shì》');
    expect(fillReadings('她是学生', piece)).toBe('她是学生');
  });

  it('leaves Japanese runs whole', () => {
    expect(fillReadings('二十歳', ['二十《にじゅう》', '歳《さい》'])).toBe('二十歳');
  });

  it('takes typed pinyin with or without spaces and tone marks, or the hanzi', () => {
    expect(sameAnswer('wo shi xuesheng', sentence)).toBe(true);
    expect(sameAnswer('wǒshìxuéshēng', sentence)).toBe(true);
    expect(sameAnswer('我是学生', sentence)).toBe(true);
    expect(sameAnswer('wo shi laoshi', sentence)).toBe(false);
  });

  it('finds a word in a sentence', () => {
    expect(wordPresent('学生《xuéshēng》', sentence)).toBe(true);
    expect(wordPresent('老师《lǎoshī》', sentence)).toBe(false);
  });

  it('tells Chinese from English, in hanzi or in pinyin', () => {
    const chinese = new Set(getLanguage('zh').functionWords);
    expect(notEnglish(sentence, chinese)).toBe(true);
    expect(notEnglish('wo shi xuesheng, wo hen xihuan Zhongguo cai', chinese)).toBe(true);
    expect(notEnglish('wǒ bù shì lǎoshī, tā shì', chinese)).toBe(true);
    for (const en of ['I am a student and I like Chinese food.', 'It’s a dog on a boat, and ten people go to it.', 'You and he are women.'])
      expect(notEnglish(en, chinese), en).toBe(false);
  });

  it('speaks the hanzi with the cmn-CN voice', () => {
    const zh = getLanguage('zh');
    expect(speechBody(sentence, zh.speechLocale ?? zh.bcp47).voice).toEqual({ languageCode: 'cmn-CN', name: 'cmn-CN-Chirp3-HD-Leda' });
    expect(speechBody(sentence, 'cmn-CN').input.text).toBe('我是学生。');
  });
});

describe('Russian readings', () => {
  it('reads a whole Cyrillic word, hyphens and all', () => {
    expect(rubySpans('в《v》 большом《bol\'shóm》 доме《dóme》')).toEqual([
      { text: 'в', reading: 'v' }, { text: ' ' }, { text: 'большом', reading: "bol'shóm" }, { text: ' ' }, { text: 'доме', reading: 'dóme' },
    ]);
    expect(withoutReadings('Я《ya》 говорю《govoryú》 по-русски《po-rússki》.')).toBe('Я говорю по-русски.');
  });

  it('copies readings into a note that writes Cyrillic bare', () => {
    expect(fillReadings('The word книгу is the accusative.', ['Я《ya》 читаю《chitáyu》 книгу《knígu》.'])).toBe('The word книгу《knígu》 is the accusative.');
  });

  it('finds a word in its other cases, never inside another', () => {
    expect(wordPresent('книга《kníga》', 'Я《ya》 читаю《chitáyu》 книгу《knígu》.')).toBe(true);
    expect(wordPresent('кот《kot》', 'Это《éto》 который《kotóryy》 час《chas》?')).toBe(false);
  });

  it('takes ё typed as е, and the romanisation without stress marks', () => {
    expect(sameAnswer('еще', 'ещё《yeshchó》')).toBe(true);
    expect(sameAnswer('moloko', 'молоко《molokó》')).toBe(true);
    expect(sameAnswer('молоко', 'молока《moloká》')).toBe(false);
  });
});

describe('splitWords', () => {
  const cut = (plain: string) => [...new Intl.Segmenter('zh', { granularity: 'word' }).segment(plain)].map((s) => s.segment);

  it('keeps each reading with its word', () => {
    const words = splitWords('我《wǒ》喜欢《xǐhuan》中国《Zhōngguó》菜《cài》。', cut);
    expect(words.join('')).toBe('我《wǒ》喜欢《xǐhuan》中国《Zhōngguó》菜《cài》。');
    expect(words.every((w) => !/^[《》]|《[^》]*$/.test(w))).toBe(true);
    expect(words).toContain('喜欢《xǐhuan》');
  });

  it('keeps Japanese readings with their kanji', () => {
    const words = splitWords('私《わたし》は学生《がくせい》です。', cut);
    expect(words.join('')).toBe('私《わたし》は学生《がくせい》です。');
    expect(words).toContain('学生《がくせい》');
  });

  it('passes text without readings to the cutter', () => {
    expect(splitWords('我是学生', cut)).toEqual(cut('我是学生'));
  });
});

describe('every word in a language with readings has one', () => {
  // A base the reader can't read unaided: kanji, Devanagari, Hebrew, Arabic, Hangul, Cyrillic.
  const needsReading = /[\p{Script=Han}\p{Script=Devanagari}\p{Script=Hebrew}\p{Script=Arabic}\p{Script=Hangul}\p{Script=Cyrillic}]/u;
  for (const lang of Object.values(languages).filter((l) => l.writingNotes)) {
    it(lang.displayName, () => {
      const texts = [
        ...lessonsFor(lang.code).flatMap((l) => [l.title, ...l.points]),
        ...LEVELS.flatMap((level) => grammarFor(lang.code, level)).flatMap((g) => [g.label, g.instruction, g.example]),
        ...easyWordsFor(lang.code).map((w) => w.lemma),
        ...(a1WordsFor(lang.code) ?? []).map((w) => w.lemma),
      ];
      const bare = texts.flatMap((t) => rubySpans(t).filter((s) => !s.reading && needsReading.test(s.text)).map((s) => `${s.text.trim()} in: ${t}`));
      expect(bare).toEqual([]);
      // Pinyin over hanzi: one syllable a character, so a word left bare can't hide under the next one's reading.
      const syllables = (r: string) => r.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').match(/[aeiouv]+/g)?.length ?? 0;
      const miscounted = texts.flatMap((t) =>
        rubySpans(t)
          .filter((s) => s.reading && /\p{Script=Latin}/u.test(s.reading) && /^\p{Script=Han}+$/u.test(s.text) && syllables(s.reading) !== [...s.text].length)
          .map((s) => `${s.text}《${s.reading}》 in: ${t}`),
      );
      expect(miscounted).toEqual([]);
    });
  }
});
