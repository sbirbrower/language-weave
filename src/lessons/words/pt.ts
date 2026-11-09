import type { A1Word } from '../a1';
import type { EasyWord } from '../easy';
import type { Gender } from '../../languages';

// Brazilian Portuguese counterparts of the French lists in `easy.ts` and `a1.ts`. Nouns are in
// the singular, adjectives in the masculine singular. Nothing is dropped: a verb with se
// (tornar-se, mover-se) takes its pronoun just before the verb, as Brazilians write it,
// inside the woven span, and nunca can stand before a verb on its own.

// Easy words: the same English as the French list, so both find the same places.
const RANK_1: Array<[string, string]> = [
  // people
  ['man|men', 'homem'], ['woman|women', 'mulher'], ['child|children', 'criança'], ['boy|boys', 'menino/garoto'],
  ['girl|girls', 'menina/garota'], ['baby|babies', 'bebê'], ['friend|friends', 'amigo/amiga'], ['family|families', 'família'],
  ['father|fathers', 'pai'], ['mother|mothers', 'mãe'], ['brother|brothers', 'irmão'], ['sister|sisters', 'irmã'],
  ['son|sons', 'filho'], ['daughter|daughters', 'filha'], ['husband|husbands', 'marido'], ['wife|wives', 'esposa/mulher'],
  ['people', 'gente/pessoas'], ['person', 'pessoa'], ['king|kings', 'rei'], ['queen|queens', 'rainha'],
  // animals
  ['animal|animals', 'animal'], ['dog|dogs', 'cachorro/cão'], ['cat|cats', 'gato'], ['horse|horses', 'cavalo'],
  ['bird|birds', 'pássaro/ave'], ['rabbit|rabbits', 'coelho'], ['cow|cows', 'vaca'], ['sheep', 'ovelha'], ['mouse|mice', 'rato/camundongo'],
  // body
  ['head|heads', 'cabeça'], ['eye|eyes', 'olho'], ['ear|ears', 'orelha/ouvido'], ['nose|noses', 'nariz'], ['mouth', 'boca'],
  ['hand|hands', 'mão'], ['foot|feet', 'pé'], ['leg|legs', 'perna/pata'], ['heart|hearts', 'coração'], ['tail|tails', 'rabo/cauda'],
  ['body|bodies', 'corpo'], ['hair', 'cabelo/pelo'],
  // home and things
  ['house|houses', 'casa'], ['home', 'casa/lar'], ['door|doors', 'porta'], ['window|windows', 'janela'],
  ['table|tables', 'mesa'], ['bed|beds', 'cama'], ['garden|gardens', 'jardim'], ['car|cars', 'carro'],
  ['bicycle|bicycles|bike|bikes', 'bicicleta'], ['train|trains', 'trem'], ['boat|boats', 'barco'], ['plane|planes|aircraft', 'avião'],
  ['book|books', 'livro'], ['letter|letters', 'carta/letra'], ['money', 'dinheiro'], ['photo|photos|photograph|photographs', 'foto/fotografia'],
  ['film|films|movie|movies', 'filme'], ['music', 'música'], ['song|songs', 'música/canção'], ['game|games', 'jogo/partida'],
  ['name|names', 'nome'], ['colour|colours|color|colors', 'cor'], ['school|schools', 'escola'],
  // places and nature
  ['city|cities', 'cidade'], ['town|towns', 'cidade'], ['village|villages', 'vilarejo/aldeia'], ['country|countries', 'país'],
  ['world', 'mundo'], ['street|streets', 'rua'], ['road|roads', 'estrada/caminho'], ['shop|shops', 'loja'],
  ['sea|seas', 'mar'], ['river|rivers', 'rio'], ['mountain|mountains', 'montanha'], ['island|islands', 'ilha'],
  ['beach|beaches', 'praia'], ['forest|forests', 'floresta/mata'], ['tree|trees', 'árvore'], ['flower|flowers', 'flor'],
  ['sun', 'sol'], ['moon', 'lua'], ['star|stars', 'estrela'], ['sky', 'céu'], ['snow', 'neve'], ['rain', 'chuva'],
  ['water', 'água'], ['fire', 'fogo'],
  // food
  ['food', 'comida/alimento'], ['bread', 'pão'], ['milk', 'leite'], ['meat', 'carne'], ['fruit|fruits', 'fruta'],
  ['apple|apples', 'maçã'], ['coffee', 'café'], ['egg|eggs', 'ovo'],
  // time
  ['day|days', 'dia'], ['night|nights', 'noite'], ['morning|mornings', 'manhã'], ['evening|evenings', 'noite/tarde'],
  ['week|weeks', 'semana'], ['month|months', 'mês'], ['year|years', 'ano'], ['hour|hours', 'hora'],
  ['summer', 'verão'], ['winter', 'inverno'], ['autumn', 'outono'], ['century|centuries', 'século'],
  // adjectives
  ['big|large', 'grande'], ['small|tiny', 'pequeno'], ['good', 'bom'], ['bad', 'ruim/mau'], ['new', 'novo'],
  ['old', 'velho/antigo'], ['young', 'jovem'], ['long', 'longo/comprido'], ['short', 'curto/baixo'], ['hot|warm', 'quente'],
  ['cold', 'frio'], ['happy', 'feliz/contente'], ['sad', 'triste'], ['beautiful', 'lindo/bonito'], ['pretty', 'bonito/lindo'],
  ['fast|quick', 'rápido'], ['slow', 'lento'], ['easy', 'fácil'], ['difficult', 'difícil'], ['strong', 'forte'],
  ['important', 'importante'], ['popular', 'popular'], ['famous', 'famoso/célebre'],
  // colours
  ['red', 'vermelho'], ['blue', 'azul'], ['green', 'verde'], ['white', 'branco'], ['black', 'preto/negro'], ['yellow', 'amarelo'],
  ['grey|gray', 'cinza'], ['brown', 'marrom'], ['pink', 'rosa'], ['orange', 'laranja'],
  // general nouns and adjectives, many of them nearly the same in Portuguese
  ['species', 'espécie'], ['group|groups', 'grupo'], ['part|parts', 'parte'], ['number|numbers', 'número'],
  ['shape|shapes', 'forma/formato'], ['size|sizes', 'tamanho'], ['life', 'vida'], ['death', 'morte'], ['skin|skins', 'pele'],
  ['fur', 'pelo/pelagem'], ['human|humans', 'humano/ser humano'], ['adult|adults', 'adulto'], ['health', 'saúde'],
  ['disease|diseases', 'doença'], ['population|populations', 'população'], ['habitat|habitats', 'hábitat/habitat'],
  ['system|systems', 'sistema'], ['surface|surfaces', 'superfície'], ['structure|structures', 'estrutura'],
  ['region|regions', 'região'], ['zone|zones', 'zona'], ['energy', 'energia'], ['climate', 'clima'],
  ['history', 'história'], ['science', 'ciência'], ['problem|problems', 'problema'], ['example|examples', 'exemplo'],
  ['image|images', 'imagem'], ['type|types', 'tipo'], ['nature', 'natureza'], ['culture|cultures', 'cultura'],
  ['protection', 'proteção'], ['production', 'produção'], ['information', 'informação'],
  ['nation|nations', 'nação'], ['million|millions', 'milhão'], ['minute|minutes', 'minuto'], ['sport|sports', 'esporte'],
  ['centre|centres|center|centers', 'centro'], ['planet|planets', 'planeta'], ['ocean|oceans', 'oceano'],
  ['plant|plants', 'planta'], ['fish', 'peixe'], ['wild', 'selvagem'], ['natural', 'natural'], ['central', 'central'],
  ['national', 'nacional'], ['international', 'internacional'], ['high', 'alto/elevado'], ['low', 'baixo'],
  ['rare', 'raro'], ['common', 'comum'], ['different', 'diferente'], ['possible', 'possível'],
  ['normal', 'normal'], ['simple', 'simples'], ['modern', 'moderno'], ['original', 'original'], ['true', 'verdadeiro'],
  ['full', 'cheio'], ['dark', 'escuro'],
];

