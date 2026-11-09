import type { RubySpan } from './ruby';

/**
 * Romaji for a beginner who can't read kana yet: Japanese text split into words, each with its
 * Hepburn romanisation, written by code from the kana and the readings the model gives every kanji
 * (日本語《にほんご》). Words come from Chrome's Japanese segmenter, which cuts kana finely
 * (く|だ|さい, 飲|み|ます), so its pieces are glued back: kana after a word joins it unless it starts
 * a word of its own (a particle, です, ください, ありません…). Shown under each word by `rubyNodes`.
 */

const KANA = `あa いi うu えe おo かka きki くku けke こko がga ぎgi ぐgu げge ごgo
さsa しshi すsu せse そso ざza じji ずzu ぜze ぞzo たta ちchi つtsu てte とto だda ぢji づzu でde どdo
なna にni ぬnu ねne のno はha ひhi ふfu へhe ほho ばba びbi ぶbu べbe ぼbo ぱpa ぴpi ぷpu ぺpe ぽpo
まma みmi むmu めme もmo やya ゆyu よyo らra りri るru れre ろro わwa ゐi ゑe をo ゔvu ゕka ゖke`;
const ROMAJI = new Map(KANA.split(/\s+/).map((k) => [k[0]!, k.slice(1)]));
const SMALL_VOWEL: Record<string, string> = { ぁ: 'a', ぃ: 'i', ぅ: 'u', ぇ: 'e', ぉ: 'o' };
const SMALL_Y: Record<string, string> = { ゃ: 'a', ゅ: 'u', ょ: 'o' };
const MACRON: Record<string, string> = { a: 'ā', i: 'ī', u: 'ū', e: 'ē', o: 'ō' };
/** Vowel pairs said as one long vowel (おかあさん okāsan, とうきょう tōkyō); ii stays ii, ei stays ei. */
const LONG: Record<string, string> = { aa: 'ā', uu: 'ū', ee: 'ē', ou: 'ō', oo: 'ō' };

const toHiragana = (kana: string) => kana.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

/**
 * Hepburn for kana: しゃ sha, っ doubles the next consonant, ん before a vowel n', ー and long
 * vowels with a macron. `kept`: indices of an う that stays u (a verb's ending, 思《おも》う omou).
 * Anything that isn't kana passes through.
 */
export function kanaToRomaji(kana: string, kept: ReadonlySet<number> = new Set()): string {
  const text = toHiragana(kana);
  const out: string[] = [];
  let double = false;
  let prevKana = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    const last = out.length - 1;
    if (c === 'っ') {
      double = true;
      continue;
    }
    if (c === 'ー' && last >= 0) {
      out[last] = out[last]!.replace(/[aiueo]$/, (v) => MACRON[v]!);
      continue;
    }
    if (SMALL_Y[c] && last >= 0 && out[last]!.endsWith('i')) {
      const stem = out[last]!.slice(0, -1);
      out[last] = /(sh|ch|j)$/.test(stem) ? stem + SMALL_Y[c] : `${stem}y${SMALL_Y[c]}`;
      continue;
    }
    if (SMALL_VOWEL[c] && last >= 0 && /[aiueo]$/.test(out[last]!)) {
      const stem = out[last]!.slice(0, -1);
      out[last] = (stem || (out[last] === 'i' ? 'y' : 'w')) + SMALL_VOWEL[c];
      continue;
    }
    let r = c === 'ん' ? 'n' : (ROMAJI.get(c) ?? SMALL_VOWEL[c] ?? (SMALL_Y[c] ? `y${SMALL_Y[c]}` : c));
    if (double && /^[bcdfghjkmprstvwz]/.test(r)) r = (r.startsWith('ch') ? 't' : r[0]) + r;
    double = false;
    const prev = out[last];
    if (prev === 'n' && prevKana === 'ん' && /^[aiueoy]/.test(r)) out[last] = "n'";
    // A bare vowel that lengthens the one before it (LONG).
    const pair = prev && /^[aiueo]$/.test(r) && !kept.has(i) ? LONG[prev.slice(-1) + r] : undefined;
    if (prev && pair) out[last] = prev.slice(0, -1) + pair;
    else out.push(r);
    prevKana = c;
  }
  return out.join('');
}

const JAPANESE = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}ー々〆ヶ]/u;
const HIRAGANA_ONLY = /^[\p{Script=Hiragana}ー]+$/u;
const HAN_END = /[\p{Script=Han}々〆ヶ]$/u;
const HAN_ONLY = /^[\p{Script=Han}々〆ヶ]+$/u;

/** Kana that starts a word of its own after another word: particles, the copula, polite endings, suffixes. */
const STARTERS = `は が を に で と の も へ か ね よ や な から まで より だけ しか ので のに けど けれど
では には とは でも にも とも からは までは のは へは じゃ です でした でしょう だ だった
ございます ください ありません ありました あります います いました いません こと もの とき さん くん ちゃん さま`
  .split(/\s+/)
  .sort((a, b) => b.length - a.length);
