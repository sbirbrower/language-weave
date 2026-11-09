import { beforeEach, describe, expect, it } from 'vitest';
import { fr } from '../src/languages/fr';
import { selectReplacements } from '../src/weave/select';
import { applyReplacements } from '../src/weave/write';
import { chunkText, collectSegments, currentText, findPageText, inPageOrder, isGone, toDomPoint } from '../src/weave/segment';

describe('chunkText', () => {
  it('keeps short text whole', () => {
    expect(chunkText('A short paragraph of text.', [])).toEqual([[0, 26]]);
  });

  it('drops chunks below the minimum', () => {
    expect(chunkText('Too short.', [])).toEqual([]);
  });

  it('cuts at sentence ends', () => {
    const s1 = 'The first sentence is here. ';
    const s2 = 'The second sentence follows it. ';
    const s3 = 'And a third one ends the paragraph.';
    const text = s1 + s2 + s3;
    const chunks = chunkText(text, [], { min: 5, max: 70 });
    expect(chunks.map(([a, b]) => text.slice(a, b))).toEqual([s1 + s2, s3]);
  });

  it('falls back to node boundaries, then whitespace', () => {
    const text = 'aaaa bbbb cccc dddd eeee ffff gggg hhhh';
    expect(chunkText(text, [15], { min: 3, max: 20 })[0]).toEqual([0, 15]);
    expect(chunkText(text, [], { min: 3, max: 12 })[0]).toEqual([0, 10]);
  });

  it('never exceeds the maximum', () => {
    const text = 'word '.repeat(300);
    for (const [a, b] of chunkText(text, [], { min: 20, max: 400 })) expect(b - a).toBeLessThanOrEqual(400);
  });
});

describe('collectSegments', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('groups text nodes by block, including inline markup', () => {
    document.body.innerHTML = `
      <p>The <b>quick</b> brown fox jumps over <a href="#">the lazy dog</a>.</p>
      <p>A second paragraph with enough text in it.</p>`;
    const segs = collectSegments(document.body);
    expect(segs.map((s) => s.text)).toEqual([
      'The quick brown fox jumps over the lazy dog.',
      'A second paragraph with enough text in it.',
    ]);
    expect(segs[0]!.pieces).toHaveLength(5);
  });

  it('skips code, hidden, aria-hidden, inert, editable and processed content', () => {
    document.body.innerHTML = `
      <p>Visible text that should be collected here. <code>let x = 1</code></p>
      <p hidden>Hidden paragraph that should never appear.</p>
      <p aria-hidden="true">Aria-hidden paragraph that should not appear.</p>
      <div inert><p>Inert paragraph that should not appear at all.</p></div>
      <div contenteditable="true"><p>Editable paragraph that must not be touched.</p></div>
      <p data-tissage>Already processed paragraph, skip it please.</p>
      <pre>Preformatted text block that is long enough.</pre>
      <script>console.log("a script that is long enough")</script>`;
    expect(collectSegments(document.body).map((s) => s.text)).toEqual([
      'Visible text that should be collected here. ',
    ]);
  });

  it('skips page chrome, citation markers and link-heavy blocks', () => {
    document.body.innerHTML = `
      <nav><p>Navigation paragraph that should be skipped.</p></nav>
      <footer><p>Footer paragraph that should be skipped too.</p></footer>
      <ul><li><a href="#a">Table of contents entry one</a></li></ul>
      <p>Body text with a citation marker at the end.<sup><a href="#r">[1]</a></sup></p>
      <p>A paragraph with <a href="#x">one link</a> in it is still prose.</p>`;
    expect(collectSegments(document.body).map((s) => s.text)).toEqual([
      'Body text with a citation marker at the end.',
      'A paragraph with one link in it is still prose.',
    ]);
  });

  it('keeps spaces between inline elements', () => {
    document.body.innerHTML = '<p>The rivers <a href="#a">Loire</a> <a href="#b">Cher</a> and Indre meet near Tours.</p>';
    expect(collectSegments(document.body)[0]?.text).toBe('The rivers Loire Cher and Indre meet near Tours.');
  });

  it('ignores text outside block elements', () => {
    document.body.innerHTML = '<div>Loose text in a div that is not a paragraph.</div>';
    expect(collectSegments(document.body)).toEqual([]);
  });

  it('splits a long text node at sentences and maps pieces back', () => {
    const sentence = 'This sentence is about forty-five chars long. ';
    document.body.innerHTML = `<p>${sentence.repeat(20)}</p>`;
    const segs = collectSegments(document.body);
    expect(segs.length).toBeGreaterThan(1);
    expect(segs.map((s) => s.text).join('')).toBe(sentence.repeat(20));
    for (const s of segs) expect(currentText(s)).toBe(s.text);
  });
});

