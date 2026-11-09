/**
 * Readings over words, for a language a learner can't read unaided (Japanese
 * kanji, Hindi's Devanagari, Hebrew, Arabic, Chinese hanzi, Korean Hangul, Russian's Cyrillic). The model writes them Aozora Bunko style:
 * 日本語《にほんご》, 食《た》べる, the reading after the run of kanji it covers;
 * घर《ghar》, בבית《babáyit》, بالبيت《bil-bayt》, 학교에《hakgyoe》 or книга《kníga》, the reading after a whole Devanagari, Hebrew, Arabic, Hangul or Cyrillic word; 学生《xuéshēng》, pinyin
 * after each Chinese word; or ｜base《reading》 for any other base. Shown as <ruby>; dropped for speech and for comparing text.
 * Text without 《 passes through every function unchanged, except that
 * `rubyNodes` gives Japanese words their romaji (`src/romaji.ts`).
 */

import { romaniseHindi } from './devanagari';
import { romajiWords } from './romaji';

// What a reading covers without ｜: a run of kanji, or a Devanagari word (its vowel signs, virama and nukta are marks),
// or a Hebrew word, which may hold an apostrophe or a quote as a geresh or gershayim (ג'ירפה, צה"ל), or an Arabic word with any vowel marks
// and tatweel (Unicode puts them in no script: كِتَاب, ـون for an ending), or a Hangul word, or a Cyrillic one, hyphens and all (что-то, по-русски).
const READ = '[\\p{Script=Han}々〆ヶ]+|\\p{Script=Devanagari}+|\\p{Script=Hebrew}+(?:[\'"]\\p{Script=Hebrew}+)*|\\u0640*\\p{Script=Arabic}[\\p{Script=Arabic}\\u064b-\\u065f\\u0670\\u0640]*|\\p{Script=Hangul}+|\\p{Script=Cyrillic}+(?:-\\p{Script=Cyrillic}+)*';
const RUBY = new RegExp(`(?:｜([^｜《》\\n]+)|(${READ}))《([^《》\\n]+)》`, 'gu');

const DEVANAGARI_WORD = /^\p{Script=Devanagari}+$/u;
/** A reading as shown: a Devanagari word's written by code from the word, in Hindi's scheme (`src/devanagari.ts`); any other as the model wrote it. */
const shown = (base: string, reading: string) => (DEVANAGARI_WORD.test(base) ? romaniseHindi(base, reading) : reading);

export interface RubySpan {
  text: string;
  reading?: string;
}

export function rubySpans(text: string): RubySpan[] {
  if (!text.includes('《')) return text ? [{ text }] : [];
  const out: RubySpan[] = [];
  let last = 0;
  for (const m of text.matchAll(RUBY)) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    const base = m[1] ?? m[2]!;
    out.push({ text: base, reading: shown(base, m[3]!) });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

/** The text as written, readings left out: 日本語を食べる. */
export const withoutReadings = (text: string) => (text.includes('《') ? text.replace(RUBY, '$1$2') : text.replace(/｜/g, ''));

/** The text as said, each base replaced by its reading: にほんごをたべる. */
export const readingsOnly = (text: string) =>
  text.includes('《') ? text.replace(RUBY, (_, piped: string | undefined, word: string | undefined, reading: string) => shown(piped ?? word!, reading)) : text;

/** For plain-text places (a tooltip, an aria-label): 日本語(にほんご). */
export const readingsInBrackets = (text: string) =>
  text.includes('《')
    ? text.replace(RUBY, (_, piped: string | undefined, word: string | undefined, reading: string) => `${piped ?? word}(${shown(piped ?? word!, reading)})`)
    : text;

// Japanese, for romaji: Chinese has hanzi but never kana, and Japanese text with readings always has some.
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}]/u;
const READ_RUN = new RegExp(READ, 'gu');
const READ_ONLY = new RegExp(`^(?:${READ})$`, 'u');
const READ_END = new RegExp(`(?:${READ})$`, 'u');
const HAN_RUN = /^\p{Script=Han}/u;
const LATIN = /\p{Script=Latin}/u;

/** How many words in a script that takes readings `text` has, and how many have none: 2 and 1 for 日本語《にほんご》の学生. */
export function readingCount(text: string): { words: number; unread: number } {
  const read = text.match(RUBY)?.length ?? 0;
  const unread = text.replace(RUBY, ' ').match(READ_RUN)?.length ?? 0;
  return { words: read + unread, unread };
}

/** A base and its reading as the model writes it, with ｜ where the base alone wouldn't take it (after kanji, or not a run of kanji). */
const written = (s: RubySpan, before: string) => (READ_ONLY.test(s.text) && !READ_END.test(before) ? `${s.text}《${s.reading}》` : `｜${s.text}《${s.reading}》`);

