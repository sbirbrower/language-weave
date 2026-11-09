import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

// Evals call the real API; they're kept out of `npm test`.
export default defineConfig({
  plugins: [WxtVitest()],
  test: { environment: 'jsdom', include: ['evals/**/*.eval.ts'] },
});
