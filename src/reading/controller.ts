import type { RequestEstimate } from '../cost';
import type { LanguageConfig } from '../languages';
import type { PageWord } from '../lessons/pageWords';
import type { Lesson } from '../lessons/types';
import type { Result } from '../messages';
import type { Segment } from '../weave/segment';
import { showNotes, type Note } from '../notes';
import { showWidget, type Widget } from '../widget';
import { headings, onScreenText, openingText, selectedText, wovenOnScreen } from './collect';
import {
  buildReadingPrompt,
  buildReadingSystemPrompt,
  getFormat,
  READING_FORMATS,
  readingBrief,
  SUMMARY_FORMAT,
  recapLines,
  type ReadingFormat,
  type ReadingInput,
  type ReadingLine,
} from './formats';

export interface ReadingDeps {
  doc: Document;
  root: Element;
  segments: Segment[];
  lesson: Lesson;
  lang: LanguageConfig;
  /** Themed words; read when a request is made. */
  pageWords(): PageWord[] | undefined;
  vocab(): { items: Array<{ french: string; category: string; count: number }>; categories: Array<{ id: string; label: string }> };
  /** `onLines`, when given, streams: it gets the lines so far as each one is finished. */
  request(
    formatId: string,
    input: ReadingInput,
    estimate: RequestEstimate,
    onLines?: (lines: ReadingLine[]) => void,
  ): Promise<Result<{ lines: ReadingLine[]; usd: number | null }>>;
  estimate(system: string, user: string, lines: number): RequestEstimate;
  saveFormat(id: string): void;
  onSpend(usd: number | null): void;
}

export interface Reading {
  widget: Widget;
  /** Requests can start: the page words are known (or not needed). */
  ready(): void;
  /** A segment was woven; "What you met" redraws. */
  onWoven(): void;
  stop(): void;
}

// "Why it's said this way" is asked again when the woven words on screen change, after scrolling settles.
const SCROLL_SETTLE_MS = 800;
// Shorter highlights are a word or a phrase, not a passage to summarise.
const MIN_HIGHLIGHT_WORDS = 12;

