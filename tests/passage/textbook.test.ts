import { describe, expect, it } from 'vitest';
import { italicSpans, parseTextbook } from '../../src/passage/textbook';

describe('parseTextbook', () => {
  const section = (over: Record<string, unknown>) => ({ kind: 'grammar', heading: 'x', explanation: [], table: { columns: [], rows: [] }, words: [], examples: [], watch_out: [], ...over });

  it('reads sections in order, pads table rows and drops empty parts', () => {
    const tb = parseTextbook(
      JSON.stringify({
        intro: ' Learn *être*. ',
        sections: [
          section({ kind: 'words', heading: 'Countries', explanation: ['Countries take an article.'], words: [{ word: 'la France', english: 'France' }, { word: '', english: 'x' }] }),
          section({
            heading: 'être',
            explanation: ['It means *to be*.', ''],
            table: { columns: ['Pronoun', 'Form'], rows: [['je', 'suis'], ['tu'], ['', '']] },
            examples: [{ target: 'Je suis ici.', translation: 'I am here.' }, { target: '', translation: 'x' }],
          }),
          section({ heading: 'Empty' }),
          section({ kind: 'odd', heading: 'Unknown kind', words: [{ word: 'oui', english: 'yes' }] }),
        ],
      }),
    );
    expect(tb.intro).toBe('Learn *être*.');
    expect(tb.sections.map((s) => [s.kind, s.heading])).toEqual([['words', 'Countries'], ['grammar', 'être'], ['grammar', 'Unknown kind']]);
    expect(tb.sections[0]!.words).toEqual([{ word: 'la France', english: 'France' }]);
    expect(tb.sections[1]!.table.rows).toEqual([['je', 'suis'], ['tu', '']]);
    expect(tb.sections[1]!.examples).toEqual([{ target: 'Je suis ici.', english: 'I am here.' }]);
  });

  it('drops a table with no header, and throws when nothing is taught', () => {
    const tb = parseTextbook(JSON.stringify({ intro: '', sections: [section({ explanation: ['y'], table: { columns: [], rows: [['a']] } })] }));
    expect(tb.sections[0]!.table).toEqual({ columns: [], rows: [] });
    expect(() => parseTextbook(JSON.stringify({ intro: 'Hi', sections: [] }))).toThrow();
  });
});

describe('italicSpans', () => {
  it('splits out the starred spans', () => {
    expect(italicSpans('Say *bonjour* or *salut*.')).toEqual([
      { text: 'Say ', italic: false },
      { text: 'bonjour', italic: true },
      { text: ' or ', italic: false },
      { text: 'salut', italic: true },
      { text: '.', italic: false },
    ]);
    expect(italicSpans('a * b')).toEqual([{ text: 'a * b', italic: false }]);
  });
});
