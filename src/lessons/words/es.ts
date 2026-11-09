import type { A1Word } from '../a1';
import type { EasyWord } from '../easy';
import type { Gender } from '../../languages';

// Spanish (Spain) counterparts of the French lists in `easy.ts` and `a1.ts`. Nouns are in
// the singular, adjectives in the masculine singular. Nothing is dropped: a reflexive verb
// (moverse, convertirse) keeps its pronoun just before the verb, inside the woven span,
// and nunca can stand before a verb on its own.

// Easy words: the same English as the French list, so both find the same places.
const RANK_1: Array<[string, string]> = [
  // people
  ['man|men', 'hombre'], ['woman|women', 'mujer'], ['child|children', 'niño/niña'], ['boy|boys', 'niño/chico'],
  ['girl|girls', 'niña/chica'], ['baby|babies', 'bebé'], ['friend|friends', 'amigo/amiga'], ['family|families', 'familia'],
  ['father|fathers', 'padre'], ['mother|mothers', 'madre'], ['brother|brothers', 'hermano'], ['sister|sisters', 'hermana'],
  ['son|sons', 'hijo'], ['daughter|daughters', 'hija'], ['husband|husbands', 'marido/esposo'], ['wife|wives', 'mujer/esposa'],
  ['people', 'gente/personas'], ['person', 'persona'], ['king|kings', 'rey'], ['queen|queens', 'reina'],
  // animals
  ['animal|animals', 'animal'], ['dog|dogs', 'perro'], ['cat|cats', 'gato'], ['horse|horses', 'caballo'],
  ['bird|birds', 'pájaro/ave'], ['rabbit|rabbits', 'conejo'], ['cow|cows', 'vaca'], ['sheep', 'oveja'], ['mouse|mice', 'ratón'],
  // body
  ['head|heads', 'cabeza'], ['eye|eyes', 'ojo'], ['ear|ears', 'oreja/oído'], ['nose|noses', 'nariz'], ['mouth', 'boca'],
  ['hand|hands', 'mano'], ['foot|feet', 'pie'], ['leg|legs', 'pierna/pata'], ['heart|hearts', 'corazón'], ['tail|tails', 'cola'],
  ['body|bodies', 'cuerpo'], ['hair', 'pelo/cabello'],
  // home and things
  ['house|houses', 'casa'], ['home', 'casa/hogar'], ['door|doors', 'puerta'], ['window|windows', 'ventana'],
  ['table|tables', 'mesa'], ['bed|beds', 'cama'], ['garden|gardens', 'jardín'], ['car|cars', 'coche'],
  ['bicycle|bicycles|bike|bikes', 'bicicleta/bici'], ['train|trains', 'tren'], ['boat|boats', 'barco/barca'], ['plane|planes|aircraft', 'avión'],
  ['book|books', 'libro'], ['letter|letters', 'carta/letra'], ['money', 'dinero'], ['photo|photos|photograph|photographs', 'foto/fotografía'],
  ['film|films|movie|movies', 'película'], ['music', 'música'], ['song|songs', 'canción'], ['game|games', 'juego/partido'],
  ['name|names', 'nombre'], ['colour|colours|color|colors', 'color'], ['school|schools', 'escuela/colegio'],
  // places and nature
  ['city|cities', 'ciudad'], ['town|towns', 'ciudad/pueblo'], ['village|villages', 'pueblo/aldea'], ['country|countries', 'país'],
  ['world', 'mundo'], ['street|streets', 'calle'], ['road|roads', 'carretera/camino'], ['shop|shops', 'tienda'],
  ['sea|seas', 'mar'], ['river|rivers', 'río'], ['mountain|mountains', 'montaña'], ['island|islands', 'isla'],
  ['beach|beaches', 'playa'], ['forest|forests', 'bosque'], ['tree|trees', 'árbol'], ['flower|flowers', 'flor'],
  ['sun', 'sol'], ['moon', 'luna'], ['star|stars', 'estrella'], ['sky', 'cielo'], ['snow', 'nieve'], ['rain', 'lluvia'],
  ['water', 'agua'], ['fire', 'fuego'],
  // food
  ['food', 'comida/alimento'], ['bread', 'pan'], ['milk', 'leche'], ['meat', 'carne'], ['fruit|fruits', 'fruta'],
  ['apple|apples', 'manzana'], ['coffee', 'café'], ['egg|eggs', 'huevo'],
  // time
  ['day|days', 'día'], ['night|nights', 'noche'], ['morning|mornings', 'mañana'], ['evening|evenings', 'tarde/noche'],
  ['week|weeks', 'semana'], ['month|months', 'mes'], ['year|years', 'año'], ['hour|hours', 'hora'],
  ['summer', 'verano'], ['winter', 'invierno'], ['autumn', 'otoño'], ['century|centuries', 'siglo'],
  // adjectives
  ['big|large', 'grande'], ['small|tiny', 'pequeño'], ['good', 'bueno'], ['bad', 'malo'], ['new', 'nuevo'],
  ['old', 'viejo/antiguo'], ['young', 'joven'], ['long', 'largo'], ['short', 'corto/bajo'], ['hot|warm', 'caliente/cálido'],
  ['cold', 'frío'], ['happy', 'feliz/contento'], ['sad', 'triste'], ['beautiful', 'hermoso/precioso'], ['pretty', 'bonito/guapo'],
  ['fast|quick', 'rápido'], ['slow', 'lento'], ['easy', 'fácil'], ['difficult', 'difícil'], ['strong', 'fuerte'],
  ['important', 'importante'], ['popular', 'popular'], ['famous', 'famoso/célebre'],
  // colours
  ['red', 'rojo'], ['blue', 'azul'], ['green', 'verde'], ['white', 'blanco'], ['black', 'negro'], ['yellow', 'amarillo'],
  ['grey|gray', 'gris'], ['brown', 'marrón'], ['pink', 'rosa'], ['orange', 'naranja'],
  // general nouns and adjectives, many of them nearly the same in Spanish
  ['species', 'especie'], ['group|groups', 'grupo'], ['part|parts', 'parte'], ['number|numbers', 'número'],
  ['shape|shapes', 'forma'], ['size|sizes', 'tamaño'], ['life', 'vida'], ['death', 'muerte'], ['skin|skins', 'piel'],
  ['fur', 'pelaje/piel'], ['human|humans', 'humano/ser humano'], ['adult|adults', 'adulto'], ['health', 'salud'],
  ['disease|diseases', 'enfermedad'], ['population|populations', 'población'], ['habitat|habitats', 'hábitat'],
  ['system|systems', 'sistema'], ['surface|surfaces', 'superficie'], ['structure|structures', 'estructura'],
  ['region|regions', 'región'], ['zone|zones', 'zona'], ['energy', 'energía'], ['climate', 'clima'],
  ['history', 'historia'], ['science', 'ciencia'], ['problem|problems', 'problema'], ['example|examples', 'ejemplo'],
  ['image|images', 'imagen'], ['type|types', 'tipo'], ['nature', 'naturaleza'], ['culture|cultures', 'cultura'],
  ['protection', 'protección'], ['production', 'producción'], ['information', 'información'],
  ['nation|nations', 'nación'], ['million|millions', 'millón'], ['minute|minutes', 'minuto'], ['sport|sports', 'deporte'],
  ['centre|centres|center|centers', 'centro'], ['planet|planets', 'planeta'], ['ocean|oceans', 'océano'],
  ['plant|plants', 'planta'], ['fish', 'pez/pescado'], ['wild', 'salvaje'], ['natural', 'natural'], ['central', 'central'],
  ['national', 'nacional'], ['international', 'internacional'], ['high', 'alto/elevado'], ['low', 'bajo'],
  ['rare', 'raro/poco común'], ['common', 'común/frecuente'], ['different', 'diferente/distinto'], ['possible', 'posible'],
  ['normal', 'normal'], ['simple', 'sencillo/simple'], ['modern', 'moderno'], ['original', 'original'], ['true', 'verdadero/cierto'],
  ['full', 'lleno'], ['dark', 'oscuro'],
];

