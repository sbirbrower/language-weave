/** The Practice tab's styles, added to the widget's (`widget.ts`): its colours and buttons. */
export const PRACTICE_STYLES = `
.px { gap: 10px; }
.px p { margin: 0; }
.px-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.px-tally { font-size: 12px; color: var(--muted); }
.px-progress { margin: 10px 0 0; font-size: 12px; color: var(--muted); }
.px-reset { padding: 0; border: 0; background: none; color: inherit; font: inherit; text-decoration: underline; cursor: pointer; }
.px-step { display: grid; gap: 8px; }
.px-ins { font-weight: 600; }
.px-q { font-size: 13.5px; }
.px-prompt {
  display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 8px;
  font-size: 18px; font-weight: 600; background: var(--soft);
}
.px-emoji { font-size: 34px; line-height: 1; }
.px button[disabled] { cursor: default; }
/* Low specificity, so the classes below and the states at the end win. */
.px :where(button:not(.say-word):not(.px-word):not(.px-unit)) {
  width: auto; height: auto; display: block; text-align: start; white-space: normal; color: var(--fg);
  border: 1px solid var(--border); border-radius: 8px; padding: 5px 10px; font-size: 13.5px;
}
.px-opts { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.px-opts.emoji { grid-template-columns: repeat(4, 1fr); }
.px .px-opt { display: flex; align-items: center; gap: 6px; min-height: 34px; }
.px-opts.emoji .px-opt { justify-content: center; font-size: 28px; padding: 8px 0; }
.px-opt .en, .px-label .en { display: block; font-size: 11.5px; }
.px-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.px .px-label { border-radius: 999px; padding: 2px 10px; font-size: 12.5px; }
.px-items, .px-lines, .px-choices { display: grid; gap: 6px; }
.px-item { display: grid; gap: 5px; padding: 6px 8px; border-radius: 8px; background: var(--card); border: 1px solid var(--border); }
.px-item.is-right { border-color: var(--ok); }
.px-item.is-wrong { border-color: var(--bad); }
.px-fix { font-size: 13px; display: grid; }
.px-fix .fr { color: var(--ok); }
.px-placed {
  display: flex; flex-wrap: wrap; align-content: flex-start; gap: 6px; min-height: 36px; padding: 6px;
  border: 1px dashed var(--border); border-radius: 8px;
}
.px-placed.list, .px-bank.list { display: grid; }
.px-placed .hint { align-self: center; }
.px-bank { display: flex; flex-wrap: wrap; gap: 6px; }
.px .px-line { display: grid; gap: 1px; width: 100%; box-sizing: border-box; }
.px-line-static { display: grid; gap: 1px; padding: 2px 8px; }
.px-speaker { font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); }
.px .px-gap { width: 100%; box-sizing: border-box; padding: 0 8px; font-size: 12px; color: var(--muted); border-style: dashed; text-align: center; }
.px-insert { display: grid; gap: 6px; padding: 8px 10px; border-radius: 8px; background: var(--soft); border-left: 3px solid var(--accent); }
.px-proof { line-height: 1.9; white-space: pre-wrap; }
button.px-word { all: unset; display: inline; cursor: pointer; border-radius: 3px; }
button.px-word:hover { background: var(--soft); }
.px-word.picked, .px-word.right, .px-word.wrong { border: 0; }
.px-word.wrong { text-decoration: line-through; }
.px-word.missed { text-decoration: underline wavy var(--bad); }
.px-msg { display: grid; gap: 4px; padding: 8px 10px; border-radius: 8px; background: var(--card); border: 1px solid var(--border); }
.px-from { font-size: 12px; font-weight: 700; color: var(--muted); display: flex; align-items: center; gap: 6px; }
.px-chat { display: grid; gap: 6px; }
.px-bubble { display: grid; gap: 1px; max-width: 85%; padding: 6px 10px; border-radius: 12px; }
.px-bubble.them { justify-self: start; background: var(--card); border: 1px solid var(--border); border-bottom-left-radius: 4px; }
.px-bubble.me { justify-self: end; background: var(--soft); border: 1px solid var(--accent); border-bottom-right-radius: 4px; }
.px-bubble .px-from { font-size: 11px; }
.px-reaction { font-size: 12.5px; color: var(--bad); }
.px-audio { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.px-audio .px-heard { flex-basis: 100%; display: grid; }
.px .px-play, .px .px-go { border-radius: 999px; padding: 6px 16px; font-weight: 600; background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
.px .px-play:hover, .px .px-go:hover { background: var(--accent); color: var(--on-accent); filter: brightness(1.08); }
.px .px-go[disabled] { opacity: 0.4; filter: none; }
.px .px-alt { border-radius: 999px; color: var(--accent); font-weight: 500; }
.px-speak { display: grid; gap: 6px; justify-items: start; }
.px .px-rec.on { background: var(--bad); border-color: var(--bad); }
.px-said { font-size: 16px; line-height: 1.6; }
.px-said .got { color: var(--ok); }
.px-said .missed { color: var(--muted); text-decoration: line-through; }
.px-foot { display: grid; gap: 6px; justify-items: start; padding-top: 8px; border-top: 1px solid var(--border); }
.px-verdict { font-weight: 650; }
.px-verdict.good { color: var(--ok); }
.px-verdict.bad { color: var(--bad); }
.px-why { font-size: 13px; }
.px-hint { font-size: 13px; padding: 6px 10px; border-radius: 8px; background: var(--soft); border-left: 3px solid var(--accent); }
.px-why b { color: var(--accent); font-weight: 600; }
.px-full { display: grid; gap: 4px; padding-left: 10px; border-left: 3px solid var(--ok); }
.px-full .fr { color: var(--ok); }
/* Drills: letters or syllables to tap, a typed answer, what tiles make so far, a 🔊 beside a word to sort. */
.px-units { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 24px; line-height: 1.5; }
.px-unit-word { display: inline-flex; }
.px-units.boxed .px-unit-word { gap: 4px; }
button.px-unit { all: unset; cursor: pointer; padding: 0 1px; border-radius: 4px; border-bottom: 2px solid transparent; }
.px-units.boxed button.px-unit { padding: 0 8px; border: 1px solid var(--border); border-radius: 8px; }
button.px-unit:hover:not([disabled]) { background: var(--soft); }
button.px-unit:focus-visible { outline: 2px solid var(--accent); }
button.px-unit[disabled] { cursor: default; }
.px-unit.picked { border-bottom-color: var(--accent); }
.px-unit.wrong { text-decoration: line-through; }
.px-unit.missed { text-decoration: underline wavy var(--bad); }
.px-type { font: inherit; font-size: 17px; color: var(--fg); background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 6px 10px; width: 100%; box-sizing: border-box; }
.px-type:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.px-preview { display: flex; align-items: center; justify-content: center; min-height: 56px; padding: 4px 10px; border-radius: 8px; background: var(--soft); font-size: 40px; line-height: 1.2; }
.px-said-item { display: flex; align-items: center; gap: 6px; }
/* States last, so they win over each button's own colours. */
.px .picked { border-color: var(--accent); color: var(--accent); background: var(--soft); }
.px .right { border-color: var(--ok); color: var(--ok); background: var(--ok-bg); }
.px .wrong { border-color: var(--bad); color: var(--bad); background: var(--bad-bg); }
`;
