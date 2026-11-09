import type { Gender } from '../languages';

/** One replacement as the model wrote it, before it's located in the text. */
export interface WeaveLine {
  original: string;
  replacement: string;
  lemma: string;
  gender: Gender;
  pos: string;
  gloss: string;
}

const SEPARATOR = '||';
const FIELD_COUNT = 6;
const GENDERS: readonly Gender[] = ['m', 'f', 'n', '-'];

/**
 * Parses one line of `original||replacement||lemma||gender||pos||gloss`.
 * Returns null for anything malformed, so bad lines are simply dropped.
 */
export function parseLine(raw: string): WeaveLine | null {
  // Models sometimes add list markers or wrap the line in backticks.
  const line = raw.trim().replace(/^(?:[-*•]|\d+[.)])\s+/, '').replace(/^`+|`+$/g, '');
  if (!line.includes(SEPARATOR)) return null;

  const fields = line.split(SEPARATOR).map((f) => f.trim());
  if (fields.length !== FIELD_COUNT) return null;

  const [original, replacement, lemma, genderRaw, pos, gloss] = fields as [
    string, string, string, string, string, string,
  ];
  if (!original || !replacement || !lemma) return null;

  const g = genderRaw.toLowerCase();
  const gender: Gender = (GENDERS as readonly string[]).includes(g) ? (g as Gender) : '-';

  return { original, replacement, lemma, gender, pos: pos.toLowerCase(), gloss };
}

export function parseLines(text: string): WeaveLine[] {
  return text.split(/\r?\n/).flatMap((l) => parseLine(l) ?? []);
}

/**
 * Splits a text stream into complete lines as chunks arrive, so lines can be
 * parsed before the response finishes. The last partial line is held back
 * until `flush()`.
 */
export class LineSplitter {
  private buffer = '';

  push(chunk: string): string[] {
    this.buffer += chunk;
    const parts = this.buffer.split(/\r?\n/);
    this.buffer = parts.pop() ?? '';
    return parts;
  }

  flush(): string[] {
    const rest = this.buffer;
    this.buffer = '';
    return rest ? [rest] : [];
  }
}
