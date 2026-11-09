import type { A1Word } from '../a1';
import type { EasyWord } from '../easy';
import type { Gender } from '../../languages';

// Arabic counterparts of the French lists in `easy.ts` and `a1.ts`, with readings (src/ruby.ts). Nouns in
// the singular without the article, adjectives in the masculine singular, verbs in the past tense's "he"
// form, as dictionaries give them. Left out of the French list's small words: is, are, was and were (no
// "is" in the present, and كان agrees with its subject), has and had (عند and ل, which take the owner as an
// ending), for (ل joins the next word, and the rest depends on the sense), few, this and these, and same
// (each needs its noun with ال after it), other (it follows the noun, agreeing), and never, which needs لا
// or لم before the verb.

// Easy words: the same English as the French list, so both find the same places.
const RANK_1: Array<[string, string]> = [
  // people
  ['man|men', 'رجل《rajul》'], ['woman|women', 'امرأة《imraʾa》'], ['child|children', 'طفل《ṭifl》'],
  ['boy|boys', 'ولد《walad》/صبي《ṣabī》'], ['girl|girls', 'بنت《bint》/فتاة《fatāt》'], ['baby|babies', 'رضيع《raḍīʿ》/طفل《ṭifl》'], ['friend|friends', 'صديق《ṣadīq》'],
  ['family|families', 'عائلة《ʿāʾila》/أسرة《usra》'], ['father|fathers', 'أب《ab》/والد《wālid》'], ['mother|mothers', 'أم《umm》/والدة《wālida》'],
  ['brother|brothers', 'أخ《akh》'], ['sister|sisters', 'أخت《ukht》'], ['son|sons', 'ابن《ibn》'], ['daughter|daughters', 'ابنة《ibna》/بنت《bint》'],
  ['husband|husbands', 'زوج《zawj》'], ['wife|wives', 'زوجة《zawja》'], ['people', 'ناس《nās》'], ['person', 'شخص《shakhṣ》'],
  ['king|kings', 'ملك《malik》'], ['queen|queens', 'ملكة《malika》'],
  // animals
  ['animal|animals', 'حيوان《ḥayawān》'], ['dog|dogs', 'كلب《kalb》'], ['cat|cats', 'قطة《qiṭṭa》/قط《qiṭṭ》'], ['horse|horses', 'حصان《ḥiṣān》'],
  ['bird|birds', 'طائر《ṭāʾir》'], ['rabbit|rabbits', 'أرنب《arnab》'], ['cow|cows', 'بقرة《baqara》'], ['sheep', 'خروف《kharūf》/غنم《ghanam》'],
  ['mouse|mice', 'فأر《faʾr》'],
  // body
  ['head|heads', 'رأس《raʾs》'], ['eye|eyes', 'عين《ʿayn》'], ['ear|ears', 'أذن《udhun》'], ['nose|noses', 'أنف《anf》'], ['mouth', 'فم《fam》'],
  ['hand|hands', 'يد《yad》'], ['foot|feet', 'قدم《qadam》'], ['leg|legs', 'رجل《rijl》/ساق《sāq》'], ['heart|hearts', 'قلب《qalb》'],
  ['tail|tails', 'ذيل《dhayl》'], ['body|bodies', 'جسم《jism》/جسد《jasad》'], ['hair', 'شعر《shaʿr》'],
  // home and things
  ['house|houses', 'بيت《bayt》/منزل《manzil》'], ['home', 'بيت《bayt》'], ['door|doors', 'باب《bāb》'], ['window|windows', 'نافذة《nāfidha》/شباك《shubbāk》'],
  ['table|tables', 'طاولة《ṭāwila》'], ['bed|beds', 'سرير《sarīr》'], ['garden|gardens', 'حديقة《ḥadīqa》'], ['car|cars', 'سيارة《sayyāra》'],
  ['bicycle|bicycles|bike|bikes', 'دراجة《darrāja》'], ['train|trains', 'قطار《qiṭār》'], ['boat|boats', 'قارب《qārib》'],
  ['plane|planes|aircraft', 'طائرة《ṭāʾira》'], ['book|books', 'كتاب《kitāb》'], ['letter|letters', 'رسالة《risāla》/حرف《ḥarf》'],
  ['money', 'مال《māl》/نقود《nuqūd》'], ['photo|photos|photograph|photographs', 'صورة《ṣūra》'], ['film|films|movie|movies', 'فيلم《film》'],
  ['music', 'موسيقى《mūsīqā》'], ['song|songs', 'أغنية《ughniya》'], ['game|games', 'لعبة《luʿba》'], ['name|names', 'اسم《ism》'],
  ['colour|colours|color|colors', 'لون《lawn》'], ['school|schools', 'مدرسة《madrasa》'],
  // places and nature
  ['city|cities', 'مدينة《madīna》'], ['town|towns', 'مدينة《madīna》/بلدة《balda》'], ['village|villages', 'قرية《qarya》'], ['country|countries', 'بلد《balad》/دولة《dawla》'],
  ['world', 'عالم《ʿālam》'], ['street|streets', 'شارع《shāriʿ》'], ['road|roads', 'طريق《ṭarīq》'], ['shop|shops', 'محل《maḥall》/متجر《matjar》'],
  ['sea|seas', 'بحر《baḥr》'], ['river|rivers', 'نهر《nahr》'], ['mountain|mountains', 'جبل《jabal》'], ['island|islands', 'جزيرة《jazīra》'],
  ['beach|beaches', 'شاطئ《shāṭiʾ》'], ['forest|forests', 'غابة《ghāba》'], ['tree|trees', 'شجرة《shajara》'], ['flower|flowers', 'زهرة《zahra》/وردة《warda》'],
  ['sun', 'شمس《shams》'], ['moon', 'قمر《qamar》'], ['star|stars', 'نجم《najm》/نجمة《najma》'], ['sky', 'سماء《samāʾ》'], ['snow', 'ثلج《thalj》'], ['rain', 'مطر《maṭar》'],
  ['water', 'ماء《māʾ》'], ['fire', 'نار《nār》'],
  // food
  ['food', 'طعام《ṭaʿām》/أكل《akl》'], ['bread', 'خبز《khubz》'], ['milk', 'حليب《ḥalīb》'], ['meat', 'لحم《laḥm》'], ['fruit|fruits', 'فاكهة《fākiha》'],
  ['apple|apples', 'تفاحة《tuffāḥa》'], ['coffee', 'قهوة《qahwa》'], ['egg|eggs', 'بيضة《bayḍa》'],
  // time
  ['day|days', 'يوم《yawm》'], ['night|nights', 'ليلة《layla》/ليل《layl》'], ['morning|mornings', 'صباح《ṣabāḥ》'], ['evening|evenings', 'مساء《masāʾ》'],
  ['week|weeks', 'أسبوع《usbūʿ》'], ['month|months', 'شهر《shahr》'], ['year|years', 'سنة《sana》/عام《ʿām》'], ['hour|hours', 'ساعة《sāʿa》'],
  ['summer', 'صيف《ṣayf》'], ['winter', 'شتاء《shitāʾ》'], ['autumn', 'خريف《kharīf》'], ['century|centuries', 'قرن《qarn》'],
  // adjectives
  ['big|large', 'كبير《kabīr》'], ['small|tiny', 'صغير《ṣaghīr》'], ['good', 'جيد《jayyid》'], ['bad', 'سيئ《sayyiʾ》'], ['new', 'جديد《jadīd》'],
  ['old', 'قديم《qadīm》/مسن《musinn》'], ['young', 'شاب《shābb》/صغير《ṣaghīr》'], ['long', 'طويل《ṭawīl》'], ['short', 'قصير《qaṣīr》'], ['hot|warm', 'حار《ḥārr》/دافئ《dāfiʾ》'],
  ['cold', 'بارد《bārid》'], ['happy', 'سعيد《saʿīd》'], ['sad', 'حزين《ḥazīn》'], ['beautiful', 'جميل《jamīl》'], ['pretty', 'جميل《jamīl》/لطيف《laṭīf》'],
  ['fast|quick', 'سريع《sarīʿ》'], ['slow', 'بطيء《baṭīʾ》'], ['easy', 'سهل《sahl》'], ['difficult', 'صعب《ṣaʿb》'], ['strong', 'قوي《qawī》'],
  ['important', 'مهم《muhimm》'], ['popular', 'شعبي《shaʿbī》/محبوب《maḥbūb》'], ['famous', 'مشهور《mashhūr》'],
  // colours
  ['red', 'أحمر《aḥmar》'], ['blue', 'أزرق《azraq》'], ['green', 'أخضر《akhḍar》'], ['white', 'أبيض《abyaḍ》'], ['black', 'أسود《aswad》'], ['yellow', 'أصفر《aṣfar》'],
  ['grey|gray', 'رمادي《ramādī》'], ['brown', 'بني《bunnī》'], ['pink', 'وردي《wardī》'], ['orange', 'برتقالي《burtuqālī》'],
  // general nouns and adjectives
  ['species', 'نوع《nawʿ》'], ['group|groups', 'مجموعة《majmūʿa》'], ['part|parts', 'جزء《juzʾ》'], ['number|numbers', 'عدد《ʿadad》/رقم《raqm》'],
  ['shape|shapes', 'شكل《shakl》'], ['size|sizes', 'حجم《ḥajm》'], ['life', 'حياة《ḥayāt》'], ['death', 'موت《mawt》'],
  ['skin|skins', 'جلد《jild》'], ['fur', 'فرو《farw》'], ['human|humans', 'إنسان《insān》'], ['adult|adults', 'بالغ《bāligh》'],
  ['health', 'صحة《ṣiḥḥa》'], ['disease|diseases', 'مرض《maraḍ》'], ['population|populations', 'سكان《sukkān》'],
  ['habitat|habitats', 'موطن《mawṭin》'], ['system|systems', 'نظام《niẓām》'], ['surface|surfaces', 'سطح《saṭḥ》'],
  ['structure|structures', 'بنية《binya》/هيكل《haykal》'], ['region|regions', 'منطقة《minṭaqa》'], ['zone|zones', 'منطقة《minṭaqa》'], ['energy', 'طاقة《ṭāqa》'],
  ['climate', 'مناخ《munākh》'], ['history', 'تاريخ《tārīkh》'], ['science', 'علم《ʿilm》'], ['problem|problems', 'مشكلة《mushkila》'],
  ['example|examples', 'مثال《mithāl》'], ['image|images', 'صورة《ṣūra》'], ['type|types', 'نوع《nawʿ》'], ['nature', 'طبيعة《ṭabīʿa》'],
  ['culture|cultures', 'ثقافة《thaqāfa》'], ['protection', 'حماية《ḥimāya》'], ['production', 'إنتاج《intāj》'], ['information', 'معلومات《maʿlūmāt》'],
  ['nation|nations', 'أمة《umma》/شعب《shaʿb》'], ['million|millions', 'مليون《milyūn》'], ['minute|minutes', 'دقيقة《daqīqa》'], ['sport|sports', 'رياضة《riyāḍa》'],
  ['centre|centres|center|centers', 'مركز《markaz》'], ['planet|planets', 'كوكب《kawkab》'], ['ocean|oceans', 'محيط《muḥīṭ》'],
  ['plant|plants', 'نبات《nabāt》'], ['fish', 'سمك《samak》/سمكة《samaka》'], ['wild', 'بري《barrī》'], ['natural', 'طبيعي《ṭabīʿī》'],
  ['central', 'مركزي《markazī》'], ['national', 'وطني《waṭanī》'], ['international', 'دولي《duwalī》'], ['high', 'مرتفع《murtafiʿ》'],
  ['low', 'منخفض《munkhafiḍ》'], ['rare', 'نادر《nādir》'], ['common', 'شائع《shāʾiʿ》'], ['different', 'مختلف《mukhtalif》'], ['possible', 'ممكن《mumkin》'],
  ['normal', 'عادي《ʿādī》'], ['simple', 'بسيط《basīṭ》'], ['modern', 'حديث《ḥadīth》'], ['original', 'أصلي《aṣlī》'],
  ['true', 'صحيح《ṣaḥīḥ》/حقيقي《ḥaqīqī》'], ['full', 'ممتلئ《mumtaliʾ》'], ['dark', 'مظلم《muẓlim》/داكن《dākin》'],
];

