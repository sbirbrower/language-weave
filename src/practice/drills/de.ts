import type { DrillData } from './types';

type Case = 'nom' | 'acc' | 'dat';
type Slot = 'm' | 'f' | 'n' | 'pl';

const GENDER_NAMES: Record<string, string> = { m: 'masculine', f: 'feminine', n: 'neuter' };
const DER: Record<Case, Record<Slot, string>> = {
  nom: { m: 'der', f: 'die', n: 'das', pl: 'die' },
  acc: { m: 'den', f: 'die', n: 'das', pl: 'die' },
  dat: { m: 'dem', f: 'der', n: 'dem', pl: 'den' },
};
/** The endings der, die and das have (das as -es): dieser's, mein's where it has one, and an adjective's with no article. */
const STRONG: Record<Case, Record<Slot, string>> = {
  nom: { m: 'er', f: 'e', n: 'es', pl: 'e' },
  acc: { m: 'en', f: 'e', n: 'es', pl: 'e' },
  dat: { m: 'em', f: 'er', n: 'em', pl: 'en' },
};

/** Endings that show a noun's gender, every time or most of the time; the first that fits a noun is its. */
const GENDER_ENDINGS: Array<{ suffixes: string[]; gender: string; always: boolean }> = [
  { suffixes: ['chen', 'lein'], gender: 'n', always: true },
  { suffixes: ['ung', 'heit', 'keit', 'schaft', 'tät'], gender: 'f', always: true },
  { suffixes: ['ling', 'ismus'], gender: 'm', always: true },
  { suffixes: ['um', 'ment'], gender: 'n', always: false },
  { suffixes: ['ion', 'ie', 'ik', 'e'], gender: 'f', always: false },
];
/** Compounds, with the last part that gives them their gender. */
const COMPOUNDS: Record<string, string> = { Fußball: 'der Ball', Wochenende: 'das Ende', Frühstück: 'das Stück' };

function article(noun: string, gender: string): { text: string; why: string } {
  const text = `${DER.nom[gender as Slot]} ${noun}`;
  const g = GENDER_NAMES[gender];
  if (COMPOUNDS[noun]) return { text, why: `${noun} is ${g}: a compound takes the gender of its last part, ${COMPOUNDS[noun]}` };
  const rule = GENDER_ENDINGS.find((r) => r.suffixes.some((s) => noun.endsWith(s)));
  const suffix = rule?.suffixes.find((s) => noun.endsWith(s));
  if (rule?.gender === gender) {
    const all = rule.always ? `every noun ending in -${suffix} is` : `most nouns ending in -${suffix} are`;
    return { text, why: `${noun} is ${g}: ${all} ${g}${noun === 'Mädchen' ? ', even a girl' : ''}` };
  }
  if (rule) return { text, why: `${noun} is ${g}, though most nouns ending in -${suffix} are ${GENDER_NAMES[rule.gender]}: learn it with its article` };
  return { text, why: `${noun} is ${g}: nothing in the word shows it, so learn it with its article` };
}

