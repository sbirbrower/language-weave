import { LABEL_CSS } from '../theme';

/** The Practice tab's styles, added to the widget's (`widget.ts`): its colours and buttons. */
export const PRACTICE_STYLES = `
.px { gap: 12px; }
.px p { margin: 0; }
.px-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.px-head .chip { background: none; padding: 0; font-size: 15px; font-weight: 700; }
.px-tally { ${LABEL_CSS} font-size: 13px; color: var(--muted); }
.px-progress { margin: 12px 0 0; font-size: 12px; color: var(--muted); }
.px-reset { width: auto; height: auto; display: inline; padding: 0; border: 0; background: none; color: inherit; font: inherit; text-decoration: underline; cursor: pointer; }
.px-step { display: grid; gap: 10px; }
.px-ins { font-size: 12.5px; color: var(--muted); }
.px-q { font-size: 13.5px; }
.px-prompt {
  display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 4px 0;
  font-size: 17px; font-weight: 500; line-height: 1.5;
}
.px-prompt .fr { font-weight: 500; }
.px-emoji { font-size: 34px; line-height: 1; }
.px button[disabled] { cursor: default; }
/* Low specificity, so the classes below and the states at the end win. */
.px :where(button:not(.say-word):not(.px-word):not(.px-unit):not(.px-reset)) {
  width: auto; height: auto; display: block; text-align: start; white-space: normal; color: var(--text);
  border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; font-size: 14px; font-weight: 500;
}
.px-opts { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.px-opts.emoji { grid-template-columns: repeat(4, 1fr); }
.px .px-opt { display: flex; align-items: center; gap: 6px; min-height: 38px; box-sizing: border-box; }
.px-opts.emoji .px-opt { justify-content: center; font-size: 28px; padding: 8px 0; }
.px-opt .en, .px-label .en { display: block; font-size: 11.5px; }
.px-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.px .px-label { border-radius: 6px; padding: 3px 12px; font-size: 13px; }
.px-items, .px-lines, .px-choices { display: grid; gap: 8px; }
.px-item { display: grid; gap: 6px; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--line); }
.px-item.is-right { border-color: var(--green-line); background: var(--green-tint); }
.px-item.is-wrong { border-color: var(--bad); background: var(--bad-bg); }
.px-fix { font-size: 13px; display: grid; }
.px-fix .fr { color: var(--green); }
/* Tiles: placed on ruled lines, the rest in a tray below. */
.px-placed {
  display: flex; flex-wrap: wrap; align-content: flex-start; gap: 6px; min-height: 44px; padding: 8px 0;
  background-image: repeating-linear-gradient(transparent 0 39px, var(--border) 39px 40px);
}
.px-placed.list, .px-bank.list { display: grid; }
.px-placed .hint { align-self: center; }
.px-bank { display: flex; flex-wrap: wrap; gap: 6px; padding: 10px; border-radius: 8px; background: var(--bg); }
.px .px-tile { padding: 6px 11px; border-radius: 6px; background: var(--surface); box-shadow: 0 1px 0 var(--border); }
.px-placed .px-tile { background: var(--primary-soft); box-shadow: none; }
.px .px-line { display: grid; gap: 1px; width: 100%; box-sizing: border-box; }
.px-line-static { display: grid; gap: 1px; padding: 2px 8px; }
.px-speaker { ${LABEL_CSS} font-size: 13px; font-weight: 700; color: var(--primary); }
.px .px-gap { width: 100%; box-sizing: border-box; padding: 0 8px; font-size: 12px; color: var(--muted); border-style: dashed; text-align: center; }
.px-insert { display: grid; gap: 6px; padding: 10px 12px; border-radius: 8px; background: var(--surface-2); }
.px-proof { line-height: 2; white-space: pre-wrap; font-size: 16px; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--line); }
button.px-word { all: unset; display: inline; cursor: pointer; border-radius: 4px; padding: 1px 3px; }
button.px-word:hover { background: var(--primary-soft); }
.px-word.picked { background: var(--hl); color: var(--text); }
.px-word.picked, .px-word.right, .px-word.wrong { border: 0; }
.px-word.wrong { text-decoration: line-through; }
.px-word.missed { text-decoration: underline wavy var(--bad); }
.px-msg { display: grid; gap: 4px; padding: 10px 12px; border-radius: 8px; background: var(--surface-2); }
.px-from { ${LABEL_CSS} font-size: 13px; font-weight: 700; color: var(--primary); display: flex; align-items: center; gap: 6px; }
.px-chat { display: grid; gap: 8px; }
.px-bubble { display: grid; gap: 1px; max-width: 85%; padding: 8px 12px; border-radius: 12px; }
.px-bubble.them { justify-self: start; background: var(--surface-2); border-bottom-left-radius: 4px; }
.px-bubble.me { justify-self: end; background: var(--primary-soft); border-bottom-right-radius: 4px; }
.px-reaction { font-size: 12.5px; color: var(--bad-ink); }
.px-audio { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.px-audio .px-heard { flex-basis: 100%; display: grid; }
.px .px-play, .px .px-go, .px .px-alt { display: inline-flex; align-items: center; gap: 6px; }
.px .px-play { border-radius: 8px; padding: 7px 14px; font-weight: 600; font-size: 12.5px; background: var(--green); border-color: var(--green); color: var(--on-green); }
.px .px-go { border-radius: 8px; padding: 7px 14px; font-weight: 600; font-size: 12.5px; background: var(--primary); border-color: var(--primary); color: var(--on-primary); }
.px .px-go.px-next { background: var(--green); border-color: var(--green); color: var(--on-green); }
.px .px-play:hover, .px .px-go:hover { filter: brightness(1.1); }
.px .px-go[disabled] { opacity: 0.4; filter: none; }
.px .px-alt { border: 0; padding: 4px 2px; font-size: 12.5px; font-weight: 400; color: var(--muted); background: none; }
.px .px-alt:hover { color: var(--text); background: none; }
/* Speaking: a big round microphone. */
.px-speak { display: grid; gap: 8px; justify-items: center; padding: 6px 0; }
.px .px-rec { width: 60px; height: 60px; padding: 0; border-radius: 30px; justify-content: center; background: var(--primary); border-color: var(--primary); color: var(--on-primary); box-shadow: 0 0 0 6px var(--primary-soft); }
.px .px-rec.on { background: var(--bad); border-color: var(--bad); box-shadow: 0 0 0 6px var(--bad-bg); }
.px-rec-label { ${LABEL_CSS} font-size: 13.5px; color: var(--muted); }
.px-said { font-size: 16px; line-height: 1.6; justify-self: stretch; }
.px-said .got { color: var(--green); }
.px-said .missed { color: var(--faint); text-decoration: underline dotted; }
.px-speak .en, .px-speak .hint { justify-self: stretch; }
.px-foot { display: grid; gap: 10px; padding-top: 12px; border-top: 1px solid var(--line); }
/* The way on (Check, Next) at the end of the row; the quieter choices before it. */
.px-foot .px-row { gap: 6px 14px; }
.px-foot .px-check, .px-foot .px-next { order: 2; margin-left: auto; }
.px-result { display: grid; gap: 3px; padding: 10px 12px; border-radius: 8px; background: var(--surface-2); }
.px-result.good { background: var(--green-tint); }
.px-result.bad { background: var(--bad-bg); }
.px-result.almost { background: var(--warn-bg); }
.px-verdict { ${LABEL_CSS} font-size: 14px; font-weight: 700; }
.px-verdict.good { color: var(--green); }
.px-verdict.bad { color: var(--bad-ink); }
.px-result.almost .px-verdict { color: var(--warn-ink); }
.px-why { font-size: 13px; line-height: 1.5; }
.px-hint { font-size: 13px; line-height: 1.5; padding: 10px 12px; border-radius: 8px; border: 1px dashed var(--border); display: grid; gap: 2px; }
.px-hint::before { content: "hint"; ${LABEL_CSS} font-size: 14px; color: var(--muted); }
.px-why b { color: var(--primary); font-weight: 600; }
.px-full { display: grid; gap: 4px; padding: 8px 10px; border-radius: 8px; background: var(--green-tint); }
.px-full .fr { color: var(--green); }
/* Drills: letters or syllables to tap, a typed answer, what tiles make so far, a play button beside a word to sort. */
.px-units { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 24px; line-height: 1.5; }
.px-unit-word { display: inline-flex; }
.px-units.boxed .px-unit-word { gap: 4px; }
button.px-unit { all: unset; cursor: pointer; padding: 0 1px; border-radius: 4px; border-bottom: 2px solid transparent; }
.px-units.boxed button.px-unit { padding: 0 8px; border: 1px solid var(--border); border-radius: 8px; }
button.px-unit:hover:not([disabled]) { background: var(--primary-soft); }
button.px-unit:focus-visible { outline: 2px solid var(--primary); }
button.px-unit[disabled] { cursor: default; }
.px-unit.picked { border-bottom-color: var(--primary); }
.px-unit.wrong { text-decoration: line-through; }
.px-unit.missed { text-decoration: underline wavy var(--bad); }
.px-type { font: inherit; font-size: 16px; font-weight: 600; color: var(--text); background: var(--surface); border: 1.5px solid var(--border); border-radius: 8px; padding: 7px 10px; width: 100%; box-sizing: border-box; }
.px-type:focus-visible { outline: 2px solid var(--primary); outline-offset: 1px; }
.px-preview { display: flex; align-items: center; justify-content: center; min-height: 56px; padding: 4px 10px; border-radius: 8px; background: var(--surface-2); font-size: 40px; line-height: 1.2; }
.px-said-item { display: flex; align-items: center; gap: 6px; }
/* States last, so they win over each button's own colours. */
.px .picked { border-color: var(--primary); color: var(--text); background: var(--primary-soft); }
.px .right { border: 1.5px solid var(--green); color: var(--green); background: var(--green-tint); font-weight: 600; }
.px .wrong { border: 1.5px solid var(--bad); color: var(--bad-ink); background: var(--bad-bg); }
`;
