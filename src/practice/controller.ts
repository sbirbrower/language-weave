import type { Result } from '../messages';
import type { Speaker } from '../speaker';
import type { Drills } from './drills';
import { hasHint } from './hint';
import { countResult, countShown, newCoverage, newSession, planLike, planNext, type Coverage, type Plan, type Session } from './schedule';
import { grade, newAnswer } from './session';
import { markSpeech } from './speaking';
import type { Practice, Step } from './types';
import { fillPractice, type PracticeControls, type PracticeView } from './view';

export interface PracticeDeps {
  /** The lesson's level ("CEFR A2–B1") or the reader's ("A2"): it decides which exercises come up. */
  level: string;
  /** The language's code: some exercise types are for one language only. */
  lang?: string;
  /**
   * Asks for one exercise as planned (`schedule.ts`): its type, and in lesson mode its point and words,
   * in page mode its section. `like` is the exercise the reader asked for more like: same setting, new sentences.
   */
  request(plan: Plan, like?: Practice): Promise<Result<{ practice: Practice; usd: number | null }>>;
  /**
   * Lesson mode: the lesson's points and words to plan over, and what's been practised in it, kept
   * across sessions until the reader starts afresh. None (page mode) = exercise types only, nothing kept.
   */
  lesson?: {
    /** `glosses`: the words' English, by word. */
    plan(): Promise<Result<{ points: string[]; words: string[]; glosses?: Record<string, string>; usd: number | null }>>;
    coverage: { load(): Promise<Coverage>; save(coverage: Coverage): void };
    /** Each exercise answered, for the reader's progress (`ledger.ts`); kept when they start afresh. */
    record?(plan: Plan, right: boolean): void;
  };
  /** Lesson mode, in a language's first few lessons: drills on its sounds or script, built here by code, with no request. */
  drills?: Drills;
  /** A hint for an exercise, asked for as soon as the exercise is written; none = no Hint button. */
  hint?(step: Step): Promise<Result<{ hint: string; usd: number | null }>>;
  /** Page mode: the section on screen. An exercise written ahead for another section isn't shown. */
  focus?(): number;
  onSpend(usd: number | null): void;
  /** Reads the language aloud; none = no listening exercises, and nothing can be heard. */
  speech?: Speaker;
  /** Hears the reader through the microphone; none = no speaking exercises (they're opt-in). */
  listen?: Listener;
  /** Picks the exercises; Math.random unless a test sets it. */
  random?: () => number;
  /** Where the reader was in another browser tab: the exercise, the answer so far, the next one if written. */
  saved?: PracticeState;
  /** Something the reader would want carried to another tab changed. */
  onChange?(): void;
}

/** The microphone, through the background (`src/listen.ts`). */
export interface Listener {
  start(): Promise<Result<null>>;
  /** Stops recording and transcribes it, with the sentence `expected` as a prompt. */
  stop(expected: string): Promise<Result<{ text: string; usd: number | null }>>;
  /** Stops recording and throws it away. */
  cancel(): void;
}

/** The tab's place, to show the same exercise in another browser tab (`src/lessonState.ts`). */
export interface PracticeState {
  view: PracticeView;
  /** The next exercise, once written, so the other tab doesn't write it again. */
  next?: Practice;
  /** Hints already written for the exercise on screen and the next one. */
  hint?: string;
  nextHint?: string;
  /** Where the plan is: clusters, missed points, types used (`schedule.ts`). */
  session?: Session;
}

export interface PracticeTab {
  /** The tab was opened: the first exercise is asked for. */
  open(): void;
  state(): PracticeState;
  stop(): void;
}

type Asked = Promise<Result<{ practice: Practice; usd: number | null }>>;
type Hint = Promise<Result<{ hint: string; usd: number | null }>>;

