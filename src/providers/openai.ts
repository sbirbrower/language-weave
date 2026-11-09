import type { Effort, Thinking } from '../settings';
import { errorMessage, sseData, withLevels } from './http';
import type { CompletionRequest, Provider, ProviderConfig } from './types';

const API = 'https://api.openai.com/v1';

/**
 * `reasoning_effort` values to try, best first; `undefined` omits it (the
 * model's default). Off asks for 'none', which not every model takes.
 */
export function openaiEfforts(effort: Effort, thinking: Thinking): Array<string | undefined> {
  if (thinking === 'off') return ['none', 'minimal', 'low', undefined];
  return effort === 'default' ? [undefined] : [effort, undefined];
}

/** Chat models from the account's list: no embeddings, speech, images or realtime. */
export function chatModels(ids: string[]): string[] {
  return ids
    .filter((id) => /^(gpt-|o\d|chatgpt-)/.test(id) && !/audio|realtime|image|tts|transcribe|search|embedding/.test(id))
    .sort();
}

interface Chunk {
  choices?: Array<{ delta?: { content?: string | null; refusal?: string | null }; finish_reason?: string | null }>;
  usage?: { prompt_tokens: number; completion_tokens: number; prompt_tokens_details?: { cached_tokens?: number } };
}

export function openaiProvider({ apiKey, model, effort, thinking = 'on' }: ProviderConfig): Provider {
  const headers = { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' };

  return {
    id: 'openai',

    async listModels() {
      const res = await fetch(`${API}/models`, { headers });
      if (!res.ok) throw new Error(await errorMessage(res));
      const { data } = (await res.json()) as { data: Array<{ id: string }> };
      return chatModels(data.map((m) => m.id));
    },

    async *complete({ system, user, maxTokens, schema, onUsage }: CompletionRequest) {
      const res = await withLevels(openaiEfforts(effort, thinking), /reasoning/i, (level) =>
        fetch(`${API}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model,
            stream: true,
            stream_options: { include_usage: true },
            max_completion_tokens: maxTokens,
            // Prompts are cached automatically from a long enough identical prefix: the system prompt.
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: user },
            ],
            ...(level ? { reasoning_effort: level } : {}),
            ...(schema ? { response_format: { type: 'json_schema', json_schema: { name: 'reply', schema, strict: true } } } : {}),
          }),
        }),
      );

      let finish: string | null | undefined;
      let refusal = '';
      for await (const data of sseData(res.body!)) {
        if (data === '[DONE]') break;
        const chunk = JSON.parse(data) as Chunk;
        const choice = chunk.choices?.[0];
        if (choice?.delta?.content) yield choice.delta.content;
        if (choice?.delta?.refusal) refusal += choice.delta.refusal;
        if (choice?.finish_reason) finish = choice.finish_reason;
        if (chunk.usage) {
          const cached = chunk.usage.prompt_tokens_details?.cached_tokens ?? 0;
          onUsage?.({ input: chunk.usage.prompt_tokens - cached, output: chunk.usage.completion_tokens, cacheRead: cached, cacheWrite: 0 });
        }
      }

      if (refusal || finish === 'content_filter') throw new Error(`Model declined the request${refusal ? `: ${refusal}` : ''}`);
      // Reasoning counts against the cap too; a cut-off reply is unfinished JSON.
      if (finish === 'length') throw new Error(`The reply was cut off at ${maxTokens} tokens before it finished.`);
    },
  };
}
