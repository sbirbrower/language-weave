import type { A1Word } from '../a1';
import type { EasyWord } from '../easy';

// Korean counterparts of the French lists in `easy.ts` and `a1.ts`, with readings (src/ruby.ts). Korean has
// no gender. Nouns without particles or 들, verbs and adjectives in their dictionary form in -다 (the model
// puts them in the form the sentence needs), and a few determiners that only stand before a noun (새, 모든,
// 다른). Left out of the French list's small words: is, are, was and were (이다 joins the noun), has and had
// (있다 needs a particle on both nouns), from, for, without, between, after, before, under and during (each
// a particle or a word after the noun: 에서, 을 위해, 없이, 사이에, 후에, 전에, 밑에, 동안), few (몇 needs a
// counter), and never (절대 needs a negative verb).

// Easy words: the same English as the French list, so both find the same places.
const RANK_1: Array<[string, string]> = [
  // people
  ['man|men', '남자《namja》'], ['woman|women', '여자《yeoja》'], ['child|children', '아이《ai》/어린이《eorini》'],
  ['boy|boys', '남자아이《namjaai》/소년《sonyeon》'], ['girl|girls', '여자아이《yeojaai》/소녀《sonyeo》'], ['baby|babies', '아기《agi》'], ['friend|friends', '친구《chingu》'],
  ['family|families', '가족《gajok》'], ['father|fathers', '아버지《abeoji》/아빠《appa》'], ['mother|mothers', '어머니《eomeoni》/엄마《eomma》'],
  ['brother|brothers', '형《hyeong》/오빠《oppa》/남동생《namdongsaeng》'], ['sister|sisters', '누나《nuna》/언니《eonni》/여동생《yeodongsaeng》'], ['son|sons', '아들《adeul》'], ['daughter|daughters', '딸《ttal》'],
  ['husband|husbands', '남편《nampyeon》'], ['wife|wives', '아내《anae》'], ['people', '사람들《saramdeul》'], ['person', '사람《saram》'],
  ['king|kings', '왕《wang》'], ['queen|queens', '여왕《yeowang》'],
  // animals
  ['animal|animals', '동물《dongmul》'], ['dog|dogs', '개《gae》'], ['cat|cats', '고양이《goyangi》'], ['horse|horses', '말《mal》'],
  ['bird|birds', '새《sae》'], ['rabbit|rabbits', '토끼《tokki》'], ['cow|cows', '소《so》'], ['sheep', '양《yang》'],
  ['mouse|mice', '쥐《jwi》'],
  // body
  ['head|heads', '머리《meori》'], ['eye|eyes', '눈《nun》'], ['ear|ears', '귀《gwi》'], ['nose|noses', '코《ko》'], ['mouth', '입《ip》'],
  ['hand|hands', '손《son》'], ['foot|feet', '발《bal》'], ['leg|legs', '다리《dari》'], ['heart|hearts', '심장《simjang》/마음《maeum》'],
  ['tail|tails', '꼬리《kkori》'], ['body|bodies', '몸《mom》'], ['hair', '머리카락《meorikarak》/털《teol》'],
  // home and things
  ['house|houses', '집《jip》'], ['home', '집《jip》'], ['door|doors', '문《mun》'], ['window|windows', '창문《changmun》'],
  ['table|tables', '탁자《takja》/식탁《siktak》'], ['bed|beds', '침대《chimdae》'], ['garden|gardens', '정원《jeongwon》'], ['car|cars', '차《cha》/자동차《jadongcha》'],
  ['bicycle|bicycles|bike|bikes', '자전거《jajeongeo》'], ['train|trains', '기차《gicha》'], ['boat|boats', '배《bae》'],
  ['plane|planes|aircraft', '비행기《bihaenggi》'], ['book|books', '책《chaek》'], ['letter|letters', '편지《pyeonji》/글자《geulja》'],
  ['money', '돈《don》'], ['photo|photos|photograph|photographs', '사진《sajin》'], ['film|films|movie|movies', '영화《yeonghwa》'],
  ['music', '음악《eumak》'], ['song|songs', '노래《norae》'], ['game|games', '게임《geim》/경기《gyeonggi》'], ['name|names', '이름《ireum》'],
  ['colour|colours|color|colors', '색《saek》/색깔《saekkkal》'], ['school|schools', '학교《hakgyo》'],
  // places and nature
  ['city|cities', '도시《dosi》'], ['town|towns', '도시《dosi》/마을《maeul》'], ['village|villages', '마을《maeul》'], ['country|countries', '나라《nara》'],
  ['world', '세계《segye》/세상《sesang》'], ['street|streets', '길《gil》/거리《geori》'], ['road|roads', '도로《doro》/길《gil》'], ['shop|shops', '가게《gage》'],
  ['sea|seas', '바다《bada》'], ['river|rivers', '강《gang》'], ['mountain|mountains', '산《san》'], ['island|islands', '섬《seom》'],
  ['beach|beaches', '해변《haebyeon》'], ['forest|forests', '숲《sup》'], ['tree|trees', '나무《namu》'], ['flower|flowers', '꽃《kkot》'],
  ['sun', '해《hae》/태양《taeyang》'], ['moon', '달《dal》'], ['star|stars', '별《byeol》'], ['sky', '하늘《haneul》'], ['snow', '눈《nun》'], ['rain', '비《bi》'],
  ['water', '물《mul》'], ['fire', '불《bul》'],
  // food
  ['food', '음식《eumsik》'], ['bread', '빵《ppang》'], ['milk', '우유《uyu》'], ['meat', '고기《gogi》'], ['fruit|fruits', '과일《gwail》'],
  ['apple|apples', '사과《sagwa》'], ['coffee', '커피《keopi》'], ['egg|eggs', '달걀《dalgyal》/계란《gyeran》'],
  // time
  ['day|days', '날《nal》/하루《haru》'], ['night|nights', '밤《bam》'], ['morning|mornings', '아침《achim》'], ['evening|evenings', '저녁《jeonyeok》'],
  ['week|weeks', '주《ju》/일주일《iljuil》'], ['month|months', '달《dal》'], ['year|years', '해《hae》/년《nyeon》'], ['hour|hours', '시간《sigan》'],
  ['summer', '여름《yeoreum》'], ['winter', '겨울《gyeoul》'], ['autumn', '가을《gaeul》'], ['century|centuries', '세기《segi》'],
  // adjectives
  ['big|large', '크다《keuda》'], ['small|tiny', '작다《jakda》'], ['good', '좋다《jota》'], ['bad', '나쁘다《nappeuda》'], ['new', '새《sae》/새롭다《saeropda》'],
  ['old', '오래되다《oraedoeda》/늙다《neukda》'], ['young', '젊다《jeomda》'], ['long', '길다《gilda》'], ['short', '짧다《jjalda》'], ['hot|warm', '덥다《deopda》/뜨겁다《tteugeopda》/따뜻하다《ttatteutada》'],
  ['cold', '춥다《chupda》/차갑다《chagapda》'], ['happy', '행복하다《haengbokada》'], ['sad', '슬프다《seulpeuda》'], ['beautiful', '아름답다《areumdapda》'], ['pretty', '예쁘다《yeppeuda》'],
  ['fast|quick', '빠르다《ppareuda》'], ['slow', '느리다《neurida》'], ['easy', '쉽다《swipda》'], ['difficult', '어렵다《eoryeopda》'], ['strong', '강하다《ganghada》/세다《seda》'],
  ['important', '중요하다《jungyohada》'], ['popular', '인기《ingi》 있다《itda》'], ['famous', '유명하다《yumyeonghada》'],
  // colours
  ['red', '빨갛다《ppalgata》/빨간색《ppalgansaek》'], ['blue', '파랗다《parata》/파란색《paransaek》'], ['green', '초록색《choroksaek》'], ['white', '하얗다《hayata》/흰색《huinsaek》'],
  ['black', '까맣다《kkamata》/검은색《geomeunsaek》'], ['yellow', '노랗다《norata》/노란색《noransaek》'],
  ['grey|gray', '회색《hoesaek》'], ['brown', '갈색《galsaek》'], ['pink', '분홍색《bunhongsaek》'], ['orange', '주황색《juhwangsaek》'],
  // general nouns and adjectives
  ['species', '종《jong》'], ['group|groups', '무리《muri》/집단《jipdan》'], ['part|parts', '부분《bubun》'], ['number|numbers', '숫자《sutja》/수《su》'],
  ['shape|shapes', '모양《moyang》'], ['size|sizes', '크기《keugi》'], ['life', '삶《sam》/생명《saengmyeong》'], ['death', '죽음《jugeum》'],
  ['skin|skins', '피부《pibu》'], ['fur', '털《teol》'], ['human|humans', '인간《ingan》'], ['adult|adults', '어른《eoreun》/성인《seongin》'],
  ['health', '건강《geongang》'], ['disease|diseases', '병《byeong》/질병《jilbyeong》'], ['population|populations', '인구《ingu》'],
  ['habitat|habitats', '서식지《seosikji》'], ['system|systems', '체계《chegye》/시스템《siseutem》'], ['surface|surfaces', '표면《pyomyeon》'],
  ['structure|structures', '구조《gujo》'], ['region|regions', '지역《jiyeok》'], ['zone|zones', '구역《guyeok》/지역《jiyeok》'], ['energy', '에너지《eneoji》'],
  ['climate', '기후《gihu》'], ['history', '역사《yeoksa》'], ['science', '과학《gwahak》'], ['problem|problems', '문제《munje》'],
  ['example|examples', '예《ye》/예시《yesi》'], ['image|images', '이미지《imiji》/그림《geurim》'], ['type|types', '종류《jongnyu》'], ['nature', '자연《jayeon》'],
  ['culture|cultures', '문화《munhwa》'], ['protection', '보호《boho》'], ['production', '생산《saengsan》'], ['information', '정보《jeongbo》'],
  ['nation|nations', '국가《gukga》/민족《minjok》'], ['million|millions', '백만《baengman》'], ['minute|minutes', '분《bun》'], ['sport|sports', '스포츠《seupocheu》/운동《undong》'],
  ['centre|centres|center|centers', '중심《jungsim》/센터《senteo》'], ['planet|planets', '행성《haengseong》'], ['ocean|oceans', '바다《bada》/대양《daeyang》'],
  ['plant|plants', '식물《singmul》'], ['fish', '물고기《mulgogi》/생선《saengseon》'], ['wild', '야생《yasaeng》'], ['natural', '자연스럽다《jayeonseureopda》/자연의《jayeonui》'],
  ['central', '중앙《jungang》/중심《jungsim》'], ['national', '국가《gukga》/국립《gungnip》'], ['international', '국제《gukje》/국제적《gukjejeok》'], ['high', '높다《nopda》'],
  ['low', '낮다《natda》'], ['rare', '드물다《deumulda》/희귀하다《huigwihada》'], ['common', '흔하다《heunhada》'], ['different', '다르다《dareuda》'], ['possible', '가능하다《ganeunghada》'],
  ['normal', '보통《botong》/정상《jeongsang》'], ['simple', '간단하다《gandanhada》'], ['modern', '현대《hyeondae》/현대적《hyeondaejeok》'], ['original', '원래《wollae》/독창적《dokchangjeok》'],
  ['true', '사실《sasil》/진짜《jinjja》'], ['full', '가득하다《gadeukada》'], ['dark', '어둡다《eodupda》'],
];

