import { setDirection } from '../direction';
import { composeBlock } from '../hangul';
import { icon, iconButton, type IconName } from '../icons';
import { italicSpans } from '../passage/textbook';
import { rubyNodes, withoutReadings } from '../ruby';
import { el, sameAnswer } from '../widget';
import { getExerciseType } from './exercises';
import { hasHint } from './hint';
import { grade, playsOut, type Answer } from './session';
import type { Exercise, Line, Option, Practice, Prompt, Step } from './types';

/** What the Practice tab shows: the exercise, what the reader has done in it, and how they've done so far. */
export interface PracticeView {
  practice?: Practice;
  /** "Writing…", an error. */
  note?: string;
  answer: Answer;
  /** Right or wrong once checked (or finished, for pairs and a conversation). */
  result?: boolean;
  /** The hint, once asked for: `{}` while it's still being written. */
  hint?: { text?: string; error?: string };
  /** The reader asked for the answer after the hint: finished, and counted as not right. */
  revealed?: boolean;
  /** A finished exercise looked back at: which of how many past ones. */
  past?: { at: number; of: number };
  /** Exercises answered in this tab, and how many right. */
  tally: { right: number; total: number };
  /** Lesson mode: how many of the lesson's points have been practised, in any session. */
  progress?: { practised: number; points: number };
}

export interface PracticeControls {
  /** Checks the answer on screen. */
  check(): void;
  /** An exercise that plays out (pairs, a conversation) is finished. */
  settle(right: boolean): void;
  /** The next exercise, written while this one was done. */
  another(): void;
  /** Another exercise like the one on screen: same type, point and setting. */
  like(): void;
  /** Lesson mode: forgets what the lesson has practised, so planning starts afresh; none = no button. */
  reset?(): void;
  /** Shows the exercise's hint; none = no Hint button. */
  hint?(): void;
  /** Gives up on the exercise and shows its answer. */
  reveal(): void;
  /** Steps back through the exercises finished in this tab; none = nothing to go back to. */
  back?(): void;
  /** Steps forward again, ending on the exercise on screen. */
  forward(): void;
  redraw(): void;
  /** Reads target-language text aloud, slowly for a single word; none = no speech. */
  say?(text: string, slow?: boolean): void;
  /** Which texts `say` can read (`Speaker.can`: only those recorded); unset, any. */
  canSay?(text: string): boolean;
  /** Starts recording the reader, or stops and hears it; none = no microphone. */
  record?(): void;
}

type Doc = Document;

/** Target-language text with `*marked*` words in the accent colour, and readings as ruby. */
function fr(doc: Doc, text: string, className = 'fr') {
  const span = el(doc, 'span', className);
  span.append(...italicSpans(text).flatMap((p) => (p.italic ? [el(doc, 'b', 'mark', p.text)] : rubyNodes(doc, p.text))));
  return setDirection(span, text);
}

/** Target-language text as written, with no readings or romaji: a drill on reading the script. `*Marked*` letters are still marked. */
function plainText(doc: Doc, text: string, className = 'fr') {
  const span = el(doc, 'span', className);
  span.append(...italicSpans(withoutReadings(text)).map((p) => (p.italic ? el(doc, 'b', 'mark', p.text) : doc.createTextNode(p.text))));
  return setDirection(span, text);
}

/** English with `*target-language*` words in italics. */
function prose(doc: Doc, className: string, text: string) {
  const p = el(doc, 'p', className);
  p.append(...italicSpans(text).flatMap((x) => (x.italic ? [el(doc, 'i', '', x.text)] : rubyNodes(doc, x.text))));
  return setDirection(p, text);
}

function button(doc: Doc, className: string, text: string, onClick?: () => void) {
  const b = el(doc, 'button', className, text);
  if (onClick) b.addEventListener('click', onClick);
  else b.setAttribute('disabled', '');
  return b;
}

/** A button with an icon before its text. */
function withIcon(b: HTMLElement, name: IconName) {
  b.prepend(icon(b.ownerDocument, name, 13));
  return b;
}

/** Whether `text` gets a play button. */
const sayable = (c: PracticeControls, text: string) => Boolean(c.say) && (c.canSay?.(text.replace(/\*/g, '')) ?? true);

