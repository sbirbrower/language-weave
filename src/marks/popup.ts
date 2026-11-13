import { setDirection } from '../direction';
import { iconButton } from '../icons';
import { rubyNodes, scriptStyles, withoutReadings } from '../ruby';
import { LABEL_CSS, themeCss, themed } from '../theme';
import { markFor } from './write';

export const MARK_POPUP_ATTR = 'data-tissage-mark-popup';

const WIDTH = 300;
const GAP = 6;
const EDGE = 8;

const STYLES = `
${themeCss(':host')}
:host { all: initial; }
.pop {
  --scale: 1;
  position: fixed; z-index: 2147483646; box-sizing: border-box; width: max-content; max-width: min(calc(${WIDTH}px * var(--scale)), calc(100vw - ${2 * EDGE}px));
  padding: 12px 14px; border-radius: 10px; background: var(--surface); color: var(--text);
  border: 1px solid var(--border); box-shadow: 0 10px 26px var(--shadow);
  font: 14px/1.45 var(--font);
}
.pop[hidden] { display: none; }
/* The widget's text size. */
.pop > * { zoom: var(--scale); }
.row { display: flex; align-items: flex-start; gap: 10px; }
.row > .target { flex: 1; }
.target { font-weight: 600; font-size: 16px; }
.english { color: var(--muted); font-size: 12.5px; }
.point { ${LABEL_CSS} font-size: 13.5px; color: var(--green); margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--line); }
button {
  all: unset; cursor: pointer; flex: none; order: -1; width: 26px; height: 26px; border-radius: 13px; display: grid; place-items: center;
  color: var(--green); background: var(--green-soft);
}
button:hover { background: var(--green); color: var(--on-green); }
button:focus-visible { outline: 2px solid var(--primary); outline-offset: 1px; }
${scriptStyles(true)}
`;

/** Where the popup goes: under the mark, kept inside the window; above it when there's no room below. */
export function popupSpot(mark: { left: number; top: number; bottom: number }, size: { width: number; height: number }, view: { width: number; height: number }) {
  const left = Math.max(EDGE, Math.min(mark.left, view.width - size.width - EDGE));
  const below = mark.bottom + GAP;
  const top = below + size.height <= view.height - EDGE ? below : Math.max(EDGE, mark.top - GAP - size.height);
  return { left, top };
}

export interface MarkPopup {
  stop(): void;
}

/**
 * The popup a click on a mark (or its gloss) opens: the target language, the
 * English and the lesson point, with a speaker button when `say` is given (and `can` read it), at
 * the widget's text size (`textScale`). The mark's note isn't shown: it was
 * unreliable and rarely helped. Closes on a click elsewhere, Escape or scrolling. A click on
 * a mark inside a link opens the popup instead of following the link. Lives in
 * a shadow root outside <body>, like the widget, built with DOM calls only.
 */
export function showMarkPopup(doc: Document, say?: (text: string) => void, textScale?: () => number, can?: (text: string) => boolean): MarkPopup {
  removeMarkPopup(doc);
  const win = doc.defaultView!;
  const host = themed(doc.createElement('div'));
  host.setAttribute(MARK_POPUP_ATTR, '');
  const root = host.attachShadow({ mode: 'open' });
  const style = doc.createElement('style');
  style.textContent = STYLES;
  const pop = doc.createElement('div');
  pop.className = 'pop';
  pop.setAttribute('role', 'dialog');
  pop.hidden = true;
  root.append(style, pop);
  doc.documentElement.append(host);

  const line = (cls: string, text: string, lang?: string) => {
    const el = doc.createElement('div');
    el.className = cls;
    el.append(...rubyNodes(doc, text));
    setDirection(el, text);
    if (lang) el.lang = lang;
    return el;
  };

  function open(mark: HTMLElement) {
    const { target = '', pointLabel = '' } = mark.dataset;
    const gloss = mark.nextElementSibling as HTMLElement | null;
    const head = doc.createElement('div');
    head.className = 'row';
    head.append(line('target', target, gloss?.lang || undefined));
    if (say && target && (can?.(target) ?? true)) {
      const button = iconButton(doc.createElement('button'), 'play', `Listen slowly: ${withoutReadings(target)}`, 10);
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        say(target);
      });
      head.append(button);
    }
    pop.replaceChildren(
      head,
      line('english', mark.textContent ?? ''),
      ...(pointLabel ? [line('point', pointLabel)] : []),
    );
    pop.style.setProperty('--scale', String(textScale?.() ?? 1));
    pop.setAttribute('aria-label', withoutReadings(target));
    pop.hidden = false;
    const rects = mark.getClientRects();
    const first = rects[0] ?? mark.getBoundingClientRect();
    const last = rects[rects.length - 1] ?? first;
    const spot = popupSpot(
      { left: first.left, top: first.top, bottom: last.bottom },
      { width: pop.offsetWidth || WIDTH, height: pop.offsetHeight },
      { width: doc.documentElement.clientWidth || win.innerWidth, height: win.innerHeight },
    );
    pop.style.left = `${spot.left}px`;
    pop.style.top = `${spot.top}px`;
  }
  const close = () => (pop.hidden = true);

  const onClick = (e: Event) => {
    if (e.target === host) return;
    const mark = markFor(e.target as Element | null);
    if (!mark) return close();
    // A mark inside a link opens its popup instead of following the link.
    e.preventDefault();
    e.stopPropagation();
    open(mark);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') return close();
    const mark = (e.key === 'Enter' || e.key === ' ') && markFor(e.target as Element | null);
    if (!mark) return;
    e.preventDefault();
    open(mark);
  };

  doc.addEventListener('click', onClick, true);
  doc.addEventListener('keydown', onKey, true);
  // Fixed to the window, so it would drift off the mark.
  win.addEventListener('scroll', close, { passive: true, capture: true });

  return {
    stop() {
      doc.removeEventListener('click', onClick, true);
      doc.removeEventListener('keydown', onKey, true);
      win.removeEventListener('scroll', close, { capture: true });
      host.remove();
    },
  };
}

export function removeMarkPopup(doc: Document) {
  for (const host of doc.querySelectorAll(`[${MARK_POPUP_ATTR}]`)) host.remove();
}
