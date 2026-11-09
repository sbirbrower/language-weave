import type { A1Word } from '../a1';
import type { EasyWord } from '../easy';

// Japanese counterparts of the French lists in `easy.ts` and `a1.ts`, with readings (src/ruby.ts).
// Verbs and い-adjectives are in the dictionary form, な-adjectives without な. Japanese has no
// gender. The French list's small words (is, from, for, between) are left out: their Japanese
// is a particle or an ending, which can't stand in an English sentence.

// Easy words: the same English as the French list, so both find the same places.
const RANK_1: Array<[string, string]> = [
  // people
  ['man|men', '男《おとこ》の人《ひと》/男性《だんせい》'], ['woman|women', '女《おんな》の人《ひと》/女性《じょせい》'], ['child|children', '子供《こども》'],
  ['boy|boys', '男《おとこ》の子《こ》'], ['girl|girls', '女《おんな》の子《こ》'], ['baby|babies', '赤《あか》ちゃん'], ['friend|friends', '友達《ともだち》'],
  ['family|families', '家族《かぞく》'], ['father|fathers', '父《ちち》/お父《とう》さん'], ['mother|mothers', '母《はは》/お母《かあ》さん'],
  ['brother|brothers', '兄弟《きょうだい》/兄《あに》/弟《おとうと》'], ['sister|sisters', '姉《あね》/妹《いもうと》'], ['son|sons', '息子《むすこ》'],
  ['daughter|daughters', '娘《むすめ》'], ['husband|husbands', '夫《おっと》'], ['wife|wives', '妻《つま》'], ['people', '人々《ひとびと》/人《ひと》'],
  ['person', '人《ひと》'], ['king|kings', '王《おう》'], ['queen|queens', '女王《じょおう》'],
  // animals
  ['animal|animals', '動物《どうぶつ》'], ['dog|dogs', '犬《いぬ》'], ['cat|cats', '猫《ねこ》'], ['horse|horses', '馬《うま》'],
  ['bird|birds', '鳥《とり》'], ['rabbit|rabbits', 'ウサギ'], ['cow|cows', '牛《うし》'], ['sheep', '羊《ひつじ》'], ['mouse|mice', 'ネズミ'],
  // body
  ['head|heads', '頭《あたま》'], ['eye|eyes', '目《め》'], ['ear|ears', '耳《みみ》'], ['nose|noses', '鼻《はな》'], ['mouth', '口《くち》'],
  ['hand|hands', '手《て》'], ['foot|feet', '足《あし》'], ['leg|legs', '足《あし》'], ['heart|hearts', '心臓《しんぞう》/心《こころ》'],
  ['tail|tails', '尾《お》/しっぽ'], ['body|bodies', '体《からだ》'], ['hair', '髪《かみ》/毛《け》'],
  // home and things
  ['house|houses', '家《いえ》'], ['home', '家《いえ》'], ['door|doors', 'ドア'], ['window|windows', '窓《まど》'],
  ['table|tables', 'テーブル/机《つくえ》'], ['bed|beds', 'ベッド'], ['garden|gardens', '庭《にわ》'], ['car|cars', '車《くるま》'],
  ['bicycle|bicycles|bike|bikes', '自転車《じてんしゃ》'], ['train|trains', '電車《でんしゃ》/列車《れっしゃ》'], ['boat|boats', '船《ふね》/ボート'],
  ['plane|planes|aircraft', '飛行機《ひこうき》'], ['book|books', '本《ほん》'], ['letter|letters', '手紙《てがみ》/文字《もじ》'], ['money', 'お金《かね》'],
  ['photo|photos|photograph|photographs', '写真《しゃしん》'], ['film|films|movie|movies', '映画《えいが》'], ['music', '音楽《おんがく》'],
  ['song|songs', '歌《うた》'], ['game|games', 'ゲーム/試合《しあい》'], ['name|names', '名前《なまえ》'], ['colour|colours|color|colors', '色《いろ》'],
  ['school|schools', '学校《がっこう》'],
  // places and nature
  ['city|cities', '都市《とし》/町《まち》'], ['town|towns', '町《まち》'], ['village|villages', '村《むら》'], ['country|countries', '国《くに》'],
  ['world', '世界《せかい》'], ['street|streets', '通《とお》り/道《みち》'], ['road|roads', '道《みち》/道路《どうろ》'], ['shop|shops', '店《みせ》'],
  ['sea|seas', '海《うみ》'], ['river|rivers', '川《かわ》'], ['mountain|mountains', '山《やま》'], ['island|islands', '島《しま》'],
  ['beach|beaches', '浜辺《はまべ》/ビーチ'], ['forest|forests', '森《もり》/林《はやし》'], ['tree|trees', '木《き》'], ['flower|flowers', '花《はな》'],
  ['sun', '太陽《たいよう》'], ['moon', '月《つき》'], ['star|stars', '星《ほし》'], ['sky', '空《そら》'], ['snow', '雪《ゆき》'], ['rain', '雨《あめ》'],
  ['water', '水《みず》'], ['fire', '火《ひ》'],
  // food
  ['food', '食《た》べ物《もの》'], ['bread', 'パン'], ['milk', '牛乳《ぎゅうにゅう》/ミルク'], ['meat', '肉《にく》'], ['fruit|fruits', '果物《くだもの》'],
  ['apple|apples', 'りんご'], ['coffee', 'コーヒー'], ['egg|eggs', '卵《たまご》'],
  // time
  ['day|days', '日《ひ》'], ['night|nights', '夜《よる》'], ['morning|mornings', '朝《あさ》'], ['evening|evenings', '夕方《ゆうがた》/晩《ばん》'],
  ['week|weeks', '週《しゅう》'], ['month|months', '月《つき》'], ['year|years', '年《とし》'], ['hour|hours', '時間《じかん》'],
  ['summer', '夏《なつ》'], ['winter', '冬《ふゆ》'], ['autumn', '秋《あき》'], ['century|centuries', '世紀《せいき》'],
  // adjectives
  ['big|large', '大《おお》きい'], ['small|tiny', '小《ちい》さい'], ['good', 'いい/良《よ》い'], ['bad', '悪《わる》い'], ['new', '新《あたら》しい'],
  ['old', '古《ふる》い'], ['young', '若《わか》い'], ['long', '長《なが》い'], ['short', '短《みじか》い'], ['hot|warm', '暑《あつ》い/熱《あつ》い/暖《あたた》かい'],
  ['cold', '寒《さむ》い/冷《つめ》たい'], ['happy', 'うれしい/幸《しあわ》せ'], ['sad', '悲《かな》しい'], ['beautiful', '美《うつく》しい/きれい'],
  ['pretty', 'かわいい/きれい'], ['fast|quick', '速《はや》い'], ['slow', '遅《おそ》い'], ['easy', '簡単《かんたん》/易《やさ》しい'],
  ['difficult', '難《むずか》しい'], ['strong', '強《つよ》い'], ['important', '大切《たいせつ》/重要《じゅうよう》'], ['popular', '人気《にんき》'],
  ['famous', '有名《ゆうめい》'],
  // colours
  ['red', '赤《あか》い'], ['blue', '青《あお》い'], ['green', '緑《みどり》'], ['white', '白《しろ》い'], ['black', '黒《くろ》い'], ['yellow', '黄色《きいろ》い'],
  ['grey|gray', '灰色《はいいろ》/グレー'], ['brown', '茶色《ちゃいろ》'], ['pink', 'ピンク'], ['orange', 'オレンジ'],
  // general nouns and adjectives
  ['species', '種《しゅ》'], ['group|groups', 'グループ/群《む》れ'], ['part|parts', '部分《ぶぶん》'], ['number|numbers', '数《かず》/番号《ばんごう》'],
  ['shape|shapes', '形《かたち》'], ['size|sizes', '大《おお》きさ/サイズ'], ['life', '命《いのち》/生活《せいかつ》'], ['death', '死《し》'],
  ['skin|skins', '皮膚《ひふ》/皮《かわ》'], ['fur', '毛《け》/毛皮《けがわ》'], ['human|humans', '人間《にんげん》'], ['adult|adults', '大人《おとな》'],
  ['health', '健康《けんこう》'], ['disease|diseases', '病気《びょうき》'], ['population|populations', '人口《じんこう》'],
  ['habitat|habitats', '生息地《せいそくち》'], ['system|systems', 'システム/制度《せいど》'], ['surface|surfaces', '表面《ひょうめん》'],
  ['structure|structures', '構造《こうぞう》'], ['region|regions', '地域《ちいき》'], ['zone|zones', '地帯《ちたい》'], ['energy', 'エネルギー'],
  ['climate', '気候《きこう》'], ['history', '歴史《れきし》'], ['science', '科学《かがく》'], ['problem|problems', '問題《もんだい》'],
  ['example|examples', '例《れい》'], ['image|images', '画像《がぞう》'], ['type|types', '種類《しゅるい》'], ['nature', '自然《しぜん》'],
  ['culture|cultures', '文化《ぶんか》'], ['protection', '保護《ほご》'], ['production', '生産《せいさん》'], ['information', '情報《じょうほう》'],
  ['nation|nations', '国《くに》/国家《こっか》'], ['million|millions', '百万《ひゃくまん》'], ['minute|minutes', '分《ふん》'], ['sport|sports', 'スポーツ'],
  ['centre|centres|center|centers', '中心《ちゅうしん》/センター'], ['planet|planets', '惑星《わくせい》'], ['ocean|oceans', '海《うみ》/海洋《かいよう》'],
  ['plant|plants', '植物《しょくぶつ》'], ['fish', '魚《さかな》'], ['wild', '野生《やせい》'], ['natural', '自然《しぜん》/天然《てんねん》'],
  ['central', '中央《ちゅうおう》'], ['national', '国立《こくりつ》/全国《ぜんこく》'], ['international', '国際的《こくさいてき》'], ['high', '高《たか》い'],
  ['low', '低《ひく》い'], ['rare', '珍《めずら》しい'], ['common', '普通《ふつう》'], ['different', '違《ちが》う/別《べつ》'], ['possible', '可能《かのう》'],
  ['normal', '普通《ふつう》'], ['simple', '簡単《かんたん》'], ['modern', '現代《げんだい》/近代的《きんだいてき》'], ['original', '元《もと》/オリジナル'],
  ['true', '本当《ほんとう》'], ['full', 'いっぱい'], ['dark', '暗《くら》い'],
];

