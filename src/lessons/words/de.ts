import type { A1Word } from '../a1';
import type { EasyWord } from '../easy';
import type { Gender } from '../../languages';

// German counterparts of the French lists in `easy.ts` and `a1.ts`. Nouns are
// capitalised, adjectives have no ending; separable verbs are left out, since
// their prefix can't stay in an English sentence.

// Easy words: the same English as the French list, so both find the same places.
const RANK_1: Array<[string, string]> = [
  // people
  ['man|men', 'Mann'], ['woman|women', 'Frau'], ['child|children', 'Kind'], ['boy|boys', 'Junge'],
  ['girl|girls', 'Mädchen'], ['baby|babies', 'Baby'], ['friend|friends', 'Freund/Freundin'], ['family|families', 'Familie'],
  ['father|fathers', 'Vater'], ['mother|mothers', 'Mutter'], ['brother|brothers', 'Bruder'], ['sister|sisters', 'Schwester'],
  ['son|sons', 'Sohn'], ['daughter|daughters', 'Tochter'], ['husband|husbands', 'Mann/Ehemann'], ['wife|wives', 'Frau/Ehefrau'],
  ['people', 'Leute/Mensch'], ['person', 'Person/Mensch'], ['king|kings', 'König'], ['queen|queens', 'Königin'],
  // animals
  ['animal|animals', 'Tier'], ['dog|dogs', 'Hund'], ['cat|cats', 'Katze'], ['horse|horses', 'Pferd'],
  ['bird|birds', 'Vogel'], ['rabbit|rabbits', 'Kaninchen/Hase'], ['cow|cows', 'Kuh'], ['sheep', 'Schaf'], ['mouse|mice', 'Maus'],
  // body
  ['head|heads', 'Kopf'], ['eye|eyes', 'Auge'], ['ear|ears', 'Ohr'], ['nose|noses', 'Nase'], ['mouth', 'Mund/Maul'],
  ['hand|hands', 'Hand'], ['foot|feet', 'Fuß'], ['leg|legs', 'Bein'], ['heart|hearts', 'Herz'], ['tail|tails', 'Schwanz'],
  ['body|bodies', 'Körper'], ['hair', 'Haar/Fell'],
  // home and things
  ['house|houses', 'Haus'], ['home', 'Haus/Zuhause'], ['door|doors', 'Tür'], ['window|windows', 'Fenster'],
  ['table|tables', 'Tisch'], ['bed|beds', 'Bett'], ['garden|gardens', 'Garten'], ['car|cars', 'Auto'],
  ['bicycle|bicycles|bike|bikes', 'Fahrrad/Rad'], ['train|trains', 'Zug'], ['boat|boats', 'Boot/Schiff'], ['plane|planes|aircraft', 'Flugzeug'],
  ['book|books', 'Buch'], ['letter|letters', 'Brief/Buchstabe'], ['money', 'Geld'], ['photo|photos|photograph|photographs', 'Foto'],
  ['film|films|movie|movies', 'Film'], ['music', 'Musik'], ['song|songs', 'Lied'], ['game|games', 'Spiel'],
  ['name|names', 'Name'], ['colour|colours|color|colors', 'Farbe'], ['school|schools', 'Schule'],
  // places and nature
  ['city|cities', 'Stadt'], ['town|towns', 'Stadt'], ['village|villages', 'Dorf'], ['country|countries', 'Land'],
  ['world', 'Welt'], ['street|streets', 'Straße'], ['road|roads', 'Straße/Weg'], ['shop|shops', 'Geschäft/Laden'],
  ['sea|seas', 'Meer/See'], ['river|rivers', 'Fluss'], ['mountain|mountains', 'Berg'], ['island|islands', 'Insel'],
  ['beach|beaches', 'Strand'], ['forest|forests', 'Wald'], ['tree|trees', 'Baum'], ['flower|flowers', 'Blume'],
  ['sun', 'Sonne'], ['moon', 'Mond'], ['star|stars', 'Stern'], ['sky', 'Himmel'], ['snow', 'Schnee'], ['rain', 'Regen'],
  ['water', 'Wasser'], ['fire', 'Feuer'],
  // food
  ['food', 'Essen/Nahrung'], ['bread', 'Brot'], ['milk', 'Milch'], ['meat', 'Fleisch'], ['fruit|fruits', 'Obst/Frucht'],
  ['apple|apples', 'Apfel'], ['coffee', 'Kaffee'], ['egg|eggs', 'Ei'],
  // time
  ['day|days', 'Tag'], ['night|nights', 'Nacht'], ['morning|mornings', 'Morgen'], ['evening|evenings', 'Abend'],
  ['week|weeks', 'Woche'], ['month|months', 'Monat'], ['year|years', 'Jahr'], ['hour|hours', 'Stunde'],
  ['summer', 'Sommer'], ['winter', 'Winter'], ['autumn', 'Herbst'], ['century|centuries', 'Jahrhundert'],
  // adjectives
  ['big|large', 'groß'], ['small|tiny', 'klein'], ['good', 'gut'], ['bad', 'schlecht'], ['new', 'neu'],
  ['old', 'alt'], ['young', 'jung'], ['long', 'lang'], ['short', 'kurz'], ['hot|warm', 'heiß/warm'],
  ['cold', 'kalt'], ['happy', 'glücklich/froh'], ['sad', 'traurig'], ['beautiful', 'schön'], ['pretty', 'hübsch/schön'],
  ['fast|quick', 'schnell'], ['slow', 'langsam'], ['easy', 'leicht/einfach'], ['difficult', 'schwer/schwierig'], ['strong', 'stark'],
  ['important', 'wichtig'], ['popular', 'beliebt/populär'], ['famous', 'berühmt'],
  // colours
  ['red', 'rot'], ['blue', 'blau'], ['green', 'grün'], ['white', 'weiß'], ['black', 'schwarz'], ['yellow', 'gelb'],
  ['grey|gray', 'grau'], ['brown', 'braun'], ['pink', 'rosa'], ['orange', 'orange'],
  // general nouns and adjectives, many of them nearly the same in German
  ['species', 'Art'], ['group|groups', 'Gruppe'], ['part|parts', 'Teil'], ['number|numbers', 'Zahl/Anzahl'],
  ['shape|shapes', 'Form'], ['size|sizes', 'Größe'], ['life', 'Leben'], ['death', 'Tod'], ['skin|skins', 'Haut'],
  ['fur', 'Fell'], ['human|humans', 'Mensch'], ['adult|adults', 'Erwachsene/Erwachsener'], ['health', 'Gesundheit'],
  ['disease|diseases', 'Krankheit'], ['population|populations', 'Bevölkerung/Population'], ['habitat|habitats', 'Lebensraum'],
  ['system|systems', 'System'], ['surface|surfaces', 'Oberfläche'], ['structure|structures', 'Struktur'],
  ['region|regions', 'Region/Gebiet'], ['zone|zones', 'Zone'], ['energy', 'Energie'], ['climate', 'Klima'],
  ['history', 'Geschichte'], ['science', 'Wissenschaft'], ['problem|problems', 'Problem'], ['example|examples', 'Beispiel'],
  ['image|images', 'Bild'], ['type|types', 'Art/Typ'], ['nature', 'Natur'], ['culture|cultures', 'Kultur'],
  ['protection', 'Schutz'], ['production', 'Produktion'], ['information', 'Information'],
  ['nation|nations', 'Nation'], ['million|millions', 'Million'], ['minute|minutes', 'Minute'], ['sport|sports', 'Sport'],
  ['centre|centres|center|centers', 'Zentrum'], ['planet|planets', 'Planet'], ['ocean|oceans', 'Ozean/Meer'],
  ['plant|plants', 'Pflanze'], ['fish', 'Fisch'], ['wild', 'wild'], ['natural', 'natürlich'], ['central', 'zentral'],
  ['national', 'national'], ['international', 'international'], ['high', 'hoch'], ['low', 'niedrig/tief'],
  ['rare', 'selten'], ['common', 'häufig/üblich'], ['different', 'anders/verschieden'], ['possible', 'möglich'],
  ['normal', 'normal'], ['simple', 'einfach'], ['modern', 'modern'], ['original', 'original/ursprünglich'], ['true', 'wahr'],
  ['full', 'voll'], ['dark', 'dunkel'],
];