const RANK_2: Array<[string, string]> = [
  // verbs: the model conjugates them in place
  ['eat|eats|ate|eaten|eating', 'comer'], ['drink|drinks|drank|drinking', 'beber'], ['sleep|sleeps|slept|sleeping', 'dormir'],
  ['run|runs|ran|running', 'correr'], ['walk|walks|walked|walking', 'caminar/andar'], ['play|plays|played|playing', 'jugar/tocar'],
  ['live|lives|lived|living', 'vivir'], ['love|loves|loved|loving', 'amar/querer'], ['see|sees|saw|seen|seeing', 'ver'],
  ['go|goes|went|gone|going', 'ir'], ['come|comes|came|coming', 'venir/llegar'], ['make|makes|made|making', 'hacer'],
  ['give|gives|gave|given|giving', 'dar'], ['take|takes|took|taken|taking', 'tomar/coger/llevar'], ['find|finds|found|finding', 'encontrar'],
  ['buy|buys|bought|buying', 'comprar'], ['sell|sells|sold|selling', 'vender'], ['begin|begins|began|begun|beginning|start|starts|started|starting', 'empezar/comenzar'],
  ['finish|finishes|finished|finishing', 'terminar/acabar'], ['win|wins|won|winning', 'ganar'], ['lose|loses|lost|losing', 'perder'],
  ['help|helps|helped|helping', 'ayudar'], ['want|wants|wanted|wanting', 'querer'], ['think|thinks|thought|thinking', 'pensar/creer'],
  ['become|becomes|became|becoming', 'convertirse/hacerse/volverse'], ['die|dies|died|dying', 'morir'], ['call|calls|called|calling', 'llamar'],
  ['work|works|worked|working', 'trabajar/trabajo'], ['travel|travels|travelled|traveled|travelling|traveling', 'viajar'],
  ['hunt|hunts|hunted|hunting', 'cazar/caza'], ['wait|waits|waited|waiting', 'esperar'], ['carry|carries|carried|carrying', 'llevar'],
  // adverbs
  ['often', 'a menudo/con frecuencia'], ['always', 'siempre'], ['never', 'nunca'], ['sometimes', 'a veces'], ['today', 'hoy'],
  ['now', 'ahora'], ['here', 'aquí'], ['together', 'juntos'], ['quickly', 'rápidamente/deprisa'], ['early', 'temprano/pronto'], ['late', 'tarde'],
  ['grow|grows|grew|grown|growing', 'crecer'], ['feed|feeds|fed|feeding', 'alimentar/alimentarse'],
  ['move|moves|moved|moving', 'mover/moverse'], ['show|shows|showed|shown|showing', 'mostrar/enseñar'],
  ['change|changes|changed|changing', 'cambiar/cambio'], ['use|uses|used|using', 'usar/utilizar/uso'],
  // small words: the most common of all, so they come after the nouns and are capped like the rest
  ['is|are|was|were', 'ser/estar'], ['has|had', 'tener/haber'], ['from', 'de/desde'], ['for', 'para/por'], ['without', 'sin'],
  ['between', 'entre'], ['after', 'después de/tras'], ['before', 'antes de'], ['under', 'bajo/debajo de'], ['during', 'durante'],
  ['some', 'algunos/alguno/unos'], ['many', 'muchos/mucho'], ['all', 'todo'], ['each|every', 'cada'],
  ['several', 'varios'], ['few', 'pocos/poco'], ['this|these', 'este/esta/estos/estas'], ['they', 'ellos/ellas'],
  // need agreement and say little on their own
  ['same', 'mismo'], ['other', 'otro'],
];

