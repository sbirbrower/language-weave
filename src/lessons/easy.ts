import { createBankLesson, isSentenceStart, type BankEntry } from './bank';
import { normalizeLemma } from './resolve';
import type { Lesson, Tier } from './types';
import { CS_EASY_WORDS } from './words/cs';
import { DE_EASY_WORDS } from './words/de';
import { ES_EASY_WORDS } from './words/es';
import { PT_EASY_WORDS } from './words/pt';
import { IT_EASY_WORDS } from './words/it';
import { RU_EASY_WORDS } from './words/ru';
import { GD_EASY_WORDS } from './words/gd';
import { HE_EASY_WORDS } from './words/he';
import { AR_EASY_WORDS } from './words/ar';
import { HI_EASY_WORDS } from './words/hi';
import { JA_EASY_WORDS } from './words/ja';
import { KO_EASY_WORDS } from './words/ko';
import { ZH_EASY_WORDS } from './words/zh';

/**
 * The easiest English words with an obvious French, found by code in every
 * paragraph. A lesson that runs out of its own words fills the rest of its
 * density with these, easiest first, before asking the model for anything
 * freer. The model still writes the French, so articles and agreement fit
 * the sentence.
 */
export interface EasyWord {
  /** English forms as they appear in text: "dog|dogs". */
  forms: string;
  /** Lemma in the language woven; extra lemmas the model may use instead follow a "/". */
  lemma: string;
  /** 1 = the very easiest (concrete nouns, colours, basic adjectives), 2 = common verbs and adverbs. */
  rank: 1 | 2;
}

