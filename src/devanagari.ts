/**
 * Hindi romanisation written by code, so a word reads the same in every request: the model writes
 * चित्र《chitr》 in one and 《citra》 in the next, शांत《shāṅt》 and 《śānt》. The letters come from the
 * Devanagari, in the scheme Hindi's writing notes give the model (`src/languages/hi.ts`: c and ch
 * for च and छ, ś and ṣ, n or m for a nasal before a consonant) and, where those are silent, the
 * one Hindi's data files use (ख़ kh, ृ ri, ज्ञ gy). What the script can't tell is which inherent a
 * is said (कमल kamal, not kamala; समझना samajhnā), and whether a dot over a long vowel is a nasal
 * vowel (होंगे hoṃge) or an n (बैंक baink): a word-final a follows a rule, so it never wobbles; the
 * rest follows the model's reading when it spells the same word, and rules when it doesn't. The
 * first reading of a word then stays for as long as the page is open, so it reads the same every
 * time it comes back. Used by `src/ruby.ts` for every Devanagari word; it assumes Hindi (Marathi
 * and Nepali say the inherent a differently).
 */

const CONSONANTS: Record<string, string> = {
  क: 'k', ख: 'kh', ग: 'g', घ: 'gh', ङ: 'ṅ', च: 'c', छ: 'ch', ज: 'j', झ: 'jh', ञ: 'ñ',
  ट: 'ṭ', ठ: 'ṭh', ड: 'ḍ', ढ: 'ḍh', ण: 'ṇ', त: 't', थ: 'th', द: 'd', ध: 'dh', न: 'n',
  प: 'p', फ: 'ph', ब: 'b', भ: 'bh', म: 'm', य: 'y', र: 'r', ल: 'l', व: 'v', श: 'ś', ष: 'ṣ', स: 's', ह: 'h',
};
/** With a nukta: क़ ख़ ग़ ज़ फ़ ड़ ढ़ य़. */
const NUKTA_CONSONANTS: Record<string, string> = { क: 'q', ख: 'kh', ग: 'g', ज: 'z', फ: 'f', ड: 'ṛ', ढ: 'ṛh', य: 'y' };
const VOWELS: Record<string, string> = { अ: 'a', आ: 'ā', इ: 'i', ई: 'ī', उ: 'u', ऊ: 'ū', ऋ: 'ri', ए: 'e', ऐ: 'ai', ओ: 'o', औ: 'au', ऑ: 'ŏ', ऍ: 'e' };
const SIGNS: Record<string, string> = { 'ा': 'ā', 'ि': 'i', 'ी': 'ī', 'ु': 'u', 'ू': 'ū', 'ृ': 'ri', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ॉ': 'ŏ', 'ॅ': 'e' };
const NUKTA = '़';
const VIRAMA = '्';
const ANUSVARA = 'ं';
const CHANDRABINDU = 'ँ';
const VISARGA = 'ः';
/** An anusvara before these is said m (लंबा lambā), before any other consonant n (हिंदी hindī). */
const LABIAL = new Set(['p', 'ph', 'b', 'bh', 'm', 'v']);
/** A final inherent a after a cluster ending in these is said (वाक्य vākya, छात्र chātra, केंद्र kendra), unlike पूर्व pūrv. */
const SAID_AFTER_CLUSTER = new Set(['y', 'r']);
/** Persian and Arabic words, which don't say it (उम्र umr); most are told by a nukta (ज़िक्र zikr), these have none. */
const FINAL_CLUSTER_SILENT = new Set(['उम्र', 'सब्र', 'शुक्र', 'फ़क्र', 'अब्र', 'क़द्र']);
/** A dot over one of these before a consonant may be a nasal vowel (होंगे hoṃge); over a short vowel it is always n or m (हिंदी hindī). */
const LONG = new Set(['ā', 'ī', 'ū', 'e', 'ai', 'o', 'au', 'ŏ']);

/**
 * How the model may spell each letter, once accents are stripped: what its reading is matched
 * against to learn which inherent a it said. Letters not listed are spelled as they are written.
 */
const SPELLINGS: Record<string, string[]> = {
  c: ['ch', 'c'], ch: ['chh', 'ch', 'c'], ś: ['sh', 's'], ṣ: ['sh', 's'], ṛ: ['rr', 'r', 'd'], ṛh: ['rh', 'dh', 'r'],
  v: ['v', 'w'], ph: ['ph', 'f'], f: ['f', 'ph'], q: ['q', 'k'], z: ['z', 'j'], kh: ['kh', 'x', 'k'], gy: ['gya', 'gy', 'jn', 'gn'],
  ā: ['aa', 'a'], ī: ['ii', 'ee', 'i'], ū: ['uu', 'oo', 'u'], ri: ['ri', 'ru', 'r'], ai: ['ai', 'ae', 'e'], au: ['au', 'ao', 'o'],
  ŏ: ['au', 'aw', 'o', 'a'], e: ['e', 'ai'],
};

type Unit =
  | { kind: 'consonant'; latin: string; afterVirama: boolean; vowel: { sign: string } | 'virama' | 'inherent' }
  | { kind: 'vowel'; latin: string }
  | { kind: 'nasal'; chandrabindu: boolean; vowel?: boolean }
  | { kind: 'visarga' };

/** A reading with accents stripped and ṃ (or a tilde) kept as ~: hoṃge → ho~ge. */
const plain = (s: string) =>
  s.normalize('NFD').replace(/m[\u0307\u0310\u0323]|\u0303/gu, '~').replace(/\p{M}/gu, '').toLowerCase();
const spellings = (latin: string) => (SPELLINGS[latin] ?? [plain(latin)]).map(plain);
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const anyOf = (latin: string) => `(?:${spellings(latin).map(escapeRe).join('|')})`;

/** The word as letters, or null when it has a character this doesn't know (a digit, an avagraha). */
function units(word: string): Unit[] | null {
  const chars = [...word.normalize('NFC')];
  const out: Unit[] = [];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i]!;
    const last = out[out.length - 1];
    if (CONSONANTS[c]) {
      // ज्ञ is said gy, one sound: वि|ज्ञा|न vigyān.
      if (c === 'ज' && chars[i + 1] === VIRAMA && chars[i + 2] === 'ञ') {
        out.push({ kind: 'consonant', latin: 'gy', afterVirama: last?.kind === 'consonant' && last.vowel === 'virama', vowel: 'inherent' });
        i += 2;
        continue;
      }
      const nukta = chars[i + 1] === NUKTA;
      if (nukta) i++;
      out.push({
        kind: 'consonant',
        latin: nukta ? (NUKTA_CONSONANTS[c] ?? CONSONANTS[c]!) : CONSONANTS[c]!,
        afterVirama: last?.kind === 'consonant' && last.vowel === 'virama',
        vowel: 'inherent',
      });
    } else if (SIGNS[c] || c === VIRAMA) {
      if (last?.kind !== 'consonant' || last.vowel !== 'inherent') return null;
      last.vowel = c === VIRAMA ? 'virama' : { sign: SIGNS[c]! };
    } else if (VOWELS[c]) out.push({ kind: 'vowel', latin: VOWELS[c]! });
    else if (c === ANUSVARA || c === CHANDRABINDU) out.push({ kind: 'nasal', chandrabindu: c === CHANDRABINDU });
    else if (c === VISARGA) out.push({ kind: 'visarga' });
    else return null;
  }
  return out;
}

