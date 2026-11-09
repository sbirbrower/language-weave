import type Anthropic from '@anthropic-ai/sdk';
import type { ChatProvider } from './types';

type ThinkingParam = Anthropic.Beta.Messages.BetaThinkingConfigParam;

/** Whether requests think, given the setting: 'off' only works where the model allows it. */
export function thinks(model: string, setting: 'on' | 'off'): boolean {
  return setting === 'on' || thinkingOff(model) === 'unsupported';
}

/** `thinks` for any provider; OpenAI and Gemini go as low as the model allows when off, so count that as off. */
export function providerThinks(provider: ChatProvider, model: string, setting: 'on' | 'off'): boolean {
  return provider === 'anthropic' ? thinks(model, setting) : setting === 'on';
}

/**
 * How to turn thinking off for a model, or 'unsupported'. Each family takes
 * a different form; Opus 5.5 and Fable can't turn it off at all (lower effort
 * is the only control there). `undefined` = omit the field, which already
 * means no thinking on these older models.
 */
export function thinkingOff(model: string): ThinkingParam | undefined | 'unsupported' {
  const id = model.replace(/-\d{8}$/, '');
  if (/^claude-(opus-5-5|fable|mythos)/.test(id)) return 'unsupported';
  if (id === 'claude-sonnet-5-5') return { type: 'between_tools' };
  if (/^claude-(haiku-5-5|opus-5|sonnet-5)$/.test(id)) return { type: 'disabled' };
  if (/^claude-(opus-4-[678]|sonnet-4-6|haiku-4-5)$/.test(id)) return undefined;
  return 'unsupported';
}
