import { icon, type IconName } from './icons';
import { themeCss, themed } from './theme';
import { STATUS_TIPS, type WordStatus } from './vocab/store';
import { WOVEN_CLASS } from './weave/segment';
import { FR_CLASS, SHOW_SOURCE_CLASS } from './weave/write';

export const WORD_BUTTON_ATTR = 'data-tissage-say';

/** How long the buttons stay after the pointer leaves the word, so they can be reached. */
export const HIDE_DELAY_MS = 300;
const SIZE = 26;
const GAP = 2;
const PAD = 3;
/** The strip's height: a button and its padding. */
const BAR = SIZE + 2 * PAD;

/** A dark strip of round buttons, as in the mock-ups: they read against any page. */
const STYLES = `
${themeCss(':host')}
:host { all: initial; }
.bar {
  position: fixed; z-index: 2147483646; display: flex; gap: ${GAP}px; padding: ${PAD}px; border-radius: 8px;
  background: #1b2a44; box-shadow: 0 4px 14px rgb(27 42 68 / 0.25);
}
.bar[hidden], button[hidden] { display: none; }
button {
  all: unset; width: ${SIZE}px; height: ${SIZE}px; border-radius: 6px;
  display: grid; place-items: center; cursor: pointer; color: #ffffff;
}
button:hover { background: rgb(255 255 255 / 0.14); }
button[aria-pressed="true"] { color: #1b2a44; background: #ffe58a; }
button[data-action="know"][aria-pressed="true"] { color: #ffffff; background: #2e7d5b; }
button:focus-visible { outline: 2px solid #ffe58a; outline-offset: 1px; }
`;

/** Where the buttons go: just after the word's last line, kept inside the window. */
export function buttonSpot(word: { right: number; top: number; height: number }, view: { width: number; height: number }, width = SIZE + 2 * PAD) {
  return {
    left: Math.min(word.right + GAP, view.width - width),
    top: Math.max(0, Math.min(word.top + (word.height - BAR) / 2, view.height - BAR)),
  };
}

export interface WordActions {
  /** Reads the word aloud, when `canSay` allows (no voice or recording: no 🔊): offers 🔊. */
  say?: (word: HTMLElement) => void;
  canSay?: (word: HTMLElement) => boolean;
  /** The word's status in the reader's list, and setting it: offers Save and Known. */
  status?: (word: HTMLElement) => WordStatus | undefined;
  set?: (word: HTMLElement, status: WordStatus) => void;
}

export interface WordButton {
  stop(): void;
}

/**
 * Buttons beside the woven word under the pointer, while it shows the woven
 * language: 🔊 reads it aloud, ☆ saves it to learn, ✓ marks it known (each a
 * toggle, explained on hover). Clicking the word itself flips it to English (`content.ts`).
 */
export function showWordButton(doc: Document, actions: WordActions): WordButton {
  removeWordButton(doc);
  const win = doc.defaultView!;
  const host = themed(doc.createElement('div'));
  host.setAttribute(WORD_BUTTON_ATTR, '');
  const root = host.attachShadow({ mode: 'open' });
  const style = doc.createElement('style');
  style.textContent = STYLES;
  const bar = doc.createElement('div');
  bar.className = 'bar';
  bar.hidden = true;
  const button = (name: IconName, action: string) => {
    const b = doc.createElement('button');
    b.append(icon(doc, name, 15));
    b.dataset.action = action;
    bar.append(b);
    return b;
  };
  const say = button('play', 'say');
  const save = button('star', 'save');
  const know = button('check', 'know');
  root.append(style, bar);
  // Outside <body>, so nothing that walks the page's content finds it.
  doc.documentElement.append(host);

  let word: HTMLElement | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const text = () => wordText(word);

  function hide() {
    clearTimeout(timer);
    bar.hidden = true;
    word = undefined;
  }
  const hideSoon = () => {
    clearTimeout(timer);
    timer = setTimeout(hide, HIDE_DELAY_MS);
  };

  function drawStatus() {
    const status = word && actions.status?.(word);
    save.setAttribute('aria-pressed', String(status === 'saved'));
    save.setAttribute('aria-label', status === 'saved' ? `Saved: ${text()}` : `Save to learn: ${text()}`);
    save.title = status === 'saved' ? STATUS_TIPS.saved : STATUS_TIPS.save;
    know.setAttribute('aria-pressed', String(status === 'known'));
    know.setAttribute('aria-label', status === 'known' ? `Known: ${text()}` : `I know this: ${text()}`);
    know.title = status === 'known' ? STATUS_TIPS.known : STATUS_TIPS.know;
  }

  const onOver = (e: Event) => {
    const target = (e.target as Element | null)?.closest?.(`.${WOVEN_CLASS}`) as HTMLElement | null | undefined;
    if (!target || target.classList.contains(SHOW_SOURCE_CLASS)) return;
    clearTimeout(timer);
    word = target;
    const rects = target.getClientRects();
    const last = rects[rects.length - 1];
    if (!last || !text()) return hide();
    say.hidden = !actions.say || actions.canSay?.(target) === false;
    save.hidden = know.hidden = !actions.set;
    const shown = [say, save, know].filter((b) => !b.hidden).length;
    if (!shown) return hide();
    say.setAttribute('aria-label', `Hear it: ${text()}`);
    drawStatus();
    const spot = buttonSpot(last, { width: doc.documentElement.clientWidth || win.innerWidth, height: win.innerHeight }, shown * SIZE + (shown - 1) * GAP + 2 * PAD);
    bar.style.left = `${spot.left}px`;
    bar.style.top = `${spot.top}px`;
    bar.hidden = false;
  };
  const onOut = (e: Event) => {
    if ((e.target as Element | null)?.closest?.(`.${WOVEN_CLASS}`)) hideSoon();
  };

  // A click anywhere but the buttons (the word too: it flips to English) hides them.
  const onClick = (e: Event) => {
    if (e.target !== host) hide();
  };

  doc.addEventListener('mouseover', onOver, { passive: true });
  doc.addEventListener('mouseout', onOut, { passive: true });
  doc.addEventListener('click', onClick, true);
  // Fixed to the window, so it would drift off the word.
  win.addEventListener('scroll', hide, { passive: true, capture: true });
  bar.addEventListener('mouseenter', () => clearTimeout(timer));
  bar.addEventListener('mouseleave', hideSoon);
  // Stays, so the word can be heard again.
  say.addEventListener('click', (e) => {
    e.stopPropagation();
    if (word) actions.say?.(word);
  });
  const toggle = (status: WordStatus) => (e: Event) => {
    e.stopPropagation();
    if (!word || !actions.set) return;
    actions.set(word, actions.status?.(word) === status ? 'seen' : status);
    drawStatus();
  };
  save.addEventListener('click', toggle('saved'));
  know.addEventListener('click', toggle('known'));

  return {
    stop() {
      clearTimeout(timer);
      doc.removeEventListener('mouseover', onOver);
      doc.removeEventListener('mouseout', onOut);
      doc.removeEventListener('click', onClick, true);
      win.removeEventListener('scroll', hide, { capture: true });
      host.remove();
    },
  };
}

/** What a woven word reads aloud: its target text without readings. */
export function wordText(word: Element | undefined): string {
  const target = word?.querySelector<HTMLElement>(`:scope > .${FR_CLASS}`);
  return (target?.dataset.say ?? target?.textContent)?.trim() ?? '';
}

export function removeWordButton(doc: Document) {
  for (const host of doc.querySelectorAll(`[${WORD_BUTTON_ATTR}]`)) host.remove();
}
