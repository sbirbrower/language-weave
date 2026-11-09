import type { Gender } from '../languages';
import { CS_A1_WORDS } from './words/cs';
import { DE_A1_WORDS } from './words/de';
import { ES_A1_WORDS } from './words/es';
import { PT_A1_WORDS } from './words/pt';
import { IT_A1_WORDS } from './words/it';
import { RU_A1_WORDS } from './words/ru';
import { GD_A1_WORDS } from './words/gd';
import { HE_A1_WORDS } from './words/he';
import { AR_A1_WORDS } from './words/ar';
import { HI_A1_WORDS } from './words/hi';
import { JA_A1_WORDS } from './words/ja';
import { KO_A1_WORDS } from './words/ko';
import { ZH_A1_WORDS } from './words/zh';

/** One A1 lemma: dictionary form, English meaning, gender for nouns. */
export interface A1Word {
  lemma: string;
  en: string;
  g?: Gender;
}

// Everyday French A1 vocabulary, grouped by theme. The model may only weave these
// (plus the lesson's own words) when filling a lesson's budget, so the extra
// words stay at the reader's level.
const nouns: Array<[string, string, Gender]> = [
  // people and family
  ['homme', 'man', 'm'], ['femme', 'woman, wife', 'f'], ['enfant', 'child', 'm'], ['garçon', 'boy', 'm'],
  ['fille', 'girl, daughter', 'f'], ['bébé', 'baby', 'm'], ['ami', 'friend', 'm'], ['famille', 'family', 'f'],
  ['père', 'father', 'm'], ['mère', 'mother', 'f'], ['parents', 'parents', 'm'], ['frère', 'brother', 'm'],
  ['sœur', 'sister', 'f'], ['fils', 'son', 'm'], ['mari', 'husband', 'm'], ['gens', 'people', 'm'],
  ['personne', 'person', 'f'], ['monsieur', 'man, Mr', 'm'], ['madame', 'woman, Mrs', 'f'],
  // body
  ['corps', 'body', 'm'], ['tête', 'head', 'f'], ['œil', 'eye', 'm'], ['oreille', 'ear', 'f'], ['nez', 'nose', 'm'],
  ['bouche', 'mouth', 'f'], ['dent', 'tooth', 'f'], ['cou', 'neck', 'm'], ['dos', 'back', 'm'], ['main', 'hand', 'f'],
  ['bras', 'arm', 'm'], ['jambe', 'leg', 'f'], ['pied', 'foot', 'm'], ['queue', 'tail', 'f'], ['cœur', 'heart', 'm'],
  ['poil', 'hair (animal), coat', 'm'], ['cheveux', 'hair', 'm'],
  // animals
  ['animal', 'animal', 'm'], ['chien', 'dog', 'm'], ['chat', 'cat', 'm'], ['cheval', 'horse', 'm'],
  ['oiseau', 'bird', 'm'], ['poisson', 'fish', 'm'], ['lapin', 'rabbit', 'm'], ['vache', 'cow', 'f'],
  ['mouton', 'sheep', 'm'], ['souris', 'mouse', 'f'],
  // home and objects
  ['maison', 'house, home', 'f'], ['appartement', 'flat', 'm'], ['chambre', 'bedroom', 'f'], ['cuisine', 'kitchen, cooking', 'f'],
  ['porte', 'door', 'f'], ['fenêtre', 'window', 'f'], ['table', 'table', 'f'], ['chaise', 'chair', 'f'], ['lit', 'bed', 'm'],
  ['jardin', 'garden', 'm'], ['livre', 'book', 'm'], ['page', 'page', 'f'], ['stylo', 'pen', 'm'], ['photo', 'photo', 'f'],
  ['téléphone', 'phone', 'm'], ['voiture', 'car', 'f'], ['vélo', 'bike', 'm'], ['train', 'train', 'm'], ['bus', 'bus', 'm'],
  ['avion', 'plane', 'm'], ['argent', 'money', 'm'], ['clé', 'key', 'f'], ['sac', 'bag', 'm'], ['jouet', 'toy', 'm'],
  // places
  ['ville', 'town, city', 'f'], ['village', 'village', 'm'], ['pays', 'country', 'm'], ['rue', 'street', 'f'],
  ['route', 'road', 'f'], ['école', 'school', 'f'], ['classe', 'class', 'f'], ['magasin', 'shop', 'm'],
  ['marché', 'market', 'm'], ['parc', 'park', 'm'], ['plage', 'beach', 'f'], ['mer', 'sea', 'f'],
  ['montagne', 'mountain', 'f'], ['campagne', 'countryside', 'f'], ['champ', 'field', 'm'], ['forêt', 'forest', 'f'],
  ['rivière', 'river', 'f'], ['monde', 'world', 'm'], ['travail', 'work, job', 'm'], ['bureau', 'office', 'm'],
  // food
  ['eau', 'water', 'f'], ['pain', 'bread', 'm'], ['lait', 'milk', 'm'], ['viande', 'meat', 'f'], ['fruit', 'fruit', 'm'],
  ['pomme', 'apple', 'f'], ['café', 'coffee', 'm'], ['repas', 'meal', 'm'], ['nourriture', 'food', 'f'],
  // time
  ['jour', 'day', 'm'], ['nuit', 'night', 'f'], ['matin', 'morning', 'm'], ['soir', 'evening', 'm'],
  ['semaine', 'week', 'f'], ['mois', 'month', 'm'], ['an', 'year', 'm'], ['année', 'year', 'f'], ['heure', 'hour', 'f'],
  ['minute', 'minute', 'f'], ['temps', 'time, weather', 'm'], ['fois', 'time (occasion)', 'f'], ['siècle', 'century', 'm'],
  ['été', 'summer', 'm'], ['hiver', 'winter', 'm'], ['printemps', 'spring', 'm'], ['automne', 'autumn', 'm'],
  // things in general
  ['chose', 'thing', 'f'], ['nom', 'name', 'm'], ['mot', 'word', 'm'], ['question', 'question', 'f'],
  ['réponse', 'answer', 'f'], ['langue', 'language, tongue', 'f'], ['couleur', 'colour', 'f'], ['taille', 'size', 'f'],
  ['poids', 'weight', 'm'], ['course', 'race, run', 'f'], ['jeu', 'game', 'm'], ['sport', 'sport', 'm'],
  ['santé', 'health', 'f'], ['problème', 'problem', 'm'], ['exemple', 'example', 'm'], ['partie', 'part', 'f'],
];

