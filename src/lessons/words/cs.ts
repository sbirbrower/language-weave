import type { A1Word } from '../a1';
import type { EasyWord } from '../easy';
import type { Gender } from '../../languages';

// Czech counterparts of the French lists in `easy.ts` and `a1.ts`. Nouns are in the
// nominative singular, adjectives in the masculine; verbs that need se or si are left
// out, since the small word must stand second in a Czech clause, and so is "never"
// (nikdy), which needs a negated verb.

// Easy words: the same English as the French list, so both find the same places.
const RANK_1: Array<[string, string]> = [
  // people
  ['man|men', 'muž'], ['woman|women', 'žena'], ['child|children', 'dítě'], ['boy|boys', 'chlapec/kluk'],
  ['girl|girls', 'dívka/holka'], ['baby|babies', 'miminko/dítě'], ['friend|friends', 'přítel/kamarád/kamarádka'], ['family|families', 'rodina'],
  ['father|fathers', 'otec/táta'], ['mother|mothers', 'matka/máma'], ['brother|brothers', 'bratr'], ['sister|sisters', 'sestra'],
  ['son|sons', 'syn'], ['daughter|daughters', 'dcera'], ['husband|husbands', 'manžel'], ['wife|wives', 'manželka'],
  ['people', 'lidé/člověk'], ['person', 'osoba/člověk'], ['king|kings', 'král'], ['queen|queens', 'královna'],
  // animals
  ['animal|animals', 'zvíře'], ['dog|dogs', 'pes'], ['cat|cats', 'kočka'], ['horse|horses', 'kůň'],
  ['bird|birds', 'pták'], ['rabbit|rabbits', 'králík/zajíc'], ['cow|cows', 'kráva'], ['sheep', 'ovce'], ['mouse|mice', 'myš'],
  // body
  ['head|heads', 'hlava'], ['eye|eyes', 'oko'], ['ear|ears', 'ucho'], ['nose|noses', 'nos'], ['mouth', 'ústa/pusa/tlama'],
  ['hand|hands', 'ruka'], ['foot|feet', 'noha'], ['leg|legs', 'noha'], ['heart|hearts', 'srdce'], ['tail|tails', 'ocas'],
  ['body|bodies', 'tělo'], ['hair', 'vlasy/srst'],
  // home and things
  ['house|houses', 'dům'], ['home', 'domov/dům'], ['door|doors', 'dveře'], ['window|windows', 'okno'],
  ['table|tables', 'stůl'], ['bed|beds', 'postel'], ['garden|gardens', 'zahrada'], ['car|cars', 'auto'],
  ['bicycle|bicycles|bike|bikes', 'kolo'], ['train|trains', 'vlak'], ['boat|boats', 'loď/člun'], ['plane|planes|aircraft', 'letadlo'],
  ['book|books', 'kniha'], ['letter|letters', 'dopis/písmeno'], ['money', 'peníze'], ['photo|photos|photograph|photographs', 'fotka/fotografie'],
  ['film|films|movie|movies', 'film'], ['music', 'hudba'], ['song|songs', 'píseň'], ['game|games', 'hra'],
  ['name|names', 'jméno/název'], ['colour|colours|color|colors', 'barva'], ['school|schools', 'škola'],
  // places and nature
  ['city|cities', 'město'], ['town|towns', 'město'], ['village|villages', 'vesnice'], ['country|countries', 'země'],
  ['world', 'svět'], ['street|streets', 'ulice'], ['road|roads', 'silnice/cesta'], ['shop|shops', 'obchod'],
  ['sea|seas', 'moře'], ['river|rivers', 'řeka'], ['mountain|mountains', 'hora'], ['island|islands', 'ostrov'],
  ['beach|beaches', 'pláž'], ['forest|forests', 'les'], ['tree|trees', 'strom'], ['flower|flowers', 'květina'],
  ['sun', 'slunce'], ['moon', 'měsíc'], ['star|stars', 'hvězda'], ['sky', 'nebe/obloha'], ['snow', 'sníh'], ['rain', 'déšť'],
  ['water', 'voda'], ['fire', 'oheň'],
  // food
  ['food', 'jídlo/potrava'], ['bread', 'chléb/chleba'], ['milk', 'mléko'], ['meat', 'maso'], ['fruit|fruits', 'ovoce'],
  ['apple|apples', 'jablko'], ['coffee', 'káva'], ['egg|eggs', 'vejce'],
  // time
  ['day|days', 'den'], ['night|nights', 'noc'], ['morning|mornings', 'ráno'], ['evening|evenings', 'večer'],
  ['week|weeks', 'týden'], ['month|months', 'měsíc'], ['year|years', 'rok'], ['hour|hours', 'hodina'],
  ['summer', 'léto'], ['winter', 'zima'], ['autumn', 'podzim'], ['century|centuries', 'století'],
  // adjectives
  ['big|large', 'velký'], ['small|tiny', 'malý'], ['good', 'dobrý'], ['bad', 'špatný'], ['new', 'nový'],
  ['old', 'starý'], ['young', 'mladý'], ['long', 'dlouhý'], ['short', 'krátký'], ['hot|warm', 'horký/teplý'],
  ['cold', 'studený/chladný'], ['happy', 'šťastný'], ['sad', 'smutný'], ['beautiful', 'krásný'], ['pretty', 'hezký'],
  ['fast|quick', 'rychlý'], ['slow', 'pomalý'], ['easy', 'snadný/lehký'], ['difficult', 'těžký/obtížný'], ['strong', 'silný'],
  ['important', 'důležitý'], ['popular', 'oblíbený/populární'], ['famous', 'slavný/známý'],
  // colours
  ['red', 'červený'], ['blue', 'modrý'], ['green', 'zelený'], ['white', 'bílý'], ['black', 'černý'], ['yellow', 'žlutý'],
  ['grey|gray', 'šedý'], ['brown', 'hnědý'], ['pink', 'růžový'], ['orange', 'oranžový'],
  // general nouns and adjectives, many of them nearly the same in Czech
  ['species', 'druh'], ['group|groups', 'skupina'], ['part|parts', 'část'], ['number|numbers', 'číslo/počet'],
  ['shape|shapes', 'tvar'], ['size|sizes', 'velikost'], ['life', 'život'], ['death', 'smrt'], ['skin|skins', 'kůže'],
  ['fur', 'srst'], ['human|humans', 'člověk'], ['adult|adults', 'dospělý'], ['health', 'zdraví'],
  ['disease|diseases', 'nemoc'], ['population|populations', 'obyvatelstvo/populace'], ['habitat|habitats', 'prostředí/stanoviště'],
  ['system|systems', 'systém'], ['surface|surfaces', 'povrch'], ['structure|structures', 'struktura'],
  ['region|regions', 'oblast/region'], ['zone|zones', 'zóna/pásmo'], ['energy', 'energie'], ['climate', 'klima/podnebí'],
  ['history', 'historie/dějiny'], ['science', 'věda'], ['problem|problems', 'problém'], ['example|examples', 'příklad'],
  ['image|images', 'obraz/obrázek'], ['type|types', 'typ/druh'], ['nature', 'příroda'], ['culture|cultures', 'kultura'],
  ['protection', 'ochrana'], ['production', 'výroba/produkce'], ['information', 'informace'],
  ['nation|nations', 'národ'], ['million|millions', 'milion'], ['minute|minutes', 'minuta'], ['sport|sports', 'sport'],
  ['centre|centres|center|centers', 'centrum/střed'], ['planet|planets', 'planeta'], ['ocean|oceans', 'oceán'],
  ['plant|plants', 'rostlina'], ['fish', 'ryba'], ['wild', 'divoký'], ['natural', 'přírodní'], ['central', 'centrální/ústřední'],
  ['national', 'národní'], ['international', 'mezinárodní'], ['high', 'vysoký'], ['low', 'nízký'],
  ['rare', 'vzácný'], ['common', 'běžný/častý'], ['different', 'jiný/různý'], ['possible', 'možný'],
  ['normal', 'normální'], ['simple', 'jednoduchý'], ['modern', 'moderní'], ['original', 'původní/originální'], ['true', 'pravdivý/skutečný'],
  ['full', 'plný'], ['dark', 'tmavý'],
];

