import type { GrammarPoint } from '../grammar/types';
import { writingNotesFor } from '../languages';
import { fillReadings } from '../ruby';
import type { SyllabusLesson } from '../syllabus/types';
import { sectionContext, type PageSection, type PassageContext } from './context';
import { FORMATS, getFormat, QUIZ_FIELDS, type Format, type FormatKind } from './formats';
import type { Kit } from './kit';
import { plainText } from './regex';
import { seededRng, type Rng } from './rng';

/**
 * The widget's passage: one piece in a random format (`formats.ts`), in the
 * language with an English line for each line. Webpage mode writes about the
 * section on screen with the page's woven words and one grammar point for the
 * reader's level; lesson mode writes a made-up scene on the lesson's theme
 * with its words and grammar, never the page. One call, streamed.
 */

/**
 * Sonnet with thinking off: one call per section and per "New passage". Haiku broke 29 of 72
 * page-mode pieces (its notes to itself in the piece, riddles with no options); Sonnet 4, for about
 * a second more to the first line and under a cent a piece (evals/out/passage-shipped-fixed-sonnet*).
 */
export const PASSAGE_MODEL = { model: 'claude-sonnet-5-5', effort: 'default', thinking: 'off' } as const;

/** Byte-stable; everything about the format, lesson and page is in the user message. */
export const PASSAGE_SYSTEM = 'You write short texts for language learners. Follow the instructions exactly.';

/** A word to teach: the target-language word and English it means (for a woven word, the English it replaced). */
export interface TeachWord {
  target: string;
  english: string[];
}

export type PieceLine =
  | { kind: 'line'; fr: string; en: string }
  /** A true-or-false statement; a false one may come with its correction. */
  | { kind: 'tf'; fr: string; en: string; answer: boolean; fix?: { fr: string; en: string } }
  /** `fr` has ____ where `answer` goes. */
  | { kind: 'gap'; fr: string; en: string; answer: string }
  /** A word and its English meaning, for matching. */
  | { kind: 'pair'; fr: string; en: string }
  /** A question with options in random order. */
  | { kind: 'choice'; fr: string; en: string; options: string[]; answer: string };

export interface Piece {
  formatId: string;
  /** In the language and in English; empty until it has streamed in. */
  title: { fr: string; en: string };
  lines: PieceLine[];
  /** Match the words: the order the meanings are shown in, as indexes into the pair lines. */
  shuffle?: number[];
}

export type PieceMode = 'page' | 'lesson';

interface JobBase {
  formatId: string;
  /** The language's name, as prompts say it. */
  language: string;
  /** Same seed, same choices: the eval's variants are paired comparisons. */
  seed: string;
}

export interface PageJob extends JobBase {
  mode: 'page';
  /** The reader's level ("A2"). */
  level: string;
  title: string;
  sections: PageSection[];
  /** The section on screen, in `sections`. */
  focus: number;
  /** Words woven on this page. */
  pageWords: TeachWord[];
  /** The grammar points for the reader's level; one is picked. */
  grammar: GrammarPoint[];
}

export interface LessonJob extends JobBase {
  mode: 'lesson';
  lesson: SyllabusLesson;
  kit: Kit;
}

export type PieceJob = PageJob | LessonJob;

/** Everything the prompt says, chosen by code before the call. */
export interface PieceInput {
  format: Format;
  language: string;
  level: string;
  words: TeachWord[];
  grammar: Array<{ label: string; instruction: string; example: string }>;
  page?: { title: string; context: PassageContext };
  lesson?: { title: string; theme: string; setting: string; pitfalls: string[] };
}

