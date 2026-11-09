import { composeBlock, vowelPlace } from '../../hangul';
import type { Rng } from '../../passage/rng';
import { readingsOnly, withoutReadings } from '../../ruby';
import { scramble } from '../exercises';
import type { Exercise, Line, Option, Prompt } from '../types';
import { retone, toneOf } from './pinyin';
import type { DrillData, Letter, Word } from './types';

/**
 * The drills: short exercises on a language's sounds or script, built by code from its data
 * (`types.ts`), with no model call. Each says when it fits a lesson and builds one exercise;
 * `listening` ones play audio and need something to read the language aloud.
 */
export interface Drill {
  id: string;
  /** On the chip above it. */
  name: string;
  listening?: true;
  /** On something a later lesson teaches (counters), not sounds or script: it comes up in that lesson, past `DrillData.lessons`. */
  taught?: true;
  fits(d: DrillData, at: number): boolean;
  build(d: DrillData, ctx: DrillContext): { exercise: Exercise; instruction: string } | null;
}

export interface DrillContext {
  /** The lesson, counted from 0 in the language's syllabus. */
  at: number;
  /** The lesson's theme words (the kit's), for the drills that use them. */
  words: readonly string[];
  /** Their English, by word, where the kit has it. */
  glosses: Readonly<Record<string, string>>;
  /** Something can read the language aloud: a drill can play what it's about. */
  listening: boolean;
  rng: Rng;
}

const bare = (text: string) => withoutReadings(text).replace(/\*/g, '');
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth'];

/** A one-answer exercise with the right option (`options[0]`) shuffled in. */
function choice(rng: Rng, prompt: Prompt, options: Option[], why: string, full?: Line): Exercise {
  const order = rng.sample(range(options.length), options.length);
  return { kind: 'choice', prompt, options: order.map((i) => options[i]!), answer: order.indexOf(0), why, ...(full ? { full } : {}) };
}

const taught = (d: DrillData, at: number) => d.letters?.list.filter((l) => l.at <= at) ?? [];

/** Letters that look or sound like `letter`, in the language's table. */
function alikeOf(d: DrillData, letter: Letter): Letter[] {
  const names = new Set((d.letters?.alike ?? []).filter((g) => g.includes(letter.letter)).flat());
  names.delete(letter.letter);
  return (d.letters?.list ?? []).filter((l) => names.has(l.letter) && (l.set ?? '') === (letter.set ?? ''));
}

/**
 * Up to `n` wrong answers for `target`: letters alike first, then taught ones, then any, from its
 * own script; none sharing a sound with it or with each other, so only one option is right.
 */
function wrongLetters(d: DrillData, target: Letter, pool: Letter[], rng: Rng, n = 3): Letter[] {
  const sameSet = (l: Letter) => (l.set ?? '') === (target.set ?? '');
  const tiers = [alikeOf(d, target), pool.filter(sameSet), (d.letters?.list ?? []).filter(sameSet)];
  const out: Letter[] = [];
  const sounds = new Set([target.sound]);
  for (const tier of tiers) {
    for (const l of rng.sample(tier, tier.length)) {
      if (out.length >= n) return out;
      if (sounds.has(l.sound) || l.letter === target.letter) continue;
      sounds.add(l.sound);
      out.push(l);
    }
  }
  return out;
}

/** One of `pool`, the letters this lesson brings in more often than older ones. */
function newest<T extends { at?: number }>(pool: T[], at: number, rng: Rng): T {
  const fresh = pool.filter((x) => (x.at ?? 0) === at);
  return fresh.length && rng.next() < 0.6 ? rng.pick(fresh) : rng.pick(pool);
}

const available = <T extends { at?: number }>(xs: readonly T[] | undefined, at: number) => (xs ?? []).filter((x) => (x.at ?? 0) <= at);

/** Other words' English, for the wrong answers to "what does it mean?". */
function otherMeanings(words: readonly Word[], target: Word, rng: Rng, n = 3): Option[] {
  const ens = [...new Set(words.map((w) => w.en))].filter((en) => en !== target.en);
  return rng.sample(ens, n).map((text) => ({ text }));
}

const meaningWhy = (w: Word) => (w.roman ? `${bare(w.text)} (${w.roman}): “${w.en}”.` : `${w.text}: “${w.en}”.`);

const letterSound: Drill = {
  id: 'letter_sound',
  name: 'Letter to sound',
  fits: (d, at) => taught(d, at).length >= 4,
  build(d, { at, rng }) {
    const pool = taught(d, at);
    const target = newest(pool, at, rng);
    const wrong = wrongLetters(d, target, pool, rng, target.trap ? 2 : 3);
    const options: Option[] = [{ text: target.sound, ...(target.like ? { en: target.like } : {}) }, ...wrong.map((l) => ({ text: l.sound, ...(l.like ? { en: l.like } : {}) }))];
    if (target.trap && !options.some((o) => o.text === target.trap)) options.push({ text: target.trap, en: 'as it looks in English' });
    const alike = wrong.filter((l) => alikeOf(d, target).includes(l));
    const why = `${target.letter} is ${target.sound}${target.like ? `, ${target.like}` : ''}.${alike.length ? ` Don’t mix it up with ${alike.map((l) => `${l.letter} (${l.sound})`).join(' or ')}.` : ''}${target.trap ? ` It looks like an English ${target.trap}, but isn’t one.` : ''}`;
    return { exercise: choice(rng, { text: target.letter, plain: true }, options, why), instruction: 'How is this letter said?' };
  },
};