const verbs: Array<[string, string]> = [
  ['être', 'to be'], ['avoir', 'to have'], ['aller', 'to go'], ['venir', 'to come'], ['faire', 'to do, make'],
  ['dire', 'to say'], ['parler', 'to speak'], ['voir', 'to see'], ['regarder', 'to look at'], ['écouter', 'to listen'],
  ['entendre', 'to hear'], ['savoir', 'to know (facts)'], ['connaître', 'to know (people, places)'],
  ['comprendre', 'to understand'], ['apprendre', 'to learn'], ['pouvoir', 'can, to be able'], ['vouloir', 'to want'],
  ['devoir', 'must, to have to'], ['aimer', 'to like, love'], ['préférer', 'to prefer'], ['manger', 'to eat'],
  ['boire', 'to drink'], ['dormir', 'to sleep'], ['courir', 'to run'], ['marcher', 'to walk'], ['sauter', 'to jump'],
  ['jouer', 'to play'], ['chasser', 'to hunt, chase'], ['habiter', 'to live (somewhere)'], ['vivre', 'to live'],
  ['travailler', 'to work'], ['donner', 'to give'], ['prendre', 'to take'], ['porter', 'to carry, wear'],
  ['acheter', 'to buy'], ['vendre', 'to sell'], ['trouver', 'to find'], ['chercher', 'to look for'],
  ['mettre', 'to put'], ['ouvrir', 'to open'], ['fermer', 'to close'], ['commencer', 'to begin'], ['finir', 'to finish'],
  ['arriver', 'to arrive'], ['partir', 'to leave'], ['rester', 'to stay'], ['entrer', 'to enter'], ['sortir', 'to go out'],
  ['lire', 'to read'], ['écrire', 'to write'], ['demander', 'to ask'], ['répondre', 'to answer'], ['appeler', 'to call'],
  ['aider', 'to help'], ['attendre', 'to wait'], ['penser', 'to think'], ['croire', 'to believe'], ['sembler', 'to seem'],
  ['devenir', 'to become'], ['naître', 'to be born'], ['mourir', 'to die'], ['grandir', 'to grow up'],
  ['utiliser', 'to use'], ['montrer', 'to show'], ['changer', 'to change'], ['gagner', 'to win, earn'], ['perdre', 'to lose'],
];