/** A play button for target-language text: slowly for a word, at speed for a sentence. */
function sayButton(doc: Doc, text: string, c: PracticeControls) {
  const spoken = text.replace(/\*/g, '');
  const b = iconButton(el(doc, 'button', 'say-word'), 'play', `Listen: ${withoutReadings(spoken)}`, 9);
  b.addEventListener('click', () => c.say?.(spoken, !/\s/.test(spoken.trim())));
  return b;
}

/** A line of the language with its English under it, once `showEn`. */
function lineNode(doc: Doc, line: Line, showEn: boolean, className = 'line') {
  const row = el(doc, 'div', className);
  row.append(fr(doc, line.text));
  if (showEn && line.en) row.append(el(doc, 'span', 'en', line.en));
  return row;
}

/**
 * An option; `plain` shows its text as written, with no readings or romaji (a drill on the script, not yet answered).
 * `done`: answered, so `enAfter` shows.
 */
function optionButton(doc: Doc, o: Option, state: string, onClick?: () => void, plain = false, done = false) {
  const b = button(doc, `px-opt ${state}`.trim(), '', onClick);
  if (o.emoji) b.append(el(doc, 'span', '', o.emoji));
  if (o.text) {
    const text = el(doc, 'span', '');
    text.append(plain ? plainText(doc, o.text, '') : fr(doc, o.text, ''));
    const en = [o.en, done ? o.enAfter : ''].filter(Boolean).join(', ');
    if (en) text.append(el(doc, 'span', 'en', en));
    b.append(text);
  }
  b.setAttribute('aria-label', withoutReadings([o.text, o.en, done ? o.enAfter : ''].filter(Boolean).join(', ') || o.emoji || ''));
  return b;
}

function message(doc: Doc, m: { from: string; lines: Line[] }, done: boolean, c: PracticeControls) {
  const box = el(doc, 'div', 'px-msg');
  const all = m.lines.map((l) => l.text).join(' ');
  if (m.from || (m.lines.length && sayable(c, all))) {
    const from = el(doc, 'div', 'px-from', m.from);
    if (m.lines.length && sayable(c, all)) from.append(sayButton(doc, all, c));
    box.append(from);
  }
  box.append(...m.lines.map((l) => lineNode(doc, l, done)));
  return box;
}

/** The audio to play, or with no speech a button that shows it; its text and English once answered. */
function audio(doc: Doc, text: string, en: string | undefined, done: boolean, a: Answer, c: PracticeControls) {
  const box = el(doc, 'div', 'px-audio');
  if (sayable(c, text)) {
    box.append(withIcon(button(doc, 'px-play', 'Play', () => c.say!(text)), 'play'), withIcon(button(doc, 'px-alt', 'Slowly', () => c.say!(text, true)), 'slow'));
  } else if (!a.shown && !done) {
    box.append(el(doc, 'p', 'hint', 'Audio is off (no speech key in Options).'), button(doc, 'px-alt', 'Show the text', () => {
      a.shown = true;
      c.redraw();
    }));
  }
  if (done || a.shown) box.append(lineNode(doc, { text, en: en ?? '' }, done, 'px-heard'));
  return box;
}

function prompt(doc: Doc, p: Prompt, done: boolean, a: Answer, c: PracticeControls): Node[] {
  const out: Node[] = [];
  if (p.question) out.push(prose(doc, 'px-q', p.question));
  if (p.message) out.push(message(doc, p.message, done, c));
  if (p.emoji || p.text) {
    const big = el(doc, 'div', 'px-prompt');
    if (p.emoji) big.append(el(doc, 'span', 'px-emoji', p.emoji));
    // A drill on the script shows it bare, and nothing that would give its answer away, until it's answered.
    if (p.text) big.append(p.plain && !done ? plainText(doc, p.text) : fr(doc, p.text));
    // A gap is read as a pause, so the sentence can be heard before it's answered.
    const said = p.text?.replace(/_{3,}/g, '…');
    if (said && sayable(c, said) && (done || (!p.plain && !p.quiet))) big.append(sayButton(doc, said, c));
    out.push(big);
    if (done && p.en) out.push(el(doc, 'p', 'en', p.en));
  }
  if (p.audio) out.push(audio(doc, p.audio, p.en, done, a, c));
  return out;
}

const stateOf = (done: boolean, i: number, answer: number, picked: number | undefined) =>
  done ? (i === answer ? 'right' : i === picked ? 'wrong' : '') : i === picked ? 'picked' : '';