const soundLetter: Drill = {
  id: 'sound_letter',
  name: 'Which letter?',
  listening: true,
  fits: (d, at) => taught(d, at).filter((l) => l.say).length >= 4,
  build(d, { at, rng }) {
    const pool = taught(d, at);
    const target = newest(pool.filter((l) => l.say), at, rng);
    const wrong = wrongLetters(d, target, pool, rng);
    const said = target.say === target.letter ? '' : `You heard ${target.say}: `;
    const why = `${said}${target.letter} is ${target.sound}${target.like ? `, ${target.like}` : ''}.`;
    return { exercise: choice(rng, { audio: target.say!, plain: true }, [target, ...wrong].map((l) => ({ text: l.letter })), why), instruction: 'Which letter do you hear?' };
  },
};

const decode: Drill = {
  id: 'decode',
  name: 'Read a word you know',
  fits: (d, at) => available(d.loans, at).length > 0 && (d.loans?.length ?? 0) >= 4,
  build(d, { at, rng }) {
    const target = newest(available(d.loans, at), at, rng);
    const options = [{ text: target.en }, ...otherMeanings(d.loans!, target, rng)];
    return {
      exercise: choice(rng, { text: bare(target.text), plain: true }, options, meaningWhy(target), { text: target.text, en: target.en }),
      instruction: 'A word you know from English. What is it?',
    };
  },
};

/** A word with the letters not yet taught romanised and marked: привет before и, е → *p*р*i*в*e*т. */
function faded(text: string, known: Set<string>, roman: Record<string, string>): string {
  let out = '';
  let run = '';
  for (const ch of bare(text)) {
    if (known.has(ch.toLowerCase())) {
      if (run) out += `*${run}*`;
      run = '';
      out += ch;
    } else {
      run += roman[ch.toLowerCase()] ?? ch;
    }
  }
  return run ? `${out}*${run}*` : out;
}

const mixed = (d: DrillData, at: number) => {
  const known = new Set(taught(d, at).map((l) => l.letter));
  const words = (d.fade?.words ?? []).filter((w) => {
    const chars = [...bare(w.text).toLowerCase()];
    return chars.some((c) => known.has(c)) && chars.some((c) => !known.has(c));
  });
  return { known, words };
};

const fade: Drill = {
  id: 'fade',
  name: 'Read it',
  fits: (d, at) => mixed(d, at).words.length > 0 && (d.fade?.words.length ?? 0) >= 4,
  build(d, { at, rng }) {
    const { known, words } = mixed(d, at);
    const target = rng.pick(words);
    const roman = d.fade!.roman;
    const missing = [...new Set([...bare(target.text).toLowerCase()].filter((c) => !known.has(c)))];
    const why = `${meaningWhy(target)} Still to come: ${missing.map((c) => `${c} (${roman[c] ?? c})`).join(', ')}.`;
    return {
      exercise: choice(rng, { text: faded(target.text, known, roman), plain: true }, [{ text: target.en }, ...otherMeanings(d.fade!.words, target, rng)], why, { text: target.text, en: target.en }),
      instruction: 'Letters you haven’t learned yet are in Latin letters. What does it say?',
    };
  },
};

const stress: Drill = {
  id: 'stress',
  name: 'Stress',
  fits: (d, at) => Boolean(d.stress && at >= d.stress.at),
  build(d, { rng, listening }) {
    const w = rng.pick(d.stress!.words);
    const last = w.stressed === w.syllables.length - 1;
    const notes = d.stress!.notes.filter((n) => w.syllables.some((s, i) => i !== w.stressed && s.includes(n.letter))).map((n) => ` ${n.note}`);
    const why = `${w.text}: the stress falls on the ${last ? 'last' : ORDINALS[w.stressed]} syllable, ${w.syllables[w.stressed]}.${notes.join('')} Spelling never shows the stress.`;
    return {
      exercise: { kind: 'units', prompt: listening ? { audio: w.text } : {}, words: [w.syllables], answer: [w.stressed], single: true, boxed: true, full: { text: w.text, en: w.en }, why },
      instruction: `Tap the stressed syllable of ${bare(w.text)}, “${w.en}”.`,
    };
  },
};

/** Katakana taught by `at`, each with its hiragana (the letter with the same sound). */
function kanaPairsAt(d: DrillData, at: number): Array<{ hira: string; kata: string }> {
  const list = taught(d, at);
  return list.filter((l) => l.set === 'katakana').flatMap((k) => {
    const h = list.find((l) => l.set === 'hiragana' && l.sound === k.sound);
    return h ? [{ hira: h.letter, kata: k.letter }] : [];
  });
}

const kanaPairs: Drill = {
  id: 'kana_pairs',
  name: 'Kana pairs',
  fits: (d, at) => Boolean(d.kanaPairs) && kanaPairsAt(d, at).length >= 8,
  build(d, { at, rng }) {
    const all = kanaPairsAt(d, at);
    const groups = d.kanaPairs!.map((g) => all.filter((p) => g.includes(p.kata))).filter((g) => g.length >= 2);
    const group = groups.length ? rng.pick(groups) : [];
    const rest = rng.sample(all.filter((p) => !group.includes(p)), Math.max(0, 4 - group.length));
    const chosen = rng.sample([...group, ...rest].slice(0, 5), Math.min(5, group.length + rest.length));
    const pairs = chosen.map((p) => ({ left: p.hira, right: p.kata }));
    return { exercise: { kind: 'pairs', pairs, shuffle: scramble(rng, pairs.length) }, instruction: 'Match each hiragana to its katakana' };
  },
};

