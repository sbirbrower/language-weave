import { describe, expect, it } from 'vitest';
import { cleanPiece, notEnglish, pieceIssues, wholeIssues } from '../../src/passage/checks';
import { buildPiecePrompt, parsePiece, type Piece, type PieceLine } from '../../src/passage/piece';
import { getFormat } from '../../src/passage/formats';
import { cs } from '../../src/languages/cs';
import { es } from '../../src/languages/es';
import { fr } from '../../src/languages/fr';
import { gd } from '../../src/languages/gd';
import { it as italianLang } from '../../src/languages/it';
import { he } from '../../src/languages/he';
import { ar } from '../../src/languages/ar';
import { pt } from '../../src/languages/pt';
import { ru } from '../../src/languages/ru';
import { ko } from '../../src/languages/ko';
import { zh } from '../../src/languages/zh';

const target = new Set(fr.functionWords);

const piece = (formatId: string, lines: PieceLine[], extra: Partial<Piece> = {}): Piece => ({ formatId, title: { fr: 'T', en: 'T' }, lines, ...extra });
const line = (fr: string, en: string): PieceLine => ({ kind: 'line', fr, en });

describe('notEnglish', () => {
  it('spots a target-language sentence in the English field, leaving short and real English alone', () => {
    expect(notEnglish('La population mondiale est estimée à moins de 10 000', target)).toBe(true);
    expect(notEnglish('Il a une queue épaisse et longue.', target)).toBe(true);
    for (const en of ['The population is estimated at fewer than 10,000', 'PCR copies a specific DNA sequence.', 'Researchers followed five leopards in Nepal.', 'I am an animal.', '1.07 billion'])
      expect(notEnglish(en, target), en).toBe(false);
  });

  it('spots Czech, whose function words leave out the ones English writes too (a, to, on)', () => {
    const czech = new Set(cs.functionWords);
    expect(notEnglish('Řeka, která teče přes Prahu, se jmenuje Vltava.', czech)).toBe(true);
    expect(notEnglish('Lední medvěd žije na severu a loví tuleně.', czech)).toBe(true);
    for (const en of ['The river that flows through Prague is the Vltava.', 'It’s a dog on a boat, and ten people go to it.', 'I am an animal.'])
      expect(notEnglish(en, czech), en).toBe(false);
  });

  it('spots Chinese in hanzi or in pinyin, whose function words leave out the pinyin English writes too (you, he, women)', () => {
    const chinese = new Set(zh.functionWords);
    expect(notEnglish('流经《liújīng》上海《Shànghǎi》的《de》河《hé》叫《jiào》黄浦江《Huángpǔ Jiāng》。', chinese)).toBe(true);
    expect(notEnglish('Qǐ’é bù huì fēi, dànshì tāmen hěn huì yóuyǒng.', chinese)).toBe(true);
    for (const en of ['The river that flows through Shanghai is the Huangpu.', 'It’s a dog on a boat, and ten people go to it.', 'You and he met the women in Xi’an.'])
      expect(notEnglish(en, chinese), en).toBe(false);
  });

  it('spots Spanish, whose function words leave out the ones English writes too (no, son, con)', () => {
    const spanish = new Set(es.functionWords);
    expect(notEnglish('El río que pasa por Sevilla se llama Guadalquivir.', spanish)).toBe(true);
    expect(notEnglish('Los pingüinos no pueden volar, pero nadan muy bien.', spanish)).toBe(true);
    for (const en of ['The river that flows through Seville is the Guadalquivir.', 'It’s a dog on a boat, and ten people go to it.', 'Los Angeles and Las Vegas are in the west.', 'No son of mine is a con artist.'])
      expect(notEnglish(en, spanish), en).toBe(false);
  });

  it('spots Italian, whose function words leave out the ones English writes too (i, come, dove, con, per)', () => {
    const italian = new Set(italianLang.functionWords);
    expect(notEnglish('Il fiume che attraversa Firenze si chiama Arno.', italian)).toBe(true);
    expect(notEnglish('I pinguini non possono volare, ma nuotano molto bene.', italian)).toBe(true);
    for (const en of ['The river that flows through Florence is the Arno.', 'It’s a dog on a boat, and ten people go to it.', 'La Scala and Lake Como are in the north.', 'Come here: the dove had a con artist per day and a non-profit e-mail.'])
      expect(notEnglish(en, italian), en).toBe(false);
  });

  it('spots Brazilian Portuguese, whose function words leave out the ones English writes too (no, do, era, eu)', () => {
    const portuguese = new Set(pt.functionWords);
    expect(notEnglish('O rio que corta São Paulo se chama Tietê.', portuguese)).toBe(true);
    expect(notEnglish('Os pinguins não podem voar, mas nadam muito bem.', portuguese)).toBe(true);
    for (const en of ['The river that flows through São Paulo is the Tietê.', 'It’s a dog on a boat, and ten people go to it.', 'Rio de Janeiro and São Paulo are in the southeast.', 'The EU had no era of peace to do it.'])
      expect(notEnglish(en, portuguese), en).toBe(false);
  });

  it('spots Scottish Gaelic, whose function words leave out the ones English writes too (is, do, no, air)', () => {
    const gaelic = new Set(gd.functionWords);
    expect(notEnglish('Tha an abhainn a tha a’ sruthadh tro Ghlaschu glè fhada.', gaelic)).toBe(true);
    expect(notEnglish('Chan urrainn do struthan itealaich, ach is urrainn dhaibh ruith gu luath.', gaelic)).toBe(true);
    for (const en of ['The river that flows through Glasgow is the Clyde.', 'It’s a dog on a boat, and ten people go to it.', 'I am an animal.', 'Tha is a Gaelic word, and so is agus.'])
      expect(notEnglish(en, gaelic), en).toBe(false);
  });

  it('spots Korean, in Hangul with or without readings or romanised, whose romanised function words leave out the ones English writes too (i, go, an)', () => {
    const korean = new Set(ko.functionWords);
    expect(notEnglish('카이로를《Kairoreul》 지나는《jinaneun》 강은《gangeun》 나일강이에요《Nailgangieyo》.', korean)).toBe(true);
    expect(notEnglish('펭귄은 날 수 없지만 수영을 잘해요.', korean)).toBe(true);
    expect(notEnglish('jeoneun haksaengieyo, geurigo hangugeo jeongmal joahaeyo', korean)).toBe(true);
    for (const en of ['The river that flows through Cairo is the Nile.', 'It’s a dog on a boat, and ten people go to it.', 'The word 학교《hakgyo》 means school.', 'I go to an old man’s house.'])
      expect(notEnglish(en, korean), en).toBe(false);
  });

  it('spots Hebrew, in its script or romanised, whose romanised function words leave out the ones English writes too (at, hi, hen)', () => {
    const hebrew = new Set(he.functionWords);
    expect(notEnglish('הנהר《hanahar》 שזורם《shezorem》 דרך《dérekh》 קהיר《kahir》 הוא《hu》 הנילוס《hanílus》.', hebrew)).toBe(true);
    expect(notEnglish('פינגווינים לא יכולים לעוף, אבל הם שוחים היטב.', hebrew)).toBe(true);
    expect(notEnglish('ani lo yodéa ma ze, aval hu gam lo yodéa', hebrew)).toBe(true);
    for (const en of ['The river that flows through Cairo is the Nile.', 'It’s a dog on a boat, and ten people go to it.', 'Hi Ken, his ma is at the hen house.'])
      expect(notEnglish(en, hebrew), en).toBe(false);
  });

  it('spots Arabic, in its script or romanised, whose romanised function words leave out the ones English writes too (an, aw, anti)', () => {
    const arabic = new Set(ar.functionWords);
    expect(notEnglish('النهر《an-nahr》 الذي《alladhī》 يجري《yajrī》 في《fī》 القاهرة《al-qāhira》 هو《huwa》 النيل《an-nīl》.', arabic)).toBe(true);
    expect(notEnglish('لا يستطيع البطريق أن يطير، لكنه يسبح جيدا.', arabic)).toBe(true);
    expect(notEnglish('anā lā aʿrif mā hādhā, wa huwa ayḍan lā yaʿrif', arabic)).toBe(true);
    for (const en of ['The river that flows through Cairo is the Nile.', 'It’s a dog on a boat, and ten people go to it.', 'Al Gore is an American politician.', 'Aw, an anti-war song.'])
      expect(notEnglish(en, arabic), en).toBe(false);
  });

  it('spots Russian, in Cyrillic or romanised, whose romanised function words leave out the ones English writes too (on, no, my)', () => {
    const russian = new Set(ru.functionWords);
    expect(notEnglish('Река《reká》, которая《kotóraya》 течёт《techót》 через《chérez》 Каир《kaír》, — это《éto》 Нил《nil》.', russian)).toBe(true);
    expect(notEnglish('Пингвины не могут летать, но они хорошо плавают.', russian)).toBe(true);
    expect(notEnglish('ya ne znayu, chto eto, i on tozhe ne znayet', russian)).toBe(true);
    for (const en of ['The river that flows through Cairo is the Nile.', 'It’s a dog on a boat, and ten people go to it.', 'No, my dog is on a boat.'])
      expect(notEnglish(en, russian), en).toBe(false);
  });

  it('without the target’s words, flags only text with no English words at all', () => {
    expect(notEnglish('La population mondiale est estimée')).toBe(true);
    expect(notEnglish('I live in Asia.')).toBe(false);
  });
});