const RANK_2: Array<[string, string]> = [
  // verbs: the model conjugates them in place, and picks the aspect
  ['eat|eats|ate|eaten|eating', 'jíst/žrát'], ['drink|drinks|drank|drinking', 'pít'], ['sleep|sleeps|slept|sleeping', 'spát'],
  ['run|runs|ran|running', 'běžet/běhat'], ['walk|walks|walked|walking', 'chodit/jít'], ['play|plays|played|playing', 'hrát'],
  ['live|lives|lived|living', 'žít/bydlet'], ['love|loves|loved|loving', 'milovat'], ['see|sees|saw|seen|seeing', 'vidět'],
  ['go|goes|went|gone|going', 'jít/jet'], ['come|comes|came|coming', 'přijít/přijet'], ['make|makes|made|making', 'dělat/udělat/vyrobit'],
  ['give|gives|gave|given|giving', 'dát/dávat'], ['take|takes|took|taken|taking', 'vzít/brát'], ['find|finds|found|finding', 'najít/nacházet'],
  ['buy|buys|bought|buying', 'koupit/kupovat'], ['sell|sells|sold|selling', 'prodat/prodávat'], ['begin|begins|began|begun|beginning|start|starts|started|starting', 'začít/začínat'],
  ['finish|finishes|finished|finishing', 'dokončit/skončit'], ['win|wins|won|winning', 'vyhrát/vyhrávat'], ['lose|loses|lost|losing', 'prohrát/ztratit'],
  ['help|helps|helped|helping', 'pomoct/pomáhat'], ['want|wants|wanted|wanting', 'chtít'], ['think|thinks|thought|thinking', 'myslet'],
  ['die|dies|died|dying', 'zemřít/umřít/umírat'], ['call|calls|called|calling', 'nazývat/volat'],
  ['work|works|worked|working', 'pracovat/práce'], ['travel|travels|travelled|traveled|travelling|traveling', 'cestovat'],
  ['hunt|hunts|hunted|hunting', 'lovit/lov'], ['wait|waits|waited|waiting', 'čekat'], ['carry|carries|carried|carrying', 'nést/nosit'],
  // adverbs
  ['often', 'často'], ['always', 'vždy/vždycky'], ['sometimes', 'někdy/občas'], ['today', 'dnes'],
  ['now', 'teď/nyní'], ['here', 'tady/zde'], ['together', 'spolu/společně'], ['quickly', 'rychle'], ['early', 'brzy'], ['late', 'pozdě'],
  ['grow|grows|grew|grown|growing', 'růst'], ['feed|feeds|fed|feeding', 'krmit/žrát'],
  ['show|shows|showed|shown|showing', 'ukázat/ukazovat'],
  ['change|changes|changed|changing', 'měnit/změnit/změna'], ['use|uses|used|using', 'používat/použít/využívat'],
  // small words: the most common of all, so they come after the nouns and are capped like the rest
  ['is|are|was|were', 'být'], ['has|had', 'mít'], ['from', 'z/od'], ['for', 'pro'], ['without', 'bez'],
  ['between', 'mezi'], ['after', 'po'], ['before', 'před'], ['under', 'pod'], ['during', 'během'],
  ['some', 'některý/několik'], ['many', 'mnoho/hodně/mnohý'], ['all', 'všechen/všichni/všechno'], ['each|every', 'každý'],
  ['several', 'několik'], ['few', 'málo'], ['this|these', 'tento/ten'], ['they', 'oni/ony'],
  // need endings and say little on their own
  ['same', 'stejný'], ['other', 'jiný/další'],
];

