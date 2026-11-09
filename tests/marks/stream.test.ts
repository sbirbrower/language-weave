import { describe, expect, it } from 'vitest';
import { fr } from '../../src/languages/fr';
import { buildCheckPrompt, parseVerdicts, sentenceAround } from '../../src/marks/check';
import type { MarkJob } from '../../src/marks/prompt';
import { markSection, type MarkCalls, type ShownMark } from '../../src/marks/stream';
import { getSyllabusLesson } from '../../src/syllabus';

const lesson = getSyllabusLesson('fr-a2-passe-compose')!;
const PARAS = ['They departed at noon. Sir William stayed only a week.', 'The family returned home.'];
const job: MarkJob = { language: fr.displayName, lesson, kit: null, title: 'Pride', heading: '', paragraphs: PARAS };

const LINES = [
  '1 || They departed || Ils sont partis || 2 || partir takes être',
  '1 || Sir William stayed only a week || Sir William est resté une semaine || 2 || rester takes être',
  '2 || The family returned || La famille a mangé || 1 || made up',
];

describe('the check', () => {
  it('gives each mark its sentence, in the lesson’s language', () => {
    const p = buildCheckPrompt(job, [{ para: 1, at: 0, start: 23, end: 53, english: 'Sir William stayed only a week', target: 'x', point: 2, note: '' }]);
    expect(p).toContain('learning French (CEFR A2)');
    expect(p).toContain('Sentence: Sir William stayed only a week.');
    expect(p).toContain('number || drop || why');
  });

  it('finds the sentence around a span', () => {
    expect(sentenceAround('One. Two three four. Five.', 5, 8)).toBe('Two three four.');
    expect(sentenceAround('No full stop here', 3, 7)).toBe('No full stop here');
  });

  it('reads keep, fix and drop; a mark with no line has no verdict', () => {
    const v = parseVerdicts('1 || keep\n[2] || drop || changes the tense\n3 || fix || ils sont partis || agreement\nnoise');
    expect(v.get(0)).toEqual({ kind: 'keep' });
    expect(v.get(1)).toEqual({ kind: 'drop', reason: 'changes the tense' });
    expect(v.get(2)).toEqual({ kind: 'fix', target: 'ils sont partis', reason: 'agreement' });
    expect(v.has(3)).toBe(false);
  });
});

/** A marking call that streams `lines` a few characters at a time, and a check that drops what `drop` matches. */
function fakes(drop: RegExp, events: string[], failCheck?: RegExp): MarkCalls {
  return {
    async mark(_user, onText) {
      const text = LINES.join('\n');
      for (let i = 7; i < text.length; i += 7) {
        onText(text.slice(0, i));
        await Promise.resolve();
      }
      onText(text);
      events.push('mark done');
      return { text, usd: 0.01 };
    },
    async check(user) {
      const english = /English: (.*)/.exec(user)![1]!;
      events.push(`check ${english}`);
      if (failCheck?.test(english)) throw new Error('network');
      return { text: drop.test(english) ? '1 || drop || made up' : '1 || keep', usd: 0.001 };
    },
  };
}

describe('markSection', () => {
  it('checks each mark as soon as its line is whole, and shows the ones the check keeps', async () => {
    const events: string[] = [];
    const shown: ShownMark[] = [];
    const out = await markSection(job, fakes(/family/, events), (m) => {
      events.push(`shown ${m.english}`);
      shown.push(m);
    });
    // The first two are checked, and the first shown, before the marking call finishes.
    expect(events.indexOf('check They departed')).toBeLessThan(events.indexOf('mark done'));
    expect(events.indexOf('shown They departed')).toBeLessThan(events.indexOf('mark done'));
    expect(shown.map((m) => m.target)).toEqual(['Ils sont partis', 'Sir William est resté une semaine']);
    expect(shown[0]).toMatchObject({ at: 0, start: 0, end: 13, pointLabel: lesson.points[1] });
    expect(out).toMatchObject({ dropped: 1 });
    expect(out.marks).toHaveLength(2);
    expect(out.usd).toBeCloseTo(0.013);
    // Each mark is checked once.
    expect(events.filter((e) => e.startsWith('check'))).toHaveLength(3);
  });

  it('drops a mark whose check fails', async () => {
    const shown: string[] = [];
    const out = await markSection(job, fakes(/^$/, [], /Sir William/), (m) => shown.push(m.english));
    expect(shown.sort()).toEqual(['The family returned', 'They departed']);
    expect(out.dropped).toBe(1);
  });
});

describe('markSection with Jev first', () => {
  /** Jev's answer for a mark, by its English: the product of the two nouls is the chance it's good. */
  const jevSays = (p: Record<string, number>, fail?: RegExp): NonNullable<MarkCalls['jev']> => async (state) => {
    const english = (state as { marked_english: string }).marked_english;
    if (fail?.test(english)) throw new Error('Jev 500');
    const q = p[english] ?? 1;
    return { answers: { meaning: { type: 'noul', noul: q }, correct: { type: 'noul', noul: 1 } }, model: 'jev-1.14.0', inputTokens: 100, usd: 0.000004, secs: 0.1 };
  };

  it('drops what Jev is sure is wrong, keeps what it’s sure of, and asks the lenient check about the rest', async () => {
    const events: string[] = [];
    const calls = { ...fakes(/./, events), jev: jevSays({ 'They departed': 0.9, 'Sir William stayed only a week': 0.4, 'The family returned': 0.05 }) };
    const prompts: string[] = [];
    const check = calls.check;
    calls.check = async (user) => {
      prompts.push(user);
      return { ...(await check(user)), text: '1 || keep' };
    };
    const shown: string[] = [];
    const out = await markSection(job, calls, (m) => shown.push(m.english));
    expect(shown.sort()).toEqual(['Sir William stayed only a week', 'They departed']);
    expect(prompts).toHaveLength(1);
    expect(prompts[0]).toContain('Sir William stayed only a week');
    expect(prompts[0]).toContain('Drop a mark only when it fails one of these clearly.');
    expect(out).toMatchObject({ dropped: 1, toModel: 1 });
  });

  it('lets the model check decide a mark Jev failed on', async () => {
    const asked: string[] = [];
    const calls = { ...fakes(/^$/, asked), jev: jevSays({}, /family/) };
    const shown: string[] = [];
    const out = await markSection(job, calls, (m) => shown.push(m.english));
    expect(shown).toHaveLength(3);
    expect(asked.filter((e) => e.startsWith('check'))).toEqual(['check The family returned']);
    expect(out.toModel).toBe(1);
  });

  it('asks the shipped check, not the lenient one, without Jev', async () => {
    const prompts: string[] = [];
    const calls = fakes(/^$/, []);
    const check = calls.check;
    calls.check = async (user) => (prompts.push(user), check(user));
    await markSection(job, calls, () => {});
    expect(prompts.every((p) => p.includes('Keep a mark that passes both; drop one that fails either.'))).toBe(true);
  });

  it('marks with the sweep', async () => {
    let prompt = '';
    const calls = fakes(/^$/, []);
    const mark = calls.mark;
    calls.mark = (user, onText) => ((prompt = user), mark(user, onText));
    await markSection(job, calls, () => {});
    expect(prompt).toContain('Mark every place in the section where the lesson fits, even loosely');
    expect(prompt).not.toContain('Spread the marks through the section');
  });
});

