import { describe, expect, it } from 'vitest';
import { composeBlock } from '../../src/hangul';
import { seededRng } from '../../src/passage/rng';
import { readingsOnly, withoutReadings } from '../../src/ruby';
import { DRILLS, silentUnits } from '../../src/practice/drills/build';
import { DRILL_DATA, drillLessons, drillsFor } from '../../src/practice/drills';
import { givesAway } from '../../src/practice/giveaway';
import { retone, toneOf } from '../../src/practice/drills/pinyin';
import { DRILL_SHARE, RECENT_EXERCISES } from '../../src/practice/plan';
import { newCoverage, newSession, planNext } from '../../src/practice/schedule';
import { grade, newAnswer, sameSpelling } from '../../src/practice/session';
import type { Step } from '../../src/practice/types';
import { syllabusLessons } from '../../src/syllabus';

const THEME = ['le frère', 'la mère', 'el café', 'la música', 'das Mädchen', 'il caffè', 'o irmão', 'čaj'];

/** Every drill a lesson has, built many times: each must be well formed. */
function buildAll(lang: string, at: number, listening = true): Step[] {
  const lesson = drillLessons(lang)[at]!;
  const drills = drillsFor(lesson);
  if (!drills) return [];
  const rng = seededRng(`${lang}|${at}`);
  return drills.types(listening).flatMap((type) => Array.from({ length: 30 }, () => drills.build(type, THEME, rng.next, listening)!));
}

/** Problems with a step's shape, if any. */
function problems(step: Step): string[] {
  const out: string[] = [];
  if (!step.instruction || !step.drill?.name) out.push('no instruction or name');
  if (givesAway(step)) out.push('gives its answer away');
  switch (step.kind) {
    case 'choice': {
      const keys = step.options.map((o) => o.text);
      if (step.options.length < 2 || new Set(keys).size !== keys.length) out.push(`options: ${keys.join(' | ')}`);
      if (step.answer < 0 || step.answer >= step.options.length) out.push('answer out of range');
      if (step.prompt.plain && step.prompt.text?.includes('《')) out.push('a plain prompt with readings');
      if (step.prompt.plain && step.options.some((o) => o.text.includes('《'))) out.push('plain options with readings');
      break;
    }
    case 'label':
      if (step.items.length < 3 || new Set(step.items.map((i) => i.label)).size !== 2) out.push('label items');
      break;
    case 'order': {
      const accepted = step.accepted[0]!;
      if (new Set(accepted).size !== accepted.length || accepted.some((i) => i < 0 || i >= step.tiles.length)) out.push('accepted order');
      const a = newAnswer();
      a.order = accepted;
      if (!grade(step, a)) out.push('the accepted order is graded wrong');
      break;
    }
    case 'pairs':
      if (step.pairs.length < 3 || new Set(step.pairs.map((p) => p.left)).size !== step.pairs.length || new Set(step.pairs.map((p) => p.right)).size !== step.pairs.length) out.push('pairs');
      break;
    case 'units': {
      const total = step.words.flat().length;
      if (!step.answer.length || step.answer.some((i) => i < 0 || i >= total) || (step.single && step.answer.length !== 1)) out.push('units answer');
      const a = newAnswer();
      a.taps = new Set(step.answer);
      if (!grade(step, a)) out.push('the answer is graded wrong');
      break;
    }
    case 'write':
      if (!step.answer.trim()) out.push('nothing to write');
      break;
    default:
      out.push(`unexpected kind ${step.kind}`);
  }
  return out.map((p) => `${step.type}: ${p}`);
}