const PAGE_WORDS = 5;
const LESSON_WORDS = 6;
/** A lesson passage practises this many of the lesson's points; the rest come up in the next one. */
const LESSON_POINTS = 2;
const MAX_LINES = 14;

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Hebrew's final letters and the shapes they take inside a word (שולחן, שולחנות). */
const HEBREW_FINALS: Record<string, string> = { ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' };
/** What joins the front of an Arabic word: و or ف, then ب, ك or ل, then the article (ل with it is لل). */
const ARABIC_FRONT = '[وف]?(?:لل|[بك]?ال|[بكل])?';
/** The pronoun an Arabic noun or verb can end with (بيتنا, كتابه), or none. */
const ARABIC_PRONOUN = '(?:هما|هم|هن|ها|ه|كما|كم|كن|ك|نا|ي)?';
/** Korean particles and copula endings a noun takes, longest first. */
const KOREAN_PARTICLES = '에서|에게|한테|으로|이랑|하고|부터|까지|보다|처럼|이에요|입니다|이다|이고|예요|이야|이|가|은|는|을|를|에|의|와|과|도|만|로|랑|야|고';
/**
 * A Korean verb stem as letters (jamo), its last syllable as endings change it: a vowel that
 * contracts (마시: 마셔요, 보: 봐요, 크: 커요, 하: 해요), a final ㄷ, ㅂ, ㅅ or ㄹ that changes or
 * drops (듣: 들어요, 춥: 추워요, 살: 사세요), 르 that doubles its ㄹ (모르: 몰라요).
 */
function hangulStem(stem: string): string {
  const j = stem.normalize('NFD');
  const head = escape(j.slice(0, -1));
  const last = j.slice(-1);
  if (j.endsWith('르'.normalize('NFD'))) return `${escape(j.slice(0, -2))}(?:르|ᆯᄅ[ᅡᅥ])`;
  if (j.endsWith('하'.normalize('NFD'))) return `${head}[ᅡᅢ]`;
  const finals: Record<string, string> = { 'ᆮ': '[ᆮᆯ]', 'ᆸ': 'ᆸ?', 'ᆺ': 'ᆺ?', 'ᆯ': 'ᆯ?' };
  const vowels: Record<string, string> = { 'ᅳ': 'ᅳᅥ', 'ᅵ': 'ᅵᅧ', 'ᅩ': 'ᅩᅪ', 'ᅮ': 'ᅮᅯ', 'ᅬ': 'ᅬᅫ' };
  return finals[last] ? head + finals[last] : vowels[last] ? `${head}[${vowels[last]}]` : escape(j);
}
/** What follows a Korean verb stem: an ending that starts with ㅇ, ㄱ, ㅈ, ㄴ, ㅅ or ㅁ (-어요, -고, -지, -는, -세요, -면), a final (큰, 갑니다), or nothing. */
const HANGUL_ENDING = '(?=[ᄋᄀᄌᄂᄉᄆᆨ-ᇂ]|(?!\\p{L}))';

/** Whether the English a page word replaced is in this text. */
export function englishIn(word: TeachWord, text: string): boolean {
  return word.english.some((en) => {
    const forms = [`${escape(en)}(?:s|es|d|ed|ing)?`];
    if (en.endsWith('y')) forms.push(`${escape(en.slice(0, -1))}ie[sd]`);
    return new RegExp(`\\b(?:${forms.join('|')})\\b`, 'i').test(text);
  });
}

/** A kit word without notes like "(f.)", and the first of "vert / verte". */
const cleanWord = (w: string) => w.replace(/\([^)]*\)/g, '').split('/')[0]!.trim();

/** The page words in this section first, then others to make up the number. */
function pageWordsFor(rng: Rng, words: TeachWord[], text: string): TeachWord[] {
  const here = words.filter((w) => englishIn(w, text));
  const rest = words.filter((w) => !here.includes(w));
  const picked = rng.sample(here, PAGE_WORDS);
  return [...picked, ...rng.sample(rest, PAGE_WORDS - picked.length)];
}

export function choosePiece(job: PieceJob): PieceInput {
  const format = getFormat(job.formatId) ?? FORMATS[0]!;
  const rng = seededRng(`${job.seed}|${job.formatId}|${job.mode === 'page' ? `${job.title}|${job.focus}` : job.lesson.id}`);
  if (job.mode === 'page') {
    const context = sectionContext(job.sections, job.focus);
    const point = job.grammar.length ? rng.pick(job.grammar) : undefined;
    return {
      format,
      language: job.language,
      level: job.level,
      words: pageWordsFor(rng, job.pageWords, context.text),
      grammar: point ? [{ label: point.label, instruction: point.instruction, example: point.example }] : [],
      page: { title: job.title, context },
    };
  }
  const { kit, lesson } = job;
  const words = rng.sample(kit.themeVocab, LESSON_WORDS).map((v) => ({ target: cleanWord(v.word), english: [v.gloss] }));
  return {
    format,
    language: job.language,
    level: lesson.level,
    words: words.filter((w) => w.target),
    grammar: rng.sample(kit.points, LESSON_POINTS).map((p) => ({ label: p.label, instruction: p.instruction, example: p.example })),
    lesson: { title: lesson.title, theme: kit.theme, setting: kit.settings.length ? rng.pick(kit.settings) : '', pitfalls: kit.pitfalls },
  };
}

