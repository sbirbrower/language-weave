import { STATUS_TIPS, type WordStatus } from './vocab/store';
import { WOVEN_CLASS } from './weave/segment';
import { FR_CLASS, SHOW_SOURCE_CLASS } from './weave/write';

export const WORD_BUTTON_ATTR = 'data-tissage-say';

/** How long the buttons stay after the pointer leaves the word, so they can be reached. */
export const HIDE_DELAY_MS = 300;
const SIZE = 22;
const GAP = 2;

const STYLES = `
:host { all: initial; }
.bar { position: fixed; z-index: 2147483646; display: flex; gap: ${GAP}px; }
.bar[hidden], button[hidden] { display: none; }
button {
  all: unset; width: ${SIZE}px; height: ${SIZE}px; border-radius: 50%;
  display: grid; place-items: center; cursor: pointer; font-size: 12px; line-height: 1;
  background: #ffffff; color: #1c1c1e; box-shadow: 0 1px 4px rgb(0 0 0 / 0.25);
}
button:hover { background: #2f5bd3; color: #ffffff; }
button[aria-pressed="true"] { background: #2f5bd3; color: #ffffff; }
button:focus-visible { outline: 2px solid #2f5bd3; outline-offset: 1px; }
@media (prefers-color-scheme: dark) {
  button { background: #1f1f22; color: #f2f2f4; }
  button:hover, button[aria-pressed="true"] { background: #8fb0ff; color: #10172a; }
}
`;

/** Where the buttons go: just after the word's last line, kept inside the window. */
export function buttonSpot(word: { right: number; top: number; height: number }, view: { width: number; height: number }, width = SIZE) {
  return {
    left: Math.min(word.right + GAP, view.width - width),
    top: Math.max(0, Math.min(word.top + (word.height - SIZE) / 2, view.height - SIZE)),
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
  const host = doc.createElement('div');
  host.setAttribute(WORD_BUTTON_ATTR, '');
  const root = host.attachShadow({ mode: 'open' });
  const style = doc.createElement('style');
  style.textContent = STYLES;
  const bar = doc.createElement('div');
  bar.className = 'bar';
  bar.hidden = true;
  const button = (label: string, name: string) => {
    const b = doc.createElement('button');
    b.textContent = label;
    b.dataset.action = name;
    bar.append(b);
    return b;
  };
  const say = button('🔊', 'say');
  const save = button('☆', 'save');
  const know = button('✓', 'know');
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
    save.textContent = status === 'saved' ? '★' : '☆';
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
    const spot = buttonSpot(last, { width: doc.documentElement.clientWidth || win.innerWidth, height: win.innerHeight }, shown * SIZE + (shown - 1) * GAP);
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
