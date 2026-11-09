import { jevProbability, type JevResult, type Noul } from '../marks/jev';
import { withoutReadings } from '../ruby';
import { cleanPiece, type CheckOptions } from './checks';
import type { Piece, PieceLine } from './piece';

/**
 * Jev's checks on a page-mode piece, against the section it was written
 * from: a true-or-false statement is dropped when Jev disagrees with its key,
 * a fact line or a gap when Jev doesn't believe it. Each line is checked as it
 * streams in and shown once its check passes. On hand-labelled pieces Jev
 * caught all 4 wrong keys and all 5 invented facts, dropping 1 of 99 good
 * items, and half the bad gaps with none of the good (`npm run eval -- widget`).
 */

export type CheckKind = 'statement' | 'fact' | 'gap';

export interface CheckItem {
  kind: CheckKind;
  language: string;
  /** The section the piece was written from. */
  section: string;
  fr: string;
  en: string;
  /** statement: its key; gap: its answer. */
  key?: boolean;
  answer?: string;
}

/** A line is kept at or above these (a statement: when Jev's answer matches its key). */
export const PIECE_THRESHOLDS: Record<CheckKind, number> = { statement: 0.5, fact: 0.4, gap: 0.3 };

/** Formats whose every line is a fact from the page. Jev was tested on key facts; the others are the same kind of line. */
export const FACT_FORMATS: ReadonlySet<string> = new Set(['key_facts', 'numbers', 'summary', 'timeline']);

/** A gap sentence with its answer in place of "____ (hint)". */
export const filled = (it: Pick<CheckItem, 'fr' | 'answer'>) => it.fr.replace(/_{2,}\s*(\([^)]*\))?/, it.answer ?? '');

/** statement: does the section say it's true; fact: is all of it in the section; gap: correct and true. */
export function jevAsk(it: CheckItem): { state: unknown; questions: Record<string, Noul> } {
  const L = it.language;
  if (it.kind === 'statement')
    return {
      state: { section: it.section, statement: it.en },
      questions: {
        true: {
          type: 'noul',
          instructions: 'The section says that the statement is true.',
          criteria: { true: 'The section states it, or says something that means the same.', false: 'The section says otherwise, or does not say it.' },
        },
      },
    };
  if (it.kind === 'fact')
    return {
      state: { section: it.section, sentence: it.en },
      questions: {
        supported: {
          type: 'noul',
          instructions: 'Everything the sentence says is stated in the section.',
          criteria: { true: 'Every fact, number and name in the sentence is in the section, or follows plainly from it.', false: 'The sentence adds, changes or stretches something the section says.' },
        },
      },
    };
  return {
    state: { section: it.section, sentence: filled(it), english: it.en, sentence_language: L, filled_in: it.answer },
    questions: {
      correct: {
        type: 'noul',
        instructions: `The ${L} sentence is correct ${L}, and the filled-in word fits it.`,
        criteria: { true: `Correct ${L} grammar and the word means what the English says.`, false: `A grammar mistake, or the filled-in word doesn't fit or doesn't mean what the English says.` },
      },
      supported: {
        type: 'noul',
        instructions: 'What the sentence says (given in English) is stated in the section.',
        criteria: { true: 'The section states it, or something that means the same.', false: 'The section says otherwise, or does not say it.' },
      },
    },
  };
}

/** What Jev checks a line as, or null if it isn't checked. */
export function checkItemFor(line: PieceLine, formatId: string, language: string, section: string): CheckItem | null {
  const base = { language, section, fr: withoutReadings(line.fr), en: line.en };
  if (line.kind === 'tf') return { ...base, kind: 'statement', key: line.answer };
  if (line.kind === 'gap') return { ...base, kind: 'gap', answer: line.answer };
  if (line.kind === 'line' && FACT_FORMATS.has(formatId)) return { ...base, kind: 'fact' };
  return null;
}

/** Whether to keep an item, from Jev's probability. */
export function keeps(item: CheckItem, p: number): boolean {
  const yes = p >= PIECE_THRESHOLDS[item.kind];
  return item.kind === 'statement' ? yes === item.key : yes;
}

export type AskJev = (state: unknown, questions: Record<string, Noul>) => Promise<JevResult>;

export interface PieceVerifier {
  /** The piece so far as it may be shown: lines up to the first still being checked, without dropped ones. */
  see(piece: Piece): Piece;
  /** The finished piece once every check is in, without the lines Jev dropped. */
  settle(piece: Piece): Promise<Piece>;
  /** What the checks cost so far. */
  usd(): number;
}

/**
 * Checks a piece's lines as they stream in. `onChange` is called when a check
 * comes back, so the caller can show the piece again with `see`. A line whose
 * check fails is kept: the checks in code have already run on it.
 */
export function createVerifier(opts: { formatId: string; language: string; section: string; jev: AskJev; onChange?: () => void } & CheckOptions): PieceVerifier {
  const verdicts = new Map<string, Promise<boolean>>();
  const decided = new Map<string, boolean>();
  let spent = 0;
  // Without readings: they may be filled in once more of the piece has come (`fillPieceReadings`).
  const key = (i: number, l: PieceLine) => `${i}|${withoutReadings(l.fr)}`;
  const start = (i: number, line: PieceLine) => {
    const k = key(i, line);
    if (verdicts.has(k)) return;
    const item = checkItemFor(line, opts.formatId, opts.language, opts.section);
    if (!item) {
      decided.set(k, true);
      verdicts.set(k, Promise.resolve(true));
      return;
    }
    const { state, questions } = jevAsk(item);
    const run = opts.jev(state, questions).then(
      (res) => {
        spent += res.usd;
        return keeps(item, jevProbability(res.answers));
      },
      () => true,
    );
    verdicts.set(
      k,
      run.then((keep) => {
        decided.set(k, keep);
        opts.onChange?.();
        return keep;
      }),
    );
  };
  return {
    see(piece) {
      piece.lines.forEach((l, i) => start(i, l));
      const shown: PieceLine[] = [];
      for (const [i, l] of piece.lines.entries()) {
        const keep = decided.get(key(i, l));
        if (keep === undefined) break;
        if (keep) shown.push(l);
      }
      return { ...piece, lines: shown };
    },
    async settle(piece) {
      piece.lines.forEach((l, i) => start(i, l));
      const keep = await Promise.all(piece.lines.map((l, i) => verdicts.get(key(i, l))!));
      return cleanPiece(piece, new Set(keep.flatMap((k, i) => (k ? [] : [i]))), { target: opts.target });
    },
    usd: () => spent,
  };
}
