import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TokenUsage } from '../src/cost';
import { geminiLevels, geminiProvider, textModels } from '../src/providers/gemini';
import { sseData, withLevels } from '../src/providers/http';
import { chatModels, openaiEfforts, openaiProvider } from '../src/providers/openai';
import { apiKeyFor, routeModel, tierOf } from '../src/providers/route';
import { DEFAULT_SETTINGS } from '../src/settings';

const stream = (...chunks: string[]) =>
  new ReadableStream<Uint8Array>({
    start(c) {
      for (const chunk of chunks) c.enqueue(new TextEncoder().encode(chunk));
      c.close();
    },
  });

const sse = (...events: unknown[]) => events.map((e) => `data: ${typeof e === 'string' ? e : JSON.stringify(e)}\n\n`).join('');

async function collect(it: AsyncIterable<string>): Promise<string[]> {
  const out: string[] = [];
  for await (const x of it) out.push(x);
  return out;
}

afterEach(() => vi.unstubAllGlobals());

describe('route', () => {
  it('maps each Claude model to a tier', () => {
    expect(tierOf('claude-haiku-5-5')).toBe('fast');
    expect(tierOf('claude-sonnet-5-5')).toBe('main');
    expect(tierOf('claude-opus-5-5')).toBe('best');
    expect(tierOf('claude-fable-5-1')).toBe('best');
  });

  it('keeps the Claude model on Anthropic, and picks the tier elsewhere', () => {
    expect(routeModel(DEFAULT_SETTINGS, 'claude-sonnet-5-5')).toBe('claude-sonnet-5-5');
    const openai = { ...DEFAULT_SETTINGS, provider: 'openai' as const, providerModels: { openai: { main: 'gpt-x' } } };
    expect(routeModel(openai, 'claude-sonnet-5-5')).toBe('gpt-x');
    expect(routeModel(openai, 'claude-haiku-5-5')).toBe('gpt-6-luna');
  });

  it("reads the chosen provider's key", () => {
    expect(apiKeyFor({ ...DEFAULT_SETTINGS, anthropicApiKey: 'a', geminiApiKey: 'g', provider: 'gemini' })).toBe('g');
  });
});

describe('levels', () => {
  it('asks for the least reasoning when thinking is off, then falls back', () => {
    expect(openaiEfforts('low', 'off')).toEqual(['none', 'minimal', 'low', undefined]);
    expect(geminiLevels('high', 'off')).toEqual(['minimal', 'low', undefined]);
  });

  it("sends the effort when thinking is on, and omits 'default'", () => {
    expect(openaiEfforts('medium', 'on')).toEqual(['medium', undefined]);
    expect(geminiLevels('default', 'on')).toEqual([undefined]);
  });

  it('moves to the next level only on a 400 that names the parameter', async () => {
    const sent: Array<string | undefined> = [];
    const res = await withLevels(['none', 'low'], /reasoning/, async (level) => {
      sent.push(level);
      return level === 'none'
        ? new Response(JSON.stringify({ error: { message: "Unsupported value: 'reasoning_effort'" } }), { status: 400 })
        : new Response('ok');
    });
    expect(sent).toEqual(['none', 'low']);
    expect(res.ok).toBe(true);
    await expect(withLevels(['none', 'low'], /reasoning/, async () => new Response('{"error":{"message":"bad key"}}', { status: 401 }))).rejects.toThrow('401: bad key');
  });
});