export const CS_EASY_WORDS: EasyWord[] = [
  ...RANK_1.map(([forms, lemma]) => ({ forms, lemma, rank: 1 as const })),
  ...RANK_2.map(([forms, lemma]) => ({ forms, lemma, rank: 2 as const })),
];

// Everyday A1 vocabulary, grouped by theme: the top-up may only weave these
// (plus the lesson's own words), so the extra words stay at the reader's level.
const nouns: Array<[string, string, Gender]> = [
  // people and family
  ['muž', 'man, husband', 'm'], ['žena', 'woman, wife', 'f'], ['dítě', 'child', 'n'], ['chlapec', 'boy', 'm'],
  ['dívka', 'girl', 'f'], ['miminko', 'baby', 'n'], ['kamarád', 'friend', 'm'], ['kamarádka', 'friend (female)', 'f'],
  ['rodina', 'family', 'f'], ['otec', 'father', 'm'], ['matka', 'mother', 'f'], ['bratr', 'brother', 'm'],
  ['sestra', 'sister', 'f'], ['syn', 'son', 'm'], ['dcera', 'daughter', 'f'], ['člověk', 'person, human', 'm'],
  ['rodiče', 'parents', 'm'], ['pán', 'man, Mr', 'm'], ['paní', 'woman, Mrs', 'f'],
  // body
  ['tělo', 'body', 'n'], ['hlava', 'head', 'f'], ['oko', 'eye', 'n'], ['ucho', 'ear', 'n'], ['nos', 'nose', 'm'],
  ['ústa', 'mouth', 'n'], ['zub', 'tooth', 'm'], ['krk', 'neck', 'm'], ['záda', 'back', 'n'], ['ruka', 'hand, arm', 'f'],
  ['noha', 'leg, foot', 'f'], ['ocas', 'tail', 'm'], ['srdce', 'heart', 'n'], ['srst', 'fur, coat', 'f'], ['vlasy', 'hair', 'm'],
  // animals
  ['zvíře', 'animal', 'n'], ['pes', 'dog', 'm'], ['kočka', 'cat', 'f'], ['kůň', 'horse', 'm'],
  ['pták', 'bird', 'm'], ['ryba', 'fish', 'f'], ['králík', 'rabbit', 'm'], ['kráva', 'cow', 'f'],
  ['ovce', 'sheep', 'f'], ['myš', 'mouse', 'f'],
  // home and objects
  ['dům', 'house', 'm'], ['byt', 'flat', 'm'], ['pokoj', 'room', 'm'], ['kuchyně', 'kitchen', 'f'],
  ['dveře', 'door', 'f'], ['okno', 'window', 'n'], ['stůl', 'table', 'm'], ['židle', 'chair', 'f'], ['postel', 'bed', 'f'],
  ['zahrada', 'garden', 'f'], ['kniha', 'book', 'f'], ['strana', 'page, side', 'f'], ['pero', 'pen', 'n'], ['fotka', 'photo', 'f'],
  ['telefon', 'phone', 'm'], ['auto', 'car', 'n'], ['kolo', 'bike, wheel', 'n'], ['vlak', 'train', 'm'], ['autobus', 'bus', 'm'],
  ['letadlo', 'plane', 'n'], ['peníze', 'money', 'm'], ['klíč', 'key', 'm'], ['taška', 'bag', 'f'], ['hračka', 'toy', 'f'],
  // places
  ['město', 'town, city', 'n'], ['vesnice', 'village', 'f'], ['země', 'country, land', 'f'], ['ulice', 'street', 'f'],
  ['cesta', 'way, path, journey', 'f'], ['škola', 'school', 'f'], ['třída', 'class, classroom', 'f'], ['obchod', 'shop, trade', 'm'],
  ['trh', 'market', 'm'], ['park', 'park', 'm'], ['pláž', 'beach', 'f'], ['moře', 'sea', 'n'],
  ['hora', 'mountain', 'f'], ['pole', 'field', 'n'], ['les', 'forest', 'm'], ['řeka', 'river', 'f'],
  ['svět', 'world', 'm'], ['práce', 'work, job', 'f'], ['kancelář', 'office', 'f'],
  // food
  ['voda', 'water', 'f'], ['chléb', 'bread', 'm'], ['mléko', 'milk', 'n'], ['maso', 'meat', 'n'], ['ovoce', 'fruit', 'n'],
  ['jablko', 'apple', 'n'], ['káva', 'coffee', 'f'], ['jídlo', 'food, meal', 'n'], ['vejce', 'egg', 'n'],
  // time
  ['den', 'day', 'm'], ['noc', 'night', 'f'], ['ráno', 'morning', 'n'], ['večer', 'evening', 'm'],
  ['týden', 'week', 'm'], ['měsíc', 'month, moon', 'm'], ['rok', 'year', 'm'], ['hodina', 'hour, lesson', 'f'],
  ['minuta', 'minute', 'f'], ['čas', 'time', 'm'], ['století', 'century', 'n'],
  ['léto', 'summer', 'n'], ['zima', 'winter', 'f'], ['jaro', 'spring', 'n'], ['podzim', 'autumn', 'm'], ['počasí', 'weather', 'n'],
  // things in general
  ['věc', 'thing', 'f'], ['jméno', 'name', 'n'], ['slovo', 'word', 'n'], ['otázka', 'question', 'f'],
  ['odpověď', 'answer', 'f'], ['jazyk', 'language, tongue', 'm'], ['barva', 'colour', 'f'], ['velikost', 'size', 'f'],
  ['váha', 'weight', 'f'], ['hra', 'game', 'f'], ['sport', 'sport', 'm'], ['zdraví', 'health', 'n'],
  ['problém', 'problem', 'm'], ['příklad', 'example', 'm'], ['část', 'part', 'f'],
];

