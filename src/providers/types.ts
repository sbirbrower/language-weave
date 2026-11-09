import type { TokenUsage } from '../cost';
import type { Effort, Thinking } from '../settings';

export type ProviderId = 'anthropic' | 'openai' | 'gemini' | 'openai-compatible';
/** The APIs the reader can pick in Options. */
export type ChatProvider = 'anthropic' | 'openai' | 'gemini';

export interface ProviderConfig {
  apiKey: string;
  model: string;
  effort: Effort;
  /** 'off' turns thinking off, or as low as the model goes; it is most of each request's time. */
  thinking?: Thinking;
}

export interface CompletionRequest {
  system: string;
  user: string;
  maxTokens: number;
  /** A JSON schema the response must follow (structured output). */
  schema?: Record<string, unknown>;
  /** Called once with the response's token counts after the stream ends. */
  onUsage?: (usage: TokenUsage) => void;
}

export interface Provider {
  id: ProviderId;
  /** Populates the model dropdown from the API rather than a hardcoded list. */
  listModels(): Promise<string[]>;
  /** Streams the response text. */
  complete(req: CompletionRequest): AsyncIterable<string>;
}
