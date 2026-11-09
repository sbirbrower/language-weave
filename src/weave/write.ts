import { setDirection } from '../direction';
import type { LanguageConfig } from '../languages';
import { readingsInBrackets, rubyNodes, withoutReadings } from '../ruby';
import { BLOCK_ATTR, relocate, toDomPoint, WOVEN_CLASS, type Segment } from './segment';
import type { Replacement } from './select';

export const FR_CLASS = `${WOVEN_CLASS}-target`;
export const EN_CLASS = `${WOVEN_CLASS}-source`;
/** Set on the wrapper while the English is showing. */
export const SHOW_SOURCE_CLASS = `${WOVEN_CLASS}--source`;

function buildWrapper(doc: Document, r: Replacement, lang: LanguageConfig, original: DocumentFragment) {
  const wrapper = doc.createElement('span');
  wrapper.className = WOVEN_CLASS;
  wrapper.dataset.lemma = r.lemma;
  wrapper.dataset.gender = r.gender;
  wrapper.dataset.pos = r.pos;
  wrapper.dataset.gloss = r.gloss;
  const genderLabel = r.gender === '-' ? '' : ` (${r.gender})`;
  wrapper.title = `${r.original} — ${readingsInBrackets(r.lemma)}${genderLabel}: ${r.gloss}`;

  const target = doc.createElement('span');
  target.className = FR_CLASS;
  target.lang = lang.bcp47;
  // A numeral leads, so the French after it starts lowercase: "1 (une pomme)".
  const text = r.numeral
    ? `${r.numeral} (${r.replacement.charAt(0).toLowerCase()}${r.replacement.slice(1)})`
    : r.replacement;
  target.append(...rubyNodes(doc, text));
  // Right to left, and isolated from the English around it, for a script that's written so (Hebrew).
  setDirection(target, text);
  // What the 🔊 reads: the text without its readings, which ruby would add to textContent.
  target.dataset.say = withoutReadings(text);

  const source = doc.createElement('span');
  source.className = EN_CLASS;
  source.hidden = true;
  source.append(original);

  wrapper.append(target, source);
  return wrapper;
}

export interface Written {
  replacement: Replacement;
  element: HTMLElement;
}

/**
 * Writes replacements into the DOM. Each English span is moved, with its
 * markup, into a hidden child of the wrapper, and the French goes in its
 * place; `innerHTML` is never touched. Returns what was written in document
 * order, or nothing if the segment's text changed since it was collected.
 */
export function applyReplacements(seg: Segment, replacements: Replacement[], lang: LanguageConfig): Written[] {
  if (replacements.length === 0 || !relocate(seg)) return [];
  const doc = seg.block.ownerDocument;

  // Work backwards so earlier offsets stay valid: extracting a range only
  // changes text at or after its start.
  const ordered = [...replacements].sort((a, b) => b.start - a.start);
  const written: Written[] = [];
  for (const r of ordered) {
    const start = toDomPoint(seg, r.start, 'start');
    const end = toDomPoint(seg, r.end, 'end');
    const range = doc.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);
    const original = range.extractContents();
    const element = buildWrapper(doc, r, lang, original);
    range.insertNode(element);
    written.push({ replacement: r, element });
  }
  return written.reverse();
}

/** Puts the English back everywhere under `root` and forgets which blocks were woven. */
export function restoreAll(root: ParentNode): void {
  for (const wrapper of root.querySelectorAll(`.${WOVEN_CLASS}`)) {
    const source = wrapper.querySelector(`:scope > .${EN_CLASS}`);
    const parent = wrapper.parentNode;
    wrapper.replaceWith(...(source ? Array.from(source.childNodes) : []));
    parent?.normalize();
  }
  for (const block of root.querySelectorAll(`[${BLOCK_ATTR}]`)) block.removeAttribute(BLOCK_ATTR);
}

/** Click handler target: flips one woven span between French and English. */
export function toggleSource(wrapper: Element): void {
  const showing = wrapper.classList.toggle(SHOW_SOURCE_CLASS);
  const target = wrapper.querySelector<HTMLElement>(`:scope > .${FR_CLASS}`);
  const source = wrapper.querySelector<HTMLElement>(`:scope > .${EN_CLASS}`);
  if (target) target.hidden = showing;
  if (source) source.hidden = !showing;
}