/** Runs the widget's reading texts: one format at a time, cached per format (and per woven words on screen). */
export function startReading(deps: ReadingDeps, initialFormat: string): Reading {
  const { doc } = deps;
  let format: ReadingFormat = getFormat(initialFormat);
  let isReady = false;
  let shownKey = '';
  const cache = new Map<string, ReadingLine[]>();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const widget = showWidget(doc, {
    title: deps.lesson.name,
    formats: READING_FORMATS.map((f) => ({ id: f.id, label: f.label })),
    selected: format.id,
    onSelect(id) {
      format = getFormat(id);
      deps.saveFormat(id);
      shownKey = '';
      render();
    },
    onClose: () => notes.remove(),
  });
  const notes = showNotes(doc);

  function input(): ReadingInput {
    return {
      title: doc.title,
      headings: headings(deps.root),
      opening: openingText(deps.segments),
      onScreen: onScreenText(deps.segments),
      woven: wovenOnScreen(doc),
      pageWords: deps.pageWords(),
    };
  }

  /** What the format's text depends on; a new key means a new request. */
  function keyFor(f: ReadingFormat, i: ReadingInput): string {
    return f.source === 'woven' ? (i.woven ?? []).join('|') : 'page';
  }

  function emptyNote(f: ReadingFormat, i: ReadingInput): string | undefined {
    if (f.source === 'woven' && !i.woven?.length) return 'No woven words on screen yet. Scroll to some.';
    return undefined;
  }

  function showLines(lines: ReadingLine[]) {
    widget.show({ lines, note: lines.length ? undefined : 'Nothing from the lesson fits here.' });
  }

  function render() {
    if (!widget.host.isConnected) return; // closed by the reader
    const f = format;
    if (f.local) {
      const { items, categories } = deps.vocab();
      const lines = recapLines(items, categories);
      widget.show({ lines, note: lines.length ? undefined : 'Nothing woven yet.' });
      return;
    }
    if (!isReady) {
      widget.show({ note: 'Picking words for this page…' });
      return;
    }
    const i = input();
    const empty = emptyNote(f, i);
    if (empty) {
      shownKey = '';
      widget.show({ note: empty });
      return;
    }
    const key = `${f.id}|${keyFor(f, i)}`;
    if (key === shownKey) return;
    shownKey = key;
    const cached = cache.get(key);
    if (cached) return showLines(cached);

    widget.show({ note: 'Writing…' });
    const brief = readingBrief(deps.lesson, i.pageWords);
    const system = buildReadingSystemPrompt(deps.lang, brief);
    const user = buildReadingPrompt(f, i);
    void deps.request(f.id, i, deps.estimate(system, user, f.maxLines)).then((res) => {
      if (res.ok) {
        deps.onSpend(res.value.usd);
        cache.set(key, res.value.lines);
      }
      if (shownKey !== key) return; // the reader moved on
      if (res.ok) showLines(res.value.lines);
      else {
        shownKey = '';
        widget.show({ note: `Couldn't write this: ${res.error}` });
      }
    });
  }

  // `selection` is the highlight last handled, so a click that leaves it in place doesn't
  // offer again; `opened` is the note shown for each highlight.
  let selection = '';
  const summaries = new Map<string, ReadingLine[]>();
  const opened = new Map<string, Note>();

  function showSummaryLines(note: Note, lines: ReadingLine[]) {
    note.show({ lines, note: lines.length ? undefined : "Couldn't summarise this." });
  }

  function offer(e: Event) {
    if (!widget.host.isConnected) return;
    if (e.target === notes.host || e.target === widget.host) return; // a click on Language Weave's own UI
    const text = selectedText(doc, deps.root);
    if (text === selection) return;
    selection = text;
    if (text.split(/\s+/).length < MIN_HIGHLIGHT_WORDS) return notes.withdraw();
    const range = doc.getSelection()!.getRangeAt(0).cloneRange();
    notes.offer(range, () => summarise(text, range));
  }

  function summarise(text: string, range: Range) {
    if (opened.get(text)?.open) return;
    const column = deps.segments.find((s) => s.block.contains(range.startContainer))?.block ?? deps.root;
    const note = notes.open(range, column);
    opened.set(text, note);
    const cached = summaries.get(text);
    if (cached) return showSummaryLines(note, cached);
    note.show({ note: 'Summarising…' });

    const i: ReadingInput = { ...input(), highlighted: text };
    const brief = readingBrief(deps.lesson, i.pageWords);
    const system = buildReadingSystemPrompt(deps.lang, brief);
    const user = buildReadingPrompt(SUMMARY_FORMAT, i);
    const estimate = deps.estimate(system, user, SUMMARY_FORMAT.maxLines);
    const onLines = (lines: ReadingLine[]) => note.show({ lines, note: '…' });
    void deps.request(SUMMARY_FORMAT.id, i, estimate, onLines).then((res) => {
      if (res.ok) {
        deps.onSpend(res.value.usd);
        summaries.set(text, res.value.lines);
        showSummaryLines(note, res.value.lines);
      } else note.show({ note: `Couldn't summarise this: ${res.error}` });
    });
  }
  // After the mouse or keyboard lets go, so a highlight being dragged isn't offered halfway.
  const onRelease = (e: Event) => setTimeout(() => offer(e), 0);
  doc.addEventListener('mouseup', onRelease);
  doc.addEventListener('keyup', onRelease);

  const onScroll = () => {
    if (format.source !== 'woven') return;
    clearTimeout(timer);
    timer = setTimeout(render, SCROLL_SETTLE_MS);
  };
  addEventListener('scroll', onScroll, { passive: true });
  render();

  return {
    widget,
    ready() {
      isReady = true;
      render();
    },
    onWoven() {
      if (format.local) render();
      notes.layout();
    },
    stop() {
      clearTimeout(timer);
      removeEventListener('scroll', onScroll);
      doc.removeEventListener('mouseup', onRelease);
      doc.removeEventListener('keyup', onRelease);
      widget.host.remove();
      notes.remove();
    },
  };
}
