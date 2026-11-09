import { sentenceAround } from './check';
import type { MarkJob, PlacedMark } from './prompt';

/**
 * TypeSafe's Jev (https://docs.typesafe.ai): a classifier that answers typed
 * questions about a `state` with probabilities, and writes no text. It's the
 * first check on each mark: about 0.15s, and it decides most marks alone
 * (`JEV_BAND`); the rest go to a lenient Sonnet check.
 */

const ENDPOINT = 'https://api.typesafe.ai/v1/systemone';
/** Pinned, so a new release doesn't move the band without an eval. */
export const JEV_MODEL = 'jev-1.14.0';
/** Dollars per million input tokens; output is free (docs.typesafe.ai/models). */
export const JEV_PRICE_PER_MTOK = 0.042;
/** Below `lo` a mark is dropped, from `hi` up it's kept; between, the model check decides (`npm run eval -- check`). */
export const JEV_BAND = { lo: 0.2, hi: 0.6 } as const;

export interface Noul {
  type: 'noul';
  instructions: string;
  criteria?: { true: string; false: string };
}

export interface JevAnswer {
  type: string;
  noul?: number;
  choice?: string;
  confidence?: number;
  probabilities?: Record<string, number>;
}

export interface JevResult {
  answers: Record<string, JevAnswer>;
  model: string;
  inputTokens: number;
  usd: number;
  secs: number;
}

/** Is the gloss true to the English, and is it correct? Their product is the chance the mark is good. */
export function jevQuestions(job: MarkJob): Record<string, Noul> {
  const L = job.language;
  return {
    meaning: {
      type: 'noul',
      instructions: `The ${L} translation says what the marked English says in this sentence: the same meaning, in the same tense and the same person, with nothing added.`,
      criteria: {
        true: `The ${L} is true to the marked English. Translating only part of the marked English, or simpler wording that stays true, counts as yes.`,
        false: `The ${L} changes the meaning, the tense or the person, adds something the English doesn't say, or translates words into something else.`,
      },
    },
    correct: {
      type: 'noul',
      instructions: `The ${L} translation is correct, natural ${L}.`,
      criteria: {
        true: `Correct gender, agreement and verb forms, and words a ${L} speaker would use.`,
        false: `A wrong gender, agreement or verb form, or words that aren't natural ${L}.`,
      },
    },
  };
}

/** What Jev sees for one mark: its sentence (or paragraph), the English and the gloss. */
export const jevState =
  (context: 'sentence' | 'paragraph' = 'sentence') =>
  (job: MarkJob, m: PlacedMark) => ({
    [context]: context === 'sentence' ? sentenceAround(job.paragraphs[m.at]!, m.start, m.end) : job.paragraphs[m.at],
    marked_english: m.english,
    translation_language: job.language,
    translation: m.target,
  });

/** The chance a mark is good: every answer's `noul` multiplied. */
export const jevProbability = (answers: Record<string, JevAnswer>) => Object.values(answers).reduce((n, a) => n * (a.noul ?? 0), 1);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** One request; retried with backoff on 429 and 529, as the docs ask. `secs` is the successful attempt's. */
export async function askJev(key: string, model: string, state: unknown, questions: Record<string, Noul>, fetcher: typeof fetch = fetch): Promise<JevResult> {
  for (let attempt = 0; ; attempt++) {
    const started = performance.now();
    const res = await fetcher(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, state, questions }),
    });
    if ((res.status === 429 || res.status === 529) && attempt < 5) {
      await sleep(500 * 2 ** attempt);
      continue;
    }
    if (!res.ok) throw new Error(`Jev ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const body = (await res.json()) as { model: string; answers: Record<string, JevAnswer>; usage?: { input_tokens?: number } };
    const inputTokens = body.usage?.input_tokens ?? 0;
    return { answers: body.answers, model: body.model, inputTokens, usd: (inputTokens / 1e6) * JEV_PRICE_PER_MTOK, secs: (performance.now() - started) / 1000 };
  }
}
