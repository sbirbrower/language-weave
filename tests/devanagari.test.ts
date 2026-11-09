import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { readHindi, romaniseHindi } from '../src/devanagari';
import { readingsInBrackets, rubySpans } from '../src/ruby';

describe('readHindi', () => {
  it("writes the letters in Hindi's scheme, however the model spelled them", () => {
    expect(readHindi('चित्र', 'chitr')).toBe('citra');
    expect(readHindi('शांत', 'shāṅt')).toBe('śānt');
    expect(readHindi('छोटा', 'chhoṭā')).toBe('choṭā');
    expect(readHindi('मुश्किल', 'mushkil')).toBe('muśkil');
    expect(readHindi('नस्ल', 'naslh')).toBe('nasl');
    expect(readHindi('ख़तरा', 'ḵẖatrā')).toBe('khatrā');
    expect(readHindi('विज्ञान', 'vijñān')).toBe('vigyān');
    expect(readHindi('ज़रूरी', 'zarūrī')).toBe('zarūrī');
    expect(readHindi('पढ़ना', 'paṛhnā')).toBe('paṛhnā');
  });

  it('takes the inherent a the model said, and drops a final one by rule', () => {
    expect(readHindi('समझना', 'samajhnā')).toBe('samajhnā');
    expect(readHindi('अजनबी', 'ajnabī')).toBe('ajnabī');
    expect(readHindi('लोकप्रिय', 'lokpriya')).toBe('lokpriy');
    expect(readHindi('लोकप्रिय', 'lokpriy')).toBe('lokpriy');
    expect(readHindi('कमल', 'kamala')).toBe('kamal');
  });

  it('keeps a final a after a cluster ending in y or r, except in Persian and Arabic words', () => {
    expect(readHindi('वाक्य', 'vākya')).toBe('vākya');
    expect(readHindi('छात्र', 'chātr')).toBe('chātra');
    expect(readHindi('उम्र', 'umra')).toBe('umr');
    expect(readHindi('ज़िक्र', 'zikra')).toBe('zikr');
    expect(readHindi('पूर्व', 'pūrva')).toBe('pūrv');
    expect(readHindi('न', 'na')).toBe('na');
  });

  it('says a dot as n or m after a short vowel, and as a nasal vowel after a long one unless the model said n', () => {
    expect(readHindi('हिंदी', 'hiṃdī')).toBe('hindī');
    expect(readHindi('लंबा', 'laṃbā')).toBe('lambā');
    expect(readHindi('संभावना', 'saṃbhāvnā')).toBe('sambhāvnā');
    expect(readHindi('होंगे', 'honge')).toBe('honge');
    expect(readHindi('होंगे', 'hoṃge')).toBe('hoṃge');
    expect(readHindi('बैंक', 'baiṅk')).toBe('baink');
    expect(readHindi('में', 'mem')).toBe('meṃ');
    expect(readHindi('माँ', 'mā')).toBe('māṃ');
  });

  it('works the inherent a out by rule when the reading spells another word', () => {
    expect(readHindi('लड़का', 'boy')).toBe('laṛkā');
    expect(readHindi('घर', '')).toBe('ghar');
  });

  it("keeps the model's reading for a word it can't read", () => {
    expect(readHindi('२०२४', 'do hazār caubīs')).toBe('do hazār caubīs');
  });

  it("gives back Hindi's data files as written, but for a few deliberate changes", () => {
    const files = ['src/syllabus/hi.ts', 'src/grammar/hi.ts', 'src/lessons/words/hi.ts', 'src/languages/hi.ts'];
    const pairs = files.flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/(\p{Script=Devanagari}+)《([^》\n]+)》/gu)].map((m) => [m[1]!, m[2]!] as const));
    const changed = new Set(pairs.filter(([w, r]) => readHindi(w, r) !== r).map(([w]) => w));
    // ऑ as ŏ, -īya without its a, a loan's nasal as n: what the scheme says where the data wobbles.
    expect(changed.size).toBeLessThan(20);
    expect(changed.size / new Set(pairs.map(([w]) => w)).size).toBeLessThan(0.02);
  });
});

describe('romaniseHindi', () => {
  it('keeps the first reading of a word for the rest of the page', () => {
    expect(romaniseHindi('ख़रगोश', 'khargoś')).toBe('khargoś');
    expect(romaniseHindi('ख़रगोश', 'kharagoś')).toBe('khargoś');
  });

  it('is what ruby shows for a Devanagari word', () => {
    expect(rubySpans('एक बड़ा कुत्ता《kutta》')).toEqual([{ text: 'एक बड़ा ' }, { text: 'कुत्ता', reading: 'kuttā' }]);
    expect(readingsInBrackets('शांत《shāṅt》')).toBe('शांत(śānt)');
    expect(rubySpans('日本語《にほんご》')).toEqual([{ text: '日本語', reading: 'にほんご' }]);
  });
});
