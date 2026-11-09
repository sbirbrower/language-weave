import type { A1Word } from '../a1';
import type { EasyWord } from '../easy';
import type { Gender } from '../../languages';

// Russian counterparts of the French lists in `easy.ts` and `a1.ts`, with readings (src/ruby.ts), stress
// marked. Nouns in the nominative singular, adjectives in the masculine, verbs in the infinitive. Left out
// of the French list's small words: is, are, was and were (no "is" in the present, and the past agrees with
// its subject), has and had (у меня есть, a different construction), and never (никогда needs не before the verb).

// Easy words: the same English as the French list, so both find the same places.
const RANK_1: Array<[string, string]> = [
  // people
  ['man|men', 'мужчина《muzhchína》/человек《chelovék》'], ['woman|women', 'женщина《zhénshchina》'], ['child|children', 'ребёнок《rebyónok》'], ['boy|boys', 'мальчик《mál\'chik》'],
  ['girl|girls', 'девочка《dévochka》/девушка《dévushka》'], ['baby|babies', 'малыш《malýsh》/ребёнок《rebyónok》'], ['friend|friends', 'друг《drug》/подруга《podrúga》'], ['family|families', 'семья《sem\'yá》'],
  ['father|fathers', 'отец《otéts》/папа《pápa》'], ['mother|mothers', 'мать《mat\'》/мама《máma》'], ['brother|brothers', 'брат《brat》'], ['sister|sisters', 'сестра《sestrá》'],
  ['son|sons', 'сын《syn》'], ['daughter|daughters', 'дочь《doch\'》'], ['husband|husbands', 'муж《muzh》'], ['wife|wives', 'жена《zhená》'],
  ['people', 'люди《lyúdi》'], ['person', 'человек《chelovék》'], ['king|kings', 'король《koról\'》'], ['queen|queens', 'королева《koroléva》'],
  // animals
  ['animal|animals', 'животное《zhivótnoye》/зверь《zver\'》'], ['dog|dogs', 'собака《sobáka》'], ['cat|cats', 'кошка《kóshka》/кот《kot》'], ['horse|horses', 'лошадь《lóshad\'》/конь《kon\'》'],
  ['bird|birds', 'птица《ptítsa》'], ['rabbit|rabbits', 'кролик《królik》/заяц《záyats》'], ['cow|cows', 'корова《koróva》'], ['sheep', 'овца《ovtsá》'], ['mouse|mice', 'мышь《mysh\'》'],
  // body
  ['head|heads', 'голова《golová》'], ['eye|eyes', 'глаз《glaz》'], ['ear|ears', 'ухо《úkho》'], ['nose|noses', 'нос《nos》'], ['mouth', 'рот《rot》/пасть《past\'》'],
  ['hand|hands', 'рука《ruká》'], ['foot|feet', 'нога《nogá》'], ['leg|legs', 'нога《nogá》'], ['heart|hearts', 'сердце《sérdtse》'], ['tail|tails', 'хвост《khvost》'],
  ['body|bodies', 'тело《télo》'], ['hair', 'волосы《vólosy》/шерсть《sherst\'》'],
  // home and things
  ['house|houses', 'дом《dom》'], ['home', 'дом《dom》'], ['door|doors', 'дверь《dver\'》'], ['window|windows', 'окно《oknó》'],
  ['table|tables', 'стол《stol》'], ['bed|beds', 'кровать《krovát\'》'], ['garden|gardens', 'сад《sad》'], ['car|cars', 'машина《mashína》/автомобиль《avtomobíl\'》'],
  ['bicycle|bicycles|bike|bikes', 'велосипед《velosipéd》'], ['train|trains', 'поезд《póyezd》'], ['boat|boats', 'лодка《lódka》/корабль《korábl\'》'], ['plane|planes|aircraft', 'самолёт《samolyót》'],
  ['book|books', 'книга《kníga》'], ['letter|letters', 'письмо《pis\'mó》/буква《búkva》'], ['money', 'деньги《dén\'gi》'], ['photo|photos|photograph|photographs', 'фото《fóto》/фотография《fotográfiya》'],
  ['film|films|movie|movies', 'фильм《fil\'m》'], ['music', 'музыка《múzyka》'], ['song|songs', 'песня《pésnya》'], ['game|games', 'игра《igrá》'],
  ['name|names', 'имя《ímya》/название《nazvániye》'], ['colour|colours|color|colors', 'цвет《tsvet》'], ['school|schools', 'школа《shkóla》'],
  // places and nature
  ['city|cities', 'город《górod》'], ['town|towns', 'город《górod》'], ['village|villages', 'деревня《derévnya》/село《seló》'], ['country|countries', 'страна《straná》'],
  ['world', 'мир《mir》'], ['street|streets', 'улица《úlitsa》'], ['road|roads', 'дорога《doróga》'], ['shop|shops', 'магазин《magazín》'],
  ['sea|seas', 'море《móre》'], ['river|rivers', 'река《reká》'], ['mountain|mountains', 'гора《gorá》'], ['island|islands', 'остров《óstrov》'],
  ['beach|beaches', 'пляж《plyazh》'], ['forest|forests', 'лес《les》'], ['tree|trees', 'дерево《dérevo》'], ['flower|flowers', 'цветок《tsvetók》'],
  ['sun', 'солнце《sólntse》'], ['moon', 'луна《luná》'], ['star|stars', 'звезда《zvezdá》'], ['sky', 'небо《nébo》'], ['snow', 'снег《sneg》'], ['rain', 'дождь《dozhd\'》'],
  ['water', 'вода《vodá》'], ['fire', 'огонь《ogón\'》'],
  // food
  ['food', 'еда《yedá》/пища《píshcha》'], ['bread', 'хлеб《khleb》'], ['milk', 'молоко《molokó》'], ['meat', 'мясо《myáso》'], ['fruit|fruits', 'фрукт《frukt》/фрукты《frúkty》'],
  ['apple|apples', 'яблоко《yábloko》'], ['coffee', 'кофе《kófe》'], ['egg|eggs', 'яйцо《yaytsó》'],
  // time
  ['day|days', 'день《den\'》'], ['night|nights', 'ночь《noch\'》'], ['morning|mornings', 'утро《útro》'], ['evening|evenings', 'вечер《vécher》'],
  ['week|weeks', 'неделя《nedélya》'], ['month|months', 'месяц《mésyats》'], ['year|years', 'год《god》'], ['hour|hours', 'час《chas》'],
  ['summer', 'лето《léto》'], ['winter', 'зима《zimá》'], ['autumn', 'осень《ósen\'》'], ['century|centuries', 'век《vek》/столетие《stolétiye》'],
  // adjectives
  ['big|large', 'большой《bol\'shóy》'], ['small|tiny', 'маленький《málen\'kiy》'], ['good', 'хороший《khoróshiy》'], ['bad', 'плохой《plokhóy》'], ['new', 'новый《nóvyy》'],
  ['old', 'старый《stáryy》'], ['young', 'молодой《molodóy》'], ['long', 'длинный《dlínnyy》'], ['short', 'короткий《korótkiy》'], ['hot|warm', 'горячий《goryáchiy》/тёплый《tyóplyy》'],
  ['cold', 'холодный《kholódnyy》'], ['happy', 'счастливый《schastlívyy》'], ['sad', 'грустный《grústnyy》'], ['beautiful', 'красивый《krasívyy》'], ['pretty', 'симпатичный《simpatíchnyy》'],
  ['fast|quick', 'быстрый《býstryy》'], ['slow', 'медленный《médlennyy》'], ['easy', 'лёгкий《lyógkiy》'], ['difficult', 'трудный《trúdnyy》/сложный《slózhnyy》'], ['strong', 'сильный《síl\'nyy》'],
  ['important', 'важный《vázhnyy》'], ['popular', 'популярный《populyárnyy》'], ['famous', 'известный《izvéstnyy》/знаменитый《znamenítyy》'],
  // colours
  ['red', 'красный《krásnyy》'], ['blue', 'синий《síniy》/голубой《golubóy》'], ['green', 'зелёный《zelyónyy》'], ['white', 'белый《bélyy》'], ['black', 'чёрный《chórnyy》'], ['yellow', 'жёлтый《zhóltyy》'],
  ['grey|gray', 'серый《séryy》'], ['brown', 'коричневый《koríchnevyy》'], ['pink', 'розовый《rózovyy》'], ['orange', 'оранжевый《oránzhevyy》'],
  // general nouns and adjectives, many of them nearly the same in Russian
  ['species', 'вид《vid》'], ['group|groups', 'группа《grúppa》'], ['part|parts', 'часть《chast\'》'], ['number|numbers', 'число《chisló》/номер《nómer》'],
  ['shape|shapes', 'форма《fórma》'], ['size|sizes', 'размер《razmér》'], ['life', 'жизнь《zhizn\'》'], ['death', 'смерть《smert\'》'], ['skin|skins', 'кожа《kózha》'],
  ['fur', 'мех《mekh》/шерсть《sherst\'》'], ['human|humans', 'человек《chelovék》'], ['adult|adults', 'взрослый《vzróslyy》'], ['health', 'здоровье《zdoróv\'ye》'],
  ['disease|diseases', 'болезнь《bolézn\'》'], ['population|populations', 'население《naseléniye》/популяция《populyátsiya》'], ['habitat|habitats', 'среда《sredá》/ареал《areál》'],
  ['system|systems', 'система《sistéma》'], ['surface|surfaces', 'поверхность《povérkhnost\'》'], ['structure|structures', 'структура《struktúra》'],
  ['region|regions', 'регион《región》/область《óblast\'》'], ['zone|zones', 'зона《zóna》'], ['energy', 'энергия《enérgiya》'], ['climate', 'климат《klímat》'],
  ['history', 'история《istóriya》'], ['science', 'наука《naúka》'], ['problem|problems', 'проблема《probléma》'], ['example|examples', 'пример《primér》'],
  ['image|images', 'изображение《izobrazhéniye》/картинка《kartínka》'], ['type|types', 'тип《tip》/вид《vid》'], ['nature', 'природа《priróda》'], ['culture|cultures', 'культура《kul\'túra》'],
  ['protection', 'защита《zashchíta》/охрана《okhrána》'], ['production', 'производство《proizvódstvo》'], ['information', 'информация《informátsiya》'],
  ['nation|nations', 'народ《naród》/нация《nátsiya》'], ['million|millions', 'миллион《millión》'], ['minute|minutes', 'минута《minúta》'], ['sport|sports', 'спорт《sport》'],
  ['centre|centres|center|centers', 'центр《tsentr》'], ['planet|planets', 'планета《planéta》'], ['ocean|oceans', 'океан《okeán》'],
  ['plant|plants', 'растение《rasténiye》'], ['fish', 'рыба《rýba》'], ['wild', 'дикий《díkiy》'], ['natural', 'природный《priródnyy》/естественный《yestéstvennyy》'], ['central', 'центральный《tsentrál\'nyy》'],
  ['national', 'национальный《natsionál\'nyy》'], ['international', 'международный《mezhdunaródnyy》'], ['high', 'высокий《vysókiy》'], ['low', 'низкий《nízkiy》'],
  ['rare', 'редкий《rédkiy》'], ['common', 'обычный《obýchnyy》/частый《chástyy》'], ['different', 'другой《drugóy》/разный《ráznyy》'], ['possible', 'возможный《vozmózhnyy》'],
  ['normal', 'нормальный《normál\'nyy》'], ['simple', 'простой《prostóy》'], ['modern', 'современный《sovreménnyy》'], ['original', 'оригинальный《originál\'nyy》/первоначальный《pervonachál\'nyy》'], ['true', 'верный《vérnyy》/настоящий《nastoyáshchiy》'],
  ['full', 'полный《pólnyy》'], ['dark', 'тёмный《tyómnyy》'],
];

