import { beforeEach, describe, expect, it } from 'vitest';
import { fr } from '../src/languages/fr';
import { basics } from '../src/lessons/basics';
import { estimatePlan, planPage } from '../src/weave/plan';
import { levelNote } from '../src/weave/prompt';
import { collectSegments } from '../src/weave/segment';

const html = `
  <p>There were twelve boats on the river and the teacher said it was very cold, but nobody listened to her at all that day.</p>
  <p>The village sits at the edge of the forest, and its inhabitants were wary of strangers who came through in the night.</p>`;

beforeEach(() => {
  document.body.innerHTML = html;
});

const segments = () => collectSegments(document.body);
const estimateOpts = { lang: fr, model: 'claude-opus-5-5', effort: 'low' as const, thinks: true };

describe('planPage', () => {
  it('plans one general request per segment with a budget', () => {
    const plans = planPage(segments(), { density: 0.1, topUp: false, level: 'A1', hasKey: true });
    expect(plans.map((p) => p.requests.map((r) => r.kind))).toEqual([['general'], ['general']]);
    expect(plans.map((p) => p.generalBudget)).toEqual([2, 2]);
  });

  it("asks the general weave for the reader's level, with or without a lesson", () => {
    // Without its own vocabulary, a lesson's top-up is a general request.
    for (const lesson of [undefined, { ...basics, topUpVocabulary: undefined }]) {
      const a1 = planPage(segments(), { density: 0.2, lesson, topUp: true, level: 'A1', hasKey: true });
      const b2 = planPage(segments(), { density: 0.2, lesson, topUp: true, level: 'B2', hasKey: true });
      const general = (plans: typeof a1) => plans.flatMap((p) => p.requests).filter((r) => r.kind === 'general');
      expect(general(a1).length).toBeGreaterThan(0);
      for (const r of general(a1)) expect(r).toMatchObject({ levelNote: levelNote('A1'), user: expect.stringContaining(levelNote('A1')) });
      for (const r of general(b2)) expect(r).toMatchObject({ levelNote: levelNote('B2'), user: expect.stringContaining(levelNote('B2')) });
    }
  });

  it('lets a general request take what earlier segments fell short on', () => {
    const general = planPage(segments(), { density: 0.1, topUp: false, level: 'B1', hasKey: true });
    expect(general.every((p) => p.canCarry)).toBe(true);
    const topUp = planPage(segments(), { density: 0.2, lesson: { ...basics, topUpVocabulary: undefined }, topUp: true, level: 'B1', hasKey: true });
    for (const p of topUp) expect(p.canCarry).toBe(p.generalBudget > 0);
    expect(topUp.some((p) => p.canCarry)).toBe(true);
    expect(planPage(segments(), { density: 0.1, topUp: false, level: 'B1', hasKey: false }).some((p) => p.canCarry)).toBe(false);
  });

  it('plans no requests without a key', () => {
    const plans = planPage(segments(), { density: 0.1, topUp: false, level: 'A1', hasKey: false });
    expect(plans.flatMap((p) => p.requests)).toEqual([]);
    expect(estimatePlan(plans, estimateOpts)).toMatchObject({ requests: 0, usd: 0 });
  });

  it('writes lesson words in code and asks the model only for the rest', () => {
    const plans = planPage(segments(), { density: 0.08, lesson: basics, topUp: false, level: 'A1', hasKey: true });
    const first = plans[0]!;
    expect(first.local.map((r) => r.replacement)).toContain('douze');
    expect(first.remote.map((c) => c.text)).toEqual(['teacher', 'listened']);
    expect(first.requests).toMatchObject([{ kind: 'lesson', lines: 2 }]);
    expect(first.requests[0]!.user).toContain('"teacher" (1st occurrence)');
  });

  it('asks for the top-up in the same request as the lesson words', () => {
    // At 20% the lesson's words run out before the budget does.
    const plans = planPage(segments(), { density: 0.2, lesson: basics, topUp: true, level: 'A1', hasKey: true });
    expect(plans.every((p) => p.requests.length === 1 && p.requests[0]!.kind === 'lesson')).toBe(true);
    expect(plans.some((p) => p.topUpWords > 0)).toBe(true);
    const first = plans.find((p) => p.topUpWords > 0)!.requests[0]!;
    expect(first.vocabulary).toBe(true);
    expect(first.user).toContain('more English words');
    expect(first.user).toContain('Already woven, leave these alone: "twelve"');

    const without = planPage(segments(), { density: 0.2, lesson: basics, topUp: false, level: 'A1', hasKey: true });
    expect(without.every((p) => p.topUpWords === 0 && p.requests.every((r) => !r.vocabulary))).toBe(true);
    expect(without[0]!.requests[0]!.user).toContain('Replace nothing else.');
  });
});

describe('estimatePlan', () => {
  it('prices the planned requests', () => {
    const plans = planPage(segments(), { density: 0.1, topUp: false, level: 'A1', hasKey: true });
    const e = estimatePlan(plans, estimateOpts);
    expect(e.requests).toBe(2);
    expect(e.usd).toBeGreaterThan(0);
    expect(e.usd).toBeLessThan(0.05);
    expect(estimatePlan(plans, { ...estimateOpts, model: 'claude-haiku-5-5' }).usd).toBeLessThan(e.usd! / 10);
    expect(estimatePlan(plans, { ...estimateOpts, model: 'unknown' }).usd).toBeNull();
  });

  it('expects far less output with thinking off', () => {
    const plans = planPage(segments(), { density: 0.1, topUp: false, level: 'A1', hasKey: true });
    const on = estimatePlan(plans, estimateOpts);
    const off = estimatePlan(plans, { ...estimateOpts, thinks: false });
    expect(off.outputTokens).toBeLessThan(on.outputTokens / 3);
  });

  it('prices the vocabulary in the system prompt', () => {
    const withVocab = planPage(segments(), { density: 0.2, lesson: basics, topUp: true, level: 'A1', hasKey: true });
    const withoutVocab = planPage(segments(), { density: 0.2, lesson: basics, topUp: false, level: 'A1', hasKey: true });
    expect(estimatePlan(withVocab, { ...estimateOpts, lesson: basics }).inputTokens).toBeGreaterThan(
      estimatePlan(withoutVocab, { ...estimateOpts, lesson: basics }).inputTokens + 1000,
    );
  });
});
