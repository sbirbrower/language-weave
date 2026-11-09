// Lesson mode's marks: places in the English page where the reader's lesson can be practised, each
// with the target language for it and the lesson point it shows. The lesson stays the lesson; the
// page is only annotated. The extension glosses (`MARK_METHOD`): the English stays and the target
// language follows it. The eval (`npm run eval -- mark`) also tries two other ways to show a mark:
//   weave  the English is replaced by the target language in the sentence
//   note   the English is highlighted; the target language and a note open on a click
import { writingNotesFor } from '../languages';
import type { Kit } from '../passage/kit';
import { plainText } from '../passage/regex';
import type { SyllabusLesson } from '../syllabus/types';
import { findAll, overlaps, type Span } from '../weave/locate';

export type MarkMethod = 'weave' | 'gloss' | 'note';
/** What the model is told about the lesson: its syllabus points alone, or the cached kit's too. */
export type MarkInput = 'points' | 'kit';

export interface MarkJob {
  /** The language's name, as prompts say it. */
  language: string;
  lesson: SyllabusLesson;
  kit: Kit | null;
  title: string;
  heading: string;
  /** The section's paragraphs, as the page has them. */
  paragraphs: string[];
  /** The syllabus lessons before this one, in course order: what the reader already knows. */
  earlier?: SyllabusLesson[];
}

export interface MarkOptions {
  /** `paragraph || English || point || why || target`: the model says why a line fits before translating it. */
  whyFirst?: boolean;
  /** Tell the model what the reader already knows (`job.earlier`), and to keep within it. */
  known?: boolean;
  /**
   * About twice the marks: everywhere the lesson fits, even loosely, for the
   * check after it to cut. Marked this way and checked by Jev, then a lenient
   * Sonnet, twice as many good marks reach the page as without, and fewer wrong ones.
   */
  sweep?: boolean;
}

export interface Mark {
  /** 1-based, as numbered in the prompt. */
  para: number;
  english: string;
  target: string;
  /** 1-based, into the points the prompt listed. */
  point: number;
  note: string;
}

export interface PlacedMark extends Mark, Span {
  /** The paragraph it was found in, 0-based; differs from `para - 1` when the model gave the wrong one. */
  at: number;
}

export interface Placement {
  placed: PlacedMark[];
  missed: Array<Mark & { reason: 'not-found' | 'overlap' }>;
}

/** Sonnet with thinking off: as fast to the first mark as Haiku, and far fewer made-up marks (evals/out/mark*.md). */
export const MARK_MODEL = { model: 'claude-sonnet-5-5', effort: 'default', thinking: 'off' } as const;
/** How the extension shows a mark, what the model is told about the lesson, and how widely it marks. */
export const MARK_METHOD: MarkMethod = 'gloss';
export const MARK_INPUT: MarkInput = 'kit';
export const MARK_OPTIONS: MarkOptions = { sweep: true };

/** Byte-stable; the lesson and the page are in the user message. */
export const MARK_SYSTEM = 'You annotate web pages for language learners. Follow the instructions exactly.';

/** Words per mark the prompt asks for, and the most marks in one section. */
const WORDS_PER_MARK = 40;
const MAX_MARKS = 25;

const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;

export function maxMarks(job: MarkJob): number {
  return Math.min(MAX_MARKS, Math.max(2, Math.ceil(wordCount(job.paragraphs.join(' ')) / WORDS_PER_MARK)));
}

/** The points the prompt numbers: the kit's when it's given one (one per syllabus point), else the syllabus's. */
export function pointLabels(job: MarkJob, input: MarkInput): string[] {
  return input === 'kit' && job.kit?.points.length ? job.kit.points.map((p) => p.label) : job.lesson.points;
}

