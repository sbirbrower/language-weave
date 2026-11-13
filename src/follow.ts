import { browser } from 'wxt/browser';

/**
 * Every site, optional in the manifest (`wxt.config.ts`): lesson mode asks for it so its widget opens by
 * itself on the tab the reader switches to (`followTo` in `background.ts`). Without it, Language Weave
 * runs only on tabs the reader clicked it on (`activeTab`).
 */
const ALL_SITES = { origins: ['<all_urls>'] };

export const canFollowTabs = () => browser.permissions.contains(ALL_SITES);

/** Chrome shows the prompt only in answer to a click, so call this before the click's handler awaits anything. */
export const askToFollowTabs = () => browser.permissions.request(ALL_SITES);

/** The reader turned following off: Language Weave goes back to running only where it's clicked. */
export const stopFollowingTabs = () => browser.permissions.remove(ALL_SITES);