const RANK_2: Array<[string, string]> = [
  // verbs: the model conjugates them in place, and picks the aspect
  ['eat|eats|ate|eaten|eating', 'есть《yest\'》/съесть《s\'yest\'》'], ['drink|drinks|drank|drinking', 'пить《pit\'》'], ['sleep|sleeps|slept|sleeping', 'спать《spat\'》'],
  ['run|runs|ran|running', 'бежать《bezhát\'》/бегать《bégat\'》'], ['walk|walks|walked|walking', 'ходить《khodít\'》/идти《idtí》'], ['play|plays|played|playing', 'играть《igrát\'》'],
  ['live|lives|lived|living', 'жить《zhit\'》'], ['love|loves|loved|loving', 'любить《lyubít\'》'], ['see|sees|saw|seen|seeing', 'видеть《vídet\'》/увидеть《uvídet\'》'],
  ['go|goes|went|gone|going', 'идти《idtí》/ехать《yékhat\'》'], ['come|comes|came|coming', 'прийти《priytí》/приехать《priyékhat\'》'], ['make|makes|made|making', 'делать《délat\'》/сделать《sdélat\'》'],
  ['give|gives|gave|given|giving', 'дать《dat\'》/давать《davát\'》'], ['take|takes|took|taken|taking', 'взять《vzyat\'》/брать《brat\'》'], ['find|finds|found|finding', 'найти《naytí》/находить《nakhodít\'》'],
  ['buy|buys|bought|buying', 'купить《kupít\'》/покупать《pokupát\'》'], ['sell|sells|sold|selling', 'продать《prodát\'》/продавать《prodavát\'》'], ['begin|begins|began|begun|beginning|start|starts|started|starting', 'начать《nachát\'》/начинать《nachinát\'》'],
  ['finish|finishes|finished|finishing', 'закончить《zakónchit\'》/кончить《kónchit\'》'], ['win|wins|won|winning', 'выиграть《výigrat\'》/побеждать《pobezhdát\'》'], ['lose|loses|lost|losing', 'проиграть《proigrát\'》/потерять《poteryát\'》'],
  ['help|helps|helped|helping', 'помочь《pomóch\'》/помогать《pomogát\'》'], ['want|wants|wanted|wanting', 'хотеть《khotét\'》'], ['think|thinks|thought|thinking', 'думать《dúmat\'》'],
  ['die|dies|died|dying', 'умереть《umerét\'》/умирать《umirát\'》'], ['call|calls|called|calling', 'называть《nazyvát\'》/звонить《zvonít\'》'],
  ['work|works|worked|working', 'работать《rabótat\'》/работа《rabóta》'], ['travel|travels|travelled|traveled|travelling|traveling', 'путешествовать《puteshéstvovat\'》'],
  ['hunt|hunts|hunted|hunting', 'охотиться《okhótit\'sya》/охота《okhóta》'], ['wait|waits|waited|waiting', 'ждать《zhdat\'》'], ['carry|carries|carried|carrying', 'нести《nestí》/носить《nosít\'》'],
  // adverbs
  ['often', 'часто《chásto》'], ['always', 'всегда《vsegdá》'], ['sometimes', 'иногда《inogdá》'], ['today', 'сегодня《sevódnya》'],
  ['now', 'сейчас《seychás》/теперь《tepér\'》'], ['here', 'здесь《zdes\'》/тут《tut》'], ['together', 'вместе《vméste》'], ['quickly', 'быстро《býstro》'], ['early', 'рано《ráno》'], ['late', 'поздно《pózdno》'],
  ['grow|grows|grew|grown|growing', 'расти《rastí》'], ['feed|feeds|fed|feeding', 'кормить《kormít\'》/питаться《pitát\'sya》'],
  ['show|shows|showed|shown|showing', 'показать《pokazát\'》/показывать《pokázyvat\'》'],
  ['change|changes|changed|changing', 'менять《menyát\'》/изменить《izmenít\'》/изменение《izmenéniye》'], ['use|uses|used|using', 'использовать《ispól\'zovat\'》'],
  // small words: the most common of all, so they come after the nouns and are capped like the rest
  ['from', 'из《iz》/от《ot》'], ['for', 'для《dlya》'], ['without', 'без《bez》'],
  ['between', 'между《mézhdu》'], ['after', 'после《pósle》'], ['before', 'до《do》/перед《péred》'], ['under', 'под《pod》'], ['during', 'во《vo》 время《vrémya》'],
  ['some', 'некоторый《nékotoryy》/несколько《néskol\'ko》'], ['many', 'много《mnógo》/многие《mnógiye》'], ['all', 'весь《ves\'》/все《vse》/всё《vsyo》'], ['each|every', 'каждый《kázhdyy》'],
  ['several', 'несколько《néskol\'ko》'], ['few', 'мало《málo》'], ['this|these', 'этот《étot》'], ['they', 'они《oní》'],
  // need endings and say little on their own
  ['same', 'тот《tot》 же《zhe》/одинаковый《odinákovyy》'], ['other', 'другой《drugóy》'],
];

