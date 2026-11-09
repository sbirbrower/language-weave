import type { Result } from '../messages';
import { practiceTab, type PracticeDeps, type PracticeState } from '../practice/controller';
import type { Speaker } from '../speaker';
import { wordsTab, type WordsTabDeps } from '../vocab/wordsTab';
import { fillLines, fillPiece, fillTextbook, newQuiz, showWidget, type PieceView, type QuizState, type SpeakControls, type WidgetOptions, type WidgetPosition, type WidgetSize } from '../widget';
import { DEFAULT_PAGE_FORMAT, FORMATS, getFormat, pickFormat, RECENT_FORMATS, type Format } from './formats';
import { spokenText, type Piece, type PieceMode } from './piece';
import type { Textbook } from './textbook';

export interface PassageDeps {
  doc: Document;
  /**
   * page: a piece about the section on screen, written again when the reader
   * scrolls to another, or about the text they highlight; lesson: a scene on the lesson's theme, whatever the page.
   */
  mode: PieceMode;
  /** In the widget's bar: the page's or the lesson's title. */
  title: string;
  /**
   * Page mode: the section on screen now (`sectionOnScreen`). `key` names its text, for a page whose
   * sections change as it loads more (the same index another text); none = the index.
   */
  focus?(): { index: number; heading: string; key?: string };
  /** Page mode: the text highlighted on the page now, long enough to write about, and the index of the section it's in. */
  selection?(): { text: string; index: number } | undefined;
  /** Asks for a piece in a format (about `selection` when there is one, else the section `focus`); `onNote` while the lesson kit is built, `onPiece` as lines are written. */
  request(
    job: { focus: number; formatId: string; selection?: string },
    onNote: (note: string) => void,
    onPiece: (piece: Piece) => void,
  ): Promise<Result<{ piece: Piece; usd: number | null }>>;
  /** Lesson mode: the lesson's textbook page, for the Lesson tab. None = no Lesson tab. */
  textbook?(): Promise<Result<{ textbook: Textbook; usd: number | null }>>;
  /** Exercises on the lesson or the section on screen, for the Practice tab (`src/practice/`). None = no Practice tab. */
  practice?: Pick<PracticeDeps, 'level' | 'lang' | 'request' | 'lesson' | 'focus' | 'hint' | 'listen' | 'drills'>;
  /** The reader's latest words, for the Words tab (`src/vocab/wordsTab.ts`). None = no Words tab. */
  words?: Pick<WordsTabDeps, 'lang' | 'load' | 'record' | 'define'>;
  onSpend(usd: number | null): void;
  /** Reads finished pieces aloud; none = no speaker buttons; one that reads only some words (`can`) = buttons on those words. */
  speech?: Speaker;
  /** A word from a list read aloud, for the reader's word store (`src/vocab/`). */
  onWordSaid?(word: string): void;
  /** Picks formats; Math.random unless a test sets it. */
  random?: () => number;
  /** Where the reader last dragged the widget; none = the corner. */
  position?: WidgetPosition | null;
  onMove?(position: WidgetPosition | null): void;
  /** The size the reader last dragged it to; none = the default. */
  size?: WidgetSize | null;
  onResize?(size: WidgetSize | null): void;
  /** Text size last picked; none = the default. */
  textScale?: number;
  onTextScale?(scale: number): void;
  /** For a language with a romanisation: the title bar's switch between it and the script. */
  script?: WidgetOptions['script'];
  /** The reader closed the widget. */
  onClose?(): void;
  /** Lesson mode: where the reader was in another browser tab, shown as it was. */
  saved?: PassageState;
  /** Something the reader would want carried to another tab changed: an answer, a tab, a piece or exercise written. */
  onChange?(): void;
}

/** Lesson mode's widget as the reader left it, to show unchanged in another browser tab (`src/lessonState.ts`). */
export interface PassageState {
  /** The widget tab open. */
  tab: string;
  /** Minimised. */
  collapsed?: boolean;
  /** The finished piece and its answers. */
  piece?: { piece: Piece; quiz: QuizState };
  recent: string[];
  practice?: PracticeState;
  /** How far each widget tab is scrolled. */
  scroll?: Record<string, number>;
}

export interface PassageWidget {
  /** The page's words are known (or not coming): write the first piece. */
  ready(): void;
  /** Lesson mode: what to carry to another tab. */
  state(): PassageState;
  /** Page mode: the page's text changed without a scroll (pages turned, more loaded); write about what's on screen now. */
  refocus(): void;
  stop(): void;
}