const wordList = (words: TeachWord[]) => words.map((w) => `${w.target} (${w.english[0] ?? ''})`).join(', ');

export function buildPiecePrompt({ format, language: L, level, words, grammar, page, lesson }: PieceInput): string {
  const source = page
    ? `<page>
Title: ${page.title}
${page.context.text}
</page>`
    : `<lesson>
Title: ${lesson!.title}
Theme: ${lesson!.theme}
Scene for this piece: ${lesson!.setting || `any everyday situation on the theme`}
</lesson>`;
  const points = grammar.length
    ? grammar.map((g) => `- ${g.label}: ${g.instruction} (e.g. "${g.example}")`).join('\n')
    : '- (none: focus on the words)';
  const pitfalls = lesson?.pitfalls.length ? `\nAvoid these mistakes:\n${lesson.pitfalls.map((p) => `- ${p}`).join('\n')}` : '';
  const task = page ? format.page(L) : format.lesson(L);
  const facts = page
    ? `- Every statement about the page's subject must be true according to the page text above. Simplify freely and leave things out, but never add facts, numbers, names, causes, reasons, opinions or comparisons the page does not give.
- Keep each fact in the tense that is true for it: general facts in the present, a past tense only for things that happened in the past. Never bend a fact to fit the grammar; if the facts can't take it in a line, use it where the format allows (a question, a reaction, a line to the reader) or leave it out of that line.
- Keep the key words of this part of the page (what it names or explains, such as its technical terms) in ${L}, even above ${level}: the reader is here to learn them. Say everything else as simply as ${level} allows.
- Never describe the text or the page ("This article explains…").`
    : `- Write about the scene and the lesson's theme only, not about any web page. People, places and events are made up, so keep them ordinary and realistic; anything said about the real world must be true.`;
  const fields = format.kind === 'lines' ? '' : `\n${QUIZ_FIELDS[format.kind](L)}`;
  const writing = writingNotesFor(L);

  return `${source}

<reader>
Learning ${L}, level ${level}.
</reader>

<grammar>
${points}${pitfalls}
</grammar>

<words>
Words to teach: ${words.length ? wordList(words) : '(none: choose useful words yourself)'}
</words>

Write a short piece in ${L} for this learner, in this format: ${format.name}.
${task}

Rules:
- Teaching the grammar matters most: use it in as many lines as ${page ? 'the facts honestly allow' : 'the piece naturally allows'}.
- Use at least three of the words to teach (all of them if there are fewer), in ways that make their meaning clear. When the format asks you to choose words, choose from the words to teach first.
${facts}
- Short sentences and everyday words for ${level}, in natural ${L} a teacher would be happy to show. Labels, names and headings inside the piece are in ${L} too.
- Use asterisks only where the format asks for them.${writing ? `\n- ${writing} This goes for ${L} quoted inside the English lines too.` : ''}
- Write only the piece itself: no comments, notes, corrections or placeholders inside it. If a line comes out wrong, leave it out.

Output exactly this and nothing else:
<title>a short ${L} title, at most 6 words || its English translation</title>
<piece>
one line of the piece per line, written: ${L} text || its English translation${fields}
</piece>`;
}

/** The text between <name> and </name>, or ''. */
export function tag(text: string, name: string): string {
  return new RegExp(`<${name}>([\\s\\S]*?)</${name}>`).exec(text)?.[1]?.trim() ?? '';
}

const nonEmpty = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean);