function body(doc: Doc, step: Step, view: PracticeView, c: PracticeControls): Node[] {
  const a = view.answer;
  const done = view.result !== undefined;
  const redrawWith = (change: () => void) => () => {
    change();
    c.redraw();
  };
  switch (step.kind) {
    case 'choice': {
      const p = done && step.full ? { ...step.prompt, text: step.full.text, en: step.full.en } : step.prompt;
      const grid = el(doc, 'div', step.options.every((o) => o.emoji && !o.text) ? 'px-opts emoji' : 'px-opts');
      const plain = Boolean(step.prompt.plain) && !done;
      step.options.forEach((o, i) => grid.append(optionButton(doc, o, stateOf(done, i, step.answer, a.pick), done ? undefined : redrawWith(() => (a.pick = i)), plain, done)));
      const out = [...prompt(doc, p, done, a, c), grid];
      if (done && step.more) {
        const more = el(doc, 'div', 'px-full');
        more.append(...step.more.map((l) => lineNode(doc, l, true)));
        out.push(more);
      }
      return out;
    }
    case 'label': {
      const list = el(doc, 'div', 'px-items');
      step.items.forEach((item, i) => {
        const picked = a.labels.get(i);
        const row = el(doc, 'div', `px-item${done ? (picked === item.label ? ' is-right' : ' is-wrong') : ''}`);
        if (step.say && sayable(c, item.text)) {
          const said = el(doc, 'div', 'px-said-item');
          said.append(sayButton(doc, item.text, c), lineNode(doc, item, done));
          row.append(said);
        } else {
          row.append(lineNode(doc, item, done));
        }
        const labels = el(doc, 'div', 'px-row');
        step.labels.forEach((l, k) =>
          labels.append(optionButton(doc, l, `px-label ${stateOf(done, k, item.label, picked)}`, done ? undefined : redrawWith(() => a.labels.set(i, k)), false, done)),
        );
        row.append(labels);
        if (done && (item.fix || (item.why && picked !== item.label))) {
          const fix = el(doc, 'div', 'px-fix');
          if (item.fix) fix.append(fr(doc, `→ ${item.fix}`));
          if (item.why) fix.append(el(doc, 'span', 'en', item.why));
          row.append(fix);
        }
        list.append(row);
      });
      return [...prompt(doc, step.prompt, done, a, c), list];
    }
    case 'order': {
      const out = prompt(doc, step.prompt, done, a, c);
      if (step.ends) {
        const ends = el(doc, 'div', 'px-ends');
        ends.append(el(doc, 'span', '', `↑ ${step.ends[0]}`), el(doc, 'span', '', `${step.ends[1]} ↓`));
        out.push(ends);
      }
      if (step.preview) {
        // What the letters placed so far make: Arabic joined as it's written, or a Hangul block.
        const letters = a.order.map((i) => step.tiles[i]!);
        const made = step.preview === 'block' ? composeBlock(letters) : letters.join('');
        out.push(setDirection(el(doc, 'div', 'px-preview', made), made));
      }
      const placed = el(doc, 'div', `px-placed ${step.layout}`);
      a.order.forEach((t, k) =>
        placed.append(button(doc, `px-tile${done ? (view.result ? ' right' : ' wrong') : ''}`, step.tiles[t]!, done ? undefined : redrawWith(() => a.order.splice(k, 1)))),
      );
      // Tiles of a right-to-left sentence go from right to left; the empty box keeps its English hint as it is.
      if (a.order.length) setDirection(placed, step.tiles.join(' '));
      else placed.append(el(doc, 'p', 'hint', step.layout === 'list' ? 'Tap them in order.' : 'Tap the tiles to build it.'));
      const bank = setDirection(el(doc, 'div', `px-bank ${step.layout}`), step.tiles.join(' '));
      step.tiles.forEach((t, i) => {
        if (!a.order.includes(i)) bank.append(button(doc, 'px-tile', t, done ? undefined : redrawWith(() => a.order.push(i))));
      });
      out.push(placed, bank);
      if (done && (!view.result || step.full.some((l) => l.en))) {
        const full = el(doc, 'div', 'px-full');
        full.append(...step.full.map((l) => lineNode(doc, l, true)));
        out.push(full);
      }
      return out;
    }
    case 'pairs':
      return [pairs(doc, step, a, c)];
    case 'tap': {
      const out = prompt(doc, step.prompt, done, a, c);
      if (step.insert) {
        const insert = lineNode(doc, step.insert, done, 'px-insert');
        out.push(insert);
      }
      const list = el(doc, 'div', 'px-lines');
      const picked = a.taps.size ? [...a.taps][0] : undefined;
      const tapAt = (k: number) => (done ? undefined : redrawWith(() => (a.taps = new Set([k]))));
      step.lines.forEach((l, i) => {
        if (step.gaps) list.append(button(doc, `px-gap ${stateOf(done, i, step.answer, picked)}`.trim(), done && i === step.answer ? '⤷ here' : '＋', tapAt(i)));
        const row = step.gaps ? el(doc, 'div', 'px-line-static') : button(doc, `px-line ${stateOf(done, i, step.answer, picked)}`.trim(), '', tapAt(i));
        if (l.speaker) row.append(el(doc, 'span', 'px-speaker', l.speaker));
        row.append(fr(doc, l.text));
        if (done && l.en) row.append(el(doc, 'span', 'en', l.en));
        list.append(row);
      });
      if (step.gaps) {
        const end = step.lines.length;
        list.append(button(doc, `px-gap ${stateOf(done, end, step.answer, picked)}`.trim(), done && end === step.answer ? '⤷ here' : '＋', tapAt(end)));
      }
      out.push(list);
      return out;
    }
    case 'proofread': {
      const found = new Set([...a.taps].map((i) => step.tokens[i]!.error));
      const para = setDirection(el(doc, 'p', 'px-proof'), step.tokens.map((t) => t.text).join(' '));
      step.tokens.forEach((t, i) => {
        const tapped = a.taps.has(i);
        const state = done ? (t.error >= 0 ? (found.has(t.error) ? 'right' : 'missed') : tapped ? 'wrong' : '') : tapped ? 'picked' : '';
        const b = el(doc, 'button', `px-word ${state}`.trim());
        b.append(...rubyNodes(doc, t.text));
        if (!done) b.addEventListener('click', redrawWith(() => (tapped ? a.taps.delete(i) : a.taps.add(i))));
        para.append(b);
      });
      const out = [...prompt(doc, step.prompt, done, a, c), para];
      if (done && step.en) out.push(el(doc, 'p', 'en', step.en));
      if (done) {
        const fixes = el(doc, 'div', 'px-full');
        for (const e of step.errors) {
          const row = el(doc, 'div', 'px-fix');
          row.append(fr(doc, e.fix ? `${e.text} → ${e.fix}` : e.text), el(doc, 'span', 'en', e.why));
          fixes.append(row);
        }
        out.push(fixes);
      }
      return out;
    }
    case 'fix': {
      const out = prompt(doc, step.prompt, done, a, c);
      const chunks = setDirection(el(doc, 'div', step.layout === 'list' ? 'px-lines' : 'px-row'), step.chunks.join(' '));
      step.chunks.forEach((chunk, i) => {
        const state = done ? (i === step.wrong ? 'wrong' : i === a.at ? 'picked' : '') : i === a.at ? 'picked' : '';
        const cls = step.layout === 'list' ? `px-line ${state}` : `px-tile ${state}`;
        const b = button(doc, cls.trim(), chunk, done ? undefined : redrawWith(() => ((a.at = i), (a.pick = undefined))));
        if (done && step.chunksEn?.[i]) b.append(el(doc, 'span', 'en', step.chunksEn[i]));
        chunks.append(b);
      });
      out.push(chunks);
      if (a.at !== undefined || done) {
        out.push(el(doc, 'p', 'hint', done ? 'The fix:' : 'Replace it with:'));
        const grid = el(doc, 'div', 'px-opts');
        step.options.forEach((o, k) => grid.append(optionButton(doc, { text: o, enAfter: step.optionsEn?.[k] }, stateOf(done, k, step.answer, a.pick), done ? undefined : redrawWith(() => (a.pick = k)), false, done)));
        out.push(grid);
      }
      if (done) {
        const full = el(doc, 'div', 'px-full');
        full.append(lineNode(doc, step.full, true));
        out.push(full);
      }
      return out;
    }
    case 'dialogue':
      return [dialogue(doc, step, a, c)];
    case 'speak':
      return [...prompt(doc, step.prompt, done, a, c), spoken(doc, a, done, c)];
    case 'units':
      return [...prompt(doc, step.prompt, done, a, c), ...units(doc, step, view, c)];
    case 'write':
      return [...prompt(doc, step.prompt, done, a, c), ...written(doc, step, view, c)];
  }
}