/**
 * The widget's Practice tab: one exercise at a time, on the lesson or on the
 * section of the page on screen. While the reader does it, the next is
 * written, so "Next exercise" (or Skip) shows it at once; "More like this"
 * writes one of the same type on the same point and setting, and the one
 * written ahead waits for the exercise after it. What each one
 * practises is planned by `schedule.ts`: in lesson mode its point and words
 * too, with what's been practised kept across sessions. Each exercise's hint
 * is written with it, so "Hint" shows it at once.
 */
const failed = (e: unknown): Result<never> => ({ ok: false, error: e instanceof Error ? e.message : String(e) });

export function practiceTab(pane: HTMLElement, deps: PracticeDeps): PracticeTab {
  const random = deps.random ?? Math.random;
  const speech = deps.speech;
  // A speaker that reads only what's recorded gets 🔊 on those texts, and no listening exercises.
  const readsAnything = Boolean(speech && !speech.can);
  let stopped = false;
  let waiting = false;
  /** The next exercise, asked for as soon as one is shown, and the section it's about. */
  let upcoming: Asked | undefined;
  let upcomingFocus: number | undefined;
  /** `upcoming` once it's written. */
  let next: Practice | undefined;
  let session = newSession();
  let coverage: Coverage = newCoverage();
  /** The lesson's points and words, and its coverage, loaded once before the first plan. */
  let ready: Promise<Result<{ points: string[]; words: string[]; glosses?: Record<string, string> }>> | undefined;
  let lessonPoints: string[] = [];
  const hints = new WeakMap<Practice, Hint>();
  const hintTexts = new WeakMap<Practice, string>();
  let view: PracticeView = { answer: newAnswer(), tally: { right: 0, total: 0 } };
  /** Exercises finished in this tab, oldest first, and which one is looked back at (none = the one on screen). */
  const past: PracticeView[] = [];
  let looking: number | undefined;

  const render = () => {
    if (stopped) return;
    const shown = looking === undefined ? view : { ...past[looking]!, past: { at: looking, of: past.length } };
    fillPractice(pane, shown, { ...controls, back: looking === 0 || !past.length ? undefined : controls.back });
    deps.onChange?.();
  };
  const finish = (right: boolean) => {
    const plan = view.practice?.plan;
    if (plan) countResult(session, plan, right);
    if (plan && view.result === undefined) deps.lesson?.record?.(plan, right);
    view.result = right;
    view.tally = { right: view.tally.right + (right ? 1 : 0), total: view.tally.total + 1 };
    render();
  };
  const controls: PracticeControls = {
    check() {
      const step = view.practice?.step;
      const right = step && view.result === undefined ? grade(step, view.answer) : undefined;
      if (right !== undefined) finish(right);
    },
    settle: finish,
    back() {
      speech?.stop();
      looking = (looking ?? past.length) - 1;
      render();
    },
    forward() {
      looking = looking === undefined || looking + 1 >= past.length ? undefined : looking + 1;
      render();
    },
    reveal() {
      if (!view.practice || view.result !== undefined) return;
      view.revealed = true;
      finish(false);
    },
    another: () => void another(),
    like: () => {
      if (view.practice) void another(view.practice);
    },
    reset: deps.lesson ? reset : undefined,
    hint: deps.hint ? () => void showHint() : undefined,
    record: deps.listen ? () => void record() : undefined,
    redraw: render,
    say: speech
      ? (text, slow) =>
          speech.play([text], () => {}, (error) => {
            view = { ...view, note: error };
            render();
          }, slow)
      : undefined,
    canSay: speech?.can,
  };

  /** Starts recording, or stops it and marks what was heard: passed, or another try. */
  async function record() {
    const listen = deps.listen;
    const practice = view.practice;
    const step = practice?.step;
    if (!listen || step?.kind !== 'speak' || view.result !== undefined) return;
    const spoken = (view.answer.spoken ??= { tries: 0 });
    if (spoken.status === 'hearing') return;
    if (spoken.status !== 'recording') {
      speech?.stop();
      Object.assign(spoken, { status: 'recording', error: undefined });
      render();
      const res = await listen.start();
      if (!res.ok && view.answer.spoken === spoken) {
        Object.assign(spoken, { status: undefined, error: res.error });
        render();
      }
      return;
    }
    spoken.status = 'hearing';
    render();
    const res = await listen.stop(step.say.text);
    if (stopped || view.practice !== practice) return;
    spoken.status = undefined;
    spoken.tries++;
    if (!res.ok) {
      spoken.error = res.error;
      return render();
    }
    deps.onSpend(res.value.usd);
    spoken.heard = markSpeech(res.value.text, step.say.text);
    if (spoken.heard.tier !== 'retry') return finish(true);
    render();
  }

  /** A recording still running is thrown away. */
  function stopRecording() {
    const spoken = view.answer.spoken;
    if (spoken?.status !== 'recording') return;
    deps.listen?.cancel();
    spoken.status = undefined;
  }

  /** The lesson's points and words and what's been practised; a failure is asked for again next time. */
  function setup(): Promise<Result<{ points: string[]; words: string[]; glosses?: Record<string, string> }>> {
    const lesson = deps.lesson;
    if (!lesson) return Promise.resolve({ ok: true, value: { points: [], words: [] } });
    ready ??= Promise.all([lesson.plan(), lesson.coverage.load()]).then(([res, saved]) => {
      if (!res.ok) {
        ready = undefined;
        return res;
      }
      deps.onSpend(res.value.usd);
      coverage = saved;
      lessonPoints = res.value.points;
      return { ok: true as const, value: { points: res.value.points, words: res.value.words, glosses: res.value.glosses } };
    }, (e: unknown) => {
      ready = undefined;
      return failed(e);
    });
    return ready;
  }

  /** The next exercise as planned, or one like `like`. */
  async function ask(like?: Practice): Asked {
    const lesson = await setup();
    if (!lesson.ok) return lesson;
    const plannable = { level: deps.level, lang: deps.lang, ...lesson.value };
    const options = { listening: readsAnything, speaking: Boolean(deps.listen) };
    let plan = like
      ? planLike(like.plan ?? { type: like.step.type }, plannable, coverage, session, random)
      : planNext(plannable, coverage, session, random, { ...options, drills: deps.drills?.types(readsAnything) });
    if (deps.drills?.types(readsAnything).includes(plan.type)) {
      const step = deps.drills.build(plan.type, lesson.value.words, random, readsAnything, lesson.value.glosses);
      if (step) return { ok: true, value: { practice: { step, praise: '', setting: '', plan }, usd: 0 } };
      // A drill that can't be built this time: an exercise as usual instead.
      plan = planNext(plannable, coverage, session, random, options);
    }
    if (deps.focus && plan.section === undefined) plan.section = deps.focus();
    return deps.request(plan, like).then(
      (res) => {
        if (res.ok && !stopped) {
          res.value.practice.plan = plan;
          deps.onSpend(res.value.usd);
          askHint(res.value.practice);
        }
        return res;
      },
      failed,
    );
  }

  /** Forgets what this lesson has practised, here and in storage; the exercise on screen stays. */
  function reset() {
    coverage = newCoverage();
    session = newSession();
    deps.lesson?.coverage.save(coverage);
    view = { ...view, tally: { right: 0, total: 0 }, progress: progress() };
    render();
  }

  /** Lesson mode: how many of the lesson's points have been practised, in any session. */
  function progress(): PracticeView['progress'] {
    if (!lessonPoints.length) return undefined;
    return { practised: lessonPoints.filter((p) => (coverage.points[p] ?? 0) > 0).length, points: lessonPoints.length };
  }

  function askHint(practice: Practice) {
    if (!deps.hint || !hasHint(practice.step)) return;
    hints.set(
      practice,
      deps.hint(practice.step).then((res) => {
        if (res.ok && !stopped) {
          deps.onSpend(res.value.usd);
          hintTexts.set(practice, res.value.hint);
          deps.onChange?.();
        }
        return res;
      }, failed),
    );
  }

  async function showHint() {
    const practice = view.practice;
    const asked = practice && hints.get(practice);
    if (!asked || view.hint) return;
    view = { ...view, hint: {} };
    render();
    const res = await asked;
    if (stopped || view.practice !== practice) return;
    view = { ...view, hint: res.ok ? { text: res.value.hint } : { error: res.error } };
    render();
  }

  /** Shows the exercise written ahead (asked for now if there's none), or with `like` a new one like it. */
  async function another(like?: Practice) {
    if (stopped || waiting) return;
    waiting = true;
    speech?.stop();
    if (view.practice && view.result !== undefined) past.push({ ...view, note: undefined });
    looking = undefined;
    stopRecording();
    // Written for a section the reader has scrolled away from: asked for again.
    const stale = deps.focus && upcomingFocus !== deps.focus();
    const asked = like ? ask(like) : (!stale && upcoming) || ask();
    // One like this keeps the exercise written ahead for after it.
    if (!like || stale) {
      upcoming = undefined;
      next = undefined;
    }
    // Already written, this resolves before the page paints, so "Writing…" never shows.
    const note = like ? 'Writing one like it…' : 'Writing an exercise…';
    view = { ...view, practice: undefined, answer: newAnswer(), result: undefined, hint: undefined, revealed: undefined, note };
    render();
    const res = await asked;
    waiting = false;
    if (stopped) return;
    if (!res.ok) {
      view = { ...view, note: res.error };
      return render();
    }
    const plan = res.value.practice.plan;
    if (plan && deps.lesson) {
      // Read again first: another browser tab may have counted since this one loaded it.
      coverage = await deps.lesson.coverage.load();
      if (stopped) return;
      countShown(coverage, plan);
      deps.lesson.coverage.save(coverage);
    } else if (plan) countShown(coverage, plan);
    view = { ...view, practice: res.value.practice, note: undefined };
    view.progress = progress();
    render();
    const audio = 'prompt' in res.value.practice.step ? res.value.practice.step.prompt.audio : undefined;
    if (audio && speech && (speech.can?.(audio) ?? true)) controls.say!(audio);
    if (upcoming) return;
    upcomingFocus = deps.focus?.();
    const mine = (upcoming = ask());
    void mine.then((res) => {
      if (upcoming !== mine || !res.ok) return;
      next = res.value.practice;
      deps.onChange?.();
    });
  }

  if (deps.saved) {
    const saved = deps.saved;
    view = saved.view;
    // A recording or a transcript on its way belongs to the tab it started in.
    if (view.answer.spoken) view.answer.spoken.status = undefined;
    if (saved.session) session = saved.session;
    // Hints already written come with the exercise; one still being written there is asked for again here.
    const known = (practice: Practice, hint: string | undefined) => {
      if (hint === undefined) return askHint(practice);
      hintTexts.set(practice, hint);
      hints.set(practice, Promise.resolve({ ok: true, value: { hint, usd: 0 } }));
    };
    if (view.practice) known(view.practice, saved.hint);
    if (saved.next) {
      next = saved.next;
      upcoming = Promise.resolve({ ok: true, value: { practice: saved.next, usd: 0 } });
      known(saved.next, saved.nextHint);
    }
    if (view.practice) fillPractice(pane, view, controls);
  }

  return {
    open() {
      if (!view.practice && !waiting) void another();
    },
    state() {
      // A hint still being written isn't carried; the other tab asks for it again.
      const hint = view.hint?.text !== undefined || view.hint?.error !== undefined ? view.hint : undefined;
      return {
        view: { ...view, hint, note: undefined },
        next,
        hint: view.practice && hintTexts.get(view.practice),
        nextHint: next && hintTexts.get(next),
        session,
      };
    },
    stop() {
      stopRecording();
      stopped = true;
      speech?.stop();
    },
  };
}