interface ReadIndex {
  /** The source without readings. */
  plain: string;
  /** Where each base with a reading sits in `plain`. */
  bases: Array<{ start: number; end: number; reading: string }>;
}

function readIndex(source: string): ReadIndex {
  let plain = '';
  const bases: ReadIndex['bases'] = [];
  for (const s of rubySpans(source)) {
    const start = plain.length;
    plain += s.text;
    if (s.reading) bases.push({ start, end: plain.length, reading: s.reading });
  }
  return { plain, bases };
}

/**
 * The kanji `run` with readings copied from where the sources write the same kanji with theirs,
 * whole words only (so 二十歳 stays はたち, never に + じゅう + さい). Of several places, the one with
 * the same kana around it wins (お母さん: かあ; 母は: はは); '' if no source has the run.
 */
function readRun(run: string, before: string, after: string, sources: ReadIndex[], roman = false): string {
  let best = '';
  let bestScore = -1;
  for (const { plain, bases } of sources) {
    for (let i = plain.indexOf(run); i >= 0; i = plain.indexOf(run, i + 1)) {
      const end = i + run.length;
      const first = bases.findIndex((b) => b.start === i);
      if (first < 0) continue;
      const parts: string[] = [];
      let at = i;
      for (let k = first; k < bases.length && at < end && bases[k]!.start === at && (!roman || LATIN.test(bases[k]!.reading)); k++) {
        parts.push(`${plain.slice(bases[k]!.start, bases[k]!.end)}《${bases[k]!.reading}》`);
        at = bases[k]!.end;
      }
      if (at !== end) continue;
      const score = Number(Boolean(after) && plain.startsWith(after, end)) * 2 + Number(Boolean(before) && plain.endsWith(before, i));
      if (score > bestScore) [best, bestScore] = [parts.join(''), score];
    }
  }
  return best;
}

/**
 * A run of hanzi read word by word, where the sources give each word its pinyin: a note's 他是学生
 * from a piece's 他《tā》 and 是《shì》学生《xuéshēng》, the longest word first. '' unless every
 * character is read, since a bare one would take the next word's reading.
 */
function readWords(run: string, sources: ReadIndex[]): string {
  const chars = [...run];
  let out = '';
  for (let at = 0; at < chars.length; ) {
    let end = chars.length;
    let got = '';
    for (; end > at && !(got = readRun(chars.slice(at, end).join(''), '', '', sources, true)); end--);
    if (!got) return '';
    out += got;
    at = end;
  }
  return out;
}

/**
 * `text` with readings added to kanji it writes without them, copied from `sources` (the piece it
 * quotes, a lesson's words): a note that says 母は髪が長くて gets the readings its piece gave those
 * words. Kanji no source reads stay as they are. Text without kanji, or sources without readings,
 * change nothing.
 */
export function fillReadings(text: string, sources: string[]): string {
  if (!/[\p{Script=Han}\p{Script=Devanagari}\p{Script=Hebrew}\p{Script=Arabic}\p{Script=Hangul}\p{Script=Cyrillic}]/u.test(text)) return text;
  const index = sources.filter((s) => s.includes('《')).map(readIndex);
  if (!index.length) return text;
  return rubySpans(text)
    .map((s, n, spans) => {
      if (s.reading) return written(s, '');
      return s.text.replace(READ_RUN, (run, at: number) => {
        const before = at > 0 ? s.text[at - 1]! : (spans[n - 1]?.text.slice(-1) ?? '');
        return readRun(run, before, s.text.slice(at + run.length, at + run.length + 2), index) || (HAN_RUN.test(run) && readWords(run, index)) || run;
      });
    })
    .join('');
}

function spanNodes(doc: Document, spans: RubySpan[]): Node[] {
  return spans.map((s, n) => {
    if (!s.reading) return doc.createTextNode(s.text);
    const ruby = doc.createElement('ruby');
    const rt = doc.createElement('rt');
    rt.textContent = s.reading;
    // A romanisation (घर《ghar》) can be shown under its word or instead of it (`scriptStyles`), so its base gets a span to hide.
    if (LATIN.test(s.reading)) {
      // Straight after another romanised word (学生《xuéshēng》 after 是《shì》), it keeps a gap so the two don't run together.
      const prev = spans[n - 1]?.reading;
      ruby.className = prev && LATIN.test(prev) ? `${ROMAN_CLASS} ${ROMAN_CLASS}-j` : ROMAN_CLASS;
      const base = doc.createElement('span');
      base.textContent = s.text;
      ruby.append(base, rt);
    } else ruby.append(s.text, rt);
    return ruby;
  });
}

/**
 * How a language with a romanisation is shown: the romanisation over the script or under it, the
 * script alone, or the romanisation alone. Hindi's romanisation is its readings; Japanese's is the
 * romaji under each word, its kana readings staying over the kanji.
 */
export type ScriptView = 'above' | 'below' | 'script' | 'roman';
export const SCRIPT_VIEWS: readonly ScriptView[] = ['above', 'below', 'script', 'roman'];