const verbs: Array<[string, string]> = [
  ['být', 'to be'], ['mít', 'to have'], ['jít', 'to go (on foot)'], ['jet', 'to go (by vehicle)'], ['přijít', 'to come'],
  ['dělat', 'to do, make'], ['říct', 'to say'], ['mluvit', 'to speak'], ['vidět', 'to see'], ['slyšet', 'to hear'],
  ['poslouchat', 'to listen'], ['vědět', 'to know (facts)'], ['znát', 'to know (people, places)'], ['rozumět', 'to understand'],
  ['moct', 'can, to be able'], ['chtít', 'to want'], ['muset', 'must, to have to'], ['milovat', 'to love'],
  ['jíst', 'to eat'], ['žrát', 'to eat (animals)'], ['pít', 'to drink'], ['spát', 'to sleep'], ['běžet', 'to run'],
  ['skákat', 'to jump'], ['hrát', 'to play'], ['lovit', 'to hunt'], ['bydlet', 'to live (somewhere)'], ['žít', 'to live'],
  ['pracovat', 'to work'], ['dát', 'to give'], ['vzít', 'to take'], ['nést', 'to carry'], ['koupit', 'to buy'],
  ['prodat', 'to sell'], ['najít', 'to find'], ['hledat', 'to look for'], ['položit', 'to put, lay'], ['otevřít', 'to open'],
  ['zavřít', 'to close'], ['začít', 'to begin'], ['skončit', 'to finish, end'], ['letět', 'to fly'], ['plavat', 'to swim'],
  ['cestovat', 'to travel'], ['zůstat', 'to stay'], ['číst', 'to read'], ['psát', 'to write'], ['odpovědět', 'to answer'],
  ['volat', 'to call'], ['pomoct', 'to help'], ['čekat', 'to wait'], ['myslet', 'to think'], ['věřit', 'to believe'],
  ['umřít', 'to die'], ['růst', 'to grow'], ['používat', 'to use'], ['ukázat', 'to show'], ['změnit', 'to change'],
  ['vyhrát', 'to win'], ['prohrát', 'to lose'],
];

