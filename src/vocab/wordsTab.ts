import type { Result } from '../messages';
import type { Speaker } from '../speaker';
import type { Definition } from './definitions';
import { byRecent, wordLists, type ListedWord, type Vocab, type VocabEvent } from './store';
import { wordRow } from './wordRows';

/**
 * The widget's Words tab: the reader's latest words in the language, as the
 * Words page shows them (`wordRow`), drawn again each time the tab is opened.
 */
export interface WordsTabDeps {
  lang: string;
  /** The store as the page has it (`WordTracker.current`). */
  load(): Vocab;
  record(events: VocabEvent[]): void;
  /** Definitions and examples by word, stored or written now (`define-words`). */
  define(words: Array<{ word: string; gloss: string }>): Promise<Result<{ definitions: Record<string, Definition>; usd: number | null }>>;
  onSpend(usd: number | null): void;
  speech?: Speaker;
  /** A word read aloud, for the reader's word store. */
  onWordSaid?(word: string): void;
}

export interface WordsTab {
  open(): void;
}

/** In a widget tab, only the latest: the Words page has them all. */
export const WORDS_TAB_SHOWN = 40;

export function wordsTab(pane: HTMLElement, deps: WordsTabDeps): WordsTab {
  const doc = pane.ownerDocument;
  const definitions = new Map<string, Definition>();
  const asked = new Set<string>();
  let words: ListedWord[] = [];

  const draw = () => {
    if (!words.length) {
      pane.replaceChildren(Object.assign(doc.createElement('p'), { className: 'note', textContent: 'No words yet: they’re listed here once they’re woven into a page.' }));
      return;
    }
    const speech = deps.speech;
    const list = Object.assign(doc.createElement('ul'), { className: 'wl' });
    list.append(
      ...words.map((word) => {
        const info = { key: word.key, word: word.word, gloss: word.gloss, english: '' };
        return wordRow(word, {
          doc,
          lang: deps.lang,
          definition: definitions.get(word.word),
          say: speech && ((text, slow) => speech.play([text], () => {}, (error) => console.warn(`[tissage] ${error}`), slow)),
          can: speech?.can,
          onListen: () => deps.onWordSaid?.(word.word),
          onSet: (status) => {
            deps.record([{ kind: 'set', info, status }]);
            load();
          },
        });
      }),
    );
    pane.replaceChildren(list);
  };

  async function define() {
    const wanted = words.filter((w) => !asked.has(w.word));
    if (!wanted.length) return;
    wanted.forEach((w) => asked.add(w.word));
    const res = await deps.define(wanted.map((w) => ({ word: w.word, gloss: w.gloss }))).catch((e: unknown) => ({ ok: false as const, error: String(e) }));
    if (!res.ok) {
      // Asked again the next time the tab is opened.
      wanted.forEach((w) => asked.delete(w.word));
      console.warn(`[tissage] ${res.error}`);
      return;
    }
    deps.onSpend(res.value.usd);
    for (const [word, d] of Object.entries(res.value.definitions)) definitions.set(word, d);
    draw();
  }

  function load() {
    const lists = wordLists(deps.load());
    words = byRecent([...lists.saved, ...lists.known, ...lists.seen]).slice(0, WORDS_TAB_SHOWN);
    draw();
    void define();
  }

  return { open: load };
}
