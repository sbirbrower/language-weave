import type { A1Word } from '../a1';
import type { EasyWord } from '../easy';

// Chinese counterparts of the French lists in `easy.ts` and `a1.ts`, with pinyin (src/ruby.ts), in
// simplified characters. Chinese has no gender. Left out of the French list's small words: is and
// was (Chinese has no verb before an adjective, and 是 only before a noun), has and had (mostly
// auxiliaries in English), for, between, after, before, under and during (their Chinese wraps the
// noun: 在…之间, …以后, 在…下面, 在…期间, which a single English word can't hold). "never" is kept
// as 从来不, which stands before the verb as never does.

// Easy words: the same English as the French list, so both find the same places.
const RANK_1: Array<[string, string]> = [
  // people
  ['man|men', '男人《nánrén》/男性《nánxìng》'], ['woman|women', '女人《nǚrén》/女性《nǚxìng》'], ['child|children', '孩子《háizi》/儿童《értóng》'],
  ['boy|boys', '男孩《nánhái》'], ['girl|girls', '女孩《nǚhái》'], ['baby|babies', '婴儿《yīng’ér》/宝宝《bǎobao》'], ['friend|friends', '朋友《péngyou》'],
  ['family|families', '家庭《jiātíng》/家人《jiārén》'], ['father|fathers', '父亲《fùqīn》/爸爸《bàba》'], ['mother|mothers', '母亲《mǔqīn》/妈妈《māma》'],
  ['brother|brothers', '兄弟《xiōngdì》/哥哥《gēge》/弟弟《dìdi》'], ['sister|sisters', '姐妹《jiěmèi》/姐姐《jiějie》/妹妹《mèimei》'], ['son|sons', '儿子《érzi》'],
  ['daughter|daughters', '女儿《nǚ’ér》'], ['husband|husbands', '丈夫《zhàngfu》'], ['wife|wives', '妻子《qīzi》'], ['people', '人们《rénmen》/人《rén》'],
  ['person', '人《rén》'], ['king|kings', '国王《guówáng》'], ['queen|queens', '女王《nǚwáng》/王后《wánghòu》'],
  // animals
  ['animal|animals', '动物《dòngwù》'], ['dog|dogs', '狗《gǒu》'], ['cat|cats', '猫《māo》'], ['horse|horses', '马《mǎ》'],
  ['bird|birds', '鸟《niǎo》'], ['rabbit|rabbits', '兔子《tùzi》'], ['cow|cows', '牛《niú》'], ['sheep', '羊《yáng》'], ['mouse|mice', '老鼠《lǎoshǔ》'],
  // body
  ['head|heads', '头《tóu》'], ['eye|eyes', '眼睛《yǎnjing》'], ['ear|ears', '耳朵《ěrduo》'], ['nose|noses', '鼻子《bízi》'], ['mouth', '嘴《zuǐ》'],
  ['hand|hands', '手《shǒu》'], ['foot|feet', '脚《jiǎo》'], ['leg|legs', '腿《tuǐ》'], ['heart|hearts', '心脏《xīnzàng》/心《xīn》'],
  ['tail|tails', '尾巴《wěiba》'], ['body|bodies', '身体《shēntǐ》'], ['hair', '头发《tóufa》/毛《máo》'],
  // home and things
  ['house|houses', '房子《fángzi》'], ['home', '家《jiā》'], ['door|doors', '门《mén》'], ['window|windows', '窗户《chuānghu》'],
  ['table|tables', '桌子《zhuōzi》'], ['bed|beds', '床《chuáng》'], ['garden|gardens', '花园《huāyuán》'], ['car|cars', '汽车《qìchē》/车《chē》'],
  ['bicycle|bicycles|bike|bikes', '自行车《zìxíngchē》'], ['train|trains', '火车《huǒchē》'], ['boat|boats', '船《chuán》'],
  ['plane|planes|aircraft', '飞机《fēijī》'], ['book|books', '书《shū》'], ['letter|letters', '信《xìn》/字母《zìmǔ》'], ['money', '钱《qián》'],
  ['photo|photos|photograph|photographs', '照片《zhàopiàn》'], ['film|films|movie|movies', '电影《diànyǐng》'], ['music', '音乐《yīnyuè》'],
  ['song|songs', '歌《gē》/歌曲《gēqǔ》'], ['game|games', '游戏《yóuxì》/比赛《bǐsài》'], ['name|names', '名字《míngzi》'], ['colour|colours|color|colors', '颜色《yánsè》'],
  ['school|schools', '学校《xuéxiào》'],
  // places and nature
  ['city|cities', '城市《chéngshì》'], ['town|towns', '城镇《chéngzhèn》/小城《xiǎochéng》'], ['village|villages', '村子《cūnzi》/村庄《cūnzhuāng》'],
  ['country|countries', '国家《guójiā》'], ['world', '世界《shìjiè》'], ['street|streets', '街《jiē》/街道《jiēdào》'], ['road|roads', '路《lù》/道路《dàolù》'],
  ['shop|shops', '商店《shāngdiàn》'], ['sea|seas', '海《hǎi》'], ['river|rivers', '河《hé》/江《jiāng》'], ['mountain|mountains', '山《shān》'],
  ['island|islands', '岛《dǎo》'], ['beach|beaches', '海滩《hǎitān》'], ['forest|forests', '森林《sēnlín》/树林《shùlín》'], ['tree|trees', '树《shù》'],
  ['flower|flowers', '花《huā》'], ['sun', '太阳《tàiyáng》'], ['moon', '月亮《yuèliang》'], ['star|stars', '星星《xīngxing》'], ['sky', '天空《tiānkōng》'],
  ['snow', '雪《xuě》'], ['rain', '雨《yǔ》'], ['water', '水《shuǐ》'], ['fire', '火《huǒ》'],
  // food
  ['food', '食物《shíwù》'], ['bread', '面包《miànbāo》'], ['milk', '牛奶《niúnǎi》'], ['meat', '肉《ròu》'], ['fruit|fruits', '水果《shuǐguǒ》'],
  ['apple|apples', '苹果《píngguǒ》'], ['coffee', '咖啡《kāfēi》'], ['egg|eggs', '鸡蛋《jīdàn》/蛋《dàn》'],
  // time
  ['day|days', '天《tiān》'], ['night|nights', '夜《yè》/晚上《wǎnshang》'], ['morning|mornings', '早上《zǎoshang》'], ['evening|evenings', '晚上《wǎnshang》'],
  ['week|weeks', '星期《xīngqī》/周《zhōu》'], ['month|months', '月《yuè》'], ['year|years', '年《nián》'], ['hour|hours', '小时《xiǎoshí》'],
  ['summer', '夏天《xiàtiān》'], ['winter', '冬天《dōngtiān》'], ['autumn', '秋天《qiūtiān》'], ['century|centuries', '世纪《shìjì》'],
  // adjectives
  ['big|large', '大《dà》'], ['small|tiny', '小《xiǎo》'], ['good', '好《hǎo》'], ['bad', '坏《huài》/不好《bù hǎo》'], ['new', '新《xīn》'],
  ['old', '老《lǎo》/旧《jiù》'], ['young', '年轻《niánqīng》'], ['long', '长《cháng》'], ['short', '短《duǎn》/矮《ǎi》'], ['hot|warm', '热《rè》/暖和《nuǎnhuo》'],
  ['cold', '冷《lěng》'], ['happy', '高兴《gāoxìng》/快乐《kuàilè》'], ['sad', '难过《nánguò》/伤心《shāngxīn》'], ['beautiful', '美丽《měilì》/漂亮《piàoliang》'],
  ['pretty', '漂亮《piàoliang》'], ['fast|quick', '快《kuài》'], ['slow', '慢《màn》'], ['easy', '容易《róngyì》'], ['difficult', '难《nán》'],
  ['strong', '强《qiáng》/强壮《qiángzhuàng》'], ['important', '重要《zhòngyào》'], ['popular', '受欢迎《shòu huānyíng》'], ['famous', '有名《yǒumíng》/著名《zhùmíng》'],
  // colours
  ['red', '红《hóng》/红色《hóngsè》'], ['blue', '蓝《lán》/蓝色《lánsè》'], ['green', '绿《lǜ》/绿色《lǜsè》'], ['white', '白《bái》/白色《báisè》'],
  ['black', '黑《hēi》/黑色《hēisè》'], ['yellow', '黄《huáng》/黄色《huángsè》'], ['grey|gray', '灰色《huīsè》'], ['brown', '棕色《zōngsè》/咖啡色《kāfēisè》'],
  ['pink', '粉红色《fěnhóngsè》'], ['orange', '橙色《chéngsè》'],
  // general nouns and adjectives
  ['species', '物种《wùzhǒng》/种《zhǒng》'], ['group|groups', '群《qún》/组《zǔ》'], ['part|parts', '部分《bùfen》'], ['number|numbers', '数字《shùzì》/数量《shùliàng》'],
  ['shape|shapes', '形状《xíngzhuàng》'], ['size|sizes', '大小《dàxiǎo》'], ['life', '生命《shēngmìng》/生活《shēnghuó》'], ['death', '死亡《sǐwáng》'],
  ['skin|skins', '皮肤《pífū》'], ['fur', '毛《máo》/皮毛《pímáo》'], ['human|humans', '人类《rénlèi》'], ['adult|adults', '成年人《chéngniánrén》/大人《dàren》'],
  ['health', '健康《jiànkāng》'], ['disease|diseases', '疾病《jíbìng》/病《bìng》'], ['population|populations', '人口《rénkǒu》'],
  ['habitat|habitats', '栖息地《qīxīdì》'], ['system|systems', '系统《xìtǒng》/制度《zhìdù》'], ['surface|surfaces', '表面《biǎomiàn》'],
  ['structure|structures', '结构《jiégòu》'], ['region|regions', '地区《dìqū》'], ['zone|zones', '区《qū》/地带《dìdài》'], ['energy', '能量《néngliàng》/能源《néngyuán》'],
  ['climate', '气候《qìhòu》'], ['history', '历史《lìshǐ》'], ['science', '科学《kēxué》'], ['problem|problems', '问题《wèntí》'],
  ['example|examples', '例子《lìzi》'], ['image|images', '图像《túxiàng》/图片《túpiàn》'], ['type|types', '种类《zhǒnglèi》/类型《lèixíng》'],
  ['nature', '自然《zìrán》/大自然《dàzìrán》'], ['culture|cultures', '文化《wénhuà》'], ['protection', '保护《bǎohù》'], ['production', '生产《shēngchǎn》'],
  ['information', '信息《xìnxī》'], ['nation|nations', '国家《guójiā》/民族《mínzú》'], ['million|millions', '百万《bǎiwàn》'], ['minute|minutes', '分钟《fēnzhōng》'],
  ['sport|sports', '运动《yùndòng》/体育《tǐyù》'], ['centre|centres|center|centers', '中心《zhōngxīn》'], ['planet|planets', '行星《xíngxīng》'],
  ['ocean|oceans', '海洋《hǎiyáng》/大洋《dàyáng》'], ['plant|plants', '植物《zhíwù》'], ['fish', '鱼《yú》'], ['wild', '野生《yěshēng》'],
  ['natural', '自然《zìrán》/天然《tiānrán》'], ['central', '中央《zhōngyāng》/中部《zhōngbù》'], ['national', '国家《guójiā》/全国《quánguó》'],
  ['international', '国际《guójì》'], ['high', '高《gāo》'], ['low', '低《dī》'], ['rare', '稀有《xīyǒu》/少见《shǎojiàn》'], ['common', '常见《chángjiàn》/普通《pǔtōng》'],
  ['different', '不同《bùtóng》'], ['possible', '可能《kěnéng》'], ['normal', '正常《zhèngcháng》'], ['simple', '简单《jiǎndān》'], ['modern', '现代《xiàndài》'],
  ['original', '原来《yuánlái》/原始《yuánshǐ》'], ['true', '真《zhēn》/真的《zhēn de》'], ['full', '满《mǎn》'], ['dark', '黑暗《hēi’àn》/暗《àn》/深《shēn》'],
];