// A new section is written once scrolling has stopped this long, so passing through doesn't spend.
export const SCROLL_SETTLE_MS = 800;
// Highlighted text is written about once the selection has stopped changing this long, so dragging doesn't spend.
export const SELECTION_SETTLE_MS = 600;

/** What a piece is about: a section of the page, or text the reader highlighted (in section `index`). */
interface Focus {
  index: number;
  heading: string;
  key?: string;
  selection?: string;
}
const keyOf = (f: Focus) => (f.selection ? `selection:${f.selection}` : (f.key ?? String(f.index)));

/**
 * The passage widget. Page mode writes each section as a simple summary,
 * and its format chip is a menu to write it in another; lesson mode picks a
 * random format, avoiding the last few. "New passage" writes the same
 * section (or scene) again in the same format. In page mode,
 * highlighting text on the page writes about it instead, until the reader
 * scrolls with nothing highlighted.
 * One request at a time; in page mode each section's piece is kept, so
 * scrolling back costs nothing. A finished piece's plain lines can be read
 * aloud, a line or all of them; its quizzes can be answered.
 */
export function startPassage(deps: PassageDeps): PassageWidget {
  const win = deps.doc.defaultView;
  const random = deps.random ?? Math.random;
  const follows = deps.mode === 'page';
  let stopped = false;
  let isReady = false;
  let writing = false;
  let shown = '';
  let timer: ReturnType<typeof setTimeout> | undefined;
  let selectionTimer: ReturnType<typeof setTimeout> | undefined;
  // The text last highlighted, kept once the highlight's gone (a click in the widget clears it) until a scroll.
  let picked: Focus | undefined;
  const written = new Map<string, { piece: Piece; quiz: QuizState }>();
  const recent: string[] = [...(deps.saved?.recent ?? [])];
  if (deps.saved?.piece) written.set('0', deps.saved.piece);
  // Lesson mode opens on the lesson, then practice, then the passage; page mode opens on the passage.
  const practiceTabInfo = deps.practice ? [{ id: 'practice', label: 'Practice' }] : [];
  const passageTab = { id: 'passage', label: 'Passage' };
  const wordsTabInfo = deps.words ? [{ id: 'words', label: 'Words' }] : [];
  const tabs = follows
    ? [passageTab, ...practiceTabInfo, ...wordsTabInfo]
    : [...(deps.textbook ? [{ id: 'lesson', label: 'Lesson' }] : []), ...practiceTabInfo, passageTab, ...wordsTabInfo];
  let tab = tabs.some((t) => t.id === deps.saved?.tab) ? deps.saved!.tab : tabs[0]!.id;
  const openTab = (id: string) => {
    tab = id;
    restoreScroll(id);
    if (id === 'lesson') loadTextbook();
    else if (id === 'practice') practice?.open();
    else if (id === 'words') words?.open();
  };
  let collapsed = Boolean(deps.saved?.collapsed);
  const widget = showWidget(deps.doc, {
    title: deps.title,
    tabs: tabs.length > 1 ? tabs : undefined,
    tab,
    collapsed,
    onCollapse: (c) => {
      collapsed = c;
      if (!c) restoreScroll(tab);
    },
    onTab: openTab,
    onClose: () => {
      stop();
      deps.onClose?.();
    },
    position: deps.position,
    onMove: deps.onMove,
    size: deps.size,
    onResize: deps.onResize,
    textScale: deps.textScale,
    onTextScale: deps.onTextScale,
    script: deps.script,
  });
  const passagePane = widget.pane('passage');
  const practice =
    deps.practice &&
    practiceTab(widget.pane('practice'), { ...deps.practice, onSpend: deps.onSpend, speech: deps.speech, random, saved: deps.saved?.practice, onChange: deps.onChange });
  const words = deps.words && wordsTab(widget.pane('words'), { ...deps.words, onSpend: deps.onSpend, speech: deps.speech, onWordSaid: deps.onWordSaid });
  // Answers and tab clicks inside the shadow root bubble out to the host, after the widget has taken them.
  if (deps.onChange) for (const type of ['click', 'input', 'change']) widget.host.addEventListener(type, () => deps.onChange!());
  // Each tab's scroll, carried to another browser tab. Its content may arrive later (the textbook, an
  // exercise), so the saved place is applied as the pane fills, until reached or the reader moves it.
  const scrolled: Record<string, number> = { ...deps.saved?.scroll };
  const pendingScroll = new Map(Object.entries(scrolled).filter(([, top]) => top > 0));
  const scroller = (id: string) => widget.pane(id).parentElement!;
  function restoreScroll(id: string) {
    const target = pendingScroll.get(id);
    if (target === undefined || id !== tab || collapsed) return;
    const el = scroller(id);
    el.scrollTop = target;
    if (el.scrollTop >= target - 1) pendingScroll.delete(id);
  }
  for (const t of tabs) {
    const el = scroller(t.id);
    el.addEventListener('scroll', () => {
      if (el.hidden) return;
      scrolled[t.id] = el.scrollTop;
      deps.onChange?.();
    }, { passive: true });
    for (const type of ['wheel', 'pointerdown', 'keydown', 'touchstart']) el.addEventListener(type, () => pendingScroll.delete(t.id), { passive: true });
    const Observer = win?.MutationObserver;
    if (pendingScroll.has(t.id) && Observer) {
      new Observer(() => (pendingScroll.has(t.id) ? restoreScroll(t.id) : undefined)).observe(widget.pane(t.id), { childList: true, subtree: true, characterData: true });
    }
  }
  // What the pane shows; `speakable` once the piece is finished, so a line isn't read while it may still change.
  let view: PieceView = { finished: false, quiz: newQuiz() };
  let playing = -1;
  let all = false;
  const speech = deps.speech;
  // A speaker that reads only what's recorded offers the lines recorded, one at a time, and no Listen.
  const readsAnything = speech && !speech.can;
  const plainLines = () => view.piece?.lines.flatMap((l, i) => (l.kind === 'line' ? [i] : [])) ?? [];
  const controls: SpeakControls | undefined = speech && {
    get playing() {
      return playing;
    },
    get all() {
      return all;
    },
    onLine: (i) => (playing === i && !all ? speech.stop() : say([i], false)),
    onAll: readsAnything ? () => (all && playing >= 0 ? speech.stop() : say(plainLines(), true)) : undefined,
    onWord: (text) => sayWord(text),
    canWord: speech.can,
    canLine: speech.can && ((i) => Boolean(view.piece && speech.can!(spokenText(view.piece.lines[i]!, view.piece.formatId)))),
  };
  const render = () => fillPiece(passagePane, view, view.finished ? controls : undefined);
  function show(next: Omit<PieceView, 'onAgain' | 'formatName' | 'formats' | 'onFormat'>) {
    speech?.stop();
    const current = next.piece?.formatId;
    const formatName = current ? getFormat(current)?.name : undefined;
    const menu = follows && next.finished && current ? { formats: FORMATS.map((f) => ({ id: f.id, name: f.name, current: f.id === current })), onFormat: again } : {};
    view = { ...next, formatName, ...menu, onAgain: next.finished || (next.note && !writing) ? () => again(next.piece?.formatId ?? recent[recent.length - 1]) : undefined };
    render();
  }
  function say(indices: number[], whole: boolean) {
    const lines = view.piece?.lines ?? [];
    const texts = indices.map((i) => spokenText(lines[i]!, view.piece?.formatId));
    view = { ...view, note: undefined };
    speech!.play(
      texts,
      (k) => {
        playing = k < 0 ? -1 : indices[k]!;
        all = whole && k >= 0;
        render();
      },
      (error) => {
        view = { ...view, note: error };
        render();
      },
    );
  }
  /** One word, slowly; it stops any line playing, which clears that line's highlight. */
  function sayWord(text: string) {
    deps.onWordSaid?.(text);
    speech!.play([text], () => {}, (error) => {
      view = { ...view, note: error };
      render();
    }, true);
  }
  show({ finished: false, quiz: newQuiz(), note: follows ? 'Waiting for the page’s words…' : 'Writing…' });
  let textbook: 'loading' | 'shown' | undefined;
  const titleFor = (heading: string) => (heading ? `${deps.title} · ${heading}` : deps.title);
  const focusNow = (): Focus => picked ?? (follows && deps.focus ? deps.focus() : { index: 0, heading: '' });

  function update() {
    if (stopped || !isReady) return;
    const f = focusNow();
    const key = keyOf(f);
    if (key === shown) return;
    const kept = written.get(key);
    if (kept) {
      shown = key;
      widget.setTitle(titleFor(f.heading));
      show({ piece: kept.piece, quiz: kept.quiz, finished: true });
    } else if (!writing) {
      write(f, firstFormat());
    } // otherwise update() runs again when the piece being written is done
  }

  // Asked for straight away, so it's usually there by the time the tab is opened; a failure is asked again from the tab.
  function loadTextbook() {
    if (stopped || textbook || !deps.textbook) return;
    const lessonPane = widget.pane('lesson');
    textbook = 'loading';
    fillLines(lessonPane, { note: 'Writing the lesson. The first time takes a minute or two…' });
    const failed = (error: string) => {
      textbook = undefined;
      if (!stopped) fillLines(lessonPane, { note: error });
    };
    void deps.textbook().then(
      (res) => {
        if (!res.ok) return failed(res.error);
        if (stopped) return;
        textbook = 'shown';
        deps.onSpend(res.value.usd);
        fillTextbook(lessonPane, res.value.textbook, speech && sayWord, speech?.can);
      },
      (e) => failed(e instanceof Error ? e.message : String(e)),
    );
  }
  loadTextbook();

  /** A new section's first format: the summary in page mode, a random one in lesson mode. */
  const firstFormat = () => (follows ? getFormat(DEFAULT_PAGE_FORMAT)! : pickFormat(random, recent));

  function write(f: Focus, format: Format) {
    const key = keyOf(f);
    writing = true;
    shown = key;
    recent.push(format.id);
    if (recent.length > RECENT_FORMATS) recent.shift();
    widget.setTitle(titleFor(f.heading));
    show({ finished: false, quiz: newQuiz(), note: 'Writing…' });
    let partial: Piece | undefined;
    const visible = () => !stopped && shown === key;
    const onNote = (note: string) => visible() && show({ piece: partial, finished: false, quiz: view.quiz, note });
    const onPiece = (p: Piece) => {
      partial = p;
      if (visible()) show({ piece: p, finished: false, quiz: view.quiz });
    };
    const failed = (error: string) => {
      writing = false;
      if (visible()) show({ piece: partial, finished: false, quiz: view.quiz, note: error });
    };
    void deps
      .request({ focus: f.index, formatId: format.id, selection: f.selection }, onNote, onPiece)
      .then(
        (res) => {
          if (stopped) return;
          // Errors aren't kept, so the section is asked for again once the reader comes back to it.
          if (!res.ok) return failed(res.error);
          const kept = { piece: res.value.piece, quiz: newQuiz() };
          written.set(key, kept);
          deps.onSpend(res.value.usd);
          writing = false;
          if (visible()) show({ ...kept, finished: true });
          deps.onChange?.();
        },
        (e) => failed(e instanceof Error ? e.message : String(e)),
      )
      .finally(() => {
        writing = false;
        update();
      });
  }

  /** The section (or scene) on screen again, in `formatId` ("New passage": the one shown) or a format not used lately. */
  function again(formatId?: string) {
    if (stopped || writing || !isReady) return;
    written.delete(shown);
    write(focusNow(), (formatId && getFormat(formatId)) || pickFormat(random, recent));
  }

  const onScroll = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      picked = highlighted();
      update();
    }, SCROLL_SETTLE_MS);
  };
  const highlighted = (): Focus | undefined => {
    const s = deps.selection?.();
    return s && { index: s.index, heading: 'Highlighted', selection: s.text };
  };
  // A highlight gone isn't a change: what was highlighted stays until the reader scrolls.
  const onSelection = () => {
    clearTimeout(selectionTimer);
    selectionTimer = setTimeout(() => {
      const next = highlighted();
      if (!next) return;
      picked = next;
      update();
    }, SELECTION_SETTLE_MS);
  };
  // The page's own scrolling, and (caught on the way down) a box on it that scrolls, like a reader's pages.
  if (follows) win?.addEventListener('scroll', onScroll, { passive: true });
  if (follows) deps.doc.addEventListener('scroll', onScroll, { passive: true, capture: true });
  if (follows && deps.selection) deps.doc.addEventListener('selectionchange', onSelection);

  function stop() {
    stopped = true;
    speech?.stop();
    practice?.stop();
    clearTimeout(timer);
    clearTimeout(selectionTimer);
    win?.removeEventListener('scroll', onScroll);
    deps.doc.removeEventListener('scroll', onScroll, { capture: true });
    deps.doc.removeEventListener('selectionchange', onSelection);
    widget.host.remove();
  }

  if (tab === 'practice') practice?.open();
  if (tab === 'words') words?.open();
  restoreScroll(tab);

  return {
    ready() {
      isReady = true;
      update();
    },
    state() {
      const piece = written.get('0');
      return { tab, collapsed, piece, recent: [...recent], practice: practice?.state(), scroll: { ...scrolled } };
    },
    refocus() {
      if (follows) update();
    },
    stop,
  };
}
