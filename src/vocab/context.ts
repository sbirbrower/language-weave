import { BLOCK_ATTR, WOVEN_CLASS } from '../weave/segment';
import { EN_CLASS, FR_CLASS, SHOW_SOURCE_CLASS } from '../weave/write';

/** Longest stretch kept either side of the word when its sentence runs on. */
const REACH = 150;

/** What a woven word shows: its target text without readings, or its English while flipped. */
function shown(wrapper: Element, forceTarget = false): string {
  if (!forceTarget && wrapper.classList.contains(SHOW_SOURCE_CLASS)) {
    return wrapper.querySelector(`:scope > .${EN_CLASS}`)?.textContent ?? '';
  }
  const target = wrapper.querySelector<HTMLElement>(`:scope > .${FR_CLASS}`);
  return target?.dataset.say ?? target?.textContent ?? '';
}

const squash = (s: string) => s.replace(/\s+/gu, ' ');

/**
 * The sentence a woven word is in, as the page shows it (other woven words in
 * the language or English, as they're showing), and where the word is in it.
 */
export function sentenceAround(wrapper: HTMLElement): { sentence: string; start: number; end: number } | undefined {
  const block = wrapper.closest(`[${BLOCK_ATTR}]`) ?? wrapper.parentElement;
  if (!block) return undefined;
  let text = '';
  let start = -1;
  let end = -1;
  const walk = (node: Node) => {
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) text += child.nodeValue ?? '';
      else if (child instanceof Element && child.classList.contains(WOVEN_CLASS)) {
        if (child === wrapper) start = text.length;
        text += shown(child, child === wrapper);
        if (child === wrapper) end = text.length;
      } else if (child instanceof Element && !(child as HTMLElement).hidden) walk(child);
    }
  };
  walk(block);
  if (start < 0) return undefined;

  let from = 0;
  // A full stop ends a sentence before a space ("e.g." and "3.5" don't); a full-width one (。) needs none.
  for (const m of text.slice(0, start).matchAll(/\p{Sentence_Terminal}+["”’»)\]]*\s|[。！？｡]+[」』）]*/gu)) from = m.index + m[0].length;
  const stop = text.slice(end).match(/\p{Sentence_Terminal}/u);
  let to = stop ? end + stop.index! + 1 : text.length;
  from = Math.max(from, start - REACH);
  to = Math.min(to, end + REACH);

  const before = squash(text.slice(from, start)).trimStart();
  const word = squash(text.slice(start, end));
  const after = squash(text.slice(end, to)).trimEnd();
  return { sentence: before + word + after, start: before.length, end: before.length + word.length };
}
