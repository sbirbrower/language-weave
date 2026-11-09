import type { A1Word } from '../a1';
import type { EasyWord } from '../easy';
import type { Gender } from '../../languages';

// Scottish Gaelic counterparts of the French lists in `easy.ts` and `a1.ts`. Nouns are in the
// nominative singular without the article, adjectives in the masculine, verbs as the verbal noun,
// the only form the weave uses (`grammarNotes`: a finite verb must stand first in its clause).
// Left out: is/are/was/were and has/had (bi is a finite verb, and having is said with aig), they
// (iad stands after its verb), and never (a-riamh needs a negated verb).

// Easy words: the same English as the French list, so both find the same places.
const RANK_1: Array<[string, string]> = [
  // people
  ['man|men', 'duine/fear'], ['woman|women', 'boireannach/tè'], ['child|children', 'pàiste/leanabh/clann'], ['boy|boys', 'balach'],
  ['girl|girls', 'caileag/nighean'], ['baby|babies', 'leanabh/pàisde'], ['friend|friends', 'caraid'], ['family|families', 'teaghlach'],
  ['father|fathers', 'athair'], ['mother|mothers', 'màthair'], ['brother|brothers', 'bràthair'], ['sister|sisters', 'piuthar'],
  ['son|sons', 'mac'], ['daughter|daughters', 'nighean'], ['husband|husbands', 'duine/cèile'], ['wife|wives', 'bean/cèile'],
  ['people', 'daoine/sluagh'], ['person', 'neach/duine'], ['king|kings', 'rìgh'], ['queen|queens', 'banrigh'],
  // animals
  ['animal|animals', 'beathach/ainmhidh'], ['dog|dogs', 'cù'], ['cat|cats', 'cat'], ['horse|horses', 'each'],
  ['bird|birds', 'eun'], ['rabbit|rabbits', 'coineanach'], ['cow|cows', 'bò'], ['sheep', 'caora'], ['mouse|mice', 'luch'],
  // body
  ['head|heads', 'ceann'], ['eye|eyes', 'sùil'], ['ear|ears', 'cluas'], ['nose|noses', 'sròn'], ['mouth', 'beul'],
  ['hand|hands', 'làmh'], ['foot|feet', 'cas'], ['leg|legs', 'cas'], ['heart|hearts', 'cridhe'], ['tail|tails', 'earball'],
  ['body|bodies', 'bodhaig/corp'], ['hair', 'falt/fionnadh'],
  // home and things
  ['house|houses', 'taigh'], ['home', 'dachaigh/taigh'], ['door|doors', 'doras'], ['window|windows', 'uinneag'],
  ['table|tables', 'bòrd'], ['bed|beds', 'leabaidh'], ['garden|gardens', 'gàrradh'], ['car|cars', 'càr'],
  ['bicycle|bicycles|bike|bikes', 'baidhsagal'], ['train|trains', 'trèana'], ['boat|boats', 'bàta'], ['plane|planes|aircraft', 'plèana/itealan'],
  ['book|books', 'leabhar'], ['letter|letters', 'litir'], ['money', 'airgead'], ['photo|photos|photograph|photographs', 'dealbh'],
  ['film|films|movie|movies', 'film'], ['music', 'ceòl'], ['song|songs', 'òran'], ['game|games', 'geama/gèam'],
  ['name|names', 'ainm'], ['colour|colours|color|colors', 'dath'], ['school|schools', 'sgoil'],
  // places and nature
  ['city|cities', 'baile mòr/cathair'], ['town|towns', 'baile'], ['village|villages', 'baile/clachan'], ['country|countries', 'dùthaich/tìr'],
  ['world', 'saoghal'], ['street|streets', 'sràid'], ['road|roads', 'rathad'], ['shop|shops', 'bùth'],
  ['sea|seas', 'muir/fairge'], ['river|rivers', 'abhainn'], ['mountain|mountains', 'beinn'], ['island|islands', 'eilean'],
  ['beach|beaches', 'tràigh'], ['forest|forests', 'coille'], ['tree|trees', 'craobh'], ['flower|flowers', 'flùr/dìthean'],
  ['sun', 'grian'], ['moon', 'gealach'], ['star|stars', 'rionnag/reul'], ['sky', 'adhar/speur'], ['snow', 'sneachda'], ['rain', 'uisge'],
  ['water', 'uisge'], ['fire', 'teine'],
  // food
  ['food', 'biadh'], ['bread', 'aran'], ['milk', 'bainne'], ['meat', 'feòil'], ['fruit|fruits', 'measan'],
  ['apple|apples', 'ubhal'], ['coffee', 'cofaidh'], ['egg|eggs', 'ugh'],
  // time
  ['day|days', 'latha'], ['night|nights', 'oidhche'], ['morning|mornings', 'madainn'], ['evening|evenings', 'feasgar'],
  ['week|weeks', 'seachdain'], ['month|months', 'mìos'], ['year|years', 'bliadhna'], ['hour|hours', 'uair'],
  ['summer', 'samhradh'], ['winter', 'geamhradh'], ['autumn', 'foghar'], ['century|centuries', 'linn'],
  // adjectives: they follow the noun, so the model weaves the noun with them
  ['big|large', 'mòr'], ['small|tiny', 'beag'], ['good', 'math'], ['bad', 'dona/droch'], ['new', 'ùr'],
  ['old', 'sean/aosta'], ['young', 'òg'], ['long', 'fada'], ['short', 'goirid'], ['hot|warm', 'teth/blàth'],
  ['cold', 'fuar'], ['happy', 'toilichte'], ['sad', 'brònach'], ['beautiful', 'brèagha/àlainn'], ['pretty', 'bòidheach/snog'],
  ['fast|quick', 'luath'], ['slow', 'slaodach'], ['easy', 'furasta'], ['difficult', 'doirbh'], ['strong', 'làidir'],
  ['important', 'cudromach'], ['popular', 'measail/mòr-chòrdte'], ['famous', 'ainmeil/cliùiteach'],
  // colours
  ['red', 'dearg'], ['blue', 'gorm'], ['green', 'uaine/gorm'], ['white', 'geal/bàn'], ['black', 'dubh'], ['yellow', 'buidhe'],
  ['grey|gray', 'glas'], ['brown', 'donn'], ['pink', 'pinc'], ['orange', 'orains'],
  // general nouns and adjectives
  ['species', 'gnè/seòrsa'], ['group|groups', 'buidheann'], ['part|parts', 'pàirt/earrann'], ['number|numbers', 'àireamh'],
  ['shape|shapes', 'cumadh'], ['size|sizes', 'meud'], ['life', 'beatha'], ['death', 'bàs'], ['skin|skins', 'craiceann'],
  ['fur', 'fionnadh'], ['human|humans', 'duine/mac-an-duine'], ['adult|adults', 'inbheach'], ['health', 'slàinte'],
  ['disease|diseases', 'galar/tinneas'], ['population|populations', 'sluagh/àireamh-sluaigh'], ['habitat|habitats', 'àrainn'],
  ['system|systems', 'siostam'], ['surface|surfaces', 'uachdar'], ['structure|structures', 'structar/cruth'],
  ['region|regions', 'roinn/sgìre'], ['zone|zones', 'raon/sòn'], ['energy', 'lùth/cumhachd'], ['climate', 'gnàth-shìde'],
  ['history', 'eachdraidh'], ['science', 'saidheans'], ['problem|problems', 'duilgheadas'], ['example|examples', 'eisimpleir'],
  ['image|images', 'dealbh/ìomhaigh'], ['type|types', 'seòrsa'], ['nature', 'nàdar'], ['culture|cultures', 'cultar'],
  ['protection', 'dìon'], ['production', 'toradh/dèanamh'], ['information', 'fiosrachadh'],
  ['nation|nations', 'nàisean'], ['million|millions', 'millean'], ['minute|minutes', 'mionaid'], ['sport|sports', 'spòrs'],
  ['centre|centres|center|centers', 'meadhan/ionad'], ['planet|planets', 'planaid'], ['ocean|oceans', 'cuan'],
  ['plant|plants', 'lus/luibh'], ['fish', 'iasg'], ['wild', 'fiadhaich'], ['natural', 'nàdarra'], ['central', 'meadhanach'],
  ['national', 'nàiseanta'], ['international', 'eadar-nàiseanta'], ['high', 'àrd'], ['low', 'ìosal'],
  ['rare', 'tearc/ainneamh'], ['common', 'cumanta'], ['different', 'eadar-dhealaichte/diofraichte'], ['possible', 'comasach'],
  ['normal', 'àbhaisteach'], ['simple', 'sìmplidh'], ['modern', 'ùr-nodha'], ['original', 'tùsail'], ['true', 'fìor'],
  ['full', 'làn'], ['dark', 'dorcha'],
];