export const RU_EASY_WORDS: EasyWord[] = [
  ...RANK_1.map(([forms, lemma]) => ({ forms, lemma, rank: 1 as const })),
  ...RANK_2.map(([forms, lemma]) => ({ forms, lemma, rank: 2 as const })),
];

// Everyday A1 vocabulary, grouped by theme: the top-up may only weave these
// (plus the lesson's own words), so the extra words stay at the reader's level.
const nouns: Array<[string, string, Gender]> = [
  // people and family
  ['мужчина《muzhchína》', 'man', 'm'], ['женщина《zhénshchina》', 'woman', 'f'], ['ребёнок《rebyónok》', 'child', 'm'], ['мальчик《mál\'chik》', 'boy', 'm'],
  ['девочка《dévochka》', 'girl', 'f'], ['малыш《malýsh》', 'baby, toddler', 'm'], ['друг《drug》', 'friend', 'm'], ['подруга《podrúga》', 'friend (female)', 'f'],
  ['семья《sem\'yá》', 'family', 'f'], ['отец《otéts》', 'father', 'm'], ['мать《mat\'》', 'mother', 'f'], ['брат《brat》', 'brother', 'm'],
  ['сестра《sestrá》', 'sister', 'f'], ['сын《syn》', 'son', 'm'], ['дочь《doch\'》', 'daughter', 'f'], ['человек《chelovék》', 'person, human', 'm'],
  ['родители《rodíteli》', 'parents', 'm'], ['муж《muzh》', 'husband', 'm'], ['жена《zhená》', 'wife', 'f'],
  // body
  ['тело《télo》', 'body', 'n'], ['голова《golová》', 'head', 'f'], ['глаз《glaz》', 'eye', 'm'], ['ухо《úkho》', 'ear', 'n'], ['нос《nos》', 'nose', 'm'],
  ['рот《rot》', 'mouth', 'm'], ['зуб《zub》', 'tooth', 'm'], ['шея《shéya》', 'neck', 'f'], ['спина《spiná》', 'back', 'f'], ['рука《ruká》', 'hand, arm', 'f'],
  ['нога《nogá》', 'leg, foot', 'f'], ['хвост《khvost》', 'tail', 'm'], ['сердце《sérdtse》', 'heart', 'n'], ['шерсть《sherst\'》', 'fur, coat', 'f'], ['волосы《vólosy》', 'hair', 'm'],
  // animals
  ['животное《zhivótnoye》', 'animal', 'n'], ['собака《sobáka》', 'dog', 'f'], ['кошка《kóshka》', 'cat', 'f'], ['лошадь《lóshad\'》', 'horse', 'f'],
  ['птица《ptítsa》', 'bird', 'f'], ['рыба《rýba》', 'fish', 'f'], ['кролик《królik》', 'rabbit', 'm'], ['корова《koróva》', 'cow', 'f'],
  ['овца《ovtsá》', 'sheep', 'f'], ['мышь《mysh\'》', 'mouse', 'f'],
  // home and objects
  ['дом《dom》', 'house, home', 'm'], ['квартира《kvartíra》', 'flat', 'f'], ['комната《kómnata》', 'room', 'f'], ['кухня《kúkhnya》', 'kitchen', 'f'],
  ['дверь《dver\'》', 'door', 'f'], ['окно《oknó》', 'window', 'n'], ['стол《stol》', 'table', 'm'], ['стул《stul》', 'chair', 'm'], ['кровать《krovát\'》', 'bed', 'f'],
  ['сад《sad》', 'garden', 'm'], ['книга《kníga》', 'book', 'f'], ['страница《stranítsa》', 'page', 'f'], ['ручка《rúchka》', 'pen', 'f'], ['фото《fóto》', 'photo', 'n'],
  ['телефон《telefón》', 'phone', 'm'], ['машина《mashína》', 'car', 'f'], ['велосипед《velosipéd》', 'bike', 'm'], ['поезд《póyezd》', 'train', 'm'], ['автобус《avtóbus》', 'bus', 'm'],
  ['самолёт《samolyót》', 'plane', 'm'], ['деньги《dén\'gi》', 'money', 'm'], ['ключ《klyuch》', 'key', 'm'], ['сумка《súmka》', 'bag', 'f'], ['игрушка《igrúshka》', 'toy', 'f'],
  // places
  ['город《górod》', 'town, city', 'm'], ['деревня《derévnya》', 'village', 'f'], ['страна《straná》', 'country', 'f'], ['улица《úlitsa》', 'street', 'f'],
  ['дорога《doróga》', 'road, way', 'f'], ['школа《shkóla》', 'school', 'f'], ['класс《klass》', 'class, classroom', 'm'], ['магазин《magazín》', 'shop', 'm'],
  ['рынок《rýnok》', 'market', 'm'], ['парк《park》', 'park', 'm'], ['пляж《plyazh》', 'beach', 'm'], ['море《móre》', 'sea', 'n'],
  ['гора《gorá》', 'mountain', 'f'], ['поле《póle》', 'field', 'n'], ['лес《les》', 'forest', 'm'], ['река《reká》', 'river', 'f'],
  ['мир《mir》', 'world, peace', 'm'], ['работа《rabóta》', 'work, job', 'f'], ['офис《ófis》', 'office', 'm'],
  // food
  ['вода《vodá》', 'water', 'f'], ['хлеб《khleb》', 'bread', 'm'], ['молоко《molokó》', 'milk', 'n'], ['мясо《myáso》', 'meat', 'n'], ['фрукты《frúkty》', 'fruit', 'm'],
  ['яблоко《yábloko》', 'apple', 'n'], ['кофе《kófe》', 'coffee', 'm'], ['чай《chay》', 'tea', 'm'], ['еда《yedá》', 'food', 'f'], ['яйцо《yaytsó》', 'egg', 'n'],
  // time
  ['день《den\'》', 'day', 'm'], ['ночь《noch\'》', 'night', 'f'], ['утро《útro》', 'morning', 'n'], ['вечер《vécher》', 'evening', 'm'],
  ['неделя《nedélya》', 'week', 'f'], ['месяц《mésyats》', 'month', 'm'], ['год《god》', 'year', 'm'], ['час《chas》', 'hour', 'm'],
  ['минута《minúta》', 'minute', 'f'], ['время《vrémya》', 'time', 'n'], ['век《vek》', 'century', 'm'],
  ['лето《léto》', 'summer', 'n'], ['зима《zimá》', 'winter', 'f'], ['весна《vesná》', 'spring', 'f'], ['осень《ósen\'》', 'autumn', 'f'], ['погода《pogóda》', 'weather', 'f'],
  // things in general
  ['вещь《veshch\'》', 'thing', 'f'], ['имя《ímya》', 'name', 'n'], ['слово《slóvo》', 'word', 'n'], ['вопрос《voprós》', 'question', 'm'],
  ['ответ《otvét》', 'answer', 'm'], ['язык《yazýk》', 'language, tongue', 'm'], ['цвет《tsvet》', 'colour', 'm'], ['размер《razmér》', 'size', 'm'],
  ['вес《ves》', 'weight', 'm'], ['игра《igrá》', 'game', 'f'], ['спорт《sport》', 'sport', 'm'], ['здоровье《zdoróv\'ye》', 'health', 'n'],
  ['проблема《probléma》', 'problem', 'f'], ['пример《primér》', 'example', 'm'], ['часть《chast\'》', 'part', 'f'],
];

