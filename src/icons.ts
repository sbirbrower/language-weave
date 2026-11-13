/**
 * Small line icons, drawn in the current colour, for buttons everywhere: the widget, the
 * popup, the pages and the buttons on the page. Built with DOM calls, never innerHTML.
 */
const PATHS = {
  play: { d: 'M7 4.5v15l12-7.5z', fill: true },
  pause: { d: 'M6 4h4v16H6zM14 4h4v16h-4z', fill: true },
  star: { d: 'm12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z' },
  check: { d: 'M5 12.5 10 17 19 7' },
  moon: { d: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z' },
  sun: { d: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4' },
  minus: { d: 'M5 12h14' },
  plus: { d: 'M12 5v14M5 12h14' },
  close: { d: 'M6 6l12 12M18 6 6 18' },
  bulb: { d: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z' },
  mic: { d: 'M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3' },
  again: { d: 'M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4' },
  chevron: { d: 'm6 9 6 6 6-6' },
  arrow: { d: 'M5 12h14M13 6l6 6-6 6' },
  back: { d: 'M19 12H5M11 6l-6 6 6 6' },
  slow: { d: 'M4 16h11a5 5 0 0 0-10 0M15 16h2a3 3 0 0 0 3-3v-1M8 16v2M13 16v2' },
} as const;

export type IconName = keyof typeof PATHS;

const SVG = 'http://www.w3.org/2000/svg';

/** An icon `size` px square, hidden from screen readers (its button carries the label). */
export function icon(doc: Document, name: IconName, size = 14): SVGSVGElement {
  const { d, fill } = PATHS[name] as { d: string; fill?: boolean };
  const svg = doc.createElementNS(SVG, 'svg');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('class', `icon icon-${name}`);
  const path = doc.createElementNS(SVG, 'path');
  path.setAttribute('d', d);
  if (fill) {
    path.setAttribute('fill', 'currentColor');
  } else {
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', name === 'check' ? '2.4' : '2');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
  }
  svg.append(path);
  return svg;
}

/** Sets `button`'s content to an icon, with `label` for screen readers and as its tooltip. */
export function iconButton(button: HTMLElement, name: IconName, label: string, size?: number): HTMLElement {
  button.replaceChildren(icon(button.ownerDocument, name, size));
  button.setAttribute('aria-label', label);
  return button;
}
