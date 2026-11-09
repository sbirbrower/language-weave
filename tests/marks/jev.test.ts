import { describe, expect, it, vi } from 'vitest';
import { fr } from '../../src/languages/fr';
import { askJev, JEV_MODEL, jevProbability, jevQuestions, jevState } from '../../src/marks/jev';
import type { MarkJob } from '../../src/marks/prompt';
import { getSyllabusLesson } from '../../src/syllabus';

const job: MarkJob = { language: fr.displayName, lesson: getSyllabusLesson('fr-a2-passe-compose')!, kit: null, title: 'Pride', heading: '', paragraphs: ['First. They departed at noon. Then.'] };
const mark = { para: 1, at: 0, start: 7, end: 20, english: 'They departed', target: 'Ils sont partis', point: 2, note: '' };

const reply = (status: number, body: unknown) => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });

describe('Jev', () => {
  it('asks about the mark in its sentence, with the shipped questions, in the lesson’s language', () => {
    expect(jevState()(job, mark)).toEqual({ sentence: 'They departed at noon.', marked_english: 'They departed', translation_language: 'French', translation: 'Ils sont partis' });
    const q = jevQuestions(job);
    expect(Object.keys(q)).toEqual(['meaning', 'correct']);
    expect(q.meaning!.instructions).toContain('The French translation says what the marked English says');
    expect(q.correct!.type).toBe('noul');
  });

  it('multiplies the answers into the chance a mark is good', () => {
    expect(jevProbability({ meaning: { type: 'noul', noul: 0.5 }, correct: { type: 'noul', noul: 0.8 } })).toBeCloseTo(0.4);
  });

  it('posts the state and questions with the key, and prices the input tokens', async () => {
    const fetcher = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => reply(200, { model: JEV_MODEL, answers: { meaning: { type: 'noul', noul: 0.9 } }, usage: { input_tokens: 1000 } }));
    const res = await askJev('k3y', JEV_MODEL, { a: 1 }, jevQuestions(job), fetcher as typeof fetch);
    const [url, init] = fetcher.mock.calls[0]!;
    expect(url).toBe('https://api.typesafe.ai/v1/systemone');
    expect(init!.headers).toMatchObject({ Authorization: 'Bearer k3y' });
    expect(JSON.parse(init!.body as string)).toMatchObject({ model: 'jev-1.14.0', state: { a: 1 }, questions: { meaning: { type: 'noul' } } });
    expect(res.answers.meaning!.noul).toBe(0.9);
    expect(res.usd).toBeCloseTo(0.000042);
  });

  it('backs off on 429 and throws on other errors', async () => {
    vi.useFakeTimers();
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(reply(429, 'slow down'))
      .mockResolvedValueOnce(reply(200, { model: JEV_MODEL, answers: {} }));
    const pending = askJev('k', JEV_MODEL, {}, {}, fetcher as unknown as typeof fetch);
    await vi.advanceTimersByTimeAsync(500);
    await expect(pending).resolves.toMatchObject({ answers: {} });
    expect(fetcher).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
    await expect(askJev('k', JEV_MODEL, {}, {}, (async () => reply(401, 'bad key')) as typeof fetch)).rejects.toThrow('Jev 401: bad key');
  });
});
