# Places that still assume French or a level

New code shouldn't assume French, A1 or a particular lesson. These still do; move them when they're next touched.

- `src/reading/formats.ts`: the U+202F rule in the reading system prompt, "French" in the `why` task, the `'A1'` fallback level
- `src/devanagari.ts`: romanises every Devanagari word as Hindi; Marathi or Nepali would need their own rules for the inherent a, chosen by language rather than by script
- `src/lessons/basics/`: French word bank, "French" and French typography in its prompt fragment
- `src/lessons/a1.ts`, `easy.ts`: the French lists live in these files; every other language's are in `words/<code>.ts`
- `READING_MODEL` (`src/reading/formats.ts`) is one fixed model for the widget