const RANK_2: Array<[string, string]> = [
  // verbs: the model puts them in the form the English needs
  ['eat|eats|ate|eaten|eating', '먹다《meokda》'], ['drink|drinks|drank|drinking', '마시다《masida》'], ['sleep|sleeps|slept|sleeping', '자다《jada》'],
  ['run|runs|ran|running', '달리다《dallida》/뛰다《ttwida》'], ['walk|walks|walked|walking', '걷다《geotda》'], ['play|plays|played|playing', '놀다《nolda》'],
  ['live|lives|lived|living', '살다《salda》'], ['love|loves|loved|loving', '사랑하다《saranghada》/좋아하다《joahada》'], ['see|sees|saw|seen|seeing', '보다《boda》'],
  ['go|goes|went|gone|going', '가다《gada》'], ['come|comes|came|coming', '오다《oda》'], ['make|makes|made|making', '만들다《mandeulda》'],
  ['give|gives|gave|given|giving', '주다《juda》'], ['take|takes|took|taken|taking', '가져가다《gajyeogada》/받다《batda》'], ['find|finds|found|finding', '찾다《chatda》'],
  ['buy|buys|bought|buying', '사다《sada》'], ['sell|sells|sold|selling', '팔다《palda》'],
  ['begin|begins|began|begun|beginning|start|starts|started|starting', '시작하다《sijakada》'],
  ['finish|finishes|finished|finishing', '끝나다《kkeunnada》/끝내다《kkeunnaeda》'], ['win|wins|won|winning', '이기다《igida》'], ['lose|loses|lost|losing', '지다《jida》/잃다《ilta》'],
  ['help|helps|helped|helping', '돕다《dopda》'], ['want|wants|wanted|wanting', '원하다《wonhada》'], ['think|thinks|thought|thinking', '생각하다《saenggakada》'],
  ['become|becomes|became|becoming', '되다《doeda》'], ['die|dies|died|dying', '죽다《jukda》'], ['call|calls|called|calling', '부르다《bureuda》/전화하다《jeonhwahada》'],
  ['work|works|worked|working', '일하다《ilhada》/일《il》'], ['travel|travels|travelled|traveled|travelling|traveling', '여행하다《yeohaenghada》'],
  ['hunt|hunts|hunted|hunting', '사냥하다《sanyanghada》/사냥《sanyang》'], ['wait|waits|waited|waiting', '기다리다《gidarida》'], ['carry|carries|carried|carrying', '나르다《nareuda》/들다《deulda》'],
  // adverbs
  ['often', '자주《jaju》'], ['always', '항상《hangsang》/늘《neul》'], ['sometimes', '가끔《gakkeum》'], ['today', '오늘《oneul》'],
  ['now', '지금《jigeum》'], ['here', '여기《yeogi》'], ['together', '같이《gachi》/함께《hamkke》'], ['quickly', '빨리《ppalli》'], ['early', '일찍《iljjik》'], ['late', '늦게《neutge》'],
  ['grow|grows|grew|grown|growing', '자라다《jarada》'], ['feed|feeds|fed|feeding', '먹이다《meogida》'],
  ['move|moves|moved|moving', '움직이다《umjigida》/옮기다《omgida》'], ['show|shows|showed|shown|showing', '보여주다《boyeojuda》'],
  ['change|changes|changed|changing', '바꾸다《bakkuda》/바뀌다《bakkwida》'], ['use|uses|used|using', '쓰다《sseuda》/사용하다《sayonghada》'],
  // small words: the most common of all, so they come after the nouns and are capped like the rest
  ['some', '몇몇《myeonmyeot》'], ['many', '많다《manta》/많은《maneun》'], ['all', '모든《modeun》'], ['each|every', '모든《modeun》/각《gak》'],
  ['several', '여러《yeoreo》'], ['this|these', '이《i》'], ['they', '그들《geudeul》'],
  // stand before the noun and say little on their own
  ['same', '같다《gatda》/같은《gateun》'], ['other', '다른《dareun》'],
];