const RANK_2: Array<[string, string]> = [
  // verbs: they never change, so the model only picks the word
  ['eat|eats|ate|eaten|eating', '吃《chī》'], ['drink|drinks|drank|drinking', '喝《hē》'], ['sleep|sleeps|slept|sleeping', '睡觉《shuìjiào》/睡《shuì》'],
  ['run|runs|ran|running', '跑《pǎo》'], ['walk|walks|walked|walking', '走《zǒu》/走路《zǒulù》'], ['play|plays|played|playing', '玩《wán》'],
  ['live|lives|lived|living', '住《zhù》/生活《shēnghuó》'], ['love|loves|loved|loving', '爱《ài》'], ['see|sees|saw|seen|seeing', '看《kàn》/看见《kànjiàn》'],
  ['go|goes|went|gone|going', '去《qù》'], ['come|comes|came|coming', '来《lái》'], ['make|makes|made|making', '做《zuò》/制作《zhìzuò》'],
  ['give|gives|gave|given|giving', '给《gěi》'], ['take|takes|took|taken|taking', '拿《ná》/带《dài》'], ['find|finds|found|finding', '找到《zhǎodào》/发现《fāxiàn》'],
  ['buy|buys|bought|buying', '买《mǎi》'], ['sell|sells|sold|selling', '卖《mài》'], ['begin|begins|began|begun|beginning|start|starts|started|starting', '开始《kāishǐ》'],
  ['finish|finishes|finished|finishing', '完成《wánchéng》/结束《jiéshù》'], ['win|wins|won|winning', '赢《yíng》'], ['lose|loses|lost|losing', '输《shū》/丢《diū》'],
  ['help|helps|helped|helping', '帮助《bāngzhù》/帮《bāng》'], ['want|wants|wanted|wanting', '想《xiǎng》/要《yào》'],
  ['think|thinks|thought|thinking', '想《xiǎng》/认为《rènwéi》/觉得《juéde》'], ['become|becomes|became|becoming', '成为《chéngwéi》/变成《biànchéng》'],
  ['die|dies|died|dying', '死《sǐ》'], ['call|calls|called|calling', '叫《jiào》'], ['work|works|worked|working', '工作《gōngzuò》'],
  ['travel|travels|travelled|traveled|travelling|traveling', '旅行《lǚxíng》/旅游《lǚyóu》'], ['hunt|hunts|hunted|hunting', '打猎《dǎliè》/捕猎《bǔliè》'],
  ['wait|waits|waited|waiting', '等《děng》'], ['carry|carries|carried|carrying', '带《dài》/搬《bān》'],
  // adverbs
  ['often', '经常《jīngcháng》/常常《chángcháng》'], ['always', '总是《zǒngshì》'], ['never', '从来不《cónglái bù》/从不《cóngbù》'],
  ['sometimes', '有时候《yǒu shíhou》/有时《yǒushí》'], ['today', '今天《jīntiān》'], ['now', '现在《xiànzài》'], ['here', '这里《zhèlǐ》'],
  ['together', '一起《yīqǐ》'], ['quickly', '很快《hěn kuài》/快《kuài》'], ['early', '早《zǎo》'], ['late', '晚《wǎn》/迟《chí》'],
  ['grow|grows|grew|grown|growing', '长《zhǎng》/生长《shēngzhǎng》/成长《chéngzhǎng》'], ['feed|feeds|fed|feeding', '喂《wèi》'],
  ['move|moves|moved|moving', '移动《yídòng》/动《dòng》/搬家《bānjiā》'], ['show|shows|showed|shown|showing', '展示《zhǎnshì》/显示《xiǎnshì》'],
  ['change|changes|changed|changing', '改变《gǎibiàn》/变化《biànhuà》'], ['use|uses|used|using', '用《yòng》/使用《shǐyòng》'],
  // small words that stand where English puts them
  ['from', '从《cóng》'], ['without', '没有《méiyǒu》'], ['some', '一些《yīxiē》/有些《yǒuxiē》'], ['many', '很多《hěn duō》/许多《xǔduō》'],
  ['all', '所有《suǒyǒu》/都《dōu》'], ['each|every', '每《měi》'], ['several', '几个《jǐ gè》'], ['few', '很少《hěn shǎo》/少数《shǎoshù》'],
  ['this|these', '这《zhè》/这些《zhèxiē》'], ['they', '他们《tāmen》/她们《tāmen》/它们《tāmen》'],
  ['same', '同样《tóngyàng》/一样《yīyàng》'], ['other', '其他《qítā》/别的《bié de》'],
];

