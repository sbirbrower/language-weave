import type { A1Word } from '../a1';
import type { EasyWord } from '../easy';
import type { Gender } from '../../languages';

// Italian counterparts of the French lists in `easy.ts` and `a1.ts`. Nouns are in the singular,
// adjectives in the masculine singular. Dropped: never, since mai needs non before the verb
// (non mangiano mai), which an English sentence can't hold. A reflexive verb (muoversi, nutrirsi)
// keeps its pronoun just before the verb, inside the woven span.

// Easy words: the same English as the French list, so both find the same places.
const RANK_1: Array<[string, string]> = [
  // people
  ['man|men', 'uomo'], ['woman|women', 'donna'], ['child|children', 'bambino/bambina'], ['boy|boys', 'ragazzo/bambino'],
  ['girl|girls', 'ragazza/bambina'], ['baby|babies', 'bambino/neonato'], ['friend|friends', 'amico/amica'], ['family|families', 'famiglia'],
  ['father|fathers', 'padre'], ['mother|mothers', 'madre'], ['brother|brothers', 'fratello'], ['sister|sisters', 'sorella'],
  ['son|sons', 'figlio'], ['daughter|daughters', 'figlia'], ['husband|husbands', 'marito'], ['wife|wives', 'moglie'],
  ['people', 'gente/persone'], ['person', 'persona'], ['king|kings', 're'], ['queen|queens', 'regina'],
  // animals
  ['animal|animals', 'animale'], ['dog|dogs', 'cane'], ['cat|cats', 'gatto'], ['horse|horses', 'cavallo'],
  ['bird|birds', 'uccello'], ['rabbit|rabbits', 'coniglio'], ['cow|cows', 'mucca'], ['sheep', 'pecora'], ['mouse|mice', 'topo'],
  // body
  ['head|heads', 'testa'], ['eye|eyes', 'occhio'], ['ear|ears', 'orecchio'], ['nose|noses', 'naso'], ['mouth', 'bocca'],
  ['hand|hands', 'mano'], ['foot|feet', 'piede'], ['leg|legs', 'gamba/zampa'], ['heart|hearts', 'cuore'], ['tail|tails', 'coda'],
  ['body|bodies', 'corpo'], ['hair', 'capelli/pelo'],
  // home and things
  ['house|houses', 'casa'], ['home', 'casa'], ['door|doors', 'porta'], ['window|windows', 'finestra'],
  ['table|tables', 'tavolo/tavola'], ['bed|beds', 'letto'], ['garden|gardens', 'giardino'], ['car|cars', 'macchina/auto'],
  ['bicycle|bicycles|bike|bikes', 'bicicletta/bici'], ['train|trains', 'treno'], ['boat|boats', 'barca/nave'], ['plane|planes|aircraft', 'aereo'],
  ['book|books', 'libro'], ['letter|letters', 'lettera'], ['money', 'soldi/denaro'], ['photo|photos|photograph|photographs', 'foto/fotografia'],
  ['film|films|movie|movies', 'film'], ['music', 'musica'], ['song|songs', 'canzone'], ['game|games', 'gioco/partita'],
  ['name|names', 'nome'], ['colour|colours|color|colors', 'colore'], ['school|schools', 'scuola'],
  // places and nature
  ['city|cities', 'città'], ['town|towns', 'città/paese'], ['village|villages', 'paese/villaggio'], ['country|countries', 'paese'],
  ['world', 'mondo'], ['street|streets', 'strada/via'], ['road|roads', 'strada'], ['shop|shops', 'negozio'],
  ['sea|seas', 'mare'], ['river|rivers', 'fiume'], ['mountain|mountains', 'montagna'], ['island|islands', 'isola'],
  ['beach|beaches', 'spiaggia'], ['forest|forests', 'bosco/foresta'], ['tree|trees', 'albero'], ['flower|flowers', 'fiore'],
  ['sun', 'sole'], ['moon', 'luna'], ['star|stars', 'stella'], ['sky', 'cielo'], ['snow', 'neve'], ['rain', 'pioggia'],
  ['water', 'acqua'], ['fire', 'fuoco'],
  // food
  ['food', 'cibo'], ['bread', 'pane'], ['milk', 'latte'], ['meat', 'carne'], ['fruit|fruits', 'frutta/frutto'],
  ['apple|apples', 'mela'], ['coffee', 'caffè'], ['egg|eggs', 'uovo'],
  // time
  ['day|days', 'giorno'], ['night|nights', 'notte'], ['morning|mornings', 'mattina/mattino'], ['evening|evenings', 'sera'],
  ['week|weeks', 'settimana'], ['month|months', 'mese'], ['year|years', 'anno'], ['hour|hours', 'ora'],
  ['summer', 'estate'], ['winter', 'inverno'], ['autumn', 'autunno'], ['century|centuries', 'secolo'],
  // adjectives
  ['big|large', 'grande'], ['small|tiny', 'piccolo'], ['good', 'buono'], ['bad', 'cattivo'], ['new', 'nuovo'],
  ['old', 'vecchio/antico'], ['young', 'giovane'], ['long', 'lungo'], ['short', 'corto/basso'], ['hot|warm', 'caldo'],
  ['cold', 'freddo'], ['happy', 'felice/contento'], ['sad', 'triste'], ['beautiful', 'bello'], ['pretty', 'carino/grazioso'],
  ['fast|quick', 'veloce/rapido'], ['slow', 'lento'], ['easy', 'facile'], ['difficult', 'difficile'], ['strong', 'forte'],
  ['important', 'importante'], ['popular', 'popolare'], ['famous', 'famoso/celebre'],
  // colours
  ['red', 'rosso'], ['blue', 'blu/azzurro'], ['green', 'verde'], ['white', 'bianco'], ['black', 'nero'], ['yellow', 'giallo'],
  ['grey|gray', 'grigio'], ['brown', 'marrone'], ['pink', 'rosa'], ['orange', 'arancione'],
  // general nouns and adjectives, many of them nearly the same in Italian
  ['species', 'specie'], ['group|groups', 'gruppo'], ['part|parts', 'parte'], ['number|numbers', 'numero'],
  ['shape|shapes', 'forma'], ['size|sizes', 'dimensione/grandezza'], ['life', 'vita'], ['death', 'morte'], ['skin|skins', 'pelle'],
  ['fur', 'pelo/pelliccia'], ['human|humans', 'umano/essere umano'], ['adult|adults', 'adulto'], ['health', 'salute'],
  ['disease|diseases', 'malattia'], ['population|populations', 'popolazione'], ['habitat|habitats', 'habitat'],
  ['system|systems', 'sistema'], ['surface|surfaces', 'superficie'], ['structure|structures', 'struttura'],
  ['region|regions', 'regione'], ['zone|zones', 'zona'], ['energy', 'energia'], ['climate', 'clima'],
  ['history', 'storia'], ['science', 'scienza'], ['problem|problems', 'problema'], ['example|examples', 'esempio'],
  ['image|images', 'immagine'], ['type|types', 'tipo'], ['nature', 'natura'], ['culture|cultures', 'cultura'],
  ['protection', 'protezione'], ['production', 'produzione'], ['information', 'informazione/informazioni'],
  ['nation|nations', 'nazione'], ['million|millions', 'milione'], ['minute|minutes', 'minuto'], ['sport|sports', 'sport'],
  ['centre|centres|center|centers', 'centro'], ['planet|planets', 'pianeta'], ['ocean|oceans', 'oceano'],
  ['plant|plants', 'pianta'], ['fish', 'pesce'], ['wild', 'selvatico/selvaggio'], ['natural', 'naturale'], ['central', 'centrale'],
  ['national', 'nazionale'], ['international', 'internazionale'], ['high', 'alto/elevato'], ['low', 'basso'],
  ['rare', 'raro'], ['common', 'comune/frequente'], ['different', 'diverso/differente'], ['possible', 'possibile'],
  ['normal', 'normale'], ['simple', 'semplice'], ['modern', 'moderno'], ['original', 'originale'], ['true', 'vero'],
  ['full', 'pieno'], ['dark', 'scuro/buio'],
];