describe('drills', () => {
  for (const [lang, data] of Object.entries(DRILL_DATA)) {
    it(`builds every ${lang} drill well formed, in each lesson it fits`, () => {
      const steps = drillLessons(lang).flatMap((_, at) => buildAll(lang, at));
      expect(steps.length).toBeGreaterThan(0);
      expect(steps.flatMap(problems)).toEqual([]);
    });
  }

  it('come up only in a language’s first few lessons', () => {
    expect(drillsFor(drillLessons('fr')[0]!)?.types(true)).toEqual(['minimal_pair', 'dictation']);
    expect(drillsFor(drillLessons('fr')[4]!)).toBeUndefined();
    // Counters come up in the lesson that teaches them, past the first few.
    expect(drillsFor(drillLessons('ja')[10]!)?.types(true)).toEqual(['which_counter', 'count_it']);
    expect(drillsFor(drillLessons('ja')[11]!)).toBeUndefined();
    expect(drillsFor(drillLessons('ja')[1]!)?.types(true)).not.toContain('minimal_pair');
    expect(drillsFor(drillLessons('ja')[2]!)?.types(true)).toContain('minimal_pair');
    expect(drillsFor(drillLessons('ja')[7]!)?.types(true)).toEqual(['word_sort', 'make_form']);
    // No voice: the listening drills are left out.
    expect(drillsFor(drillLessons('fr')[0]!)?.types(false)).toEqual([]);
    expect(drillsFor(drillLessons('ru')[0]!)?.types(false)).toEqual(['letter_sound', 'decode', 'fade']);
    expect(drillsFor(drillLessons('ru')[2]!)?.types(false)).toEqual(['letter_sound', 'decode', 'stress']);
  });

  it('leave culture lessons out, and out of the count', () => {
    const culture = syllabusLessons.filter((l) => l.kind === 'culture');
    expect(culture.length).toBeGreaterThan(0);
    expect(culture.filter((l) => drillsFor(l))).toEqual([]);
  });

  it('give every language with a syllabus some drills', () => {
    for (const lang of Object.keys(DRILL_DATA)) expect(drillLessons(lang).length).toBeGreaterThanOrEqual(DRILL_DATA[lang]!.lessons);
  });

  it('show a letter the lesson has taught, and its sound among sounds alike', () => {
    const steps = buildAll('ko', 0).filter((s) => s.type === 'letter_sound');
    const shown = new Set(steps.map((s) => (s.kind === 'choice' ? s.prompt.text : '')));
    expect([...shown].every((l) => 'ㅏㅓㅗㅜㅡㅣ'.includes(l!))).toBe(true);
  });

  it('romanise the letters a reader hasn’t learned yet', () => {
    const steps = buildAll('ru', 0).filter((s) => s.type === 'fade');
    for (const s of steps) {
      if (s.kind !== 'choice') continue;
      // Only part 1's letters stay Cyrillic; the rest are *marked* Latin.
      const cyrillic = s.prompt.text!.replace(/\*[^*]+\*/g, '');
      expect(cyrillic).toMatch(/^[акмотвнрсух]+$/);
    }
  });
});

describe('drill data', () => {
  it('has each language’s letters once, and look-alikes only from its table', () => {
    for (const [lang, data] of Object.entries(DRILL_DATA)) {
      const letters = data.letters?.list.map((l) => l.letter) ?? [];
      expect(new Set(letters).size, lang).toBe(letters.length);
      const missing = (data.letters?.alike ?? []).flat().filter((l) => !letters.includes(l));
      expect(missing, lang).toEqual([]);
    }
  });

  it('pairs every kana with a sound', () => {
    const list = DRILL_DATA.ja!.letters!.list;
    expect(list.filter((l) => l.set === 'hiragana')).toHaveLength(68);
    expect(list.filter((l) => l.set === 'katakana').every((k) => list.some((h) => h.set === 'hiragana' && h.sound === k.sound))).toBe(true);
  });

  it('never offers a right reading of a counted number as a wrong one', () => {
    for (const c of DRILL_DATA.ja!.counters!.list) {
      for (const n of c.numbers) {
        expect(n.wrong.length, n.text).toBeGreaterThanOrEqual(2);
        expect(n.wrong, n.text).not.toContain(n.reading);
        expect(n.wrong, n.text).not.toContain('はちほん');
        expect(n.wrong, n.text).not.toContain('はちはい');
      }
    }
  });

  it('builds each Korean block from its letters', () => {
    for (const b of DRILL_DATA.ko!.blocks!.list) {
      const block = composeBlock(b.letters);
      expect(block, b.reading).toMatch(/^[가-힣]$/);
      expect(withoutReadings(b.word).includes(block) || b.letters[0] === 'ㅇ', b.reading).toBe(true);
    }
  });

  it('writes each word’s pinyin as its syllables, with a tone on each', () => {
    for (const w of DRILL_DATA.zh!.tones!.words) {
      expect(w.syllables.join(''), w.text).toBe(readingsOnly(w.text));
      expect(w.syllables.map(toneOf).every((t) => t > 0), w.text).toBe(true);
      expect(w.syllables.map(toneOf), w.text).not.toEqual([3, 3]);
    }
  });

  it('cuts each Russian word into its syllables', () => {
    for (const w of DRILL_DATA.ru!.stress!.words) expect(w.syllables.join(''), w.text).toBe(withoutReadings(w.text));
  });

  it('marks the word with several readings in each unvoweled sentence', () => {
    for (const lang of ['he', 'ar']) for (const u of DRILL_DATA[lang]!.unvoweled!) expect(u.sentence).toContain(`*${u.spelled}*`);
  });

  it('has silent letters in each French sentence', () => {
    for (const s of DRILL_DATA.fr!.silent!.sentences) expect(silentUnits(s.text).answer.length, s.text).toBeGreaterThan(0);
    expect(silentUnits('Le peti[t] cha[t].')).toEqual({ words: [['L', 'e'], ['p', 'e', 't', 'i', 't'], ['c', 'h', 'a', 't']], answer: [6, 10], shown: 'Le petit chat.', marked: ['peti(t)', 'cha(t)'] });
  });

  it('marks one word in each Gaelic lenition phrase, with a known sound if lenited', () => {
    const { phrases, sounds } = DRILL_DATA.gd!.lenition!;
    for (const p of phrases) {
      const marked = p.text.match(/\*([^*]+)\*/g) ?? [];
      expect(marked, p.text).toHaveLength(1);
      const word = marked[0]!.slice(1, -1);
      if (word[1] === 'h') expect(sounds[word.slice(0, 2).toLowerCase()], p.text).toBeDefined();
    }
  });

  it('spells each Gaelic word broad with broad and slender with slender, and each misspelling not', () => {
    const vowels = 'aeiouàèìòù';
    const slender = (v: string) => 'eièì'.includes(v);
    const keeps = (w: string) => [...w.toLowerCase().matchAll(new RegExp(`([${vowels}])[^${vowels}]+(?=([${vowels}]))`, 'g'))].every((m) => slender(m[1]!) === slender(m[2]!));
    for (const w of DRILL_DATA.gd!.spelling!.words) {
      expect(keeps(w.text), w.text).toBe(true);
      for (const wrong of w.wrong) expect(keeps(wrong), wrong).toBe(false);
    }
  });

  it('puts the Gaelic article on a noun by its gender and first letters', () => {
    const { article } = DRILL_DATA.gd!.articles!;
    const cases: Array<[string, string, string]> = [
      ['cù', 'm', 'an cù'], ['bàta', 'm', 'am bàta'], ['eilean', 'm', 'an t-eilean'],
      ['caileag', 'f', 'a’ chaileag'], ['bò', 'f', 'a’ bhò'], ['sràid', 'f', 'an t-sràid'], ['sùil', 'f', 'an t-sùil'],
    ];
    for (const [noun, gender, text] of cases) expect(article(noun, gender).text).toBe(text);
  });
});

