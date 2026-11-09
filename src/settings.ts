import { browser } from 'wxt/browser';
import type { Level } from './grammar/types';
import type { OtherProvider, ProviderModels } from './providers/route';
import type { ChatProvider } from './providers/types';
import type { ScriptView } from './ruby';
import type { WidgetPosition, WidgetSize } from './widget';

export type Effort = 'default' | 'low' | 'medium' | 'high';
export type Thinking = 'on' | 'off';

export interface Settings {
  /** The API every model request goes to; OpenAI and Gemini stand in for Claude by tier (`src/providers/route.ts`). */
  provider: ChatProvider;
  anthropicApiKey: string;
  openaiApiKey: string;
  geminiApiKey: string;
  /** With OpenAI or Gemini, the model for each tier the reader picked; a missing one is `DEFAULT_MODELS`'. */
  providerModels: Partial<Record<OtherProvider, Partial<ProviderModels>>>;
  /** Google Cloud Text-to-Speech, for reading passages aloud; '' = no speech. */
  googleTtsKey: string;
  /** TypeSafe, for Jev: the first check on lesson mode's marks (`src/marks/jev.ts`); '' = Haiku checks every mark. */
  typesafeApiKey: string;
  /** Speaking exercises in Practice: the reader turned them on (opt-in; recordings go to DeepInfra). */
  speaking: boolean;
  /** DeepInfra, for Whisper to hear speaking exercises (`src/listen.ts`). */
  deepinfraApiKey: string;
  /** The weave's model, a Claude id (its tier on other providers). */
  model: string;
  /** Sent as `output_config.effort` (OpenAI: `reasoning_effort`, Gemini: `thinkingLevel`); 'default' omits it. */
  effort: Effort;
  /** 'off' where the model allows it: several times faster per request. */
  thinking: Thinking;
  /** Share of English words to replace, 0–1. */
  density: number;
  language: string;
  /**
   * page: words from the page are woven and the widget writes about the part on screen;
   * lesson: the widget teaches `lessonId` with scenes on its theme, follows the reader from tab to tab,
   * and marks or weaves a page only when the popup's buttons ask.
   */
  mode: 'page' | 'lesson';
  /** Page mode: false = the widget teaches with the page's words, but the page itself isn't woven. */
  weavePage: boolean;
  /** The reader's level: the grammar of page-mode passages, and the words the general weave picks (`levelNote`), suit it. */
  level: Level;
  /** What is woven: a weave lesson id ('themed' = words picked for each page), or 'none' for the general weave. */
  weave: string;
  /** The syllabus lesson lesson mode teaches (`src/syllabus/`, or one the reader wrote: `src/syllabus/stored.ts`); 'none' = the language's first. */
  lessonId: string;
  /** The lesson last picked in each language, so switching back to a language picks it up again (kept by `saveSettings`). */
  lessonByLanguage: Partial<Record<string, string>>;
  /** With a lesson, fill the rest of the density budget with general A1 words. */
  topUp: boolean;
  /** The widget's reading format (`src/reading/formats.ts`). */
  readingFormat: string;
  /** Where the reader dragged the widget, kept across pages; null = the corner. */
  widgetPosition: WidgetPosition | null;
  /** The size the reader dragged the widget to, kept across pages; null = the default. */
  widgetSize: WidgetSize | null;
  /** Text size in the widget and the mark popup, as a multiple of the default (`TEXT_SCALES`). */
  textScale: number;
  /** How each language with a romanisation is shown, as the reader last picked it in the widget; none = `scriptViewFor`'s default. */
  scriptViews: Partial<Record<string, ScriptView>>;
  /** The popup asks before weaving a page estimated to cost more than this, in USD. */
  confirmAboveUsd: number;
  /** Logs rejected lines to the page console. Never logs keys. */
  debug: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  provider: 'anthropic',
  anthropicApiKey: '',
  openaiApiKey: '',
  geminiApiKey: '',
  providerModels: {},
  googleTtsKey: '',
  typesafeApiKey: '',
  speaking: false,
  deepinfraApiKey: '',
  model: 'claude-haiku-5-5',
  effort: 'low',
  thinking: 'off',
  density: 0.08,
  language: 'fr',
  mode: 'page',
  weavePage: true,
  level: 'A2',
  weave: 'themed',
  lessonId: 'none',
  lessonByLanguage: {},
  topUp: true,
  readingFormat: 'facts',
  widgetPosition: null,
  widgetSize: null,
  textScale: 1,
  scriptViews: {},
  confirmAboveUsd: 0.2,
  debug: false,
};

const KEY = 'settings';

// Always storage.local: keys must never sync to Google's servers.
export async function getSettings(): Promise<Settings> {
  const stored = await browser.storage.local.get(KEY);
  return { ...DEFAULT_SETTINGS, ...(stored[KEY] as Partial<Settings> | undefined) };
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch };
  if (patch.lessonId !== undefined) next.lessonByLanguage = { ...next.lessonByLanguage, [next.language]: next.lessonId };
  await browser.storage.local.set({ [KEY]: next });
  return next;
}
