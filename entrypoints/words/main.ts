import { browser } from 'wxt/browser';
import { BUILD_ID } from '@/src/build';
import { languages, scriptViewFor } from '@/src/languages';
import type { ResponseFor } from '@/src/messages';
import { recordingKey } from '@/src/recordings';
import { SCRIPT_ATTR, scriptStyles } from '@/src/ruby';
import { getSettings, type Settings } from '@/src/settings';
import { createSpeaker, type Speaker } from '@/src/speaker';
import type { Definition } from '@/src/vocab/definitions';
import { ankiCsv, PROMOTION, vocabKey, vocabStore, wordLists, type ListedWord } from '@/src/vocab/store';
import { wordRow } from '@/src/vocab/wordRows';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const languageSelect = $<HTMLSelectElement>('language');
const search = $<HTMLInputElement>('search');

/** Seen words can run to thousands: this many are drawn, the rest found by searching. */
const SEEN_SHOWN = 200;

document.head.append(Object.assign(document.createElement('style'), { textContent: scriptStyles(false) }));
$('listens').textContent = String(PROMOTION.listens);

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** One speaker per language, so a word and an example never play at once; a voiceless language reads only its recorded words. */
const speakers = new Map<string, { speaker: Speaker; recorded?: Set<string> }>();
function speakerFor(lang: string) {
  let entry = speakers.get(lang);
  if (!entry) {
    const recorded = languages[lang]?.noVoice ? new Set<string>() : undefined;
    if (recorded)
      void (browser.runtime.sendMessage({ type: 'recorded-words', buildId: BUILD_ID, lang }) as Promise<ResponseFor['recorded-words']>).then((res) => {
        if (!res?.ok) return;
        res.value.forEach((w) => recorded.add(w));
        void render();
      });
    const speaker = createSpeaker({
      fetch: (text, slow) => browser.runtime.sendMessage({ type: 'speak', buildId: BUILD_ID, lang, text, slow }),
      onSpend: () => {},
      can: recorded && ((text) => recorded.has(recordingKey(text))),
    });
    entry = { speaker, recorded };
    speakers.set(lang, entry);
  }
  return entry;
}

function row(word: ListedWord): HTMLLIElement {
  const lang = languageSelect.value;
  const { speaker, recorded } = speakerFor(lang);
  const info = { key: word.key, word: word.word, gloss: word.gloss, english: '' };
  const store = vocabStore(lang);
  return wordRow(word, {
    doc: document,
    lang,
    definition: definitions.get(definitionsKey(word.word)),
    say: (text, slow) => speaker.play([text], () => {}, (error) => console.warn(error), slow),
    can: recorded && ((text) => recorded.has(recordingKey(text))),
    onListen: () => void store.record([{ kind: 'listen', key: word.key, info }]),
    onSet: (status) => void store.record([{ kind: 'set', info, status }]),
  });
}

/** Definitions and examples got so far (`src/vocab/definitions.ts`), by language and word; asked for once a page. */
const definitions = new Map<string, Definition>();
const asked = new Set<string>();
const definitionsKey = (word: string) => `${languageSelect.value}|${word}`;

/** Asks for the shown words' definitions not yet got, then draws the list again. */
async function define(words: ListedWord[]) {
  const lang = languageSelect.value;
  const wanted = words.filter((w) => !asked.has(definitionsKey(w.word)));
  if (!wanted.length) return;
  wanted.forEach((w) => asked.add(definitionsKey(w.word)));
  const msg = { type: 'define-words', buildId: BUILD_ID, lang, level: settings.level, words: wanted.map((w) => ({ word: w.word, gloss: w.gloss })) };
  const res = (await browser.runtime.sendMessage(msg).catch((e: unknown) => ({ ok: false, error: String(e) }))) as ResponseFor['define-words'];
  if (!res.ok) {
    console.warn(res.error);
    return;
  }
  for (const [word, d] of Object.entries(res.value.definitions)) definitions.set(`${lang}|${word}`, d);
  if (languageSelect.value === lang) void render();
}

let settings: Settings;

async function render() {
  const lang = languageSelect.value;
  const vocab = await vocabStore(lang).load();
  if (languageSelect.value !== lang) return;
  const config = languages[lang];
  const view = config && scriptViewFor(config, settings.level, settings.scriptViews ?? {});
  if (view) document.documentElement.setAttribute(SCRIPT_ATTR, view);
  else document.documentElement.removeAttribute(SCRIPT_ATTR);

  const all = wordLists(vocab);
  const lists = wordLists(vocab, search.value);
  const stat = (value: number, label: string) => {
    const box = el('div', 'stat');
    box.append(el('strong', '', String(value)), el('span', '', label));
    return box;
  };
  $('stats').replaceChildren(stat(all.saved.length, 'saved'), stat(all.known.length, 'known'), stat(all.seen.length, 'seen only'));

  const empty = (text: string) => el('li', 'muted empty', text);
  $('saved').replaceChildren(...(lists.saved.length ? lists.saved.map(row) : [empty(search.value ? 'None found.' : 'None yet: ☆ a woven word to save it.')]));
  $('known').replaceChildren(...(lists.known.length ? lists.known.map(row) : [empty(search.value ? 'None found.' : 'None yet.')]));
  const seen = lists.seen.slice(0, SEEN_SHOWN);
  const more = lists.seen.length - seen.length;
  $('seen').replaceChildren(...seen.map(row), ...(more > 0 ? [empty(`And ${more} more: search to find one.`)] : []));
  $('seenSummary').textContent = `Seen on pages or in lessons, not saved or known (${lists.seen.length})`;
  // Searching opens the fold, so a word found there shows.
  if (search.value && lists.seen.length) $<HTMLDetailsElement>('seenFold').open = true;
  // Seen words, which can be many, only once their fold is open.
  void define([...lists.saved, ...lists.known, ...($<HTMLDetailsElement>('seenFold').open ? seen : [])]);
  $<HTMLButtonElement>('export').disabled = all.saved.length === 0;
}

$('export').addEventListener('click', async () => {
  const lang = languageSelect.value;
  const csv = ankiCsv(await vocabStore(lang).load());
  const link = el('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  link.download = `language-weave-${lang}-saved.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
});

async function init() {
  settings = await getSettings();
  languageSelect.replaceChildren(
    ...Object.values(languages).map((l) => Object.assign(el('option', '', `${l.flag} ${l.displayName}`), { value: l.code, selected: l.code === settings.language })),
  );
  languageSelect.addEventListener('change', () => void render());
  $('seenFold').addEventListener('toggle', () => void render());
  search.addEventListener('input', () => void render());
  // A word saved on a page in another tab shows here at once.
  browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && vocabKey(languageSelect.value) in changes) void render();
  });
  await render();
}

void init();
