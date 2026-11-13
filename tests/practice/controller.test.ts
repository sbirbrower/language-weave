import { beforeEach, describe, expect, it, vi } from 'vitest';
import { startPassage, type PassageDeps } from '../../src/passage/controller';
import { seededRng } from '../../src/passage/rng';
import { getExerciseType } from '../../src/practice/exercises';
import { parsePractice } from '../../src/practice/prompt';
import type { Practice } from '../../src/practice/types';
import { newCoverage, type Coverage, type Plan } from '../../src/practice/schedule';
import type { Result } from '../../src/messages';
import { decodeLessonState, encodeLessonState } from '../../src/lessonState';
import { WIDGET_ATTR } from '../../src/widget';
import { drillsFor, type Drills } from '../../src/practice/drills';
import type { Speaker } from '../../src/speaker';
import { lessonsFor } from '../../src/syllabus';
import { SAMPLES } from './samples';

const shadow = () => document.querySelector(`[${WIDGET_ATTR}]`)!.shadowRoot!;
const tab = (label: string) => [...shadow().querySelectorAll<HTMLElement>('.tab')].find((t) => t.textContent === label)!;
/** Lesson, Practice, Passage. */
const pane = () => shadow().querySelectorAll<HTMLElement>('.body')[1]!;
const buttons = () => [...pane().querySelectorAll<HTMLButtonElement>('button')];
const button = (text: string) => buttons().find((b) => b.textContent === text || b.getAttribute('aria-label') === text);
const click = (text: string) => {
  const b = button(text);
  if (!b) throw new Error(`No button "${text}" in: ${buttons().map((x) => x.textContent).join(' | ')}`);
  b.click();
};
const chip = () => pane().querySelector('.chip')?.textContent;
const verdict = () => pane().querySelector('.px-verdict')?.textContent;

/** An exercise of `type`, from its sample, whatever type was asked for. */
const practice = (type: string): Practice => parsePractice(JSON.stringify({ ...SAMPLES[type], praise: 'Bravo !' }), { type: getExerciseType(type)!, setting: 'a café', seed: 's' })!;
type Answer = Result<{ practice: Practice; usd: number | null }>;
const ok = (type: string): Answer => ({ ok: true, value: { practice: practice(type), usd: 0.01 } });

/** Each request answers with the next of `types`. */
function serve(...types: string[]) {
  let n = 0;
  return vi.fn(async (_plan: Plan): Promise<Answer> => ok(types[Math.min(n++, types.length - 1)]!));
}

function deps(request: (plan: Plan) => Promise<Answer>): PassageDeps {
  return {
    doc: document,
    mode: 'lesson',
    title: 'Au café',
    request: vi.fn(async () => ({ ok: false as const, error: 'not now' })),
    textbook: vi.fn(async () => ({ ok: false as const, error: 'not now' })),
    practice: { level: 'CEFR A1', request },
    onSpend: vi.fn(),
    random: seededRng('t').next,
  };
}

beforeEach(() => document.documentElement.querySelectorAll(`[${WIDGET_ATTR}]`).forEach((e) => e.remove()));

