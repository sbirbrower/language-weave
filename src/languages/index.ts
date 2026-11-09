import { ar } from './ar';
import { cs } from './cs';
import { de } from './de';
import { es } from './es';
import { pt } from './pt';
import { it } from './it';
import { ru } from './ru';
import { fr } from './fr';
import { gd } from './gd';
import { he } from './he';
import { hi } from './hi';
import { ja } from './ja';
import { ko } from './ko';
import { zh } from './zh';
import type { ScriptView } from '../ruby';
import type { LanguageConfig } from './types';

/** In the order the popup lists them. */
export const languages: Record<string, LanguageConfig> = { fr, de, ja, zh, ko, hi, he, ar, cs, es, pt, ru, it, gd };

export function getLanguage(code: string): LanguageConfig {
  const lang = languages[code];
  if (!lang) throw new Error(`Unknown language: ${code}`);
  return lang;
}

/** The language a prompt names (`displayName`), if Language Weave has it. */
export function languageNamed(name: string): LanguageConfig | undefined {
  return Object.values(languages).find((l) => l.displayName === name);
}

/** A language's `writingNotes` as a prompt line, from the name a prompt uses, or ''. */
export function writingNotesFor(name: string): string {
  const notes = languageNamed(name)?.writingNotes;
  return notes ? `How to write ${name}: ${notes}` : '';
}

/**
 * Whether a reader at `level` sees romaji under the language's words: the popup's level in page
 * mode, a syllabus lesson's ("CEFR A1") in lesson mode.
 */
export function showsRomaji(lang: LanguageConfig, level: string): boolean {
  const cefr = /[ABC][12]/.exec(level)?.[0];
  return Boolean(cefr && lang.romajiLevels?.some((l) => l === cefr));
}

/**
 * How the language's script and its romanisation are shown (`romanSample`), or undefined for a
 * language written in Latin letters. The reader's pick for the language (`Settings.scriptViews`),
 * else romaji under each word at `romajiLevels` and the script alone above them, else readings over it.
 */
export function scriptViewFor(lang: LanguageConfig, level: string, picked: Partial<Record<string, ScriptView>>): ScriptView | undefined {
  if (!lang.romanSample) return undefined;
  return picked[lang.code] ?? (lang.romajiLevels ? (showsRomaji(lang, level) ? 'below' : 'script') : 'above');
}

export type { Gender, LanguageConfig } from './types';
