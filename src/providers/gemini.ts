import type { Effort, Thinking } from '../settings';
import { errorMessage, sseData, withLevels } from './http';
import type { CompletionRequest, Provider, ProviderConfig } from './types';

const API = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * `thinkingLevel` values to try, best first; `undefined` omits it (the
 * model's default). No current Gemini turns thinking off, so off is the
 * lowest level the model takes: 'minimal' on some, 'low' on the rest.
 */
export function geminiLevels(effort: Effort, thinking: Thinking): Array<string | undefined> {
  if (thinking === 'off') return ['minimal', 'low', undefined];
  return effort === 'default' ? [undefined] : [effort, undefined];
}

/** Models that write text: `generateContent`, and no speech, images or embeddings. */
export function textModels(models: Array<{ name: string; supportedGenerationMethods?: string[] }>): string[] {
  return models
    .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => m.name.replace(/^models\//, ''))
    .filter((id) => /^gemini-/.test(id) && !/tts|image|embedding|live|audio/.test(id))
    .sort();
}

const DECLINED = new Set(['SAFETY', 'RECITATION', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII', 'LANGUAGE']);

interface Chunk {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> }; finishReason?: string }>;
  promptFeedback?: { blockReason?: string };
  usageMetadata?: { promptTokenCount?: number; cachedContentTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };
}

export function geminiProvider({ apiKey, model, effort, thinking = 'on' }: ProviderConfig): Provider {
  const headers = { 'x-goog-api-key': apiKey, 'content-type': 'application/json' };

  return {
    id: 'gemini',

    async listModels() {
      const res = await fetch(`${API}/models?pageSize=1000`, { headers });
      if (!res.ok) throw new Error(await errorMessage(res));
      const { models } = (await res.json()) as { models: Array<{ name: string; supportedGenerationMethods?: string[] }> };
      return textModels(models);
    },

    async *complete({ system, user, maxTokens, schema, onUsage }: CompletionRequest) {
      const res = await withLevels(geminiLevels(effort, thinking), /thinking/i, (level) =>
        fetch(`${API}/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            // Repeated prefixes (the system prompt) are cached implicitly.
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts: [{ text: user }] }],
            generationConfig: {
              maxOutputTokens: maxTokens,
              ...(schema ? { responseMimeType: 'application/json', responseJsonSchema: schema } : {}),
              ...(level ? { thinkingConfig: { thinkingLevel: level } } : {}),
            },
          }),
        }),
      );

      let finish: string | undefined;
      let blocked: string | undefined;
      let usage: Chunk['usageMetadata'];
      for await (const data of sseData(res.body!)) {
        const chunk = JSON.parse(data) as Chunk;
        const candidate = chunk.candidates?.[0];
        for (const part of candidate?.content?.parts ?? []) if (part.text && !part.thought) yield part.text;
        if (candidate?.finishReason) finish = candidate.finishReason;
        blocked ??= chunk.promptFeedback?.blockReason;
        // Each chunk carries the totals so far.
        if (chunk.usageMetadata) usage = chunk.usageMetadata;
      }

      if (usage) {
        const cached = usage.cachedContentTokenCount ?? 0;
        onUsage?.({
          input: (usage.promptTokenCount ?? 0) - cached,
          output: (usage.candidatesTokenCount ?? 0) + (usage.thoughtsTokenCount ?? 0),
          cacheRead: cached,
          cacheWrite: 0,
        });
      }
      if (blocked || (finish && DECLINED.has(finish))) throw new Error(`Model declined the request (${blocked ?? finish})`);
      // Thinking counts against the cap too; a cut-off reply is unfinished JSON.
      if (finish === 'MAX_TOKENS') throw new Error(`The reply was cut off at ${maxTokens} tokens before it finished.`);
    },
  };
}
