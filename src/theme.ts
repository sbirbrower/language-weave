/**
 * The look every surface shares (widget, popup, pages, the buttons and popups on the page): its
 * colours as CSS custom properties, light by default and dark when the reader picks it (or
 * "system" and the system is dark), and its two typefaces: IBM Plex Sans for text, Alegreya Sans
 * SC for labels, which are set in lower case and so show as small capitals. The fonts are bundled
 * (`public/fonts/`, both SIL OFL), named apart from any the page has.
 */
export type Theme = 'light' | 'dark' | 'system';

export const THEMES: readonly Theme[] = ['light', 'dark', 'system'];

export const THEME_ATTR = 'data-theme';

const LIGHT = {
  bg: '#f6f7f9',
  surface: '#ffffff',
  'surface-2': '#f3f5f8',
  text: '#1b2a44',
  muted: '#5d6878',
  faint: '#b3bcc9',
  line: '#e8ecf2',
  border: '#d5dae3',
  primary: '#233a5e',
  'on-primary': '#ffffff',
  'primary-soft': '#eef1f6',
  green: '#2e7d5b',
  'on-green': '#ffffff',
  'green-soft': '#e7f3ed',
  'green-tint': '#f2f9f5',
  'green-line': '#cfe6da',
  hl: '#ffe58a',
  'warn-bg': '#fff6d6',
  'warn-ink': '#6b5200',
  bad: '#b3402e',
  'bad-ink': '#9a3626',
  'bad-bg': '#fbece8',
  shadow: 'rgb(27 42 68 / 0.12)',
};

const DARK: typeof LIGHT = {
  bg: '#12161d',
  surface: '#1a2029',
  'surface-2': '#222a35',
  text: '#e6eaf0',
  muted: '#9aa5b5',
  faint: '#5b6677',
  line: '#2a323e',
  border: '#364152',
  primary: '#a9bfe3',
  'on-primary': '#10172a',
  'primary-soft': '#26324a',
  green: '#6fcf9f',
  'on-green': '#0e2219',
  'green-soft': '#1f3a2e',
  'green-tint': '#1a2e25',
  'green-line': '#2c5241',
  hl: '#5e4e14',
  'warn-bg': '#3a3216',
  'warn-ink': '#f2d27a',
  bad: '#f08a78',
  'bad-ink': '#f4a595',
  'bad-bg': '#3a2320',
  shadow: 'rgb(0 0 0 / 0.4)',
};

export const FONT = `'LW Plex Sans', 'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif`;
export const LABEL_FONT = `'LW Alegreya Sans SC', 'Alegreya Sans SC', ${FONT}`;

const vars = (colours: typeof LIGHT) =>
  Object.entries(colours)
    .map(([k, v]) => `--${k}: ${v};`)
    .join(' ');

/**
 * The colours for `scope` (`:root` on a page, `:host` in a shadow root), switched by `data-theme` on
 * the page's root or the shadow host: light unless it's "dark", or "system" and the system is dark.
 */
export function themeCss(scope: ':root' | ':host'): string {
  const on = (theme: Theme) => (scope === ':host' ? `:host([${THEME_ATTR}="${theme}"])` : `:root[${THEME_ATTR}="${theme}"]`);
  return `
${scope} { ${vars(LIGHT)} --font: ${FONT}; --label-font: ${LABEL_FONT}; color-scheme: light; }
${on('dark')} { ${vars(DARK)} color-scheme: dark; }
@media (prefers-color-scheme: dark) { ${on('system')} { ${vars(DARK)} color-scheme: dark; } }
`;
}

/** A label: small capitals, from lower case. */
export const LABEL_CSS = `font-family: var(--label-font); font-weight: 500; letter-spacing: 0.05em; text-transform: lowercase;`;

const PLEX: Array<[subset: string, range: string]> = [
  ['cyrillic-ext', 'U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F'],
  ['cyrillic', 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116'],
  ['latin-ext', 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF'],
  ['latin', 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'],
];

/** Every `@font-face`, with each file's URL from `url` (`/fonts/<file>` on the extension's own pages). */
export function fontFaces(url: (file: string) => string): string {
  const face = (family: string, file: string, weight: number, style: string, range: string) =>
    `@font-face { font-family: '${family}'; src: url('${url(file)}') format('woff2'); font-weight: ${weight}; font-style: ${style}; font-display: swap; unicode-range: ${range}; }`;
  const out: string[] = [];
  for (const [subset, range] of PLEX) {
    for (const w of [400, 500, 600, 700]) out.push(face('LW Plex Sans', `ibm-plex-sans-${subset}-${w}-normal.woff2`, w, 'normal', range));
    for (const w of [400, 500]) out.push(face('LW Plex Sans', `ibm-plex-sans-${subset}-${w}-italic.woff2`, w, 'italic', range));
  }
  for (const [subset, range] of PLEX.slice(2)) {
    for (const w of [500, 700]) out.push(face('LW Alegreya Sans SC', `alegreya-sans-sc-${subset}-${w}-normal.woff2`, w, 'normal', range));
  }
  return out.join('\n');
}

const FONTS_ID = 'tissage-fonts';

/**
 * The fonts, declared once on the document: a shadow root's `@font-face` rules aren't used, so the
 * widget and the page's buttons find them here. Only the families above, named apart from the page's.
 */
export function addFonts(doc: Document, url: (file: string) => string) {
  if (doc.getElementById(FONTS_ID)) return;
  const style = doc.createElement('style');
  style.id = FONTS_ID;
  style.textContent = fontFaces(url);
  (doc.head ?? doc.documentElement).append(style);
}

/** The theme the shadow roots on this page take, set from the reader's setting. */
let pageTheme: Theme = 'light';
const HOST_ATTR = 'data-tissage-themed';

/** A shadow root's host takes the theme, now and whenever it changes (`setPageTheme`). */
export function themed<T extends HTMLElement>(host: T): T {
  host.setAttribute(HOST_ATTR, '');
  host.setAttribute(THEME_ATTR, pageTheme);
  return host;
}

/** Changes the theme of everything Language Weave has drawn on the page. */
export function setPageTheme(doc: Document, theme: Theme) {
  pageTheme = theme;
  for (const host of doc.querySelectorAll(`[${HOST_ATTR}]`)) host.setAttribute(THEME_ATTR, theme);
}