describe('model lists', () => {
  it('keeps only text models', () => {
    expect(chatModels(['whisper-1', 'gpt-6-luna', 'text-embedding-3-small', 'gpt-realtime', 'gpt-6.1-sol'])).toEqual(['gpt-6-luna', 'gpt-6.1-sol']);
    expect(
      textModels([
        { name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/gemini-embedding-001', supportedGenerationMethods: ['embedContent'] },
        { name: 'models/gemini-3.8-flash-tts', supportedGenerationMethods: ['generateContent'] },
      ]),
    ).toEqual(['gemini-3.8-flash']);
  });
});

describe('sseData', () => {
  it('joins events split across chunks', async () => {
    expect(await collect(sseData(stream('data: {"a"', ':1}\n\ndata: x\r\n\r\n', 'data: last')))).toEqual(['{"a":1}', 'x', 'last']);
  });
});

describe('openaiProvider', () => {
  it('streams text and reports usage with cached tokens apart', async () => {
    const fetch = vi.fn(async () =>
      new Response(
        stream(
          sse(
            { choices: [{ delta: { content: 'Bon' } }] },
            { choices: [{ delta: { content: 'jour' }, finish_reason: 'stop' }] },
            { choices: [], usage: { prompt_tokens: 100, completion_tokens: 7, prompt_tokens_details: { cached_tokens: 60 } } },
            '[DONE]',
          ),
        ),
      ),
    );
    vi.stubGlobal('fetch', fetch);
    let usage: TokenUsage | undefined;
    const p = openaiProvider({ apiKey: 'k', model: 'gpt-6-luna', effort: 'low', thinking: 'off' });
    expect(await collect(p.complete({ system: 's', user: 'u', maxTokens: 50, schema: { type: 'object' }, onUsage: (u) => (usage = u) }))).toEqual(['Bon', 'jour']);
    expect(usage).toEqual({ input: 40, output: 7, cacheRead: 60, cacheWrite: 0 });
    const body = JSON.parse((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body).toMatchObject({ model: 'gpt-6-luna', reasoning_effort: 'none', max_completion_tokens: 50, response_format: { type: 'json_schema' } });
  });

  it('throws on a cut-off reply', async () => {
    vi.stubGlobal('fetch', async () => new Response(stream(sse({ choices: [{ delta: { content: '{' }, finish_reason: 'length' }] }, '[DONE]'))));
    const p = openaiProvider({ apiKey: 'k', model: 'm', effort: 'default' });
    await expect(collect(p.complete({ system: 's', user: 'u', maxTokens: 5 }))).rejects.toThrow('cut off');
  });
});

describe('geminiProvider', () => {
  it('streams text without thoughts and counts thinking as output', async () => {
    const fetch = vi.fn(async () =>
      new Response(
        stream(
          sse(
            { candidates: [{ content: { parts: [{ text: 'hmm', thought: true }, { text: 'Hola' }] } }] },
            {
              candidates: [{ content: { parts: [{ text: '!' }] }, finishReason: 'STOP' }],
              usageMetadata: { promptTokenCount: 100, cachedContentTokenCount: 30, candidatesTokenCount: 5, thoughtsTokenCount: 20 },
            },
          ),
        ),
      ),
    );
    vi.stubGlobal('fetch', fetch);
    let usage: TokenUsage | undefined;
    const p = geminiProvider({ apiKey: 'k', model: 'gemini-3.8-flash', effort: 'default', thinking: 'off' });
    expect(await collect(p.complete({ system: 's', user: 'u', maxTokens: 50, onUsage: (u) => (usage = u) }))).toEqual(['Hola', '!']);
    expect(usage).toEqual({ input: 70, output: 25, cacheRead: 30, cacheWrite: 0 });
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('/models/gemini-3.8-flash:streamGenerateContent?alt=sse');
    expect(JSON.parse(init.body as string).generationConfig).toEqual({ maxOutputTokens: 50, thinkingConfig: { thinkingLevel: 'minimal' } });
  });

  it('throws when the reply is blocked', async () => {
    vi.stubGlobal('fetch', async () => new Response(stream(sse({ candidates: [{ finishReason: 'SAFETY' }] }))));
    const p = geminiProvider({ apiKey: 'k', model: 'm', effort: 'default' });
    await expect(collect(p.complete({ system: 's', user: 'u', maxTokens: 5 }))).rejects.toThrow('declined');
  });
});