const RANK_2: Array<[string, string]> = [
  // verbs: the model puts them in the form the English needs
  ['eat|eats|ate|eaten|eating', '食《た》べる'], ['drink|drinks|drank|drinking', '飲《の》む'], ['sleep|sleeps|slept|sleeping', '寝《ね》る/眠《ねむ》る'],
  ['run|runs|ran|running', '走《はし》る'], ['walk|walks|walked|walking', '歩《ある》く'], ['play|plays|played|playing', '遊《あそ》ぶ'],
  ['live|lives|lived|living', '住《す》む/生《い》きる'], ['love|loves|loved|loving', '愛《あい》する'], ['see|sees|saw|seen|seeing', '見《み》る'],
  ['go|goes|went|gone|going', '行《い》く'], ['come|comes|came|coming', '来《く》る'], ['make|makes|made|making', '作《つく》る'],
  ['give|gives|gave|given|giving', 'あげる/与《あた》える'], ['take|takes|took|taken|taking', '取《と》る'], ['find|finds|found|finding', '見《み》つける'],
  ['buy|buys|bought|buying', '買《か》う'], ['sell|sells|sold|selling', '売《う》る'], ['begin|begins|began|begun|beginning|start|starts|started|starting', '始《はじ》まる/始《はじ》める'],
  ['finish|finishes|finished|finishing', '終《お》わる/終《お》える'], ['win|wins|won|winning', '勝《か》つ'], ['lose|loses|lost|losing', '負《ま》ける/なくす'],
  ['help|helps|helped|helping', '助《たす》ける/手伝《てつだ》う'], ['think|thinks|thought|thinking', '思《おも》う/考《かんが》える'],
  ['become|becomes|became|becoming', 'なる'], ['die|dies|died|dying', '死《し》ぬ'], ['call|calls|called|calling', '呼《よ》ぶ'],
  ['work|works|worked|working', '働《はたら》く/仕事《しごと》'], ['travel|travels|travelled|traveled|travelling|traveling', '旅行《りょこう》する'],
  ['hunt|hunts|hunted|hunting', '狩《か》る/狩《か》り'], ['wait|waits|waited|waiting', '待《ま》つ'], ['carry|carries|carried|carrying', '運《はこ》ぶ'],
  // adverbs
  ['often', 'よく'], ['always', 'いつも'], ['sometimes', '時々《ときどき》'], ['today', '今日《きょう》'], ['now', '今《いま》'], ['here', 'ここ'],
  ['together', '一緒《いっしょ》に'], ['quickly', '速《はや》く'], ['early', '早《はや》く/早《はや》い'], ['late', '遅《おそ》く/遅《おそ》い'],
  ['grow|grows|grew|grown|growing', '育《そだ》つ/成長《せいちょう》する'], ['feed|feeds|fed|feeding', '食《た》べさせる'],
  ['move|moves|moved|moving', '動《うご》く/引《ひ》っ越《こ》す'], ['show|shows|showed|shown|showing', '見《み》せる/示《しめ》す'],
  ['change|changes|changed|changing', '変《か》わる/変《か》える'], ['use|uses|used|using', '使《つか》う'],
];

