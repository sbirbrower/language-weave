import { browser } from 'wxt/browser';
import type { Gender, LanguageConfig } from '../languages';
import { normalizeLemma } from '../lessons/resolve';
import { dayOf } from '../practice/ledger';
import { EN_CLASS, type Written } from '../weave/write';
import { sentenceAround } from './context';
import { applyEvent, newVocab, vocabStore, type Vocab, type VocabEvent, type WordContext, type WordInfo, type WordStatus } from './store';

/** How long sightings wait before they're written, so a page's weave is one write, not one per paragraph. */
const FLUSH_MS = 2000;

/**
 * The page's side of the word store: each woven word counted once on this page,
 * a flip to English counted as a peek, a word listened to, practice answers,
 * Save and Known from the word button and the popup. Keeps a copy of the store
 * so a status shows at once.
 */
export class WordTracker {
  private vocab: Vocab = newVocab();
  private seenHere = new Set<string>();
  private pending: VocabEvent[] = [];
  private timer: ReturnType<typeof setTimeout> | undefined;
  private readonly store;
  private readonly onChanged = (changes: Record<string, { newValue?: unknown }>, area: string) => {
    if (area === 'local' && this.store.key in changes) this.vocab = { ...newVocab(), ...(changes[this.store.key]!.newValue as Vocab) };
  };

  constructor(readonly lang: LanguageConfig) {
    this.store = vocabStore(lang.code);
    void this.store.load().then((v) => (this.vocab = v));
    browser.storage.onChanged.addListener(this.onChanged);
  }

  private info(wrapper: HTMLElement): WordInfo | undefined {
    const { lemma, gender, pos, gloss } = wrapper.dataset;
    if (!lemma) return undefined;
    return {
      key: normalizeLemma(lemma),
      word: this.lang.citationForm(lemma, (gender ?? '-') as Gender, pos ?? ''),
      gloss: gloss ?? '',
      english: wrapper.querySelector(`:scope > .${EN_CLASS}`)?.textContent?.trim() ?? '',
    };
  }

  private context(wrapper: HTMLElement): WordContext | undefined {
    const found = sentenceAround(wrapper);
    if (!found) return undefined;
    const url = location.href.replace(/#.*$/, '');
    return { ...found, title: document.title, url, day: dayOf(new Date()) };
  }

  private push(event: VocabEvent, now = false) {
    applyEvent(this.vocab, event, dayOf(new Date()));
    this.pending.push(event);
    clearTimeout(this.timer);
    if (now) this.flush();
    else this.timer = setTimeout(() => this.flush(), FLUSH_MS);
  }

  flush() {
    clearTimeout(this.timer);
    const events = this.pending;
    this.pending = [];
    void this.store.record(events);
  }

  status(wrapper: HTMLElement): WordStatus | undefined {
    const info = this.info(wrapper);
    return info && this.vocab.words[info.key]?.status;
  }

  /** Words just written on the page; each counts once per page. Saved and known ones keep the sentence. */
  woven(written: Written[]) {
    for (const { element } of written) {
      const info = this.info(element);
      if (!info || this.seenHere.has(info.key)) continue;
      this.seenHere.add(info.key);
      const status = this.vocab.words[info.key]?.status;
      this.push({ kind: 'seen', info, context: status && status !== 'seen' ? this.context(element) : undefined });
    }
  }

  peeked(wrapper: HTMLElement) {
    const info = this.info(wrapper);
    if (info && this.vocab.words[info.key]) this.push({ kind: 'peek', key: info.key });
  }

  /** A woven word read aloud from its button. */
  listened(wrapper: HTMLElement) {
    const info = this.info(wrapper);
    if (info) this.push({ kind: 'listen', key: info.key, info });
  }

  /** A word read aloud from the widget's word lists: counted if it's in the store already, or added with `gloss` (one of lesson mode's words). */
  listenedTo(word: string, gloss?: string) {
    const info = gloss === undefined ? undefined : { key: normalizeLemma(word), word, gloss, english: '' };
    this.push({ kind: 'listen', key: word, info });
  }

  /** An exercise answered in lesson mode: its focus words, with the kit's glosses to add one not met before. */
  answered(words: readonly string[], right: boolean, glosses: Record<string, string> = {}) {
    for (const word of words) {
      const info = { key: normalizeLemma(word), word, gloss: glosses[word] ?? '', english: '' };
      this.push({ kind: 'answer', key: word, right, info });
    }
  }

  /** The store as this page has it, sightings not yet written included (the widget's Words tab). */
  current(): Vocab {
    return this.vocab;
  }

  /** Events from the widget's Words tab (☆ and ✓), written at once. */
  record(events: VocabEvent[]) {
    events.forEach((e, i) => this.push(e, i === events.length - 1));
  }

  set(wrapper: HTMLElement, status: WordStatus) {
    const info = this.info(wrapper);
    if (info) this.push({ kind: 'set', info, status, context: this.context(wrapper) }, true);
  }

  stop() {
    this.flush();
    browser.storage.onChanged.removeListener(this.onChanged);
  }
}