const RANK_2: Array<[string, string]> = [
  // verbs: the model conjugates them in place
  ['eat|eats|ate|eaten|eating', 'mangiare'], ['drink|drinks|drank|drinking', 'bere'], ['sleep|sleeps|slept|sleeping', 'dormire'],
  ['run|runs|ran|running', 'correre'], ['walk|walks|walked|walking', 'camminare'], ['play|plays|played|playing', 'giocare/suonare'],
  ['live|lives|lived|living', 'vivere/abitare'], ['love|loves|loved|loving', 'amare/voler bene'], ['see|sees|saw|seen|seeing', 'vedere'],
  ['go|goes|went|gone|going', 'andare'], ['come|comes|came|coming', 'venire/arrivare'], ['make|makes|made|making', 'fare'],
  ['give|gives|gave|given|giving', 'dare'], ['take|takes|took|taken|taking', 'prendere/portare'], ['find|finds|found|finding', 'trovare'],
  ['buy|buys|bought|buying', 'comprare'], ['sell|sells|sold|selling', 'vendere'], ['begin|begins|began|begun|beginning|start|starts|started|starting', 'cominciare/iniziare'],
  ['finish|finishes|finished|finishing', 'finire'], ['win|wins|won|winning', 'vincere'], ['lose|loses|lost|losing', 'perdere'],
  ['help|helps|helped|helping', 'aiutare'], ['want|wants|wanted|wanting', 'volere'], ['think|thinks|thought|thinking', 'pensare/credere'],
  ['become|becomes|became|becoming', 'diventare'], ['die|dies|died|dying', 'morire'], ['call|calls|called|calling', 'chiamare'],
  ['work|works|worked|working', 'lavorare/lavoro'], ['travel|travels|travelled|traveled|travelling|traveling', 'viaggiare'],
  ['hunt|hunts|hunted|hunting', 'cacciare/caccia'], ['wait|waits|waited|waiting', 'aspettare'], ['carry|carries|carried|carrying', 'portare'],
  // adverbs
  ['often', 'spesso'], ['always', 'sempre'], ['sometimes', 'a volte/talvolta'], ['today', 'oggi'],
  ['now', 'ora/adesso'], ['here', 'qui/qua'], ['together', 'insieme'], ['quickly', 'velocemente/rapidamente'], ['early', 'presto'], ['late', 'tardi'],
  ['grow|grows|grew|grown|growing', 'crescere'], ['feed|feeds|fed|feeding', 'nutrire/nutrirsi'],
  ['move|moves|moved|moving', 'muovere/muoversi/spostarsi'], ['show|shows|showed|shown|showing', 'mostrare'],
  ['change|changes|changed|changing', 'cambiare/cambiamento'], ['use|uses|used|using', 'usare/utilizzare/uso'],
  // small words: the most common of all, so they come after the nouns and are capped like the rest
  ['is|are|was|were', 'essere'], ['has|had', 'avere'], ['from', 'da/di'], ['for', 'per'], ['without', 'senza'],
  ['between', 'tra/fra'], ['after', 'dopo'], ['before', 'prima di'], ['under', 'sotto'], ['during', 'durante'],
  ['some', 'alcuni/qualche'], ['many', 'molti/tanti'], ['all', 'tutto'], ['each|every', 'ogni'],
  ['several', 'diversi/parecchi'], ['few', 'pochi/poco'], ['this|these', 'questo/questa/questi/queste'], ['they', 'loro'],
  // need agreement and say little on their own
  ['same', 'stesso'], ['other', 'altro'],
];