export const KO_EASY_WORDS: EasyWord[] = [
  ...RANK_1.map(([forms, lemma]) => ({ forms, lemma, rank: 1 as const })),
  ...RANK_2.map(([forms, lemma]) => ({ forms, lemma, rank: 2 as const })),
];

// Everyday A1 vocabulary, grouped by theme: the top-up may only weave these
// (plus the lesson's own words), so the extra words stay at the reader's level.
const nouns: Array<[string, string]> = [
  // people and family
  ['남자《namja》', 'man'], ['여자《yeoja》', 'woman'], ['아이《ai》', 'child'], ['아기《agi》', 'baby'], ['친구《chingu》', 'friend'],
  ['가족《gajok》', 'family'], ['아버지《abeoji》', 'father'], ['어머니《eomeoni》', 'mother'], ['부모님《bumonim》', 'parents'],
  ['형《hyeong》', 'older brother (of a man)'], ['오빠《oppa》', 'older brother (of a woman)'], ['누나《nuna》', 'older sister (of a man)'], ['언니《eonni》', 'older sister (of a woman)'],
  ['동생《dongsaeng》', 'younger brother or sister'], ['아들《adeul》', 'son'], ['딸《ttal》', 'daughter'], ['남편《nampyeon》', 'husband'], ['아내《anae》', 'wife'],
  ['사람《saram》', 'person'], ['선생님《seonsaengnim》', 'teacher'], ['학생《haksaeng》', 'student'], ['의사《uisa》', 'doctor'],
  // body
  ['몸《mom》', 'body'], ['머리《meori》', 'head, hair'], ['눈《nun》', 'eye'], ['귀《gwi》', 'ear'], ['코《ko》', 'nose'], ['입《ip》', 'mouth'],
  ['이《i》', 'tooth'], ['목《mok》', 'neck, throat'], ['등《deung》', 'back'], ['손《son》', 'hand'], ['팔《pal》', 'arm'], ['다리《dari》', 'leg'],
  ['발《bal》', 'foot'], ['배《bae》', 'stomach'], ['꼬리《kkori》', 'tail'],
  // animals
  ['동물《dongmul》', 'animal'], ['개《gae》', 'dog'], ['고양이《goyangi》', 'cat'], ['말《mal》', 'horse'], ['새《sae》', 'bird'],
  ['물고기《mulgogi》', 'fish'], ['토끼《tokki》', 'rabbit'], ['소《so》', 'cow'], ['돼지《dwaeji》', 'pig'], ['쥐《jwi》', 'mouse'],
  // home and objects
  ['집《jip》', 'house, home'], ['아파트《apateu》', 'flat'], ['방《bang》', 'room'], ['부엌《bueok》', 'kitchen'], ['화장실《hwajangsil》', 'toilet, bathroom'],
  ['문《mun》', 'door'], ['창문《changmun》', 'window'], ['책상《chaeksang》', 'desk'], ['의자《uija》', 'chair'], ['침대《chimdae》', 'bed'],
  ['책《chaek》', 'book'], ['펜《pen》', 'pen'], ['가방《gabang》', 'bag'], ['사진《sajin》', 'photo'], ['전화《jeonhwa》', 'phone'], ['휴대폰《hyudaepon》', 'mobile phone'],
  ['차《cha》', 'car, tea'], ['자전거《jajeongeo》', 'bike'], ['버스《beoseu》', 'bus'], ['지하철《jihacheol》', 'underground'], ['기차《gicha》', 'train'],
  ['돈《don》', 'money'], ['열쇠《yeolsoe》', 'key'], ['옷《ot》', 'clothes'], ['우산《usan》', 'umbrella'],
  // places
  ['도시《dosi》', 'city'], ['마을《maeul》', 'village'], ['나라《nara》', 'country'], ['길《gil》', 'road, way'], ['학교《hakgyo》', 'school'],
  ['회사《hoesa》', 'company, office'], ['가게《gage》', 'shop'], ['시장《sijang》', 'market'], ['식당《sikdang》', 'restaurant'], ['병원《byeongwon》', 'hospital'],
  ['은행《eunhaeng》', 'bank'], ['역《yeok》', 'station'], ['공원《gongwon》', 'park'], ['바다《bada》', 'sea'], ['산《san》', 'mountain'],
  ['강《gang》', 'river'], ['숲《sup》', 'forest'], ['세계《segye》', 'world'], ['일《il》', 'work, job'],
  // food
  ['물《mul》', 'water'], ['밥《bap》', 'rice, meal'], ['빵《ppang》', 'bread'], ['우유《uyu》', 'milk'], ['고기《gogi》', 'meat'], ['과일《gwail》', 'fruit'],
  ['사과《sagwa》', 'apple'], ['커피《keopi》', 'coffee'], ['김치《gimchi》', 'kimchi'], ['음식《eumsik》', 'food'], ['계란《gyeran》', 'egg'], ['채소《chaeso》', 'vegetable'],
  // time
  ['날《nal》', 'day'], ['오늘《oneul》', 'today'], ['내일《naeil》', 'tomorrow'], ['어제《eoje》', 'yesterday'], ['아침《achim》', 'morning, breakfast'],
  ['점심《jeomsim》', 'lunch'], ['저녁《jeonyeok》', 'evening, dinner'], ['밤《bam》', 'night'], ['주말《jumal》', 'weekend'], ['시간《sigan》', 'time, hour'],
  ['날씨《nalssi》', 'weather'], ['여름《yeoreum》', 'summer'], ['겨울《gyeoul》', 'winter'], ['생일《saengil》', 'birthday'],
  // things in general
  ['것《geot》', 'thing'], ['이름《ireum》', 'name'], ['말《mal》', 'word, speech'], ['질문《jilmun》', 'question'], ['한국어《hangugeo》', 'Korean (language)'],
  ['영어《yeongeo》', 'English (language)'], ['색《saek》', 'colour'], ['게임《geim》', 'game'], ['영화《yeonghwa》', 'film'], ['음악《eumak》', 'music'],
  ['문제《munje》', 'problem'], ['감기《gamgi》', 'cold (illness)'],
];