export const ZH_EASY_WORDS: EasyWord[] = [
  ...RANK_1.map(([forms, lemma]) => ({ forms, lemma, rank: 1 as const })),
  ...RANK_2.map(([forms, lemma]) => ({ forms, lemma, rank: 2 as const })),
];

// Everyday A1 vocabulary, grouped by theme: the top-up may only weave these
// (plus the lesson's own words), so the extra words stay at the reader's level.
const nouns: Array<[string, string]> = [
  // people and family
  ['男人《nánrén》', 'man'], ['女人《nǚrén》', 'woman'], ['孩子《háizi》', 'child'], ['男孩《nánhái》', 'boy'], ['女孩《nǚhái》', 'girl'],
  ['宝宝《bǎobao》', 'baby'], ['朋友《péngyou》', 'friend'], ['家人《jiārén》', 'family'], ['爸爸《bàba》', 'father'], ['妈妈《māma》', 'mother'],
  ['哥哥《gēge》', 'older brother'], ['姐姐《jiějie》', 'older sister'], ['弟弟《dìdi》', 'younger brother'], ['妹妹《mèimei》', 'younger sister'],
  ['儿子《érzi》', 'son'], ['女儿《nǚ’ér》', 'daughter'], ['丈夫《zhàngfu》', 'husband'], ['妻子《qīzi》', 'wife'], ['人《rén》', 'person'],
  ['老师《lǎoshī》', 'teacher'], ['学生《xuéshēng》', 'student'], ['医生《yīshēng》', 'doctor'],
  // body
  ['身体《shēntǐ》', 'body'], ['头《tóu》', 'head'], ['眼睛《yǎnjing》', 'eye'], ['耳朵《ěrduo》', 'ear'], ['鼻子《bízi》', 'nose'], ['嘴《zuǐ》', 'mouth'],
  ['牙《yá》', 'tooth'], ['脖子《bózi》', 'neck'], ['背《bèi》', 'back'], ['手《shǒu》', 'hand'], ['胳膊《gēbo》', 'arm'], ['脚《jiǎo》', 'foot'],
  ['腿《tuǐ》', 'leg'], ['尾巴《wěiba》', 'tail'], ['心《xīn》', 'heart'], ['毛《máo》', 'hair (body), fur'], ['头发《tóufa》', 'hair (head)'],
  // animals
  ['动物《dòngwù》', 'animal'], ['狗《gǒu》', 'dog'], ['猫《māo》', 'cat'], ['马《mǎ》', 'horse'], ['鸟《niǎo》', 'bird'], ['鱼《yú》', 'fish'],
  ['兔子《tùzi》', 'rabbit'], ['牛《niú》', 'cow'], ['羊《yáng》', 'sheep'], ['老鼠《lǎoshǔ》', 'mouse'], ['熊猫《xióngmāo》', 'panda'],
  // home and objects
  ['房子《fángzi》', 'house'], ['家《jiā》', 'home'], ['房间《fángjiān》', 'room'], ['厨房《chúfáng》', 'kitchen'], ['门《mén》', 'door'],
  ['窗户《chuānghu》', 'window'], ['桌子《zhuōzi》', 'table'], ['椅子《yǐzi》', 'chair'], ['床《chuáng》', 'bed'], ['花园《huāyuán》', 'garden'],
  ['书《shū》', 'book'], ['笔《bǐ》', 'pen'], ['照片《zhàopiàn》', 'photo'], ['手机《shǒujī》', 'mobile phone'], ['电话《diànhuà》', 'phone'],
  ['电脑《diànnǎo》', 'computer'], ['汽车《qìchē》', 'car'], ['自行车《zìxíngchē》', 'bike'], ['火车《huǒchē》', 'train'],
  ['公共汽车《gōnggòng qìchē》', 'bus'], ['飞机《fēijī》', 'plane'], ['钱《qián》', 'money'], ['钥匙《yàoshi》', 'key'], ['包《bāo》', 'bag'],
  ['衣服《yīfu》', 'clothes'],
  // places
  ['城市《chéngshì》', 'city'], ['村子《cūnzi》', 'village'], ['国家《guójiā》', 'country'], ['路《lù》', 'road, way'], ['学校《xuéxiào》', 'school'],
  ['教室《jiàoshì》', 'classroom'], ['商店《shāngdiàn》', 'shop'], ['市场《shìchǎng》', 'market'], ['公园《gōngyuán》', 'park'], ['车站《chēzhàn》', 'station'],
  ['饭馆《fànguǎn》', 'restaurant'], ['医院《yīyuàn》', 'hospital'], ['银行《yínháng》', 'bank'], ['海《hǎi》', 'sea'], ['山《shān》', 'mountain'],
  ['河《hé》', 'river'], ['森林《sēnlín》', 'forest'], ['世界《shìjiè》', 'world'], ['公司《gōngsī》', 'company'], ['工作《gōngzuò》', 'work, job'],
  // food
  ['水《shuǐ》', 'water'], ['茶《chá》', 'tea'], ['咖啡《kāfēi》', 'coffee'], ['牛奶《niúnǎi》', 'milk'], ['米饭《mǐfàn》', 'rice (cooked)'],
  ['面条《miàntiáo》', 'noodles'], ['面包《miànbāo》', 'bread'], ['肉《ròu》', 'meat'], ['鸡蛋《jīdàn》', 'egg'], ['水果《shuǐguǒ》', 'fruit'],
  ['苹果《píngguǒ》', 'apple'], ['菜《cài》', 'dish, vegetables'], ['饭《fàn》', 'meal'], ['饺子《jiǎozi》', 'dumplings'],
  // time
  ['天《tiān》', 'day'], ['晚上《wǎnshang》', 'evening, night'], ['早上《zǎoshang》', 'morning'], ['星期《xīngqī》', 'week'], ['月《yuè》', 'month'],
  ['年《nián》', 'year'], ['小时《xiǎoshí》', 'hour'], ['分钟《fēnzhōng》', 'minute'], ['今天《jīntiān》', 'today'], ['明天《míngtiān》', 'tomorrow'],
  ['昨天《zuótiān》', 'yesterday'], ['春天《chūntiān》', 'spring'], ['夏天《xiàtiān》', 'summer'], ['秋天《qiūtiān》', 'autumn'], ['冬天《dōngtiān》', 'winter'],
  ['天气《tiānqì》', 'weather'], ['时间《shíjiān》', 'time'],
  // things in general
  ['东西《dōngxi》', 'thing'], ['名字《míngzi》', 'name'], ['字《zì》', 'character, word'], ['问题《wèntí》', 'question, problem'],
  ['中文《Zhōngwén》', 'Chinese (language)'], ['英语《Yīngyǔ》', 'English (language)'], ['颜色《yánsè》', 'colour'], ['游戏《yóuxì》', 'game'],
  ['运动《yùndòng》', 'sport'], ['病《bìng》', 'illness'],
];