const RANK_2: Array<[string, string]> = [
  // verbs: the model conjugates them in place
  ['eat|eats|ate|eaten|eating', 'comer'], ['drink|drinks|drank|drinking', 'beber/tomar'], ['sleep|sleeps|slept|sleeping', 'dormir'],
  ['run|runs|ran|running', 'correr'], ['walk|walks|walked|walking', 'andar/caminhar'], ['play|plays|played|playing', 'jogar/brincar/tocar'],
  ['live|lives|lived|living', 'viver/morar'], ['love|loves|loved|loving', 'amar/adorar'], ['see|sees|saw|seen|seeing', 'ver'],
  ['go|goes|went|gone|going', 'ir'], ['come|comes|came|coming', 'vir/chegar'], ['make|makes|made|making', 'fazer'],
  ['give|gives|gave|given|giving', 'dar'], ['take|takes|took|taken|taking', 'pegar/tomar/levar'], ['find|finds|found|finding', 'encontrar/achar'],
  ['buy|buys|bought|buying', 'comprar'], ['sell|sells|sold|selling', 'vender'], ['begin|begins|began|begun|beginning|start|starts|started|starting', 'começar'],
  ['finish|finishes|finished|finishing', 'terminar/acabar'], ['win|wins|won|winning', 'ganhar/vencer'], ['lose|loses|lost|losing', 'perder'],
  ['help|helps|helped|helping', 'ajudar'], ['want|wants|wanted|wanting', 'querer'], ['think|thinks|thought|thinking', 'pensar/achar'],
  ['become|becomes|became|becoming', 'tornar-se/virar/ficar'], ['die|dies|died|dying', 'morrer'], ['call|calls|called|calling', 'chamar/ligar'],
  ['work|works|worked|working', 'trabalhar/trabalho'], ['travel|travels|travelled|traveled|travelling|traveling', 'viajar'],
  ['hunt|hunts|hunted|hunting', 'caçar/caça'], ['wait|waits|waited|waiting', 'esperar'], ['carry|carries|carried|carrying', 'levar/carregar'],
  // adverbs
  ['often', 'muitas vezes/frequentemente'], ['always', 'sempre'], ['never', 'nunca'], ['sometimes', 'às vezes'], ['today', 'hoje'],
  ['now', 'agora'], ['here', 'aqui'], ['together', 'juntos'], ['quickly', 'rapidamente/depressa'], ['early', 'cedo'], ['late', 'tarde'],
  ['grow|grows|grew|grown|growing', 'crescer'], ['feed|feeds|fed|feeding', 'alimentar/alimentar-se'],
  ['move|moves|moved|moving', 'mover/mover-se/mudar'], ['show|shows|showed|shown|showing', 'mostrar'],
  ['change|changes|changed|changing', 'mudar/mudança'], ['use|uses|used|using', 'usar/utilizar/uso'],
  // small words: the most common of all, so they come after the nouns and are capped like the rest
  ['is|are|was|were', 'ser/estar'], ['has|had', 'ter/haver'], ['from', 'de/desde'], ['for', 'para/por'], ['without', 'sem'],
  ['between', 'entre'], ['after', 'depois de/após'], ['before', 'antes de'], ['under', 'sob/embaixo de'], ['during', 'durante'],
  ['some', 'alguns/algum/uns'], ['many', 'muitos/muito'], ['all', 'todo'], ['each|every', 'cada'],
  ['several', 'vários'], ['few', 'poucos/pouco'], ['this|these', 'este/esta/estes/estas'], ['they', 'eles/elas'],
  // need agreement and say little on their own
  ['same', 'mesmo'], ['other', 'outro'],
];