const RANK_2: Array<[string, string]> = [
  // verbs: the model conjugates them in place
  ['eat|eats|ate|eaten|eating', 'essen/fressen'], ['drink|drinks|drank|drinking', 'trinken'], ['sleep|sleeps|slept|sleeping', 'schlafen'],
  ['run|runs|ran|running', 'laufen/rennen'], ['walk|walks|walked|walking', 'gehen/laufen'], ['play|plays|played|playing', 'spielen'],
  ['live|lives|lived|living', 'leben/wohnen'], ['love|loves|loved|loving', 'lieben'], ['see|sees|saw|seen|seeing', 'sehen'],
  ['go|goes|went|gone|going', 'gehen/fahren'], ['come|comes|came|coming', 'kommen'], ['make|makes|made|making', 'machen'],
  ['give|gives|gave|given|giving', 'geben'], ['take|takes|took|taken|taking', 'nehmen'], ['find|finds|found|finding', 'finden'],
  ['buy|buys|bought|buying', 'kaufen'], ['sell|sells|sold|selling', 'verkaufen'], ['begin|begins|began|begun|beginning|start|starts|started|starting', 'beginnen'],
  ['finish|finishes|finished|finishing', 'beenden'], ['win|wins|won|winning', 'gewinnen'], ['lose|loses|lost|losing', 'verlieren'],
  ['help|helps|helped|helping', 'helfen'], ['want|wants|wanted|wanting', 'wollen'], ['think|thinks|thought|thinking', 'denken'],
  ['become|becomes|became|becoming', 'werden'], ['die|dies|died|dying', 'sterben'], ['call|calls|called|calling', 'nennen/rufen'],
  ['work|works|worked|working', 'arbeiten/Arbeit'], ['travel|travels|travelled|traveled|travelling|traveling', 'reisen'],
  ['hunt|hunts|hunted|hunting', 'jagen/Jagd'], ['wait|waits|waited|waiting', 'warten'], ['carry|carries|carried|carrying', 'tragen'],
  // adverbs
  ['often', 'oft'], ['always', 'immer'], ['never', 'nie'], ['sometimes', 'manchmal'], ['today', 'heute'],
  ['now', 'jetzt'], ['here', 'hier'], ['together', 'zusammen'], ['quickly', 'schnell'], ['early', 'früh'], ['late', 'spät'],
  ['grow|grows|grew|grown|growing', 'wachsen'], ['feed|feeds|fed|feeding', 'füttern/fressen'],
  ['move|moves|moved|moving', 'bewegen/ziehen'], ['show|shows|showed|shown|showing', 'zeigen'],
  ['change|changes|changed|changing', 'ändern/verändern/Änderung'], ['use|uses|used|using', 'benutzen/nutzen/verwenden'],
  // small words: the most common of all, so they come after the nouns and are capped like the rest
  ['is|are|was|were', 'sein'], ['has|had', 'haben'], ['from', 'von/aus'], ['for', 'für'], ['without', 'ohne'],
  ['between', 'zwischen'], ['after', 'nach'], ['before', 'vor'], ['under', 'unter'], ['during', 'während'],
  ['some', 'einige/manche'], ['many', 'viele/viel'], ['all', 'alle/all'], ['each|every', 'jeder'],
  ['several', 'mehrere'], ['few', 'wenige'], ['this|these', 'dieser'], ['they', 'sie'],
  // need endings and say little on their own
  ['same', 'gleich'], ['other', 'andere'],
];