describe('the Practice tab', () => {
  it('sits between Lesson and Passage, and asks for an exercise only once opened', async () => {
    const request = serve('meaning');
    const d = deps(request);
    startPassage(d).ready();
    expect([...shadow().querySelectorAll('.tab')].map((t) => t.textContent)).toEqual(['Lesson', 'Practice', 'Passage']);
    expect(request).not.toHaveBeenCalled();
    tab('Practice').click();
    await vi.waitFor(() => expect(chip()).toBe('What does it mean?'));
    expect(d.onSpend).toHaveBeenCalledWith(0.01);
  });

  it('writes the next exercise while this one is done, and shows it at once', async () => {
    const request = serve('meaning', 'pairs', 'gap');
    startPassage(deps(request)).ready();
    tab('Practice').click();
    await vi.waitFor(() => expect(chip()).toBe('What does it mean?'));
    // The second was asked for as soon as the first was shown, and no more.
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    click('bread');
    click('Check');
    expect(verdict()).toBe('✓ Bravo !');
    click('Next exercise →');
    await vi.waitFor(() => expect(chip()).toBe('Match the pairs'));
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(3));
  });

  it('waits for the next one if it isn’t written yet', async () => {
    let finish!: () => void;
    let n = 0;
    const request = vi.fn((_plan: Plan) =>
      n++ === 0 ? Promise.resolve(ok('meaning')) : new Promise<Answer>((resolve) => (finish = () => resolve(ok('pairs')))),
    );
    startPassage(deps(request)).ready();
    tab('Practice').click();
    await vi.waitFor(() => expect(chip()).toBe('What does it mean?'));
    click('Skip');
    expect(pane().textContent).toContain('Writing an exercise…');
    finish();
    await vi.waitFor(() => expect(chip()).toBe('Match the pairs'));
  });

  it('shows a hint, written with the exercise, when asked for', async () => {
    const hint = vi.fn(async () => ({ ok: true as const, value: { hint: 'Think of a *viennoiserie*.', usd: 0.001 } }));
    const d = deps(serve('meaning', 'pairs'));
    d.practice!.hint = hint;
    startPassage(d).ready();
    tab('Practice').click();
    await vi.waitFor(() => expect(chip()).toBe('What does it mean?'));
    expect(hint).toHaveBeenCalled();
    expect(pane().querySelector('.px-hint')).toBeNull();
    click('Hint');
    await vi.waitFor(() => expect(pane().querySelector('.px-hint')!.textContent).toBe('Think of a viennoiserie.'));
    expect(button('Hint')!.disabled).toBe(true);
    click('Skip');
    // Pairs have no hint.
    await vi.waitFor(() => expect(chip()).toBe('Match the pairs'));
    expect(button('Hint')).toBeUndefined();
  });

  it('builds more picture exercises from the deck written with the first, with no request', async () => {
    // Planned as a picture exercise, so "More like this" plans another.
    const request = vi.fn(async (plan: Plan): Promise<Answer> => {
      if (request.mock.calls.length > 1) return ok('meaning');
      plan.type = 'yes_no';
      return ok('yes_no');
    });
    startPassage(deps(request)).ready();
    tab('Practice').click();
    await vi.waitFor(() => expect(chip()).toBe('Word and picture'));
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    const first = pane().querySelector('.px-emoji')!.textContent;
    click('Yes');
    click('Check');
    click('More like this');
    await vi.waitFor(() => expect(chip()).toBe('Word and picture'));
    expect(pane().querySelector('.px-emoji')!.textContent).not.toBe(first);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('carries the exercise, its answer and the next one to another tab, through storage', async () => {
    const onChange = vi.fn();
    const first = startPassage({ ...deps(serve('meaning', 'pairs')), onChange });
    first.ready();
    tab('Practice').click();
    await vi.waitFor(() => expect(chip()).toBe('What does it mean?'));
    click('bread');
    click('Check');
    expect(onChange).toHaveBeenCalled();
    // The next one is written, so the other tab doesn't write it again.
    await vi.waitFor(() => expect(first.state().practice?.next).toBeDefined());
    const stored = decodeLessonState(encodeLessonState({ rev: 'r', open: true, lessonId: 'l', widget: first.state() }))!;
    first.stop();

    const request = serve('gap');
    startPassage({ ...deps(request), saved: stored.widget }).ready();
    expect(tab('Practice').getAttribute('aria-selected')).toBe('true');
    expect(chip()).toBe('What does it mean?');
    expect(verdict()).toBe('✓ Bravo !');
    expect(pane().querySelector('.px-tally')!.textContent).toBe('1 / 1 right');
    expect(request).not.toHaveBeenCalled();
    click('Next exercise →');
    await vi.waitFor(() => expect(chip()).toBe('Match the pairs'));
    // Only the one after it is asked for here.
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(1));
  });

  it('checks an answer and keeps a tally', async () => {
    startPassage(deps(serve('meaning', 'meaning'))).ready();
    tab('Practice').click();
    await vi.waitFor(() => expect(chip()).toBe('What does it mean?'));
    expect(button('Check')!.disabled).toBe(true);
    click('croissant');
    click('Check');
    expect(verdict()).toBe('✗ Not quite');
    expect(pane().querySelector('.px-opt.right')!.textContent).toBe('bread');
    expect(pane().querySelector('.px-tally')!.textContent).toBe('0 / 1 right');
    click('Next exercise →');
    await vi.waitFor(() => expect(button('bread')).toBeDefined());
    click('bread');
    click('Check');
    expect(pane().querySelector('.px-tally')!.textContent).toBe('1 / 2 right');
  });

  it('plays pairs and a conversation out, and counts a slip', async () => {
    startPassage(deps(serve('pairs', 'talk'))).ready();
    tab('Practice').click();
    await vi.waitFor(() => expect(chip()).toBe('Match the pairs'));
    for (const [fr, en] of SAMPLES.pairs!.pairs as string[][]) {
      click(fr!);
      click(en!);
    }
    expect(verdict()).toBe('✓ Bravo !');
    click('Next exercise →');
    await vi.waitFor(() => expect(chip()).toBe('Conversation'));
    click('Je suis un café.');
    expect(pane().textContent).toContain('The waiter laughs.');
    click('Je voudrais un café.');
    click('Un croissant, merci.');
    expect(pane().textContent).toContain('Voilà !');
    expect(verdict()).toBe('✗ Not quite');
  });

  it('shows an error, and asks again from the tab', async () => {
    const request = vi.fn(async (_plan: Plan): Promise<Answer> => ({ ok: false, error: 'No API key.' }));
    startPassage(deps(request)).ready();
    tab('Practice').click();
    await vi.waitFor(() => expect(pane().textContent).toContain('No API key.'));
    click('Try again');
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(2));
  });

  it('is a tab after Passage in page mode, and drops an exercise written for a section scrolled away from', async () => {
    let section = 0;
    const request = vi.fn(async (_plan: Plan): Promise<Answer> => ok(section === 0 ? 'meaning' : 'pairs'));
    startPassage({
      doc: document,
      mode: 'page',
      title: 'Snow leopard',
      focus: () => ({ index: section, heading: '' }),
      request: vi.fn(async () => ({ ok: false as const, error: 'not now' })),
      practice: { level: 'A2', request, focus: () => section },
      onSpend: vi.fn(),
      random: seededRng('t').next,
    }).ready();
    expect([...shadow().querySelectorAll('.tab')].map((t) => t.textContent)).toEqual(['Passage', 'Practice']);
    const practicePane = () => [...shadow().querySelectorAll<HTMLElement>('.body')].at(-1)!;
    tab('Practice').click();
    await vi.waitFor(() => expect(practicePane().querySelector('.chip')?.textContent).toBe('What does it mean?'));
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    section = 1;
    [...practicePane().querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === 'Skip')!.click();
    await vi.waitFor(() => expect(practicePane().querySelector('.chip')?.textContent).toBe('Match the pairs'));
    expect(request).toHaveBeenCalledTimes(4);
  });

  it('plans each exercise on a lesson point, counts what was shown across sessions, and starts afresh', async () => {
    const request = serve('meaning', 'pairs', 'gap');
    let stored: Coverage = { ...newCoverage(), points: { greet: 4 } };
    const save = vi.fn((c: Coverage) => (stored = structuredClone(c)));
    const lesson = {
      plan: vi.fn(async () => ({ ok: true as const, value: { points: ['greet', 'numbers'], words: ['bonjour', 'un', 'deux', 'trois', 'merci'], usd: 0 } })),
      coverage: { load: async () => structuredClone(stored), save },
    };
    startPassage({ ...deps(request), practice: { level: 'CEFR A1', request, lesson } }).ready();
    tab('Practice').click();
    await vi.waitFor(() => expect(chip()).toBe('What does it mean?'));
    // The point practised least in earlier sessions comes first.
    expect(request.mock.calls[0]![0].point).toBe('numbers');
    expect(request.mock.calls[0]![0].words).toHaveLength(4);
    expect(stored.points).toEqual({ greet: 4, numbers: 1 });
    expect(pane().querySelector('.px-progress')?.textContent).toContain('2 of 2 lesson points practised');
    expect(lesson.plan).toHaveBeenCalledTimes(1);
    click('Start afresh');
    expect(stored).toEqual(newCoverage());
    expect(pane().querySelector('.px-progress')?.textContent).toContain('0 of 2');
  });

  it('builds a drill itself, with no request, and checks the letters tapped', async () => {
    const request = serve('meaning');
    // Without speech, the French lesson's drills that play audio are left out: silent letters is the one left.
    const drills = drillsFor(lessonsFor('fr')[1]!)!;
    const passage = startPassage({ ...deps(request), practice: { level: 'CEFR A1', request, drills }, random: () => 0 });
    passage.ready();
    tab('Practice').click();
    await vi.waitFor(() => expect(chip()).toBe('Silent letters'));
    // Only the one written ahead is asked for: the drill was used just now, so it's an exercise as usual.
    expect(request.mock.calls.map(([plan]) => plan.type)).not.toContain('silent_letters');
    expect(button('Hint')).toBeUndefined();
    const step = passage.state().practice?.view.practice?.step;
    if (step?.kind !== 'units') throw new Error('not a units drill');
    const units = [...pane().querySelectorAll<HTMLButtonElement>('.px-unit')];
    for (const i of step.answer) units[i]!.click();
    click('Check');
    expect(verdict()).toBe('✓ Right!');
  });

  it('takes a typed answer, strict about accents', async () => {
    const request = serve('meaning');
    const speech = { play: vi.fn(), stop: vi.fn() } as unknown as Speaker;
    const real = drillsFor(lessonsFor('fr')[0]!)!;
    const drills: Drills = { types: () => ['dictation'], build: (type, _words, random, listening) => real.build(type, ['la mère'], random, listening) };
    startPassage({ ...deps(request), practice: { level: 'CEFR A1', request, drills }, speech, random: () => 0 }).ready();
    tab('Practice').click();
    await vi.waitFor(() => expect(chip()).toBe('Dictation'));
    // Played as it's shown.
    expect(speech.play).toHaveBeenCalledWith(['la mère'], expect.any(Function), expect.any(Function), undefined);
    const input = pane().querySelector<HTMLInputElement>('.px-type')!;
    expect(button('Check')!.disabled).toBe(true);
    input.value = 'la mere';
    input.dispatchEvent(new Event('input'));
    expect(button('Check')!.disabled).toBe(false);
    click('Check');
    expect(verdict()).toBe('✗ Not quite');
    expect(pane().textContent).toContain('Almost: only the accents are off.');
  });
});