export const JA_EASY_WORDS: EasyWord[] = [
  ...RANK_1.map(([forms, lemma]) => ({ forms, lemma, rank: 1 as const })),
  ...RANK_2.map(([forms, lemma]) => ({ forms, lemma, rank: 2 as const })),
];

// Everyday A1 vocabulary, grouped by theme: the top-up may only weave these
// (plus the lesson's own words), so the extra words stay at the reader's level.
const nouns: Array<[string, string]> = [
  // people and family
  ['男《おとこ》の人《ひと》', 'man'], ['女《おんな》の人《ひと》', 'woman'], ['子供《こども》', 'child'], ['男《おとこ》の子《こ》', 'boy'],
  ['女《おんな》の子《こ》', 'girl'], ['赤《あか》ちゃん', 'baby'], ['友達《ともだち》', 'friend'], ['家族《かぞく》', 'family'],
  ['父《ちち》', 'father (my)'], ['母《はは》', 'mother (my)'], ['兄弟《きょうだい》', 'brothers and sisters'], ['兄《あに》', 'older brother (my)'],
  ['姉《あね》', 'older sister (my)'], ['弟《おとうと》', 'younger brother'], ['妹《いもうと》', 'younger sister'], ['息子《むすこ》', 'son'],
  ['娘《むすめ》', 'daughter'], ['夫《おっと》', 'husband'], ['妻《つま》', 'wife'], ['人《ひと》', 'person'], ['先生《せんせい》', 'teacher'],
  ['学生《がくせい》', 'student'],
  // body
  ['体《からだ》', 'body'], ['頭《あたま》', 'head'], ['目《め》', 'eye'], ['耳《みみ》', 'ear'], ['鼻《はな》', 'nose'], ['口《くち》', 'mouth'],
  ['歯《は》', 'tooth'], ['首《くび》', 'neck'], ['背中《せなか》', 'back'], ['手《て》', 'hand'], ['腕《うで》', 'arm'], ['足《あし》', 'foot, leg'],
  ['しっぽ', 'tail'], ['心臓《しんぞう》', 'heart'], ['毛《け》', 'hair (body), fur'], ['髪《かみ》', 'hair (head)'],
  // animals
  ['動物《どうぶつ》', 'animal'], ['犬《いぬ》', 'dog'], ['猫《ねこ》', 'cat'], ['馬《うま》', 'horse'], ['鳥《とり》', 'bird'], ['魚《さかな》', 'fish'],
  ['ウサギ', 'rabbit'], ['牛《うし》', 'cow'], ['羊《ひつじ》', 'sheep'], ['ネズミ', 'mouse'],
  // home and objects
  ['家《いえ》', 'house, home'], ['アパート', 'flat'], ['部屋《へや》', 'room'], ['台所《だいどころ》', 'kitchen'], ['ドア', 'door'], ['窓《まど》', 'window'],
  ['机《つくえ》', 'desk'], ['テーブル', 'table'], ['いす', 'chair'], ['ベッド', 'bed'], ['庭《にわ》', 'garden'], ['本《ほん》', 'book'],
  ['ページ', 'page'], ['ペン', 'pen'], ['写真《しゃしん》', 'photo'], ['電話《でんわ》', 'phone'], ['車《くるま》', 'car'], ['自転車《じてんしゃ》', 'bike'],
  ['電車《でんしゃ》', 'train'], ['バス', 'bus'], ['飛行機《ひこうき》', 'plane'], ['お金《かね》', 'money'], ['かぎ', 'key'], ['かばん', 'bag'],
  ['おもちゃ', 'toy'],
  // places
  ['町《まち》', 'town'], ['村《むら》', 'village'], ['国《くに》', 'country'], ['道《みち》', 'road, way'], ['学校《がっこう》', 'school'],
  ['教室《きょうしつ》', 'classroom'], ['店《みせ》', 'shop'], ['市場《いちば》', 'market'], ['公園《こうえん》', 'park'], ['駅《えき》', 'station'],
  ['海《うみ》', 'sea'], ['山《やま》', 'mountain'], ['川《かわ》', 'river'], ['森《もり》', 'forest'], ['畑《はたけ》', 'field'], ['世界《せかい》', 'world'],
  ['仕事《しごと》', 'work, job'], ['会社《かいしゃ》', 'company, office'],
  // food
  ['水《みず》', 'water'], ['パン', 'bread'], ['牛乳《ぎゅうにゅう》', 'milk'], ['肉《にく》', 'meat'], ['果物《くだもの》', 'fruit'], ['りんご', 'apple'],
  ['コーヒー', 'coffee'], ['お茶《ちゃ》', 'tea'], ['ご飯《はん》', 'rice, meal'], ['食《た》べ物《もの》', 'food'], ['卵《たまご》', 'egg'],
  // time
  ['日《ひ》', 'day'], ['夜《よる》', 'night'], ['朝《あさ》', 'morning'], ['晩《ばん》', 'evening'], ['週《しゅう》', 'week'], ['月《つき》', 'month, moon'],
  ['年《とし》', 'year'], ['時間《じかん》', 'time, hour'], ['分《ふん》', 'minute'], ['今日《きょう》', 'today'], ['明日《あした》', 'tomorrow'],
  ['昨日《きのう》', 'yesterday'], ['春《はる》', 'spring'], ['夏《なつ》', 'summer'], ['秋《あき》', 'autumn'], ['冬《ふゆ》', 'winter'], ['天気《てんき》', 'weather'],
  // things in general
  ['物《もの》', 'thing'], ['こと', 'thing, matter'], ['名前《なまえ》', 'name'], ['言葉《ことば》', 'word'], ['質問《しつもん》', 'question'],
  ['答《こた》え', 'answer'], ['日本語《にほんご》', 'Japanese (language)'], ['英語《えいご》', 'English (language)'], ['色《いろ》', 'colour'],
  ['大《おお》きさ', 'size'], ['ゲーム', 'game'], ['スポーツ', 'sport'], ['病気《びょうき》', 'illness'], ['問題《もんだい》', 'problem'], ['例《れい》', 'example'],
];