const adjectives: Array<[string, string]> = [
  ['bon', 'good'], ['mauvais', 'bad'], ['grand', 'big, tall'], ['petit', 'small'], ['gros', 'fat, big'],
  ['mince', 'thin, slim'], ['long', 'long'], ['court', 'short'], ['haut', 'high'], ['bas', 'low'],
  ['beau', 'beautiful'], ['joli', 'pretty'], ['nouveau', 'new'], ['vieux', 'old'], ['jeune', 'young'],
  ['rapide', 'fast'], ['lent', 'slow'], ['fort', 'strong'], ['faible', 'weak'], ['facile', 'easy'], ['difficile', 'difficult'],
  ['chaud', 'hot, warm'], ['froid', 'cold'], ['doux', 'soft, gentle'], ['calme', 'calm'], ['content', 'happy'],
  ['heureux', 'happy'], ['triste', 'sad'], ['gentil', 'kind'], ['intelligent', 'clever'], ['malade', 'ill'],
  ['même', 'same'], ['autre', 'other'], ['premier', 'first'], ['dernier', 'last'], ['seul', 'alone, only'],
  ['vrai', 'true'], ['important', 'important'], ['populaire', 'popular'], ['célèbre', 'famous'], ['anglais', 'English'],
  ['français', 'French'], ['blanc', 'white'], ['noir', 'black'], ['rouge', 'red'], ['bleu', 'blue'], ['vert', 'green'],
  ['jaune', 'yellow'], ['gris', 'grey'], ['brun', 'brown'],
];

const others: Array<[string, string]> = [
  ['et', 'and'], ['ou', 'or'], ['mais', 'but'], ['parce que', 'because'], ['si', 'if'], ['quand', 'when'],
  ['avec', 'with'], ['sans', 'without'], ['pour', 'for'], ['dans', 'in'], ['sur', 'on'], ['sous', 'under'],
  ['entre', 'between'], ['avant', 'before'], ['après', 'after'], ['pendant', 'during'], ['chez', "at (someone's)"],
  ['très', 'very'], ['trop', 'too (much)'], ['beaucoup', 'a lot'], ['peu', 'little, few'], ['aussi', 'also'],
  ['encore', 'again, still'], ['toujours', 'always, still'], ['jamais', 'never'], ['souvent', 'often'],
  ['parfois', 'sometimes'], ['maintenant', 'now'], ['aujourd’hui', 'today'], ['demain', 'tomorrow'], ['hier', 'yesterday'],
  ['bientôt', 'soon'], ['tard', 'late'], ['tôt', 'early'], ['vite', 'quickly'], ['bien', 'well'], ['mal', 'badly'],
  ['ici', 'here'], ['là', 'there'], ['comment', 'how'], ['pourquoi', 'why'], ['où', 'where'], ['qui', 'who'],
  ['quoi', 'what'], ['tout', 'all, everything'], ['chaque', 'each, every'], ['plusieurs', 'several'], ['oui', 'yes'], ['non', 'no'],
];

export const A1_WORDS: A1Word[] = [
  ...nouns.map(([lemma, en, g]) => ({ lemma, en, g })),
  ...[...verbs, ...adjectives, ...others].map(([lemma, en]) => ({ lemma, en })),
];

const byLanguage: Record<string, readonly A1Word[]> = { fr: A1_WORDS, de: DE_A1_WORDS, ja: JA_A1_WORDS, zh: ZH_A1_WORDS, ko: KO_A1_WORDS, hi: HI_A1_WORDS, he: HE_A1_WORDS, ar: AR_A1_WORDS, cs: CS_A1_WORDS, es: ES_A1_WORDS, pt: PT_A1_WORDS, ru: RU_A1_WORDS, it: IT_A1_WORDS, gd: GD_A1_WORDS };

/** The A1 list for a language; undefined for a language without one yet. */
export function a1WordsFor(lang: string): readonly A1Word[] | undefined {
  return byLanguage[lang];
}

/** Compact list for a prompt: "chien (dog), chat (cat), …". */
export function a1PromptList(words: readonly A1Word[] = A1_WORDS): string {
  return words.map((w) => `${w.lemma} (${w.en})`).join(', ');
}

/**
 * An A1 list as a lesson's top-up vocabulary, compared by normalised lemma.
 * `without` drops the lesson's own words, so the top-up can't add more of
 * what the lesson already places and caps.
 */
export function a1TopUp(list: readonly A1Word[], normalize: (s: string) => string, without: Iterable<string> = []) {
  const skip = new Set([...without].map(normalize));
  const words = list.filter((w) => !skip.has(normalize(w.lemma)));
  return { promptList: a1PromptList(words), lemmas: new Set(words.map((w) => normalize(w.lemma))) };
}