const RANK_2: Array<[string, string]> = [
  // verbs, as verbal nouns: woven only for an -ing after a form of be, or a verb used as a noun
  ['eat|eats|ate|eaten|eating', 'ithe'], ['drink|drinks|drank|drinking', 'òl'], ['sleep|sleeps|slept|sleeping', 'cadal'],
  ['run|runs|ran|running', 'ruith'], ['walk|walks|walked|walking', 'coiseachd'], ['play|plays|played|playing', 'cluich'],
  ['live|lives|lived|living', 'fuireach/beò'], ['love|loves|loved|loving', 'gràdh/gràdhachadh'], ['see|sees|saw|seen|seeing', 'faicinn'],
  ['go|goes|went|gone|going', 'dol'], ['come|comes|came|coming', 'tighinn'], ['make|makes|made|making', 'dèanamh'],
  ['give|gives|gave|given|giving', 'toirt'], ['take|takes|took|taken|taking', 'toirt/gabhail'], ['find|finds|found|finding', 'lorg'],
  ['buy|buys|bought|buying', 'ceannach'], ['sell|sells|sold|selling', 'reic'], ['begin|begins|began|begun|beginning|start|starts|started|starting', 'tòiseachadh'],
  ['finish|finishes|finished|finishing', 'crìochnachadh'], ['win|wins|won|winning', 'buannachadh'], ['lose|loses|lost|losing', 'call'],
  ['help|helps|helped|helping', 'cuideachadh'], ['want|wants|wanted|wanting', 'iarraidh'], ['think|thinks|thought|thinking', 'smaoineachadh'],
  ['become|becomes|became|becoming', 'fàs'], ['die|dies|died|dying', 'bàsachadh'], ['call|calls|called|calling', 'gairm'],
  ['work|works|worked|working', 'obair'], ['travel|travels|travelled|traveled|travelling|traveling', 'siubhal'],
  ['hunt|hunts|hunted|hunting', 'sealg'], ['wait|waits|waited|waiting', 'feitheamh'], ['carry|carries|carried|carrying', 'giùlan'],
  // adverbs
  ['often', 'gu tric'], ['always', 'an-còmhnaidh/daonnan'], ['sometimes', 'uaireannan'], ['today', 'an-diugh'],
  ['now', 'a-nis/an-dràsta'], ['here', 'an seo'], ['together', 'còmhla'], ['quickly', 'gu luath'], ['early', 'tràth'], ['late', 'anmoch/fadalach'],
  ['grow|grows|grew|grown|growing', 'fàs'], ['feed|feeds|fed|feeding', 'biathadh/beathachadh'],
  ['move|moves|moved|moving', 'gluasad'], ['show|shows|showed|shown|showing', 'sealltainn'],
  ['change|changes|changed|changing', 'atharrachadh'], ['use|uses|used|using', 'cleachdadh'],
  // small words: the most common of all, so they come after the nouns and are capped like the rest;
  // a preposition is woven with its noun, since it decides the case and lenites
  ['from', 'à/bho'], ['for', 'airson'], ['without', 'gun'],
  ['between', 'eadar'], ['after', 'an dèidh'], ['before', 'ro/mus'], ['under', 'fo'], ['during', 'rè'],
  ['some', 'cuid/beagan'], ['many', 'mòran/iomadh'], ['all', 'uile/a h-uile'], ['each|every', 'gach'],
  ['several', 'grunn'], ['few', 'beagan'], ['this|these', 'seo'],
  // follow their noun and say little on their own
  ['same', 'aon/ceudna'], ['other', 'eile'],
];