/** An inherent a followed by a nasal or visarga is said: संस्कृति sanskriti, दुःख duḥkh. */
const surelySaid = (us: Unit[], i: number) => us[i + 1]?.kind === 'nasal' || us[i + 1]?.kind === 'visarga';
const open = (us: Unit[]) => us.flatMap((u, i) => (u.kind === 'consonant' && u.vowel === 'inherent' && !surelySaid(us, i) ? [i] : []));

/** Whether the word's last inherent a is said: in a word with no other vowel (न na), or after a cluster ending in y or r in a word that isn't Persian or Arabic. */
function finalSaid(word: string, us: Unit[], i: number): boolean {
  const u = us[i] as Extract<Unit, { kind: 'consonant' }>;
  const vowels = us.filter((x) => x.kind === 'vowel' || (x.kind === 'consonant' && x.vowel !== 'virama')).length;
  if (vowels === 1) return true;
  const loan = word.normalize('NFD').includes(NUKTA) || FINAL_CLUSTER_SILENT.has(word.normalize('NFC'));
  return u.afterVirama && SAID_AFTER_CLUSTER.has(u.latin) && !loan;
}

/**
 * Which inherent a are said, by rule: right to left, one between a vowel and a consonant that has
 * its own vowel is dropped (लड़का laṛkā, समझना samajhnā); the first syllable's never is.
 */
