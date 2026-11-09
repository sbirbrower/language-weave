import { buildCheckPrompt, parseVerdicts } from './check';
import { JEV_BAND, jevProbability, jevQuestions, jevState, type JevResult, type Noul } from './jev';
import { buildMarkPrompt, MARK_INPUT, MARK_METHOD, MARK_OPTIONS, parseMarks, placeMarks, pointLabels, type MarkJob, type PlacedMark } from './prompt';

/** A mark the check kept, with the lesson point it shows, ready to draw. */
export interface ShownMark extends PlacedMark {
  pointLabel: string;
}

export interface MarkCalls {
  /** The marking call, streamed: `onText` sees the text so far after every chunk. */
  mark(user: string, onText: (text: string) => void): Promise<{ text: string; usd: number | null }>;
  /** One mark's model check: the lenient one when there's `jev`, for the marks Jev isn't sure of. */
  check(user: string): Promise<{ text: string; usd: number | null }>;
  /** Jev, the first check on each mark, when there's a TypeSafe key. */
  jev?(state: unknown, questions: Record<string, Noul>): Promise<JevResult>;
}

export interface MarkedSection {
  marks: ShownMark[];
  /** Marks the check dropped, or whose check failed. */
  dropped: number;
  /** Marks that went to the model check: all of them without Jev, the ones it wasn't sure of with it. */
  toModel: number;
  /** Null if the marking call's price is unknown. */
  usd: number | null;
}

/**
 * Marks a section for the lesson: the marking call streams lines, each one is
 * placed in its paragraph as soon as it's whole and checked on its own, and a
 * mark the check keeps goes to `onMark` straight away. Placing is in order, so
 * a mark placed early keeps its span as more lines arrive. With `calls.jev`,
 * Jev decides first (`JEV_BAND`) and only the marks between go to the lenient
 * model check; if Jev fails on a mark, the model check decides it. A mark
 * whose model check fails is dropped: an unchecked mark may say something the
 * page doesn't.
 */
export async function markSection(job: MarkJob, calls: MarkCalls, onMark: (mark: ShownMark) => void): Promise<MarkedSection> {
  const labels = pointLabels(job, MARK_INPUT);
  const checks = new Map<string, Promise<ShownMark | null>>();
  let checkUsd = 0;
  let toModel = 0;
  const key = (m: PlacedMark) => `${m.at}:${m.start}`;
  /** Whether to show a mark: Jev's answer if it's sure, else the model check's. */
  const keeps = async (m: PlacedMark): Promise<boolean> => {
    if (calls.jev) {
      try {
        const res = await calls.jev(jevState()(job, m), jevQuestions(job));
        checkUsd += res.usd;
        const p = jevProbability(res.answers);
        if (p < JEV_BAND.lo) return false;
        if (p >= JEV_BAND.hi) return true;
      } catch {
        // Jev didn't answer: the model check decides this one.
      }
    }
    toModel++;
    const { text, usd } = await calls.check(buildCheckPrompt(job, [m], { lenient: Boolean(calls.jev) }));
    checkUsd += usd ?? 0;
    return parseVerdicts(text).get(0)?.kind !== 'drop';
  };
  const check = (m: PlacedMark) => {
    if (checks.has(key(m))) return;
    const shown: ShownMark = { ...m, pointLabel: labels[m.point - 1] ?? '' };
    const run = keeps(m).then(
      (keep) => {
        if (!keep) return null;
        onMark(shown);
        return shown;
      },
      () => null,
    );
    checks.set(key(m), run);
  };
  const placeDone = (lines: string[]) => placeMarks(parseMarks(lines.join('\n')), job.paragraphs).placed;

  let seen = 0;
  const { text, usd } = await calls.mark(buildMarkPrompt(MARK_METHOD, MARK_INPUT, job, MARK_OPTIONS), (sofar) => {
    const done = sofar.split('\n').slice(0, -1);
    if (done.length === seen) return;
    seen = done.length;
    for (const m of placeDone(done)) check(m);
  });
  // The last line may only be whole once the stream ends.
  for (const m of placeDone(text.split('\n'))) check(m);
  const results = await Promise.all(checks.values());
  const marks = results.filter((m): m is ShownMark => m !== null);
  return { marks, dropped: results.length - marks.length, toModel, usd: usd === null ? null : usd + checkUsd };
}