export const GD_EASY_WORDS: EasyWord[] = [
  ...RANK_1.map(([forms, lemma]) => ({ forms, lemma, rank: 1 as const })),
  ...RANK_2.map(([forms, lemma]) => ({ forms, lemma, rank: 2 as const })),
];

// Everyday A1 vocabulary, grouped by theme: the top-up may only weave these
// (plus the lesson's own words), so the extra words stay at the reader's level.
const nouns: Array<[string, string, Gender]> = [
  // people and family
  ['duine', 'man, person, husband', 'm'], ['fear', 'man', 'm'], ['boireannach', 'woman', 'm'], ['bean', 'wife, woman', 'f'],
  ['pàiste', 'child', 'm'], ['clann', 'children', 'f'], ['balach', 'boy', 'm'], ['caileag', 'girl', 'f'], ['nighean', 'girl, daughter', 'f'],
  ['leanabh', 'baby, child', 'm'], ['caraid', 'friend', 'm'], ['teaghlach', 'family', 'm'], ['athair', 'father', 'm'],
  ['màthair', 'mother', 'f'], ['bràthair', 'brother', 'm'], ['piuthar', 'sister', 'f'], ['mac', 'son', 'm'],
  ['seanair', 'grandfather', 'm'], ['seanmhair', 'grandmother', 'f'], ['pàrant', 'parent', 'm'], ['tidsear', 'teacher', 'm'],
  // body
  ['bodhaig', 'body', 'f'], ['ceann', 'head', 'm'], ['sùil', 'eye', 'f'], ['cluas', 'ear', 'f'], ['sròn', 'nose', 'f'],
  ['beul', 'mouth', 'm'], ['fiacail', 'tooth', 'f'], ['amhach', 'neck', 'f'], ['druim', 'back', 'm'], ['làmh', 'hand', 'f'],
  ['gàirdean', 'arm', 'm'], ['cas', 'leg, foot', 'f'], ['earball', 'tail', 'm'], ['cridhe', 'heart', 'm'], ['falt', 'hair', 'm'],
  ['fionnadh', 'fur', 'm'],
  // animals
  ['beathach', 'animal', 'm'], ['cù', 'dog', 'm'], ['cat', 'cat', 'm'], ['each', 'horse', 'm'],
  ['eun', 'bird', 'm'], ['iasg', 'fish', 'm'], ['coineanach', 'rabbit', 'm'], ['bò', 'cow', 'f'],
  ['caora', 'sheep', 'f'], ['luch', 'mouse', 'f'], ['fiadh', 'deer', 'm'], ['ròn', 'seal', 'm'],
  // home and objects
  ['taigh', 'house', 'm'], ['flat', 'flat', 'm'], ['seòmar', 'room', 'm'], ['cidsin', 'kitchen', 'm'],
  ['doras', 'door', 'm'], ['uinneag', 'window', 'f'], ['bòrd', 'table', 'm'], ['sèithear', 'chair', 'm'], ['leabaidh', 'bed', 'f'],
  ['gàrradh', 'garden', 'm'], ['leabhar', 'book', 'm'], ['duilleag', 'page, leaf', 'f'], ['peann', 'pen', 'm'], ['dealbh', 'picture, photo', 'm'],
  ['fòn', 'phone', 'm'], ['càr', 'car', 'm'], ['baidhsagal', 'bike', 'm'], ['trèana', 'train', 'f'], ['bus', 'bus', 'm'],
  ['bàta', 'boat', 'm'], ['airgead', 'money', 'm'], ['iuchair', 'key', 'f'], ['baga', 'bag', 'm'], ['cupa', 'cup', 'm'],
  // places
  ['baile', 'town, village', 'm'], ['dùthaich', 'country', 'f'], ['sràid', 'street', 'f'], ['rathad', 'road', 'm'],
  ['slighe', 'way, route', 'f'], ['sgoil', 'school', 'f'], ['clas', 'class', 'm'], ['bùth', 'shop', 'f'],
  ['margadh', 'market', 'm'], ['pàirc', 'park, field', 'f'], ['tràigh', 'beach', 'f'], ['muir', 'sea', 'f'],
  ['beinn', 'mountain', 'f'], ['achadh', 'field', 'm'], ['coille', 'forest', 'f'], ['abhainn', 'river', 'f'],
  ['loch', 'loch, lake', 'm'], ['eilean', 'island', 'm'], ['saoghal', 'world', 'm'], ['obair', 'work, job', 'f'], ['oifis', 'office', 'f'],
  // food
  ['uisge', 'water, rain', 'm'], ['aran', 'bread', 'm'], ['bainne', 'milk', 'm'], ['feòil', 'meat', 'f'], ['measan', 'fruit', 'm'],
  ['ubhal', 'apple', 'm'], ['cofaidh', 'coffee', 'm'], ['tì', 'tea', 'f'], ['biadh', 'food', 'm'], ['ugh', 'egg', 'm'],
  ['càise', 'cheese', 'm'], ['brot', 'soup', 'm'],
  // time
  ['latha', 'day', 'm'], ['oidhche', 'night', 'f'], ['madainn', 'morning', 'f'], ['feasgar', 'afternoon, evening', 'm'],
  ['seachdain', 'week', 'f'], ['mìos', 'month', 'm'], ['bliadhna', 'year', 'f'], ['uair', 'hour, time', 'f'],
  ['mionaid', 'minute', 'f'], ['tìde', 'time', 'f'], ['linn', 'century, age', 'f'],
  ['samhradh', 'summer', 'm'], ['geamhradh', 'winter', 'm'], ['earrach', 'spring', 'm'], ['foghar', 'autumn', 'm'], ['sìde', 'weather', 'f'],
  // things in general
  ['rud', 'thing', 'm'], ['ainm', 'name', 'm'], ['facal', 'word', 'm'], ['ceist', 'question', 'f'],
  ['freagairt', 'answer', 'f'], ['cànan', 'language', 'm'], ['dath', 'colour', 'm'], ['meud', 'size', 'm'],
  ['cuideam', 'weight', 'm'], ['geama', 'game', 'm'], ['spòrs', 'sport', 'm'], ['slàinte', 'health', 'f'],
  ['duilgheadas', 'problem', 'm'], ['eisimpleir', 'example', 'm'], ['pàirt', 'part', 'f'],
];

