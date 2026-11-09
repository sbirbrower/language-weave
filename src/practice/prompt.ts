import type { GrammarPoint } from '../grammar/types';
import { writingNotesFor } from '../languages';
import { sectionContext, type PageSection } from '../passage/context';
import type { Kit, KitPoint } from '../passage/kit';
import { englishIn, type TeachWord } from '../passage/piece';
import { seededRng } from '../passage/rng';
import type { SyllabusLesson } from '../syllabus/types';
import { getExerciseType, type ExerciseType, type Raw } from './exercises';
import type { Practice, Step } from './types';

/**
 * Thinking off, like the passage: one exercise takes a few seconds, and the
 * next is written while the reader does this one. Code checks every exercise.
 */
export const PRACTICE_MODEL = { model: 'claude-sonnet-5-5', effort: 'default', thinking: 'off' } as const;
/** Bump when the prompt or an exercise's shape changes. */
export const PRACTICE_VERSION = 'v3-focus';

/** Byte-stable; the lesson or page, the situation and the exercise asked for are in the user message. */
export const PRACTICE_SYSTEM = 'You write exercises for a language-learning app. Follow the instructions exactly.';

/** Theme words offered to the prompt, from the kit. */
const PRACTICE_WORDS = 14;
/** Page words offered to the prompt, the section's first. */
const PAGE_WORDS = 8;

interface InputBase {
  language: string;
  type: ExerciseType;
  /** The reader's level: the lesson's ("CEFR A2") or the setting's ("A2"). */
  level: string;
  /** Lesson mode: the kit's everyday situation the exercise is set in; page mode: the section's heading. */
  setting: string;
  /** Same seed, same choices and shuffles: the eval's variants are paired. */
  seed: string;
  /** "More like this": the exercise on screen, for one of the same kind with new sentences. */
  like?: Step;
}

/** Everything the prompt says, chosen by code before the call: from a syllabus lesson, or from the section of a page on screen. */
export type PracticeInput =
  | (InputBase & {
      mode: 'lesson';
      lesson: SyllabusLesson;
      kit: Kit;
      words: Array<{ word: string; gloss: string }>;
      /** What this exercise practises, planned by `schedule.ts`: one of the kit's points and a few theme words. */
      focus?: { point?: KitPoint; words: Array<{ word: string; gloss: string }> };
    })
  | (InputBase & { mode: 'page'; title: string; section: string; words: TeachWord[]; grammar?: GrammarPoint });

/**
 * The situation and words for a lesson exercise of `type`, on the kit point `point` with the theme words
 * `focus` when planned (`schedule.ts`); null for a type that doesn't exist.
 */
export function choosePractice(job: {
  language: string;
  lesson: SyllabusLesson;
  kit: Kit;
  type: string;
  seed: string;
  point?: string;
  focus?: readonly string[];
  /** One of the kit's situations to set it in, instead of one at random. */
  setting?: string;
  like?: Step;
}): PracticeInput | null {
  const type = getExerciseType(job.type);
  if (!type) return null;
  const { language, lesson, kit, seed } = job;
  const rng = seededRng(`${seed}|${lesson.id}|${job.type}`);
  const point = kit.points.find((p) => p.id === job.point);
  const focusWords = kit.themeVocab.filter((w) => job.focus?.includes(w.word));
  const rest = kit.themeVocab.filter((w) => !focusWords.includes(w));
  const focus = point || focusWords.length ? { focus: { ...(point ? { point } : {}), words: focusWords } } : {};
  return {
    mode: 'lesson',
    language,
    lesson,
    kit,
    seed,
    type,
    level: lesson.level,
    setting: job.setting && kit.settings.includes(job.setting) ? job.setting : kit.settings.length ? rng.pick(kit.settings) : '',
    words: [...focusWords, ...rng.sample(rest, PRACTICE_WORDS - focusWords.length)],
    ...focus,
    ...(job.like ? { like: job.like } : {}),
  };
}

/** The section on screen, the page words (those in it first) and a grammar point for the reader's level; null for a type that doesn't exist. */
export function choosePagePractice(job: {
  language: string;
  type: string;
  seed: string;
  title: string;
  sections: PageSection[];
  focus: number;
  level: string;
  pageWords: TeachWord[];
  grammar: GrammarPoint[];
  like?: Step;
}): PracticeInput | null {
  const type = getExerciseType(job.type);
  if (!type) return null;
  const rng = seededRng(`${job.seed}|${job.title}|${job.focus}|${job.type}`);
  const context = sectionContext(job.sections, job.focus);
  const here = job.pageWords.filter((w) => englishIn(w, context.text));
  const rest = job.pageWords.filter((w) => !here.includes(w));
  const words = rng.sample(here, PAGE_WORDS);
  return {
    mode: 'page',
    language: job.language,
    type,
    level: job.level,
    seed: job.seed,
    title: job.title,
    section: context.text,
    setting: context.heading || job.title,
    words: [...words, ...rng.sample(rest, PAGE_WORDS - words.length)],
    ...(job.grammar.length ? { grammar: rng.pick(job.grammar) } : {}),
    ...(job.like ? { like: job.like } : {}),
  };
}

/** The exercise the reader wants more like, as compact JSON: indexes for the widget left out, a paragraph's words joined. */
function likeJson(step: Step): string {
  return JSON.stringify(step, (key, value: unknown) =>
    key === 'shuffle' || key === 'accepted' ? undefined : key === 'tokens' ? (value as Array<{ text: string }>).map((t) => t.text).join(' ') : value,
  );
}