describe('Hangul blocks', () => {
  it('are built from a consonant, a vowel and a final consonant', () => {
    expect(composeBlock(['ㅎ', 'ㅏ', 'ㄴ'])).toBe('한');
    expect(composeBlock(['ㄴ', 'ㅏ'])).toBe('나');
    expect(composeBlock(['ㅃ', 'ㅏ', 'ㅇ'])).toBe('빵');
  });

  it('leave letters that make no block as they are', () => {
    expect(composeBlock(['ㅎ'])).toBe('ㅎ');
    expect(composeBlock(['ㅏ', 'ㅎ'])).toBe('ㅏㅎ');
    expect(composeBlock(['ㅎ', 'ㅏ', 'ㅏ'])).toBe('하ㅏ');
  });
});

describe('pinyin tones', () => {
  it('are read from the tone marks', () => {
    expect(['mā', 'má', 'mǎ', 'mà', 'ma'].map(toneOf)).toEqual([1, 2, 3, 4, 0]);
  });

  it('move to the vowel that takes them', () => {
    expect(retone('lǎo', 1)).toBe('lāo');
    expect(retone('shī', 4)).toBe('shì');
    expect(retone('duì', 3)).toBe('duǐ');
    expect(retone('liù', 2)).toBe('liú');
    expect(retone('lǜ', 3)).toBe('lǚ');
    expect(retone('Zhōng', 2)).toBe('Zhóng');
    expect(retone('dōu', 4)).toBe('dòu');
  });
});

describe('a typed answer', () => {
  it('counts accents but not case, spacing or punctuation', () => {
    expect(sameSpelling('Frère ', 'frère')).toBe(true);
    expect(sameSpelling('frere', 'frère')).toBe(false);
    expect(sameSpelling('l’école.', "l'école")).toBe(true);
  });
});

describe('planning drills', () => {
  it('makes about one exercise in three a drill, never one used lately', () => {
    const session = newSession();
    const lesson = { level: 'CEFR A1', points: ['a', 'b', 'c'], words: ['w1', 'w2', 'w3', 'w4', 'w5'] };
    const drills = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6'];
    const rng = seededRng('plan');
    const types = Array.from({ length: 600 }, () => planNext(lesson, newCoverage(), session, rng.next, { listening: true, drills }).type);
    const share = types.filter((t) => drills.includes(t)).length / types.length;
    expect(share).toBeGreaterThan(DRILL_SHARE - 0.05);
    expect(share).toBeLessThan(DRILL_SHARE + 0.05);
    types.forEach((t, i) => {
      if (drills.includes(t)) expect(types.slice(Math.max(0, i - RECENT_EXERCISES), i)).not.toContain(t);
    });
  });

  it('gives a drill no point or words, and leaves the point’s cluster alone', () => {
    const session = newSession();
    const lesson = { level: 'CEFR A1', points: ['a', 'b'], words: ['w1', 'w2', 'w3', 'w4'] };
    const plan = planNext(lesson, newCoverage(), session, () => 0, { listening: true, drills: ['d1'] });
    expect(plan).toEqual({ index: 0, type: 'd1', words: [] });
    expect(session.cluster).toBeUndefined();
  });
});

it('every drill has a distinct id', () => {
  expect(new Set(DRILLS.map((d) => d.id)).size).toBe(DRILLS.length);
});
