import { anthropicProvider } from './anthropic';
import { geminiProvider } from './gemini';
import { openaiProvider } from './openai';
import type { ChatProvider, Provider, ProviderConfig } from './types';

export function makeProvider(id: ChatProvider, config: ProviderConfig): Provider {
  switch (id) {
    case 'anthropic':
      return anthropicProvider(config);
    case 'openai':
      return openaiProvider(config);
    case 'gemini':
      return geminiProvider(config);
  }
}