const RANK_2: Array<[string, string]> = [
  // verbs: the model puts them in the form the English needs
  ['eat|eats|ate|eaten|eating', 'أكل《akala》'], ['drink|drinks|drank|drinking', 'شرب《shariba》'], ['sleep|sleeps|slept|sleeping', 'نام《nāma》'],
  ['run|runs|ran|running', 'ركض《rakaḍa》'], ['walk|walks|walked|walking', 'مشى《mashā》'], ['play|plays|played|playing', 'لعب《laʿiba》'],
  ['live|lives|lived|living', 'عاش《ʿāsha》/سكن《sakana》'], ['love|loves|loved|loving', 'أحب《aḥabba》'], ['see|sees|saw|seen|seeing', 'رأى《raʾā》'],
  ['go|goes|went|gone|going', 'ذهب《dhahaba》'], ['come|comes|came|coming', 'جاء《jāʾa》'], ['make|makes|made|making', 'صنع《ṣanaʿa》'],
  ['give|gives|gave|given|giving', 'أعطى《aʿṭā》'], ['take|takes|took|taken|taking', 'أخذ《akhadha》'], ['find|finds|found|finding', 'وجد《wajada》'],
  ['buy|buys|bought|buying', 'اشترى《ishtarā》'], ['sell|sells|sold|selling', 'باع《bāʿa》'],
  ['begin|begins|began|begun|beginning|start|starts|started|starting', 'بدأ《badaʾa》'],
  ['finish|finishes|finished|finishing', 'أنهى《anhā》/انتهى《intahā》'], ['win|wins|won|winning', 'فاز《fāza》'], ['lose|loses|lost|losing', 'خسر《khasira》/فقد《faqada》'],
  ['help|helps|helped|helping', 'ساعد《sāʿada》'], ['want|wants|wanted|wanting', 'أراد《arāda》'], ['think|thinks|thought|thinking', 'فكر《fakkara》/ظن《ẓanna》'],
  ['become|becomes|became|becoming', 'أصبح《aṣbaḥa》/صار《ṣāra》'], ['die|dies|died|dying', 'مات《māta》'], ['call|calls|called|calling', 'اتصل《ittaṣala》/سمى《sammā》'],
  ['work|works|worked|working', 'عمل《ʿamila》/عمل《ʿamal》'], ['travel|travels|travelled|traveled|travelling|traveling', 'سافر《sāfara》'],
  ['hunt|hunts|hunted|hunting', 'اصطاد《iṣṭāda》'], ['wait|waits|waited|waiting', 'انتظر《intaẓara》'], ['carry|carries|carried|carrying', 'حمل《ḥamala》'],
  // adverbs
  ['often', 'غالبا《ghāliban》/كثيرا《kathīran》'], ['always', 'دائما《dāʾiman》'], ['sometimes', 'أحيانا《aḥyānan》'], ['today', 'اليوم《al-yawm》'],
  ['now', 'الآن《al-ān》'], ['here', 'هنا《hunā》'], ['together', 'معا《maʿan》'], ['quickly', 'بسرعة《bi-surʿa》'], ['early', 'مبكرا《mubakkiran》'], ['late', 'متأخرا《mutaʾakhkhiran》'],
  ['grow|grows|grew|grown|growing', 'نما《namā》/كبر《kabura》'], ['feed|feeds|fed|feeding', 'أطعم《aṭʿama》'],
  ['move|moves|moved|moving', 'تحرك《taḥarraka》'], ['show|shows|showed|shown|showing', 'أظهر《aẓhara》/عرض《ʿaraḍa》'],
  ['change|changes|changed|changing', 'غير《ghayyara》/تغير《taghayyara》'], ['use|uses|used|using', 'استخدم《istakhdama》'],
  // small words: the most common of all, so they come after the nouns and are capped like the rest
  ['from', 'من《min》'], ['without', 'بدون《bidūn》'], ['between', 'بين《bayna》'], ['after', 'بعد《baʿda》'], ['before', 'قبل《qabla》'],
  ['under', 'تحت《taḥta》'], ['during', 'خلال《khilāl》/أثناء《athnāʾ》'], ['some', 'بعض《baʿḍ》'], ['many', 'كثير《kathīr》'], ['all', 'كل《kull》'],
  ['each|every', 'كل《kull》'], ['several', 'عدة《ʿiddat》'], ['they', 'هم《hum》/هن《hunna》'],
];