const verbs: Array<[string, string]> = [
  ['ある', 'to be, exist (things)'], ['いる', 'to be, exist (people, animals)'], ['行《い》く', 'to go'], ['来《く》る', 'to come'],
  ['帰《かえ》る', 'to go home'], ['する', 'to do'], ['作《つく》る', 'to make'], ['言《い》う', 'to say'], ['話《はな》す', 'to speak'],
  ['見《み》る', 'to see, watch'], ['聞《き》く', 'to hear, listen, ask'], ['知《し》る', 'to get to know (知《し》っている: to know)'],
  ['分《わ》かる', 'to understand'], ['勉強《べんきょう》する', 'to study'], ['できる', 'can, to be able'], ['ほしい', 'to want (a thing)'],
  ['好《す》き', 'to like'], ['食《た》べる', 'to eat'], ['飲《の》む', 'to drink'], ['寝《ね》る', 'to sleep, go to bed'], ['起《お》きる', 'to get up'],
  ['走《はし》る', 'to run'], ['歩《ある》く', 'to walk'], ['遊《あそ》ぶ', 'to play'], ['住《す》む', 'to live (somewhere)'], ['働《はたら》く', 'to work'],
  ['あげる', 'to give'], ['もらう', 'to receive'], ['持《も》つ', 'to hold, have'], ['買《か》う', 'to buy'], ['売《う》る', 'to sell'],
  ['見《み》つける', 'to find'], ['探《さが》す', 'to look for'], ['置《お》く', 'to put'], ['開《あ》ける', 'to open'], ['閉《し》める', 'to close'],
  ['始《はじ》まる', 'to begin'], ['終《お》わる', 'to end'], ['乗《の》る', 'to ride, get on'], ['泳《およ》ぐ', 'to swim'], ['飛《と》ぶ', 'to fly'],
  ['読《よ》む', 'to read'], ['書《か》く', 'to write'], ['待《ま》つ', 'to wait'], ['思《おも》う', 'to think'], ['なる', 'to become'],
  ['死《し》ぬ', 'to die'], ['使《つか》う', 'to use'], ['見《み》せる', 'to show'], ['会《あ》う', 'to meet'], ['休《やす》む', 'to rest'],
];

