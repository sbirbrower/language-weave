import { describe, expect, it } from 'vitest';
import { grammarFor, LEVELS } from '../../src/grammar';
import { pageSections, sectionContext, sectionOnScreen, type PageSection } from '../../src/passage/context';
import { FORMATS, getFormat, pickFormat } from '../../src/passage/formats';
import { parseKit, type Kit } from '../../src/passage/kit';
import {
  buildPiecePrompt,
  choosePiece,
  parseLine,
  parsePiece,
  spokenText,
  streamedLines,
  wordPresent,
  writePiece,
  type Complete,
  type LessonJob,
  type PageJob,
} from '../../src/passage/piece';
import { compilePattern } from '../../src/passage/regex';
import type { SyllabusLesson } from '../../src/syllabus/types';
import { collectSegments, contentRoot } from '../../src/weave/segment';

const words = (n: number, w = 'word') => Array.from({ length: n }, () => w).join(' ');

const kit: Kit = {
  theme: 'weather',
  themeVocab: [
    { word: 'der Regen', gloss: 'rain' },
    { word: 'der Schnee', gloss: 'snow' },
    { word: 'die Sonne (f.)', gloss: 'sun' },
  ],
  settings: ['a rainy Saturday at home'],
  points: [
    { id: 'seasons', label: 'im + season', instruction: 'Use im with a season.', explanation: '', patterns: ['\\bim (sommer|winter)\\b'], example: 'Im Winter schneit es.' },
    { id: 'likes', label: 'gern', instruction: 'Say what you like with gern.', explanation: '', patterns: ['\\bgern\\b'], example: 'Ich spiele gern.' },
  ],
  pitfalls: ['in Sommer -> im Sommer'],
};

const lesson: SyllabusLesson = { id: 'de-wetter', lang: 'de', title: 'Das Wetter', level: 'CEFR A1', points: ['im + season', 'gern'] };

const sections: PageSection[] = [
  { heading: '', text: `${words(200, 'lead')}` },
  { heading: 'History', text: words(200, 'history') },
  { heading: 'Climate', text: `${words(40, 'rain')} ${words(40, 'snow')}` },
  { heading: 'Legacy', text: words(200, 'legacy') },
];

const pageJob = (over: Partial<PageJob> = {}): PageJob => ({
  mode: 'page',
  formatId: 'summary',
  language: 'German',
  seed: 's',
  level: 'A2',
  title: 'Snow',
  sections,
  focus: 2,
  pageWords: [
    { target: 'der Regen', english: ['rain'] },
    { target: 'die Geschichte', english: ['history'] },
  ],
  grammar: [{ id: 'g', level: 'A2', label: 'Perfekt', instruction: 'Use the Perfekt for past events.', example: 'Es hat geregnet.' }],
  ...over,
});

const lessonJob = (over: Partial<LessonJob> = {}): LessonJob => ({ mode: 'lesson', formatId: 'dialogue', language: 'German', seed: 's', lesson, kit, ...over });

describe('compilePattern', () => {
  it('matches word edges in any script, not just ASCII', () => {
    expect(compilePattern('\\bété\\b')!.test('en été, il fait chaud')).toBe(true);
    expect(compilePattern('\\bété\\b')!.test('la société')).toBe(false);
  });
  it('drops a leading Python flag and treats curly apostrophes as plain', () => {
    expect(compilePattern("(?i)l’école")!.test("L'école est grande")).toBe(true);
  });
  it('returns null for an invalid pattern', () => {
    expect(compilePattern('(unclosed')).toBeNull();
  });
});

describe('spokenText', () => {
  it('drops asterisks and an interview label, but keeps other labels', () => {
    expect(spokenText({ fr: 'Q\u202f: Où *habitez*-vous ?' })).toBe('Où habitez-vous ?');
    expect(spokenText({ fr: 'A: Ich wohne in Berlin.' })).toBe('Ich wohne in Berlin.');
    expect(spokenText({ fr: 'Avant : il pleuvait.' })).toBe('Avant : il pleuvait.');
  });

  it("drops a dialogue's speaker names, and only in a dialogue", () => {
    expect(spokenText({ fr: 'Léa : Tu as vu le film ?' }, 'dialogue')).toBe('Tu as vu le film ?');
    expect(spokenText({ fr: 'Jean-Luc : Oui, hier.' }, 'dialogue')).toBe('Oui, hier.');
    expect(spokenText({ fr: 'Lena: Hast du Zeit?' }, 'dialogue')).toBe('Hast du Zeit?');
    expect(spokenText({ fr: 'Maintenant : il fait beau.' }, 'then_now')).toBe('Maintenant : il fait beau.');
  });

  it('turns the symbols between a word and its meaning into a pause', () => {
    expect(spokenText({ fr: '*la gare* → l’endroit où on prend le train' })).toBe('la gare, l’endroit où on prend le train');
    expect(spokenText({ fr: 'chaud ↔ froid' })).toBe('chaud, froid');
    expect(spokenText({ fr: '1953 – Watson et Crick décrivent l’ADN.' })).toBe('1953, Watson et Crick décrivent l’ADN.');
    expect(spokenText({ fr: 'Er wohnt in Berlin-Mitte.' })).toBe('Er wohnt in Berlin-Mitte.');
  });

  it('drops asides in brackets and emoji', () => {
    expect(spokenText({ fr: 'chanter (verbe) – la chanson (nom) – le chanteur (nom)' })).toBe('chanter, la chanson, le chanteur');
    expect(spokenText({ fr: 'Le *manteau* (un vêtement chaud) est rouge.' })).toBe('Le manteau est rouge.');
    expect(spokenText({ fr: 'Bisous de Paris ! 😘🇫🇷' })).toBe('Bisous de Paris !');
    expect(spokenText({ fr: '👋' })).toBe('');
  });
});