const LONGEST = STARTERS[0]!.length;
/** Words that end in a は said wa. */
const WA = /^(?:は|では|には|とは|へは|からは|までは|のは)$|(?:にちは|ばんは)$/;

export interface RomajiWord {
  /** The word as written, its readings kept. */
  spans: RubySpan[];
  /** Hepburn, for a word in Japanese script. */
  romaji?: string;
}

let segmenter: Intl.Segmenter | undefined;

/** `spans` (from `rubySpans`) cut into words, each Japanese word with its romaji. */
export function romajiWords(spans: RubySpan[]): RomajiWord[] {
  // The text as written, and for each character the span it came from.
  let plain = '';
  const from: number[] = [];
  spans.forEach((s, n) => {
    plain += s.text;
    for (let k = 0; k < s.text.length; k++) from.push(n);
  });
  const insideBase = (at: number) => at > 0 && at < plain.length && from[at] === from[at - 1] && spans[from[at]!]!.reading !== undefined;

  segmenter ??= new Intl.Segmenter('ja', { granularity: 'word' });
  // The segmenter's pieces, never cutting through a word with a reading.
  const pieces: string[] = [];
  for (const { segment, index } of segmenter.segment(plain)) {
    if (pieces.length && insideBase(index)) pieces[pieces.length - 1] += segment;
    else pieces.push(segment);
  }

  const words: string[] = [];
  let prefix = false;
  for (let p = 0; p < pieces.length; p++) {
    const piece = pieces[p]!;
    const prev = words[words.length - 1];
    if (!JAPANESE.test(piece) || !prev || !JAPANESE.test(prev)) {
      words.push(piece);
      continue;
    }
    // お or ご before a kanji is part of the next word (お茶, ご飯).
    if (prefix && HAN_ONLY.test(piece[0]!)) {
      words[words.length - 1] += piece;
      prefix = false;
      continue;
    }
    prefix = false;
    if (!HIRAGANA_ONLY.test(piece)) {
      words.push(piece);
      continue;
    }
    if ((piece === 'お' || piece === 'ご') && HAN_ONLY.test(pieces[p + 1]?.[0] ?? '')) {
      words.push(piece);
      prefix = true;
      continue;
    }
    // The longest starter that ends where a piece ends.
    let run = '';
    let ends = -1;
    let starter = '';
    for (let q = p; q < pieces.length && HIRAGANA_ONLY.test(pieces[q]!) && run.length < LONGEST; q++) {
      run += pieces[q];
      if (STARTERS.includes(run)) [starter, ends] = [run, q];
    }
    const next = pieces[ends + 1] ?? '';
    const okurigana =
      // 面白|か|っ|た: an adjective's past, not the particle か.
      (HAN_END.test(prev) && starter === 'か' && next.startsWith('っ')) ||
      // 読|ん|で: the te-form.
      (/ん$/.test(prev) && /^[でだ]/.test(starter));
    // 勉強|し|て: a noun of two kanji or more and a form of する.
    const suru = HAN_ONLY.test(prev) && prev.length > 1 && /^[しすさせ]/.test(piece);
    if (starter && !okurigana) {
      words.push(starter);
      p = ends;
    }
    // Kana after a particle or です is a word of its own (が|でき|ます, は|どこ).
    else if (suru || STARTERS.includes(prev)) words.push(piece);
    else words[words.length - 1] += piece;
  }

  const out: RomajiWord[] = [];
  let at = 0;
  for (const word of words) {
    const start = at;
    at += word.length;
    const wordSpans: RubySpan[] = [];
    let kana = '';
    const kept = new Set<number>();
    for (let k = start; k < at; ) {
      const n = from[k]!;
      const s = spans[n]!;
      const spanStart = from.indexOf(n);
      const text = s.text.slice(k - spanStart, at - spanStart);
      wordSpans.push(s.reading !== undefined ? s : { text });
      if (s.reading !== undefined) kana += s.reading;
      else {
        // A verb's ending after its kanji: 思《おも》う is omou, not omō.
        if (text.startsWith('う') && k === spanStart && spans[n - 1]?.reading !== undefined) kept.add(kana.length);
        kana += text;
      }
      k += text.length;
    }
    if (!JAPANESE.test(word)) {
      // Text around the Japanese stays one piece.
      const last = out[out.length - 1];
      if (!last || last.romaji) out.push({ spans: wordSpans });
      else
        for (const s of wordSpans) {
          const end = last.spans[last.spans.length - 1]!;
          if (s.reading === undefined && end.reading === undefined) end.text += s.text;
          else last.spans.push(s);
        }
      continue;
    }
    const wa = WA.test(kana) ? kana.length - 1 : -1;
    const romaji = wa >= 0 ? `${kanaToRomaji(kana.slice(0, wa), kept)}wa` : kana === 'へ' ? 'e' : kanaToRomaji(kana, kept);
    out.push({ spans: wordSpans, romaji });
  }
  return out;
}
