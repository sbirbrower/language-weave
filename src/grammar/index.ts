import { csGrammar } from './cs';
import { deGrammar } from './de';
import { esGrammar } from './es';
import { ptGrammar } from './pt';
import { itGrammar } from './it';
import { ruGrammar } from './ru';
import { frGrammar } from './fr';
import { gdGrammar } from './gd';
import { heGrammar } from './he';
import { arGrammar } from './ar';
import { hiGrammar } from './hi';
import { jaGrammar } from './ja';
import { koGrammar } from './ko';
import { zhGrammar } from './zh';
import type { GrammarPoint, Level } from './types';

const byLanguage: Record<string, GrammarPoint[]> = { fr: frGrammar, de: deGrammar, ja: jaGrammar, zh: zhGrammar, ko: koGrammar, hi: hiGrammar, he: heGrammar, ar: arGrammar, cs: csGrammar, es: esGrammar, pt: ptGrammar, ru: ruGrammar, it: itGrammar, gd: gdGrammar };

/** The grammar points for a language at the reader's level; [] for a language without a list yet. */
export function grammarFor(lang: string, level: Level): GrammarPoint[] {
  return (byLanguage[lang] ?? []).filter((g) => g.level === level);
}

export { LEVELS, type GrammarPoint, type Level } from './types';