/** The letters of a block, by sound: the table's, or a final consonant's. */
const letterSoundOf = (d: DrillData, letter: string) => d.letters?.list.find((l) => l.letter === letter)?.sound ?? '';

const buildBlock: Drill = {
  id: 'build_block',
  name: 'Build the block',
  fits: (d, at) => available(d.blocks?.list, at).length > 0,
  build(d, { at, rng }) {
    const target = newest(available(d.blocks!.list, at), at, rng);
    const pool = taught(d, at);
    const near = target.letters.flatMap((l) => {
      const letter = pool.find((x) => x.letter === l);
      return letter ? alikeOf(d, letter).filter((x) => x.at <= at) : [];
    });
    const extra = rng.sample([...new Set(near.map((l) => l.letter))].filter((l) => !target.letters.includes(l)), 3);
    const tiles = [...target.letters, ...extra];
    const order = scramble(rng, tiles.length);
    const [first, vowel, final] = target.letters as [string, string, string?];
    const place = { beside: 'beside it', under: 'under it', both: 'under and beside it' }[vowelPlace(vowel)];
    const firstSound = letterSoundOf(d, first) || d.blocks!.silent;
    const why = `${first}《${firstSound}》 comes first, ${vowel}《${letterSoundOf(d, vowel)}》 ${place}${final ? `, and ${final}《${d.blocks!.finals[final] ?? letterSoundOf(d, final)}》 at the bottom, the final consonant` : ''}: ${composeBlock(target.letters)}《${target.reading}》.`;
    return {
      exercise: {
        kind: 'order',
        prompt: {},
        tiles: order.map((i) => tiles[i]!),
        accepted: [target.letters.map((_, k) => order.indexOf(k))],
        layout: 'inline',
        full: [{ text: target.word, en: target.en }],
        why,
        preview: 'block',
      },
      instruction:
        readingsOnly(target.word) === target.reading
          ? `Build the block for ${target.reading}, “${target.en}”.`
          : `Build the block for ${target.reading}, as in ${readingsOnly(target.word)}, “${target.en}”.`,
    };
  },
};

const vowelSign: Drill = {
  id: 'vowel_sign',
  name: 'Vowel signs',
  fits: (d, at) => Boolean(d.vowelSigns && at >= d.vowelSigns.at),
  build(d, { at, rng, listening }) {
    const vs = d.vowelSigns!;
    const bases = taught(d, at).filter((l) => l.base);
    const base = bases.length ? rng.pick(bases) : { letter: vs.fallback.letter, sound: vs.fallback.sound };
    const stem = base.sound.replace(/a$/, '');
    const target = rng.pick(vs.signs);
    const alike = new Set(vs.alike.filter((g) => g.includes(target.sign)).flat());
    const near = vs.signs.filter((s) => s !== target && alike.has(s.sign));
    const others = rng.sample(vs.signs.filter((s) => s !== target && !near.includes(s)), Math.max(0, 3 - near.length));
    const signs = [target, ...rng.sample(near, 3), ...others].slice(0, 4);
    const spell = (s: (typeof signs)[number]) => ({ text: base.letter + s.sign, sound: stem + s.sound });
    const right = spell(target);
    const alt = near.filter((s) => signs.includes(s)).map(spell);
    const why = `${right.text}《${right.sound}》: ${target.where}.${alt.map((a) => ` ${a.text}《${a.sound}》 says ${a.sound}.`).join('')}`;
    return {
      exercise: choice(rng, { plain: true, ...(listening ? { audio: right.text } : {}) }, signs.map((s) => ({ text: spell(s).text })), why),
      instruction: `Which one says ${right.sound}?`,
    };
  },
};

const joinLetters: Drill = {
  id: 'join_letters',
  name: 'Join the letters',
  fits: (d, at) => available(d.join?.words, at).length > 0,
  build(d, { at, rng }) {
    const target = newest(available(d.join!.words, at), at, rng);
    const chars = [...bare(target.text)];
    const pool = taught(d, at);
    const near = chars.flatMap((c) => {
      const letter = pool.find((l) => l.letter === c);
      return letter ? alikeOf(d, letter).filter((l) => l.at <= at && !chars.includes(l.letter)) : [];
    });
    const tiles = [...chars, ...(near.length ? [rng.pick(near).letter] : [])];
    const order = scramble(rng, tiles.length);
    const breaks = d.join!.nonJoining;
    const forms = chars.map((c, i) => {
      const fromPrev = i > 0 && !breaks.includes(chars[i - 1]!);
      const toNext = i < chars.length - 1 && !breaks.includes(c);
      return fromPrev && toNext ? `ـ${c}ـ (middle)` : toNext ? `${c}ـ (start)` : fromPrev ? `ـ${c} (end)` : `${c} (alone)`;
    });
    const breakers = [...new Set(chars.slice(0, -1).filter((c) => breaks.includes(c)))];
    const why = `${target.text}: ${forms.join(', ')}.${breakers.length ? ` ${breakers.join(' and ')} never ${breakers.length > 1 ? 'join' : 'joins'} the letter after ${breakers.length > 1 ? 'them' : 'it'}.` : ''}`;
    return {
      exercise: {
        kind: 'order',
        prompt: {},
        tiles: order.map((i) => tiles[i]!),
        accepted: [chars.map((_, k) => order.indexOf(k))],
        layout: 'inline',
        full: [{ text: target.text, en: target.en }],
        why,
        preview: 'join',
      },
      instruction: `Spell ${readingsOnly(target.text)}, “${target.en}”, and watch the letters join.`,
    };
  },
};