export const PT_EASY_WORDS: EasyWord[] = [
  ...RANK_1.map(([forms, lemma]) => ({ forms, lemma, rank: 1 as const })),
  ...RANK_2.map(([forms, lemma]) => ({ forms, lemma, rank: 2 as const })),
];

// Everyday A1 vocabulary, grouped by theme: the top-up may only weave these
// (plus the lesson's own words), so the extra words stay at the reader's level.
const nouns: Array<[string, string, Gender]> = [
  // people and family
  ['homem', 'man', 'm'], ['mulher', 'woman, wife', 'f'], ['criança', 'child', 'f'], ['menino', 'boy', 'm'], ['menina', 'girl', 'f'],
  ['bebê', 'baby', 'm'], ['amigo', 'friend', 'm'], ['amiga', 'friend (female)', 'f'], ['família', 'family', 'f'],
  ['pai', 'father', 'm'], ['mãe', 'mother', 'f'], ['irmão', 'brother', 'm'], ['irmã', 'sister', 'f'], ['filho', 'son', 'm'],
  ['filha', 'daughter', 'f'], ['pessoa', 'person', 'f'], ['gente', 'people', 'f'], ['pais', 'parents', 'm'],
  ['senhor', 'man, Mr, sir', 'm'], ['senhora', 'woman, Mrs, madam', 'f'],
  // body
  ['corpo', 'body', 'm'], ['cabeça', 'head', 'f'], ['olho', 'eye', 'm'], ['orelha', 'ear', 'f'], ['nariz', 'nose', 'm'],
  ['boca', 'mouth', 'f'], ['dente', 'tooth', 'm'], ['pescoço', 'neck', 'm'], ['costas', 'back', 'f'], ['braço', 'arm', 'm'],
  ['mão', 'hand', 'f'], ['perna', 'leg', 'f'], ['pé', 'foot', 'm'], ['rabo', 'tail', 'm'], ['coração', 'heart', 'm'],
  ['pele', 'skin', 'f'], ['cabelo', 'hair', 'm'],
  // animals
  ['animal', 'animal', 'm'], ['cachorro', 'dog', 'm'], ['gato', 'cat', 'm'], ['cavalo', 'horse', 'm'],
  ['pássaro', 'bird', 'm'], ['peixe', 'fish', 'm'], ['coelho', 'rabbit', 'm'], ['vaca', 'cow', 'f'],
  ['ovelha', 'sheep', 'f'], ['rato', 'mouse, rat', 'm'],
  // home and objects
  ['casa', 'house, home', 'f'], ['apartamento', 'flat', 'm'], ['quarto', 'bedroom, room', 'm'], ['cozinha', 'kitchen', 'f'],
  ['porta', 'door', 'f'], ['janela', 'window', 'f'], ['mesa', 'table', 'f'], ['cadeira', 'chair', 'f'], ['cama', 'bed', 'f'],
  ['jardim', 'garden', 'm'], ['livro', 'book', 'm'], ['página', 'page', 'f'], ['caneta', 'pen', 'f'], ['foto', 'photo', 'f'],
  ['celular', 'mobile phone', 'm'], ['carro', 'car', 'm'], ['bicicleta', 'bike', 'f'], ['trem', 'train', 'm'], ['ônibus', 'bus', 'm'],
  ['avião', 'plane', 'm'], ['dinheiro', 'money', 'm'], ['chave', 'key', 'f'], ['bolsa', 'bag', 'f'], ['brinquedo', 'toy', 'm'],
  // places
  ['cidade', 'town, city', 'f'], ['vilarejo', 'village', 'm'], ['país', 'country', 'm'], ['rua', 'street', 'f'],
  ['caminho', 'way, path', 'm'], ['escola', 'school', 'f'], ['aula', 'class, lesson', 'f'], ['loja', 'shop', 'f'],
  ['mercado', 'market', 'm'], ['parque', 'park', 'm'], ['praia', 'beach', 'f'], ['mar', 'sea', 'm'],
  ['montanha', 'mountain', 'f'], ['campo', 'field, countryside', 'm'], ['floresta', 'forest', 'f'], ['rio', 'river', 'm'],
  ['mundo', 'world', 'm'], ['trabalho', 'work, job', 'm'], ['escritório', 'office', 'm'],
  // food
  ['água', 'water', 'f'], ['pão', 'bread', 'm'], ['leite', 'milk', 'm'], ['carne', 'meat', 'f'], ['fruta', 'fruit', 'f'],
  ['maçã', 'apple', 'f'], ['café', 'coffee', 'm'], ['comida', 'food, meal', 'f'], ['ovo', 'egg', 'm'],
  // time
  ['dia', 'day', 'm'], ['noite', 'night, evening', 'f'], ['manhã', 'morning', 'f'], ['tarde', 'afternoon', 'f'],
  ['semana', 'week', 'f'], ['mês', 'month', 'm'], ['ano', 'year', 'm'], ['hora', 'hour', 'f'],
  ['minuto', 'minute', 'm'], ['tempo', 'time, weather', 'm'], ['século', 'century', 'm'],
  ['verão', 'summer', 'm'], ['inverno', 'winter', 'm'], ['primavera', 'spring', 'f'], ['outono', 'autumn', 'm'],
  // things in general
  ['coisa', 'thing', 'f'], ['nome', 'name', 'm'], ['palavra', 'word', 'f'], ['pergunta', 'question', 'f'],
  ['resposta', 'answer', 'f'], ['língua', 'language, tongue', 'f'], ['cor', 'colour', 'f'], ['tamanho', 'size', 'm'],
  ['peso', 'weight', 'm'], ['jogo', 'game', 'm'], ['esporte', 'sport', 'm'], ['saúde', 'health', 'f'],
  ['problema', 'problem', 'm'], ['exemplo', 'example', 'm'], ['parte', 'part', 'f'],
];

