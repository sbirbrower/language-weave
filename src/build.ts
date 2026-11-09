declare const __BUILD_ID__: string | undefined;

/**
 * Differs between builds. Chrome keeps running the old background worker
 * until the extension is reloaded, but injects content.js and opens the popup
 * from disk, so a rebuild without a reload mixes versions. Messages carry this
 * so the background can refuse a mismatch instead of sending a reply the
 * other side can't read.
 */
export const BUILD_ID = typeof __BUILD_ID__ === 'undefined' ? 'test' : __BUILD_ID__;

export const STALE_BUILD_ERROR =
  'Language Weave was rebuilt, but Chrome is still running the old version. Reload Language Weave to use the new one.';
