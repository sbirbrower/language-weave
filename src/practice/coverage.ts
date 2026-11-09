import { browser } from 'wxt/browser';
import { newCoverage, type Coverage } from './schedule';

const keyFor = (lessonId: string) => `practice-coverage|${lessonId}`;

/** What a lesson's Practice tab has practised, in `chrome.storage.local`, kept across sessions until the reader starts afresh. */
export function lessonCoverage(lessonId: string): { load(): Promise<Coverage>; save(coverage: Coverage): void } {
  const key = keyFor(lessonId);
  return {
    async load() {
      const stored = (await browser.storage.local.get(key))[key] as Partial<Coverage> | undefined;
      return { ...newCoverage(), ...stored };
    },
    save(coverage) {
      void browser.storage.local.set({ [key]: coverage });
    },
  };
}