export const DE_EASY_WORDS: EasyWord[] = [
  ...RANK_1.map(([forms, lemma]) => ({ forms, lemma, rank: 1 as const })),
  ...RANK_2.map(([forms, lemma]) => ({ forms, lemma, rank: 2 as const })),
];

// Everyday A1 vocabulary, grouped by theme: the top-up may only weave these
// (plus the lesson's own words), so the extra words stay at the reader's level.
const nouns: Array<[string, string, Gender]> = [
  // people and family
  ['Mann', 'man, husband', 'm'], ['Frau', 'woman, wife, Mrs', 'f'], ['Kind', 'child', 'n'], ['Junge', 'boy', 'm'],
  ['Mädchen', 'girl', 'n'], ['Baby', 'baby', 'n'], ['Freund', 'friend', 'm'], ['Freundin', 'friend (female)', 'f'],
  ['Familie', 'family', 'f'], ['Vater', 'father', 'm'], ['Mutter', 'mother', 'f'], ['Bruder', 'brother', 'm'],
  ['Schwester', 'sister', 'f'], ['Sohn', 'son', 'm'], ['Tochter', 'daughter', 'f'], ['Mensch', 'person, human', 'm'],
  ['Person', 'person', 'f'], ['Herr', 'man, Mr', 'm'],
  // body
  ['Körper', 'body', 'm'], ['Kopf', 'head', 'm'], ['Auge', 'eye', 'n'], ['Ohr', 'ear', 'n'], ['Nase', 'nose', 'f'],
  ['Mund', 'mouth', 'm'], ['Zahn', 'tooth', 'm'], ['Hals', 'neck, throat', 'm'], ['Rücken', 'back', 'm'], ['Hand', 'hand', 'f'],
  ['Arm', 'arm', 'm'], ['Bein', 'leg', 'n'], ['Fuß', 'foot', 'm'], ['Schwanz', 'tail', 'm'], ['Herz', 'heart', 'n'],
  ['Fell', 'fur, coat', 'n'], ['Haar', 'hair', 'n'],
  // animals
  ['Tier', 'animal', 'n'], ['Hund', 'dog', 'm'], ['Katze', 'cat', 'f'], ['Pferd', 'horse', 'n'],
  ['Vogel', 'bird', 'm'], ['Fisch', 'fish', 'm'], ['Kaninchen', 'rabbit', 'n'], ['Kuh', 'cow', 'f'],
  ['Schaf', 'sheep', 'n'], ['Maus', 'mouse', 'f'],
  // home and objects
  ['Haus', 'house', 'n'], ['Wohnung', 'flat', 'f'], ['Zimmer', 'room', 'n'], ['Küche', 'kitchen, cooking', 'f'],
  ['Tür', 'door', 'f'], ['Fenster', 'window', 'n'], ['Tisch', 'table', 'm'], ['Stuhl', 'chair', 'm'], ['Bett', 'bed', 'n'],
  ['Garten', 'garden', 'm'], ['Buch', 'book', 'n'], ['Seite', 'page, side', 'f'], ['Stift', 'pen', 'm'], ['Foto', 'photo', 'n'],
  ['Telefon', 'phone', 'n'], ['Auto', 'car', 'n'], ['Fahrrad', 'bike', 'n'], ['Zug', 'train', 'm'], ['Bus', 'bus', 'm'],
  ['Flugzeug', 'plane', 'n'], ['Geld', 'money', 'n'], ['Schlüssel', 'key', 'm'], ['Tasche', 'bag', 'f'], ['Spielzeug', 'toy', 'n'],
  // places
  ['Stadt', 'town, city', 'f'], ['Dorf', 'village', 'n'], ['Land', 'country, countryside', 'n'], ['Straße', 'street', 'f'],
  ['Weg', 'way, path', 'm'], ['Schule', 'school', 'f'], ['Klasse', 'class', 'f'], ['Geschäft', 'shop, business', 'n'],
  ['Markt', 'market', 'm'], ['Park', 'park', 'm'], ['Strand', 'beach', 'm'], ['Meer', 'sea', 'n'],
  ['Berg', 'mountain', 'm'], ['Feld', 'field', 'n'], ['Wald', 'forest', 'm'], ['Fluss', 'river', 'm'],
  ['Welt', 'world', 'f'], ['Arbeit', 'work, job', 'f'], ['Büro', 'office', 'n'],
  // food
  ['Wasser', 'water', 'n'], ['Brot', 'bread', 'n'], ['Milch', 'milk', 'f'], ['Fleisch', 'meat', 'n'], ['Obst', 'fruit', 'n'],
  ['Apfel', 'apple', 'm'], ['Kaffee', 'coffee', 'm'], ['Essen', 'food, meal', 'n'], ['Ei', 'egg', 'n'],
  // time
  ['Tag', 'day', 'm'], ['Nacht', 'night', 'f'], ['Morgen', 'morning', 'm'], ['Abend', 'evening', 'm'],
  ['Woche', 'week', 'f'], ['Monat', 'month', 'm'], ['Jahr', 'year', 'n'], ['Stunde', 'hour', 'f'],
  ['Minute', 'minute', 'f'], ['Zeit', 'time', 'f'], ['Mal', 'time (occasion)', 'n'], ['Jahrhundert', 'century', 'n'],
  ['Sommer', 'summer', 'm'], ['Winter', 'winter', 'm'], ['Frühling', 'spring', 'm'], ['Herbst', 'autumn', 'm'], ['Wetter', 'weather', 'n'],
  // things in general
  ['Ding', 'thing', 'n'], ['Sache', 'thing, matter', 'f'], ['Name', 'name', 'm'], ['Wort', 'word', 'n'], ['Frage', 'question', 'f'],
  ['Antwort', 'answer', 'f'], ['Sprache', 'language', 'f'], ['Farbe', 'colour', 'f'], ['Größe', 'size', 'f'],
  ['Gewicht', 'weight', 'n'], ['Spiel', 'game', 'n'], ['Sport', 'sport', 'm'], ['Gesundheit', 'health', 'f'],
  ['Problem', 'problem', 'n'], ['Beispiel', 'example', 'n'], ['Teil', 'part', 'm'],
];

