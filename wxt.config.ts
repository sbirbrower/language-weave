import { existsSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { defineConfig } from 'wxt';

// One id per build, shared by every entrypoint; see src/build.ts.
const buildId = Date.now().toString(36);

// Word recordings kept locally (src/recordings.ts): gitignored, in the unpacked build only, never in a zip.
const RECORDINGS = resolve('local/recordings');
const filesIn = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? filesIn(join(dir, e.name)) : [join(dir, e.name)]));

export default defineConfig({
  vite: () => ({ define: { __BUILD_ID__: JSON.stringify(buildId) } }),
  hooks: {
    'build:publicAssets': (_wxt, files) => {
      if (!existsSync(RECORDINGS)) return;
      for (const file of filesIn(RECORDINGS)) files.push({ absoluteSrc: file, relativeDest: join('recordings', relative(RECORDINGS, file)) });
    },
  },
  zip: { exclude: ['recordings/**'], excludeSources: ['local/**'] },
  manifest: {
    name: 'Language Weave',
    description: 'Weaves a language you are learning into English web pages, and teaches it.',
    // offscreen: speaking exercises record there (src/listen.ts).
    permissions: ['storage', 'activeTab', 'scripting', 'offscreen'],
    // The APIs the background calls: src/providers/, src/speech.ts, src/listen.ts, src/marks/jev.ts.
    host_permissions: [
      'https://api.anthropic.com/*',
      'https://api.openai.com/*',
      'https://generativelanguage.googleapis.com/*',
      'https://texttospeech.googleapis.com/*',
      'https://api.deepinfra.com/*',
      'https://api.typesafe.ai/*',
    ],
    // Every site, asked for when the reader picks lesson mode (src/follow.ts), so its widget opens by itself
    // on the tab they switch to. Without it, Language Weave runs only on tabs it's clicked on (activeTab).
    optional_host_permissions: ['<all_urls>'],
    // The widget's fonts (src/theme.ts), loaded from the page it's drawn on.
    web_accessible_resources: [{ resources: ['fonts/*.woff2'], matches: ['<all_urls>'] }],
    commands: {
      'weave-page': {
        suggested_key: { default: 'Alt+Shift+W' },
        description: 'Weave this page',
      },
    },
  },
});