const verbs: Array<[string, string]> = [
  ['是《shì》', 'to be (before a noun)'], ['有《yǒu》', 'to have, there is'], ['在《zài》', 'to be (somewhere)'], ['去《qù》', 'to go'],
  ['来《lái》', 'to come'], ['回《huí》', 'to go back'], ['做《zuò》', 'to do, make'], ['说《shuō》', 'to speak, say'], ['看《kàn》', 'to look, read, watch'],
  ['听《tīng》', 'to listen'], ['知道《zhīdào》', 'to know (a fact)'], ['认识《rènshi》', 'to know (a person)'], ['懂《dǒng》', 'to understand'],
  ['学习《xuéxí》', 'to study'], ['会《huì》', 'can (a skill)'], ['能《néng》', 'can, to be able'], ['想《xiǎng》', 'to want to, think'],
  ['要《yào》', 'to want, need'], ['喜欢《xǐhuan》', 'to like'], ['吃《chī》', 'to eat'], ['喝《hē》', 'to drink'], ['睡觉《shuìjiào》', 'to sleep'],
  ['起床《qǐchuáng》', 'to get up'], ['跑《pǎo》', 'to run'], ['走《zǒu》', 'to walk'], ['玩《wán》', 'to play'], ['住《zhù》', 'to live (somewhere)'],
  ['工作《gōngzuò》', 'to work'], ['给《gěi》', 'to give'], ['拿《ná》', 'to take, hold'], ['买《mǎi》', 'to buy'], ['卖《mài》', 'to sell'],
  ['找《zhǎo》', 'to look for'], ['放《fàng》', 'to put'], ['开《kāi》', 'to open, drive'], ['关《guān》', 'to close, turn off'], ['开始《kāishǐ》', 'to begin'],
  ['坐《zuò》', 'to sit, take (a bus)'], ['游泳《yóuyǒng》', 'to swim'], ['飞《fēi》', 'to fly'], ['读《dú》', 'to read (aloud)'], ['写《xiě》', 'to write'],
  ['等《děng》', 'to wait'], ['用《yòng》', 'to use'], ['见《jiàn》', 'to see, meet'], ['休息《xiūxi》', 'to rest'], ['爱《ài》', 'to love'],
  ['叫《jiào》', 'to be called, call'],
];