const sunMoon: Drill = {
  id: 'sun_moon',
  name: 'Sun and moon letters',
  fits: (d, at) => Boolean(d.sunMoon && at >= d.sunMoon.at),
  build(d, { rng }) {
    const { sun, words, why } = d.sunMoon!;
    const label = (w: Word) => (sun.includes(bare(w.text)[2] ?? '') ? 1 : 0);
    const both = [0, 1].flatMap((k) => rng.sample(words.filter((w) => label(w) === k), 2));
    const items = rng.sample(both, both.length).map((w) => ({ text: bare(w.text), en: `${readingsOnly(w.text)}, ${w.en}`, label: label(w), why: '', fix: '' }));
    return {
      exercise: { kind: 'label', prompt: {}, labels: [{ text: 'l said' }, { text: 'l becomes the next letter' }], items, why },
      instruction: 'Is the l of ال said, or does it become the next letter?',
    };
  },
};

const unvoweled: Drill = {
  id: 'unvoweled',
  name: 'Without vowels',
  fits: (d, at) => available(d.unvoweled, at).length > 0,
  build(d, { at, rng }) {
    const item = rng.pick(available(d.unvoweled, at));
    const [right, ...others] = item.options as [(typeof item.options)[number], ...typeof item.options];
    const full = { text: item.sentence.replace(`*${item.spelled}*`, `${item.spelled}《${right.reading}》`), en: item.en };
    const why = `${item.spelled}《${right.reading}》, “${right.en}”. Without vowel points, ${others.map((o) => `${o.reading} (“${o.en}”)`).join(' and ')} ${others.length > 1 ? 'are' : 'is'} spelled the same, so the sentence tells you which word it is.`;
    return {
      exercise: choice(rng, { text: item.sentence, quiet: true }, item.options.map((o) => ({ text: o.reading, en: o.en })), why, full),
      instruction: `How is ${item.spelled} read here?`,
    };
  },
};

const tonePair: Drill = {
  id: 'tone_pair',
  name: 'Tones',
  listening: true,
  fits: (d) => Boolean(d.tones?.words.length),
  build(d, { rng }) {
    const { words, names } = d.tones!;
    const w = rng.pick(words);
    const [a, b] = w.syllables.map(toneOf) as [number, number];
    const others = [1, 2, 3, 4];
    const firstOnly = rng.pick(others.filter((t) => t !== a));
    const secondOnly = rng.pick(others.filter((t) => t !== b));
    const both = rng.pick(others.filter((t) => t !== a && t !== firstOnly));
    const pairs: Array<[number, number]> = [[a, b], [firstOnly, b], [a, secondOnly], [both, rng.pick(others.filter((t) => t !== b))]];
    const seen = new Set<string>();
    const options = pairs.filter(([x, y]) => !seen.has(`${x}${y}`) && seen.add(`${x}${y}`)).map(([x, y]) => ({
      text: `${retone(w.syllables[0]!, x)} ${retone(w.syllables[1]!, y)}`,
      en: `tones ${x} + ${y}`,
    }));
    const why = `${w.text}, “${w.en}”: ${names[a]}, then ${names[b]}.`;
    return { exercise: choice(rng, { audio: w.text, en: w.en }, options, why), instruction: 'Which tones do you hear?' };
  },
};

const minimalPair: Drill = {
  id: 'minimal_pair',
  name: 'Which word?',
  listening: true,
  fits: (d, at) => available(d.pairs, at).length > 0,
  build(d, { at, rng }) {
    const pair = rng.pick(available(d.pairs, at));
    const side = rng.int(2);
    const heard = pair.words[side]!;
    const other = pair.words[1 - side]!;
    const why = `It was ${heard.text} (“${heard.en}”), not ${other.text} (“${other.en}”). ${pair.why}`;
    return { exercise: choice(rng, { audio: heard.text }, [heard, other].map((w) => ({ text: w.text, en: w.en })), why), instruction: 'Which word do you hear?' };
  },
};

const soundSort: Drill = {
  id: 'sound_sort',
  name: 'Sort by sound',
  fits: (d, at) => available(d.sorts, at).length > 0,
  build(d, { at, rng }) {
    const sort = rng.pick(available(d.sorts, at));
    const picked = [0, 1].flatMap((k) => rng.sample(sort.words.filter((w) => w.label === k), 2));
    const extra = rng.sample(sort.words.filter((w) => !picked.includes(w)), 1);
    const items = rng.sample([...picked, ...extra], picked.length + extra.length).map((w) => ({ text: w.text, en: w.en, label: w.label, why: '', fix: '' }));
    return {
      exercise: { kind: 'label', prompt: {}, labels: sort.labels.map((text) => ({ text })), items, why: sort.why, say: true },
      instruction: 'How is the marked letter said in each word?',
    };
  },
};