const verbs: Array<[string, string]> = [
  ['dol', 'to go'], ['tighinn', 'to come'], ['dèanamh', 'to do, make'], ['ràdh', 'to say'],
  ['bruidhinn', 'to speak'], ['faicinn', 'to see'], ['cluinntinn', 'to hear'], ['èisteachd', 'to listen'],
  ['aithneachadh', 'to know, recognise'], ['tuigsinn', 'to understand'], ['iarraidh', 'to want, ask for'],
  ['ithe', 'to eat'], ['òl', 'to drink'], ['cadal', 'to sleep'], ['ruith', 'to run'], ['leum', 'to jump'],
  ['cluich', 'to play'], ['sealg', 'to hunt'], ['fuireach', 'to live (somewhere), stay'],
  ['toirt', 'to give, take'], ['gabhail', 'to take'], ['giùlan', 'to carry'], ['ceannach', 'to buy'], ['reic', 'to sell'],
  ['lorg', 'to find, look for'], ['cur', 'to put'], ['fosgladh', 'to open'], ['dùnadh', 'to close'],
  ['tòiseachadh', 'to begin'], ['crìochnachadh', 'to finish'], ['itealaich', 'to fly'], ['snàmh', 'to swim'],
  ['siubhal', 'to travel'], ['leughadh', 'to read'], ['sgrìobhadh', 'to write'],
  ['fònadh', 'to phone'], ['cuideachadh', 'to help'], ['feitheamh', 'to wait'], ['smaoineachadh', 'to think'],
  ['creidsinn', 'to believe'], ['bàsachadh', 'to die'], ['fàs', 'to grow, become'], ['cleachdadh', 'to use'],
  ['sealltainn', 'to show'], ['atharrachadh', 'to change'], ['buannachadh', 'to win'], ['call', 'to lose'],
  ['coiseachd', 'to walk'], ['ionnsachadh', 'to learn'],
];