describe('wordPresent', () => {
  it('ignores the article and allows an ending', () => {
    expect(wordPresent('le cheval', 'Les chevaux courent.')).toBe(true);
    expect(wordPresent('finir', 'Il finit.')).toBe(true);
    expect(wordPresent('la neige', 'Il pleut.')).toBe(false);
  });
});

describe('pageSections and sectionContext', () => {
  it('groups paragraphs under headings, skipping references, and finds the one on screen', () => {
    document.body.innerHTML = `<main><h1>Snow</h1><p>${words(30, 'lead')}.</p><h2>Weather</h2><p id="w">${words(50, 'rain')}.</p><h2>References</h2><p>${words(20, 'ref')}.</p></main>`;
    const root = contentRoot(document);
    const segments = collectSegments(root);
    expect(pageSections(root, segments).map((s) => s.heading)).toEqual(['', 'Weather']);
    expect(sectionOnScreen(root, segments, (el) => el.id === 'w')).toBe(1);
    expect(sectionOnScreen(root, segments, () => false)).toBe(0);
  });

  it('is about the section on screen, after the start of the lead', () => {
    const ctx = sectionContext(sections, 1);
    expect(ctx.heading).toBe('History');
    expect(ctx.text).toMatch(/^lead[\s\S]*== History ==\nhistory/);
    expect(ctx.text.split('lead').length - 1).toBeLessThanOrEqual(80);
  });

  it('reads on when the section is short, and is the lead alone when the lead is on screen', () => {
    expect(sectionContext(sections, 2).text).toContain('== Legacy ==');
    expect(sectionContext(sections, 0).text).not.toContain('==');
  });
});

describe('formats', () => {
  it('have unique ids, and instructions for a page and a lesson that name the language', () => {
    expect(new Set(FORMATS.map((f) => f.id)).size).toBe(FORMATS.length);
    expect(FORMATS.length).toBe(27);
    for (const f of FORMATS) {
      expect(f.page('Klingon')).not.toMatch(/French/);
      expect(f.lesson('Klingon')).not.toMatch(/French/);
    }
  });

  it('picks one not used lately', () => {
    const avoid = FORMATS.slice(1).map((f) => f.id);
    expect(pickFormat(() => 0.99, avoid).id).toBe(FORMATS[0]!.id);
    expect(pickFormat(() => 0, FORMATS.map((f) => f.id)).id).toBe(FORMATS[0]!.id);
  });
});

describe('piece prompt', () => {
  it('writes about the section on screen, with the page words found there first and one grammar point', () => {
    const input = choosePiece(pageJob());
    expect(input.words[0]!.target).toBe('der Regen');
    const p = buildPiecePrompt(input);
    expect(p).toContain('== Climate ==');
    expect(p).toContain('Perfekt: Use the Perfekt');
    expect(p).toContain('Learning German, level A2.');
    expect(p).toContain(getFormat('summary')!.page('German'));
    expect(p).not.toMatch(/French/);
  });

  it('writes a lesson scene from the kit, never the page', () => {
    const input = choosePiece(lessonJob());
    const p = buildPiecePrompt(input);
    expect(p).not.toContain('<page>');
    expect(p).toContain('Scene for this piece: a rainy Saturday at home');
    expect(p).toContain('in Sommer -> im Sommer');
    expect(p).toContain('die Sonne (sun)');
    expect(p).toContain(getFormat('dialogue')!.lesson('German'));
  });

  it('asks a quiz format for its extra field', () => {
    expect(buildPiecePrompt(choosePiece(pageJob({ formatId: 'true_false' })))).toContain('|| false ||');
    expect(buildPiecePrompt(choosePiece(pageJob({ formatId: 'summary' })))).not.toContain('|| false ||');
  });

  it('makes the same choices from the same seed', () => {
    expect(choosePiece(lessonJob())).toEqual(choosePiece(lessonJob()));
  });
});