/** A sentence's words as letters (`[x]` marks silent ones), without punctuation; the silent letters' indexes. */
export function silentUnits(text: string): { words: string[][]; answer: number[]; shown: string; marked: string[] } {
  const words: string[][] = [];
  const answer: number[] = [];
  const marked: string[] = [];
  let n = 0;
  for (const token of text.split(/\s+/).filter(Boolean)) {
    const units: string[] = [];
    let inside = false;
    for (const ch of token) {
      if (ch === '[' || ch === ']') {
        inside = ch === '[';
        continue;
      }
      if (!/\p{L}/u.test(ch)) continue;
      if (inside) answer.push(n);
      units.push(ch);
      n++;
    }
    if (units.length) words.push(units);
    if (token.includes('[')) marked.push(token.replace(/[^\p{L}[\]]/gu, '').replace(/\[([^\]]+)\]/g, '($1)'));
  }
  return { words, answer, shown: text.replace(/[[\]]/g, ''), marked };
}

const silentLetters: Drill = {
  id: 'silent_letters',
  name: 'Silent letters',
  fits: (d, at) => Boolean(d.silent && at >= d.silent.at),
  build(d, { rng, listening }) {
    const s = rng.pick(d.silent!.sentences);
    const { words, answer, shown, marked } = silentUnits(s.text);
    return {
      exercise: { kind: 'units', prompt: listening ? { audio: shown } : {}, words, answer, single: false, boxed: false, full: { text: shown, en: s.en }, why: `Not said: ${marked.join(', ')}. ${d.silent!.why}` },
      instruction: 'Tap every letter you don’t say.',
    };
  },
};

const ACUTE = '\u0301';
/** A word with exactly one written accent (`mark`), put back by the drill. */
const accentable = (w: string, mark: string) => /^\p{L}+$/u.test(w) && w.normalize('NFD').split(mark).length === 2;

const accentPlace: Drill = {
  id: 'accent_place',
  name: 'Accents',
  fits: (d, at) => Boolean(d.accents && at >= d.accents.at),
  build(d, { rng, words, glosses }) {
    const { list, articles, rule, mark = ACUTE } = d.accents!;
    const fits = (w: string) => accentable(w, mark);
    const fromLesson = words.flatMap((w) => {
      const bare = w.toLowerCase().split(/\s+/).filter((x) => !articles.includes(x));
      return bare.length === 1 && fits(bare[0]!) ? [{ text: bare[0]!, en: glosses[w] ?? '' }] : [];
    });
    const { text: word, en } = fromLesson.length && rng.next() < 0.5 ? rng.pick(fromLesson) : rng.pick(list.filter((w) => fits(w.text)));
    const plainWord = word.normalize('NFD').replace(mark, '').normalize('NFC');
    const letters = [...plainWord];
    const at = [...word].findIndex((ch, i) => ch !== letters[i]);
    return {
      exercise: { kind: 'units', prompt: {}, words: [letters], answer: [at], single: true, boxed: false, full: { text: word, en }, why: `${word}: ${rule(plainWord)}` },
      instruction: `${plainWord} is missing its written accent. Tap the vowel that takes it.`,
    };
  },
};

/** A theme word to write as heard: letters, apostrophes and hyphens, up to three words. */
const writable = (w: string) => /^\p{L}[\p{L}'’-]*( \p{L}[\p{L}'’-]*){0,2}$/u.test(w.trim()) && w.length <= 24;

const dictation: Drill = {
  id: 'dictation',
  name: 'Dictation',
  listening: true,
  fits: (d) => Boolean(d.dictation?.length),
  build(d, { rng, words }) {
    const fromLesson = words.filter(writable);
    const word = fromLesson.length && rng.next() < 0.7 ? rng.pick(fromLesson) : rng.pick(d.dictation!);
    return { exercise: { kind: 'write', prompt: { audio: word }, answer: word, why: `It’s ${word}.` }, instruction: 'Type what you hear, accents and all.' };
  },
};

/** A lenition phrase: its `*marked*` word, whether that's lenited (an h after its first letter), and the word without it. */
function lenitionOf(p: NonNullable<DrillData['lenition']>['phrases'][number]) {
  const word = p.text.match(/\*([^*]+)\*/)![1]!;
  const lenited = /^[bcdfgmpst]h/i.test(word);
  const plain = lenited ? word[0] + word.slice(2) : word;
  return { word, lenited, plain, base: p.base ?? plain, phrase: p.text.replace(/\*/g, '') };
}

/** The lesson's phrases with a lenited word whose sound is known. */
const lenitedPhrases = (d: DrillData, at: number) =>
  available(d.lenition?.phrases, at).filter((p) => {
    const { word, lenited } = lenitionOf(p);
    return lenited && d.lenition!.sounds[word.slice(0, 2).toLowerCase()];
  });

