import { writingNotesFor } from '../languages';
import type { Noul } from '../marks/jev';
import { withoutReadings } from '../ruby';
import type { Prompt, Step } from './types';

/**
 * A hint for the exercise on screen, shown when the reader asks for one: a
 * nudge towards the answer that doesn't give it away. Haiku writes it while
 * the exercise is shown, so the click shows it at once; code drops one that
 * quotes the answer, and with a TypeSafe key Jev drops one that gives it away
 * or leads elsewhere. Pairs and conversations have none: a wrong tap there
 * already shows what's wrong.
 */

/** Haiku with thinking off: about a second, written before it's asked for. */
export const HINT_MODEL = { model: 'claude-haiku-5-5', effort: 'default', thinking: 'off' } as const;

/** Byte-stable; the exercise is in the user message. */
export const HINT_SYSTEM = 'You write hints for language-learning exercises. Follow the instructions exactly.';

/** Jev's chances multiplied (`jevHintQuestions`); a hint below it is dropped. Not yet tuned by an eval. */
export const HINT_THRESHOLD = 0.4;

export const hasHint = (step: Step) => !step.drill && step.kind !== 'pairs' && step.kind !== 'dialogue' && step.kind !== 'speak';

function promptText(p: Prompt): string[] {
  return [
    p.question && `Question: ${p.question}`,
    p.message && `Message from ${p.message.from || 'someone'}:\n${p.message.lines.map((l) => `  ${l.text}`).join('\n')}`,
    p.text && `Text: ${p.text}`,
    p.audio && `Heard (audio): ${p.audio}`,
  ].filter((x): x is string => Boolean(x));
}

/** The exercise as the hint writer and Jev see it: what's shown, and the right answer. */
export function describeExercise(step: Step): { exercise: string; answer: string } {
  const head = [`Instruction: ${step.instruction}`];
  switch (step.kind) {
    case 'choice':
      return {
        exercise: [...head, ...promptText(step.prompt), `Options: ${step.options.map((o) => o.text || o.emoji).join(' | ')}`].join('\n'),
        answer: `${step.options[step.answer]!.text || step.options[step.answer]!.emoji}. ${step.why}`,
      };
    case 'label':
      return {
        exercise: [...head, ...promptText(step.prompt), `Labels: ${step.labels.map((l) => l.text || l.emoji).join(' | ')}`, ...step.items.map((it, i) => `Item ${i + 1}: ${it.text}`)].join('\n'),
        answer: step.items.map((it, i) => `Item ${i + 1}: ${step.labels[it.label]!.text || step.labels[it.label]!.emoji}`).join('; ') + `. ${step.why}`,
      };
    case 'order':
      return {
        exercise: [...head, ...promptText(step.prompt), `Tiles to put in order: ${step.tiles.join(' | ')}`].join('\n'),
        answer: `${step.full.map((l) => l.text).join(' ')}. ${step.why}`,
      };
    case 'tap': {
      const lines = step.lines.map((l, i) => `Line ${i + 1}: ${l.speaker ? `${l.speaker}: ` : ''}${l.text}`);
      return {
        exercise: [...head, ...promptText(step.prompt), ...(step.insert ? [`Line to place: ${step.insert.text}`] : []), ...lines].join('\n'),
        answer: `${step.gaps ? (step.answer ? `After line ${step.answer}` : 'Before line 1') : `Line ${step.answer + 1}: ${step.lines[step.answer]!.text}`}. ${step.why}`,
      };
    }
    case 'proofread':
      return {
        exercise: [...head, ...promptText(step.prompt), `Paragraph: ${step.tokens.map((t) => t.text).join('')}`].join('\n'),
        answer: step.errors.map((e) => `${e.fix ? `${e.text} → ${e.fix}` : e.text} (${e.why})`).join('; '),
      };
    case 'fix':
      return {
        exercise: [...head, ...promptText(step.prompt), `Text: ${step.chunks.join(step.layout === 'list' ? '\n' : ' ')}`, `Replacements: ${step.options.join(' | ')}`].join('\n'),
        answer: `The wrong part is "${step.chunks[step.wrong]}"; it becomes "${step.options[step.answer]}". ${step.why}`,
      };
    default:
      return { exercise: head.join('\n'), answer: '' };
  }
}

