import { describe, expect, it } from 'vitest';
import { sentenceAround } from '../../src/vocab/context';
import { BLOCK_ATTR, WOVEN_CLASS } from '../../src/weave/segment';
import { EN_CLASS, FR_CLASS, toggleSource } from '../../src/weave/write';

const woven = (target: string, english: string, say = target) =>
  `<span class="${WOVEN_CLASS}"><span class="${FR_CLASS}" data-say="${say}">${target}</span><span class="${EN_CLASS}" hidden>${english}</span></span>`;

function words(html: string) {
  document.body.innerHTML = `<p ${BLOCK_ATTR}>${html}</p>`;
  return [...document.querySelectorAll<HTMLElement>(`.${WOVEN_CLASS}`)];
}

describe('sentenceAround', () => {
  it('is the sentence the word is in, with the word marked', () => {
    const [chien] = words(`Cats sleep. The ${woven('chien', 'dog')} barks   loudly! Then it rests.`);
    const found = sentenceAround(chien!)!;
    expect(found.sentence).toBe('The chien barks loudly!');
    expect(found.sentence.slice(found.start, found.end)).toBe('chien');
  });

  it('shows other woven words as they are showing, and the word itself without readings', () => {
    const [chat, chien] = words(`The ${woven('chat', 'cat')} and the ${woven('<ruby>犬<rt>いぬ</rt></ruby>', 'dog', '犬')} play.`);
    toggleSource(chat!);
    toggleSource(chien!);
    expect(sentenceAround(chien!)!.sentence).toBe('The cat and the 犬 play.');
  });

  it('ends at a sentence mark in another script', () => {
    const [w] = words(`前の文です。これは${woven('犬', 'dog')}です。次の文。`);
    expect(sentenceAround(w!)!.sentence).toBe('これは犬です。');
  });

  it('keeps a long sentence to a stretch either side', () => {
    const [w] = words(`${'a '.repeat(200)}${woven('chien', 'dog')}${' b'.repeat(200)}`);
    expect(sentenceAround(w!)!.sentence.length).toBeLessThan(320);
  });
});