export const AR_EASY_WORDS: EasyWord[] = [
  ...RANK_1.map(([forms, lemma]) => ({ forms, lemma, rank: 1 as const })),
  ...RANK_2.map(([forms, lemma]) => ({ forms, lemma, rank: 2 as const })),
];

// Everyday A1 vocabulary, grouped by theme: the top-up may only weave these
// (plus the lesson's own words), so the extra words stay at the reader's level.
const nouns: Array<[string, string, Gender]> = [
  // people and family
  ['رجل《rajul》', 'man', 'm'], ['امرأة《imraʾa》', 'woman', 'f'], ['طفل《ṭifl》', 'child', 'm'], ['ولد《walad》', 'boy', 'm'], ['بنت《bint》', 'girl, daughter', 'f'],
  ['صديق《ṣadīq》', 'friend', 'm'], ['صديقة《ṣadīqa》', 'friend (f)', 'f'], ['عائلة《ʿāʾila》', 'family', 'f'], ['أب《ab》', 'father', 'm'],
  ['أم《umm》', 'mother', 'f'], ['أخ《akh》', 'brother', 'm'], ['أخت《ukht》', 'sister', 'f'], ['ابن《ibn》', 'son', 'm'],
  ['زوج《zawj》', 'husband', 'm'], ['زوجة《zawja》', 'wife', 'f'], ['والدان《wālidān》', 'parents', 'm'], ['ناس《nās》', 'people', 'm'],
  ['معلم《muʿallim》', 'teacher', 'm'], ['طالب《ṭālib》', 'student', 'm'], ['تلميذ《tilmīdh》', 'pupil', 'm'],
  // body
  ['جسم《jism》', 'body', 'm'], ['رأس《raʾs》', 'head', 'm'], ['عين《ʿayn》', 'eye', 'f'], ['أذن《udhun》', 'ear', 'f'], ['أنف《anf》', 'nose', 'm'],
  ['فم《fam》', 'mouth', 'm'], ['سن《sinn》', 'tooth', 'f'], ['رقبة《raqaba》', 'neck', 'f'], ['ظهر《ẓahr》', 'back', 'm'], ['يد《yad》', 'hand', 'f'],
  ['رجل《rijl》', 'leg, foot', 'f'], ['ذيل《dhayl》', 'tail', 'm'], ['قلب《qalb》', 'heart', 'm'], ['شعر《shaʿr》', 'hair', 'm'],
  // animals
  ['حيوان《ḥayawān》', 'animal', 'm'], ['كلب《kalb》', 'dog', 'm'], ['قطة《qiṭṭa》', 'cat', 'f'], ['حصان《ḥiṣān》', 'horse', 'm'],
  ['طائر《ṭāʾir》', 'bird', 'm'], ['سمكة《samaka》', 'fish', 'f'], ['أرنب《arnab》', 'rabbit', 'm'], ['بقرة《baqara》', 'cow', 'f'],
  ['خروف《kharūf》', 'sheep', 'm'], ['فأر《faʾr》', 'mouse', 'm'], ['جمل《jamal》', 'camel', 'm'],
  // home and objects
  ['بيت《bayt》', 'house, home', 'm'], ['شقة《shaqqa》', 'flat', 'f'], ['غرفة《ghurfa》', 'room', 'f'], ['مطبخ《maṭbakh》', 'kitchen', 'm'],
  ['باب《bāb》', 'door', 'm'], ['نافذة《nāfidha》', 'window', 'f'], ['طاولة《ṭāwila》', 'table', 'f'], ['كرسي《kursī》', 'chair', 'm'],
  ['سرير《sarīr》', 'bed', 'm'], ['حديقة《ḥadīqa》', 'garden', 'f'], ['كتاب《kitāb》', 'book', 'm'], ['صفحة《ṣafḥa》', 'page', 'f'], ['قلم《qalam》', 'pen', 'm'],
  ['صورة《ṣūra》', 'picture, photo', 'f'], ['هاتف《hātif》', 'phone', 'm'], ['سيارة《sayyāra》', 'car', 'f'], ['دراجة《darrāja》', 'bike', 'f'],
  ['قطار《qiṭār》', 'train', 'm'], ['حافلة《ḥāfila》', 'bus', 'f'], ['مال《māl》', 'money', 'm'], ['مفتاح《miftāḥ》', 'key', 'm'], ['حقيبة《ḥaqība》', 'bag', 'f'],
  ['لعبة《luʿba》', 'toy, game', 'f'],
  // places
  ['مدينة《madīna》', 'city, town', 'f'], ['قرية《qarya》', 'village', 'f'], ['بلد《balad》', 'country', 'm'], ['شارع《shāriʿ》', 'street', 'm'],
  ['طريق《ṭarīq》', 'way, road', 'm'], ['مدرسة《madrasa》', 'school', 'f'], ['فصل《faṣl》', 'class', 'm'], ['محل《maḥall》', 'shop', 'm'],
  ['سوق《sūq》', 'market', 'f'], ['حديقة《ḥadīqa》 عامة《ʿāmma》', 'park', 'f'], ['محطة《maḥaṭṭa》', 'station, stop', 'f'], ['بحر《baḥr》', 'sea', 'm'],
  ['جبل《jabal》', 'mountain', 'm'], ['نهر《nahr》', 'river', 'm'], ['غابة《ghāba》', 'forest', 'f'], ['حقل《ḥaql》', 'field', 'm'],
  ['عالم《ʿālam》', 'world', 'm'], ['عمل《ʿamal》', 'work, job', 'm'], ['مكتب《maktab》', 'office, desk', 'm'], ['صحراء《ṣaḥrāʾ》', 'desert', 'f'],
  // food
  ['ماء《māʾ》', 'water', 'm'], ['خبز《khubz》', 'bread', 'm'], ['حليب《ḥalīb》', 'milk', 'm'], ['فاكهة《fākiha》', 'fruit', 'f'], ['تفاحة《tuffāḥa》', 'apple', 'f'],
  ['شاي《shāy》', 'tea', 'm'], ['قهوة《qahwa》', 'coffee', 'f'], ['أرز《aruzz》', 'rice', 'm'], ['طعام《ṭaʿām》', 'food', 'm'], ['بيضة《bayḍa》', 'egg', 'f'],
  ['خضار《khuḍār》', 'vegetables', 'm'], ['جبن《jubn》', 'cheese', 'm'], ['تمر《tamr》', 'dates (fruit)', 'm'],
  // time
  ['يوم《yawm》', 'day', 'm'], ['ليلة《layla》', 'night', 'f'], ['صباح《ṣabāḥ》', 'morning', 'm'], ['مساء《masāʾ》', 'evening', 'm'], ['أسبوع《usbūʿ》', 'week', 'm'],
  ['شهر《shahr》', 'month', 'm'], ['سنة《sana》', 'year', 'f'], ['ساعة《sāʿa》', 'hour, clock', 'f'], ['دقيقة《daqīqa》', 'minute', 'f'], ['وقت《waqt》', 'time', 'm'],
  ['طقس《ṭaqs》', 'weather', 'm'], ['صيف《ṣayf》', 'summer', 'm'], ['شتاء《shitāʾ》', 'winter', 'm'],
  // things in general
  ['شيء《shayʾ》', 'thing', 'm'], ['اسم《ism》', 'name', 'm'], ['كلمة《kalima》', 'word', 'f'], ['سؤال《suʾāl》', 'question', 'm'],
  ['جواب《jawāb》', 'answer', 'm'], ['العربية《al-ʿarabiyya》', 'Arabic (language)', 'f'], ['الإنجليزية《al-injilīziyya》', 'English (language)', 'f'],
  ['لون《lawn》', 'colour', 'm'], ['مرض《maraḍ》', 'illness', 'm'], ['مشكلة《mushkila》', 'problem', 'f'],
];

