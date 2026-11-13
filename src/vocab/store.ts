import { browser } from 'wxt/browser';
import { normalizeLemma } from '../lessons/resolve';
import { dayOf } from '../practice/ledger';

/**
 * The words a reader has met in a language: woven on pages (counted once per
 * page), peeked at (flipped to English), listened to, answered in lesson
 * mode's practice, saved or marked known by hand. Known words are still woven;
 * the status is for the reader's lists, and for the model calls once they use
 * it.
 */
export type WordStatus = 'seen' | 'saved' | 'known';

/** What ☆ and ✓ mean, shown on hover wherever they appear. */
export const STATUS_TIPS = {
  save: 'Save to learn: keeps it in your saved words, to study and export',
  saved: 'Saved to learn. Click to unsave',
  know: 'I know this: marks it known (it’s still woven)',
  known: 'Marked known. Click to unmark',
} as const;


/** Where a saved word was met: the sentence as the page showed it, the word at `start`–`end`. */
export interface WordContext {
  sentence: string;
  start: number;
  end: number;
  title: string;
  url: string;
  day: string;
}

export interface WordEntry {
  /** Citation form, e.g. "le mot". */
  word: string;
  gloss: string;
  /** English spans it replaced, latest last. */
  english: string[];
  status: WordStatus;
  /** Known by the reader's hand, or by `PROMOTION`; either way only the reader undoes it. */
  knownBy?: 'reader' | 'listening' | 'practice';
  /** Pages it was woven on. */
  pages: number;
  peeks: number;
  /** Times listened to, and since the reader last unmarked it as known. */
  listens: number;
  recentListens: number;
  /** Lesson mode's practice: answers right and wrong, the last one, and the days it was right since the reader last unmarked it as known (up to `PROMOTION.rightDays`). */
  right: number;
  wrong: number;
  lastAnswer?: 'right' | 'wrong';
  rightDays: string[];
  firstSeen: string;
  lastSeen: string;
  /** Saved and known words: where they were met, latest first. */
  contexts: WordContext[];
}

export interface Vocab {
  /** By `normalizeLemma`. */
  words: Record<string, WordEntry>;
}

/**
 * What makes a word known without the reader saying so: listened to this many
 * times, or answered right in practice on this many days and right last time.
 * Only the reader undoes it, and then it's counted afresh.
 */
export const PROMOTION = { listens: 5, rightDays: 1 };
/** A word met only by listening (a lesson's word read aloud in the widget) is listed once it's been heard this many times. */
export const LISTED_LISTENS = 3;
export const MAX_CONTEXTS = 3;
const MAX_ENGLISH = 5;

export interface WordInfo {
  key: string;
  word: string;
  gloss: string;
  english: string;
}

/**
 * `listen` and `answer` name a word by its lemma or citation form ("chien" or
 * "le chien": practice uses a lesson kit's words, with their article), and
 * add it only with `info`.
 */
export type VocabEvent =
  | { kind: 'seen'; info: WordInfo; context?: WordContext }
  | { kind: 'peek'; key: string }
  | { kind: 'set'; info: WordInfo; status: WordStatus; context?: WordContext }
  | { kind: 'listen'; key: string; info?: WordInfo }
  | { kind: 'answer'; key: string; right: boolean; info?: WordInfo };

export const newVocab = (): Vocab => ({ words: {} });

const fresh = (info: WordInfo, day: string): WordEntry => ({
  word: info.word,
  gloss: info.gloss,
  english: [],
  status: 'seen',
  pages: 0,
  peeks: 0,
  listens: 0,
  recentListens: 0,
  right: 0,
  wrong: 0,
  rightDays: [],
  firstSeen: day,
  lastSeen: day,
  contexts: [],
});

/** The stored key for a lemma or citation form, if the word is there. */
function find(vocab: Vocab, key: string): string | undefined {
  const k = normalizeLemma(key);
  if (vocab.words[k]) return k;
  return Object.keys(vocab.words).find((w) => normalizeLemma(vocab.words[w]!.word) === k);
}

/** A stored word, with fields added since it was stored filled in. */
function entryAt(vocab: Vocab, key: string): WordEntry {
  const entry = vocab.words[key]!;
  entry.listens ??= 0;
  entry.recentListens ??= 0;
  entry.right ??= 0;
  entry.wrong ??= 0;
  entry.rightDays ??= [];
  return entry;
}

function upsert(vocab: Vocab, info: WordInfo, day: string): WordEntry {
  const key = find(vocab, info.key) ?? info.key;
  vocab.words[key] ??= fresh(info, day);
  const entry = entryAt(vocab, key);
  if (info.gloss) entry.gloss = info.gloss;
  if (info.english && !entry.english.includes(info.english)) {
    entry.english = [...entry.english, info.english].slice(-MAX_ENGLISH);
  }
  return entry;
}

function addContext(entry: WordEntry, context: WordContext | undefined) {
  if (!context || entry.status === 'seen') return;
  entry.contexts = [context, ...entry.contexts.filter((c) => c.sentence !== context.sentence)].slice(0, MAX_CONTEXTS);
}