const adjectives: Array<[string, string]> = [
  ['いい', 'good'], ['悪《わる》い', 'bad'], ['大《おお》きい', 'big'], ['小《ちい》さい', 'small'], ['長《なが》い', 'long'], ['短《みじか》い', 'short'],
  ['高《たか》い', 'high, tall, expensive'], ['低《ひく》い', 'low'], ['安《やす》い', 'cheap'], ['新《あたら》しい', 'new'], ['古《ふる》い', 'old (things)'],
  ['若《わか》い', 'young'], ['速《はや》い', 'fast'], ['遅《おそ》い', 'slow, late'], ['強《つよ》い', 'strong'], ['弱《よわ》い', 'weak'],
  ['易《やさ》しい', 'easy'], ['難《むずか》しい', 'difficult'], ['暑《あつ》い', 'hot (weather)'], ['寒《さむ》い', 'cold (weather)'],
  ['冷《つめ》たい', 'cold (to the touch)'], ['楽《たの》しい', 'fun'], ['うれしい', 'glad'], ['悲《かな》しい', 'sad'], ['優《やさ》しい', 'kind'],
  ['かわいい', 'cute'], ['おいしい', 'tasty'], ['忙《いそが》しい', 'busy'], ['きれい', 'pretty, clean'], ['静《しず》か', 'quiet'],
  ['元気《げんき》', 'well, lively'], ['大切《たいせつ》', 'important'], ['有名《ゆうめい》', 'famous'], ['好《す》き', 'liked'], ['同《おな》じ', 'same'],
  ['白《しろ》い', 'white'], ['黒《くろ》い', 'black'], ['赤《あか》い', 'red'], ['青《あお》い', 'blue'], ['黄色《きいろ》い', 'yellow'],
];

const others: Array<[string, string]> = [
  ['そして', 'and (then)'], ['でも', 'but'], ['だから', 'so'], ['とても', 'very'], ['少《すこ》し', 'a little'], ['たくさん', 'a lot'],
  ['もう', 'already'], ['まだ', 'still, not yet'], ['また', 'again'], ['いつも', 'always'], ['よく', 'often, well'], ['時々《ときどき》', 'sometimes'],
  ['今《いま》', 'now'], ['すぐ', 'soon, at once'], ['ここ', 'here'], ['そこ', 'there'], ['どこ', 'where'], ['いつ', 'when'], ['だれ', 'who'],
  ['何《なに》', 'what'], ['どうして', 'why'], ['どう', 'how'], ['みんな', 'everyone'], ['全部《ぜんぶ》', 'all'], ['はい', 'yes'], ['いいえ', 'no'],
];

export const JA_A1_WORDS: A1Word[] = [...nouns, ...verbs, ...adjectives, ...others].map(([lemma, en]) => ({ lemma, en }));
