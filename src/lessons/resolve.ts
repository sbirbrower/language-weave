import { withoutReadings } from '../ruby';
import { findAll, overlaps, type Span } from '../weave/locate';
import type { WeaveLine } from '../weave/parse';
import { checkLine, countWords, selectReplacements, type Rejection, type Replacement } from '../weave/select';
import type { Candidate, Lesson } from './types';

/** Splits allocated candidates into replacements written in code and ones the model must write. */
export function resolveLocal(
  lesson: Lesson,
  segment: string,
  candidates: Candidate[],
): { local: Replacement[]; remote: Candidate[] } {
  const local: Replacement[] = [];
  const remote: Candidate[] = [];
  for (const c of candidates) {
    const line = lesson.resolveLocally(c, segment);
    if (line) {
      local.push({
        ...line,
        start: c.start,
        end: c.end,
        words: c.words,
        category: lesson.categoryOf(c),
        numeral: lesson.numeralFor?.(c),
      });
    } else {
      remote.push(c);
    }
  }
  return { local, remote };
}

/** Compares lemmas loosely: case, apostrophe style, spacing, end punctuation and readings don't matter. */
export function normalizeLemma(s: string): string {
  return withoutReadings(s).toLowerCase().replace(/[’]/g, "'").replace(/[?!.,\s]+$/u, '').replace(/\s+/gu, ' ').trim();
}

/**
 * Matches the model's lines to the candidates it was asked about. A line is
 * accepted when its span covers an unmatched candidate (the occurrence
 * closest to that candidate wins) and its lemma is one the lesson allows for
 * that candidate. Anything else is off-lesson.
 */
export function matchLines(
  lesson: Lesson,
  segment: string,
  lines: WeaveLine[],
  candidates: Candidate[],
  taken: Span[] = [],
): { accepted: Replacement[]; rejected: Rejection[] } {
  const accepted: Replacement[] = [];
  const rejected: Rejection[] = [];
  const open = new Set(candidates);

  for (const line of lines) {
    const problem = checkLine(line);
    if (problem) {
      rejected.push({ line, reason: problem });
      continue;
    }
    const occurrences = findAll(segment, line.original);
    if (occurrences.length === 0) {
      rejected.push({ line, reason: 'not-found' });
      continue;
    }
    const free = occurrences.filter((o) => ![...taken, ...accepted].some((t) => overlaps(o, t)));
    if (free.length === 0) {
      rejected.push({ line, reason: 'overlap' });
      continue;
    }

    let best: { span: Span; c: Candidate } | undefined;
    for (const span of free) {
      for (const c of open) {
        if (!overlaps(span, c)) continue;
        if (!best || Math.abs(span.start - c.start) < Math.abs(best.span.start - best.c.start)) best = { span, c };
      }
    }
    const lemmaOk = best && lesson.lemmasFor(best.c).some((l) => normalizeLemma(l) === normalizeLemma(line.lemma));
    if (!best || !lemmaOk) {
      rejected.push({ line, reason: 'off-lesson' });
      continue;
    }

    open.delete(best.c);
    accepted.push({
      ...line,
      ...best.span,
      words: countWords(line.original),
      category: lesson.categoryOf(best.c),
      term: best.c.text,
      numeral: lesson.numeralFor?.(best.c),
    });
  }

  accepted.sort((a, b) => a.start - b.start);
  return { accepted, rejected };
}

/**
 * Validates a response that both wrote the lesson's candidates and added
 * top-up words. Lines covering a candidate go through `matchLines`; the rest
 * must fit `topUpWords`, use a lemma from the lesson's top-up vocabulary and
 * avoid its `topUpExclude`.
 */
export function matchLessonResponse(
  lesson: Lesson,
  segment: string,
  lines: WeaveLine[],
  candidates: Candidate[],
  local: Replacement[],
  topUpWords: number,
): { accepted: Replacement[]; rejected: Rejection[] } {
  const lessonPart = matchLines(lesson, segment, lines, candidates, local);
  const vocab = lesson.topUpVocabulary;
  if (!vocab || topUpWords <= 0) return lessonPart;

  const excluded = new Set((lesson.topUpExclude ?? []).map(normalizeLemma));
  const allowed = (l: WeaveLine) => !excluded.has(normalizeLemma(l.lemma)) && vocab.lemmas.has(normalizeLemma(l.lemma));
  const leftovers = lessonPart.rejected.filter((r) => r.reason === 'off-lesson').map((r) => r.line);
  const onList = leftovers.filter(allowed);
  const offList = leftovers.filter((l) => !allowed(l));
  const topUp = selectReplacements(segment, onList, {
    budget: topUpWords,
    taken: [...local, ...lessonPart.accepted],
    category: 'extra',
  });

  return {
    accepted: [...lessonPart.accepted, ...topUp.accepted].sort((a, b) => a.start - b.start),
    rejected: [
      ...lessonPart.rejected.filter((r) => r.reason !== 'off-lesson'),
      ...offList.map((line) => ({ line, reason: 'off-lesson' as const })),
      ...topUp.rejected,
    ],
  };
}