/** Known by `PROMOTION`, unless it's known already. */
function promote(entry: WordEntry) {
  if (entry.status === 'known') return;
  const by =
    entry.recentListens >= PROMOTION.listens ? 'listening'
    : entry.lastAnswer === 'right' && entry.rightDays.length >= PROMOTION.rightDays ? 'practice'
    : undefined;
  if (!by) return;
  entry.status = 'known';
  entry.knownBy = by;
}

export function applyEvent(vocab: Vocab, event: VocabEvent, day: string): void {
  if (event.kind === 'peek' || event.kind === 'listen' || event.kind === 'answer') {
    const key = find(vocab, event.key);
    const entry = key ? entryAt(vocab, key) : event.kind !== 'peek' && event.info ? upsert(vocab, event.info, day) : undefined;
    if (!entry) return;
    if (event.kind === 'peek') entry.peeks++;
    else if (event.kind === 'listen') {
      entry.listens++;
      entry.recentListens++;
    } else {
      entry.lastAnswer = event.right ? 'right' : 'wrong';
      if (!event.right) entry.wrong++;
      else {
        entry.right++;
        if (!entry.rightDays.includes(day)) entry.rightDays = [...entry.rightDays, day].slice(-PROMOTION.rightDays);
      }
    }
    entry.lastSeen = day;
    promote(entry);
    return;
  }
  const entry = upsert(vocab, event.info, day);
  if (event.kind === 'set') {
    // Unmarked as known: counted afresh, so it isn't known again at the next listen.
    if (entry.status === 'known' && event.status !== 'known') {
      entry.recentListens = 0;
      entry.rightDays = [];
    }
    entry.status = event.status;
    if (event.status === 'known') entry.knownBy = 'reader';
    else delete entry.knownBy;
    addContext(entry, event.context);
    return;
  }
  entry.pages++;
  entry.lastSeen = day;
  addContext(entry, event.context);
}

export type ListedWord = WordEntry & { key: string };

/** Only listened to, and not yet `LISTED_LISTENS` times. */
const barelyMet = (e: WordEntry) => e.status === 'seen' && !e.pages && !e.right && !e.wrong && (e.listens ?? 0) < LISTED_LISTENS;

/** Woven on a page or answered in practice, not only listened to (a lesson's word read aloud). */
const worked = (e: WordEntry) => e.pages > 0 || e.right + e.wrong > 0;

/**
 * The Words page's lists: those matching `query` (the word, gloss or English),
 * woven or practised words first, then those only listened to, each latest
 * first (`byRecent`). A word in `listedAs` goes in that list whatever its
 * status (one just ☆'d or ✓'d stays where the reader clicked it).
 */
export function wordLists(vocab: Vocab, query = '', listedAs?: ReadonlyMap<string, WordStatus>): Record<WordStatus, ListedWord[]> {
  const q = query.trim().toLowerCase();
  const lists: Record<WordStatus, ListedWord[]> = { saved: [], known: [], seen: [] };
  for (const [key, e] of Object.entries(vocab.words)) {
    if (barelyMet(e)) continue;
    if (q && ![e.word, e.gloss, ...e.english].some((s) => s.toLowerCase().includes(q))) continue;
    lists[listedAs?.get(key) ?? e.status].push({ ...e, key });
  }
  for (const list of Object.values(lists)) byRecent(list).sort((a, b) => Number(worked(b)) - Number(worked(a)));
  return lists;
}

/**
 * Latest met first: by the day first met, then, that day, the one added to
 * the store last (its keys keep the order words were added). Sorts in place.
 */
export function byRecent(words: ListedWord[]): ListedWord[] {
  return words.reverse().sort((a, b) => b.firstSeen.localeCompare(a.firstSeen));
}

/** Saved words as Anki CSV: the word, then its gloss and the sentence it was saved in. */
export function ankiCsv(vocab: Vocab, statuses: WordStatus[] = ['saved']): string {
  const cell = (s: string) => `"${s.replace(/"/g, '""')}"`;
  // Anki reads the fields as HTML.
  const html = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return Object.values(vocab.words)
    .filter((e) => statuses.includes(e.status))
    .map((e) => {
      const sentence = e.contexts[0]?.sentence;
      const back = sentence ? `${html(e.gloss)}<br><i>${html(sentence)}</i>` : html(e.gloss);
      return `${cell(e.word)},${cell(back)}`;
    })
    .join('\n');
}

export const vocabKey = (lang: string) => `vocab|${lang}`;

/** A language's words in `chrome.storage.local`. Writes go one after another, each read afresh, since another tab may have written since. */
export function vocabStore(lang: string, now: () => Date = () => new Date()) {
  const key = vocabKey(lang);
  const load = async (): Promise<Vocab> => {
    const stored = (await browser.storage.local.get(key))[key] as Partial<Vocab> | undefined;
    return { ...newVocab(), ...stored };
  };
  let queue = Promise.resolve();
  return {
    key,
    load,
    record(events: VocabEvent[]): Promise<void> {
      if (!events.length) return queue;
      const day = dayOf(now());
      queue = queue
        .then(async () => {
          const vocab = await load();
          for (const e of events) applyEvent(vocab, e, day);
          await browser.storage.local.set({ [key]: vocab });
        })
        .catch(() => {});
      return queue;
    },
  };
}

export type VocabStore = ReturnType<typeof vocabStore>;
