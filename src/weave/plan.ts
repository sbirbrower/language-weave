import {
  calibrate,
  estimateRequest,
  MIN_CALIBRATION_REQUESTS,
  priceFor,
  sumEstimates,
  type Calibration,
  type PageEstimate,
} from '../cost';
import type { LanguageConfig } from '../languages';
import { allocate } from '../lessons/allocate';
import { allocatePageWords, PAGE_CAPS, withPageWords } from '../lessons/pageWords';
import { resolveLocal } from '../lessons/resolve';
import type { Candidate, Lesson } from '../lessons/types';
import type { Level } from '../grammar/types';
import type { Effort } from '../settings';
import { buildLessonPrompt, buildSystemPrompt, buildUserPrompt, levelNote, TOP_UP_ASK } from './prompt';
import type { Segment } from './segment';
import { countWords, segmentBudgets, type Replacement } from './select';

/** Uses of one page word or easy word allowed per 1000 words of page (at least `PAGE_CAPS.perEntryPerPage`). */
const EXTRA_PER_1000_WORDS = 3;

/** A model request the plan will make; the user prompt is exactly what the background builds. */
export interface PlannedRequest {
  kind: 'lesson' | 'general';
  /** The system prompt includes the lesson's top-up vocabulary. */
  vocabulary: boolean;
  user: string;
  /** A general request's level line, sent with it so the background builds the same prompt. */
  levelNote?: string;
  /** Lines expected back, for the output estimate. */
  lines: number;
}

export interface SegmentPlan {
  /** Lesson words written in code, no model needed. */
  local: Replacement[];
  /** Lesson words and page words the model must write. */
  remote: Candidate[];
  /** Words for the general weave: the whole budget without a lesson, or a lesson's top-up when it has no vocabulary of its own. */
  generalBudget: number;
  /** Top-up words from the lesson's vocabulary, asked for in the same request as the candidates. */
  topUpWords: number;
  /** A request carries a top-up or the general weave, so it may take words other segments fell short on. */
  canCarry: boolean;
  requests: PlannedRequest[];
}

export interface PlanOptions {
  density: number;
  lesson?: Lesson;
  /** Words picked for this page (`pageWordsLesson`) for a lesson that picks them; they fill what the lesson leaves, before any top-up. */
  pageWords?: Lesson;
  /** Easy words (`easyWordsLesson`); they fill what the lesson and page words leave, before any top-up. */
  easyWords?: Lesson;
  topUp: boolean;
  /** The reader's level: what the general weave and a lesson's free top-up pick for. */
  level: Level;
  /** Without a key nothing goes to the model; lessons still write their fixed words. */
  hasKey: boolean;
}