/** Letters or syllables to tap, word by word; once answered, the ones missed underlined and the word with its English. */
function units(doc: Doc, step: Extract<Exercise, { kind: 'units' }>, view: PracticeView, c: PracticeControls): Node[] {
  const a = view.answer;
  const done = view.result !== undefined;
  const want = new Set(step.answer);
  const row = setDirection(el(doc, 'div', `px-units${step.boxed ? ' boxed' : ''}`), step.words.flat().join(''));
  let n = 0;
  for (const w of step.words) {
    const word = el(doc, 'span', 'px-unit-word');
    for (const u of w) {
      const i = n++;
      const tapped = a.taps.has(i);
      const state = done ? (want.has(i) ? (tapped ? 'right' : 'missed') : tapped ? 'wrong' : '') : tapped ? 'picked' : '';
      const b = el(doc, 'button', `px-unit ${state}`.trim(), u);
      b.setAttribute('aria-pressed', String(tapped));
      if (done) b.setAttribute('disabled', '');
      else
        b.addEventListener('click', () => {
          if (step.single) a.taps = new Set(tapped ? [] : [i]);
          else if (tapped) a.taps.delete(i);
          else a.taps.add(i);
          c.redraw();
        });
      word.append(b);
    }
    row.append(word);
  }
  const out: Node[] = [row];
  if (done && step.full) {
    const full = el(doc, 'div', 'px-full');
    const line = lineNode(doc, step.full, true);
    if (sayable(c, step.full.text)) line.append(sayButton(doc, step.full.text, c));
    full.append(line);
    out.push(full);
  }
  return out;
}