export const IT_EASY_WORDS: EasyWord[] = [
  ...RANK_1.map(([forms, lemma]) => ({ forms, lemma, rank: 1 as const })),
  ...RANK_2.map(([forms, lemma]) => ({ forms, lemma, rank: 2 as const })),
];

// Everyday A1 vocabulary, grouped by theme: the top-up may only weave these
// (plus the lesson's own words), so the extra words stay at the reader's level.
const nouns: Array<[string, string, Gender]> = [
  // people and family
  ['uomo', 'man', 'm'], ['donna', 'woman', 'f'], ['bambino', 'child, boy', 'm'], ['bambina', 'child, girl', 'f'],
  ['ragazzo', 'boy, young man', 'm'], ['ragazza', 'girl, young woman', 'f'], ['amico', 'friend', 'm'], ['amica', 'friend (female)', 'f'],
  ['famiglia', 'family', 'f'], ['padre', 'father', 'm'], ['madre', 'mother', 'f'], ['fratello', 'brother', 'm'],
  ['sorella', 'sister', 'f'], ['figlio', 'son', 'm'], ['figlia', 'daughter', 'f'], ['marito', 'husband', 'm'], ['moglie', 'wife', 'f'],
  ['persona', 'person', 'f'], ['gente', 'people', 'f'], ['genitori', 'parents', 'm'], ['signore', 'man, Mr', 'm'], ['signora', 'woman, Mrs', 'f'],
  // body
  ['corpo', 'body', 'm'], ['testa', 'head', 'f'], ['occhio', 'eye', 'm'], ['orecchio', 'ear', 'm'], ['naso', 'nose', 'm'],
  ['bocca', 'mouth', 'f'], ['dente', 'tooth', 'm'], ['collo', 'neck', 'm'], ['schiena', 'back', 'f'], ['braccio', 'arm', 'm'],
  ['mano', 'hand', 'f'], ['gamba', 'leg', 'f'], ['piede', 'foot', 'm'], ['coda', 'tail', 'f'], ['cuore', 'heart', 'm'],
  ['pelle', 'skin', 'f'], ['capelli', 'hair', 'm'],
  // animals
  ['animale', 'animal', 'm'], ['cane', 'dog', 'm'], ['gatto', 'cat', 'm'], ['cavallo', 'horse', 'm'],
  ['uccello', 'bird', 'm'], ['pesce', 'fish', 'm'], ['coniglio', 'rabbit', 'm'], ['mucca', 'cow', 'f'],
  ['pecora', 'sheep', 'f'], ['topo', 'mouse', 'm'],
  // home and objects
  ['casa', 'house, home', 'f'], ['appartamento', 'flat', 'm'], ['camera', 'room, bedroom', 'f'], ['cucina', 'kitchen', 'f'],
  ['porta', 'door', 'f'], ['finestra', 'window', 'f'], ['tavolo', 'table', 'm'], ['sedia', 'chair', 'f'], ['letto', 'bed', 'm'],
  ['giardino', 'garden', 'm'], ['libro', 'book', 'm'], ['pagina', 'page', 'f'], ['penna', 'pen', 'f'], ['foto', 'photo', 'f'],
  ['telefono', 'phone', 'm'], ['macchina', 'car', 'f'], ['bicicletta', 'bike', 'f'], ['treno', 'train', 'm'], ['autobus', 'bus', 'm'],
  ['aereo', 'plane', 'm'], ['soldi', 'money', 'm'], ['chiave', 'key', 'f'], ['borsa', 'bag', 'f'], ['giocattolo', 'toy', 'm'],
  // places
  ['città', 'town, city', 'f'], ['paese', 'village, country', 'm'], ['strada', 'street, road', 'f'], ['via', 'street', 'f'],
  ['scuola', 'school', 'f'], ['classe', 'class, classroom', 'f'], ['negozio', 'shop', 'm'],
  ['mercato', 'market', 'm'], ['parco', 'park', 'm'], ['spiaggia', 'beach', 'f'], ['mare', 'sea', 'm'],
  ['montagna', 'mountain', 'f'], ['campagna', 'countryside', 'f'], ['bosco', 'wood, forest', 'm'], ['fiume', 'river', 'm'],
  ['mondo', 'world', 'm'], ['lavoro', 'work, job', 'm'], ['ufficio', 'office', 'm'],
  // food
  ['acqua', 'water', 'f'], ['pane', 'bread', 'm'], ['latte', 'milk', 'm'], ['carne', 'meat', 'f'], ['frutta', 'fruit', 'f'],
  ['mela', 'apple', 'f'], ['caffè', 'coffee', 'm'], ['cibo', 'food', 'm'], ['pranzo', 'lunch', 'm'], ['cena', 'dinner', 'f'], ['uovo', 'egg', 'm'],
  // time
  ['giorno', 'day', 'm'], ['notte', 'night', 'f'], ['mattina', 'morning', 'f'], ['pomeriggio', 'afternoon', 'm'], ['sera', 'evening', 'f'],
  ['settimana', 'week', 'f'], ['mese', 'month', 'm'], ['anno', 'year', 'm'], ['ora', 'hour', 'f'],
  ['minuto', 'minute', 'm'], ['tempo', 'time, weather', 'm'], ['secolo', 'century', 'm'],
  ['estate', 'summer', 'f'], ['inverno', 'winter', 'm'], ['primavera', 'spring', 'f'], ['autunno', 'autumn', 'm'],
  // things in general
  ['cosa', 'thing', 'f'], ['nome', 'name', 'm'], ['parola', 'word', 'f'], ['domanda', 'question', 'f'],
  ['risposta', 'answer', 'f'], ['lingua', 'language, tongue', 'f'], ['colore', 'colour', 'm'], ['grandezza', 'size', 'f'],
  ['peso', 'weight', 'm'], ['gioco', 'game', 'm'], ['sport', 'sport', 'm'], ['salute', 'health', 'f'],
  ['problema', 'problem', 'm'], ['esempio', 'example', 'm'], ['parte', 'part', 'f'],
];

