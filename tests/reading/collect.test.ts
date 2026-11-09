import { beforeEach, describe, expect, it } from 'vitest';
import { headings, openingText, selectedText } from '../../src/reading/collect';
import { collectSegments, contentRoot } from '../../src/weave/segment';

beforeEach(() => {
  document.body.innerHTML = `<main>
    <nav><h2>Contents</h2></nav>
    <table><tr><td><img alt="Conservation status: Vulnerable" width="200"></td></tr></table>
    <div class="mw-heading"><h2>Diet<span class="mw-editsection">[edit]</span></h2></div>
    <p>The snow leopard eats blue sheep, ibex and other mountain animals.</p>
    <figure><img alt="A snow leopard" width="300"><figcaption>Resting in the Himalayas</figcaption></figure>
    <h2>Reproduction</h2>
    <p>A litter usually has two or three cubs, born in spring or early summer.</p>
  </main>`;
});

const root = () => contentRoot(document);

describe('headings', () => {
  it('reads short headings from the page, without edit links or navigation', () => {
    expect(headings(root())).toEqual(['Diet', 'Reproduction']);
  });
});

describe('selectedText', () => {
  const select = (node: Node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    document.getSelection()!.removeAllRanges();
    document.getSelection()!.addRange(range);
  };

  it('reads the highlight in English, without reference marks', () => {
    document.body.innerHTML = `<main><p id="p">About <span class="tissage"><span class="tissage-target">trois mille</span><span class="tissage-source" hidden>3,000</span></span> people live there.<sup>[14]</sup> The climate is mild.</p></main>`;
    select(document.getElementById('p')!);
    expect(selectedText(document, root())).toBe('About 3,000 people live there. The climate is mild.');
    expect(document.querySelector('.tissage-target')!.textContent).toBe('trois mille'); // the page is untouched
  });

  it('ignores highlights outside the article, and no highlight', () => {
    const outside = document.createElement('div');
    outside.textContent = 'Somewhere else entirely';
    document.documentElement.append(outside);
    select(outside);
    expect(selectedText(document, root())).toBe('');
    document.getSelection()!.removeAllRanges();
    expect(selectedText(document, root())).toBe('');
    outside.remove();
  });
});

describe('openingText', () => {
  it('takes prose paragraphs, not info-box cells or captions', () => {
    expect(openingText(collectSegments(root()))).toEqual([
      'The snow leopard eats blue sheep, ibex and other mountain animals.',
      'A litter usually has two or three cubs, born in spring or early summer.',
    ]);
  });
});