export const ES_EASY_WORDS: EasyWord[] = [
  ...RANK_1.map(([forms, lemma]) => ({ forms, lemma, rank: 1 as const })),
  ...RANK_2.map(([forms, lemma]) => ({ forms, lemma, rank: 2 as const })),
];

// Everyday A1 vocabulary, grouped by theme: the top-up may only weave these
// (plus the lesson's own words), so the extra words stay at the reader's level.
const nouns: Array<[string, string, Gender]> = [
  // people and family
  ['hombre', 'man', 'm'], ['mujer', 'woman, wife', 'f'], ['niño', 'child, boy', 'm'], ['niña', 'child, girl', 'f'],
  ['chico', 'boy', 'm'], ['chica', 'girl', 'f'], ['bebé', 'baby', 'm'], ['amigo', 'friend', 'm'], ['amiga', 'friend (female)', 'f'],
  ['familia', 'family', 'f'], ['padre', 'father', 'm'], ['madre', 'mother', 'f'], ['hermano', 'brother', 'm'],
  ['hermana', 'sister', 'f'], ['hijo', 'son', 'm'], ['hija', 'daughter', 'f'], ['persona', 'person', 'f'],
  ['gente', 'people', 'f'], ['padres', 'parents', 'm'], ['señor', 'man, Mr', 'm'], ['señora', 'woman, Mrs', 'f'],
  // body
  ['cuerpo', 'body', 'm'], ['cabeza', 'head', 'f'], ['ojo', 'eye', 'm'], ['oreja', 'ear', 'f'], ['nariz', 'nose', 'f'],
  ['boca', 'mouth', 'f'], ['diente', 'tooth', 'm'], ['cuello', 'neck', 'm'], ['espalda', 'back', 'f'], ['brazo', 'arm', 'm'],
  ['mano', 'hand', 'f'], ['pierna', 'leg', 'f'], ['pie', 'foot', 'm'], ['cola', 'tail', 'f'], ['corazón', 'heart', 'm'],
  ['piel', 'skin, fur', 'f'], ['pelo', 'hair', 'm'],
  // animals
  ['animal', 'animal', 'm'], ['perro', 'dog', 'm'], ['gato', 'cat', 'm'], ['caballo', 'horse', 'm'],
  ['pájaro', 'bird', 'm'], ['pez', 'fish', 'm'], ['conejo', 'rabbit', 'm'], ['vaca', 'cow', 'f'],
  ['oveja', 'sheep', 'f'], ['ratón', 'mouse', 'm'],
  // home and objects
  ['casa', 'house, home', 'f'], ['piso', 'flat, floor', 'm'], ['habitación', 'room', 'f'], ['cocina', 'kitchen', 'f'],
  ['puerta', 'door', 'f'], ['ventana', 'window', 'f'], ['mesa', 'table', 'f'], ['silla', 'chair', 'f'], ['cama', 'bed', 'f'],
  ['jardín', 'garden', 'm'], ['libro', 'book', 'm'], ['página', 'page', 'f'], ['bolígrafo', 'pen', 'm'], ['foto', 'photo', 'f'],
  ['teléfono', 'phone', 'm'], ['coche', 'car', 'm'], ['bicicleta', 'bike', 'f'], ['tren', 'train', 'm'], ['autobús', 'bus', 'm'],
  ['avión', 'plane', 'm'], ['dinero', 'money', 'm'], ['llave', 'key', 'f'], ['bolsa', 'bag', 'f'], ['juguete', 'toy', 'm'],
  // places
  ['ciudad', 'town, city', 'f'], ['pueblo', 'village, small town', 'm'], ['país', 'country', 'm'], ['calle', 'street', 'f'],
  ['camino', 'way, path', 'm'], ['escuela', 'school', 'f'], ['clase', 'class, classroom', 'f'], ['tienda', 'shop', 'f'],
  ['mercado', 'market', 'm'], ['parque', 'park', 'm'], ['playa', 'beach', 'f'], ['mar', 'sea', 'm'],
  ['montaña', 'mountain', 'f'], ['campo', 'field, countryside', 'm'], ['bosque', 'forest', 'm'], ['río', 'river', 'm'],
  ['mundo', 'world', 'm'], ['trabajo', 'work, job', 'm'], ['oficina', 'office', 'f'],
  // food
  ['agua', 'water', 'f'], ['pan', 'bread', 'm'], ['leche', 'milk', 'f'], ['carne', 'meat', 'f'], ['fruta', 'fruit', 'f'],
  ['manzana', 'apple', 'f'], ['café', 'coffee', 'm'], ['comida', 'food, meal', 'f'], ['huevo', 'egg', 'm'],
  // time
  ['día', 'day', 'm'], ['noche', 'night', 'f'], ['mañana', 'morning', 'f'], ['tarde', 'afternoon, evening', 'f'],
  ['semana', 'week', 'f'], ['mes', 'month', 'm'], ['año', 'year', 'm'], ['hora', 'hour', 'f'],
  ['minuto', 'minute', 'm'], ['tiempo', 'time, weather', 'm'], ['siglo', 'century', 'm'],
  ['verano', 'summer', 'm'], ['invierno', 'winter', 'm'], ['primavera', 'spring', 'f'], ['otoño', 'autumn', 'm'],
  // things in general
  ['cosa', 'thing', 'f'], ['nombre', 'name', 'm'], ['palabra', 'word', 'f'], ['pregunta', 'question', 'f'],
  ['respuesta', 'answer', 'f'], ['lengua', 'language, tongue', 'f'], ['color', 'colour', 'm'], ['tamaño', 'size', 'm'],
  ['peso', 'weight', 'm'], ['juego', 'game', 'm'], ['deporte', 'sport', 'm'], ['salud', 'health', 'f'],
  ['problema', 'problem', 'm'], ['ejemplo', 'example', 'm'], ['parte', 'part', 'f'],
];

