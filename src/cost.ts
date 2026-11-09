import type { Effort } from './settings';

/** USD per million tokens. */
export interface Price {
  input: number;
  output: number;
  /** Defaults to 10% of input. */
  cacheRead?: number;
}

// List prices: Anthropic as of 2026-10. The API doesn't return prices, so this
// table needs updating when they change; unknown models show "cost unknown".
const PRICES: Record<string, Price> = {
  'claude-fable-5-1': { input: 10, output: 50, cacheRead: 0.25 },
  'claude-mythos-5-1': { input: 10, output: 50, cacheRead: 0.25 },
  'claude-fable-5': { input: 10, output: 50 },
  'claude-opus-5-5': { input: 4, output: 20, cacheRead: 0.2 },
  'claude-opus-5': { input: 5, output: 25 },
  'claude-opus-4-8': { input: 5, output: 25 },
  'claude-opus-4-7': { input: 5, output: 25 },
  'claude-opus-4-6': { input: 5, output: 25 },
  'claude-sonnet-5-5': { input: 2, output: 10, cacheRead: 0.2 },
  'claude-sonnet-5': { input: 2, output: 10 },
  'claude-sonnet-4-6': { input: 3, output: 15 },
  'claude-haiku-5-5': { input: 0.1, output: 0.5 },
  'claude-haiku-4-5': { input: 1, output: 5 },
  // OpenAI and Gemini, as of 2026-11: the models `src/providers/route.ts` picks and their neighbours.
  'gpt-6-astra': { input: 10, output: 50, cacheRead: 1 },
  'gpt-6.1-sol': { input: 2, output: 10, cacheRead: 0.1 },
  'gpt-6.1-terra': { input: 1, output: 5, cacheRead: 0.05 },
  'gpt-6-sol': { input: 2, output: 10, cacheRead: 0.2 },
  'gpt-6-luna': { input: 0.1, output: 0.5, cacheRead: 0.01 },
  // Gemini 4 Argon doubles on 2026-12-01, Gemini 3.8 and 3.6 Flash on 2027-01-01.
  'gemini-4-argon': { input: 2, output: 10, cacheRead: 0.1 },
  'gemini-3.8-flash': { input: 0.75, output: 3.75, cacheRead: 0.075 },
  'gemini-3.6-flash': { input: 0.75, output: 3.75, cacheRead: 0.075 },
  'gemini-3.5-flash-lite': { input: 0.3, output: 2.5, cacheRead: 0.03 },
};

/** Looks up a model's price, ignoring a trailing date snapshot (`-20251001`). */
export function priceFor(model: string): Price | undefined {
  return PRICES[model] ?? PRICES[model.replace(/-\d{8}$/, '')];
}

export interface TokenUsage {
  /** Uncached input tokens. */
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

const CACHE_WRITE_MULTIPLIER = 1.25;

export function usageCost(u: TokenUsage, p: Price): number {
  const cacheRead = p.cacheRead ?? p.input * 0.1;
  return (
    (u.input * p.input + u.cacheWrite * p.input * CACHE_WRITE_MULTIPLIER + u.cacheRead * cacheRead + u.output * p.output) /
    1_000_000
  );
}

// Rough sizes until calibration from real responses takes over. Thinking is
// the big unknown: the current models can't turn it off, only lower effort.
const CHARS_PER_TOKEN = 3.5;
const THINKING_TOKENS: Record<Effort, number> = { low: 300, medium: 1000, high: 2500, default: 1000 };
const TOKENS_PER_LINE = 30;

export interface RequestEstimate {
  input: number;
  output: number;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/** Tokens for one weave request, before calibration. `thinks` = false when thinking is turned off. */
export function estimateRequest(system: string, user: string, lines: number, effort: Effort, thinks = true): RequestEstimate {
  return {
    input: estimateTokens(system) + estimateTokens(user),
    output: (thinks ? THINKING_TOKENS[effort] : 0) + lines * TOKENS_PER_LINE,
  };
}

/** Running totals of estimated vs actual tokens, per model and effort. */
export interface Calibration {
  requests: number;
  estimatedInput: number;
  estimatedOutput: number;
  actualInput: number;
  actualOutput: number;
}

export const MIN_CALIBRATION_REQUESTS = 5;

const clampRatio = (r: number) => Math.min(4, Math.max(0.25, r));

/** Scales an estimate by how far past estimates were off, once there are enough samples. */
export function calibrate(e: RequestEstimate, c: Calibration | undefined): RequestEstimate {
  if (!c || c.requests < MIN_CALIBRATION_REQUESTS || !c.estimatedInput || !c.estimatedOutput) return e;
  return {
    input: Math.round(e.input * clampRatio(c.actualInput / c.estimatedInput)),
    output: Math.round(e.output * clampRatio(c.actualOutput / c.estimatedOutput)),
  };
}

export function addToCalibration(c: Calibration | undefined, e: RequestEstimate, u: TokenUsage): Calibration {
  const base = c ?? { requests: 0, estimatedInput: 0, estimatedOutput: 0, actualInput: 0, actualOutput: 0 };
  return {
    requests: base.requests + 1,
    estimatedInput: base.estimatedInput + e.input,
    estimatedOutput: base.estimatedOutput + e.output,
    actualInput: base.actualInput + u.input + u.cacheRead + u.cacheWrite,
    actualOutput: base.actualOutput + u.output,
  };
}

export interface PageEstimate {
  requests: number;
  inputTokens: number;
  outputTokens: number;
  /** Null when the model's price isn't known. */
  usd: number | null;
  calibrated: boolean;
}

export function sumEstimates(reqs: RequestEstimate[], price: Price | undefined, calibrated: boolean): PageEstimate {
  const inputTokens = reqs.reduce((n, r) => n + r.input, 0);
  const outputTokens = reqs.reduce((n, r) => n + r.output, 0);
  return {
    requests: reqs.length,
    inputTokens,
    outputTokens,
    usd: price ? usageCost({ input: inputTokens, output: outputTokens, cacheRead: 0, cacheWrite: 0 }, price) : null,
    calibrated,
  };
}

export function formatUsd(usd: number): string {
  if (usd === 0) return '$0';
  if (usd < 0.01) return '<$0.01';
  return `$${usd < 10 ? usd.toFixed(2) : usd.toFixed(0)}`;
}

/** USD spent per local day (`YYYY-MM-DD`), kept for the last `SPEND_DAYS` days. */
export type DailySpend = Record<string, number>;
export const SPEND_KEY = 'spendByDay';
const SPEND_DAYS = 30;

export function dayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Adds `usd` to `day`, dropping the oldest days past `SPEND_DAYS`. */
export function addSpend(spend: DailySpend | undefined, day: string, usd: number): DailySpend {
  const next: DailySpend = { ...spend, [day]: (spend?.[day] ?? 0) + usd };
  const keep = Object.keys(next).sort().slice(-SPEND_DAYS);
  return Object.fromEntries(keep.map((d) => [d, next[d]!]));
}