const lenition: Drill = {
  id: 'lenition',
  name: 'Lenition',
  fits: (d, at) => lenitedPhrases(d, at).length > 0,
  build(d, { at, rng }) {
    const { sounds, phrases } = d.lenition!;
    const p = newest(lenitedPhrases(d, at), at, rng);
    const { word, base, phrase } = lenitionOf(p);
    const letters = word.slice(0, 2);
    const known = sounds[letters.toLowerCase()]!;
    const sound = p.sound ?? known.sound;
    const all = [...Object.values(sounds).map((s) => s.sound), ...phrases.flatMap((x) => (x.sound ? [x.sound] : []))];
    const others = [...new Set(all)].filter((s) => s !== sound && s !== known.unlenited);
    const options = [sound, known.unlenited, ...rng.sample(others, 2)].map((text) => ({ text }));
    const said = sound === 'silent' ? `${letters} is silent` : `${letters} is said ${sound}`;
    return {
      exercise: choice(rng, { text: p.text.replace(`*${word}*`, `*${letters}*${word.slice(2)}`), en: p.en, quiet: true }, options, `${p.why}: ${base} → ${phrase}. ${said}.`),
      instruction: `How is ${letters} said here?`,
    };
  },
};

const lenitionForm: Drill = {
  id: 'lenition_form',
  name: 'Lenite or not?',
  fits: (d, at) => available(d.lenition?.phrases, at).length > 0,
  build(d, { at, rng }) {
    const p = newest(available(d.lenition!.phrases, at), at, rng);
    const { word, lenited, plain, base, phrase } = lenitionOf(p);
    const other = lenited ? plain : `${word[0]}h${word.slice(1)}`;
    return {
      exercise: choice(rng, { question: `“${p.en}”`, text: p.text.replace(`*${word}*`, '___') }, [{ text: word }, { text: other }], `${p.why}: ${base} → ${phrase}.`, { text: phrase, en: p.en }),
      instruction: 'Which form goes in the gap?',
    };
  },
};

const spellingRule: Drill = {
  id: 'spelling_rule',
  name: 'Spelling rule',
  fits: (d, at) => Boolean(d.spelling && at >= d.spelling.at),
  build(d, { rng }) {
    const w = rng.pick(d.spelling!.words);
    return {
      exercise: choice(rng, { question: `“${w.en}”` }, [w.text, ...w.wrong].map((text) => ({ text })), `${w.text}: ${d.spelling!.why}.`),
      instruction: 'Which is spelled right?',
    };
  },
};

const echoGroups = (d: DrillData, at: number) => (d.echoes ?? []).filter((g) => g.at <= at && available(g.questions, at).length);

const answerEcho: Drill = {
  id: 'answer_echo',
  name: 'Answer with the verb',
  fits: (d, at) => echoGroups(d, at).length > 0,
  build(d, { at, rng }) {
    const groups = echoGroups(d, at);
    const asked = groups.flatMap((g) => available(g.questions, at).map((q) => ({ ...q, g })));
    const { g, ...q } = newest(asked, at, rng);
    const yes = rng.int(2) === 0;
    const [right, opposite] = yes ? [g.yes, g.no] : [g.no, g.yes];
    const others = rng.sample(groups.filter((o) => o !== g).map((o) => (yes ? o.yes : o.no)), 1);
    const options = [...new Set([right, opposite, ...others, ...rng.sample(g.traps, 4 - 2 - others.length)])].map((text) => ({ text }));
    return {
      exercise: choice(rng, { question: `“${q.en}” Answer ${yes ? 'yes' : 'no'}.`, text: q.text, quiet: true }, options, g.why, { text: `${q.text} ${right}`, en: `${q.en} ${yes ? 'Yes.' : 'No.'}` }),
      instruction: 'There’s no word for yes or no: answer with the verb.',
    };
  },
};

const GENDERS: Record<string, string> = { m: 'masculine', f: 'feminine', n: 'neuter' };

const articleDrill: Drill = {
  id: 'article',
  name: 'The article',
  fits: (d, at) => Boolean(d.articles && at >= d.articles.at),
  build(d, { rng }) {
    const { nouns, article, forms, guess } = d.articles!;
    const n = rng.pick(nouns);
    const { text, why } = article(n.text, n.gender);
    const wrong = [...new Set(forms(n.text))].filter((f) => f !== text);
    const question = guess ? `“${n.en}”` : `“${n.en}” (${GENDERS[n.gender] ?? n.gender})`;
    return {
      exercise: choice(rng, { question, text: n.text }, [text, ...rng.sample(wrong, 3)].map((t) => ({ text: t })), `${why}.`, { text, en: n.en }),
      instruction: 'Which is right, article and all?',
    };
  },
};

/** Minutes to tell the time at, the ones said towards the next hour (and the quarters) more often. */
const MINUTES = [0, 5, 10, 15, 15, 20, 25, 25, 30, 30, 30, 35, 35, 40, 45, 45, 50, 55];
const clockHour = (h: number) => ((h + 11) % 12) + 1;
const clockDigits = (h: number, m: number) => `${h}:${String(m).padStart(2, '0')}`;

const clock: Drill = {
  id: 'clock',
  name: 'Telling the time',
  taught: true,
  fits: (d, at) => d.clock?.at === at,
  build(d, { rng, listening }) {
    const { say, sentence } = d.clock!;
    const h = rng.int(12) + 1;
    const m = rng.pick(MINUTES);
    // The hour after (halb drei read as 3:30), past and to swapped, the hour before, the half hour off.
    const near: Array<[number, number]> = [[clockHour(h + 1), m], [h, (60 - m) % 60], [clockHour(h - 1), m], [h, (m + 30) % 60]];
    const seen = new Set([clockDigits(h, m)]);
    const times: Array<[number, number]> = [[h, m], ...near.filter(([x, y]) => !seen.has(clockDigits(x, y)) && seen.add(clockDigits(x, y))).slice(0, 3)];
    const { text, why } = say(h, m);
    const full = { text: sentence.text.replace('{t}', text), en: sentence.en.replace('{t}', clockDigits(h, m)) };
    const way = rng.int(listening ? 3 : 2);
    if (way === 0) {
      return { exercise: choice(rng, { question: `It’s ${clockDigits(h, m)}.` }, times.map(([x, y]) => ({ text: say(x, y).text })), why, full), instruction: 'How do you say the time?' };
    }
    const prompt = way === 1 ? { text: full.text } : { audio: full.text };
    return { exercise: choice(rng, prompt, times.map(([x, y]) => ({ text: clockDigits(x, y) })), why, full), instruction: way === 1 ? 'What time is it?' : 'What time do you hear?' };
  },
};