const verbs: Array<[string, string]> = [
  ['كان《kāna》', 'to be (past)'], ['ذهب《dhahaba》', 'to go'], ['جاء《jāʾa》', 'to come'], ['فعل《faʿala》', 'to do'],
  ['قال《qāla》', 'to say'], ['تكلم《takallama》', 'to speak'], ['رأى《raʾā》', 'to see'], ['سمع《samiʿa》', 'to hear'],
  ['سأل《saʾala》', 'to ask'], ['عرف《ʿarafa》', 'to know'], ['فهم《fahima》', 'to understand'], ['درس《darasa》', 'to study'],
  ['قرأ《qaraʾa》', 'to read'], ['كتب《kataba》', 'to write'], ['استطاع《istaṭāʿa》', 'can, to be able'], ['أراد《arāda》', 'to want'],
  ['أحب《aḥabba》', 'to love, like'], ['أكل《akala》', 'to eat'], ['شرب《shariba》', 'to drink'], ['نام《nāma》', 'to sleep'],
  ['استيقظ《istayqaẓa》', 'to wake up'], ['جلس《jalasa》', 'to sit'], ['ركض《rakaḍa》', 'to run'], ['لعب《laʿiba》', 'to play'],
  ['سكن《sakana》', 'to live (somewhere)'], ['عمل《ʿamila》', 'to work'], ['أعطى《aʿṭā》', 'to give'], ['أخذ《akhadha》', 'to take'],
  ['وضع《waḍaʿa》', 'to put'], ['اشترى《ishtarā》', 'to buy'], ['باع《bāʿa》', 'to sell'], ['بحث《baḥatha》', 'to look for'],
  ['فتح《fataḥa》', 'to open'], ['أغلق《aghlaqa》', 'to close'], ['بدأ《badaʾa》', 'to begin'], ['سبح《sabaḥa》', 'to swim'],
  ['طار《ṭāra》', 'to fly'], ['انتظر《intaẓara》', 'to wait'], ['فكر《fakkara》', 'to think'], ['مات《māta》', 'to die'],
  ['قابل《qābala》', 'to meet'], ['ارتاح《irtāḥa》', 'to rest'], ['غير《ghayyara》', 'to change'], ['رجع《rajaʿa》', 'to return'],
  ['سافر《sāfara》', 'to travel'],
];

