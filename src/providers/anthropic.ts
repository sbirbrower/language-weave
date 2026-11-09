import Anthropic from '@anthropic-ai/sdk';
import { thinkingOff } from './thinking';
import type { CompletionRequest, Provider, ProviderConfig } from './types';

export type AnthropicConfig = ProviderConfig;

export function anthropicProvider({ apiKey, model, effort, thinking = 'on' }: AnthropicConfig): Provider {
  const off = thinking === 'off' ? thinkingOff(model) : 'unsupported';
  // Runs in the extension's service worker. `dangerouslyAllowBrowser` sends
  // the `anthropic-dangerous-direct-browser-access` header the API needs for
  // browser-origin requests; the key never leaves this machine otherwise.
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  return {
    id: 'anthropic',

    async listModels() {
      const ids: string[] = [];
      for await (const m of client.models.list()) ids.push(m.id);
      return ids;
    },

    async *complete({ system, user, maxTokens, schema, onUsage }: CompletionRequest) {
      const outputConfig = {
        ...(effort === 'default' ? {} : { effort }),
        ...(schema ? { format: { type: 'json_schema' as const, schema } } : {}),
      };
      const stream = client.beta.messages.stream({
        model,
        max_tokens: maxTokens,
        // On a policy decline, retry on the model's default fallback. Models
        // without fallbacks just run alone.
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        // The system prompt is identical across requests; cache it.
        system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: user }],
        ...(Object.keys(outputConfig).length ? { output_config: outputConfig } : {}),
        ...(off !== 'unsupported' && off !== undefined ? { thinking: off } : {}),
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield event.delta.text;
        }
      }

      const final = await stream.finalMessage();
      onUsage?.({
        input: final.usage.input_tokens,
        output: final.usage.output_tokens,
        cacheRead: final.usage.cache_read_input_tokens ?? 0,
        cacheWrite: final.usage.cache_creation_input_tokens ?? 0,
      });
      if (final.stop_reason === 'refusal') {
        throw new Error(`Model declined the request (${final.stop_details?.category ?? 'no category'})`);
      }
      // Thinking counts against the cap too; a cut-off reply is unfinished JSON.
      if (final.stop_reason === 'max_tokens') {
        throw new Error(`The reply was cut off at ${maxTokens} tokens before it finished.`);
      }
    },
  };
}