// The French list. English words with several common meanings ("spring", "arm", "like",
// "last", "close", "can", "fine", "well") are left out: the French would be
// wrong too often.
const RANK_1: Array<[string, string]> = [
  // people
  ['man|men', 'homme'], ['woman|women', 'femme'], ['child|children', 'enfant'], ['boy|boys', 'garçon'],
  ['girl|girls', 'fille'], ['baby|babies', 'bébé'], ['friend|friends', 'ami'], ['family|families', 'famille'],
  ['father|fathers', 'père'], ['mother|mothers', 'mère'], ['brother|brothers', 'frère'], ['sister|sisters', 'sœur'],
  ['son|sons', 'fils'], ['daughter|daughters', 'fille'], ['husband|husbands', 'mari'], ['wife|wives', 'femme'],
  ['people', 'gens/personne'], ['person', 'personne'], ['king|kings', 'roi'], ['queen|queens', 'reine'],
  // animals
  ['animal|animals', 'animal'], ['dog|dogs', 'chien'], ['cat|cats', 'chat'], ['horse|horses', 'cheval'],
  ['bird|birds', 'oiseau'], ['rabbit|rabbits', 'lapin'], ['cow|cows', 'vache'], ['sheep', 'mouton'], ['mouse|mice', 'souris'],
  // body
  ['head|heads', 'tête'], ['eye|eyes', 'œil'], ['ear|ears', 'oreille'], ['nose|noses', 'nez'], ['mouth', 'bouche'],
  ['hand|hands', 'main'], ['foot|feet', 'pied'], ['leg|legs', 'jambe'], ['heart|hearts', 'cœur'], ['tail|tails', 'queue'],
  ['body|bodies', 'corps'], ['hair', 'cheveux/poil'],
  // home and things
  ['house|houses', 'maison'], ['home', 'maison'], ['door|doors', 'porte'], ['window|windows', 'fenêtre'],
  ['table|tables', 'table'], ['bed|beds', 'lit'], ['garden|gardens', 'jardin'], ['car|cars', 'voiture'],
  ['bicycle|bicycles|bike|bikes', 'vélo'], ['train|trains', 'train'], ['boat|boats', 'bateau'], ['plane|planes|aircraft', 'avion'],
  ['book|books', 'livre'], ['letter|letters', 'lettre'], ['money', 'argent'], ['photo|photos|photograph|photographs', 'photo'],
  ['film|films|movie|movies', 'film'], ['music', 'musique'], ['song|songs', 'chanson'], ['game|games', 'jeu/match'],
  ['name|names', 'nom'], ['colour|colours|color|colors', 'couleur'], ['school|schools', 'école'],
  // places and nature
  ['city|cities', 'ville'], ['town|towns', 'ville'], ['village|villages', 'village'], ['country|countries', 'pays'],
  ['world', 'monde'], ['street|streets', 'rue'], ['road|roads', 'route'], ['shop|shops', 'magasin'],
  ['sea|seas', 'mer'], ['river|rivers', 'rivière/fleuve'], ['mountain|mountains', 'montagne'], ['island|islands', 'île'],
  ['beach|beaches', 'plage'], ['forest|forests', 'forêt'], ['tree|trees', 'arbre'], ['flower|flowers', 'fleur'],
  ['sun', 'soleil'], ['moon', 'lune'], ['star|stars', 'étoile'], ['sky', 'ciel'], ['snow', 'neige'], ['rain', 'pluie'],
  ['water', 'eau'], ['fire', 'feu'],
  // food
  ['food', 'nourriture'], ['bread', 'pain'], ['milk', 'lait'], ['meat', 'viande'], ['fruit|fruits', 'fruit'],
  ['apple|apples', 'pomme'], ['coffee', 'café'], ['egg|eggs', 'œuf'],
  // time
  ['day|days', 'jour'], ['night|nights', 'nuit'], ['morning|mornings', 'matin'], ['evening|evenings', 'soir'],
  ['week|weeks', 'semaine'], ['month|months', 'mois'], ['year|years', 'an/année'], ['hour|hours', 'heure'],
  ['summer', 'été'], ['winter', 'hiver'], ['autumn', 'automne'], ['century|centuries', 'siècle'],
  // adjectives
  ['big|large', 'grand/gros'], ['small|tiny', 'petit'], ['good', 'bon'], ['bad', 'mauvais'], ['new', 'nouveau'],
  ['old', 'vieux/ancien'], ['young', 'jeune'], ['long', 'long'], ['short', 'court/petit'], ['hot|warm', 'chaud'],
  ['cold', 'froid'], ['happy', 'heureux/content'], ['sad', 'triste'], ['beautiful', 'beau'], ['pretty', 'joli'],
  ['fast|quick', 'rapide'], ['slow', 'lent'], ['easy', 'facile'], ['difficult', 'difficile'], ['strong', 'fort'],
  ['important', 'important'], ['popular', 'populaire'], ['famous', 'célèbre'],
  // colours
  ['red', 'rouge'], ['blue', 'bleu'], ['green', 'vert'], ['white', 'blanc'], ['black', 'noir'], ['yellow', 'jaune'],
  ['grey|gray', 'gris'], ['brown', 'marron/brun'], ['pink', 'rose'], ['orange', 'orange'],
  // general nouns and adjectives, many of them nearly the same in French
  ['species', 'espèce'], ['group|groups', 'groupe'], ['part|parts', 'partie'], ['number|numbers', 'nombre'],
  ['shape|shapes', 'forme'], ['size|sizes', 'taille'], ['life', 'vie'], ['death', 'mort'], ['skin|skins', 'peau'],
  ['fur', 'fourrure'], ['human|humans', 'humain'], ['adult|adults', 'adulte'], ['health', 'santé'],
  ['disease|diseases', 'maladie'], ['population|populations', 'population'], ['habitat|habitats', 'habitat'],
  ['system|systems', 'système'], ['surface|surfaces', 'surface'], ['structure|structures', 'structure'],
  ['region|regions', 'région'], ['zone|zones', 'zone'], ['energy', 'énergie'], ['climate', 'climat'],
  ['history', 'histoire'], ['science', 'science'], ['problem|problems', 'problème'], ['example|examples', 'exemple'],
  ['image|images', 'image'], ['type|types', 'type'], ['nature', 'nature'], ['culture|cultures', 'culture'],
  ['protection', 'protection'], ['production', 'production'], ['information', 'information'],
  ['nation|nations', 'nation'], ['million|millions', 'million'], ['minute|minutes', 'minute'], ['sport|sports', 'sport'],
  ['centre|centres|center|centers', 'centre'], ['planet|planets', 'planète'], ['ocean|oceans', 'océan'],
  ['plant|plants', 'plante'], ['fish', 'poisson'], ['wild', 'sauvage'], ['natural', 'naturel'], ['central', 'central'],
  ['national', 'national'], ['international', 'international'], ['high', 'haut/élevé'], ['low', 'bas/faible'],
  ['rare', 'rare'], ['common', 'commun/courant'], ['different', 'différent'], ['possible', 'possible'],
  ['normal', 'normal'], ['simple', 'simple'], ['modern', 'moderne'], ['original', 'original'], ['true', 'vrai'],
  ['full', 'plein'], ['dark', 'sombre/foncé'],
];