/** Finished lines inside <name> while the response streams: a line counts once its newline or the closing tag has arrived. */
export function streamedLines(text: string, name: string): string[] {
  const start = text.indexOf(`<${name}>`);
  if (start < 0) return [];
  const body = text.slice(start + name.length + 2);
  const close = body.indexOf(`</${name}>`);
  return nonEmpty(close >= 0 ? body.slice(0, close) : body.slice(0, body.lastIndexOf('\n') + 1));
}

function splitFields(line: string): string[] {
  return line.replace(/^`+|`+$/g, '').split('||').map((f) => f.trim());
}

/** One `text || English || extra` line; null if it has no text. */
export function parseLine(raw: string, kind: FormatKind): PieceLine | null {
  const [fr = '', en = '', extra = '', ...rest] = splitFields(raw.trim());
  if (!fr) return null;
  const t = extra.toLowerCase();
  if (t === 'true') return { kind: 'tf', fr, en, answer: true };
  if (t === 'false') return { kind: 'tf', fr, en, answer: false, ...(rest[0] ? { fix: { fr: rest[0], en: rest[1] ?? '' } } : {}) };
  if (t === 'pair') return { kind: 'pair', fr, en };
  const gap = /^gap\s*:\s*(.+)$/i.exec(extra)?.[1] ?? (kind === 'gap_fill' && extra && fr.includes('_') ? extra : '');
  if (gap && fr.includes('_')) return { kind: 'gap', fr: fr.replace(/_{2,}/, '____'), en, answer: gap.trim() };
  const answer = /^answer\s*:\s*(.+)$/i.exec(extra)?.[1];
  if (answer) {
    const options = answer.split('|').map((o) => o.trim()).filter(Boolean);
    if (options.length) return { kind: 'choice', fr, en, options, answer: options[0]! };
  }
  return { kind: 'line', fr, en };
}

/**
 * The piece from the response so far: finished lines only while it streams
 * (`final` false); the whole of it, with quiz options shuffled, once done.
 */
export function parsePiece(text: string, formatId: string, final = true): Piece {
  const kind = getFormat(formatId)?.kind ?? 'lines';
  const [fr = '', en = ''] = splitFields(tag(text, 'title'));
  const raw = final ? nonEmpty(tag(text, 'piece')) : streamedLines(text, 'piece');
  const lines = raw.map((l) => parseLine(l, kind)).filter((l): l is PieceLine => l !== null).slice(0, MAX_LINES);
  const piece: Piece = { formatId, title: { fr, en }, lines };
  if (!final) return piece;
  // Shuffled once, from the text itself, so the widget can draw it again without moving anything.
  const rng = seededRng(text);
  for (const l of piece.lines) if (l.kind === 'choice') l.options = rng.sample(l.options, l.options.length);
  const pairs = piece.lines.filter((l) => l.kind === 'pair').length;
  if (pairs) piece.shuffle = rng.sample([...Array(pairs).keys()], pairs);
  return piece;
}

/** Target-language text with readings besides the piece's own: its words, its grammar's examples, the lesson's kit. */
function readingSources(job: PieceJob, input: PieceInput): string[] {
  const kit = job.mode === 'lesson' ? [...job.kit.themeVocab.map((v) => v.word), ...job.kit.points.map((p) => p.example)] : [];
  return [...input.words.map((w) => w.target), ...input.grammar.map((g) => g.example), ...kit];
}

/**
 * The piece with readings copied into the kanji it writes without them, from the piece itself
 * first, then `extra` (see `fillReadings`): the model leaves them out of English
 * lines that quote a word, and now and then out of a bracket in a line. A piece without readings
 * is returned as it is.
 */
export function fillPieceReadings(piece: Piece, extra: string[] = []): Piece {
  const sources = [piece.title.fr, ...piece.lines.flatMap((l) => [l.fr, ...(l.kind === 'tf' && l.fix ? [l.fix.fr] : [])]), ...extra];
  if (!sources.some((s) => s.includes('《'))) return piece;
  const fill = (text: string) => fillReadings(text, sources);
  const line = (l: PieceLine): PieceLine => {
    const both = { fr: fill(l.fr), en: fill(l.en) };
    switch (l.kind) {
      case 'tf':
        return { ...l, ...both, ...(l.fix ? { fix: { fr: fill(l.fix.fr), en: fill(l.fix.en) } } : {}) };
      case 'gap':
        return { ...l, ...both, answer: fill(l.answer) };
      case 'choice':
        return { ...l, ...both, options: l.options.map(fill), answer: fill(l.answer) };
      default:
        return { ...l, ...both };
    }
  };
  return { ...piece, title: { fr: fill(piece.title.fr), en: fill(piece.title.en) }, lines: piece.lines.map(line) };
}