const verbs: Array<[string, string]> = [
  ['ser', 'to be (what)'], ['estar', 'to be (where, how)'], ['tener', 'to have'], ['haber', 'to have (perfect), there is'],
  ['ir', 'to go'], ['venir', 'to come'], ['llegar', 'to arrive'], ['hacer', 'to do, make'], ['decir', 'to say'],
  ['hablar', 'to speak'], ['ver', 'to see'], ['oír', 'to hear'], ['escuchar', 'to listen'], ['saber', 'to know (facts)'],
  ['conocer', 'to know (people, places)'], ['entender', 'to understand'], ['poder', 'can, to be able'], ['querer', 'to want, love'],
  ['deber', 'must, should'], ['amar', 'to love'], ['comer', 'to eat'], ['beber', 'to drink'], ['dormir', 'to sleep'],
  ['correr', 'to run'], ['saltar', 'to jump'], ['jugar', 'to play'], ['cazar', 'to hunt'], ['vivir', 'to live'],
  ['trabajar', 'to work'], ['dar', 'to give'], ['tomar', 'to take'], ['llevar', 'to carry, wear'], ['comprar', 'to buy'],
  ['vender', 'to sell'], ['encontrar', 'to find'], ['buscar', 'to look for'], ['poner', 'to put'], ['abrir', 'to open'],
  ['cerrar', 'to close'], ['empezar', 'to begin'], ['terminar', 'to finish, end'], ['volar', 'to fly'], ['nadar', 'to swim'],
  ['viajar', 'to travel'], ['quedarse', 'to stay'], ['leer', 'to read'], ['escribir', 'to write'], ['contestar', 'to answer'],
  ['llamar', 'to call'], ['ayudar', 'to help'], ['esperar', 'to wait, hope'], ['pensar', 'to think'], ['creer', 'to believe'],
  ['morir', 'to die'], ['crecer', 'to grow'], ['usar', 'to use'], ['mostrar', 'to show'], ['cambiar', 'to change'],
  ['ganar', 'to win, earn'], ['perder', 'to lose'], ['gustar', 'to please (me gusta: I like)'],
];

