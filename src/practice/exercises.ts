import type { Rng } from '../passage/rng';
import { splitWords, withoutReadings } from '../ruby';
import type { Exercise, Line, Option, Prompt } from './types';

/**
 * The exercise types the Practice tab picks from, from the ESL app mock-ups
 * (one lesson per level, A1 to C1). Each says which levels it suits, where it
 * goes in a set, what the model writes for it and in what shape, and how code
 * checks that and turns it into an `Exercise` the widget draws. A broken one
 * (an answer that isn't among the options, an index out of range) is dropped.
 *
 * Speaking comes up only when the reader turned it on (Options). Left out:
 * timed rounds, and the ones built around one topic (maps, clocks, prices,
 * timetables, menus, ticket machines).
 */
export interface ExerciseType {
  id: string;
  /** On the chip above the exercise. */
  name: string;
  /** The CEFR levels it suits, as indexes into `CEFR`; a lesson's lower level must be in range. */
  levels: [number, number];
  /** What it practises: words, forms, a text, or a conversation; how often each comes up depends on the level (`pickExercise`). */
  stage: Stage;
  /** Plays target-language audio: left out when nothing can read it aloud. */
  listening?: boolean;
  /** The reader says it aloud: only with speaking exercises on, and then at `SPEAKING_SHARE` (`plan.ts`). */
  speaking?: boolean;
  /** Only in these languages (codes): grammar no other language has. None = every language. */
  langs?: readonly string[];
  /** What to write, for the prompt. */
  ask(L: string): string;
  /** The JSON line it's written as, with placeholders. */
  shape(L: string): string;
  /** The exercise from the model's JSON; null if it's broken. Options are shuffled with `rng`. */
  parse(raw: Raw, rng: Rng): Exercise | null;
}

export type Stage = 'words' | 'forms' | 'texts' | 'talk';

export const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
const [A1, A2, B1, B2, C1] = [0, 1, 2, 3, 4];

export type Raw = Record<string, unknown>;

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const strs = (v: unknown) => (Array.isArray(v) ? v.map(str) : []);
const recs = (v: unknown): Raw[] => (Array.isArray(v) ? v.filter((x): x is Raw => Boolean(x) && typeof x === 'object' && !Array.isArray(x)) : []);
const line = (v: unknown): Line => {
  const r = (v && typeof v === 'object' ? v : {}) as Raw;
  return { text: str(r.target), en: str(r.en) };
};
const lines = (v: unknown) => recs(v).map(line).filter((l) => l.text);
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const int = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) ? v : typeof v === 'string' && /^\d+$/.test(v.trim()) ? Number(v) : -1);

/** For comparing answers with options: no readings, case, spacing or end punctuation. */
const loose = (s: string) =>
  withoutReadings(s).normalize('NFC').toLowerCase().replace(/[\s.!?。！？、,，،؟؛"'«»“”„‘’]+/gu, ' ').trim();

/** Where `answer` is in `options`: exactly, or else loosely if only one matches; -1 if it isn't there. */
export function findOption(options: string[], answer: string): number {
  const exact = options.indexOf(answer);
  if (exact >= 0) return exact;
  const k = loose(answer);
  const found = options.flatMap((o, i) => (loose(o) === k ? [i] : []));
  return found.length === 1 ? found[0]! : -1;
}

const distinct = (xs: string[]) => xs.every(Boolean) && new Set(xs.map(loose)).size === xs.length;

/** A random order of 0..n-1, never the one given (when there's another). */
export function scramble(rng: Rng, n: number): number[] {
  for (let tries = 0; tries < 8; tries++) {
    const order = rng.sample(range(n), n);
    if (n < 2 || order.some((v, i) => v !== i)) return order;
  }
  return range(n).reverse();
}

/** A one-answer exercise with its options shuffled; null if the answer isn't exactly one of them. */
function choice(rng: Rng, prompt: Prompt, options: Option[], answer: string, why: string, full?: Line, more?: Line[]): Exercise | null {
  const keys = options.map((o) => o.text || o.emoji || '');
  if (options.length < 2 || options.length > 5 || !distinct(keys)) return null;
  const at = findOption(keys, answer);
  if (at < 0) return null;
  const order = rng.sample(range(options.length), options.length);
  return { kind: 'choice', prompt, options: order.map((i) => options[i]!), answer: order.indexOf(at), why, ...(full ? { full } : {}), ...(more?.length ? { more } : {}) };
}

const texts = (v: unknown): Option[] => strs(v).map((text) => ({ text }));
/** Options as { target, en } (or bare strings), their English shown only once answered. */
const revealed = (v: unknown): Option[] =>
  (Array.isArray(v) ? v : []).map((o) => (typeof o === 'string' ? { text: str(o) } : { text: line(o).text, ...(line(o).en ? { enAfter: line(o).en } : {}) }));

/** A sentence with one ___ and the options for it; once answered, the sentence filled in. */
function gapped(raw: Raw, rng: Rng): Exercise | null {
  const sentence = str(raw.sentence).replace(/_{3,}/g, '___');
  if (sentence.split('___').length !== 2) return null;
  const answer = str(raw.answer);
  return choice(rng, { text: sentence }, texts(raw.options), answer, str(raw.why), { text: sentence.replace('___', answer), en: str(raw.en) });
}

/** A message: who it's from and its lines. */
const message = (raw: Raw) => ({ from: str(raw.from), lines: lines(raw.lines) });

/** True-or-false-style labelling: each item is right or wrong (`ok`), with a fix for the wrong ones. */
function twoWay(raw: Raw, rng: Rng, key: string, labels: [string, string], prompt: Prompt = {}): Exercise | null {
  const items = recs(raw.items).map((r) => ({ ...line(r), ok: r[key] === true || r[key] === 'true', fix: str(r.fix), why: str(r.why) }));
  if (items.length < 3 || !items.every((i) => i.text) || !distinct(items.map((i) => i.text))) return null;
  if (items.every((i) => i.ok) || items.every((i) => !i.ok) || items.some((i) => !i.ok && !i.fix)) return null;
  return {
    kind: 'label',
    prompt,
    labels: labels.map((text) => ({ text })),
    items: items.map((i) => ({ text: i.text, en: i.en, label: i.ok ? 0 : 1, fix: i.ok ? '' : i.fix, why: i.why })),
    why: '',
  };
}

/** Each item in exactly one of the labels, by name; items shuffled. */
function labelled(rng: Rng, prompt: Prompt, labels: Option[], items: Array<{ text: string; en: string; label: string; why?: string }>, why = ''): Exercise | null {
  const names = labels.map((l) => l.text);
  if (labels.length < 2 || !distinct(names) || items.length < 2 || !distinct(items.map((i) => i.text))) return null;
  const placed = items.map((i) => ({ text: i.text, en: i.en, label: findOption(names, i.label), why: i.why ?? '', fix: '' }));
  if (placed.some((i) => i.label < 0)) return null;
  return { kind: 'label', prompt, labels, items: rng.sample(placed, placed.length), why };
}

/** Lines in their right order, shuffled into tiles. */
function ordered(rng: Rng, prompt: Prompt, full: Line[], why: string, ends?: [string, string]): Exercise | null {
  if (full.length < 3 || !distinct(full.map((l) => l.text))) return null;
  const order = scramble(rng, full.length);
  return {
    kind: 'order',
    prompt,
    tiles: order.map((i) => full[i]!.text),
    accepted: [range(full.length).map((i) => order.indexOf(i))],
    layout: 'list',
    full,
    why,
    ...(ends ? { ends } : {}),
  };
}

/** A line to tap in a text, by its number. */
function tapLine(prompt: Prompt, ls: Array<Line & { speaker: string }>, answer: number, why: string): Exercise | null {
  if (ls.length < 3 || answer < 0 || answer >= ls.length) return null;
  return { kind: 'tap', prompt, lines: ls, answer, gaps: false, why };
}

/** A paragraph's words, each tappable; Intl.Segmenter for scripts written without spaces between words, each reading kept with its word. */
function words(text: string): string[] {
  const unspaced = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}]/u.test(text);
  if (!unspaced || typeof Intl.Segmenter !== 'function') return text.split(/(?<=\s)/u).filter(Boolean);
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' });
  return splitWords(text, (plain) => [...segmenter.segment(plain)].map((s) => s.segment));
}