const verbs: Array<[string, string]> = [
  ['быть《byt\'》', 'to be'], ['идти《idtí》', 'to go (on foot)'], ['ехать《yékhat\'》', 'to go (by vehicle)'], ['прийти《priytí》', 'to come'],
  ['делать《délat\'》', 'to do, make'], ['сказать《skazát\'》', 'to say'], ['говорить《govorít\'》', 'to speak'], ['видеть《vídet\'》', 'to see'], ['слышать《slýshat\'》', 'to hear'],
  ['слушать《slúshat\'》', 'to listen'], ['знать《znat\'》', 'to know'], ['понимать《ponimát\'》', 'to understand'],
  ['мочь《moch\'》', 'can, to be able'], ['хотеть《khotét\'》', 'to want'], ['любить《lyubít\'》', 'to love, like'],
  ['есть《yest\'》', 'to eat'], ['пить《pit\'》', 'to drink'], ['спать《spat\'》', 'to sleep'], ['бежать《bezhát\'》', 'to run'],
  ['прыгать《prýgat\'》', 'to jump'], ['играть《igrát\'》', 'to play'], ['жить《zhit\'》', 'to live'],
  ['работать《rabótat\'》', 'to work'], ['дать《dat\'》', 'to give'], ['взять《vzyat\'》', 'to take'], ['нести《nestí》', 'to carry'], ['купить《kupít\'》', 'to buy'],
  ['продать《prodát\'》', 'to sell'], ['найти《naytí》', 'to find'], ['искать《iskát\'》', 'to look for'], ['положить《polozhít\'》', 'to put, lay'], ['открыть《otkrýt\'》', 'to open'],
  ['закрыть《zakrýt\'》', 'to close'], ['начать《nachát\'》', 'to begin'], ['закончить《zakónchit\'》', 'to finish'], ['лететь《letét\'》', 'to fly'], ['плавать《plávat\'》', 'to swim'],
  ['путешествовать《puteshéstvovat\'》', 'to travel'], ['остаться《ostát\'sya》', 'to stay'], ['читать《chitát\'》', 'to read'], ['писать《pisát\'》', 'to write'], ['ответить《otvétit\'》', 'to answer'],
  ['звонить《zvonít\'》', 'to call'], ['помочь《pomóch\'》', 'to help'], ['ждать《zhdat\'》', 'to wait'], ['думать《dúmat\'》', 'to think'], ['верить《vérit\'》', 'to believe'],
  ['умереть《umerét\'》', 'to die'], ['расти《rastí》', 'to grow'], ['использовать《ispól\'zovat\'》', 'to use'], ['показать《pokazát\'》', 'to show'], ['изменить《izmenít\'》', 'to change'],
  ['выиграть《výigrat\'》', 'to win'], ['проиграть《proigrát\'》', 'to lose'],
];