const verbs: Array<[string, string]> = [
  ['이다《ida》', 'to be (a noun)'], ['있다《itda》', 'to be (somewhere), to have'], ['없다《eopda》', 'not to be, not to have'], ['하다《hada》', 'to do'],
  ['가다《gada》', 'to go'], ['오다《oda》', 'to come'], ['말하다《malhada》', 'to say, speak'], ['보다《boda》', 'to see, watch'], ['듣다《deutda》', 'to hear, listen'],
  ['묻다《mutda》', 'to ask'], ['알다《alda》', 'to know'], ['모르다《moreuda》', 'not to know'], ['배우다《baeuda》', 'to learn'], ['공부하다《gongbuhada》', 'to study'],
  ['읽다《ikda》', 'to read'], ['쓰다《sseuda》', 'to write, use'], ['원하다《wonhada》', 'to want'], ['좋아하다《joahada》', 'to like'],
  ['먹다《meokda》', 'to eat'], ['마시다《masida》', 'to drink'], ['자다《jada》', 'to sleep'], ['일어나다《ireonada》', 'to get up'], ['앉다《anda》', 'to sit'],
  ['달리다《dallida》', 'to run'], ['놀다《nolda》', 'to play'], ['살다《salda》', 'to live'], ['일하다《ilhada》', 'to work'], ['주다《juda》', 'to give'],
  ['받다《batda》', 'to receive'], ['사다《sada》', 'to buy'], ['팔다《palda》', 'to sell'], ['찾다《chatda》', 'to look for, find'], ['열다《yeolda》', 'to open'],
  ['닫다《datda》', 'to close'], ['시작하다《sijakada》', 'to begin'], ['수영하다《suyeonghada》', 'to swim'], ['기다리다《gidarida》', 'to wait'],
  ['생각하다《saenggakada》', 'to think'], ['만나다《mannada》', 'to meet'], ['쉬다《swida》', 'to rest'], ['만들다《mandeulda》', 'to make'], ['돌아오다《doraoda》', 'to come back'],
];

