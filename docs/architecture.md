# Architecture overview

A map of the whole project: what runs where, what each model call does, and how many calls each feature makes. The other files in `docs/` go deeper on one area each. They're dense and assume you know this page.

## What the extension does

Language Weave is a Chrome extension (Manifest V3, built with WXT and TypeScript) that teaches a language (14 so far) while you read English web pages. It has two modes, switched in the popup:

- **Page mode** (default). It swaps some English words on the page for the target language ("the dog" becomes "le chien", grammatical where it stands). A floating widget writes a short piece about the section on screen (true or false, gap fill, key facts…), and a Practice tab gives exercises on that section.
- **Lesson mode**. It teaches a syllabus lesson (e.g. "French A1: avoir and age"). The widget has a Lesson tab (a textbook page), a Passage tab (short scenes on the lesson's theme) and a Practice tab. Only when you ask, it marks the page where the English could practise the lesson.

Nothing runs until you press Weave in the popup or hit Alt+Shift+W. Opening the popup alone sends nothing.

## The pieces

```
 ┌──────────── popup / options / lessons / progress pages ────────────┐
 │  settings, keys, vocab list, "Weave this page", lesson editor       │
 └───────────────┬─────────────────────────────────────────────────────┘
                 │ chrome.runtime messages
 ┌───────────────▼──────────────┐        ┌──────────────────────────────┐
 │ background.ts (service worker)│──────▶│ Anthropic API (Claude)         │
 │  the only place that calls    │──────▶│ TypeSafe Jev (checks, optional)│
 │  a model or a paid API        │──────▶│ Google TTS (speech, optional)  │
 │  caches kits/textbooks        │──────▶│ DeepInfra Whisper (optional)   │
 │  prices every call            │        └──────────────────────────────┘
 └───────────────▲──────────────┘
                 │ sendMessage (one-shot) / Port (streaming)
 ┌───────────────┴──────────────┐        ┌──────────────────────────────┐
 │ content.ts (injected per tab) │        │ offscreen/ (the microphone,   │
 │  reads the page, plans,       │        │ for speaking exercises)       │
 │  writes words with Ranges,    │        └──────────────────────────────┘
 │  draws the widget in a        │
 │  shadow root outside <body>   │
 └──────────────────────────────┘
```

| Part | Where | Job |
|---|---|---|
| Background | `entrypoints/background.ts` | Holds the keys and makes every model and API call. It streams responses back, records cost, and caches per-lesson builds in `chrome.storage.local`. The `handle()` switch near the bottom lists every message type. |
| Content script | `entrypoints/content.ts` | Injected by the popup or the shortcut. It reads the page, plans the weave, writes words in, and runs the widget. Its state lives on `globalThis.__tissage`. |
| Pure logic | `src/` | Almost everything else: prompt builders, parsers, planners, checks. Pure functions with Vitest tests (`tests/`, about 60 files), so they're testable without a browser. |
| UI pages | `entrypoints/popup`, `options`, `lessons`, `progress` | Plain TS pages: settings and keys, the lesson editor, the Progress page. |
| Offscreen document | `entrypoints/offscreen/` | Records audio. The microphone belongs to the extension, not the page. |

A few cross-cutting rules:

- **Keys never leave the background.** The content script asks the background for everything. Keys live in `chrome.storage.local` (never `sync`).
- **The page is never edited with `innerHTML`.** Words are swapped with DOM Ranges, so links and formatting survive. The widget sits in a shadow root outside `<body>`, so the weave never touches it.
- **Every message carries a build id** (`src/build.ts`). After a rebuild, Chrome keeps the old background running but injects the new content script, so a mismatch is refused rather than misread.
- **Language-specific things go through `LanguageConfig`** (`src/languages/<code>.ts`). Prompts say `${lang.displayName}`, never "French".

## External services and keys

All keys are entered in Options. Only the key for the chosen model provider (Anthropic by default) is required.

| Service | Used for | Key |
|---|---|---|
| Anthropic (Claude) | All writing: weave, passages, exercises, hints, kits, textbooks, marks | Required, unless OpenAI or Gemini is the provider |
| OpenAI or Google Gemini | The same, when picked as the provider in Options instead of Anthropic | Optional |
| TypeSafe Jev | A fast classifier (~0.15s, ~free) that checks model output against the page and drops bad lines. Without it, a Haiku call does the check, or there's no check at all. | Optional |
| Google Text-to-Speech | 🔊 buttons (Chirp 3 HD "Leda" voice, $30 per million characters). Clips are cached in memory per page, and local recordings play for free. | Optional |
| DeepInfra Whisper large-v3 | Speaking exercises (opt-in), ~$0.00045 per minute of audio | Optional |

Three LLM adapters sit behind the `Provider` interface in `src/providers/types.ts`, made by `makeProvider` (`src/providers/index.ts`): `anthropic.ts` (the SDK; the default, and what every prompt and eval is tuned on), `openai.ts` (Chat Completions) and `gemini.ts` (`streamGenerateContent`), both plain `fetch` over server-sent events (`http.ts`). `Settings.provider` picks one.

Features still name a Claude model. On OpenAI or Gemini, `routeModel` (`src/providers/route.ts`) swaps it for the provider's model of the same tier: Haiku → fast, Sonnet → main, Opus/Fable → best (`DEFAULT_MODELS`, changed per tier in Options). Effort and thinking carry over: thinking off asks OpenAI for `reasoning_effort: 'none'` and Gemini for the lowest `thinkingLevel`, and `withLevels` steps down a list when a model rejects a level, so new models don't need a table. Neither caches explicitly: both cache a repeated prefix (the system prompt) on their own. Evals still call Anthropic only.

## How a model call works

Every model call goes through `runModel()` in `background.ts`:

1. Builds the chosen provider with the model, effort and thinking setting for that kind of call. Most features pin their own model (table below); only the weave uses the model from Options. On OpenAI or Gemini the model is routed by tier (above).
2. On Anthropic, streams through `client.beta.messages.stream`. The system prompt is sent with `cache_control: ephemeral`, so it's cached across requests. The `server-side-fallback` beta retries on a fallback model if the request is declined.
3. Hands text to the caller after every chunk (`onText`), so the UI can show lines as they finish.
4. When the stream ends, it reads token usage, prices it with the table in `src/cost.ts`, adds it to today's spend (`spendByDay` in storage), and updates a calibration record that makes later estimates more accurate.

Concurrency: at most 10 Claude requests at once (`createLimiter(10)`, FIFO, so paragraphs start in document order) and 8 Jev requests at once. The toolbar badge shows how many requests are in flight for the tab.

**Thinking is off for almost everything.** Turning it off is "several times faster per request", and evals showed it rarely helps the short outputs here. It's on only for the calls that run once and are cached (kit, textbook, custom lesson).

## Prompt design: the basics

The same patterns show up in every feature.

**1. Code decides; the model only writes.** Before any call, code picks the format, the words to teach, the grammar point, the scene, the exercise type and the random seed. These are the `choose*` functions, e.g. `choosePiece` in `src/passage/piece.ts`, `choosePractice` in `src/practice/prompt.ts`, and `planPage` in `src/weave/plan.ts`. The prompt hands the model a fully specified job. That keeps outputs varied but controlled, and makes evals paired comparisons: same seed, same choices.

**2. A tiny, byte-stable system prompt; everything else in the user message.** Most system prompts are one line, e.g. `PASSAGE_SYSTEM = 'You write short texts for language learners. Follow the instructions exactly.'` The weave is the exception: its system prompt (`src/weave/prompt.ts`) carries the long instructions and the language's grammar notes, because it's sent dozens of times per page and caching it pays off. Per-request data goes in the user message, in XML-ish sections like `<page>`, `<lesson>`, `<reader>`, `<grammar>`, `<words>`, `<passage>`.

**3. Two output styles, chosen per call:**

- *Line-based with `||` separators* for anything streamed to the screen: the weave, passages, marks. A line is usable the moment it's finished, and a malformed line is just dropped. The weave line format is:
  ```
  original span||French replacement||lemma||gender||part of speech||English gloss
  ```
- *Structured JSON* (`output_config.format: json_schema`) for the build-once artifacts: kit, textbook, custom lesson. Practice exercises are one line of JSON, parsed and validated by per-type parsers in `src/practice/exercises.ts`.

**4. The model never returns positions.** For the weave, the model copies the English span verbatim, and code finds it in the paragraph (`src/weave/locate.ts`, which respects word boundaries, so "cat" doesn't match inside "concatenate"). Code then validates each line (span found, at most 5 words, no overlap, replacement actually different) and enforces the density budget itself (`src/weave/select.ts`). The prompt states the budget too, but code is what enforces it.

**5. Check in code, then optionally with Jev, then retry once.** Parsers drop broken lines. `src/passage/checks.ts` catches whole-piece problems (too few quiz lines, missing readings in scripts that need them). With a TypeSafe key, Jev answers yes/no questions ("is this true according to the section?") with a probability, and lines below a threshold are dropped. A piece or exercise that still fails is written once more, and the better attempt is kept.

**6. Every prompt is language- and level-agnostic.** Language details come from `LanguageConfig`: grammar notes, `writingNotes` (e.g. "write Japanese with readings `日本語《にほんご》`"), and the example line. Level guidance comes from data. The few places that still assume French or a level are listed in `docs/extending.md`.

Here's a trimmed passage prompt (`buildPiecePrompt`) to show the shape:

```
<page>
Title: Snow leopard
…the section on screen, plus a little context…
</page>

<reader>
Learning French, level A2.
</reader>

<grammar>
- Passé composé with être: … (e.g. "…")
</grammar>

<words>
Words to teach: léopard (leopard), montagne (mountain), …
</words>

Write a short piece in French for this learner, in this format: True or false?
…format-specific instructions from src/passage/formats.ts…

Rules:
- Teaching the grammar matters most …
- Every statement about the page's subject must be true according to the page text above …

Output exactly this and nothing else:
<title>a short French title || its English translation</title>
<piece>
French text || its English translation || true/false
</piece>
```

## API calls by feature

Model, how often each call fires, and typical cost and latency. Numbers come from the eval reports in `evals/out/` and the cached kits in `evals/kits/` (list prices as of 2026-10, `src/cost.ts`). They're per-call ballparks, not guarantees.

### Page mode

| What | Model | When it fires | Calls | Cost | Latency |
|---|---|---|---|---|---|
| **Pick page words** (`pick-page-words`) | Settings model (default Haiku 5.5, effort low, thinking off) | Once per weave, before the paragraphs go out: ~25 words for this page, at the reader's level, from its title, headings and the text on screen | 1 | <$0.01 | ~1–2s |
| **Weave a paragraph** (`weave-lesson` / `weave-segment`) | Settings model | One per paragraph-sized segment (20–400 chars) as it comes within half a screen of view (IntersectionObserver). Paragraphs with nothing to weave make no call. | ~1 per paragraph. A 2,400-word Wikipedia article is 58 segments and 51 calls. | ~$0.01 for that whole article | Median 2.0s per call. First screen woven in 2.6s, whole page in 12s if you scroll it all. |
| **Widget passage** (`passage`, streamed) | Sonnet 5.5, thinking off | Each time scrolling settles (800ms) on a new section, when you highlight 6+ words, or when you press "New passage" / pick another format | 1 per section, +1 if the piece is still broken (rare) | ~$0.007 | First line ~1.9s, whole piece ~3.5s |
| ↳ Jev line checks | Jev | Only with a TypeSafe key: each true-or-false key, gap and fact line as it streams in | 1 per quiz/fact line | ~$0 | ~0.15s each |
| **Practice exercise** (`practice`) | Sonnet 5.5, thinking off | One per exercise. The next one is written while you do the current one, so it shows at once. About 30% of exercises are drills built by code (no call). | 1, +1 if it fails its checks | ~$0.006 | ~3s |
| ↳ Jev key check | Jev | With a TypeSafe key, for spot-the-form, gap-fill and particles exercises | 1 | ~$0 | ~0.15s |
| **Hint** (`practice-hint`) | Haiku 5.5, thinking off | Written as each exercise arrives, so 💡 shows at once (not for pairs, dialogues, speaking or drills) | 1–2, + Jev if keyed | ~$0 | <1s |

Before weaving, `planPage()` builds every request's exact prompt, and `estimatePlan()` prices them. If the estimate is over `confirmAboveUsd` (default $0.20), the popup asks before sending. With the default Haiku settings, a normal article stays far below that.

### Lesson mode

| What | Model | When it fires | Calls | Cost | Latency |
|---|---|---|---|---|---|
| **Lesson kit** | Sonnet 5.5, **thinking on**, JSON schema | **Once per lesson, ever.** Cached in `storage.local` under lesson id + content stamp + `KIT_VERSION` + model. It turns a syllabus lesson into a theme, words, scene settings, points with checkable instructions, regexes and pitfalls, so the later fast calls only have to write. | 1 per lesson | Median ~$0.05 (max ~$0.10) | Median ~35s (max ~63s). The widget shows "Preparing this lesson…". |
| **Textbook page** (Lesson tab) | Sonnet 5.5, thinking on, JSON schema | Once per lesson, cached the same way | 1 per lesson | ~$0.05 | Tens of seconds |
| **Passage** (scene) | Sonnet 5.5, thinking off | Each "New passage": a random one of 27 formats, avoiding the last 6 | 1 (+1 if broken) | ~$0.007 | Whole piece ~2s |
| **Practice** + **hints** | Same as page mode, but on the lesson's kit points and words (`src/practice/schedule.ts` decides what each exercise practises) | | | | |
| **Mark this page** (`marks`, streamed) | Sweep: Sonnet 5.5, thinking off. Checks: Jev, then lenient Sonnet for uncertain marks; or Haiku per mark without a TypeSafe key | Only when you press "Mark this page": one sweep per chunk on screen as you scroll, one request at a time | Per chunk: 1 sweep (asks for ~2× the marks wanted), plus 1 check per mark | ~$0.01 per chunk | First mark ~2.8s, whole chunk ~6.6s |
| **Weave this page** | Same as page mode's weave | Only when you press it | | | |
| **Custom lesson** ("New lesson…") | **Opus 5.5**, thinking on, JSON schema | Once when you write a lesson; you edit and save the result | 1 | ~$0.04 | Median 15s |

Lesson mode's widget also follows you from tab to tab while it's open. That reopens it with saved state (`chrome.storage.session`) and makes **no** new calls.

### Speech (both modes)

| What | Service | When | Cost |
|---|---|---|---|
| 🔊 a word or line | Google TTS, or a local recording if one exists | On click, cached per page | $30 per million characters, so effectively cents per month |
| Speaking exercise | Whisper large-v3 on DeepInfra, prompted with the expected sentence | Each attempt (silence isn't sent) | ~$0.00045 per minute |

### A rough session

Read one article in page mode with the defaults and do ten exercises: ~52 Haiku weave calls (~1¢), maybe 5–8 passages as you scroll (~5¢), 10 exercises and 10 hints (~5¢, since some are drills with no call). That's about **10¢**. Most of it is Sonnet in the widget, not the weave. Starting a new lesson in lesson mode adds ~10¢ once (kit and textbook), then runs at about the same per-call rates.

## The weave pipeline in more detail

This is the original core, and the most "classic engineering" part (`src/weave/`, all pure):

1. **`segment`**: finds the page's text: the `<p>`s of `main`/`article`, else the body, or a looser pass for pages built from spans. It skips code, hidden and editable text, and link-heavy blocks, then chunks paragraphs into 20–400-character segments.
2. **`plan`**: decides every segment's words and requests before anything is sent. Lessons (`src/lessons/`) find candidate spans by code. The default "themed" lesson's candidates are the page words the model picked, then, up to A2, easy words from per-language lists (`src/lessons/level.ts`: from B1 a general request at the reader's level fills the rest, sent alongside the lesson's). `allocate` spreads them across the page under the density budget (default 8%), and words a lesson can write without the model (`resolveLocal`) are written by code with no call. `carry.ts` moves a paragraph's shortfall to later ones.
3. **`prompt`** → model → **`parse`**: the `||` lines described above.
4. **`select`**: locates each span, validates it and spends the budget in document order, so the result is deterministic.
5. **`write`**: wraps the English in a hidden span and inserts the target language with Ranges. `content.ts` also watches for text the page adds later (infinite scroll, re-renders) and weaves that too.

## Where state lives

| What | Where |
|---|---|
| Settings and keys | `chrome.storage.local`, key `settings` (`src/settings.ts`) |
| Lesson kits, textbook pages | `storage.local`, `kits` / `textbooks`, keyed by lesson + version + model. Bump `KIT_VERSION` / `TEXTBOOK_VERSION` to rebuild. |
| Lessons you wrote | `storage.local`, `customLessons` |
| Practice history | `storage.local`, one ledger per language (`practice-ledger\|<lang>`), feeds the Progress page |
| What a lesson has practised | `storage.local` (`src/practice/coverage.ts`), cleared by "Start afresh" |
| Spend per day, cost calibration | `storage.local`, `spendByDay`, `calibration` |
| Lesson-mode widget state across tabs | `chrome.storage.session` |
| Words woven on this page (popup list) | In memory, per page (`src/pageVocab.ts`). Across pages: the word store (`src/vocab/`, `vocab|<lang>` in `chrome.storage.local`): words seen, saved and known, peeks, and saved words' sentences (`docs/ui.md`). |

## How prompts get changed: evals

Prompt work happens in evals, not in the extension (`docs/evals.md` lists every eval and its options):

1. Write a **variant** in `evals/variants/<feature>.ts`: a different prompt, model, effort or thinking setting.
2. `npm run eval -- <name>` is a dry run that prints the requests and an estimated cost.
3. `EVAL_RUN=1 npm run eval -- <name>` calls the API on fixture pages (`tests/fixtures/`) and writes a Markdown report to `evals/out/` comparing variants against `shipped`: min/median/p90 latency, cost, broken outputs, and the outputs side by side.
4. Only the variant you pick moves into `src/`. That's when type-check, tests and build run.

Several evals score checkers against hand labels (`evals/*/labels.json`), e.g. how many wrong marks Jev catches at each threshold. That's where numbers like `JEV_BAND = { lo: 0.2, hi: 0.6 }` and `HINT_THRESHOLD = 0.4` come from. The comments next to each `*_MODEL` constant usually cite the eval that picked it (e.g. Haiku broke 29 of 72 passage pieces, Sonnet 4, hence `PASSAGE_MODEL`).

## Reading order, if you want to dig in

1. `src/messages.ts`: every message between content script and background. It's the API surface.
2. `entrypoints/background.ts`: `runModel`, then one `run*` function per feature.
3. `src/weave/prompt.ts` and `src/passage/piece.ts`: the two prompts you'll touch most.
4. `src/passage/formats.ts`: the 27 widget formats, each with page and lesson instructions.
5. `src/practice/exercises.ts` and `schedule.ts`: the 39 exercise types and what decides the next one.