describe('parsing a piece', () => {
  it('reads plain lines and each kind of quiz line', () => {
    expect(parseLine('Es regnet. || It rains.', 'lines')).toEqual({ kind: 'line', fr: 'Es regnet.', en: 'It rains.' });
    expect(parseLine('A || a || true', 'true_false')).toMatchObject({ kind: 'tf', answer: true });
    expect(parseLine('A || a || false || B || b', 'true_false')).toMatchObject({ kind: 'tf', answer: false, fix: { fr: 'B', en: 'b' } });
    expect(parseLine('Es ___ (regnen). || It rains. || gap: regnet', 'gap_fill')).toMatchObject({ kind: 'gap', fr: 'Es ____ (regnen).', answer: 'regnet' });
    expect(parseLine('Es ____ (regnen). || It rains. || regnet', 'gap_fill')).toMatchObject({ kind: 'gap', answer: 'regnet' });
    expect(parseLine('der Regen || rain || pair', 'match')).toMatchObject({ kind: 'pair' });
    expect(parseLine('Was bin ich? || What am I? || answer: der Schnee | der Regen | die Sonne', 'riddle')).toMatchObject({
      kind: 'choice',
      answer: 'der Schnee',
      options: ['der Schnee', 'der Regen', 'die Sonne'],
    });
    expect(parseLine('|| nothing', 'lines')).toBeNull();
  });

  it('reads the title and note, and shuffles options and meanings the same way every time', () => {
    const text = `<title>Wörter || Words</title>
<piece>
der Regen || rain || pair
der Schnee || snow || pair
die Sonne || sun || pair
Was bin ich? || What am I? || answer: a | b | c
</piece>`;
    const piece = parsePiece(text, 'match_up');
    expect(piece.title).toEqual({ fr: 'Wörter', en: 'Words' });
    expect([...piece.shuffle!].sort()).toEqual([0, 1, 2]);
    expect(parsePiece(text, 'match_up')).toEqual(piece);
  });

  it('streams only finished lines', () => {
    expect(streamedLines('<piece>\nA || a\nB || b', 'piece')).toEqual(['A || a']);
    const partial = parsePiece('<title>T || t</title>\n<piece>\nA || a\nB', 'summary', false);
    expect(partial.lines.map((l) => l.fr)).toEqual(['A']);
  });
});

describe('writePiece', () => {
  it('makes one call, shows lines as they finish, then the whole piece', async () => {
    const response = '<title>Regen || Rain</title>\n<piece>\nEs regnet. || It rains.\nIm Winter schneit es. || It snows in winter.\n</piece>';
    const calls: string[] = [];
    const complete: Complete = async ({ user }, onText) => {
      calls.push(user);
      for (let i = 1; i <= response.length; i += 20) onText?.(response.slice(0, i));
      return { text: response, usd: 0.001 };
    };
    const seen: number[] = [];
    const run = await writePiece(lessonJob({ formatId: 'summary' }), complete, (p) => seen.push(p.lines.length));
    expect(calls).toHaveLength(1);
    expect(run.piece.lines).toHaveLength(2);
    expect(seen.at(-1)).toBe(2);
    expect(seen.length).toBeGreaterThan(1);
  });
});

describe('parseKit', () => {
  it('reads the schema', () => {
    const k = parseKit(
      JSON.stringify({
        theme: 'clothes',
        theme_vocab: [{ word: 'la robe', gloss: 'dress' }],
        settings: ['shopping for a wedding'],
        points: [{ id: 'p', label: 'P', instruction: 'Do p.', explanation: '', patterns: ['p'], example: 'P.' }],
        pitfalls: ['a -> b'],
      }),
    );
    expect(k.themeVocab).toEqual([{ word: 'la robe', gloss: 'dress' }]);
    expect(k.settings).toEqual(['shopping for a wedding']);
    expect(k.points[0]!.id).toBe('p');
  });

  it('rejects a kit with no points', () => {
    expect(() => parseKit('{"points": []}')).toThrow();
  });
});

describe('syllabus lessons and grammar', () => {
  it('lessons have unique ids, a known language and points', async () => {
    const { syllabusLessons } = await import('../../src/syllabus');
    const { languages } = await import('../../src/languages');
    expect(new Set(syllabusLessons.map((l) => l.id)).size).toBe(syllabusLessons.length);
    for (const l of syllabusLessons) {
      expect(languages[l.lang]).toBeDefined();
      expect(l.points.length).toBeGreaterThan(0);
    }
  });

  it('every level has grammar points in every language, and an unknown language has none', async () => {
    const { languages } = await import('../../src/languages');
    for (const code of Object.keys(languages))
      for (const level of LEVELS) expect(grammarFor(code, level).length, `${code} ${level}`).toBeGreaterThan(3);
    expect(grammarFor('xx', 'A1')).toEqual([]);
  });
});