/**
 * A line's text for reading aloud: only what a reader would say. Drops the
 * asterisks, an interview label ("Q :", "R :", "F:", "A:"), a dialogue's
 * speaker name, asides in brackets (a part of speech, a gloss) and emoji;
 * the symbols between a word and its meaning (\u2192 \u2194 \u2248 and a spaced dash)
 * become a pause. Labels such as "Avant :" stay: they're part of the text.
 */
export function spokenText(line: { fr: string }, formatId?: string): string {
  let text = line.fr.replace(/\*/g, '').replace(/^\s*\p{Lu}{1,2}[\s\u00a0\u202f]*:\s*/u, '');
  if (formatId === 'dialogue') text = text.replace(/^\s*\p{Lu}[\p{L}'\u2019-]*(?:\s\p{Lu}[\p{L}'\u2019-]*)?[\s\u00a0\u202f]*:\s*/u, '');
  return text
    .replace(/\s*(?:\([^()]*\)|\[[^[\]]*\])/g, '')
    // Before the emoji: \u2194 is one too.
    .replace(/\s*[\u2192\u2194\u2248]\ufe0f?\s*|\s+[\u2013\u2014-]\s+/g, ', ')
    .replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\u{FE0F}\u{200D}]/gu, '')
    .replace(/\s+([,.])/g, '$1')
    .replace(/,(?=\s*[,.!?;:\u2026]|\s*$)/g, '')
    .replace(/^[\s,]+/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Roughly whether a word is in the text, in any language: its longest word,
 * with the last letter or two free for endings (chevaux for cheval, finit
 * for finir). "a / b" is either.
 */
export function wordPresent(word: string, text: string): boolean {
  const w = plainText(word).replace(/\([^)]*\)/g, '');
  if (w.includes('/')) return w.split('/').some((part) => wordPresent(part, text));
  const core = w.toLowerCase().split(/[^\p{L}\p{M}\p{N}]+/u).reduce((a, b) => (b.length >= a.length ? b : a), '');
  if (!core) return false;
  // No spaces between words: a substring, without the kana a verb or adjective ends with (食べる → 食べ).
  if (/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(core)) {
    const stem = /\p{Script=Han}/u.test(core) ? core.replace(/\p{Script=Hiragana}{1,2}$/u, '') : core;
    return plainText(text).includes(stem);
  }
  // Devanagari: the word or its plural and oblique forms, by how it ends (लड़का: लड़के, लड़कों, never लड़की).
  if (/\p{Script=Devanagari}/u.test(core)) {
    const w = core.normalize('NFC');
    const [stem, endings] = w.endsWith('ा') ? [w.slice(0, -1), 'ा|े|ों'] : w.endsWith('ी') ? [w.slice(0, -1), 'ी|ियाँ|ियां|ियों'] : [w, 'ें|ों|'];
    return new RegExp(`(?<![\\p{L}\\p{M}])${escape(stem)}(?:${endings})(?![\\p{L}\\p{M}])`, 'u').test(plainText(text).normalize('NFC'));
  }
  // Hebrew, vowel points aside: the word after the letters that join its front (הבית, בבית, ולילד), or with
  // a plural or construct ending (ילד: ילדים, ילדי; ילדה: ילדות, ילדת; שולחן: שולחנות), never ילד for ילדה.
  if (/\p{Script=Hebrew}/u.test(core)) {
    const bare = (s: string) => s.normalize('NFD').replace(/[֑-ׇֽֿׁׂׅׄ]/g, '').normalize('NFC');
    const w = bare(core);
    const last = w.slice(-1);
    const regular = HEBREW_FINALS[last];
    const [stem, endings] = /[הת]$/.test(w)
      ? [w.slice(0, -1), `${last}|ת|ות`]
      : regular
        ? [w.slice(0, -1), `${last}|${regular}(?:ים|ות|י)`]
        : [w, '|ים|י'];
    return new RegExp(`(?<![\\p{L}\\p{M}])[והבלמשכ]{0,3}${escape(stem)}(?:${endings})(?![\\p{L}\\p{M}])`, 'u').test(bare(plainText(text)));
  }
  // Arabic, vowel marks and hamza seats aside: the word after the letters and article that join its front (البيت,
  // بالبيت, وللبيت), or with a plural, dual or feminine ending and a pronoun (مدينة: مدينتنا, المدن no; معلم: معلمون, معلمة).
  if (/\p{Script=Arabic}/u.test(core)) {
    const bare = (s: string) => s.normalize('NFD').replace(/[ً-ٰٟـ]/g, '').normalize('NFC').replace(/ى/g, 'ي');
    const w = bare(core).replace(/^ال/, '');
    const [stem, endings] = w.endsWith('ة') ? [w.slice(0, -1), 'ة|ت|ات|تان|تين'] : [w, 'ة|ات|ون|ين|ان|تان|تين|ا|'];
    return new RegExp(`(?<![\\p{L}\\p{M}])${ARABIC_FRONT}${escape(stem)}(?:${endings})${ARABIC_PRONOUN}(?![\\p{L}\\p{M}])`, 'u').test(bare(plainText(text)));
  }
  // Hangul: the word with its particles (학교: 학교에서, 학교는; never 학교 in 대학교), or a verb or adjective
  // in -다 by its stem, whose last syllable changes with the ending (먹다: 먹어요; 크다: 커요, never 커피).
  if (/\p{Script=Hangul}/u.test(core)) {
    const plain = plainText(text).normalize('NFC');
    if (new RegExp(`(?<!\\p{L})${escape(core)}(?:들)?(?:${KOREAN_PARTICLES})*(?!\\p{L})`, 'u').test(plain)) return true;
    return core.length > 1 && core.endsWith('다') && new RegExp(`(?<!\\p{L})${hangulStem(core.slice(0, -1))}${HANGUL_ENDING}`, 'u').test(plain.normalize('NFD'));
  }
  const stem = core.length >= 7 ? core.slice(0, -2) : core.length >= 5 ? core.slice(0, -1) : core;
  const end = core.length >= 5 ? '' : '(?![\\p{L}\\p{M}])';
  return new RegExp(`(?<![\\p{L}\\p{M}])${escape(stem)}${end}`, 'iu').test(plainText(text));
}