describe('the checks in code', () => {
  it('drops comments, titles read as statements, repeats, broken gaps and lines that aren’t English', () => {
    const p = piece('true_false', [
      { kind: 'tf', fr: 'Vrai ou faux ?', en: 'True or false?', answer: true },
      { kind: 'tf', fr: 'Il vit en Asie.', en: 'It lives in Asia.', answer: true },
      { kind: 'tf', fr: 'Il vit en Asie.', en: 'It lives in Asia.', answer: true },
      { kind: 'tf', fr: 'Il chasse la nuit.', en: 'It hunts at night. (Not supported — see note.)', answer: false },
      { kind: 'tf', fr: 'Il a une queue épaisse.', en: 'Il a une queue épaisse et longue.', answer: true },
      { kind: 'tf', fr: 'Il vit seul.', en: 'It lives alone.', answer: true },
    ]);
    expect(pieceIssues(p, { target }).map((x) => x.line)).toEqual([0, 2, 3, 4]);
    const clean = cleanPiece(p, undefined, { target });
    expect(clean.lines.map((l) => l.fr)).toEqual(['Il vit en Asie.', 'Il vit seul.']);
    expect(wholeIssues(clean)).toEqual([{ line: -1, issue: 'fewer than 3 statements' }]);
  });

  it('calls a riddle with no options, or a clue that names the answer, broken', () => {
    const clues = [line('Je suis un animal.', 'I am an animal.'), line('Je vis en Asie.', 'I live in Asia.'), line('Je suis le léopard des neiges.', 'I am the snow leopard.')];
    expect(wholeIssues(piece('riddle', clues))).toEqual([{ line: -1, issue: 'a riddle with no options' }]);
    const withOptions = piece('riddle', [...clues, { kind: 'choice', fr: 'Qui suis-je ?', en: 'Who am I?', options: ['Le léopard des neiges', 'Le tigre', 'Le lynx'], answer: 'Le léopard des neiges' }]);
    expect(pieceIssues(withOptions)).toEqual([{ line: 2, issue: 'a clue names the answer' }]);
    expect(wholeIssues(cleanPiece(withOptions))).toEqual([{ line: -1, issue: 'a riddle with fewer than 3 clues' }]);
  });

  it('calls a piece that leaves most words without readings broken', () => {
    const unread = [line('लेखक《lekhak》 एक आदमी के बारे में लिखता है《hai》।', 'The writer writes about a man.'), line('समुदाय के लोग जवान थे।', 'The people of the community were young.')];
    expect(wholeIssues(piece('summary', unread))).toEqual([{ line: -1, issue: 'words without readings' }]);
    const read = [line('लेखक《lekhak》 एक《ek》 आदमी《ādmī》 के《ke》 बारे《bāre》 में《meṃ》 लिखता《likhtā》 है《hai》।', 'The writer writes about a man.'), line('समुदाय के《ke》 लोग《log》 जवान《javān》 थे《the》।', 'The people of the community were young.')];
    expect(wholeIssues(piece('summary', read))).toEqual([]);
    expect(wholeIssues(piece('summary', [line('Il vit en Asie.', 'He lives in Asia.')]))).toEqual([]);
  });

  it('gives the pairs a new order when one is dropped', () => {
    const pairs: PieceLine[] = ['queue', 'proie', 'proie', 'neige'].map((fr) => ({ kind: 'pair', fr, en: fr }));
    const clean = cleanPiece(piece('match_up', pairs, { shuffle: [3, 1, 0, 2] }));
    expect(clean.lines).toHaveLength(3);
    expect([...clean.shuffle!].sort()).toEqual([0, 1, 2]);
  });
});

describe('the prompt', () => {
  const input = (formatId: string) => ({ format: getFormat(formatId)!, language: 'German', level: 'A2', words: [], grammar: [], page: { title: 'T', context: { text: 'x', heading: '' } } });
  it('asks for the piece alone, and gives each fixed format its rule', () => {
    expect(buildPiecePrompt(input('summary'))).toContain('Write only the piece itself: no comments, notes, corrections or placeholders inside it.');
    expect(buildPiecePrompt(input('numbers'))).toContain('all in the German text before the ||, as in:\n12 – a German sentence about the 12 || 12 – its English translation');
    expect(buildPiecePrompt(input('riddle'))).toContain('The answer field comes after its own ||, like every field.');
    expect(buildPiecePrompt(input('true_false'))).toContain('no title or question line (the title goes in <title>).');
    expect(buildPiecePrompt(input('match_up'))).toContain('Every word line ends with || pair.');
  });

  it('still parses a riddle answer that came after its own ||', () => {
    const p = parsePiece('<title>T || T</title><piece>\nQui suis-je ? || Who am I? || answer: A | B | C\n</piece>', 'riddle');
    expect(p.lines[0]).toMatchObject({ kind: 'choice', answer: 'A' });
  });
});