const verbs: Array<[string, string]> = [
  ['sein', 'to be'], ['haben', 'to have'], ['gehen', 'to go, walk'], ['kommen', 'to come'], ['machen', 'to do, make'],
  ['sagen', 'to say'], ['sprechen', 'to speak'], ['sehen', 'to see'], ['schauen', 'to look'], ['hören', 'to hear, listen'],
  ['wissen', 'to know (facts)'], ['kennen', 'to know (people, places)'], ['verstehen', 'to understand'],
  ['lernen', 'to learn'], ['können', 'can, to be able'], ['wollen', 'to want'], ['müssen', 'must, to have to'],
  ['mögen', 'to like'], ['lieben', 'to love'], ['essen', 'to eat'], ['fressen', 'to eat (animals)'], ['trinken', 'to drink'],
  ['schlafen', 'to sleep'], ['laufen', 'to run, walk'], ['springen', 'to jump'], ['spielen', 'to play'], ['jagen', 'to hunt, chase'],
  ['wohnen', 'to live (somewhere)'], ['leben', 'to live'], ['arbeiten', 'to work'], ['geben', 'to give'], ['nehmen', 'to take'],
  ['tragen', 'to carry, wear'], ['kaufen', 'to buy'], ['verkaufen', 'to sell'], ['finden', 'to find'], ['suchen', 'to look for'],
  ['legen', 'to put, lay'], ['öffnen', 'to open'], ['schließen', 'to close'], ['beginnen', 'to begin'], ['beenden', 'to finish'],
  ['fahren', 'to go, drive'], ['fliegen', 'to fly'], ['schwimmen', 'to swim'], ['reisen', 'to travel'], ['bleiben', 'to stay'],
  ['lesen', 'to read'], ['schreiben', 'to write'], ['fragen', 'to ask'], ['antworten', 'to answer'], ['rufen', 'to call'],
  ['helfen', 'to help'], ['warten', 'to wait'], ['denken', 'to think'], ['glauben', 'to believe'], ['scheinen', 'to seem, shine'],
  ['werden', 'to become'], ['sterben', 'to die'], ['wachsen', 'to grow'], ['benutzen', 'to use'], ['zeigen', 'to show'],
  ['ändern', 'to change'], ['gewinnen', 'to win'], ['verlieren', 'to lose'],
];