const verbs: Array<[string, string]> = [
  ['ser', 'to be (what)'], ['estar', 'to be (how, for now)'], ['ficar', 'to be (where), stay, become'], ['ter', 'to have'],
  ['haver', 'there is (há)'], ['ir', 'to go'], ['vir', 'to come'], ['chegar', 'to arrive'], ['fazer', 'to do, make'],
  ['dizer', 'to say'], ['falar', 'to speak'], ['ver', 'to see'], ['ouvir', 'to hear'], ['escutar', 'to listen'],
  ['saber', 'to know (facts)'], ['conhecer', 'to know (people, places)'], ['entender', 'to understand'], ['poder', 'can, to be able'],
  ['querer', 'to want'], ['dever', 'must, should'], ['amar', 'to love'], ['gostar', 'to like (gostar de)'], ['comer', 'to eat'],
  ['beber', 'to drink'], ['dormir', 'to sleep'], ['correr', 'to run'], ['pular', 'to jump'], ['jogar', 'to play (a game)'],
  ['brincar', 'to play (children)'], ['caçar', 'to hunt'], ['viver', 'to live'], ['morar', 'to live (somewhere)'],
  ['trabalhar', 'to work'], ['dar', 'to give'], ['pegar', 'to take, catch'], ['levar', 'to carry, take'], ['comprar', 'to buy'],
  ['vender', 'to sell'], ['encontrar', 'to find, meet'], ['procurar', 'to look for'], ['colocar', 'to put'], ['abrir', 'to open'],
  ['fechar', 'to close'], ['começar', 'to begin'], ['terminar', 'to finish, end'], ['voar', 'to fly'], ['nadar', 'to swim'],
  ['viajar', 'to travel'], ['ler', 'to read'], ['escrever', 'to write'], ['responder', 'to answer'], ['chamar', 'to call'],
  ['ligar', 'to phone'], ['ajudar', 'to help'], ['esperar', 'to wait, hope'], ['pensar', 'to think'], ['achar', 'to find, think'],
  ['acreditar', 'to believe'], ['morrer', 'to die'], ['crescer', 'to grow'], ['usar', 'to use'], ['mostrar', 'to show'],
  ['mudar', 'to change, move house'], ['ganhar', 'to win, earn'], ['perder', 'to lose'],
];