/** What a hint must not quote: the right option, sentence, line or fix. */
function answerTexts(step: Step): string[] {
  switch (step.kind) {
    case 'choice':
      return [step.options[step.answer]!.text];
    case 'order':
      return step.full.map((l) => l.text);
    case 'tap':
      return step.gaps ? [] : [step.lines[step.answer]!.text];
    case 'proofread':
      return step.errors.map((e) => e.fix || e.text);
    case 'fix':
      return [step.options[step.answer]!];
    default:
      return [];
  }
}

const normal = (s: string) => ` ${withoutReadings(s).replace(/\*/g, '').toLowerCase().replace(/[\p{P}\s]+/gu, ' ').trim()} `;

/** Whether the hint quotes the answer: as a whole word in a spaced script, anywhere in one without spaces. */
export function quotesAnswer(step: Step, hint: string): boolean {
  const h = normal(hint);
  return answerTexts(step).some((a) => {
    const n = normal(a);
    if (!n.trim()) return false;
    // Japanese has no spaces between words, and Korean joins particles to them: a substring, but not a single kana or syllable, which turns up everywhere.
    if (/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(n)) return n.trim().length > 1 && h.includes(n.trim());
    // Arabic joins و, ف, ب, ك and ل to the next word (البيت in بالبيت), so the answer may have one or two in front.
    if (/\p{Script=Arabic}/u.test(n)) return new RegExp(`(?<![\\p{L}\\p{M}])[وفبكل]{0,2}${n.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{M}])`, 'u').test(h);
    return h.includes(n);
  });
}

export function buildHintPrompt(step: Step, language: string, level: string): string {
  const L = language;
  const { exercise, answer } = describeExercise(step);
  const writing = writingNotesFor(L);
  return `<exercise>
${exercise}
</exercise>

<answer>
${answer}
</answer>

Write one hint for an English-speaking learner of ${L} at ${level} who is stuck on this exercise. It nudges them towards the answer without giving it away:
- Point at what to notice: the rule that decides it, what a word means, a clue in the text, or what to rule out.
- Never state, quote, translate or spell out the answer, and never say which option, tile, line or word is right.
- It leads to the answer above, never away from it.
- One or two short English sentences, at most 25 words. Put any ${L} words in *asterisks*. No other Markdown.${writing ? `\n- ${writing}` : ''}

Output the hint and nothing else.`;
}

/** The hint from Haiku's text; null if there's none or it's too long to be one. */
export function parseHint(text: string): string | null {
  const hint = text
    .trim()
    .split(/\n\s*\n/)[0]!
    .replace(/^(hint:\s*)/i, '')
    .replace(/^["“]|["”]$/g, '')
    .trim();
  return hint && hint.length <= 300 ? hint : null;
}

/** Does the hint keep the answer hidden, and does it lead to it? Their product is the chance it's good. */
export function jevHintQuestions(): Record<string, Noul> {
  return {
    hides: {
      type: 'noul',
      instructions: 'The hint does not give the answer away.',
      criteria: {
        true: 'It points at a rule, a meaning or a clue, and the learner still has to work out the answer.',
        false: 'It states, quotes or translates the answer, or says which option, tile, line or word is right.',
      },
    },
    leads: {
      type: 'noul',
      instructions: 'The hint is true and leads towards the answer.',
      criteria: { true: 'Following it gets the learner to the answer.', false: 'It is wrong, or points towards a wrong answer.' },
    },
  };
}

/** What Jev sees for one hint. */
export function jevHintState(step: Step, hint: string) {
  const { exercise, answer } = describeExercise(step);
  return { exercise: withoutReadings(exercise), answer: withoutReadings(answer), hint: withoutReadings(hint) };
}