/** Set on <html> to the `ScriptView`, so a switch shows or hides romanisations without drawing anything again. */
export const SCRIPT_ATTR = 'data-tissage-script';
/** On text in a right-to-left script (`src/direction.ts`): shown left to right when only its romanisation is. */
export const RTL_CLASS = 'tissage-rtl';
const ROMAJI_CLASS = 'tissage-rm';
const ROMAN_CLASS = 'tissage-rr';

/**
 * Shows each `ScriptView`. Without the attribute, readings sit over the script and romaji is hidden.
 * Every root that holds `rubyNodes` needs these: the page's style, and `shadow` for a shadow root's.
 */
export function scriptStyles(shadow: boolean): string {
  const on = (view: ScriptView) => (shadow ? `:host-context(html[${SCRIPT_ATTR}="${view}"])` : `html[${SCRIPT_ATTR}="${view}"]`);
  const noRomaji = `html${(['above', 'below', 'roman'] as const).map((v) => `:not([${SCRIPT_ATTR}="${v}"])`).join('')}`;
  const off = shadow ? `:host-context(${noRomaji})` : noRomaji;
  return `
.${ROMAJI_CLASS} { display: inline-flex; flex-direction: column; align-items: center; padding: 0 0.12em; }
.${ROMAJI_CLASS}-text { font-size: 0.62em; line-height: 1.15; font-weight: 400; font-style: normal; letter-spacing: 0; opacity: 0.8; white-space: nowrap; }
${off} .${ROMAJI_CLASS} { display: inline; padding: 0; }
${off} .${ROMAJI_CLASS}-text { display: none; }
${on('above')} .${ROMAJI_CLASS} { flex-direction: column-reverse; }
ruby.${ROMAN_CLASS}-j { margin-left: 0.3em; }
${on('below')} ruby.${ROMAN_CLASS} { ruby-position: under; }
${on('script')} ruby.${ROMAN_CLASS} > rt { display: none; }
${on('script')} ruby.${ROMAN_CLASS}-j { margin-left: 0; }
${on('roman')} ruby.${ROMAN_CLASS} { display: inline; }
${on('roman')} ruby.${ROMAN_CLASS} > span { display: none; }
${on('roman')} ruby.${ROMAN_CLASS} > rt { display: inline; font-size: inherit; line-height: inherit; }
${on('roman')} .${RTL_CLASS} { direction: ltr; }
${on('roman')} .${ROMAJI_CLASS} { display: inline; padding: 0 0.15em; }
${on('roman')} .${ROMAJI_CLASS} > span:first-child { display: none; }
${on('roman')} .${ROMAJI_CLASS}-text { font-size: inherit; line-height: inherit; opacity: 1; }`;
}

/**
 * Text nodes and <ruby> elements for `text`; `innerHTML` is never used. Japanese words also get
 * their romaji underneath (`romajiWords`), hidden unless `scriptStyles` shows it.
 */
export function rubyNodes(doc: Document, text: string): Node[] {
  if (!KANA.test(text)) return spanNodes(doc, rubySpans(text));
  return romajiWords(rubySpans(text)).flatMap((w) => {
    if (!w.romaji) return spanNodes(doc, w.spans);
    const word = doc.createElement('span');
    word.className = ROMAJI_CLASS;
    const base = doc.createElement('span');
    base.append(...spanNodes(doc, w.spans));
    const romaji = doc.createElement('span');
    romaji.className = `${ROMAJI_CLASS}-text`;
    romaji.textContent = w.romaji;
    word.append(base, romaji);
    return [word];
  });
}

/**
 * `text` cut into words where `cut` cuts it without its readings, never inside a base with its
 * reading: 私《わたし》は学生《がくせい》です → 私《わたし》, は, 学生《がくせい》, です.
 */
export function splitWords(text: string, cut: (plain: string) => string[]): string[] {
  const spans = rubySpans(text);
  if (!spans.some((s) => s.reading)) return cut(text);
  let plain = '';
  const starts = spans.map((s) => {
    const start = plain.length;
    plain += s.text;
    return start;
  });
  const inside = (at: number) => spans.some((s, n) => s.reading && at > starts[n]! && at < starts[n]! + s.text.length);
  const ends: number[] = [];
  let at = 0;
  for (const piece of cut(plain)) {
    at += piece.length;
    if (at < plain.length && !inside(at)) ends.push(at);
  }
  ends.push(plain.length);
  let from = 0;
  return ends.map((end) => {
    let word = '';
    spans.forEach((s, n) => {
      const a = Math.max(from, starts[n]!);
      const b = Math.min(end, starts[n]! + s.text.length);
      if (a < b) word += s.reading ? written(s, word) : s.text.slice(a - starts[n]!, b - starts[n]!);
    });
    from = end;
    return word;
  });
}