const adjectives: Array<[string, string]> = [
  ['좋다《jota》', 'good'], ['나쁘다《nappeuda》', 'bad'], ['크다《keuda》', 'big, tall'], ['작다《jakda》', 'small, short'], ['길다《gilda》', 'long'],
  ['짧다《jjalda》', 'short'], ['높다《nopda》', 'high'], ['싸다《ssada》', 'cheap'], ['비싸다《bissada》', 'expensive'], ['새롭다《saeropda》', 'new'],
  ['오래되다《oraedoeda》', 'old (things)'], ['젊다《jeomda》', 'young'], ['빠르다《ppareuda》', 'fast'], ['느리다《neurida》', 'slow'], ['쉽다《swipda》', 'easy'],
  ['어렵다《eoryeopda》', 'difficult'], ['덥다《deopda》', 'hot (weather)'], ['춥다《chupda》', 'cold (weather)'], ['행복하다《haengbokada》', 'happy'], ['슬프다《seulpeuda》', 'sad'],
  ['예쁘다《yeppeuda》', 'pretty'], ['맛있다《masitda》', 'tasty'], ['바쁘다《bappeuda》', 'busy'], ['깨끗하다《kkaekkeutada》', 'clean'], ['재미있다《jaemiitda》', 'fun, interesting'],
  ['중요하다《jungyohada》', 'important'], ['유명하다《yumyeonghada》', 'famous'], ['많다《manta》', 'many, much'], ['아프다《apeuda》', 'ill, sore'],
  ['빨갛다《ppalgata》', 'red'], ['파랗다《parata》', 'blue'], ['노랗다《norata》', 'yellow'], ['하얗다《hayata》', 'white'], ['까맣다《kkamata》', 'black'],
];

const others: Array<[string, string]> = [
  ['그리고《geurigo》', 'and'], ['하지만《hajiman》', 'but'], ['그래서《geuraeseo》', 'so'], ['언제《eonje》', 'when?'], ['아주《aju》', 'very'],
  ['조금《jogeum》', 'a little'], ['더《deo》', 'more'], ['또《tto》', 'again, also'], ['지금《jigeum》', 'now'], ['항상《hangsang》', 'always'],
  ['가끔《gakkeum》', 'sometimes'], ['자주《jaju》', 'often'], ['여기《yeogi》', 'here'], ['거기《geogi》', 'there'], ['어디《eodi》', 'where'],
  ['누구《nugu》', 'who'], ['뭐《mwo》', 'what'], ['왜《wae》', 'why'], ['어떻게《eotteoke》', 'how'], ['모든《modeun》', 'all, every'],
  ['네《ne》', 'yes'], ['아니요《aniyo》', 'no'], ['안《an》', 'not'], ['같이《gachi》', 'together'], ['정말《jeongmal》', 'really'],
];

export const KO_A1_WORDS: A1Word[] = [...nouns, ...verbs, ...adjectives, ...others].map(([lemma, en]) => ({ lemma, en }));