/** A box to type what's heard (Enter checks); once answered, the right spelling, and a word if only accents were off. */
function written(doc: Doc, step: Extract<Exercise, { kind: 'write' }>, view: PracticeView, c: PracticeControls): Node[] {
  const a = view.answer;
  const done = view.result !== undefined;
  const input = el(doc, 'input', 'px-type') as HTMLInputElement;
  input.type = 'text';
  input.value = a.typed ?? '';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('autocapitalize', 'off');
  input.setAttribute('aria-label', 'What you heard');
  if (done) input.disabled = true;
  else {
    // Typing doesn't redraw (that would lose the caret); it only wakes the Check button.
    input.addEventListener('input', () => {
      a.typed = input.value;
      const check = input.closest('.px')?.querySelector<HTMLButtonElement>('.px-check');
      if (check) check.disabled = !input.value.trim();
    });
    input.addEventListener('keydown', (e) => {
      // Kept from the page, whose shortcuts would otherwise take the keys.
      e.stopPropagation();
      if (e.key === 'Enter' && input.value.trim()) c.check();
    });
  }
  const out: Node[] = [input];
  if (done) {
    if (!view.result && sameAnswer(a.typed ?? '', step.answer)) out.push(el(doc, 'p', 'hint', 'Almost: only the accents are off.'));
    const full = el(doc, 'div', 'px-full');
    full.append(lineNode(doc, { text: step.answer, en: step.prompt.en ?? '' }, true));
    out.push(full);
  }
  return out;
}