const adjectives: Array<[string, string]> = [
  ['bueno', 'good'], ['malo', 'bad'], ['grande', 'big'], ['pequeño', 'small'], ['gordo', 'fat'],
  ['delgado', 'thin'], ['largo', 'long'], ['corto', 'short'], ['alto', 'high, tall'], ['bajo', 'low, short'],
  ['hermoso', 'beautiful'], ['bonito', 'pretty, nice'], ['nuevo', 'new'], ['viejo', 'old'], ['joven', 'young'],
  ['rápido', 'fast'], ['lento', 'slow'], ['fuerte', 'strong'], ['débil', 'weak'], ['fácil', 'easy'],
  ['difícil', 'difficult'], ['pesado', 'heavy'], ['ligero', 'light'], ['caliente', 'hot'], ['frío', 'cold'], ['blando', 'soft'],
  ['tranquilo', 'calm, quiet'], ['feliz', 'happy'], ['triste', 'sad'], ['simpático', 'kind, nice'], ['listo', 'clever, ready'],
  ['enfermo', 'ill'], ['mismo', 'same'], ['otro', 'other'], ['primero', 'first'], ['último', 'last'],
  ['verdadero', 'true'], ['importante', 'important'], ['favorito', 'favourite'], ['famoso', 'famous'], ['inglés', 'English'],
  ['español', 'Spanish'], ['blanco', 'white'], ['negro', 'black'], ['rojo', 'red'], ['azul', 'blue'], ['verde', 'green'],
  ['amarillo', 'yellow'], ['gris', 'grey'], ['marrón', 'brown'],
];

const others: Array<[string, string]> = [
  ['y', 'and'], ['o', 'or'], ['pero', 'but'], ['porque', 'because'], ['cuando', 'when'], ['si', 'if, whether'], ['que', 'that'],
  ['con', 'with'], ['sin', 'without'], ['para', 'for'], ['en', 'in, on'], ['sobre', 'on, about'], ['debajo de', 'under'],
  ['entre', 'between'], ['delante de', 'in front of'], ['antes de', 'before'], ['después de', 'after'], ['durante', 'during'], ['cerca de', 'near'],
  ['muy', 'very'], ['mucho', 'a lot, much'], ['demasiado', 'too much'], ['poco', 'little, few'], ['también', 'also'],
  ['otra vez', 'again'], ['todavía', 'still, yet'], ['siempre', 'always'], ['nunca', 'never'], ['a menudo', 'often'],
  ['a veces', 'sometimes'], ['ahora', 'now'], ['hoy', 'today'], ['mañana', 'tomorrow'], ['ayer', 'yesterday'],
  ['pronto', 'soon, early'], ['tarde', 'late'], ['aquí', 'here'], ['allí', 'there'],
  ['cómo', 'how'], ['por qué', 'why'], ['dónde', 'where'], ['quién', 'who'], ['qué', 'what'],
  ['todos', 'all, everyone'], ['cada', 'each, every'], ['varios', 'several'], ['sí', 'yes'], ['no', 'no, not'],
];

export const ES_A1_WORDS: A1Word[] = [
  ...nouns.map(([lemma, en, g]) => ({ lemma, en, g })),
  ...[...verbs, ...adjectives, ...others].map(([lemma, en]) => ({ lemma, en })),
];