const adjectives: Array<[string, string]> = [
  ['math', 'good'], ['dona', 'bad'], ['mòr', 'big'], ['beag', 'small'], ['reamhar', 'fat'],
  ['tana', 'thin'], ['fada', 'long'], ['goirid', 'short'], ['àrd', 'high, tall'], ['ìosal', 'low'],
  ['brèagha', 'beautiful, lovely'], ['bòidheach', 'pretty'], ['ùr', 'new'], ['sean', 'old'], ['òg', 'young'],
  ['luath', 'fast'], ['slaodach', 'slow'], ['làidir', 'strong'], ['lag', 'weak'], ['furasta', 'easy'],
  ['doirbh', 'difficult'], ['trom', 'heavy'], ['aotrom', 'light'], ['teth', 'hot'], ['blàth', 'warm'], ['fuar', 'cold'],
  ['bog', 'soft'], ['sàmhach', 'quiet'], ['toilichte', 'happy'], ['brònach', 'sad'], ['laghach', 'nice, kind'], ['glic', 'wise, clever'],
  ['tinn', 'ill'], ['sgìth', 'tired'], ['eile', 'other'], ['ceudna', 'same'], ['mu dheireadh', 'last'],
  ['fìor', 'true'], ['cudromach', 'important'], ['measail', 'popular, fond'], ['ainmeil', 'famous'], ['Gàidhealach', 'Highland, Gaelic'],
  ['Albannach', 'Scottish'], ['Sasannach', 'English'], ['geal', 'white'], ['dubh', 'black'], ['dearg', 'red'], ['gorm', 'blue'],
  ['uaine', 'green'], ['buidhe', 'yellow'], ['glas', 'grey'], ['donn', 'brown'],
];