const adjectives: Array<[string, string]> = [
  ['bom', 'good'], ['ruim', 'bad'], ['grande', 'big'], ['pequeno', 'small'], ['gordo', 'fat'],
  ['magro', 'thin'], ['comprido', 'long'], ['curto', 'short'], ['alto', 'high, tall'], ['baixo', 'low, short'],
  ['lindo', 'beautiful'], ['bonito', 'pretty, nice'], ['novo', 'new'], ['velho', 'old'], ['jovem', 'young'],
  ['rápido', 'fast'], ['lento', 'slow'], ['forte', 'strong'], ['fraco', 'weak'], ['fácil', 'easy'],
  ['difícil', 'difficult'], ['pesado', 'heavy'], ['leve', 'light'], ['quente', 'hot'], ['frio', 'cold'], ['macio', 'soft'],
  ['calmo', 'calm'], ['feliz', 'happy'], ['triste', 'sad'], ['simpático', 'kind, nice'], ['esperto', 'clever'],
  ['pronto', 'ready'], ['doente', 'ill'], ['mesmo', 'same'], ['outro', 'other'], ['primeiro', 'first'], ['último', 'last'],
  ['verdadeiro', 'true'], ['importante', 'important'], ['favorito', 'favourite'], ['famoso', 'famous'], ['inglês', 'English'],
  ['brasileiro', 'Brazilian'], ['branco', 'white'], ['preto', 'black'], ['vermelho', 'red'], ['azul', 'blue'], ['verde', 'green'],
  ['amarelo', 'yellow'], ['cinza', 'grey'], ['marrom', 'brown'],
];