const adjectives: Array<[string, string]> = [
  ['dobrý', 'good'], ['špatný', 'bad'], ['velký', 'big'], ['malý', 'small'], ['tlustý', 'fat, thick'],
  ['tenký', 'thin'], ['dlouhý', 'long'], ['krátký', 'short'], ['vysoký', 'high, tall'], ['nízký', 'low'],
  ['krásný', 'beautiful'], ['hezký', 'pretty, nice'], ['nový', 'new'], ['starý', 'old'], ['mladý', 'young'],
  ['rychlý', 'fast'], ['pomalý', 'slow'], ['silný', 'strong'], ['slabý', 'weak'], ['lehký', 'easy, light'],
  ['těžký', 'difficult, heavy'], ['horký', 'hot'], ['teplý', 'warm'], ['studený', 'cold'], ['měkký', 'soft'], ['klidný', 'calm, quiet'],
  ['šťastný', 'happy'], ['smutný', 'sad'], ['milý', 'kind, nice'], ['chytrý', 'clever'], ['nemocný', 'ill'],
  ['stejný', 'same'], ['jiný', 'other'], ['první', 'first'], ['poslední', 'last'],
  ['pravdivý', 'true'], ['důležitý', 'important'], ['oblíbený', 'popular, favourite'], ['slavný', 'famous'], ['anglický', 'English'],
  ['český', 'Czech'], ['bílý', 'white'], ['černý', 'black'], ['červený', 'red'], ['modrý', 'blue'], ['zelený', 'green'],
  ['žlutý', 'yellow'], ['šedý', 'grey'], ['hnědý', 'brown'],
];

const others: Array<[string, string]> = [
  ['a', 'and'], ['nebo', 'or'], ['ale', 'but'], ['protože', 'because'], ['když', 'when, if'], ['jestli', 'if, whether'], ['že', 'that'],
  ['s', 'with'], ['bez', 'without'], ['pro', 'for'], ['v', 'in'], ['na', 'on'], ['pod', 'under'],
  ['mezi', 'between'], ['před', 'before, in front of'], ['po', 'after'], ['během', 'during'], ['u', "at (someone's), near"],
  ['velmi', 'very'], ['moc', 'very, too much'], ['hodně', 'a lot, much'], ['málo', 'little, few'], ['také', 'also'],
  ['zase', 'again'], ['ještě', 'still, yet'], ['vždycky', 'always'], ['nikdy', 'never'], ['často', 'often'],
  ['někdy', 'sometimes'], ['teď', 'now'], ['dnes', 'today'], ['zítra', 'tomorrow'], ['včera', 'yesterday'],
  ['brzy', 'soon, early'], ['pozdě', 'late'], ['tady', 'here'], ['tam', 'there'],
  ['jak', 'how'], ['proč', 'why'], ['kde', 'where'], ['kdo', 'who'], ['co', 'what'],
  ['všichni', 'all, everyone'], ['každý', 'each, every'], ['několik', 'several'], ['ano', 'yes'], ['ne', 'no'],
];

export const CS_A1_WORDS: A1Word[] = [
  ...nouns.map(([lemma, en, g]) => ({ lemma, en, g })),
  ...[...verbs, ...adjectives, ...others].map(([lemma, en]) => ({ lemma, en })),
];
