import type { PassageState } from './passage/controller';

/**
 * Lesson mode's widget, shared by every browser tab: it opens by itself on a
 * tab the reader switches to, showing what they left (the tab, the passage
 * and its answers, the exercise and its answer), with nothing new written.
 * Kept in `chrome.storage.session`, so it's gone when the browser closes.
 */
export interface LessonState {
  /** Changes with every save, so a tab knows whether it's showing the latest. */
  rev: string;
  /** False once the reader closed the widget: no tab opens it until the popup does. */
  open: boolean;
  /** The syllabus lesson; another lesson starts afresh. */
  lessonId: string;
  widget?: PassageState;
}

/** A stored value: Maps and Sets (the answers) as tagged arrays, since storage keeps only JSON. */
export function encodeLessonState(state: LessonState): string {
  return JSON.stringify(state, (_key, value: unknown) => {
    if (value instanceof Map) return { __map: [...value] };
    if (value instanceof Set) return { __set: [...value] };
    return value;
  });
}

export function decodeLessonState(text: string): LessonState | null {
  try {
    return JSON.parse(text, (_key, value: unknown) => {
      if (value && typeof value === 'object' && '__map' in value) return new Map((value as { __map: [unknown, unknown][] }).__map);
      if (value && typeof value === 'object' && '__set' in value) return new Set((value as { __set: unknown[] }).__set);
      return value;
    }) as LessonState;
  } catch {
    return null;
  }
}

export const newRev = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