const HOURS = ['', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'];
const FIVES: Record<number, string> = { 5: 'fünf', 10: 'zehn', 20: 'zwanzig' };

/** How h:mm is said, the half hour and what comes after it counted towards the next hour. */
function sayTime(h: number, m: number): { text: string; why: string } {
  const t = `${h}:${String(m).padStart(2, '0')}`;
  const next = (h % 12) + 1;
  const say = (text: string, why: string) => ({ text, why: `${text}: ${why}, ${t}.` });
  if (m === 0) return say(`${h === 1 ? 'ein' : HOURS[h]} Uhr`, `${h} o’clock`);
  if (m === 15) return say(`Viertel nach ${HOURS[h]}`, `a quarter past ${h}`);
  if (m === 45) return say(`Viertel vor ${HOURS[next]}`, `a quarter to ${next}`);
  if (m === 30) return { text: `halb ${HOURS[next]}`, why: `halb ${HOURS[next]}: half way to ${next}, ${t}. German counts the half hour towards the next hour, not past the last.` };
  if (m === 25 || m === 35) return say(`fünf ${m === 25 ? 'vor' : 'nach'} halb ${HOURS[next]}`, `five minutes ${m === 25 ? 'before' : 'after'} halb ${HOURS[next]} (${h}:30)`);
  if (m < 30) return say(`${FIVES[m]} nach ${HOURS[h]}`, `${m} past ${h}`);
  return say(`${FIVES[60 - m]} vor ${HOURS[next]}`, `${60 - m} to ${next}`);
}

/** The lessons on adjective endings: Shopping (after der-words), then My flat (after ein-words and with none, der-words again). */
const SHOPPING = 17;
const FLAT = 18;

interface Determiner {
  word: string;
  en: string;
  /** Its English in the plural; none for one without a plural (ein). */
  enPl?: string;
  kind: 'der' | 'ein' | 'none';
  at: number;
}

const DETERMINERS: Determiner[] = [
  { word: 'der', en: 'the', enPl: 'the', kind: 'der', at: SHOPPING },
  { word: 'dieser', en: 'this', enPl: 'these', kind: 'der', at: SHOPPING },
  { word: 'ein', en: 'a', kind: 'ein', at: FLAT },
  { word: 'mein', en: 'my', enPl: 'my', kind: 'ein', at: FLAT },
  { word: '', en: '', enPl: '', kind: 'none', at: FLAT },
];

/** A determiner's form, and whether it has der's ending there (showing the case); undefined where it has no form (ein in the plural). */
function determine(d: Determiner, c: Case, s: Slot): { text: string; shows: boolean } | undefined {
  if (d.kind === 'none') return { text: '', shows: false };
  if (s === 'pl' && d.enPl === undefined) return undefined;
  if (d.word === 'der') return { text: DER[c][s], shows: true };
  if (d.kind === 'der') return { text: d.word.replace(/er$/, '') + STRONG[c][s], shows: true };
  const bare = (c === 'nom' && s === 'm') || (c !== 'dat' && s === 'n');
  return { text: bare ? d.word : d.word + STRONG[c][s], shows: !bare };
}

/** An adjective's ending after a determiner that shows the case: -e in the nominative singular and the accusative of die and das, else -en. */
const weak = (c: Case, s: Slot) => (s !== 'pl' && (c === 'nom' || (c === 'acc' && s !== 'm')) ? 'e' : 'en');

const ADJECTIVES: Record<string, string> = {
  rot: 'red', blau: 'blue', schwarz: 'black', weiß: 'white', grün: 'green', neu: 'new', alt: 'old', klein: 'small', groß: 'big',
  warm: 'warm', kalt: 'cold', heiß: 'hot', lang: 'long', kurz: 'short', bequem: 'comfortable', hell: 'bright', modern: 'modern',
  frisch: 'fresh', rund: 'round', leicht: 'light',
};

/** Nouns for the endings, with adjectives that suit them; a `mass` noun (milk) has no plural and no ein, but can go without an article. */
const ENDING_NOUNS: Array<{ text: string; gender: 'm' | 'f' | 'n'; en: string; plural?: string; enPl?: string; mass?: true; adjectives: string[] }> = [
  { text: 'Pullover', gender: 'm', en: 'jumper', plural: 'Pullover', enPl: 'jumpers', adjectives: ['rot', 'warm', 'neu'] },
  { text: 'Mantel', gender: 'm', en: 'coat', plural: 'Mäntel', enPl: 'coats', adjectives: ['schwarz', 'lang', 'warm'] },
  { text: 'Rock', gender: 'm', en: 'skirt', plural: 'Röcke', enPl: 'skirts', adjectives: ['kurz', 'blau', 'schwarz'] },
  { text: 'Tisch', gender: 'm', en: 'table', plural: 'Tische', enPl: 'tables', adjectives: ['groß', 'rund', 'alt'] },
  { text: 'Stuhl', gender: 'm', en: 'chair', plural: 'Stühle', enPl: 'chairs', adjectives: ['bequem', 'alt', 'neu'] },
  { text: 'Schrank', gender: 'm', en: 'wardrobe', plural: 'Schränke', enPl: 'wardrobes', adjectives: ['groß', 'weiß', 'alt'] },
  { text: 'Tee', gender: 'm', en: 'tea', mass: true, adjectives: ['heiß', 'grün'] },
  { text: 'Jacke', gender: 'f', en: 'jacket', plural: 'Jacken', enPl: 'jackets', adjectives: ['rot', 'warm', 'leicht'] },
  { text: 'Bluse', gender: 'f', en: 'blouse', plural: 'Blusen', enPl: 'blouses', adjectives: ['weiß', 'blau', 'neu'] },
  { text: 'Tasche', gender: 'f', en: 'bag', plural: 'Taschen', enPl: 'bags', adjectives: ['schwarz', 'groß', 'klein'] },
  { text: 'Lampe', gender: 'f', en: 'lamp', plural: 'Lampen', enPl: 'lamps', adjectives: ['hell', 'klein', 'modern'] },
  { text: 'Küche', gender: 'f', en: 'kitchen', plural: 'Küchen', enPl: 'kitchens', adjectives: ['groß', 'klein', 'modern'] },
  { text: 'Milch', gender: 'f', en: 'milk', mass: true, adjectives: ['frisch', 'kalt', 'warm'] },
  { text: 'Hemd', gender: 'n', en: 'shirt', plural: 'Hemden', enPl: 'shirts', adjectives: ['weiß', 'blau', 'neu'] },
  { text: 'Kleid', gender: 'n', en: 'dress', plural: 'Kleider', enPl: 'dresses', adjectives: ['rot', 'lang', 'kurz'] },
  { text: 'Zimmer', gender: 'n', en: 'room', plural: 'Zimmer', enPl: 'rooms', adjectives: ['groß', 'klein', 'hell'] },
  { text: 'Sofa', gender: 'n', en: 'sofa', plural: 'Sofas', enPl: 'sofas', adjectives: ['bequem', 'alt', 'grün'] },
  { text: 'Bett', gender: 'n', en: 'bed', plural: 'Betten', enPl: 'beds', adjectives: ['groß', 'bequem', 'neu'] },
  { text: 'Brot', gender: 'n', en: 'bread', mass: true, adjectives: ['frisch', 'warm'] },
  { text: 'Wasser', gender: 'n', en: 'water', mass: true, adjectives: ['kalt', 'warm'] },
];

/** Sentences for a noun phrase (`{np}`), in a case, with why; `not` the determiners that sound wrong in it. */
const ENDING_FRAMES: Array<{ case: Case; text: string; pl?: string; en: string; enPl?: string; why: string; not?: string[] }> = [
  { case: 'nom', text: 'Wo ist {np}?', pl: 'Wo sind {np}?', en: 'Where is {np}?', enPl: 'Where are {np}?', why: 'it’s the subject, so nominative', not: ['ein', ''] },
  { case: 'nom', text: 'Das ist {np}.', pl: 'Das sind {np}.', en: 'That’s {np}.', enPl: 'Those are {np}.', why: 'after sein it stays nominative', not: ['dieser'] },
  { case: 'acc', text: 'Ich suche {np}.', en: 'I’m looking for {np}.', why: 'suchen takes the accusative' },
  { case: 'acc', text: 'Ich nehme {np}.', en: 'I’ll take {np}.', why: 'nehmen takes the accusative' },
  { case: 'dat', text: 'Was machst du mit {np}?', en: 'What are you doing with {np}?', why: 'mit takes the dative' },
  { case: 'dat', text: 'Ich spreche von {np}.', en: 'I’m talking about {np}.', why: 'von takes the dative' },
];

type EndingPhrase = ReturnType<NonNullable<DrillData['endings']>['phrases']>[number];
const endingPhrases = new Map<number, EndingPhrase[]>();

/** Every phrase with an adjective ending to fill in for lesson `at`: none outside the lessons that teach them. */
function phrasesAt(at: number): EndingPhrase[] {
  if (at !== SHOPPING && at !== FLAT) return [];
  const cached = endingPhrases.get(at);
  if (cached) return cached;
  const out: EndingPhrase[] = [];
  for (const d of DETERMINERS.filter((x) => x.at <= at)) {
    for (const frame of ENDING_FRAMES.filter((f) => !f.not?.includes(d.word))) {
      for (const noun of ENDING_NOUNS) {
        for (const s of [noun.gender, 'pl'] as Slot[]) {
          if (s === 'pl' ? !noun.plural : d.kind === 'none' && !noun.mass) continue;
          if (noun.mass && d.word === 'ein') continue;
          const det = determine(d, frame.case, s);
          if (!det) continue;
          const c = frame.case;
          const end = det.shows ? weak(c, s) : STRONG[c][s];
          const plural = noun.plural ?? '';
          const nounText = s !== 'pl' ? noun.text : c === 'dat' && !/[ns]$/.test(plural) ? `${plural}n` : plural;
          for (const adj of noun.adjectives) {
            const adjEn = ADJECTIVES[adj]!;
            const enDet = s === 'pl' ? d.enPl : d.en === 'a' && /^[aeiou]/.test(adjEn) ? 'an' : d.en;
            const np = [det.text, '___', nounText].filter(Boolean).join(' ');
            const npEn = [enDet, adjEn, s === 'pl' ? noun.enPl : noun.en].filter(Boolean).join(' ');
            const what = s === 'pl' ? `${plural} is plural` : `${noun.text} is ${GENDER_NAMES[s]}`;
            const dativeN = nounText !== (s === 'pl' ? plural : noun.text) ? ` (and the noun takes -n: ${nounText})` : '';
            const how =
              d.kind === 'none'
                ? `With no article, the adjective shows the case itself, ending as the article would: ${DER[c][s]} → ${adj}${end}.`
                : det.shows
                  ? `After ${det.text}, which already shows the case, the adjective takes just -${end}${end === 'en' ? ', as it does everywhere but the nominative singular and the accusative of die and das' : ''}.`
                  : `${det.text} has no ending to show it, so the adjective does, ending as the article would: ${DER[c][s]} → ${adj}${end}.`;
            out.push({
              text: (s === 'pl' ? (frame.pl ?? frame.text) : frame.text).replace('{np}', np),
              en: (s === 'pl' ? (frame.enPl ?? frame.en) : frame.en).replace('{np}', npEn),
              right: adj + end,
              wrong: ['e', 'en', 'er', 'es', 'em'].filter((e) => e !== end).map((e) => adj + e),
              why: `${what}, and ${frame.why}${dativeN}. ${how}`,
            });
          }
        }
      }
    }
  }
  endingPhrases.set(at, out);
  return out;
}

export const DE_DRILLS: DrillData = {
  lessons: 4,
  pairs: [
    { words: [{ text: 'schon', en: 'already' }, { text: 'schön', en: 'beautiful' }], why: 'For ö, say e with your lips rounded as for o.', at: 1 },
    { words: [{ text: 'lesen', en: 'to read' }, { text: 'lösen', en: 'to solve' }], why: 'For ö, say e with your lips rounded as for o.', at: 1 },
    { words: [{ text: 'Kuchen', en: 'cake' }, { text: 'Küchen', en: 'kitchens' }], why: 'For ü, say ee with your lips rounded as for oo.', at: 1 },
    { words: [{ text: 'vier', en: 'four' }, { text: 'für', en: 'for' }], why: 'ie is a long ee; ü is ee with the lips rounded.', at: 1 },
    { words: [{ text: 'Stadt', en: 'town' }, { text: 'Staat', en: 'state' }], why: 'A vowel before two consonants is short; a doubled one (aa) is long.', at: 3 },
    { words: [{ text: 'Mitte', en: 'middle' }, { text: 'Miete', en: 'rent' }], why: 'i before a double consonant is short; ie is long.', at: 3 },
    { words: [{ text: 'Bett', en: 'bed' }, { text: 'Beet', en: 'flowerbed' }], why: 'e before tt is short; ee is long.', at: 3 },
    { words: [{ text: 'Ofen', en: 'oven' }, { text: 'offen', en: 'open' }], why: 'o before one consonant is long; before ff it’s short.', at: 3 },
  ],
  sorts: [
    {
      at: 2,
      labels: ['sh, as in Schule', 's, as in Haus'],
      why: 'At the start of a word (or a part of one), sp and st are said shp and sht. Anywhere else, s is just s.',
      words: [
        { text: '*S*port', en: 'sport', label: 0 },
        { text: '*S*tadt', en: 'city', label: 0 },
        { text: '*s*prechen', en: 'to speak', label: 0 },
        { text: '*S*traße', en: 'street', label: 0 },
        { text: '*S*tunde', en: 'hour', label: 0 },
        { text: 'Fen*s*ter', en: 'window', label: 1 },
        { text: 'i*s*t', en: 'is', label: 1 },
        { text: 'Kno*s*pe', en: 'bud', label: 1 },
        { text: 'Wur*s*t', en: 'sausage', label: 1 },
        { text: 'Gä*s*te', en: 'guests', label: 1 },
      ],
    },
    {
      at: 3,
      labels: ['soft, as in ich', 'from the throat, as in ach'],
      why: 'After a, o, u and au, ch is made at the back of the throat, as in Scottish loch. Anywhere else (after e, i, ä, ö, ü, a consonant, and in -chen) it’s soft, like a whispered y in huge.',
      words: [
        { text: 'i*ch*', en: 'I', label: 0 },
        { text: 'Mil*ch*', en: 'milk', label: 0 },
        { text: 'Mäd*ch*en', en: 'girl', label: 0 },
        { text: 'Kü*ch*e', en: 'kitchen', label: 0 },
        { text: 'spre*ch*en', en: 'to speak', label: 0 },
        { text: 'Li*ch*t', en: 'light', label: 0 },
        { text: 'Bu*ch*', en: 'book', label: 1 },
        { text: 'a*ch*t', en: 'eight', label: 1 },
        { text: 'au*ch*', en: 'also', label: 1 },
        { text: 'Na*ch*t', en: 'night', label: 1 },
        { text: 'Wo*ch*e', en: 'week', label: 1 },
        { text: 'To*ch*ter', en: 'daughter', label: 1 },
      ],
    },
  ],
  dictation: ['Mädchen', 'schön', 'Straße', 'Tschüss', 'Käse', 'Frühstück', 'Bruder', 'Schwester', 'müde', 'heute', 'Brötchen', 'Fußball'],
  articles: {
    at: 2,
    guess: true,
    article,
    forms: (noun) => ['der', 'die', 'das'].map((a) => `${a} ${noun}`),
    nouns: [
      { text: 'Vater', gender: 'm', en: 'the father' },
      { text: 'Bruder', gender: 'm', en: 'the brother' },
      { text: 'Sohn', gender: 'm', en: 'the son' },
      { text: 'Onkel', gender: 'm', en: 'the uncle' },
      { text: 'Opa', gender: 'm', en: 'the grandad' },
      { text: 'Mann', gender: 'm', en: 'the man' },
      { text: 'Freund', gender: 'm', en: 'the friend' },
      { text: 'Tag', gender: 'm', en: 'the day' },
      { text: 'Abend', gender: 'm', en: 'the evening' },
      { text: 'Hund', gender: 'm', en: 'the dog' },
      { text: 'Tisch', gender: 'm', en: 'the table' },
      { text: 'Name', gender: 'm', en: 'the name' },
      { text: 'Käse', gender: 'm', en: 'the cheese' },
      { text: 'Frühling', gender: 'm', en: 'the spring' },
      { text: 'Fußball', gender: 'm', en: 'the football' },
      { text: 'Mutter', gender: 'f', en: 'the mother' },
      { text: 'Schwester', gender: 'f', en: 'the sister' },
      { text: 'Tochter', gender: 'f', en: 'the daughter' },
      { text: 'Tante', gender: 'f', en: 'the aunt' },
      { text: 'Oma', gender: 'f', en: 'the grandma' },
      { text: 'Frau', gender: 'f', en: 'the woman' },
      { text: 'Familie', gender: 'f', en: 'the family' },
      { text: 'Woche', gender: 'f', en: 'the week' },
      { text: 'Stunde', gender: 'f', en: 'the hour' },
      { text: 'Schule', gender: 'f', en: 'the school' },
      { text: 'Uhr', gender: 'f', en: 'the clock' },
      { text: 'Zeitung', gender: 'f', en: 'the newspaper' },
      { text: 'Wohnung', gender: 'f', en: 'the flat' },
      { text: 'Mannschaft', gender: 'f', en: 'the team' },
      { text: 'Musik', gender: 'f', en: 'the music' },
      { text: 'Information', gender: 'f', en: 'the information' },
      { text: 'Kind', gender: 'n', en: 'the child' },
      { text: 'Baby', gender: 'n', en: 'the baby' },
      { text: 'Mädchen', gender: 'n', en: 'the girl' },
      { text: 'Brötchen', gender: 'n', en: 'the bread roll' },
      { text: 'Haus', gender: 'n', en: 'the house' },
      { text: 'Buch', gender: 'n', en: 'the book' },
      { text: 'Auto', gender: 'n', en: 'the car' },
      { text: 'Kino', gender: 'n', en: 'the cinema' },
      { text: 'Bett', gender: 'n', en: 'the bed' },
      { text: 'Museum', gender: 'n', en: 'the museum' },
      { text: 'Instrument', gender: 'n', en: 'the instrument' },
      { text: 'Wochenende', gender: 'n', en: 'the weekend' },
      { text: 'Frühstück', gender: 'n', en: 'the breakfast' },
    ],
  },
  clock: { at: 3, say: sayTime, sentence: { text: 'Es ist {t}.', en: 'It’s {t}.' } },
  contradict: {
    at: 4,
    answers: { yes: 'Ja', no: 'Nein', contra: 'Doch' },
    why: {
      contra: 'The question has nicht or kein in it, so to say yes against it, answer Doch, never Ja.',
      agree: 'Nein agrees with a question that has nicht or kein in it: no, it isn’t so.',
      yes: 'Ja says yes to a question without nicht or kein; Doch only answers one with them.',
      no: 'Nein says no.',
    },
    questions: [
      { text: 'Hast du keinen Hunger?', en: 'Aren’t you hungry?', negative: true, yes: { text: 'ich habe Hunger', en: 'I am hungry' }, no: { text: 'ich habe keinen Hunger', en: 'I’m not hungry' } },
      { text: 'Bist du nicht müde?', en: 'Aren’t you tired?', negative: true, yes: { text: 'ich bin müde', en: 'I am tired' }, no: { text: 'ich bin nicht müde', en: 'I’m not tired' } },
      { text: 'Hast du keinen Laptop?', en: 'Haven’t you got a laptop?', negative: true, yes: { text: 'ich habe einen Laptop', en: 'I’ve got one' }, no: { text: 'ich habe keinen Laptop', en: 'I haven’t got one' } },
      { text: 'Lernst du kein Deutsch?', en: 'Don’t you study German?', negative: true, yes: { text: 'ich lerne Deutsch', en: 'I do' }, no: { text: 'ich lerne kein Deutsch', en: 'I don’t' } },
      { text: 'Hast du heute keine Vorlesung?', en: 'Haven’t you got a lecture today?', negative: true, yes: { text: 'ich habe heute eine Vorlesung', en: 'I’ve got one' }, no: { text: 'ich habe heute keine Vorlesung', en: 'I haven’t' } },
      { text: 'Ist die Bibliothek nicht offen?', en: 'Isn’t the library open?', negative: true, yes: { text: 'sie ist offen', en: 'it is open' }, no: { text: 'sie ist nicht offen', en: 'it isn’t open' } },
      { text: 'Kommst du heute nicht?', en: 'Aren’t you coming today?', negative: true, yes: { text: 'ich komme heute', en: 'I am' }, no: { text: 'ich komme heute nicht', en: 'I’m not' } },
      { text: 'Hast du Hunger?', en: 'Are you hungry?', negative: false, yes: { text: 'ich habe Hunger', en: 'I am hungry' }, no: { text: 'ich habe keinen Hunger', en: 'I’m not hungry' } },
      { text: 'Bist du müde?', en: 'Are you tired?', negative: false, yes: { text: 'ich bin müde', en: 'I am tired' }, no: { text: 'ich bin nicht müde', en: 'I’m not tired' } },
      { text: 'Hast du einen Laptop?', en: 'Have you got a laptop?', negative: false, yes: { text: 'ich habe einen Laptop', en: 'I’ve got one' }, no: { text: 'ich habe keinen Laptop', en: 'I haven’t got one' } },
      { text: 'Ist die Mensa gut?', en: 'Is the canteen good?', negative: false, yes: { text: 'sie ist gut', en: 'it’s good' }, no: { text: 'sie ist nicht gut', en: 'it isn’t good' } },
    ],
  },
  endings: { phrases: phrasesAt },
};