const adjectives: Array<[string, string]> = [
  ['gut', 'good'], ['schlecht', 'bad'], ['groß', 'big, tall'], ['klein', 'small'], ['dick', 'fat, thick'],
  ['dünn', 'thin'], ['lang', 'long'], ['kurz', 'short'], ['hoch', 'high'], ['niedrig', 'low'],
  ['schön', 'beautiful'], ['hübsch', 'pretty'], ['neu', 'new'], ['alt', 'old'], ['jung', 'young'],
  ['schnell', 'fast'], ['langsam', 'slow'], ['stark', 'strong'], ['schwach', 'weak'], ['leicht', 'easy, light'],
  ['schwer', 'difficult, heavy'], ['heiß', 'hot'], ['warm', 'warm'], ['kalt', 'cold'], ['weich', 'soft'], ['ruhig', 'calm, quiet'],
  ['froh', 'glad'], ['glücklich', 'happy'], ['traurig', 'sad'], ['nett', 'kind, nice'], ['klug', 'clever'], ['krank', 'ill'],
  ['gleich', 'same'], ['andere', 'other'], ['erste', 'first'], ['letzte', 'last'], ['allein', 'alone'],
  ['wahr', 'true'], ['wichtig', 'important'], ['beliebt', 'popular'], ['berühmt', 'famous'], ['englisch', 'English'],
  ['deutsch', 'German'], ['weiß', 'white'], ['schwarz', 'black'], ['rot', 'red'], ['blau', 'blue'], ['grün', 'green'],
  ['gelb', 'yellow'], ['grau', 'grey'], ['braun', 'brown'],
];