const adjectives: Array<[string, string]> = [
  ['好《hǎo》', 'good'], ['坏《huài》', 'bad'], ['大《dà》', 'big'], ['小《xiǎo》', 'small'], ['长《cháng》', 'long'], ['短《duǎn》', 'short'],
  ['高《gāo》', 'tall, high'], ['矮《ǎi》', 'short (person)'], ['贵《guì》', 'expensive'], ['便宜《piányi》', 'cheap'], ['新《xīn》', 'new'],
  ['旧《jiù》', 'old (things)'], ['老《lǎo》', 'old (people)'], ['年轻《niánqīng》', 'young'], ['快《kuài》', 'fast'], ['慢《màn》', 'slow'],
  ['容易《róngyì》', 'easy'], ['难《nán》', 'difficult'], ['热《rè》', 'hot'], ['冷《lěng》', 'cold'], ['高兴《gāoxìng》', 'glad'], ['难过《nánguò》', 'sad'],
  ['好吃《hǎochī》', 'tasty'], ['忙《máng》', 'busy'], ['漂亮《piàoliang》', 'pretty'], ['干净《gānjìng》', 'clean'], ['安静《ānjìng》', 'quiet'],
  ['重要《zhòngyào》', 'important'], ['有名《yǒumíng》', 'famous'], ['一样《yīyàng》', 'same'], ['多《duō》', 'many, much'], ['少《shǎo》', 'few, little'],
  ['红《hóng》', 'red'], ['白《bái》', 'white'], ['黑《hēi》', 'black'], ['蓝《lán》', 'blue'], ['绿《lǜ》', 'green'], ['黄《huáng》', 'yellow'],
];

