import { beforeEach, describe, expect, it } from 'vitest';
import { fr } from '../src/languages/fr';
import type { WeaveLine } from '../src/weave/parse';
import { collectSegments, type Segment } from '../src/weave/segment';
import { selectReplacements } from '../src/weave/select';
import { applyReplacements, restoreAll, toggleSource } from '../src/weave/write';

const line = (original: string, replacement: string): WeaveLine => ({
  original,
  replacement,
  lemma: replacement,
  gender: 'm',
  pos: 'noun',
  gloss: original,
});

function weave(html: string, lines: WeaveLine[]) {
  document.body.innerHTML = html;
  const [seg] = collectSegments(document.body) as [Segment];
  const { accepted } = selectReplacements(seg.text, lines, { budget: 100 });
  const written = applyReplacements(seg, accepted, fr).length;
  return { seg, written, p: document.querySelector('p')! };
}

/** What the reader sees: woven spans show their French, the English is hidden. */
function visibleText(el: Element): string {
  let out = '';
  for (const n of el.childNodes) {
    if (n.nodeType === Node.TEXT_NODE) out += n.textContent;
    else if (n instanceof HTMLElement && !n.hidden) out += visibleText(n);
  }
  return out;
}

/** The page as it was: English restored in place of each woven span. */
function originalText(el: Element): string {
  let out = '';
  for (const n of el.childNodes) {
    if (n.nodeType === Node.TEXT_NODE) out += n.textContent;
    else if (n instanceof HTMLElement && n.classList.contains('tissage-target')) continue;
    else if (n instanceof HTMLElement) out += originalText(n);
  }
  return out;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('applyReplacements', () => {
  it('replaces a span in a single text node', () => {
    const { written, p } = weave('<p>The dog ran out of the house quickly.</p>', [
      line('The dog', 'Le chien'),
      line('of the house', 'de la maison'),
    ]);
    expect(written).toBe(2);
    expect(visibleText(p)).toBe('Le chien ran out de la maison quickly.');
    expect(originalText(p)).toBe('The dog ran out of the house quickly.');
  });

  it('builds the wrapper with metadata and a hidden original', () => {
    const { p } = weave('<p>She found the apple on the table.</p>', [line('the apple', 'la pomme')]);
    const w = p.querySelector('.tissage') as HTMLElement;
    expect(w.dataset).toMatchObject({ lemma: 'la pomme', gender: 'm', pos: 'noun' });
    expect(w.querySelector('.tissage-target')?.getAttribute('lang')).toBe('fr-FR');
    expect((w.querySelector('.tissage-source') as HTMLElement).hidden).toBe(true);
    expect(w.querySelector('.tissage-source')?.textContent).toBe('the apple');
  });

  it('keeps inline formatting inside the hidden original', () => {
    const { p } = weave('<p>We saw the <b>big</b> dog near the river today.</p>', [line('the big dog', 'le grand chien')]);
    expect(visibleText(p)).toBe('We saw le grand chien near the river today.');
    expect(p.querySelector('.tissage-source b')?.textContent).toBe('big');
  });

  it('leaves links working around a woven span inside them', () => {
    const { p } = weave('<p>If you have time this evening, read <a href="/x">the article about the war</a>.</p>', [
      line('the war', 'la guerre'),
    ]);
    const a = p.querySelector('a')!;
    expect(a.getAttribute('href')).toBe('/x');
    expect(a.querySelector('.tissage')).not.toBeNull();
    expect(visibleText(p)).toBe('If you have time this evening, read the article about la guerre.');
  });

  it('handles spans that cross into a link', () => {
    const { p } = weave('<p>The history of <a href="/x">the empire</a> is long and complicated.</p>', [
      line('of the empire', "de l'empire"),
    ]);
    expect(visibleText(p)).toBe("The history de l'empire is long and complicated.");
    expect(originalText(p)).toBe('The history of the empire is long and complicated.');
  });

  it('replaces the right occurrence of a repeated word', () => {
    const { p } = weave('<p>The dog saw the cat, and the dog barked loudly.</p>', [
      line('the dog', 'le chien'),
      line('the cat', 'le chat'),
    ]);
    expect(visibleText(p)).toBe('The dog saw le chat, and le chien barked loudly.');
  });

  it('writes adjacent spans in the same node', () => {
    const { p } = weave('<p>They walked through the dark forest all night long.</p>', [
      line('walked', 'marchèrent'),
      line('through the dark forest', 'à travers la sombre forêt'),
    ]);
    expect(visibleText(p)).toBe('They marchèrent à travers la sombre forêt all night long.');
  });

  it('writes nothing if the text changed since it was collected', () => {
    document.body.innerHTML = '<p>The dog ran out of the house quickly.</p>';
    const [seg] = collectSegments(document.body) as [Segment];
    const { accepted } = selectReplacements(seg.text, [line('The dog', 'Le chien')], { budget: 5 });
    seg.pieces[0]!.node.data = 'A cat ran out of the house quickly.';
    expect(applyReplacements(seg, accepted, fr)).toEqual([]);
    expect(document.querySelector('.tissage')).toBeNull();
  });

  it('skips woven content on a second pass', () => {
    weave('<p>The dog ran out of the house quickly.</p>', [line('The dog', 'Le chien')]);
    expect(collectSegments(document.body)[0]?.text).toBe(' ran out of the house quickly.');
  });
});

describe('toggleSource', () => {
  it('flips between French and English', () => {
    const { p } = weave('<p>She found the apple on the table.</p>', [line('the apple', 'la pomme')]);
    const w = p.querySelector('.tissage')!;
    toggleSource(w);
    expect(visibleText(p)).toBe('She found the apple on the table.');
    toggleSource(w);
    expect(visibleText(p)).toBe('She found la pomme on the table.');
  });
});

describe('numerals', () => {
  it('shows digits before the French', () => {
    document.body.innerHTML = '<p>There were Twelve boats and one apple here.</p>';
    const [seg] = collectSegments(document.body) as [Segment];
    const { accepted } = selectReplacements(seg.text, [line('Twelve', 'douze'), line('one apple', 'Une pomme')], { budget: 10 });
    accepted[0]!.numeral = '12';
    accepted[1]!.numeral = '1';
    applyReplacements(seg, accepted, fr);
    const p = document.querySelector('p')!;
    expect(visibleText(p)).toBe('There were 12 (douze) boats and 1 (une pomme) here.');
    expect(originalText(p)).toBe('There were Twelve boats and one apple here.');
  });
});

describe('restoreAll', () => {
  it('puts the original markup back and clears woven marks', () => {
    const html = '<p>We saw the <b>big</b> dog near <a href="/r">the river</a> today.</p>';
    const { p } = weave(html, [line('the big dog', 'le grand chien'), line('the river', 'la rivière')]);
    p.setAttribute('data-tissage', '');
    restoreAll(document);
    expect(document.body.innerHTML).toBe(html);
    expect(collectSegments(document.body)).toHaveLength(1);
  });
});

describe('several segments in one block', () => {
  const sentence = (i: number) => `Sentence ${i} says the dog ran out of the house quickly today. `;
  const html = `<p>${Array.from({ length: 12 }, (_, i) => sentence(i)).join('')}<b>bold</b> end of the paragraph here.</p>`;

  for (const order of ['forwards', 'backwards'] as const) {
    it(`writes every segment when applied ${order}`, () => {
      document.body.innerHTML = html;
      const segs = collectSegments(document.body);
      expect(segs.length).toBeGreaterThan(1);
      const plans = segs.map((seg) => {
        const { accepted } = selectReplacements(seg.text, [line('the dog', 'le chien'), line('the house', 'la maison')], { budget: 100 });
        return { seg, accepted };
      });
      if (order === 'backwards') plans.reverse();
      const written = plans.reduce((n, { seg, accepted }) => n + applyReplacements(seg, accepted, fr).length, 0);
      expect(written).toBe(segs.length * 2);
      const p = document.querySelector('p')!;
      expect(originalText(p)).toBe(html.replace(/<\/?[bp]>/g, ''));
    });
  }
});