function lessonBlock(job: MarkJob, input: MarkInput): string {
  const { lesson, kit } = job;
  const head = `Title: ${lesson.title} (${lesson.level})`;
  if (input === 'points' || !kit?.points.length) return `${head}\nPoints:\n${lesson.points.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;
  const points = kit.points.map((p, i) => `${i + 1}. ${p.label}: ${p.explanation} Example: ${p.example}`);
  const vocab = kit.themeVocab.map((w) => `${w.word} (${w.gloss})`).join(', ');
  return [
    head,
    `Theme: ${kit.theme}`,
    `Points:\n${points.join('\n')}`,
    ...(vocab ? [`Theme words: ${vocab}`] : []),
    ...(kit.pitfalls.length ? [`Typical mistakes: ${kit.pitfalls.join('; ')}`] : []),
  ].join('\n');
}

const METHOD: Record<MarkMethod, (L: string) => { how: string; note: string }> = {
  weave: (L) => ({
    how: `Each mark replaces its English in the page with your ${L}, so the reader meets ${L} in the middle of the English sentence. So mark a short phrase (1–6 words) that can stand on its own in ${L}: a noun with its article or possessive, a verb with its subject, a time expression. The ${L} must mean the same as the English, be correct in that sentence (gender, number, case, agreement, tense) and read naturally where it stands.`,
    note: 'a hint of up to 12 words on what the lesson shows here (which form, and why)',
  }),
  gloss: (L) => ({
    how: `Each mark keeps its English and shows your ${L} right after it, like a translation in brackets. So the English can be a phrase or a short clause (up to about 12 words) when the point needs one, as word order or a verb tense often does. The ${L} translates that English faithfully with the lesson's form; if the English is too hard for the level, translate a simpler version that keeps its meaning.`,
    note: 'a hint of up to 12 words on what the lesson shows here (which form, and why)',
  }),
  note: (L) => ({
    how: `Each mark highlights its English; the reader clicks it to see your ${L} and your note. So the English can be a word, a phrase or a short clause (up to about 12 words). Write what that English becomes in ${L} with the lesson's form.`,
    note: `one or two sentences, up to 30 words, that teach the point with this example: what ${L} does differently from English here, and why`,
  }),
};

function knownBlock(job: MarkJob): string {
  const L = job.language;
  const earlier = job.earlier ?? [];
  const list = earlier.length
    ? `The reader has done these lessons before this one, so knows their words and grammar and nothing beyond them and the current lesson:\n${earlier.map((l) => `- ${l.title}: ${l.points.join('; ')}`).join('\n')}`
    : `This is the reader's first lesson, so they know nothing of ${L} beyond it.`;
  return `${list}\nKeep the ${L} to that. If an English sentence needs grammar the reader hasn't learned (another tense, say), mark only the lesson's words in it, or nothing.`;
}

/** The sweep's line on how many marks: about twice the usual, with doubtful ones in, since the check cuts. */
export function sweepDensity(job: MarkJob): string {
  return `Mark every place in the section where the lesson fits, even loosely: about one for every 20 words, at most ${2 * maxMarks(job)}. A check after you removes marks that don't say what the English says, so include a mark you're unsure of rather than leave it out.`;
}

function outputFormat(L: string, note: string, whyFirst: boolean): string {
  const shared = `- paragraph: the paragraph's number, without brackets.
- English: copied exactly from that paragraph, character for character (same capitals and punctuation), never across two paragraphs.`;
  if (whyFirst) {
    return `Write one mark per line, in page order, and nothing else:
paragraph || English || point || why || ${L}
${shared}
- point: the number of the lesson point it shows.
- why: in English, ${note}. Write it before the ${L}: if it shows the line doesn't fit, write just skip and end the line there.
- ${L}: what the English becomes.`;
  }
  return `Write one mark per line, in page order, and nothing else:
paragraph || English || ${L} || point || note
${shared}
- ${L}: what the English becomes.
- point: the number of the lesson point it shows.
- note: in English, ${note}.`;
}

