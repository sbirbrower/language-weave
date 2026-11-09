// Measures the Les bases lesson on saved pages without calling the model.
// `npm run lesson-stats` prints the table; the assertions are the plan's
// "done when" targets for what code allocates.
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { basics } from '../src/lessons/basics';
import { allocate } from '../src/lessons/allocate';
import { resolveLocal } from '../src/lessons/resolve';
import { TIERS } from '../src/lessons/types';
import { withExtras } from '../src/lessons/extras';
import { planPage } from '../src/weave/plan';
import { collectSegments, contentRoot } from '../src/weave/segment';
import { countWords } from '../src/weave/select';

const DENSITY = 0.08;
// The saved pages are kept locally, not in the repo.
const hasFixtures = existsSync('tests/fixtures');

function measure(fixture: string) {
  document.documentElement.innerHTML = readFileSync(`tests/fixtures/${fixture}.html`, 'utf8');
  const segments = collectSegments(contentRoot(document));
  const allocation = allocate(
    segments.map((s) => ({ text: s.text, candidates: basics.findCandidates(s.text) })),
    DENSITY,
    basics.caps,
  );
  const chosen = allocation.perSegment.flat();
  const split = allocation.perSegment.map((cs, i) => resolveLocal(basics, segments[i]!.text, cs));
  const byEntry = new Map<string, number>();
  for (const c of chosen) byEntry.set(c.entryId, (byEntry.get(c.entryId) ?? 0) + 1);

  return {
    words: allocation.totalWords,
    share: allocation.spent / allocation.totalWords,
    tiers: TIERS.map((t) => chosen.filter((c) => c.tier === t)),
    count: chosen.length,
    local: split.reduce((n, s) => n + s.local.length, 0),
    requests: split.filter((s) => s.remote.length > 0).length,
    segments: segments.length,
    top: [...byEntry].sort((a, b) => b[1] - a[1]).slice(0, 8),
  };
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

describe.skipIf(!hasFixtures)('Les bases on saved pages', () => {
  const results = hasFixtures ? Object.fromEntries(['pride', 'classroom', 'loire', 'whippet'].map((f) => [f, measure(f)])) : {};

  it('prints the stats', () => {
    for (const [name, r] of Object.entries(results)) {
      const tiers = r.tiers.map((cs, i) => `t${i + 1} ${pct(cs.reduce((n, c) => n + c.words, 0) / r.words)}`).join(' · ');
      process.stdout.write(
        `\n${name}: ${r.words} words → ${pct(r.share)} of ${pct(DENSITY)} (${tiers})\n` +
          `  ${r.count} replacements, ${r.local} in code; ${r.requests} of ${r.segments} segments need the model\n` +
          `  top: ${r.top.map(([id, n]) => `${id}×${n}`).join(' ')}\n`,
      );
    }
  });

  // Small words are capped per page, so the lesson alone stays under 8% and
  // page words or the top-up fill the rest.
  it('reaches the targets in the plan', () => {
    expect(results.pride!.share).toBeGreaterThanOrEqual(0.055);
    expect(results.classroom!.share).toBeGreaterThanOrEqual(0.045);
  });

  it('keeps small words to at most 40% of replacements', () => {
    for (const r of Object.values(results)) expect(r.tiers[3]!.length / r.count).toBeLessThanOrEqual(0.4);
  });

  it('caps each small word at 2 per 1000 words of page', () => {
    for (const r of Object.values(results)) {
      const cap = Math.max(1, Math.round((2 * r.words) / 1000));
      const counts = new Map<string, number>();
      for (const c of r.tiers[3]!) counts.set(c.entryId, (counts.get(c.entryId) ?? 0) + 1);
      expect(Math.max(...counts.values())).toBeLessThanOrEqual(cap);
    }
  });
});

describe.skipIf(!hasFixtures)('Les bases with easy words', () => {
  // Loading these large pages into jsdom takes a few seconds.
  it('prints how much of the density code plans as candidates', { timeout: 60_000 }, () => {
    for (const fixture of ['whippet', 'daytona', 'snow-leopard', 'star-wars', 'vitamin-c', 'pride']) {
      document.documentElement.innerHTML = readFileSync(`tests/fixtures/${fixture}.html`, 'utf8');
      const segments = collectSegments(contentRoot(document));
      const words = segments.reduce((n, s) => n + countWords(s.text), 0);
      const plans = planPage(segments, { density: DENSITY, lesson: basics, easyWords: withExtras(basics).easy, topUp: true, level: 'A1', hasKey: true });
      const sum = (f: (p: (typeof plans)[number]) => number) => plans.reduce((n, p) => n + f(p), 0);
      const lessonWords = sum((p) => p.local.reduce((n, r) => n + r.words, 0) + p.remote.filter((c) => !c.entryId.startsWith('easy:')).reduce((n, c) => n + c.words, 0));
      const easy = plans.flatMap((p) => p.remote.filter((c) => c.entryId.startsWith('easy:')));
      const topUp = sum((p) => p.topUpWords);
      const lemmas = new Map<string, number>();
      for (const c of easy) lemmas.set(c.text.toLowerCase(), (lemmas.get(c.text.toLowerCase()) ?? 0) + 1);
      process.stdout.write(
        `\n${fixture}: ${words} words · lesson ${pct(lessonWords / words)} · easy words ${pct(easy.reduce((n, c) => n + c.words, 0) / words)} (${lemmas.size} different) · left to the model's top-up ${pct(topUp / words)}\n` +
          `  easy: ${[...lemmas].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([w, n]) => `${w}×${n}`).join(' ')}\n`,
      );
    }
  });
});