/** Decides what every segment will get, before anything is sent. */
export function planPage(segments: Segment[], { density, lesson, pageWords, easyWords, topUp, level, hasKey }: PlanOptions): SegmentPlan[] {
  const words = segments.map((s) => countWords(s.text));
  // A general request asks for about one line per 1.5 English words.
  const note = levelNote(level);
  const generalRequest = (passage: string, budget: number): PlannedRequest => ({
    kind: 'general',
    vocabulary: false,
    user: buildUserPrompt({ passage, targetWords: budget, levelNote: note }),
    levelNote: note,
    lines: Math.max(1, Math.ceil(budget / 1.5)),
  });

  if (!lesson) {
    return segmentBudgets(words, density).map((budget, i) => {
      const generalBudget = hasKey ? budget : 0;
      const requests = generalBudget > 0 ? [generalRequest(segments[i]!.text, generalBudget)] : [];
      return { local: [], remote: [], generalBudget, topUpWords: 0, canCarry: requests.length > 0, requests };
    });
  }

  const allocation = allocate(
    segments.map((s) => ({ text: s.text, candidates: lesson.findCandidates(s.text) })),
    density,
    lesson.caps,
  );
  const leftover = allocation.budget - allocation.spent;
  // Each segment's share of what the lesson left; page words and top-up only spend within it.
  const shares =
    hasKey && leftover > 0 && allocation.totalWords > 0
      ? segmentBudgets(words, leftover / allocation.totalWords)
      : words.map(() => 0);
  // Extra words, each list in what the ones before it left: page words, then easy words.
  const spentIn = (cs: Candidate[]) => cs.reduce((n, c) => n + c.words, 0);
  // Longer pages may repeat a word more often: it's still rare per paragraph.
  const caps = { ...PAGE_CAPS, perEntryPerPage: Math.max(PAGE_CAPS.perEntryPerPage, Math.round((EXTRA_PER_1000_WORDS * allocation.totalWords) / 1000)) };
  const extraPicks = (extra: Lesson | undefined, taken: Candidate[][]) =>
    extra && hasKey
      ? allocatePageWords(
          segments.map((s, i) => ({ text: s.text, candidates: extra.findCandidates(s.text), taken: taken[i]! })),
          shares.map((share, i) => Math.max(0, share - spentIn(taken[i]!) + spentIn(allocation.perSegment[i]!))),
          caps,
        )
      : words.map((): Candidate[] => []);
  const pagePicks = extraPicks(pageWords, allocation.perSegment);
  // Easy words belong to the lesson, so they're woven whether or not the
  // model's free top-up is on.
  const easy = easyWords;
  const easyPicks = extraPicks(easy, allocation.perSegment.map((cs, i) => [...cs, ...pagePicks[i]!]));

  let combined = lesson;
  if (pageWords && hasKey) combined = withPageWords(combined, pageWords);
  if (easy && hasKey) combined = withPageWords(combined, easy);
  // With its own vocabulary, a lesson asks for its words and the top-up in
  // one request per segment: one round trip instead of two in a row.
  const vocabulary = topUp && Boolean(lesson.topUpVocabulary);

  return allocation.perSegment.map((candidates, i) => {
    const passage = segments[i]!.text;
    const { local, remote: lessonRemote } = resolveLocal(combined, passage, candidates);
    const remote = [...lessonRemote, ...pagePicks[i]!, ...easyPicks[i]!].sort((a, b) => a.start - b.start);
    const extraSpent = spentIn(pagePicks[i]!) + spentIn(easyPicks[i]!);
    const rest = topUp ? Math.max(0, shares[i]! - extraSpent) : 0;
    const topUpWords = vocabulary ? rest : 0;
    const generalBudget = vocabulary ? 0 : rest;
    const requests: PlannedRequest[] = [];
    if (hasKey && (remote.length || topUpWords > 0)) {
      const taken = local.map((r) => r.original);
      requests.push({
        kind: 'lesson',
        vocabulary,
        user: buildLessonPrompt({ passage, lesson: combined, candidates: remote, topUp: vocabulary ? { words: topUpWords, taken } : undefined }),
        lines: remote.length + Math.ceil((topUpWords * TOP_UP_ASK) / 1.5),
      });
    }
    if (generalBudget > 0) requests.push(generalRequest(passage, generalBudget));
    // From B1 the top-up is a general request (no vocabulary), and it carries the shortfall instead.
    const canCarry = (vocabulary && requests.some((r) => r.kind === 'lesson')) || generalBudget > 0;
    return { local, remote, generalBudget, topUpWords, canCarry, requests };
  });
}

export interface EstimateOptions {
  lang: LanguageConfig;
  lesson?: Lesson;
  model: string;
  effort: Effort;
  /** False when thinking is off for this model. */
  thinks: boolean;
  calibration?: Calibration;
  /** Requests outside the plan, such as picking the page's words. */
  extra?: Array<{ system: string; user: string; lines: number }>;
}

/** What the plan's requests should cost, from prompt sizes and the model's price. */
export function estimatePlan(
  plans: SegmentPlan[],
  { lang, lesson, model, effort, thinks, calibration, extra = [] }: EstimateOptions,
): PageEstimate {
  const reqs = [
    ...plans.flatMap((p) => p.requests).map((r) => ({ system: systemFor(lang, lesson, r), user: r.user, lines: r.lines })),
    ...extra,
  ].map((r) => calibrate(estimateRequest(r.system, r.user, r.lines, effort, thinks), calibration));
  const calibrated = (calibration?.requests ?? 0) >= MIN_CALIBRATION_REQUESTS;
  return sumEstimates(reqs, priceFor(model), calibrated);
}

/** The system prompt a planned request is sent with. */
export function systemFor(lang: LanguageConfig, lesson: Lesson | undefined, r: Pick<PlannedRequest, 'vocabulary'>): string {
  return buildSystemPrompt(lang, r.vocabulary ? lesson : undefined);
}