const others: Array<[string, string]> = [
  ['agus', 'and'], ['no', 'or'], ['ach', 'but'], ['oir', 'because, for'], ['nuair a', 'when'], ['ma', 'if'],
  ['le', 'with, by'], ['gun', 'without'], ['airson', 'for'], ['ann an', 'in'], ['air', 'on'], ['fo', 'under'],
  ['eadar', 'between'], ['ro', 'before'], ['an dèidh', 'after'], ['rè', 'during'], ['aig', 'at'],
  ['glè', 'very'], ['mòran', 'a lot, many'], ['beagan', 'a little, a few'], ['cuideachd', 'also'],
  ['a-rithist', 'again'], ['fhathast', 'still, yet'], ['an-còmhnaidh', 'always'], ['gu tric', 'often'],
  ['uaireannan', 'sometimes'], ['a-nis', 'now'], ['an-diugh', 'today'], ['a-màireach', 'tomorrow'], ['an-dè', 'yesterday'],
  ['a dh’aithghearr', 'soon'], ['anmoch', 'late'], ['an seo', 'here'], ['an sin', 'there'],
  ['ciamar', 'how'], ['carson', 'why'], ['càite', 'where'], ['cò', 'who'], ['dè', 'what'],
  ['a h-uile', 'all, every'], ['gach', 'each, every'], ['grunn', 'several'],
];

export const GD_A1_WORDS: A1Word[] = [
  ...nouns.map(([lemma, en, g]) => ({ lemma, en, g })),
  ...[...verbs, ...adjectives, ...others].map(([lemma, en]) => ({ lemma, en })),
];
