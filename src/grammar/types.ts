/** The reader's level, a setting (`Settings.level`); grammar points are looked up by it. */
export type Level = 'A1' | 'A2' | 'B1' | 'B2';

export const LEVELS: readonly Level[] = ['A1', 'A2', 'B1', 'B2'];

/**
 * One grammar point a webpage passage can practise. Picked at random from the
 * reader's level, one per passage; written so it fits facts from any page.
 */
export interface GrammarPoint {
  id: string;
  level: Level;
  /** As the learner sees it. */
  label: string;
  /** One sentence telling the writer how to use it with a page's facts. */
  instruction: string;
  /** A short correct sentence in the language. */
  example: string;
}
