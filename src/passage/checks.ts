import { getFormat } from './formats';
import { wordPresent, type Piece } from './piece';
import { seededRng } from './rng';
import { readingCount, withoutReadings } from '../ruby';

/**
 * Checks in code for a piece that came out broken: free, so they run on
 * every piece. A broken line is dropped (`cleanPiece`); a piece still broken
 * after that (`wholeIssues`: a riddle with no options, too few quiz lines,
 * readings left off more than a fifth of the words that take one) is
 * written again. On 72 page-mode pieces they flagged 30, close to what reading
 * them found (evals/out/passage-page-6formats.md).
 */

export interface Issue {
  /** The line it's on, or -1 for the whole piece. */
  line: number;
  issue: string;
}

// Short English words nearly every English sentence has, and few other languages write the same way.
const ENGLISH = new Set(
  ('the is are were be been has have had of to at by for with from and or but not it its this that these those there they their them ' +
    'i am he his she her my we our you your what who which how when where why can would could should more most than very only ' +
    'so if all one two many some every each about after before into over under up out just like because do does did').split(' '),
);
// English too, but other languages write them as well (French a, on, me; German in, was, will, also).
const SHARED = new Set('a an in on as was will also me'.split(' '));

/**
 * Whether text meant to be English is in another language, 3 words or more.
 * Mostly letters of another script (日本語, русский), readings aside, is never English. Otherwise,
 * with the target language's `functionWords`, it is when it has at least two
 * of them and more than English words; without, when it has no English words.
 */
export function notEnglish(text: string, target?: ReadonlySet<string>): boolean {
  // Counted without readings, which are Latin letters and longer than the word they read (학교《hakgyo》).
  const bare = withoutReadings(text);
  const script = bare.match(/[^\P{L}\p{Script=Latin}]/gu)?.length ?? 0;
  if (script >= 3 && script > (bare.match(/\p{Script=Latin}/gu)?.length ?? 0)) return true;
  const words = text.toLowerCase().match(/\p{L}+/gu) ?? [];
  if (words.length < 3) return false;
  const english = words.filter((w) => ENGLISH.has(w) || SHARED.has(w)).length;
  if (!target) return !words.some((w) => ENGLISH.has(w));
  // A romanised word counts without its accents too (hai, nahīṃ → nahim), so a target list can give them plain.
  const plain = (w: string) => w.normalize('NFD').replace(/\p{M}/gu, '');
  const other = (text.toLowerCase().match(/[\p{L}\p{M}]+/gu) ?? []).filter((w) => target.has(w) || target.has(plain(w))).length;
  return other >= 2 && other > english;
}

export interface CheckOptions {
  /** The target language's function words (`LanguageConfig.functionWords`). */
  target?: ReadonlySet<string>;
}

/** The model talking about its own output instead of writing the piece. */
const COMMENT = /\b(hmm+|placeholder|see note|not supported|must be removed|replaced below|not stated)\b|\(note\b|^note\s*:|\.\.\.|…|(^|\s)non,\s/i;

/** Every issue: each broken line, then what's wrong with the piece as a whole. */
export function pieceIssues(piece: Piece, opts: CheckOptions = {}): Issue[] {
  return [...lineIssues(piece, opts), ...wholeIssues(piece)];
}

function lineIssues(piece: Piece, opts: CheckOptions): Issue[] {
  const out: Issue[] = [];
  const seen = new Set<string>();
  const choice = piece.lines.find((l) => l.kind === 'choice') as { answer: string } | undefined;
  piece.lines.forEach((l, i) => {
    const texts = [l.fr, l.en, ...(l.kind === 'tf' && l.fix ? [l.fix.fr, l.fix.en] : [])];
    if (texts.some((t) => COMMENT.test(t))) out.push({ line: i, issue: 'a comment or placeholder in the piece' });
    if (!l.en.trim()) out.push({ line: i, issue: 'no English' });
    else if (l.kind !== 'pair' && notEnglish(l.en, opts.target)) out.push({ line: i, issue: 'the English field isn’t English' });
    if (l.kind === 'tf' && (/[?؟]\s*$/.test(l.fr) || /^(true or false|quiz)\b/i.test(l.en))) out.push({ line: i, issue: 'a title or question read as a statement' });
    if (l.kind === 'gap' && (/^(none|-|)$/i.test(l.answer.trim()) || /\.\.\./.test(l.en))) out.push({ line: i, issue: 'a broken gap' });
    if (seen.has(l.fr.trim().toLowerCase())) out.push({ line: i, issue: 'a repeated line' });
    seen.add(l.fr.trim().toLowerCase());
    if (choice && l.kind === 'line' && wordPresent(choice.answer, l.fr)) out.push({ line: i, issue: 'a clue names the answer' });
  });
  return out;
}

/** The share of words in a script that takes readings (`src/ruby.ts`) a piece may leave without one. */
const MAX_UNREAD = 0.2;

/** What's still wrong with the piece once its broken lines are gone: it needs writing again. */
export function wholeIssues(piece: Piece): Issue[] {
  const kind = getFormat(piece.formatId)?.kind ?? 'lines';
  const count = (k: Piece['lines'][number]['kind']) => piece.lines.filter((l) => l.kind === k).length;
  const out: Issue[] = [];
  if (kind === 'riddle') {
    if (!count('choice')) out.push({ line: -1, issue: 'a riddle with no options' });
    if (count('line') < 3) out.push({ line: -1, issue: 'a riddle with fewer than 3 clues' });
  }
  if (kind === 'match' && count('pair') < 3) out.push({ line: -1, issue: 'fewer than 3 word pairs' });
  if (kind === 'true_false' && count('tf') < 3) out.push({ line: -1, issue: 'fewer than 3 statements' });
  if (kind === 'gap_fill' && count('gap') < 3) out.push({ line: -1, issue: 'fewer than 3 gaps' });
  // Counted after `fillPieceReadings`: a word its sources read is read. Without readings, romanisation-only view shows the script.
  const counts = [piece.title.fr, ...piece.lines.map((l) => l.fr)].map(readingCount);
  const words = counts.reduce((n, c) => n + c.words, 0);
  const unread = counts.reduce((n, c) => n + c.unread, 0);
  if (unread >= 3 && unread > MAX_UNREAD * words) out.push({ line: -1, issue: 'words without readings' });
  return out;
}

/** The piece without its broken lines; `drop` adds lines to leave out (by index), such as ones Jev rejected. */
export function cleanPiece(piece: Piece, drop: ReadonlySet<number> = new Set(), opts: CheckOptions = {}): Piece {
  const bad = new Set([...drop, ...lineIssues(piece, opts).map((x) => x.line)]);
  if (!bad.size) return piece;
  const lines = piece.lines.filter((_, i) => !bad.has(i));
  const out: Piece = { ...piece, lines };
  // The pair order points into the pair lines, so a dropped pair needs a new one.
  const pairs = lines.filter((l) => l.kind === 'pair').length;
  if (piece.shuffle && pairs !== piece.shuffle.length) out.shuffle = seededRng(lines.map((l) => l.fr).join('|')).sample([...Array(pairs).keys()], pairs);
  return out;
}
