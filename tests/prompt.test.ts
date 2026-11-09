import { describe, expect, it } from 'vitest';
import { fr } from '../src/languages/fr';
import { parseLines } from '../src/weave/parse';
import { basics } from '../src/lessons/basics';
import { buildLessonPrompt, buildSystemPrompt, buildUserPrompt } from '../src/weave/prompt';

describe('buildSystemPrompt', () => {
  const system = buildSystemPrompt(fr);

  it('is stable across calls so it can be cached', () => {
    expect(buildSystemPrompt(fr)).toBe(system);
  });

  it("leaves the reader's level to the request", () => {
    expect(system).not.toMatch(/\b(A1|A2|B1|B2)\b/);
  });

  it('includes the language grammar notes', () => {
    expect(system).toContain(fr.grammarNotes);
  });

  it('has example lines that parse and locate in the example passage', () => {
    const examples = parseLines(system).filter((l) => l.original !== 'original span');
    expect(examples.map((l) => l.lemma)).toEqual(['orée', 'se méfier']);
    const passage = system.match(/the passage "(.+?)":/)![1]!;
    for (const l of examples) expect(passage).toContain(l.original);
  });
});

describe('buildUserPrompt', () => {
  it('puts the passage last and omits empty lists', () => {
    const user = buildUserPrompt({ passage: 'Some text.', targetWords: 3 });
    expect(user).toMatch(/about 3 English words/);
    expect(user).not.toContain('Reuse');
    expect(user.endsWith('<passage>\nSome text.\n</passage>')).toBe(true);
  });

  it('adds priority and exclusion lists', () => {
    const user = buildUserPrompt({ passage: 'x', targetWords: 1, priority: ['orée'], exclude: ['chien'] });
    expect(user).toContain('1 English word in total');
    expect(user).toContain('Reuse these lemmas where they fit naturally: orée');
    expect(user).toContain('Never use these lemmas: chien');
  });
});

describe('buildLessonPrompt', () => {
  it('lists candidates with occurrence and lemma, then the passage', () => {
    const passage = 'She said hello and said goodbye.';
    const remote = basics.findCandidates(passage).filter((c) => !basics.resolveLocally(c, passage));
    const user = buildLessonPrompt({ passage, lesson: basics, candidates: remote });
    expect(user.startsWith(basics.promptFragment)).toBe(true);
    expect(user).toContain('1. "said" (1st occurrence) → dire');
    expect(user).toContain('3. "said" (2nd occurrence) → dire');
    expect(user).toContain('"goodbye" (1st occurrence) → au revoir [lemma: au revoir or adieu]');
    expect(user.endsWith(`<passage>\n${passage}\n</passage>`)).toBe(true);
  });
});

describe('lesson vocabulary in the system prompt', () => {
  it('appends the list only when asked, and stays stable', () => {
    const base = buildSystemPrompt(fr);
    const withList = buildSystemPrompt(fr, basics);
    expect(withList.startsWith(base)).toBe(true);
    expect(withList).toContain('chien (dog)');
    expect(buildSystemPrompt(fr, basics)).toBe(withList);
    expect(buildSystemPrompt(fr, {})).toBe(base);
  });
});