const verbs: Array<[string, string]> = [
  ['essere', 'to be'], ['avere', 'to have'], ['stare', 'to stay, to be (how)'], ['andare', 'to go'], ['venire', 'to come'],
  ['arrivare', 'to arrive'], ['fare', 'to do, make'], ['dire', 'to say'], ['parlare', 'to speak'], ['vedere', 'to see'],
  ['sentire', 'to hear, feel'], ['ascoltare', 'to listen'], ['sapere', 'to know (facts)'], ['conoscere', 'to know (people, places)'],
  ['capire', 'to understand'], ['potere', 'can, to be able'], ['volere', 'to want'], ['dovere', 'must, to have to'],
  ['amare', 'to love'], ['mangiare', 'to eat'], ['bere', 'to drink'], ['dormire', 'to sleep'], ['correre', 'to run'],
  ['saltare', 'to jump'], ['giocare', 'to play'], ['cacciare', 'to hunt'], ['vivere', 'to live'], ['abitare', 'to live (somewhere)'],
  ['lavorare', 'to work'], ['dare', 'to give'], ['prendere', 'to take'], ['portare', 'to carry, bring, wear'], ['comprare', 'to buy'],
  ['vendere', 'to sell'], ['trovare', 'to find'], ['cercare', 'to look for'], ['mettere', 'to put'], ['aprire', 'to open'],
  ['chiudere', 'to close'], ['cominciare', 'to begin'], ['finire', 'to finish, end'], ['volare', 'to fly'], ['nuotare', 'to swim'],
  ['viaggiare', 'to travel'], ['restare', 'to stay'], ['leggere', 'to read'], ['scrivere', 'to write'], ['rispondere', 'to answer'],
  ['chiamare', 'to call'], ['aiutare', 'to help'], ['aspettare', 'to wait'], ['sperare', 'to hope'], ['pensare', 'to think'],
  ['credere', 'to believe'], ['morire', 'to die'], ['crescere', 'to grow'], ['usare', 'to use'], ['mostrare', 'to show'],
  ['cambiare', 'to change'], ['vincere', 'to win'], ['perdere', 'to lose'], ['piacere', 'to please (mi piace: I like)'],
];