function byRule(us: Unit[], slots: number[], said: Map<number, boolean>) {
  const hasVowel = (i: number): boolean => {
    const u = us[i];
    if (!u) return false;
    if (u.kind === 'vowel') return true;
    if (u.kind !== 'consonant' || u.vowel === 'virama') return false;
    return u.vowel !== 'inherent' || (said.get(i) ?? true);
  };
  for (const i of [...slots].reverse()) {
    if (said.has(i)) continue;
    const next = us[i + 1];
    said.set(i, !(i > 0 && hasVowel(i - 1) && next?.kind === 'consonant' && hasVowel(i + 1)));
  }
}

/**
 * Which inherent a the model said, read from its reading of the same word, and which dots it said
 * as a nasal vowel (marked on the units); null when it spells something else.
 */
function fromReading(us: Unit[], reading: string): Map<number, boolean> | null {
  const slots: number[] = [];
  const nasals: number[] = [];
  let re = '';
  us.forEach((u, i) => {
    if (u.kind === 'vowel') re += anyOf(u.latin);
    else if (u.kind === 'nasal') {
      nasals.push(i);
      re += '(~|n|m)?';
    }
    else if (u.kind === 'visarga') re += 'h?';
    else {
      re += anyOf(u.latin);
      if (u.vowel === 'virama') return;
      if (u.vowel !== 'inherent') re += anyOf(u.vowel.sign);
      else if (surelySaid(us, i)) re += 'a';
      else {
        slots.push(i);
        re += '(a?)';
      }
    }
  });
  // Groups come in word order, so each is a slot's or a nasal's by position.
  const groups = [...slots.map((i) => ({ i, slot: true })), ...nasals.map((i) => ({ i, slot: false }))].sort((a, b) => a.i - b.i);
  const m = new RegExp(`^${re}$`, 'u').exec(plain(reading).replace(/[^a-z~]/g, ''));
  if (!m) return null;
  const said = new Map<number, boolean>();
  groups.forEach(({ i, slot }, n) => {
    const got = m[n + 1];
    if (slot) said.set(i, got === 'a');
    else if (got) (us[i] as Extract<Unit, { kind: 'nasal' }>).vowel = got === '~';
  });
  return said;
}

/** The sound before a nasal sign: what decides whether it can be a nasal vowel. */
function vowelBefore(us: Unit[], i: number, said: Map<number, boolean>): string | undefined {
  const u = us[i - 1];
  if (u?.kind === 'vowel') return u.latin;
  if (u?.kind === 'consonant' && u.vowel !== 'virama') return u.vowel === 'inherent' ? (said.get(i - 1) ?? true ? 'a' : undefined) : u.vowel.sign;
  return undefined;
}

function write(us: Unit[], said: Map<number, boolean>): string {
  let out = '';
  us.forEach((u, i) => {
    if (u.kind === 'vowel') out += u.latin;
    else if (u.kind === 'visarga') out += 'ḥ';
    else if (u.kind === 'nasal') {
      const next = us[i + 1];
      // Before a consonant: n or m after a short vowel; after a long one, a nasal vowel unless the model said n (बैंक baink).
      const vowel = u.chandrabindu || next?.kind !== 'consonant' || (LONG.has(vowelBefore(us, i, said) ?? '') && (u.vowel ?? true));
      out += vowel ? 'ṃ' : LABIAL.has(next.latin) ? 'm' : 'n';
    } else {
      out += u.latin;
      if (u.vowel === 'inherent') out += said.get(i) ?? true ? 'a' : '';
      else if (u.vowel !== 'virama') out += u.vowel.sign;
    }
  });
  return out;
}

/** The reading for a Devanagari word in Hindi's scheme, given the one the model wrote; a word this can't read keeps the model's. */
export function readHindi(word: string, reading: string): string {
  const us = units(word);
  if (!us?.length) return reading;
  const slots = open(us);
  const said = fromReading(us, reading) ?? new Map<number, boolean>();
  const last = slots[slots.length - 1];
  // The last inherent a is the one the model wobbles on most (लोकप्रिय lokpriy, lokpriya), so a rule decides it.
  if (last !== undefined && last === us.length - 1) said.set(last, finalSaid(word, us, last));
  byRule(us, slots, said);
  return write(us, said);
}

/** Each word's reading as first written, kept while the page (or popup) is open. */
const settled = new Map<string, string>();

/** `readHindi`, except that a word already read keeps its first reading. */
export function romaniseHindi(word: string, reading: string): string {
  let out = settled.get(word);
  if (out === undefined) settled.set(word, (out = readHindi(word, reading)));
  return out;
}
