import { setDirection } from '../direction';
import { icon, iconButton } from '../icons';
import { rubyNodes, withoutReadings } from '../ruby';
import type { Definition } from './definitions';
import { STATUS_TIPS, type ListedWord, type WordStatus } from './store';

/**
 * A word as the Words page and the widget's Words tab show it: the word with
 * a play button, its definition (the gloss until one is written) and an example
 * with a play button and its English, then save (a star) and known (a tick).
 */
export interface WordRowDeps {
  doc: Document;
  lang: string;
  definition?: Definition;
  /** Reads `text` aloud; none = no play buttons. */
  say?(text: string, slow: boolean): void;
  /** Only these texts get a play button (a voiceless language's recorded words). */
  can?(text: string): boolean;
  /** The word was read aloud. */
  onListen(): void;
  onSet(status: WordStatus): void;
}

function el<K extends keyof HTMLElementTagNameMap>(doc: Document, tag: K, className = '', text?: string): HTMLElementTagNameMap[K] {
  const node = doc.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Target-language text, with its readings and direction. */
function inLanguage(deps: WordRowDeps, text: string, className = ''): HTMLSpanElement {
  const span = el(deps.doc, 'span', className);
  span.append(...rubyNodes(deps.doc, text));
  span.lang = deps.lang;
  return setDirection(span, text);
}

function sayButton(deps: WordRowDeps, text: string, slow: boolean, onSay?: () => void): HTMLButtonElement[] {
  const say = deps.say;
  if (!say || (deps.can && !deps.can(text))) return [];
  const button = el(deps.doc, 'button', 'say');
  iconButton(button, 'play', `Listen: ${withoutReadings(text)}`, 9);
  button.type = 'button';
  button.addEventListener('click', () => {
    say(text, slow);
    onSay?.();
  });
  return [button];
}

function toggle(deps: WordRowDeps, word: ListedWord, status: WordStatus, aria: string) {
  const on = word.status === status;
  const button = el(deps.doc, 'button', status === 'known' ? 'toggle known' : 'toggle');
  button.append(icon(deps.doc, status === 'known' ? 'check' : 'star', 14));
  button.type = 'button';
  button.setAttribute('aria-pressed', String(on));
  button.setAttribute('aria-label', `${aria}: ${withoutReadings(word.word)}`);
  button.title = status === 'saved' ? (on ? STATUS_TIPS.saved : STATUS_TIPS.save) : on ? STATUS_TIPS.known : STATUS_TIPS.know;
  button.addEventListener('click', () => deps.onSet(on ? 'seen' : status));
  return button;
}

export function wordRow(word: ListedWord, deps: WordRowDeps): HTMLLIElement {
  const li = el(deps.doc, 'li');
  const head = el(deps.doc, 'div', 'head');
  head.append(inLanguage(deps, word.word, 'word'), ...sayButton(deps, word.word, true, deps.onListen));
  const body = el(deps.doc, 'div', 'body');
  body.append(head, el(deps.doc, 'p', 'definition', deps.definition?.definition || word.gloss));
  const found = deps.definition;
  if (found?.example) {
    const example = el(deps.doc, 'p', 'example');
    example.append(inLanguage(deps, found.example), ...sayButton(deps, found.example, false));
    body.append(example);
    if (found.english) body.append(el(deps.doc, 'p', 'english', found.english));
  }
  const actions = el(deps.doc, 'div', 'actions');
  actions.append(toggle(deps, word, 'saved', 'Save to learn'), toggle(deps, word, 'known', 'I know this'));
  li.append(body, actions);
  return li;
}