const others: Array<[string, string]> = [
  ['und', 'and'], ['oder', 'or'], ['aber', 'but'], ['weil', 'because'], ['wenn', 'if, when'], ['dass', 'that'],
  ['mit', 'with'], ['ohne', 'without'], ['für', 'for'], ['in', 'in'], ['auf', 'on'], ['unter', 'under'],
  ['zwischen', 'between'], ['vor', 'before, in front of'], ['nach', 'after, to'], ['während', 'during'], ['bei', "at (someone's), near"],
  ['sehr', 'very'], ['zu', 'too, to'], ['viel', 'a lot, much'], ['wenig', 'little, few'], ['auch', 'also'],
  ['wieder', 'again'], ['noch', 'still'], ['immer', 'always'], ['nie', 'never'], ['oft', 'often'],
  ['manchmal', 'sometimes'], ['jetzt', 'now'], ['heute', 'today'], ['morgen', 'tomorrow'], ['gestern', 'yesterday'],
  ['bald', 'soon'], ['spät', 'late'], ['früh', 'early'], ['hier', 'here'], ['dort', 'there'],
  ['wie', 'how'], ['warum', 'why'], ['wo', 'where'], ['wer', 'who'], ['was', 'what'],
  ['alle', 'all, everyone'], ['jeder', 'each, every'], ['mehrere', 'several'], ['ja', 'yes'], ['nein', 'no'],
];

export const DE_A1_WORDS: A1Word[] = [
  ...nouns.map(([lemma, en, g]) => ({ lemma, en, g })),
  ...[...verbs, ...adjectives, ...others].map(([lemma, en]) => ({ lemma, en })),
];