/** The record button, then what was heard: the sentence's words, those not heard greyed out. */
function spoken(doc: Doc, a: Answer, done: boolean, c: PracticeControls) {
  const s = a.spoken ?? { tries: 0 };
  const box = el(doc, 'div', 'px-speak');
  if (!done) {
    if (!c.record) box.append(el(doc, 'p', 'hint', 'Speaking is off (Language Weave options).'));
    else if (s.status === 'hearing') box.append(el(doc, 'p', 'hint', 'Listening…'));
    else {
      const on = s.status === 'recording';
      const label = on ? 'Stop' : s.tries ? 'Try again' : 'Record';
      box.append(iconButton(button(doc, `px-go px-rec${on ? ' on' : ''}`, '', c.record), on ? 'pause' : 'mic', label, 24), el(doc, 'span', 'px-rec-label', on ? 'tap to stop' : s.tries ? 'tap to try again' : 'tap to record'));
    }
  }
  if (s.heard && s.status !== 'hearing') {
    const words = setDirection(el(doc, 'p', 'px-said'), s.heard.words.map((w) => w.text).join(' '));
    for (const w of s.heard.words) words.append(el(doc, 'span', w.heard ? 'got' : 'missed', w.text), doc.createTextNode(s.heard.spaced ? ' ' : ''));
    box.append(words, el(doc, 'p', 'en', s.heard.text ? `Heard: “${s.heard.text}”` : 'Nothing was heard.'));
    if (!done && s.heard.tier === 'retry') box.append(el(doc, 'p', 'hint', 'Not quite. Listen once more, then try again, a little slower.'));
  }
  if (s.error && !s.status) box.append(el(doc, 'p', 'note', s.error));
  return box;
}

/** Words on the left, partners shuffled on the right: tap one, then the other. */
function pairs(doc: Doc, step: Extract<Exercise, { kind: 'pairs' }>, a: Answer, c: PracticeControls) {
  const p = a.pairs;
  const box = el(doc, 'div', 'match');
  const left = el(doc, 'div', 'col');
  const right = el(doc, 'div', 'col');
  step.pairs.forEach((pair, k) => {
    const done = p.done.has(k);
    const b = button(doc, `px-tile ${done ? 'right' : p.picked === k ? 'picked' : ''}`.trim(), pair.left, done ? undefined : () => {
      p.picked = k;
      p.miss = undefined;
      c.redraw();
    });
    if (sayable(c, pair.left)) {
      const row = el(doc, 'div', 'word');
      row.append(sayButton(doc, pair.left, c), b);
      left.append(row);
    } else {
      left.append(b);
    }
  });
  for (const k of step.shuffle) {
    const done = p.done.has(k);
    right.append(button(doc, `px-tile ${done ? 'right' : p.miss === k ? 'wrong' : ''}`.trim(), step.pairs[k]!.right, done ? undefined : () => {
      if (p.picked === undefined) return;
      if (p.picked === k) {
        p.done.add(k);
        p.picked = undefined;
        p.miss = undefined;
        if (p.done.size === step.pairs.length) return c.settle(p.misses === 0);
      } else {
        p.miss = k;
        p.misses++;
      }
      c.redraw();
    }));
  }
  box.append(left, right);
  return box;
}

/** The partner's lines on the left, the reader's on the right, and the choices at the turn they're on. */
function dialogue(doc: Doc, step: Extract<Exercise, { kind: 'dialogue' }>, a: Answer, c: PracticeControls) {
  const chat = el(doc, 'div', 'px-chat');
  const them = (line: Line) => {
    const bubble = el(doc, 'div', 'px-bubble them');
    const head = el(doc, 'div', 'px-from', step.partner);
    if (sayable(c, line.text)) head.append(sayButton(doc, line.text, c));
    bubble.append(head, fr(doc, line.text), ...(line.en ? [el(doc, 'span', 'en', line.en)] : []));
    return bubble;
  };
  step.turns.forEach((turn, t) => {
    if (t > a.order.length) return;
    chat.append(them(turn.line));
    const chosen = a.order[t];
    if (chosen !== undefined) {
      const me = el(doc, 'div', 'px-bubble me');
      const choice = turn.choices[chosen]!;
      me.append(fr(doc, choice.text), ...(choice.en ? [el(doc, 'span', 'en', choice.en)] : []));
      chat.append(me);
      return;
    }
    const choices = el(doc, 'div', 'px-choices');
    turn.choices.forEach((choice, k) => {
      const tried = a.tried.has(k);
      choices.append(optionButton(doc, { text: choice.text }, tried ? 'wrong' : '', tried ? undefined : () => {
        if (choice.correct) {
          a.order.push(k);
          a.tried = new Set();
          if (a.order.length === step.turns.length) return c.settle(a.misses === 0);
        } else {
          a.tried.add(k);
          a.misses++;
        }
        c.redraw();
      }));
      if (tried) choices.append(el(doc, 'p', 'px-reaction', choice.reaction));
    });
    chat.append(choices);
  });
  if (a.order.length === step.turns.length && step.closing) chat.append(them(step.closing));
  return chat;
}