const contradict: Drill = {
  id: 'contradict',
  name: 'Yes or no',
  taught: true,
  fits: (d, at) => d.contradict?.at === at,
  build(d, { rng }) {
    const { answers, why, questions } = d.contradict!;
    const negative = questions.filter((q) => q.negative);
    const q = negative.length && rng.next() < 0.7 ? rng.pick(negative) : rng.pick(questions);
    const yes = rng.int(2) === 0;
    const reply = yes ? q.yes : q.no;
    const word = !yes ? answers.no : q.negative ? answers.contra : answers.yes;
    const because = q.negative ? (yes ? why.contra : why.agree) : yes ? why.yes : why.no;
    const options = [word, ...[answers.yes, answers.no, answers.contra].filter((w) => w !== word)].map((text) => ({ text }));
    const full = { text: `${q.text} – ${word}, ${reply.text}.`, en: `${q.en} – ${yes ? 'Yes' : 'No'}, ${reply.en}.` };
    return {
      exercise: choice(rng, { question: `“${q.en}” You answer: ${reply.en}.`, text: `${q.text} – ___, ${reply.text}.` }, options, because, full),
      instruction: 'Which word starts the answer?',
    };
  },
};

const adjectiveEnding: Drill = {
  id: 'adjective_ending',
  name: 'Adjective endings',
  taught: true,
  fits: (d, at) => Boolean(d.endings?.phrases(at).length),
  build(d, { at, rng }) {
    const p = rng.pick(d.endings!.phrases(at));
    return {
      exercise: choice(rng, { question: `“${p.en}”`, text: p.text }, [p.right, ...rng.sample(p.wrong, 3)].map((text) => ({ text })), p.why, { text: p.text.replace('___', p.right), en: p.en }),
      instruction: 'Which form of the adjective goes in the gap?',
    };
  },
};

const whichCounter: Drill = {
  id: 'which_counter',
  name: 'Which counter?',
  taught: true,
  fits: (d, at) => d.counters?.at === at && d.counters.list.length >= 2,
  build(d, { rng }) {
    const { list } = d.counters!;
    const c = rng.pick(list);
    const thing = rng.pick(c.things);
    const others = rng.sample(list.filter((o) => o !== c), 3);
    const why = `${c.counter} counts ${c.counts}: ${thing.text}, “${thing.en}”.`;
    return {
      exercise: choice(rng, { question: `How many ${thing.en}?`, text: thing.text }, [c, ...others].map((o) => ({ text: o.counter })), why),
      instruction: 'Which counter goes with it?',
    };
  },
};

/** The counters with numbers to read. */
const counted = (d: DrillData) => d.counters?.list.filter((c) => c.numbers.length) ?? [];

const countIt: Drill = {
  id: 'count_it',
  name: 'Count it',
  taught: true,
  fits: (d, at) => d.counters?.at === at && counted(d).length > 0,
  build(d, { rng }) {
    const c = rng.pick(counted(d));
    const num = rng.pick(c.numbers);
    const thing = rng.pick(c.things);
    const said = `Counting ${thing.en}: ${num.n}`;
    const options = [num.reading, ...rng.sample(num.wrong, 3)].map((text) => ({ text }));
    return {
      exercise: choice(rng, { question: said, text: num.text, plain: true }, options, `${num.text}《${num.reading}》.${c.rule ? ` ${c.rule}` : ''}`, { text: `${thing.text}を${num.text}《${num.reading}》`, en: said }),
      instruction: 'How do you read it?',
    };
  },
};

const smallKana: Drill = {
  id: 'small_kana',
  name: 'Small kana',
  fits: (d, at) => available(d.smallKana?.words, at).length > 0,
  build(d, { at, rng }) {
    const { small } = d.smallKana!;
    const target = newest(available(d.smallKana!.words, at), at, rng);
    const chars = [...target.text];
    const smalls = [...new Set(chars.filter((c) => small[c]))];
    const tiles = [...chars, ...rng.sample(smalls.map((c) => small[c]!.big), 2)];
    const order = scramble(rng, tiles.length);
    const why = `${target.text} (${target.roman}): ${smalls.map((c) => `${c} is small, ${small[c]!.note}`).join('; ')}.`;
    return {
      exercise: { kind: 'order', prompt: {}, tiles: order.map((i) => tiles[i]!), accepted: [chars.map((_, k) => order.indexOf(k))], layout: 'inline', full: [{ text: target.text, en: target.en }], why },
      instruction: `Spell ${target.roman}, “${target.en}”.`,
    };
  },
};