const adjectives: Array<[string, string]> = [
  ['جيد《jayyid》', 'good'], ['سيئ《sayyiʾ》', 'bad'], ['كبير《kabīr》', 'big'], ['صغير《ṣaghīr》', 'small'], ['طويل《ṭawīl》', 'long, tall'],
  ['قصير《qaṣīr》', 'short'], ['رخيص《rakhīṣ》', 'cheap'], ['غالي《ghālī》', 'expensive'], ['جديد《jadīd》', 'new'],
  ['قديم《qadīm》', 'old (things)'], ['شاب《shābb》', 'young'], ['مسن《musinn》', 'old (people)'], ['سريع《sarīʿ》', 'fast'], ['بطيء《baṭīʾ》', 'slow'],
  ['قوي《qawī》', 'strong'], ['ضعيف《ḍaʿīf》', 'weak'], ['سهل《sahl》', 'easy'], ['صعب《ṣaʿb》', 'difficult'], ['حار《ḥārr》', 'hot'],
  ['بارد《bārid》', 'cold'], ['سعيد《saʿīd》', 'happy'], ['حزين《ḥazīn》', 'sad'], ['لطيف《laṭīf》', 'nice, kind'], ['جميل《jamīl》', 'beautiful'],
  ['لذيذ《ladhīdh》', 'tasty'], ['مشغول《mashghūl》', 'busy'], ['نظيف《naẓīf》', 'clean'], ['وسخ《wasikh》', 'dirty'], ['مهم《muhimm》', 'important'],
  ['مشهور《mashhūr》', 'famous'], ['صحيح《ṣaḥīḥ》', 'right, true'],
  ['أحمر《aḥmar》', 'red'], ['أزرق《azraq》', 'blue'], ['أخضر《akhḍar》', 'green'], ['أصفر《aṣfar》', 'yellow'], ['أبيض《abyaḍ》', 'white'], ['أسود《aswad》', 'black'],
];

