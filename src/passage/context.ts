import { headingElements, headingText, isHeading } from '../reading/collect';
import type { Segment } from '../weave/segment';

/** One section of the page: '' is the lead, before the first heading. */
export interface PageSection {
  heading: string;
  /** Paragraphs, one per line, clipped to `CONTEXT_WORDS`. */
  text: string;
}

export interface PassageContext {
  /** What the passage prompt sees: the start of the lead, then the section on screen under "== heading ==". */
  text: string;
  heading: string;
}

// The start of the lead, before another section: enough to name the subject.
const SUBJECT_WORDS = 80;
export const CONTEXT_WORDS = 900;
// A shorter section on screen is read with the ones after it, so the passage has facts to use.
const MIN_SECTION_WORDS = 150;

const SKIP_SECTIONS = new Set(['see also', 'references', 'external links', 'further reading', 'notes', 'bibliography', 'sources', 'citations', 'footnotes', 'gallery']);

const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;

/** Whole paragraphs from the start, up to about `n` words. */
export function firstWords(text: string, n: number): string {
  const kept: string[] = [];
  let total = 0;
  for (const para of text.split('\n').map((p) => p.trim()).filter(Boolean)) {
    const words = wordCount(para);
    if (kept.length && total + words > n) break;
    kept.push(para);
    total += words;
  }
  return kept.join('\n');
}

/** The lead's first sentences, up to about `SUBJECT_WORDS`: they name the subject. */
function leadStart(lead: string): string {
  const words = (lead.split('\n').find((p) => p.trim()) ?? '').trim().split(/\s+/);
  if (words.length <= SUBJECT_WORDS) return words.join(' ');
  const cut = words.slice(0, SUBJECT_WORDS).join(' ');
  const end = cut.search(/[.!?](?=[^.!?]*$)/);
  return end > 0 ? cut.slice(0, end + 1) : `${cut}…`;
}

/** The page's paragraphs under their headings, in page order; the title (h1) doesn't start one, reference sections are left out. */
function groupSections(root: Element, segments: Segment[]): Array<{ heading: string; paras: Segment[] }> {
  const marks = headingElements(root).filter((h) => h.tagName !== 'H1');
  const groups: Array<{ heading: string; paras: Segment[] }> = [{ heading: '', paras: [] }];
  let next = 0;
  for (const s of segments) {
    if (isHeading(s)) continue;
    while (next < marks.length && marks[next]!.compareDocumentPosition(s.block) & Node.DOCUMENT_POSITION_FOLLOWING) {
      groups.push({ heading: headingText(marks[next]!), paras: [] });
      next++;
    }
    groups[groups.length - 1]!.paras.push(s);
  }
  return groups.filter((g) => g.paras.length && !SKIP_SECTIONS.has(g.heading.toLowerCase()));
}

export function pageSections(root: Element, segments: Segment[]): PageSection[] {
  return groupSections(root, segments).map((g) => ({ heading: g.heading, text: firstWords(g.paras.map((p) => p.text).join('\n'), CONTEXT_WORDS) }));
}

/**
 * The page's sections as their paragraphs' segments, each cut into chunks of
 * whole paragraphs up to about `maxWords`, in page order: what lesson mode
 * marks, one chunk per request, so a long section is marked all the way down.
 */
export function sectionChunks(root: Element, segments: Segment[], maxWords = CONTEXT_WORDS): Array<{ heading: string; paras: Segment[] }> {
  return groupSections(root, segments).flatMap((g) => {
    const chunks: Array<{ heading: string; paras: Segment[] }> = [];
    let words = Infinity;
    for (const p of g.paras) {
      const n = wordCount(p.text);
      if (words + n > maxWords) {
        chunks.push({ heading: g.heading, paras: [] });
        words = 0;
      }
      chunks.at(-1)!.paras.push(p);
      words += n;
    }
    return chunks;
  });
}

/** The index in `pageSections` of the section with the most paragraphs on screen (the first, on a tie), or 0. */
export function sectionOnScreen(root: Element, segments: Segment[], onScreen: (el: Element) => boolean): number {
  let best = 0;
  let most = 0;
  groupSections(root, segments).forEach((g, i) => {
    const n = g.paras.filter((p) => onScreen(p.block)).length;
    if (n > most) [best, most] = [i, n];
  });
  return best;
}

/**
 * What the passage is about: the section on screen (with the ones after it
 * when it's short), after the lead's first lines so the subject is named.
 */
export function sectionContext(sections: PageSection[], focus: number): PassageContext {
  const i = Math.min(Math.max(0, focus), sections.length - 1);
  const s = sections[i];
  if (!s) return { text: '', heading: '' };
  const parts = [s.text];
  for (let j = i + 1; j < sections.length && wordCount(parts.join('\n')) < MIN_SECTION_WORDS; j++) {
    parts.push(`== ${sections[j]!.heading} ==\n${sections[j]!.text}`);
  }
  const lead = sections[0]?.heading === '' && i > 0 ? leadStart(sections[0].text) : '';
  const body = firstWords(parts.join('\n'), CONTEXT_WORDS - wordCount(lead));
  const text = s.heading ? `${lead ? `${lead}\n\n` : ''}== ${s.heading} ==\n${body}` : body;
  return { text, heading: s.heading };
}

/** Page mode: fewer words highlighted than this aren't a passage (one word is looked up, not summarised). */
export const MIN_SELECTION_WORDS = 6;

/**
 * Page mode: text the reader highlighted, as one more section after the
 * page's, under the heading of the section it's in, so the passage is about it
 * alone (nothing comes after it to pad it out).
 */
export function withSelection(sections: PageSection[], at: number, text: string): { sections: PageSection[]; focus: number } {
  const heading = sections[at]?.heading ?? '';
  return { sections: [...sections, { heading, text: firstWords(text, CONTEXT_WORDS) }], focus: sections.length };
}

/** Highlighted text tidied for the prompt, or '' when it's too short to write about. */
export function selectionText(raw: string): string {
  const text = raw.split('\n').map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
  return wordCount(text) >= MIN_SELECTION_WORDS ? text : '';
}