export function buildMarkPrompt(method: MarkMethod, input: MarkInput, job: MarkJob, opts: MarkOptions = {}): string {
  const L = job.language;
  const level = job.lesson.level;
  const m = METHOD[method](L);
  const writing = writingNotesFor(L);
  const reader = opts.known
    ? `- Only clear cases the learner can follow.\n\n${knownBlock(job)}`
    : `- Only clear cases a ${level} learner can follow. Apart from the page's own names, keep the ${L} to words and grammar a ${level} learner knows.`;
  const page = [`Title: ${job.title}`, ...(job.heading ? [`Section: ${job.heading}`] : []), ...job.paragraphs.map((p, i) => `[${i + 1}] ${p}`)].join('\n');
  return `The reader is an English speaker taking a ${L} course (${level}). They are reading the English web page below, and their current lesson is:

<lesson>
${lessonBlock(job, input)}
</lesson>

Mark places in the page where this lesson can be practised, so the reader meets the lesson in what they are already reading. Don't change the lesson to fit the page and don't write about the page: find English words and phrases that ${L} would say with the lesson's words or grammar, and mark them.
- A vocabulary point fits where the English has a word on the lesson's theme, or close to it.
- A grammar point fits where ${L} would use that grammar for the English (a past tense for a lesson on a past tense, a time of day for a lesson on telling the time, a possessive for a lesson on possessives).
${reader}

${m.how}${writing ? `\n\n${writing}` : ''}

${opts.sweep ? sweepDensity(job) : `Spread the marks through the section: about one for every ${WORDS_PER_MARK} words, at most ${maxMarks(job)}. Use each point where it fits naturally; leave out a point the section has no good place for rather than forcing one, and mark the same point again rather than a weak case of another.`}

${outputFormat(L, m.note, opts.whyFirst ?? false)}

<page>
${page}
</page>`;
}

/**
 * Parses one line of `paragraph || English || target || point || note`, or with
 * `whyFirst` of `paragraph || English || point || why || target`; null for anything else.
 */
export function parseMark(raw: string, whyFirst = false): Mark | null {
  const line = raw.trim().replace(/^(?:[-*•]|\d+[.)])\s+(?=\d)/, '').replace(/^`+|`+$/g, '');
  const fields = line.split('||').map((f) => f.trim());
  if (fields.length !== 5) return null;
  const [para, english, a, b, c] = fields as [string, string, string, string, string];
  const [target, point, note] = whyFirst ? [c, a, b] : [a, b, c];
  const p = Number(para.replace(/[^\d]/g, ''));
  const n = Number(point.replace(/[^\d].*$/, ''));
  // A line the model took back once it had started it.
  if (!p || !english || !target || /(?:^|\W)skip\W*$/i.test(note) || /^skip\W*$/i.test(target)) return null;
  return { para: p, english, target, point: n || 0, note };
}

export const parseMarks = (text: string, whyFirst = false): Mark[] => text.split(/\r?\n/).flatMap((l) => parseMark(l, whyFirst) ?? []);

/**
 * Finds each mark in its paragraph (or another, if the model gave the wrong
 * number), leaving out marks that aren't there or overlap an earlier one.
 * Curly and straight apostrophes count as the same.
 */
export function placeMarks(marks: Mark[], paragraphs: string[]): Placement {
  const plain = paragraphs.map(plainText);
  const taken = paragraphs.map((): Span[] => []);
  const placed: PlacedMark[] = [];
  const missed: Placement['missed'] = [];
  for (const mark of marks) {
    const needle = plainText(mark.english);
    const order = [mark.para - 1, ...plain.keys()].filter((i, k, xs) => i >= 0 && i < plain.length && xs.indexOf(i) === k);
    let overlap = false;
    let hit: { at: number; span: Span } | undefined;
    for (const at of order) {
      const all = findAll(plain[at]!, needle);
      const free = all.find((s) => !taken[at]!.some((t) => overlaps(s, t)));
      if (free) {
        hit = { at, span: free };
        break;
      }
      if (all.length) overlap = true;
    }
    if (!hit) {
      missed.push({ ...mark, reason: overlap ? 'overlap' : 'not-found' });
      continue;
    }
    taken[hit.at]!.push(hit.span);
    placed.push({ ...mark, ...hit.span, at: hit.at });
  }
  return { placed, missed };
}