export interface Completion {
  text: string;
  usd: number | null;
  /** Seconds to the first text, and to the end; the eval records them. */
  ttft?: number;
  secs?: number;
}

/** One model call; `onText` sees the text so far. */
export type Complete = (call: { system: string; user: string }, onText?: (text: string) => void) => Promise<Completion>;

export interface PieceRun extends Completion {
  input: PieceInput;
  prompt: string;
  piece: Piece;
}

/**
 * Writes one piece: the call streams lines to `onPiece` as each one finishes,
 * then the final piece. `prompt` lets the eval's variants send another prompt.
 */
export async function writePiece(
  job: PieceJob,
  complete: Complete,
  onPiece?: (piece: Piece) => void,
  prompt: (shipped: string, input: PieceInput) => string = (s) => s,
): Promise<PieceRun> {
  const input = choosePiece(job);
  const user = prompt(buildPiecePrompt(input), input);
  let shown = -1;
  const sources = readingSources(job, input);
  const onText =
    onPiece &&
    ((text: string) => {
      const partial = fillPieceReadings(parsePiece(text, job.formatId, false), sources);
      const n = partial.lines.length + Number(Boolean(partial.title.fr));
      if (n <= shown) return;
      shown = n;
      onPiece(partial);
    });
  const res = await complete({ system: PASSAGE_SYSTEM, user }, onText);
  const piece = fillPieceReadings(parsePiece(res.text, job.formatId), sources);
  onPiece?.(piece);
  return { ...res, input, prompt: user, piece };
}