const adjectives: Array<[string, string]> = [
  ['хороший《khoróshiy》', 'good'], ['плохой《plokhóy》', 'bad'], ['большой《bol\'shóy》', 'big'], ['маленький《málen\'kiy》', 'small'], ['толстый《tólstyy》', 'fat, thick'],
  ['тонкий《tónkiy》', 'thin'], ['длинный《dlínnyy》', 'long'], ['короткий《korótkiy》', 'short'], ['высокий《vysókiy》', 'high, tall'], ['низкий《nízkiy》', 'low'],
  ['красивый《krasívyy》', 'beautiful'], ['симпатичный《simpatíchnyy》', 'pretty, nice'], ['новый《nóvyy》', 'new'], ['старый《stáryy》', 'old'], ['молодой《molodóy》', 'young'],
  ['быстрый《býstryy》', 'fast'], ['медленный《médlennyy》', 'slow'], ['сильный《síl\'nyy》', 'strong'], ['слабый《slábyy》', 'weak'], ['лёгкий《lyógkiy》', 'easy, light'],
  ['трудный《trúdnyy》', 'difficult'], ['тяжёлый《tyazhólyy》', 'heavy'], ['горячий《goryáchiy》', 'hot'], ['тёплый《tyóplyy》', 'warm'], ['холодный《kholódnyy》', 'cold'], ['мягкий《myágkiy》', 'soft'], ['спокойный《spokóynyy》', 'calm, quiet'],
  ['счастливый《schastlívyy》', 'happy'], ['грустный《grústnyy》', 'sad'], ['добрый《dóbryy》', 'kind'], ['умный《úmnyy》', 'clever'], ['больной《bol\'nóy》', 'ill'],
  ['одинаковый《odinákovyy》', 'same'], ['другой《drugóy》', 'other'], ['первый《pérvyy》', 'first'], ['последний《poslédniy》', 'last'],
  ['важный《vázhnyy》', 'important'], ['любимый《lyubímyy》', 'favourite'], ['известный《izvéstnyy》', 'famous'], ['английский《anglíyskiy》', 'English'],
  ['русский《rússkiy》', 'Russian'], ['белый《bélyy》', 'white'], ['чёрный《chórnyy》', 'black'], ['красный《krásnyy》', 'red'], ['синий《síniy》', 'blue'], ['зелёный《zelyónyy》', 'green'],
  ['жёлтый《zhóltyy》', 'yellow'], ['серый《séryy》', 'grey'], ['коричневый《koríchnevyy》', 'brown'],
];

