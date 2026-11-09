/**
 * Text direction, for a language written right to left (Hebrew, Arabic). It's found from the text,
 * so nothing asks which language it is: an element whose letters are mostly in such a script gets
 * dir="rtl", which aligns a line to the right, keeps its punctuation at its end and, inside English,
 * isolates it so neutral characters around it stay put. Readings (`base《reading》`) don't count,
 * since a romanisation is Latin; `scriptStyles` turns the element left to right again when only the
 * romanisation shows.
 */

import { RTL_CLASS, withoutReadings } from './ruby';

const RTL_LETTER = /(?=\p{L})[\p{Script=Hebrew}\p{Script=Arabic}\p{Script=Syriac}\p{Script=Thaana}]/gu;

/** Whether `text`, readings left out, has more letters of a right-to-left script than of any other. */
export function isRtl(text: string): boolean {
  const plain = withoutReadings(text);
  const rtl = plain.match(RTL_LETTER)?.length ?? 0;
  return rtl > 0 && rtl > (plain.match(/\p{L}/gu)?.length ?? 0) - rtl;
}

/** Sets `node` right to left when `text` (what it shows, with readings as written) is; else leaves it as it is. */
export function setDirection<T extends HTMLElement>(node: T, text: string): T {
  if (isRtl(text)) {
    node.dir = 'rtl';
    node.classList.add(RTL_CLASS);
  }
  return node;
}
