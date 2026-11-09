import { describe, expect, it } from 'vitest';
import { addSpend } from '@/src/cost';
import {
  addToCalibration,
  calibrate,
  estimateRequest,
  formatUsd,
  priceFor,
  sumEstimates,
  usageCost,
  type Calibration,
} from '../src/cost';

describe('priceFor', () => {
  it('finds current models and ignores date snapshots', () => {
    expect(priceFor('claude-opus-5-5')).toMatchObject({ input: 4, output: 20 });
    expect(priceFor('claude-haiku-4-5-20251001')).toMatchObject({ input: 1, output: 5 });
    expect(priceFor('gpt-something')).toBeUndefined();
  });
});

describe('usageCost', () => {
  it('prices input, output and cache tokens', () => {
    const price = { input: 4, output: 20, cacheRead: 0.2 };
    expect(usageCost({ input: 1_000_000, output: 0, cacheRead: 0, cacheWrite: 0 }, price)).toBe(4);
    expect(usageCost({ input: 0, output: 100_000, cacheRead: 0, cacheWrite: 0 }, price)).toBe(2);
    expect(usageCost({ input: 0, output: 0, cacheRead: 1_000_000, cacheWrite: 1_000_000 }, price)).toBe(0.2 + 5);
  });

  it('defaults cache reads to 10% of input', () => {
    expect(usageCost({ input: 0, output: 0, cacheRead: 1_000_000, cacheWrite: 0 }, { input: 2, output: 10 })).toBeCloseTo(0.2);
  });
});

describe('estimates', () => {
  it('sizes prompts and adds thinking by effort', () => {
    const e = estimateRequest('x'.repeat(350), 'y'.repeat(70), 2, 'low');
    expect(e).toEqual({ input: 120, output: 300 + 60 });
    expect(estimateRequest('', '', 0, 'high').output).toBeGreaterThan(estimateRequest('', '', 0, 'low').output);
  });

  it('calibrates only after enough requests, within limits', () => {
    const e = { input: 1000, output: 500 };
    let c: Calibration | undefined;
    for (let i = 0; i < 4; i++) c = addToCalibration(c, e, { input: 800, output: 1500, cacheRead: 200, cacheWrite: 0 });
    expect(calibrate(e, c)).toEqual(e);
    c = addToCalibration(c, e, { input: 800, output: 1500, cacheRead: 200, cacheWrite: 0 });
    expect(calibrate(e, c)).toEqual({ input: 1000, output: 1500 });

    const wild = addToCalibration({ ...c, requests: 10 }, e, { input: 0, output: 1_000_000, cacheRead: 0, cacheWrite: 0 });
    expect(calibrate(e, wild).output).toBe(2000); // clamped at 4×
  });

  it('sums a page and prices it', () => {
    const page = sumEstimates([{ input: 1000, output: 500 }, { input: 1000, output: 500 }], { input: 4, output: 20 }, false);
    expect(page).toMatchObject({ requests: 2, inputTokens: 2000, outputTokens: 1000 });
    expect(page.usd).toBeCloseTo(0.008 + 0.02);
    expect(sumEstimates([{ input: 1, output: 1 }], undefined, false).usd).toBeNull();
  });
});

describe('formatUsd', () => {
  it('rounds for display', () => {
    expect([0, 0.004, 0.123, 2.9, 14.6].map(formatUsd)).toEqual(['$0', '<$0.01', '$0.12', '$2.90', '$15']);
  });
});

describe('addSpend', () => {
  it('adds to the day and keeps the last 30 days', () => {
    expect(addSpend({ '2026-11-08': 0.5 }, '2026-11-08', 0.25)).toEqual({ '2026-11-08': 0.75 });
    const month = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`2026-10-${String(i + 1).padStart(2, '0')}`, 1]));
    const next = addSpend(month, '2026-11-01', 2);
    expect(Object.keys(next)).toHaveLength(30);
    expect(next['2026-10-01']).toBeUndefined();
    expect(next['2026-11-01']).toBe(2);
  });
});