const others: Array<[string, string]> = [
  ['и《i》', 'and'], ['или《íli》', 'or'], ['но《no》', 'but'], ['потому《potomú》 что《chto》', 'because'], ['когда《kogdá》', 'when'], ['если《yésli》', 'if'], ['что《chto》', 'that, what'],
  ['с《s》', 'with'], ['без《bez》', 'without'], ['для《dlya》', 'for'], ['в《v》', 'in'], ['на《na》', 'on'], ['под《pod》', 'under'],
  ['между《mézhdu》', 'between'], ['перед《péred》', 'in front of, before'], ['после《pósle》', 'after'], ['у《u》', "at (someone's), near"],
  ['очень《óchen\'》', 'very'], ['много《mnógo》', 'a lot, much'], ['мало《málo》', 'little, few'], ['тоже《tózhe》', 'also'],
  ['снова《snóva》', 'again'], ['ещё《yeshchó》', 'still, more'], ['всегда《vsegdá》', 'always'], ['никогда《nikogdá》', 'never'], ['часто《chásto》', 'often'],
  ['иногда《inogdá》', 'sometimes'], ['сейчас《seychás》', 'now'], ['сегодня《sevódnya》', 'today'], ['завтра《závtra》', 'tomorrow'], ['вчера《vcherá》', 'yesterday'],
  ['скоро《skóro》', 'soon'], ['поздно《pózdno》', 'late'], ['здесь《zdes\'》', 'here'], ['там《tam》', 'there'],
  ['как《kak》', 'how'], ['почему《pochemú》', 'why'], ['где《gde》', 'where'], ['кто《kto》', 'who'],
  ['все《vse》', 'all, everyone'], ['каждый《kázhdyy》', 'each, every'], ['несколько《néskol\'ko》', 'several'], ['да《da》', 'yes'], ['нет《net》', 'no'],
];

export const RU_A1_WORDS: A1Word[] = [
  ...nouns.map(([lemma, en, g]) => ({ lemma, en, g })),
  ...[...verbs, ...adjectives, ...others].map(([lemma, en]) => ({ lemma, en })),
];
