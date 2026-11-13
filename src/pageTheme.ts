import { browser } from 'wxt/browser';
import { iconButton } from './icons';
import { getSettings, saveSettings } from './settings';
import { fontFaces, LABEL_CSS, THEME_ATTR, THEMES, themeCss, type Theme } from './theme';

/** The theme last shown, kept by the extension's pages so they open in it without waiting on storage. */
const CACHE = 'tissage-theme';

const read = (): Theme | undefined => {
  try {
    const t = localStorage.getItem(CACHE) as Theme | null;
    return t && THEMES.includes(t) ? t : undefined;
  } catch {
    return undefined;
  }
};

function show(theme: Theme) {
  document.documentElement.setAttribute(THEME_ATTR, theme);
  try {
    localStorage.setItem(CACHE, theme);
  } catch {
    // A page that can't keep it reads the setting each time.
  }
}

/**
 * An extension page's look (the popup, Progress, Words, Lessons, Options): the colours of the
 * reader's theme, followed as it changes, the bundled fonts, and the label style. Call it first.
 */
export function startPageTheme() {
  const style = document.createElement('style');
  style.textContent = `${fontFaces((file) => `/fonts/${file}`)}
${themeCss(':root')}
.label { ${LABEL_CSS} }`;
  document.head.prepend(style);
  show(read() ?? 'light');
  void getSettings().then((s) => show(s.theme));
  browser.storage.onChanged.addListener((changes, area) => {
    const theme = (changes.settings?.newValue as { theme?: Theme } | undefined)?.theme;
    if (area === 'local' && theme) show(theme);
  });
}

/** Whether the page is showing dark now: its theme, or the system's when it follows the system. */
export function looksDark(): boolean {
  const theme = document.documentElement.getAttribute(THEME_ATTR);
  return theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
}

/** Saves the reader's theme; every page and the widget follow it. */
export async function setTheme(theme: Theme) {
  show(theme);
  await saveSettings({ theme });
}

/** A button that switches the page between light and dark (a moon, or a sun while dark); every page and the widget follow. */
export function themeSwitch(button: HTMLElement, size = 16) {
  const draw = () => iconButton(button, looksDark() ? 'sun' : 'moon', looksDark() ? 'Light mode' : 'Dark mode', size);
  draw();
  button.addEventListener('click', () => {
    void setTheme(looksDark() ? 'light' : 'dark').then(draw);
    draw();
  });
  return draw;
}