const others: Array<[string, string]> = [
  ['أو《aw》', 'or'], ['لكن《lākin》', 'but'], ['لأن《li-anna》', 'because'], ['إذا《idhā》', 'if'], ['متى《matā》', 'when?'],
  ['جدا《jiddan》', 'very'], ['قليلا《qalīlan》', 'a little'], ['أكثر《akthar》', 'more'], ['أقل《aqall》', 'less'], ['أيضا《ayḍan》', 'also'],
  ['مرة《marratan》 أخرى《ukhrā》', 'again'], ['الآن《al-ān》', 'now'], ['دائما《dāʾiman》', 'always'], ['أحيانا《aḥyānan》', 'sometimes'],
  ['اليوم《al-yawm》', 'today'], ['غدا《ghadan》', 'tomorrow'], ['أمس《ams》', 'yesterday'], ['هنا《hunā》', 'here'], ['هناك《hunāka》', 'there'],
  ['أين《ayna》', 'where'], ['من《man》', 'who'], ['ماذا《mādhā》', 'what'], ['لماذا《limādhā》', 'why'], ['كيف《kayfa》', 'how'], ['كل《kull》', 'all, every'],
  ['نعم《naʿam》', 'yes'], ['لا《lā》', 'no, not'], ['مع《maʿa》', 'with'], ['بدون《bidūn》', 'without'], ['من《min》', 'from'], ['على《ʿalā》', 'on'],
  ['بجانب《bi-jānib》', 'next to'], ['بين《bayna》', 'between'], ['قبل《qabla》', 'before'], ['بعد《baʿda》', 'after'],
];

export const AR_A1_WORDS: A1Word[] = [
  ...nouns.map(([lemma, en, g]) => ({ lemma, en, g })),
  ...[...verbs, ...adjectives, ...others].map(([lemma, en]) => ({ lemma, en })),
];