const saidAs: Drill = {
  id: 'said_as',
  name: 'Said otherwise',
  fits: (d, at) => Boolean(d.saidAs && at >= d.saidAs.at),
  build(d, { rng, listening }) {
    const { ask, sentences, why } = d.saidAs!;
    const s = rng.pick(sentences);
    const { words, answer, shown, marked } = silentUnits(s.text);
    return {
      exercise: { kind: 'units', prompt: listening ? { audio: shown } : {}, words, answer, single: false, boxed: false, full: { text: shown, en: s.en }, why: `Said otherwise: ${marked.join(', ')}. ${why}` },
      instruction: ask,
    };
  },
};

const sortsAt = (d: DrillData, at: number) => (d.wordSorts ?? []).filter((s) => s.at === at);

const wordSort: Drill = {
  id: 'word_sort',
  name: 'Sort them',
  taught: true,
  fits: (d, at) => sortsAt(d, at).length > 0,
  build(d, { at, rng }) {
    const sort = rng.pick(sortsAt(d, at));
    const picked = [0, 1].flatMap((k) => rng.sample(sort.words.filter((w) => w.label === k), 2));
    const extra = rng.sample(sort.words.filter((w) => !picked.includes(w)), 1);
    const items = rng.sample([...picked, ...extra], picked.length + extra.length).map((w) => ({ text: w.text, en: w.en, label: w.label, why: '', fix: '' }));
    return { exercise: { kind: 'label', prompt: {}, labels: sort.labels.map((text) => ({ text })), items, why: sort.why }, instruction: sort.ask };
  },
};

const makeForm: Drill = {
  id: 'make_form',
  name: 'Make the form',
  taught: true,
  fits: (d, at) => d.forms?.at === at,
  build(d, { rng }) {
    const { name, list } = d.forms!;
    const w = rng.pick(list);
    return {
      exercise: choice(rng, { question: `“${w.en}”`, text: w.text }, [w.form, ...rng.sample(w.wrong, 3)].map((text) => ({ text })), w.why),
      instruction: `What is its ${name}?`,
    };
  },
};

const readingsAt = (d: DrillData, at: number) => (d.readings ?? []).filter((r) => r.at === at);

const readNumber: Drill = {
  id: 'read_number',
  name: 'Read it',
  taught: true,
  fits: (d, at) => readingsAt(d, at).length > 0,
  build(d, { at, rng }) {
    const set = rng.pick(readingsAt(d, at));
    const r = rng.pick(set.list);
    const options = [r.reading, ...rng.sample(r.wrong, 3)].map((text) => ({ text }));
    return {
      exercise: choice(rng, { question: r.en, text: r.text, plain: true }, options, `${r.text}《${r.reading}》. ${set.rule}`, { text: `${r.text}《${r.reading}》`, en: r.en }),
      instruction: 'How do you read it?',
    };
  },
};

const nearFar: Drill = {
  id: 'near_far',
  name: 'Near or far?',
  fits: (d, at) => Boolean(d.demonstratives && at >= d.demonstratives.at),
  build(d, { rng }) {
    const { places, nouns, alone, before, why } = d.demonstratives!;
    const place = rng.pick(places);
    const withNoun = rng.int(2) === 1;
    const noun = rng.pick(nouns);
    const s = rng.pick(withNoun ? before : alone);
    const text = s.text.replace('{noun}', noun.text);
    const right = withNoun ? place.before : place.alone;
    const others = places.filter((p) => p !== place).map((p) => (withNoun ? p.before : p.alone));
    const options = [right, ...others, withNoun ? place.alone : place.before].map((t) => ({ text: t }));
    const filled = s.en.replace('___', place.en).replace('{noun}', noun.en);
    const en = filled[0]!.toUpperCase() + filled.slice(1);
    return {
      exercise: choice(rng, { question: `You’re talking about something ${place.where}.`, text }, options, `${right}: ${place.where}. ${why}`, { text: text.replace('___', right), en }),
      instruction: 'Which word goes in the gap?',
    };
  },
};

const whatToSay: Drill = {
  id: 'what_to_say',
  name: 'What do you say?',
  fits: (d, at) => available(d.phrases, at).length >= 4,
  build(d, { at, rng }) {
    const pool = available(d.phrases, at);
    const p = newest(pool, at, rng);
    const near = pool.filter((q) => q !== p && q.group === p.group);
    const rest = pool.filter((q) => q !== p && q.group !== p.group);
    const wrong = [...rng.sample(near, 3), ...rng.sample(rest, 3)].slice(0, 3);
    return {
      exercise: choice(rng, { question: p.when }, [p, ...wrong].map((q) => ({ text: q.text })), `${p.text}: “${p.en}”.`),
      instruction: 'What do you say?',
    };
  },
};

export const DRILLS: readonly Drill[] = [
  letterSound,
  soundLetter,
  decode,
  fade,
  buildBlock,
  vowelSign,
  joinLetters,
  unvoweled,
  sunMoon,
  stress,
  kanaPairs,
  tonePair,
  minimalPair,
  soundSort,
  silentLetters,
  accentPlace,
  dictation,
  lenition,
  lenitionForm,
  spellingRule,
  answerEcho,
  articleDrill,
  clock,
  contradict,
  adjectiveEnding,
  whichCounter,
  countIt,
  smallKana,
  saidAs,
  wordSort,
  makeForm,
  readNumber,
  nearFar,
  whatToSay,
];
