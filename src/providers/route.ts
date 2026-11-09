import type { Settings } from '../settings';
import type { ChatProvider } from './types';

/**
 * Each feature pins a Claude model (`PASSAGE_MODEL`, `KIT_MODEL`, …). With
 * OpenAI or Gemini, that model's tier picks the provider's model instead.
 */
export type ModelTier = 'fast' | 'main' | 'best';
export type ProviderModels = Record<ModelTier, string>;
export type OtherProvider = Exclude<ChatProvider, 'anthropic'>;

/** Haiku → fast, Sonnet → main, Opus and up → best; anything else is treated as main. */
export function tierOf(claudeModel: string): ModelTier {
  if (/haiku/.test(claudeModel)) return 'fast';
  if (/opus|fable|mythos/.test(claudeModel)) return 'best';
  return 'main';
}

// Picked to match the Claude tiers' prices as of 2026-11: Haiku 5.5, Sonnet 5.5, Opus 5.5.
export const DEFAULT_MODELS: Record<OtherProvider, ProviderModels> = {
  openai: { fast: 'gpt-6-luna', main: 'gpt-6.1-sol', best: 'gpt-6-astra' },
  gemini: { fast: 'gemini-3.5-flash-lite', main: 'gemini-3.8-flash', best: 'gemini-4-argon' },
};

export const PROVIDER_NAMES: Record<ChatProvider, string> = { anthropic: 'Anthropic', openai: 'OpenAI', gemini: 'Google Gemini' };

type RouteSettings = Pick<Settings, 'provider' | 'anthropicApiKey' | 'openaiApiKey' | 'geminiApiKey' | 'providerModels'>;

export function apiKeyFor(s: RouteSettings): string {
  return { anthropic: s.anthropicApiKey, openai: s.openaiApiKey, gemini: s.geminiApiKey }[s.provider];
}

export function modelsFor(s: Pick<Settings, 'providerModels'>, provider: OtherProvider): ProviderModels {
  return { ...DEFAULT_MODELS[provider], ...s.providerModels[provider] };
}

/** The model a request goes to: `claudeModel` itself on Anthropic, else the provider's model for its tier. */
export function routeModel(s: RouteSettings, claudeModel: string): string {
  if (s.provider === 'anthropic') return claudeModel;
  return modelsFor(s, s.provider)[tierOf(claudeModel)];
}