/** What the exercise is about: the lesson and its teaching, or the page and the words woven in it. */
function source(input: PracticeInput): { context: string; about: string; practises: string } {
  const L = input.language;
  if (input.mode === 'page') {
    const words = input.words.map((w) => `${w.target} (${w.english[0] ?? ''})`).join(', ');
    const grammar = input.grammar ? `- ${input.grammar.label}: ${input.grammar.instruction} (e.g. "${input.grammar.example}")` : '- (none: focus on the words)';
    return {
      context: `<page>
Title: ${input.title}
${input.section}
</page>

<grammar>
${grammar}
</grammar>

<words>
Words woven on this page: ${words || '(none: choose useful words from the page yourself)'}
</words>`,
      about: `on the part of the page above: its subject and its key words, with the grammar point where it fits naturally. It can be set in a made-up everyday scene about the subject (a chat with a friend, a message, a museum visit)`,
      practises: `- It practises the words woven on this page and the key words of this part of the page (keep those in ${L}, even above ${input.level}: the reader is here to learn them), and the grammar point where it fits. Everything else at ${input.level}.
- Every statement about the page's subject is true according to the page. Simplify freely, but never add facts, numbers, names, causes or opinions the page does not give. Made-up people may react to the subject, but what they say about it must be true.`,
    };
  }
  const { lesson, kit, setting, words, focus } = input;
  const explain = (p: KitPoint) => `${p.label}: ${p.explanation} (e.g. "${p.example}")`;
  const points = kit.points.map((p) => `- ${explain(p)}`).join('\n');
  const pitfalls = kit.pitfalls.length ? `\nTypical mistakes:\n${kit.pitfalls.map((p) => `- ${p}`).join('\n')}` : '';
  const gloss = (ws: Array<{ word: string; gloss: string }>) => ws.map((w) => `${w.word} (${w.gloss})`).join(', ');
  const focused = focus
    ? `\n\n<focus>${focus.point ? `\nThis exercise practises: ${explain(focus.point)}` : ''}${focus.words.length ? `\nWords to use where they fit: ${gloss(focus.words)}` : ''}\n</focus>`
    : '';
  const practises = focus?.point
    ? `- It practises the point in <focus>, not the lesson's other points, with the words in <focus> where they fit (others from the theme or the situation as needed). If this kind of exercise can't test the point head on, its words and sentences still show it. Nothing above ${lesson.level}.`
    : `- It practises this lesson: its grammar points and its words (${focus?.words.length ? 'above all those in <focus>, then ' : ''}the theme words, or others the situation needs). Nothing above ${lesson.level}.`;
  return {
    context: `<lesson>
Title: ${lesson.title}
Level: ${lesson.level}
Syllabus points:
${lesson.points.map((p) => `- ${p}`).join('\n')}
Theme: ${kit.theme}
Theme words: ${gloss(words)}
</lesson>

<teaching>
${points}${pitfalls}
</teaching>

<situation>
${setting || `an everyday situation on the theme`}
</situation>${focused}`,
    about: focus?.point ? 'on the point of this lesson in <focus>, set in the situation above' : 'on this lesson, set in the situation above',
    practises,
  };
}

export function buildPracticePrompt(input: PracticeInput): string {
  const { language: L, level, type } = input;
  const writing = writingNotesFor(L);
  const { context, about, practises } = source(input);
  const like = input.like
    ? `\n\n<like>\nThe learner asked for another exercise like this one:\n${likeJson(input.like)}\n</like>`
    : '';
  const likeRule = input.like
    ? `\n- It is like the exercise in <like>: it practises the same thing in the same way, on the same subject, but with new sentences and a different right answer. Never reuse its sentences or its answer.`
    : '';
  return `${context}${like}

Write one short exercise for an English-speaking learner of ${L} at ${level}, ${about}.

The exercise (${type.name}): ${type.ask(L)}

Write it as one line of JSON in this shape, with "praise" added: 2–4 words of ${L} praise for a right answer.
${type.shape(L)}

Rules:
${practises}${likeRule}
- All ${L} is correct, natural, standard ${L} a teacher would be happy to show; English is natural English.
- It has exactly one right answer. Wrong options are plausible, often ${input.mode === 'lesson' ? 'the mistakes in <teaching>' : 'typical learner mistakes'}, but clearly wrong once the point is understood; never two that could both be right.
- "answer" is copied exactly from the options. Numbers ("wrong", "answer" in a text) count from 0 unless the exercise says otherwise.
- "instruction" is a short English instruction for the learner, at most 8 words; you may make the one shown more specific.
- "why" is one or two short English sentences that explain the right answer, quoting the ${L}.
- Use asterisks only where the exercise asks for them. No Markdown.${writing ? `\n- ${writing} This goes for every ${L} word, in every field.` : ''}

Output that one line of JSON and nothing else: no code fences or comments.`;
}

/**
 * The exercise from the model's line of JSON, checked by its type and with
 * options shuffled by the seed; null if it's broken or of another type.
 */
export function parsePractice(text: string, input: Pick<PracticeInput, 'type' | 'setting' | 'seed'>): Practice | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) return null;
  let raw: Raw;
  try {
    raw = JSON.parse(text.slice(start, end + 1)) as Raw;
  } catch {
    return null;
  }
  const { type } = input;
  if (raw.type !== type.id) return null;
  const exercise = type.parse(raw, seededRng(`${input.seed}|${type.id}`));
  if (!exercise) return null;
  const instruction = typeof raw.instruction === 'string' && raw.instruction.trim() ? raw.instruction.trim() : type.name;
  return {
    step: { ...exercise, type: type.id, instruction } as Step,
    praise: typeof raw.praise === 'string' ? raw.praise.trim() : '',
    setting: input.setting,
  };
}
