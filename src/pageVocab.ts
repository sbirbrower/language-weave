import type { LanguageConfig } from './languages';
import type { VocabItem } from './messages';
import { normalizeLemma } from './lessons/resolve';
import type { Written } from './weave/write';

interface Entry {
  item: VocabItem;
  elements: HTMLElement[];
  /** Index of the element the next reveal goes to. */
  cursor: number;
}

/** Everything woven on this page, grouped by lemma, for the popup's list. */
export class PageVocab {
  private entries = new Map<string, Entry>();
  wovenWords = 0;

  constructor(readonly lang: LanguageConfig) {}

  add(written: Written[], fallbackCategory: string): void {
    for (const { replacement: r, element } of written) {
      const category = r.category ?? fallbackCategory;
      const key = `${category}:${normalizeLemma(r.lemma)}`;
      let entry = this.entries.get(key);
      if (!entry) {
        entry = {
          item: {
            key,
            lemma: normalizeLemma(r.lemma),
            french: this.lang.citationForm(r.lemma, r.gender, r.pos),
            english: [],
            gloss: r.gloss,
            category,
            count: 0,
          },
          elements: [],
          cursor: 0,
        };
        this.entries.set(key, entry);
      }
      entry.item.count++;
      const english = r.term ?? r.original;
      if (!entry.item.english.includes(english)) entry.item.english.push(english);
      entry.elements.push(element);
      this.wovenWords += r.words;
    }
  }

  /** Items sorted by count, then alphabetically; the popup groups them by category. */
  list(): VocabItem[] {
    return [...this.entries.values()]
      .map((e) => e.item)
      .sort((a, b) => b.count - a.count || a.french.localeCompare(b.french, this.lang.code));
  }

  /** The next place on the page this item appears, cycling through occurrences in document order. */
  next(key: string): HTMLElement | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    const live = entry.elements.filter((el) => el.isConnected);
    if (live.length === 0) return undefined;
    live.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    const el = live[entry.cursor % live.length];
    entry.cursor++;
    return el;
  }

  /** The item's first place on the page that's still there. */
  element(key: string): HTMLElement | undefined {
    return this.entries.get(key)?.elements.find((el) => el.isConnected);
  }

  clear(): void {
    this.entries.clear();
    this.wovenWords = 0;
  }
}
