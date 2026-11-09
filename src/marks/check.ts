import type { MarkJob, PlacedMark } from './prompt';

/**
 * The check on each mark: a model drops a mark whose target language doesn't
 * say what its English says (another tense or person, added facts) or has a
 * clear grammar mistake. Keep or drop only: it doesn't fix marks or judge the
 * lesson point, which it did badly (evals/out/mark*.md). One call per mark, as
 * each one streams in, so marks show one by one. With a TypeSafe key, Jev
 * (`./jev.ts`) decides first and this sees only the marks it isn't sure of.
 */

/** Haiku with thinking off: about a second per mark. The check when there's no Jev key. */
export const CHECK_MODEL = { model: 'claude-haiku-5-5', effort: 'default', thinking: 'off' } as const;
/** After Jev, for the marks it isn't sure of (`JEV_BAND`): Sonnet, told to drop only what's clearly wrong. */
export const LENIENT_CHECK_MODEL = { model: 'claude-sonnet-5-5', effort: 'default', thinking: 'off' } as const;

/** Byte-stable; the marks are in the user message. */
export const CHECK_SYSTEM = 'You check annotations for language learners. Follow the instructions exactly.';

export type Verdict = { kind: 'keep' } | { kind: 'fix'; target: string; reason: string } | { kind: 'drop'; reason: string };

/** The sentence a mark sits in, so the checker can tell what the English means there. */
export function sentenceAround(text: string, start: number, end: number): string {
  const before = text.slice(0, start);
  const from = Math.max(before.search(/[.!?]\s+[^.!?]*$/) + 1, 0);
  const after = text.slice(end).search(/[.!?](\s|$)/);
  return text.slice(from, after < 0 ? text.length : end + after + 1).trim();
}

/**
 * `lenient` drops only a mark that clearly fails, keeping a partial or plainer
 * one: Sonnet with the strict wording dropped 24 of 82 good marks.
 */
export function buildCheckPrompt(job: MarkJob, marks: PlacedMark[], opts: { lenient?: boolean } = {}): string {
  const L = job.language;
  const list = marks.map(
    (m, i) => `[${i + 1}] Sentence: ${sentenceAround(job.paragraphs[m.at]!, m.start, m.end)}
    English: ${m.english}
    ${L}: ${m.target}`,
  );
  return `An English speaker learning ${L} (${job.lesson.level}) is reading an English web page. Each mark below shows the ${L} for part of an English sentence on the page. Check each mark:
1. Meaning: the ${L} says what the marked English says in that sentence, in the same tense and person, adding nothing. Translating only part of the English is fine, and so is simple wording for a beginner, as long as what it says is true to the English.
2. Mistakes: the ${L} has no clear grammar mistake (wrong gender, agreement or verb form).
${opts.lenient ? 'Drop a mark only when it fails one of these clearly. Keep everything else: a translation of part of the English, a missing detail, plainer words, or a different word that means the same here.' : 'Keep a mark that passes both; drop one that fails either.'} Don't judge anything else.

Answer one line per mark, in order, and nothing else:
number || keep
number || drop || why, in a few words

<marks>
${list.join('\n')}
</marks>`;
}

/** Verdicts by mark index (0-based); a mark with no line is kept. */
export function parseVerdicts(text: string): Map<number, Verdict> {
  const out = new Map<number, Verdict>();
  for (const raw of text.split(/\r?\n/)) {
    const fields = raw.trim().replace(/^[-*•]\s+/, '').split('||').map((f) => f.trim());
    const n = Number(fields[0]?.replace(/[^\d]/g, ''));
    const kind = fields[1]?.toLowerCase();
    if (!n) continue;
    if (kind === 'keep') out.set(n - 1, { kind: 'keep' });
    else if (kind === 'fix' && fields[2]) out.set(n - 1, { kind: 'fix', target: fields[2], reason: fields[3] ?? '' });
    else if (kind === 'drop') out.set(n - 1, { kind: 'drop', reason: fields.slice(2).join(' ') });
  }
  return out;
}