/**
 * A paragraph from `parts` (plain strings and objects for the words to find), split into tappable
 * words; each object needs a `fix` when `fixes`. Null if broken or too short.
 */
function paragraph(raw: Raw, fixes: boolean): { tokens: Array<{ text: string; error: number }>; errors: Array<{ text: string; fix: string; why: string }>; en?: string } | null {
  const parts = Array.isArray(raw.parts) ? raw.parts : [];
  const errors: Array<{ text: string; fix: string; why: string }> = [];
  const tokens: Array<{ text: string; error: number }> = [];
  for (const p of parts) {
    if (typeof p === 'string') {
      tokens.push(...words(p).map((text) => ({ text, error: -1 })));
    } else if (p && typeof p === 'object') {
      const e = p as Raw;
      if (!str(e.target) || (fixes && !str(e.fix))) return null;
      errors.push({ text: str(e.target), fix: fixes ? str(e.fix) : '', why: str(e.why) });
      tokens.push(...words(String(e.target)).map((text) => ({ text, error: errors.length - 1 })));
    }
  }
  return errors.length < 1 || errors.length > 4 || tokens.length < 8 ? null : { tokens, errors, ...(str(raw.en) ? { en: str(raw.en) } : {}) };
}

const TYPES: ExerciseType[] = [
  {
    id: 'picture',
    name: 'Tap the picture',
    levels: [A1, A2],
    stage: 'words',
    ask: (L) =>
      `One ${L} word for something an emoji shows clearly; four emoji "options", one for the word ("answer", copied exactly) and three for other things from the lesson a learner might mix it up with.`,
    shape: (L) => `{"type":"picture","instruction":"Tap the picture for this word","word":"<${L}>","en":"<English>","options":["<emoji>","<emoji>","<emoji>","<emoji>"],"answer":"<emoji>","why":"<English>"}`,
    parse: (raw, rng) =>
      str(raw.word) ? choice(rng, { text: str(raw.word), en: str(raw.en) }, strs(raw.options).map((emoji) => ({ text: '', emoji })), str(raw.answer), str(raw.why)) : null,
  },
  {
    id: 'meaning',
    name: 'What does it mean?',
    levels: [A1, B1],
    stage: 'words',
    ask: (L) => `One ${L} word or phrase from the lesson; four English "options": its meaning ("answer") and the meanings of three other words from the lesson or the situation.`,
    shape: (L) => `{"type":"meaning","instruction":"What does this mean?","word":"<${L}>","options":["<English>","<English>","<English>","<English>"],"answer":"<English>","why":"<English>"}`,
    parse: (raw, rng) => (str(raw.word) ? choice(rng, { text: str(raw.word) }, texts(raw.options), str(raw.answer), str(raw.why)) : null),
  },
  {
    id: 'hear_word',
    name: 'Listen',
    levels: [A1, A2],
    stage: 'words',
    listening: true,
    ask: (L) =>
      `"audio" is one ${L} word or short phrase from the lesson, which the learner hears; "en" is its English; three or four ${L} "options" that look or sound alike, one of them the "audio" ("answer").`,
    shape: (L) => `{"type":"hear_word","instruction":"Tap what you hear","audio":"<${L}>","en":"<English>","options":["<${L}>","<${L}>","<${L}>"],"answer":"<${L}>","why":"<English>"}`,
    parse: (raw, rng) => (str(raw.audio) ? choice(rng, { audio: str(raw.audio), en: str(raw.en) }, texts(raw.options), str(raw.answer), str(raw.why)) : null),
  },
  {
    id: 'pairs',
    name: 'Match the pairs',
    levels: [A1, B1],
    stage: 'words',
    ask: (L) =>
      `Five pairs, each a ${L} word or form and its partner: its English, or another form of it the lesson teaches (a verb and its past participle, a singular and its plural). Say in "instruction" what to match. Each partner must fit only its own pair: a reader who knows the lesson must find one way to match all five, never two. Don't match forms to people or situations when two of the forms would suit the same person (two formal questions, two informal replies); match each to its English instead.`,
    shape: (L) => `{"type":"pairs","instruction":"Match each word to its meaning","pairs":[["<${L}>","<partner>"],["<${L}>","<partner>"]]}`,
    parse(raw, rng) {
      const pairs = (Array.isArray(raw.pairs) ? raw.pairs : []).map((p) => strs(p)).map(([left = '', right = '']) => ({ left, right }));
      if (pairs.length < 3 || pairs.length > 6 || !distinct(pairs.map((p) => p.left)) || !distinct(pairs.map((p) => p.right))) return null;
      return { kind: 'pairs', pairs, shuffle: scramble(rng, pairs.length) };
    },
  },
  {
    id: 'odd_one_out',
    name: 'Odd one out',
    levels: [A1, B1],
    stage: 'words',
    ask: (L) =>
      `Four ${L} words: three share something the lesson teaches (a group, a gender, a form) and one doesn't ("answer", its "target" copied exactly). What they share must take knowing the lesson to see (a meaning, a gender, a form), never something on the surface of the spelling: no letters, accents or characters one word lacks, no length or capitals. Keep "instruction" as "Which one doesn't belong?": never name what they share. Each word's "en" is its English, shown once answered. "why" says what the three share.`,
    shape: (L) => `{"type":"odd_one_out","instruction":"Which one doesn't belong?","options":[{"target":"<${L}>","en":"<English>"}],"answer":"<${L}>","why":"<English>"}`,
    parse: (raw, rng) => choice(rng, {}, revealed(recs(raw.options)), str(raw.answer), str(raw.why)),
  },
  {
    id: 'yes_no',
    name: 'Word and picture',
    levels: [A1, A1],
    stage: 'words',
    ask: (L) =>
      `One emoji and one ${L} word from the lesson; "answer" is true if the word names what the emoji shows, false if it names something else from the lesson (false about half the time). "en" is the word's English, shown once answered. "why" gives the right word for the emoji.`,
    shape: (L) => `{"type":"yes_no","instruction":"Does the word match the picture?","emoji":"<emoji>","word":"<${L}>","en":"<English>","answer":false,"why":"<English>"}`,
    parse(raw) {
      if (!str(raw.word) || !str(raw.emoji) || typeof raw.answer !== 'boolean') return null;
      return { kind: 'choice', prompt: { emoji: str(raw.emoji), text: str(raw.word), en: str(raw.en) }, options: [{ text: 'Yes' }, { text: 'No' }], answer: raw.answer ? 0 : 1, why: str(raw.why) };
    },
  },
  {
    id: 'sort',
    name: 'Sort',
    levels: [A1, C1],
    stage: 'words',
    ask: (L) =>
      `Two (or three) groups the lesson teaches to tell apart (masculine and feminine, haben and sein, formal and informal, drinks and food), each "label" in ${L} where the lesson names it in ${L}, with its "en"; 6–8 ${L} "items" in all, each with its "en" (shown once answered), each in exactly one group and none that could go in two.`,
    shape: (L) => `{"type":"sort","instruction":"Sort into <groups>","groups":[{"label":"<label>","en":"<English>","items":[{"target":"<${L}>","en":"<English>"}]}]}`,
    parse(raw, rng) {
      // An item is { target, en }, or a bare string as sorts were first written.
      const item = (v: unknown): Line => (typeof v === 'string' ? { text: str(v), en: '' } : line(v));
      const groups = recs(raw.groups).map((g) => ({ label: str(g.label), en: str(g.en), items: (Array.isArray(g.items) ? g.items.map(item) : []).filter((i) => i.text) }));
      if (groups.some((g) => !g.items.length)) return null;
      // English the label already has ("tu (informal)") isn't shown twice.
      const labels = groups.map((g) => ({ text: g.label, ...(g.en && !loose(g.label).includes(loose(g.en)) ? { en: g.en } : {}) }));
      const items = groups.flatMap((g) => g.items.map((i) => ({ ...i, label: g.label })));
      return items.length >= 4 ? labelled(rng, {}, labels, items) : null;
    },
  },
  {
    id: 'partner',
    name: 'Words that go together',
    levels: [A1, C1],
    stage: 'words',
    ask: (L) =>
      `One ${L} sentence from the situation with ___ in place of one half of a word partnership ${L} speakers always use (a verb with its noun, an adjective with its noun, a set phrase); three or four ${L} "options": the partner a native uses ("answer") and words a learner would pick by translating from English, each in the right form so only the partnership decides; "en" is the whole sentence's English.`,
    shape: (L) => `{"type":"partner","instruction":"Which word goes with it?","sentence":"<${L} with ___>","en":"<English>","options":["<${L}>","<${L}>","<${L}>"],"answer":"<${L}>","why":"<English>"}`,
    parse: gapped,
  },
  {
    id: 'simple_words',
    name: 'Say it simply',
    levels: [A2, C1],
    stage: 'words',
    ask: (L) =>
      `One ${L} word or phrase from the situation a little above the learner's level; "en" is its English, shown once answered; three ${L} "options", each a short explanation in easy ${L} with no English words in it: the right one ("answer", its "target" copied exactly) and explanations of two nearby words it could be confused with; each option's "en" is its English, shown once answered.`,
    shape: (L) => `{"type":"simple_words","instruction":"Which says it simply?","word":"<${L}>","en":"<English>","options":[{"target":"<${L}>","en":"<English>"}],"answer":"<${L}>","why":"<English>"}`,
    parse: (raw, rng) => (str(raw.word) ? choice(rng, { text: str(raw.word), en: str(raw.en) }, revealed(raw.options), str(raw.answer), str(raw.why)) : null),
  },
  {
    id: 'gap',
    name: 'Fill the gap',
    levels: [A1, C1],
    stage: 'forms',
    ask: (L) =>
      `One ${L} sentence from the situation with ___ where a word or form the lesson teaches goes; three or four ${L} "options": the right one and typical mistakes with that point, so only one fits; "en" is the whole sentence's English.`,
    shape: (L) => `{"type":"gap","instruction":"Fill in the blank","sentence":"<${L} with ___>","en":"<English>","options":["<${L}>","<${L}>","<${L}>"],"answer":"<${L}>","why":"<English>"}`,
    parse: gapped,
  },
  {
    id: 'particles',
    name: 'Particles',
    levels: [A1, B1],
    stage: 'forms',
    langs: ['ja'],
    ask: (L) =>
      `3–5 short ${L} sentences from the situation, each with ___ where one particle goes, with the point in <focus> where it fits; "particles": the 3–5 particles the learner picks from for every sentence (such as は, が, を, に, で, へ, と, も, から, まで), each the answer to at least one sentence and at least two of them used. In each sentence only its answer may fit: never は against が where either is natural, に against へ before a destination, or a particle that changes the meaning but still makes sense (で or に with いる). "en" is the sentence's English, "why" says in English why that particle.`,
    shape: (L) =>
      `{"type":"particles","instruction":"Which particle goes in each gap?","particles":["<particle>","<particle>","<particle>"],"items":[{"target":"<${L} with ___>","en":"<English>","answer":"<particle>","why":"<English>"}]}`,
    parse(raw, rng) {
      const particles = strs(raw.particles).filter(Boolean);
      if (particles.length < 2 || particles.length > 5 || particles.some((p) => [...p].length > 3)) return null;
      const items = recs(raw.items).map((r) => ({ ...line(r), label: str(r.answer), why: str(r.why) })).map((i) => ({ ...i, text: i.text.replace(/_{3,}/g, '___') }));
      if (items.length < 3 || items.length > 5 || items.some((i) => i.text.split('___').length !== 2)) return null;
      const ex = labelled(rng, {}, texts(particles), items);
      if (!ex || ex.kind !== 'label' || new Set(ex.items.map((i) => i.label)).size < 2) return null;
      // Once answered, each sentence shows filled in.
      return { ...ex, items: ex.items.map((i) => ({ ...i, fix: i.text.replace('___', particles[i.label]!) })) };
    },
  },
  {
    id: 'spot_form',
    name: 'Spot the form',
    levels: [A1, C1],
    stage: 'forms',
    ask: (L) =>
      `A short ${L} paragraph from the situation (3–4 sentences) that uses one form it practises 2–4 times, and at least one word that looks like that form but isn't (the same verb in another tense, the same ending on another kind of word); "form" names it in plain English (such as "verbs in the passé composé"); "parts" is the paragraph in order, as plain strings and one object per use of the form, its "target" exactly as written (every word of it, such as both words of a compound tense) and "why" saying in English what it is. Keep the spaces between parts inside the strings. "en" is the whole paragraph's English, shown once answered.`,
    shape: (L) => `{"type":"spot_form","instruction":"Tap every use of the form","form":"<English>","parts":["<${L} text> ",{"target":"<${L} form>","why":"<English>"}," <${L} text>"],"en":"<English>"}`,
    parse(raw) {
      const p = paragraph(raw, false);
      const form = str(raw.form);
      if (!p || !form) return null;
      const n = p.errors.length;
      return { kind: 'proofread', prompt: { question: `${form}: there ${n === 1 ? 'is 1' : `are ${n}`}. Tap ${n === 1 ? 'it' : 'them'}.` }, ...p, form };
    },
  },
  {
    id: 'build',
    name: 'Build the sentence',
    levels: [A1, B2],
    stage: 'forms',
    ask: (L) =>
      `One ${L} sentence from the situation that uses the lesson's grammar, split into 4–7 tiles (words, or chunks that stay together) in "answer", in order; "extra": one or two ${L} tiles that are typical mistakes (a wrong form, a wrong word) and fit nowhere; "also": any other complete orders of the same tiles that are just as correct (often []); "full": the sentence as written, with its punctuation; "en": its English.`,
    shape: (L) => `{"type":"build","instruction":"Build the sentence","en":"<English>","answer":["<tile>","<tile>"],"extra":["<tile>"],"also":[],"full":"<${L}>","why":"<English>"}`,
    parse(raw, rng) {
      const answer = strs(raw.answer).filter(Boolean);
      const extra = strs(raw.extra).filter(Boolean);
      if (answer.length < 2 || answer.length > 10 || extra.length > 3 || extra.some((x) => answer.some((a) => loose(a) === loose(x)))) return null;
      const tiles = [...answer, ...extra];
      // Another right order, as indexes into the tiles; it must use the same tiles.
      const asIndexes = (order: string[]) => {
        const free = range(answer.length);
        const out = order.map((t) => {
          const at = free.findIndex((i) => answer[i] === t);
          return at < 0 ? -1 : free.splice(at, 1)[0]!;
        });
        return out.length === answer.length && !out.includes(-1) ? out : null;
      };
      const also = (Array.isArray(raw.also) ? raw.also : []).map((o) => asIndexes(strs(o))).filter((o): o is number[] => o !== null);
      const order = scramble(rng, tiles.length);
      const accepted = [range(answer.length), ...also].map((o) => o.map((i) => order.indexOf(i)));
      const full = str(raw.full) || answer.join(' ');
      return { kind: 'order', prompt: { question: str(raw.en) }, tiles: order.map((i) => tiles[i]!), accepted, layout: 'inline', full: [{ text: full, en: '' }], why: str(raw.why) };
    },
  },
  {
    id: 'fix',
    name: 'Fix the mistake',
    levels: [A1, B2],
    stage: 'forms',
    ask: (L) =>
      `One ${L} sentence from the situation split into 3–6 "chunks", exactly one of them wrong in a way the lesson teaches about ("wrong": its number, counting from 0); three ${L} "options" to replace it, one right ("answer"); "full": the corrected sentence; "en": its English.`,
    shape: (L) => `{"type":"fix","instruction":"Find and fix the mistake","en":"<English>","chunks":["<${L}>","<${L}>","<${L}>"],"wrong":1,"options":["<${L}>","<${L}>","<${L}>"],"answer":"<${L}>","full":"<${L}>","why":"<English>"}`,
    parse(raw, rng) {
      const chunks = strs(raw.chunks).filter(Boolean);
      const wrong = int(raw.wrong);
      // The wrong chunk itself isn't offered as its replacement.
      const options = strs(raw.options).filter((o) => wrong < 0 || loose(o) !== loose(chunks[wrong] ?? ''));
      const answer = findOption(options, str(raw.answer));
      if (chunks.length < 2 || wrong < 0 || wrong >= chunks.length || options.length < 2 || !distinct(options) || answer < 0) return null;
      const order = rng.sample(range(options.length), options.length);
      const en = str(raw.en);
      return {
        kind: 'fix',
        prompt: en ? { question: `“${en}”` } : {},
        chunks,
        layout: 'inline',
        wrong,
        options: order.map((i) => options[i]!),
        answer: order.indexOf(answer),
        full: { text: str(raw.full) || chunks.map((c, i) => (i === wrong ? options[answer]! : c)).join(' '), en },
        why: str(raw.why),
      };
    },
  },
  {
    id: 'right_or_wrong',
    name: 'Correct or mistake?',
    levels: [A2, B1],
    stage: 'forms',
    ask: (L) =>
      `5–6 short ${L} sentences from the situation, about half with one mistake a learner makes with the lesson ("ok": false, with "fix", the corrected sentence, and "why"), the rest correct ("ok": true, "fix" and "why" ""). "en" is the English of the correct sentence.`,
    shape: (L) => `{"type":"right_or_wrong","instruction":"Correct or mistake?","items":[{"target":"<${L}>","en":"<English>","ok":false,"fix":"<${L}>","why":"<English>"}]}`,
    parse: (raw, rng) => twoWay(raw, rng, 'ok', ['Correct', 'Mistake']),
  },
  {
    id: 'natural',
    name: 'Would a native say it?',
    levels: [B2, C1],
    stage: 'forms',
    ask: (L) =>
      `5–6 ${L} sentences from the situation, all grammatical; about half sound translated from English (a calque, a false friend, the wrong collocation: "natural": false, with "fix", what a native says, and "why"), the rest natural ("natural": true, "fix" and "why" "").`,
    shape: (L) => `{"type":"natural","instruction":"Flag the ones that sound translated","items":[{"target":"<${L}>","en":"<English>","natural":false,"fix":"<${L}>","why":"<English>"}]}`,
    parse: (raw, rng) => twoWay(raw, rng, 'natural', ['Natural', 'Sounds translated']),
  },
  {
    id: 'hear_sentence',
    name: 'Listen',
    levels: [A1, C1],
    stage: 'forms',
    listening: true,
    ask: (L) =>
      `"audio" is one ${L} sentence from the situation that uses the lesson, which the learner hears at natural speed; "en" is its English; "question" is an English question about a detail in it, or "" to ask what it means; four English "options": the right one ("answer") and three that are close but wrong in a detail the sentence makes clear (a time, a person, a tense).`,
    shape: (L) => `{"type":"hear_sentence","instruction":"What did you hear?","audio":"<${L}>","en":"<English>","question":"<English or empty>","options":["<English>","<English>","<English>","<English>"],"answer":"<English>","why":"<English>"}`,
    parse: (raw, rng) =>
      str(raw.audio)
        ? choice(rng, { audio: str(raw.audio), en: str(raw.en), ...(str(raw.question) ? { question: str(raw.question) } : {}) }, texts(raw.options), str(raw.answer), str(raw.why))
        : null,
  },
  {
    id: 'say',
    name: 'Say it',
    levels: [A1, C1],
    stage: 'talk',
    speaking: true,
    ask: (L) =>
      `One ${L} sentence from the situation that uses the lesson, for the learner to say aloud: something a person there would really say, short enough for one breath at the learner's level (4–8 words for a beginner); "en" is its English; "why" is one short English tip on saying it (a silent letter, a liaison, a long vowel, where the stress falls).`,
    shape: (L) => `{"type":"say","instruction":"Say it aloud","target":"<${L}>","en":"<English>","why":"<English>"}`,
    parse(raw) {
      const say = line(raw);
      return say.text && say.en ? { kind: 'speak', prompt: { question: say.en, text: say.text }, say, why: str(raw.why) } : null;
    },
  },
  {
    id: 'situation',
    name: 'What do you say?',
    levels: [A2, C1],
    stage: 'forms',
    ask: (L) =>
      `"context" is a short English situation; three or four ${L} "options" for what to say: one right for this situation ("answer") and the others wrong for it in a way the lesson teaches (register, tense, form), though each would be fine elsewhere ("answer" is its "target", copied exactly). Each option's "en" is its English, shown once answered.`,
    shape: (L) =>
      `{"type":"situation","instruction":"What do you say?","context":"<English>","options":[{"target":"<${L}>","en":"<English>"}],"answer":"<${L}>","why":"<English>"}`,
    parse: (raw, rng) => (str(raw.context) ? choice(rng, { question: str(raw.context) }, revealed(raw.options), str(raw.answer), str(raw.why)) : null),
  },
  {
    id: 'why_form',
    name: 'Why this form?',
    levels: [B1, C1],
    stage: 'forms',
    ask: (L) =>
      `One ${L} sentence from the situation with one form the lesson teaches between asterisks; four short English "options" for why the speaker chose it, one right ("answer").`,
    shape: (L) => `{"type":"why_form","instruction":"Why this form?","sentence":"<${L} with *form*>","en":"<English>","options":["<English>","<English>","<English>","<English>"],"answer":"<English>","why":"<English>"}`,
    parse: (raw, rng) => (/\*[^*]+\*/.test(str(raw.sentence)) ? choice(rng, { text: str(raw.sentence), en: str(raw.en) }, texts(raw.options), str(raw.answer), str(raw.why)) : null),
  },
  {
    id: 'contrast',
    name: 'Same words, other meaning',
    levels: [B2, C1],
    stage: 'forms',
    ask: (L) =>
      `Two ${L} sentences, "a" and "b", that differ in one form the lesson teaches (a mood, a tense, a particle) and so mean different things; two English "meanings", one for each, with "answer" "A" or "B".`,
    shape: (L) => `{"type":"contrast","instruction":"Which sentence means this?","a":"<${L}>","b":"<${L}>","meanings":[{"en":"<English>","answer":"A"},{"en":"<English>","answer":"B"}],"why":"<English>"}`,
    parse(raw, rng) {
      const [a, b] = [str(raw.a), str(raw.b)];
      if (!a || !b || loose(a) === loose(b)) return null;
      const meanings = recs(raw.meanings).map((m) => ({ text: str(m.en), en: '', label: str(m.answer).toUpperCase() }));
      if (!meanings.some((m) => m.label === 'A') || !meanings.some((m) => m.label === 'B')) return null;
      const prompt = { message: { from: '', lines: [{ text: `A: ${a}`, en: '' }, { text: `B: ${b}`, en: '' }] } };
      return labelled(rng, prompt, [{ text: 'A' }, { text: 'B' }], meanings, str(raw.why));
    },
  },
  {
    id: 'reorder',
    name: 'Put it in order',
    levels: [A2, C1],
    stage: 'texts',
    ask: (L) =>
      `A short story from the situation in 4–5 ${L} sentences, in order, each with its English, linked by time words or connectors the lesson teaches so the order is clear from the ${L}; "hint" names those words.`,
    shape: (L) => `{"type":"reorder","instruction":"Put the story in order","hint":"<English>","sentences":[{"target":"<${L}>","en":"<English>"}]}`,
    parse: (raw, rng) => ordered(rng, str(raw.hint) ? { question: str(raw.hint) } : {}, lines(raw.sentences), ''),
  },
  {
    id: 'read',
    name: 'Read and answer',
    levels: [A2, C1],
    stage: 'texts',
    ask: (L) =>
      `A short message from someone in the situation ("from": an emoji and a name), 4–6 ${L} "lines" each with its English, using the lesson; an English "question" about it and four English "options": the right one ("answer") and three that are plausible but wrong according to the message.`,
    shape: (L) => `{"type":"read","instruction":"Read <name>'s message","from":"<emoji name>","lines":[{"target":"<${L}>","en":"<English>"}],"question":"<English>","options":["<English>","<English>","<English>","<English>"],"answer":"<English>","why":"<English>"}`,
    parse(raw, rng) {
      const m = message(raw);
      return m.lines.length >= 2 && str(raw.question) ? choice(rng, { message: m, question: str(raw.question) }, texts(raw.options), str(raw.answer), str(raw.why)) : null;
    },
  },
  {
    id: 'headline',
    name: 'Pick the headline',
    levels: [A2, C1],
    stage: 'texts',
    ask: (L) =>
      `A short ${L} news item from the situation ("from": an emoji and where it appears, such as a local paper or a school newsletter), 3–4 "lines" each with its English; three ${L} headline "options": one that sums up its main point ("answer"), one about a detail only, and one that gets the main point wrong ("answer" is its "target", copied exactly). Each option's "en" is its English, shown once answered.`,
    shape: (L) =>
      `{"type":"headline","instruction":"Pick the best headline","from":"<emoji source>","lines":[{"target":"<${L}>","en":"<English>"}],"options":[{"target":"<${L}>","en":"<English>"}],"answer":"<${L}>","why":"<English>"}`,
    parse(raw, rng) {
      const m = message(raw);
      return m.lines.length >= 2 ? choice(rng, { message: m }, revealed(raw.options), str(raw.answer), str(raw.why)) : null;
    },
  },
  {
    id: 'guess',
    name: 'Guess first',
    levels: [A2, C1],
    stage: 'texts',
    ask: (L) =>
      `A surprising fact on the subject that is true and well known (no numbers or dates you are unsure of), asked as one ${L} "question" (with its "en") before the learner knows the answer; three short ${L} "options", each with its English ("en", shown once answered): the true one ("answer", its "target" copied exactly) and two plausible guesses that are wrong; "reveal": 2–3 short ${L} sentences, each with its English, that explain the answer.`,
    shape: (L) => `{"type":"guess","instruction":"Guess, then find out","question":"<${L}>","en":"<English>","options":[{"target":"<${L}>","en":"<English>"}],"answer":"<${L}>","reveal":[{"target":"<${L}>","en":"<English>"}],"why":"<English>"}`,
    parse(raw, rng) {
      const reveal = lines(raw.reveal);
      return str(raw.question) && reveal.length ? choice(rng, { text: str(raw.question), en: str(raw.en) }, revealed(raw.options), str(raw.answer), str(raw.why), undefined, reveal) : null;
    },
  },
  {
    id: 'evidence',
    name: 'Find the evidence',
    levels: [A2, C1],
    stage: 'texts',
    ask: (L) =>
      `A short message from someone in the situation ("from": an emoji and a name), 4–6 ${L} "lines" each with its English; an English "question" asking the learner to tap the line that says something; "answer" is that line's number, counting from 0. Only one line may answer it.`,
    shape: (L) => `{"type":"evidence","instruction":"Find the evidence","from":"<emoji name>","lines":[{"target":"<${L}>","en":"<English>"}],"question":"<English: Tap the sentence that …>","answer":2,"why":"<English>"}`,
    parse: (raw) =>
      tapLine({ question: str(raw.question), ...(str(raw.from) ? { message: { from: str(raw.from), lines: [] } } : {}) }, lines(raw.lines).map((l) => ({ ...l, speaker: '' })), int(raw.answer), str(raw.why)),
  },
  {
    id: 'who_speaks',
    name: 'Who’s speaking?',
    levels: [A2, B2],
    stage: 'texts',
    ask: (L) =>
      `"context" in English introduces two people in the situation who did or want different things; 4–6 ${L} "lines", each said by one of them ("speaker", exactly as in "speakers"), so the ${L} shows who.`,
    shape: (L) => `{"type":"who_speaks","instruction":"Who's speaking?","context":"<English>","speakers":["<name>","<name>"],"lines":[{"target":"<${L}>","en":"<English>","speaker":"<name>"}]}`,
    parse: (raw, rng) =>
      labelled(rng, { question: str(raw.context) }, texts(raw.speakers), recs(raw.lines).map((l) => ({ ...line(l), label: str(l.speaker) }))),
  },
  {
    id: 'signs',
    name: 'Which sign?',
    levels: [A2, B1],
    stage: 'texts',
    ask: (L) =>
      `5–6 short ${L} "signs" or labels you'd see in the situation (on doors, shelves, screens, menus), and 3–4 English "situations", each needing exactly one of the signs ("answer", its "target" copied exactly). Each sign's "en" is its English, shown once answered.`,
    shape: (L) =>
      `{"type":"signs","instruction":"Which sign do you need?","signs":[{"target":"<${L}>","en":"<English>"}],"situations":[{"en":"<English>","answer":"<${L} sign>"}]}`,
    parse: (raw, rng) => labelled(rng, {}, revealed(raw.signs), recs(raw.situations).map((s) => ({ text: str(s.en), en: '', label: str(s.answer) }))),
  },
  {
    id: 'reply',
    name: 'Pick the best reply',
    levels: [A2, C1],
    stage: 'texts',
    ask: (L) =>
      `A short ${L} message (2–3 sentences) from someone in the situation ("from": a name), with its English; three ${L} reply "options": one that fits ("answer", its "target" copied exactly) and two that misunderstand a detail or use the wrong form. Each option's "en" is its English, shown once answered.`,
    shape: (L) =>
      `{"type":"reply","instruction":"Reply to <name>","from":"<name>","message":"<${L}>","en":"<English>","options":[{"target":"<${L}>","en":"<English>"}],"answer":"<${L}>","why":"<English>"}`,
    parse: (raw, rng) =>
      str(raw.message)
        ? choice(rng, { message: { from: str(raw.from), lines: [{ text: str(raw.message), en: str(raw.en) }] } }, revealed(raw.options), str(raw.answer), str(raw.why))
        : null,
  },
  {
    id: 'insert',
    name: 'Where does it go?',
    levels: [B1, C1],
    stage: 'texts',
    ask: (L) =>
      `A short ${L} text of 4–5 sentences from the situation, and one more ${L} sentence ("insert") that belongs in it at exactly one place, shown by its connectors or what it refers to; "answer" is how many sentences come before it (0 = at the start).`,
    shape: (L) => `{"type":"insert","instruction":"Where does this sentence go?","sentences":[{"target":"<${L}>","en":"<English>"}],"insert":{"target":"<${L}>","en":"<English>"},"answer":2,"why":"<English>"}`,
    parse(raw) {
      const ls = lines(raw.sentences).map((l) => ({ ...l, speaker: '' }));
      const insert = line(raw.insert);
      const answer = int(raw.answer);
      if (ls.length < 3 || !insert.text || answer < 0 || answer > ls.length) return null;
      return { kind: 'tap', prompt: {}, lines: ls, answer, gaps: true, insert, why: str(raw.why) };
    },
  },
  {
    id: 'scale',
    name: 'From least to most',
    levels: [B1, C1],
    stage: 'texts',
    ask: (L) =>
      `4–5 ${L} sentences from the situation that say much the same thing with different strength (certainty, politeness, formality, intensity), using the lesson, listed from "low" to "high", each with its English; "low" and "high" name the two ends in English.`,
    shape: (L) => `{"type":"scale","instruction":"Order from least to most <what>","low":"<English>","high":"<English>","items":[{"target":"<${L}>","en":"<English>"}],"why":"<English>"}`,
    parse: (raw, rng) => (str(raw.low) && str(raw.high) ? ordered(rng, {}, lines(raw.items), str(raw.why), [str(raw.low), str(raw.high)]) : null),
  },
  {
    id: 'fact_opinion',
    name: 'Fact or opinion?',
    levels: [B1, C1],
    stage: 'texts',
    ask: (L) =>
      `5–6 ${L} sentences on one topic from the situation, some stating facts and some giving opinions (with the lesson's forms where they fit), each with its English; "kind" is "fact" or "opinion", with both used.`,
    shape: (L) => `{"type":"fact_opinion","instruction":"Fact or opinion?","items":[{"target":"<${L}>","en":"<English>","kind":"fact","why":"<English>"}]}`,
    parse: (raw, rng) => {
      const items = recs(raw.items).map((i) => ({ ...line(i), label: str(i.kind).toLowerCase() === 'opinion' ? 'Opinion' : 'Fact', why: str(i.why) }));
      return new Set(items.map((i) => i.label)).size === 2 ? labelled(rng, {}, [{ text: 'Fact' }, { text: 'Opinion' }], items) : null;
    },
  },
  {
    id: 'tone',
    name: 'Sincere or ironic?',
    levels: [B2, C1],
    stage: 'texts',
    ask: (L) =>
      `Four short ${L} reviews or comments from the situation, each with its English, some sincere and some ironic (praise for something clearly bad); "ironic" is true or false, with both used; "why" says what gives it away.`,
    shape: (L) => `{"type":"tone","instruction":"Sincere or ironic?","items":[{"target":"<${L}>","en":"<English>","ironic":true,"why":"<English>"}]}`,
    parse: (raw, rng) => {
      const items = recs(raw.items).map((i) => ({ ...line(i), label: i.ironic === true ? 'Ironic' : 'Sincere', why: str(i.why) }));
      return new Set(items.map((i) => i.label)).size === 2 ? labelled(rng, {}, [{ text: 'Sincere' }, { text: 'Ironic' }], items) : null;
    },
  },
  {
    id: 'argument',
    name: 'Label the argument',
    levels: [B2, C1],
    stage: 'texts',
    ask: (L) =>
      `A short ${L} argument from the situation in 4–5 sentences, each with its English, one per role in "labels" (the ${L} names of roles such as thesis, supporting point, counterargument, rebuttal, conclusion, each with its English), each sentence's "label" copied from "labels" and each label used once.`,
    shape: (L) => `{"type":"argument","instruction":"Give each sentence its role","labels":[{"target":"<${L}>","en":"<English>"}],"sentences":[{"target":"<${L}>","en":"<English>","label":"<${L} role>"}]}`,
    parse: (raw, rng) => {
      const labels = recs(raw.labels).map((l) => ({ text: str(l.target), en: str(l.en) }));
      const items = recs(raw.sentences).map((s) => ({ ...line(s), label: str(s.label) }));
      return labelled(rng, {}, labels, items);
    },
  },
  {
    id: 'proofread',
    name: 'Proofread',
    levels: [B2, C1],
    stage: 'texts',
    ask: (L) =>
      `A short ${L} paragraph from the situation (3–4 sentences) with 2–3 mistakes of different kinds the lesson covers (a wrong connector, a register slip, a false friend, a wrong form); "parts" is the paragraph in order, as plain strings and mistake objects, each mistake with its "fix" and "why". Keep the spaces between parts inside the strings. "en" is the English of the paragraph as it should read, mistakes fixed, shown once answered.`,
    shape: (L) => `{"type":"proofread","instruction":"Find the mistakes","parts":["<${L} text> ",{"target":"<wrong ${L}>","fix":"<${L}>","why":"<English>"}," <${L} text>"],"en":"<English>"}`,
    parse(raw) {
      const p = paragraph(raw, true);
      if (!p) return null;
      const n = p.errors.length;
      return { kind: 'proofread', prompt: { question: `There ${n === 1 ? 'is 1 mistake' : `are ${n} mistakes`}. Tap ${n === 1 ? 'it' : 'them'}.` }, ...p };
    },
  },
  {
    id: 'email',
    name: 'Fix the tone',
    levels: [B1, C1],
    stage: 'texts',
    ask: (L) =>
      `A short ${L} email or message from the situation, 5–7 "lines" (greeting, body, closing), "to" saying in English who it's to, with one line ("wrong", counting from 0) in the wrong register or tone for them; three ${L} "options" to replace it, one right ("answer", its "target" copied exactly). Each line's and option's "en" is its English, shown once answered.`,
    shape: (L) =>
      `{"type":"email","instruction":"One line breaks the tone. Fix it.","to":"<English>","lines":[{"target":"<${L}>","en":"<English>"}],"wrong":3,"options":[{"target":"<${L}>","en":"<English>"}],"answer":"<${L}>","why":"<English>"}`,
    parse(raw, rng) {
      // Lines and options are { target, en }, or bare strings as emails were first written.
      const all = (Array.isArray(raw.lines) ? raw.lines : []).map((l) => (typeof l === 'string' ? { text: str(l), en: '' } : line(l)));
      const ls = all.filter((l) => l.text).map((l) => l.text);
      const lsEn = all.filter((l) => l.text).map((l) => l.en);
      const wrong = int(raw.wrong);
      const opts = revealed(raw.options);
      const options = opts.map((o) => o.text);
      const answer = findOption(options, str(raw.answer));
      if (ls.length < 3 || wrong < 0 || wrong >= ls.length || options.length < 2 || !distinct(options) || answer < 0) return null;
      const order = rng.sample(range(options.length), options.length);
      return {
        kind: 'fix',
        prompt: str(raw.to) ? { question: `To: ${str(raw.to)}` } : {},
        chunks: ls,
        layout: 'list',
        wrong,
        options: order.map((i) => options[i]!),
        answer: order.indexOf(answer),
        full: { text: options[answer]!, en: opts[answer]!.enAfter ?? '' },
        why: str(raw.why),
        ...(lsEn.some(Boolean) ? { chunksEn: lsEn } : {}),
        ...(opts.some((o) => o.enAfter) ? { optionsEn: order.map((i) => opts[i]!.enAfter ?? '') } : {}),
      };
    },
  },
  {
    id: 'dodge',
    name: 'Spot the dodge',
    levels: [B2, C1],
    stage: 'texts',
    ask: (L) =>
      `A short ${L} exchange from the situation: "context" in English, then 5–6 "lines", each with a "speaker" name and its English, where one person avoids answering a question once; "answer" is the number of the line that dodges, counting from 0.`,
    shape: (L) => `{"type":"dodge","instruction":"Where do they dodge the question?","context":"<English>","lines":[{"speaker":"<name>","target":"<${L}>","en":"<English>"}],"answer":2,"why":"<English>"}`,
    parse: (raw) =>
      tapLine({ question: str(raw.context) }, recs(raw.lines).map((l) => ({ ...line(l), speaker: str(l.speaker) })).filter((l) => l.text), int(raw.answer), str(raw.why)),
  },
  {
    id: 'register',
    name: 'Match the register',
    levels: [B2, C1],
    stage: 'texts',
    ask: (L) =>
      `The same piece of news from the situation written 3–4 ways in ${L}, each with its English, each for a different place ("label" in English: a tweet, a headline, an official notice, a message to a friend) and written the way that place would.`,
    shape: (L) => `{"type":"register","instruction":"Where does each version belong?","items":[{"label":"<English>","target":"<${L}>","en":"<English>"}]}`,
    parse: (raw, rng) => {
      const items = recs(raw.items).map((i) => ({ ...line(i), label: str(i.label) }));
      return labelled(rng, {}, rng.sample(items.map((i) => ({ text: i.label })), items.length), items);
    },
  },
  {
    id: 'talk',
    name: 'Conversation',
    levels: [A1, C1],
    stage: 'talk',
    ask: (L) =>
      `A short conversation with someone in the situation ("partner": an emoji and who they are, in English): 3 "turns", each a ${L} line they say and 3 ${L} "choices" for the learner's answer, each with its English: exactly one "correct", the other two each wrong in a way the learner learns from (the wrong form, a misunderstanding, the wrong register), with "reaction": one short, friendly English sentence on what happens or why it's wrong ("" for the correct one). "closing" is the partner's last line.`,
    shape: (L) =>
      `{"type":"talk","instruction":"<English: what to do>","partner":"<emoji who>","turns":[{"target":"<${L}>","en":"<English>","choices":[{"target":"<${L}>","en":"<English>","correct":true,"reaction":""},{"target":"<${L}>","en":"<English>","correct":false,"reaction":"<English>"}]}],"closing":{"target":"<${L}>","en":"<English>"}}`,
    parse(raw, rng) {
      const turns = recs(raw.turns).map((t) => ({
        line: line(t),
        choices: recs(t.choices).map((c) => ({ ...line(c), correct: c.correct === true, reaction: str(c.reaction) || 'Not quite. Try another.' })),
      }));
      if (!turns.length || turns.length > 5) return null;
      for (const t of turns) {
        if (!t.line.text || t.choices.length < 2 || t.choices.filter((c) => c.correct).length !== 1 || !distinct(t.choices.map((c) => c.text))) return null;
      }
      const closing = line(raw.closing);
      return {
        kind: 'dialogue',
        partner: str(raw.partner),
        turns: turns.map((t) => ({ line: t.line, choices: rng.sample(t.choices, t.choices.length).map((c) => ({ text: c.text, en: c.en, correct: c.correct, reaction: c.correct ? '' : c.reaction })) })),
        ...(closing.text ? { closing } : {}),
      };
    },
  },
];

export const EXERCISE_TYPES: readonly ExerciseType[] = TYPES;

export function getExerciseType(id: string): ExerciseType | undefined {
  return TYPES.find((t) => t.id === id);
}

/** A lesson's level as an index into `CEFR`: the lower of a range ("CEFR A2–B1" = A2); A1 if none. */
export function levelIndex(level: string): number {
  const m = /([ABC])\s*([12])/i.exec(level);
  return m ? 'ABC'.indexOf(m[1]!.toUpperCase()) * 2 + Number(m[2]) - 1 : 0;
}

export const fitsLevel = (t: ExerciseType, level: number) => t.levels[0] <= level && level <= t.levels[1];

/** Whether a type comes up in `lang`; one limited to some languages doesn't when the language isn't known. */
export const fitsLang = (t: ExerciseType, lang: string | undefined) => !t.langs || (lang !== undefined && t.langs.includes(lang));
