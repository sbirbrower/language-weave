import { describe, expect, it } from 'vitest';
import { getLanguage, scriptViewFor, showsRomaji } from '../src/languages';
import { kanaToRomaji, romajiWords } from '../src/romaji';
import { rubyNodes, rubySpans } from '../src/ruby';

/** The romaji of each word, other text in brackets. */
const words = (text: string) =>
  romajiWords(rubySpans(text))
    .map((w) => w.romaji ?? `[${w.spans.map((s) => s.text).join('')}]`)
    .join(' ');

describe('kanaToRomaji', () => {
  it('writes Hepburn', () => {
    expect(kanaToRomaji('しゃしん')).toBe('shashin');
    expect(kanaToRomaji('ちょっと')).toBe('chotto');
    expect(kanaToRomaji('まっちゃ')).toBe('matcha');
    expect(kanaToRomaji('じゅぎょう')).toBe('jugyō');
    expect(kanaToRomaji('きんえん')).toBe("kin'en");
    expect(kanaToRomaji('こんや')).toBe("kon'ya");
  });

  it('marks long vowels, but not ii or ei', () => {
    expect(kanaToRomaji('とうきょう')).toBe('tōkyō');
    expect(kanaToRomaji('おおきい')).toBe('ōkii');
    expect(kanaToRomaji('おかあさん')).toBe('okāsan');
    expect(kanaToRomaji('せんせい')).toBe('sensei');
    expect(kanaToRomaji('おもう', new Set([2]))).toBe('omou');
  });

  it('reads katakana, with ー and small vowels', () => {
    expect(kanaToRomaji('コーヒー')).toBe('kōhī');
    expect(kanaToRomaji('パーティー')).toBe('pātī');
    expect(kanaToRomaji('フォーク')).toBe('fōku');
    expect(kanaToRomaji('ウィキ')).toBe('wiki');
    expect(kanaToRomaji('チェック')).toBe('chekku');
  });
});

describe('romajiWords', () => {
  it.each([
    ['私《わたし》は日本語《にほんご》を勉強《べんきょう》しています。', 'watashi wa nihongo o benkyō shiteimasu [。]'],
    ['ありがとうございます。', 'arigatō gozaimasu [。]'],
    ['こんにちは、田中《たなか》さん。', 'konnichiwa [、] tanaka san [。]'],
    ['私《わたし》は学生《がくせい》ではありません。', 'watashi wa gakusei dewa arimasen [。]'],
    ['毎日《まいにち》コーヒーを飲《の》みます。', 'mainichi kōhī o nomimasu [。]'],
    ['日本語《にほんご》を話《はな》すことができます。', 'nihongo o hanasu koto ga dekimasu [。]'],
    ['駅《えき》はどこですか？', 'eki wa doko desu ka [？]'],
    ['この本《ほん》はとても面白《おもしろ》かったです。', 'kono hon wa totemo omoshirokatta desu [。]'],
    ['東京《とうきょう》に住《す》んでいます。', 'tōkyō ni sunde imasu [。]'],
    ['お母《かあ》さんは大《おお》きい犬《いぬ》が好《す》きです。', 'okāsan wa ōkii inu ga suki desu [。]'],
    ['読《よ》んでください', 'yonde kudasai'],
    ['学校《がっこう》へ行《い》く', 'gakkō e iku'],
    ['そう思《おも》います', 'sō omoimasu'],
    ['ご飯《はん》を食《た》べない', 'gohan o tabenai'],
  ])('%s', (text, romaji) => {
    expect(words(text)).toBe(romaji);
  });

  it('keeps the readings and the text around the Japanese', () => {
    const out = romajiWords(rubySpans('I like 日本語《にほんご》 a lot.'));
    expect(out).toEqual([
      { spans: [{ text: 'I like ' }] },
      { spans: [{ text: '日本語', reading: 'にほんご' }], romaji: 'nihongo' },
      { spans: [{ text: ' a lot.' }] },
    ]);
  });
});

describe('romaji in the page', () => {
  it('shows for Japanese at A1 and A2, by the popup level or a lesson level', () => {
    const ja = getLanguage('ja');
    expect(showsRomaji(ja, 'A2')).toBe(true);
    expect(showsRomaji(ja, 'CEFR A1')).toBe(true);
    expect(showsRomaji(ja, 'B1')).toBe(false);
    expect(showsRomaji(getLanguage('hi'), 'A1')).toBe(false);
  });

  it('shows the script and romanisation as picked, else as suits the level', () => {
    const [ja, hi] = [getLanguage('ja'), getLanguage('hi')];
    expect(scriptViewFor(ja, 'A1', {})).toBe('below');
    expect(scriptViewFor(ja, 'B2', {})).toBe('script');
    expect(scriptViewFor(hi, 'C1', {})).toBe('above');
    expect(scriptViewFor(hi, 'A1', { hi: 'roman', ja: 'script' })).toBe('roman');
    expect(scriptViewFor(getLanguage('fr'), 'A1', { fr: 'roman' })).toBeUndefined();
  });

  it('leaves text without Japanese as it was', () => {
    const p = document.createElement('p');
    p.append(...rubyNodes(document, 'Bonjour !'));
    expect(p.innerHTML).toBe('Bonjour !');
  });
});