function footer(doc: Doc, view: PracticeView, step: Step, c: PracticeControls) {
  const foot = el(doc, 'div', 'px-foot');
  if (view.result === undefined) {
    const hint = view.hint;
    if (hint) foot.append(hint.text ? prose(doc, 'px-hint', hint.text) : el(doc, 'p', 'hint', hint.error ?? 'Thinking of a hint…'));
    const row = el(doc, 'div', 'px-row');
    if (!playsOut(step)) {
      // Always wired, so typing an answer can wake it without a redraw.
      const check = button(doc, 'px-go px-check', 'Check', c.check);
      if (grade(step, view.answer) === undefined) check.setAttribute('disabled', '');
      row.append(check);
    }
    if (c.hint && hasHint(step)) row.append(withIcon(button(doc, 'px-alt', 'Hint', hint ? undefined : c.hint), 'bulb'));
    // Once the hint is in (or failed), the answer is one tap away.
    if (hint && (hint.text || hint.error)) row.append(button(doc, 'px-alt', 'Answer', c.reveal));
    row.append(button(doc, 'px-alt', 'Skip', c.another));
    if (c.back) row.append(button(doc, 'px-alt', '← Back', c.back));
    foot.append(row);
    return foot;
  }
  // Heard, but not every word: still a pass, said kindly.
  const almost = step.kind === 'speak' && view.answer.spoken?.heard?.tier === 'almost';
  const praise = almost ? 'Nearly! The grey words weren’t heard clearly.' : view.practice?.praise || 'Right!';
  const result = el(doc, 'div', `px-result ${almost ? 'almost' : view.result ? 'good' : 'bad'}`);
  result.append(el(doc, 'p', `px-verdict ${view.result ? 'good' : 'bad'}`, view.result ? `✓ ${praise}` : view.revealed ? 'The answer:' : '✗ Not quite'));
  const why = 'why' in step ? step.why : '';
  if (why) result.append(prose(doc, 'px-why', why));
  foot.append(result);
  const row = el(doc, 'div', 'px-row');
  if (view.past) {
    // Looking back: only back and forward, nothing is asked for.
    if (c.back) row.append(button(doc, 'px-alt', '← Back', c.back));
    row.append(button(doc, 'px-go', 'Forward →', c.forward));
    foot.append(row);
    return foot;
  }
  row.append(button(doc, 'px-go px-next', 'Next exercise →', c.another), withIcon(button(doc, 'px-alt', 'More like this', c.like), 'again'));
  if (c.back) row.append(button(doc, 'px-alt', '← Back', c.back));
  foot.append(row);
  return foot;
}

/**
 * Replaces `target`'s children with the Practice tab: the exercise on screen
 * with Check (or Skip), then its verdict and the button to the next one.
 * What the reader has done lives in `view.answer`.
 */
export function fillPractice(target: HTMLElement, view: PracticeView, c: PracticeControls) {
  const doc = target.ownerDocument;
  target.classList.add('px');
  const out: Node[] = [];
  const step = view.practice?.step;
  if (step) {
    const box = el(doc, 'div', 'px-step');
    const head = el(doc, 'div', 'px-head');
    head.append(el(doc, 'span', 'chip', getExerciseType(step.type)?.name ?? step.drill?.name ?? step.type));
    const { right, total } = view.tally;
    if (view.past) head.append(el(doc, 'span', 'px-tally', `Earlier: ${view.past.at + 1} of ${view.past.of}`));
    else if (total) head.append(el(doc, 'span', 'px-tally', `${right} / ${total} right`));
    box.append(head, prose(doc, 'px-ins', step.instruction), ...body(doc, step, view, c));
    out.push(box, footer(doc, view, step, c));
  }
  if (step && view.progress && c.reset) {
    const { practised, points } = view.progress;
    const line = el(doc, 'p', 'px-progress', `${practised} of ${points} lesson points practised · `);
    const reset = button(doc, 'px-reset', 'Start afresh', c.reset);
    reset.title = 'Forget which points, words and exercise types this lesson has practised';
    line.append(reset);
    out.push(line);
  }
  if (view.note) out.push(el(doc, 'p', 'note', view.note));
  if (!step && view.note && !/^Writing/.test(view.note)) out.push(withIcon(button(doc, 'px-alt', 'Try again', c.another), 'again'));
  target.replaceChildren(...out);
}