const adjectives: Array<[string, string]> = [
  ['buono', 'good'], ['cattivo', 'bad'], ['grande', 'big'], ['piccolo', 'small'], ['grasso', 'fat'],
  ['magro', 'thin'], ['lungo', 'long'], ['corto', 'short'], ['alto', 'high, tall'], ['basso', 'low, short'],
  ['bello', 'beautiful'], ['carino', 'pretty, nice'], ['nuovo', 'new'], ['vecchio', 'old'], ['giovane', 'young'],
  ['veloce', 'fast'], ['lento', 'slow'], ['forte', 'strong'], ['debole', 'weak'], ['facile', 'easy'],
  ['difficile', 'difficult'], ['pesante', 'heavy'], ['leggero', 'light'], ['caldo', 'hot'], ['freddo', 'cold'], ['morbido', 'soft'],
  ['tranquillo', 'calm, quiet'], ['felice', 'happy'], ['triste', 'sad'], ['simpatico', 'nice, likeable'], ['bravo', 'good, clever'],
  ['malato', 'ill'], ['stesso', 'same'], ['altro', 'other'], ['primo', 'first'], ['ultimo', 'last'],
  ['vero', 'true'], ['importante', 'important'], ['preferito', 'favourite'], ['famoso', 'famous'], ['inglese', 'English'],
  ['italiano', 'Italian'], ['bianco', 'white'], ['nero', 'black'], ['rosso', 'red'], ['blu', 'blue'], ['verde', 'green'],
  ['giallo', 'yellow'], ['grigio', 'grey'], ['marrone', 'brown'],
];

const others: Array<[string, string]> = [
  ['e', 'and'], ['o', 'or'], ['ma', 'but'], ['perché', 'because, why'], ['quando', 'when'], ['se', 'if, whether'], ['che', 'that'],
  ['con', 'with'], ['senza', 'without'], ['per', 'for'], ['in', 'in'], ['su', 'on'], ['sotto', 'under'],
  ['tra', 'between'], ['davanti a', 'in front of'], ['prima di', 'before'], ['dopo', 'after'], ['durante', 'during'], ['vicino a', 'near'],
  ['molto', 'very, a lot'], ['troppo', 'too much'], ['poco', 'little, few'], ['anche', 'also'],
  ['ancora', 'again, still'], ['sempre', 'always'], ['mai', 'never, ever'], ['spesso', 'often'],
  ['a volte', 'sometimes'], ['ora', 'now'], ['oggi', 'today'], ['domani', 'tomorrow'], ['ieri', 'yesterday'],
  ['presto', 'soon, early'], ['tardi', 'late'], ['qui', 'here'], ['lì', 'there'],
  ['come', 'how'], ['dove', 'where'], ['chi', 'who'], ['che cosa', 'what'],
  ['tutti', 'all, everyone'], ['ogni', 'each, every'], ['alcuni', 'some'], ['sì', 'yes'], ['no', 'no'], ['non', 'not'],
];

export const IT_A1_WORDS: A1Word[] = [
  ...nouns.map(([lemma, en, g]) => ({ lemma, en, g })),
  ...[...verbs, ...adjectives, ...others].map(([lemma, en]) => ({ lemma, en })),
];