const RANK_2: Array<[string, string]> = [
  // verbs: the model conjugates them in place
  ['eat|eats|ate|eaten|eating', 'manger'], ['drink|drinks|drank|drinking', 'boire'], ['sleep|sleeps|slept|sleeping', 'dormir'],
  ['run|runs|ran|running', 'courir'], ['walk|walks|walked|walking', 'marcher'], ['play|plays|played|playing', 'jouer'],
  ['live|lives|lived|living', 'vivre/habiter'], ['love|loves|loved|loving', 'aimer'], ['see|sees|saw|seen|seeing', 'voir'],
  ['go|goes|went|gone|going', 'aller'], ['come|comes|came|coming', 'venir'], ['make|makes|made|making', 'faire'],
  ['give|gives|gave|given|giving', 'donner'], ['take|takes|took|taken|taking', 'prendre'], ['find|finds|found|finding', 'trouver'],
  ['buy|buys|bought|buying', 'acheter'], ['sell|sells|sold|selling', 'vendre'], ['begin|begins|began|begun|beginning|start|starts|started|starting', 'commencer'],
  ['finish|finishes|finished|finishing', 'finir'], ['win|wins|won|winning', 'gagner'], ['lose|loses|lost|losing', 'perdre'],
  ['help|helps|helped|helping', 'aider'], ['want|wants|wanted|wanting', 'vouloir'], ['think|thinks|thought|thinking', 'penser'],
  ['become|becomes|became|becoming', 'devenir'], ['die|dies|died|dying', 'mourir'], ['call|calls|called|calling', 'appeler'],
  ['work|works|worked|working', 'travailler/travail'], ['travel|travels|travelled|traveled|travelling|traveling', 'voyager'],
  ['hunt|hunts|hunted|hunting', 'chasser/chasse'], ['wait|waits|waited|waiting', 'attendre'], ['carry|carries|carried|carrying', 'porter'],
  // adverbs
  ['often', 'souvent'], ['always', 'toujours'], ['never', 'jamais'], ['sometimes', 'parfois'], ['today', 'aujourd’hui'],
  ['now', 'maintenant'], ['here', 'ici'], ['together', 'ensemble'], ['quickly', 'vite'], ['early', 'tôt'], ['late', 'tard'],
  ['grow|grows|grew|grown|growing', 'grandir/pousser'], ['feed|feeds|fed|feeding', 'nourrir/manger'],
  ['move|moves|moved|moving', 'bouger/déplacer'], ['show|shows|showed|shown|showing', 'montrer'],
  ['change|changes|changed|changing', 'changer/changement'], ['use|uses|used|using', 'utiliser/utilisation'],
  // small words: the most common of all, so they come after the nouns and are capped like the rest
  ['is|are|was|were', 'être'], ['has|had', 'avoir'], ['from', 'de'], ['for', 'pour'], ['without', 'sans'],
  ['between', 'entre'], ['after', 'après'], ['before', 'avant'], ['under', 'sous'], ['during', 'pendant'],
  ['some', 'quelques/quelque/certains/certain'], ['many', 'beaucoup/nombreux'], ['all', 'tout'], ['each|every', 'chaque'],
  ['several', 'plusieurs'], ['few', 'peu'], ['this|these', 'ce/cette/cet/ces'], ['they', 'ils/elles'],
  // need agreement and say little on their own
  ['same', 'même'], ['other', 'autre'],
];