const others: Array<[string, string]> = [
  ['e', 'and'], ['ou', 'or'], ['mas', 'but'], ['porque', 'because'], ['quando', 'when'], ['se', 'if, whether'], ['que', 'that'],
  ['com', 'with'], ['sem', 'without'], ['para', 'for, to'], ['em', 'in, on'], ['sobre', 'on, about'], ['embaixo de', 'under'],
  ['entre', 'between'], ['na frente de', 'in front of'], ['antes de', 'before'], ['depois de', 'after'], ['durante', 'during'], ['perto de', 'near'],
  ['muito', 'very, a lot'], ['demais', 'too much'], ['pouco', 'little, few'], ['também', 'also'],
  ['de novo', 'again'], ['ainda', 'still, yet'], ['sempre', 'always'], ['nunca', 'never'], ['muitas vezes', 'often'],
  ['às vezes', 'sometimes'], ['agora', 'now'], ['hoje', 'today'], ['amanhã', 'tomorrow'], ['ontem', 'yesterday'],
  ['logo', 'soon'], ['cedo', 'early'], ['tarde', 'late'], ['aqui', 'here'], ['ali', 'there'], ['lá', 'over there'],
  ['como', 'how'], ['por que', 'why'], ['onde', 'where'], ['quem', 'who'], ['o que', 'what'],
  ['todos', 'all, everyone'], ['cada', 'each, every'], ['vários', 'several'], ['sim', 'yes'], ['não', 'no, not'],
];

export const PT_A1_WORDS: A1Word[] = [
  ...nouns.map(([lemma, en, g]) => ({ lemma, en, g })),
  ...[...verbs, ...adjectives, ...others].map(([lemma, en]) => ({ lemma, en })),
];