describe('toDomPoint', () => {
  it('resolves boundaries toward the inside of the range', () => {
    document.body.innerHTML = '<p>Read the <a href="#">full article</a> about it today.</p>';
    const [seg] = collectSegments(document.body);
    const [before, link] = seg!.pieces.map((p) => p.node);
    // Offset 9 is the boundary between "Read the " and "full article".
    expect(toDomPoint(seg!, 9, 'start')).toEqual({ node: link, offset: 0 });
    expect(toDomPoint(seg!, 9, 'end')).toEqual({ node: before, offset: 9 });
  });
});

describe('loose reading', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('takes text outside paragraph tags by its nearest block, but not labels', () => {
    document.body.innerHTML = `
      <div id="desc"><span>A video description written in spans, long enough to weave.</span></div>
      <x-comment style="display: block"><span>Custom elements laid out as blocks hold comments too.</span></x-comment>
      <div><span>12K views</span></div>
      <div><a href="#c">A channel name that is only a link to elsewhere</a></div>`;
    expect(collectSegments(document.body, { loose: true }).map((s) => s.text)).toEqual([
      'A video description written in spans, long enough to weave.',
      'Custom elements laid out as blocks hold comments too.',
    ]);
  });

  it('keeps paragraphs as blocks of their own', () => {
    document.body.innerHTML = '<div><p>A paragraph inside a div is its own block here.</p></div>';
    expect(collectSegments(document.body, { loose: true }).map((s) => s.block.tagName)).toEqual(['P']);
  });
});

describe('findPageText', () => {
  const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(' ');

  it('reads the main content when it has enough paragraphs', () => {
    document.body.innerHTML = `<main><p>${words(60)}</p></main><p>${words(30)} outside main.</p>`;
    const page = findPageText(document);
    expect(page.root.tagName).toBe('MAIN');
    expect(page.loose).toBe(false);
  });

  it('falls back to the body when the main content is empty', () => {
    document.body.innerHTML = `<main><h1>A title only, nothing else in here</h1></main><div><p>${words(60)}</p></div>`;
    const page = findPageText(document);
    expect(page.root).toBe(document.body);
    expect(page.loose).toBe(false);
  });

  it('reads loosely when there are no paragraphs at all', () => {
    document.body.innerHTML = `<h1>The video title, long enough for a segment</h1><div><span>${words(60)}</span></div>`;
    const page = findPageText(document);
    expect(page.loose).toBe(true);
    expect(page.segments.some((s) => s.block.tagName === 'DIV')).toBe(true);
  });

  it('keeps a short article strict rather than reading the page around it', () => {
    document.body.innerHTML = `<article><p>${words(20)}</p></article><div><span>${words(80)}</span></div>`;
    const page = findPageText(document);
    expect(page.root.tagName).toBe('ARTICLE');
    expect(page.loose).toBe(false);
  });
});

describe('inPageOrder', () => {
  it('sorts segments by where their blocks are', () => {
    document.body.innerHTML = '<p>The first paragraph on the page.</p><p>The second paragraph on the page.</p>';
    const [a, b] = collectSegments(document.body);
    expect([b!, a!].sort(inPageOrder)).toEqual([a, b]);
  });
});

describe('isGone', () => {
  it('is true once the block is removed or drawn again with other text', () => {
    document.body.innerHTML = '<p id="a">A paragraph that the page keeps.</p><p id="b">A paragraph that the page removes.</p><p id="c">A paragraph that the page redraws.</p>';
    const [kept, removed, redrawn] = collectSegments(document.body);
    removed!.block.remove();
    redrawn!.block.textContent = 'Another paragraph in the same element now.';
    expect([kept, removed, redrawn].map((s) => isGone(s!))).toEqual([false, true, true]);
  });

  it('is false for a woven segment', () => {
    document.body.innerHTML = '<p>The cat sat on the warm mat today.</p>';
    const [seg] = collectSegments(document.body);
    const line = { original: 'cat', replacement: 'chat', lemma: 'chat', gender: 'm', pos: 'noun', gloss: 'cat' } as const;
    applyReplacements(seg!, selectReplacements(seg!.text, [line], { budget: 10 }).accepted, fr);
    expect(isGone(seg!)).toBe(false);
  });
});