export const EASY_WORDS: EasyWord[] = [
  ...RANK_1.map(([forms, lemma]) => ({ forms, lemma, rank: 1 as const })),
  ...RANK_2.map(([forms, lemma]) => ({ forms, lemma, rank: 2 as const })),
];

const byLanguage: Record<string, readonly EasyWord[]> = { fr: EASY_WORDS, de: DE_EASY_WORDS, ja: JA_EASY_WORDS, zh: ZH_EASY_WORDS, ko: KO_EASY_WORDS, hi: HI_EASY_WORDS, he: HE_EASY_WORDS, ar: AR_EASY_WORDS, cs: CS_EASY_WORDS, es: ES_EASY_WORDS, pt: PT_EASY_WORDS, ru: RU_EASY_WORDS, it: IT_EASY_WORDS, gd: GD_EASY_WORDS };

/** The easy words for a language; [] for a language without a list yet. */
export function easyWordsFor(lang: string): readonly EasyWord[] {
  return byLanguage[lang] ?? [];
}

export const EASY_CATEGORY = { id: 'easy', label: 'Easy words' };

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/['’]/g, "['’]");

/** Bank entries, with ids from each word's place in the full list so they stay the same when some are left out. */
function entries(words: readonly EasyWord[], skip: Set<string>): BankEntry[] {
  return words.flatMap((w, i) => {
    const lemmas = w.lemma.split('/');
    if (lemmas.some((l) => skip.has(normalizeLemma(l)))) return [];
    return [
      {
        id: `easy:${i}`,
        // Rank 1 is spent before rank 2 in each paragraph.
        tier: (w.rank === 1 ? 2 : 3) as Tier,
        category: EASY_CATEGORY.id,
        english: w.forms.split('|').sort((a, b) => b.length - a.length).map(escape).join('|'),
        french: lemmas[0]!,
        lemmas,
        pos: '',
        gloss: w.forms.split('|')[0]!,
      },
    ];
  });
}

const easyFragment = (L: string) => `Replace the candidates listed below with ${L}. Skip a candidate if no correct ${L} fits where it stands.
- Each span must contain its candidate. You may extend it by a word or two when ${L} needs them (an article, a noun's adjective), up to 5 words.
- Use one of the lemmas given for the candidate.`;

/**
 * Easy words as a lesson of their own, leaving out the lemmas a lesson
 * already teaches or the page already picked. Capitalised words are skipped
 * when they're part of a name: mid-sentence ("Brown", "Green Bay"), or
 * followed by another capitalised word ("Star Wars is…").
 */
export function easyWordsLesson(words: readonly EasyWord[], skipLemmas: Iterable<string>, language: string): Lesson {
  const skip = new Set([...skipLemmas].map(normalizeLemma));
  const lesson = createBankLesson({
    id: 'easy',
    name: 'Easy words',
    language,
    categories: [EASY_CATEGORY],
    caps: { perEntryPerSegment: { 2: 1, 3: 1 }, maxShare: {}, minGapWords: 3 },
    entries: entries(words, skip),
    promptFragment: easyFragment(language),
  });
  return {
    ...lesson,
    findCandidates: (segment) =>
      lesson.findCandidates(segment).filter((c) => {
        const first = segment[c.start] ?? '';
        if (first === first.toLowerCase()) return true;
        return isSentenceStart(segment, c.start) && !/^\s+\p{Lu}/u.test(segment.slice(c.end));
      }),
  };
}