const others: Array<[string, string]> = [
  ['和《hé》', 'and'], ['但是《dànshì》', 'but'], ['所以《suǒyǐ》', 'so'], ['很《hěn》', 'very'], ['非常《fēicháng》', 'extremely'],
  ['一点《yīdiǎn》', 'a little'], ['也《yě》', 'also'], ['都《dōu》', 'all, both'], ['已经《yǐjīng》', 'already'], ['还《hái》', 'still'],
  ['再《zài》', 'again'], ['常常《chángcháng》', 'often'], ['有时候《yǒu shíhou》', 'sometimes'], ['现在《xiànzài》', 'now'], ['马上《mǎshàng》', 'at once'],
  ['这里《zhèlǐ》', 'here'], ['那里《nàlǐ》', 'there'], ['哪里《nǎlǐ》', 'where'], ['什么时候《shénme shíhou》', 'when'], ['谁《shéi》', 'who'],
  ['什么《shénme》', 'what'], ['为什么《wèi shénme》', 'why'], ['怎么《zěnme》', 'how'], ['大家《dàjiā》', 'everyone'], ['对《duì》', 'right, yes'],
  ['不《bù》', 'not, no'],
];

export const ZH_A1_WORDS: A1Word[] = [...nouns, ...verbs, ...adjectives, ...others].map(([lemma, en]) => ({ lemma, en }));
