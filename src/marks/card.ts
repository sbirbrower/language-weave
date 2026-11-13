import { LABEL_CSS, themeCss, themed } from '../theme';

export const MARK_CARD_ATTR = 'data-tissage-mark-card';

const STYLES = `
${themeCss(':host')}
:host { all: initial; }
.card {
  position: fixed; top: 16px; right: 16px; z-index: 2147483645; box-sizing: border-box; width: 220px;
  display: grid; gap: 6px; padding: 12px 14px; border-radius: 10px;
  background: var(--surface); color: var(--text); border: 1px solid var(--border); box-shadow: 0 6px 18px var(--shadow);
  font: 12.5px/1.5 var(--font);
}
.card[hidden] { display: none; }
.count { ${LABEL_CSS} font-size: 14px; color: var(--primary); }
.about { color: var(--muted); }
.about i { font-style: italic; color: var(--text); }
.row { display: flex; gap: 12px; }
button { all: unset; cursor: pointer; font-weight: 600; color: var(--primary); }
button.quiet { font-weight: 400; color: var(--muted); }
button:hover { text-decoration: underline; }
button:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
`;

export interface MarkCard {
  /** How many marks are on the page now; 0 hides the card. */
  count(n: number): void;
  stop(): void;
}

/**
 * A small card in the corner while a page is marked: how many marks it has and for which lesson,
 * with "Weave instead" and "Clear". In a shadow root outside <body>, built with DOM calls only.
 */
export function showMarkCard(doc: Document, lesson: string, actions: { weave(): void; clear(): void }): MarkCard {
  removeMarkCard(doc);
  const host = themed(doc.createElement('div'));
  host.setAttribute(MARK_CARD_ATTR, '');
  const root = host.attachShadow({ mode: 'open' });
  const style = doc.createElement('style');
  style.textContent = STYLES;
  const card = doc.createElement('div');
  card.className = 'card';
  card.setAttribute('role', 'status');
  card.hidden = true;
  const count = Object.assign(doc.createElement('span'), { className: 'count' });
  const about = Object.assign(doc.createElement('span'), { className: 'about' });
  about.append('Where the English here can practise ', Object.assign(doc.createElement('i'), { textContent: lesson }), '.');
  const row = Object.assign(doc.createElement('div'), { className: 'row' });
  const weave = Object.assign(doc.createElement('button'), { type: 'button', textContent: 'Weave instead' });
  const clear = Object.assign(doc.createElement('button'), { type: 'button', className: 'quiet', textContent: 'Clear' });
  weave.addEventListener('click', () => actions.weave());
  clear.addEventListener('click', () => actions.clear());
  row.append(weave, clear);
  card.append(count, about, row);
  root.append(style, card);
  doc.documentElement.append(host);
  return {
    count(n) {
      count.textContent = `${n} mark${n === 1 ? '' : 's'} on this page`;
      card.hidden = n === 0;
    },
    stop: () => host.remove(),
  };
}

export function removeMarkCard(doc: Document) {
  for (const host of doc.querySelectorAll(`[${MARK_CARD_ATTR}]`)) host.remove();
}
