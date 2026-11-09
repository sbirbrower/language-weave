import type { A1Word } from '../a1';
import type { EasyWord } from '../easy';
import type { Gender } from '../../languages';

// Hebrew counterparts of the French lists in `easy.ts` and `a1.ts`, with readings (src/ruby.ts). Nouns in
// the singular without the article, adjectives in the masculine singular, verbs in the infinitive with ל;
// a compound noun (בית ספר) is written as both words. Left out of the French list's small words: is, are,
// was and were (no "is" in the present, and the past agrees with its subject), has and had (יש ל), from
// (מ joins the next word), under (מתחת ל, the same), during, several, few, this and these (they follow the
// noun), same and other (they follow it too, agreeing), and never, which needs לא before the verb.

// Easy words: the same English as the French list, so both find the same places.
const RANK_1: Array<[string, string]> = [
  // people
  ['man|men', 'איש《ish》/גבר《géver》'], ['woman|women', 'אישה《isha》'], ['child|children', 'ילד《yéled》'],
  ['boy|boys', 'ילד《yéled》/נער《ná\'ar》'], ['girl|girls', 'ילדה《yalda》/נערה《na\'ara》'], ['baby|babies', 'תינוק《tinok》'], ['friend|friends', 'חבר《khaver》'],
  ['family|families', 'משפחה《mishpakha》'], ['father|fathers', 'אבא《ába》/אב《av》'], ['mother|mothers', 'אמא《íma》/אם《em》'],
  ['brother|brothers', 'אח《akh》'], ['sister|sisters', 'אחות《akhot》'], ['son|sons', 'בן《ben》'], ['daughter|daughters', 'בת《bat》'],
  ['husband|husbands', 'בעל《bá\'al》'], ['wife|wives', 'אישה《isha》'], ['people', 'אנשים《anashim》'], ['person', 'אדם《adam》'],
  ['king|kings', 'מלך《mélekh》'], ['queen|queens', 'מלכה《malka》'],
  // animals
  ['animal|animals', 'חיה《khaya》'], ['dog|dogs', 'כלב《kélev》'], ['cat|cats', 'חתול《khatul》'], ['horse|horses', 'סוס《sus》'],
  ['bird|birds', 'ציפור《tsipor》'], ['rabbit|rabbits', 'ארנב《arnav》'], ['cow|cows', 'פרה《para》'], ['sheep', 'כבשה《kivsa》/כבש《kéves》'],
  ['mouse|mice', 'עכבר《akhbar》'],
  // body
  ['head|heads', 'ראש《rosh》'], ['eye|eyes', 'עין《áyin》'], ['ear|ears', 'אוזן《ózen》'], ['nose|noses', 'אף《af》'], ['mouth', 'פה《pe》'],
  ['hand|hands', 'יד《yad》'], ['foot|feet', 'רגל《régel》/כף《kaf》 רגל《régel》'], ['leg|legs', 'רגל《régel》'], ['heart|hearts', 'לב《lev》'],
  ['tail|tails', 'זנב《zanav》'], ['body|bodies', 'גוף《guf》'], ['hair', 'שיער《se\'ar》'],
  // home and things
  ['house|houses', 'בית《báyit》'], ['home', 'בית《báyit》'], ['door|doors', 'דלת《délet》'], ['window|windows', 'חלון《khalon》'],
  ['table|tables', 'שולחן《shulkhan》'], ['bed|beds', 'מיטה《mita》'], ['garden|gardens', 'גינה《gina》'], ['car|cars', 'מכונית《mekhonit》/אוטו《óto》'],
  ['bicycle|bicycles|bike|bikes', 'אופניים《ofanáyim》'], ['train|trains', 'רכבת《rakévet》'], ['boat|boats', 'סירה《sira》'],
  ['plane|planes|aircraft', 'מטוס《matos》'], ['book|books', 'ספר《séfer》'], ['letter|letters', 'מכתב《mikhtav》/אות《ot》'],
  ['money', 'כסף《késef》'], ['photo|photos|photograph|photographs', 'תמונה《tmuna》'], ['film|films|movie|movies', 'סרט《séret》'],
  ['music', 'מוזיקה《múzika》'], ['song|songs', 'שיר《shir》'], ['game|games', 'משחק《miskhak》'], ['name|names', 'שם《shem》'],
  ['colour|colours|color|colors', 'צבע《tséva》'], ['school|schools', 'בית《beyt》 ספר《séfer》'],
  // places and nature
  ['city|cities', 'עיר《ir》'], ['town|towns', 'עיר《ir》/עיירה《ayara》'], ['village|villages', 'כפר《kfar》'], ['country|countries', 'ארץ《érets》/מדינה《medina》'],
  ['world', 'עולם《olam》'], ['street|streets', 'רחוב《rekhov》'], ['road|roads', 'כביש《kvish》/דרך《dérekh》'], ['shop|shops', 'חנות《khanut》'],
  ['sea|seas', 'ים《yam》'], ['river|rivers', 'נהר《nahar》'], ['mountain|mountains', 'הר《har》'], ['island|islands', 'אי《i》'],
  ['beach|beaches', 'חוף《khof》'], ['forest|forests', 'יער《yá\'ar》'], ['tree|trees', 'עץ《ets》'], ['flower|flowers', 'פרח《pérakh》'],
  ['sun', 'שמש《shémesh》'], ['moon', 'ירח《yaréakh》'], ['star|stars', 'כוכב《kokhav》'], ['sky', 'שמיים《shamáyim》'], ['snow', 'שלג《shéleg》'], ['rain', 'גשם《géshem》'],
  ['water', 'מים《máyim》'], ['fire', 'אש《esh》'],
  // food
  ['food', 'אוכל《ókhel》'], ['bread', 'לחם《lékhem》'], ['milk', 'חלב《khalav》'], ['meat', 'בשר《basar》'], ['fruit|fruits', 'פרי《pri》'],
  ['apple|apples', 'תפוח《tapúakh》'], ['coffee', 'קפה《kafe》'], ['egg|eggs', 'ביצה《beytsa》'],
  // time
  ['day|days', 'יום《yom》'], ['night|nights', 'לילה《láyla》'], ['morning|mornings', 'בוקר《bóker》'], ['evening|evenings', 'ערב《érev》'],
  ['week|weeks', 'שבוע《shavú\'a》'], ['month|months', 'חודש《khódesh》'], ['year|years', 'שנה《shana》'], ['hour|hours', 'שעה《sha\'a》'],
  ['summer', 'קיץ《káyits》'], ['winter', 'חורף《khóref》'], ['autumn', 'סתיו《stav》'], ['century|centuries', 'מאה《me\'a》'],
  // adjectives
  ['big|large', 'גדול《gadol》'], ['small|tiny', 'קטן《katan》'], ['good', 'טוב《tov》'], ['bad', 'רע《ra》'], ['new', 'חדש《khadash》'],
  ['old', 'ישן《yashan》/זקן《zaken》'], ['young', 'צעיר《tsa\'ir》'], ['long', 'ארוך《arokh》'], ['short', 'קצר《katsar》'], ['hot|warm', 'חם《kham》'],
  ['cold', 'קר《kar》'], ['happy', 'שמח《saméakh》'], ['sad', 'עצוב《atsuv》'], ['beautiful', 'יפה《yafe》'], ['pretty', 'יפה《yafe》/חמוד《khamud》'],
  ['fast|quick', 'מהיר《mahir》'], ['slow', 'איטי《iti》'], ['easy', 'קל《kal》'], ['difficult', 'קשה《kashe》'], ['strong', 'חזק《khazak》'],
  ['important', 'חשוב《khashuv》'], ['popular', 'פופולרי《populári》'], ['famous', 'מפורסם《mefursam》'],
  // colours
  ['red', 'אדום《adom》'], ['blue', 'כחול《kakhol》'], ['green', 'ירוק《yarok》'], ['white', 'לבן《lavan》'], ['black', 'שחור《shakhor》'], ['yellow', 'צהוב《tsahov》'],
  ['grey|gray', 'אפור《afor》'], ['brown', 'חום《khum》'], ['pink', 'ורוד《varod》'], ['orange', 'כתום《katom》'],
  // general nouns and adjectives
  ['species', 'מין《min》'], ['group|groups', 'קבוצה《kvutsa》/להקה《lahaka》'], ['part|parts', 'חלק《khélek》'], ['number|numbers', 'מספר《mispar》'],
  ['shape|shapes', 'צורה《tsura》'], ['size|sizes', 'גודל《gódel》'], ['life', 'חיים《khayim》'], ['death', 'מוות《mávet》'],
  ['skin|skins', 'עור《or》'], ['fur', 'פרווה《parva》'], ['human|humans', 'אדם《adam》/בן《ben》 אדם《adam》'], ['adult|adults', 'מבוגר《mevugar》'],
  ['health', 'בריאות《bri\'ut》'], ['disease|diseases', 'מחלה《makhala》'], ['population|populations', 'אוכלוסייה《ukhlosiya》'],
  ['habitat|habitats', 'בית《beyt》 גידול《gidul》'], ['system|systems', 'מערכת《ma\'arékhet》'], ['surface|surfaces', 'שטח《shétakh》/משטח《mishtakh》'],
  ['structure|structures', 'מבנה《mivne》'], ['region|regions', 'אזור《ezor》'], ['zone|zones', 'אזור《ezor》'], ['energy', 'אנרגיה《enérgya》'],
  ['climate', 'אקלים《aklim》'], ['history', 'היסטוריה《histórya》'], ['science', 'מדע《mada》'], ['problem|problems', 'בעיה《be\'aya》'],
  ['example|examples', 'דוגמה《dugma》'], ['image|images', 'תמונה《tmuna》'], ['type|types', 'סוג《sug》'], ['nature', 'טבע《téva》'],
  ['culture|cultures', 'תרבות《tarbut》'], ['protection', 'הגנה《hagana》'], ['production', 'ייצור《yitsur》'], ['information', 'מידע《méyda》'],
  ['nation|nations', 'אומה《uma》/עם《am》'], ['million|millions', 'מיליון《milyon》'], ['minute|minutes', 'דקה《daka》'], ['sport|sports', 'ספורט《sport》'],
  ['centre|centres|center|centers', 'מרכז《merkaz》'], ['planet|planets', 'כוכב《kokhav》 לכת《lékhet》'], ['ocean|oceans', 'אוקיינוס《ókyanos》'],
  ['plant|plants', 'צמח《tsémakh》'], ['fish', 'דג《dag》'], ['wild', 'פראי《pir\'i》'], ['natural', 'טבעי《tiv\'i》'],
  ['central', 'מרכזי《merkazi》'], ['national', 'לאומי《le\'umi》'], ['international', 'בינלאומי《beynle\'umi》'], ['high', 'גבוה《gavóa》'],
  ['low', 'נמוך《namukh》'], ['rare', 'נדיר《nadir》'], ['common', 'נפוץ《nafots》'], ['different', 'שונה《shone》'], ['possible', 'אפשרי《efshari》'],
  ['normal', 'רגיל《ragil》/נורמלי《normáli》'], ['simple', 'פשוט《pashut》'], ['modern', 'מודרני《modérni》'], ['original', 'מקורי《mekori》'],
  ['true', 'נכון《nakhon》/אמיתי《amiti》'], ['full', 'מלא《male》'], ['dark', 'חשוך《khashukh》/כהה《kehe》'],
];

const RANK_2: Array<[string, string]> = [
  // verbs: the model puts them in the form the English needs
  ['eat|eats|ate|eaten|eating', 'לאכול《le\'ekhol》'], ['drink|drinks|drank|drinking', 'לשתות《lishtot》'], ['sleep|sleeps|slept|sleeping', 'לישון《lishon》'],
  ['run|runs|ran|running', 'לרוץ《laruts》'], ['walk|walks|walked|walking', 'ללכת《lalékhet》'], ['play|plays|played|playing', 'לשחק《lesakhek》'],
  ['live|lives|lived|living', 'לגור《lagur》/לחיות《likhyot》'], ['love|loves|loved|loving', 'לאהוב《le\'ehov》'], ['see|sees|saw|seen|seeing', 'לראות《lir\'ot》'],
  ['go|goes|went|gone|going', 'ללכת《lalékhet》'], ['come|comes|came|coming', 'לבוא《lavo》'], ['make|makes|made|making', 'לעשות《la\'asot》'],
  ['give|gives|gave|given|giving', 'לתת《latet》'], ['take|takes|took|taken|taking', 'לקחת《lakákhat》'], ['find|finds|found|finding', 'למצוא《limtso》'],
  ['buy|buys|bought|buying', 'לקנות《liknot》'], ['sell|sells|sold|selling', 'למכור《limkor》'],
  ['begin|begins|began|begun|beginning|start|starts|started|starting', 'להתחיל《lehatkhil》'],
  ['finish|finishes|finished|finishing', 'לגמור《ligmor》/לסיים《lesayem》'], ['win|wins|won|winning', 'לנצח《lenatséakh》'], ['lose|loses|lost|losing', 'להפסיד《lehafsid》/לאבד《le\'abed》'],
  ['help|helps|helped|helping', 'לעזור《la\'azor》'], ['want|wants|wanted|wanting', 'לרצות《lirtsot》'], ['think|thinks|thought|thinking', 'לחשוב《lakhshov》'],
  ['become|becomes|became|becoming', 'להיות《lihyot》/להפוך《lahafokh》'], ['die|dies|died|dying', 'למות《lamut》'], ['call|calls|called|calling', 'לקרוא《likro》/להתקשר《lehitkasher》'],
  ['work|works|worked|working', 'לעבוד《la\'avod》/עבודה《avoda》'], ['travel|travels|travelled|traveled|travelling|traveling', 'לנסוע《linsó\'a》/לטייל《letayel》'],
  ['hunt|hunts|hunted|hunting', 'לצוד《latsud》'], ['wait|waits|waited|waiting', 'לחכות《lekhakot》'], ['carry|carries|carried|carrying', 'לסחוב《liskhov》/לשאת《laset》'],
  // adverbs
  ['often', 'לעיתים《le\'itim》 קרובות《krovot》'], ['always', 'תמיד《tamid》'], ['sometimes', 'לפעמים《lif\'amim》'], ['today', 'היום《hayom》'],
  ['now', 'עכשיו《akhshav》'], ['here', 'כאן《kan》/פה《po》'], ['together', 'ביחד《beyákhad》'], ['quickly', 'מהר《maher》'], ['early', 'מוקדם《mukdam》'], ['late', 'מאוחר《me\'ukhar》'],
  ['grow|grows|grew|grown|growing', 'לגדול《ligdol》/לצמוח《litsmó\'akh》'], ['feed|feeds|fed|feeding', 'להאכיל《leha\'akhil》'],
  ['move|moves|moved|moving', 'לזוז《lazuz》'], ['show|shows|showed|shown|showing', 'להראות《lehar\'ot》'],
  ['change|changes|changed|changing', 'לשנות《leshanot》/להשתנות《lehishtanot》'], ['use|uses|used|using', 'להשתמש《lehishtamesh》'],
  // small words: the most common of all, so they come after the nouns and are capped like the rest
  ['for', 'בשביל《bishvil》'], ['without', 'בלי《bli》'], ['between', 'בין《beyn》'], ['after', 'אחרי《akharey》'], ['before', 'לפני《lifney》'],
  ['some', 'כמה《káma》'], ['many', 'הרבה《harbe》'], ['all', 'כל《kol》'], ['each|every', 'כל《kol》'], ['they', 'הם《hem》/הן《hen》'],
];

export const HE_EASY_WORDS: EasyWord[] = [
  ...RANK_1.map(([forms, lemma]) => ({ forms, lemma, rank: 1 as const })),
  ...RANK_2.map(([forms, lemma]) => ({ forms, lemma, rank: 2 as const })),
];

// Everyday A1 vocabulary, grouped by theme: the top-up may only weave these
// (plus the lesson's own words), so the extra words stay at the reader's level.
const nouns: Array<[string, string, Gender]> = [
  // people and family
  ['איש《ish》', 'man', 'm'], ['אישה《isha》', 'woman, wife', 'f'], ['ילד《yéled》', 'child, boy', 'm'], ['ילדה《yalda》', 'girl', 'f'],
  ['חבר《khaver》', 'friend', 'm'], ['חברה《khavera》', 'friend (f)', 'f'], ['משפחה《mishpakha》', 'family', 'f'], ['אבא《ába》', 'father', 'm'],
  ['אמא《íma》', 'mother', 'f'], ['אח《akh》', 'brother', 'm'], ['אחות《akhot》', 'sister', 'f'], ['בן《ben》', 'son', 'm'],
  ['בת《bat》', 'daughter', 'f'], ['בעל《bá\'al》', 'husband', 'm'], ['הורים《horim》', 'parents', 'm'], ['אנשים《anashim》', 'people', 'm'],
  ['מורה《more》', 'teacher', 'm'], ['תלמיד《talmid》', 'pupil', 'm'], ['סטודנט《student》', 'student', 'm'],
  // body
  ['גוף《guf》', 'body', 'm'], ['ראש《rosh》', 'head', 'm'], ['עין《áyin》', 'eye', 'f'], ['אוזן《ózen》', 'ear', 'f'], ['אף《af》', 'nose', 'm'],
  ['פה《pe》', 'mouth', 'm'], ['שן《shen》', 'tooth', 'f'], ['צוואר《tsavar》', 'neck', 'm'], ['גב《gav》', 'back', 'm'], ['יד《yad》', 'hand, arm', 'f'],
  ['רגל《régel》', 'leg, foot', 'f'], ['זנב《zanav》', 'tail', 'm'], ['לב《lev》', 'heart', 'm'], ['שיער《se\'ar》', 'hair', 'm'],
  // animals
  ['חיה《khaya》', 'animal', 'f'], ['כלב《kélev》', 'dog', 'm'], ['חתול《khatul》', 'cat', 'm'], ['סוס《sus》', 'horse', 'm'],
  ['ציפור《tsipor》', 'bird', 'f'], ['דג《dag》', 'fish', 'm'], ['ארנב《arnav》', 'rabbit', 'm'], ['פרה《para》', 'cow', 'f'],
  ['כבשה《kivsa》', 'sheep', 'f'], ['עכבר《akhbar》', 'mouse', 'm'],
  // home and objects
  ['בית《báyit》', 'house, home', 'm'], ['דירה《dira》', 'flat', 'f'], ['חדר《khéder》', 'room', 'm'], ['מטבח《mitbakh》', 'kitchen', 'm'],
  ['דלת《délet》', 'door', 'f'], ['חלון《khalon》', 'window', 'm'], ['שולחן《shulkhan》', 'table', 'm'], ['כיסא《kise》', 'chair', 'm'],
  ['מיטה《mita》', 'bed', 'f'], ['גינה《gina》', 'garden', 'f'], ['ספר《séfer》', 'book', 'm'], ['עמוד《amud》', 'page', 'm'], ['עט《et》', 'pen', 'm'],
  ['תמונה《tmuna》', 'picture, photo', 'f'], ['טלפון《télefon》', 'phone', 'm'], ['מכונית《mekhonit》', 'car', 'f'], ['אופניים《ofanáyim》', 'bike', 'm'],
  ['רכבת《rakévet》', 'train', 'f'], ['אוטובוס《ótobus》', 'bus', 'm'], ['כסף《késef》', 'money', 'm'], ['מפתח《mafté\'akh》', 'key', 'm'], ['תיק《tik》', 'bag', 'm'],
  ['צעצוע《tsa\'atsú\'a》', 'toy', 'm'],
  // places
  ['עיר《ir》', 'city, town', 'f'], ['כפר《kfar》', 'village', 'm'], ['ארץ《érets》', 'country, land', 'f'], ['רחוב《rekhov》', 'street', 'm'],
  ['דרך《dérekh》', 'way, road', 'f'], ['בית《beyt》 ספר《séfer》', 'school', 'm'], ['כיתה《kita》', 'class', 'f'], ['חנות《khanut》', 'shop', 'f'],
  ['שוק《shuk》', 'market', 'm'], ['פארק《park》', 'park', 'm'], ['תחנה《takhana》', 'station, stop', 'f'], ['ים《yam》', 'sea', 'm'],
  ['הר《har》', 'mountain', 'm'], ['נהר《nahar》', 'river', 'm'], ['יער《yá\'ar》', 'forest', 'm'], ['שדה《sade》', 'field', 'm'],
  ['עולם《olam》', 'world', 'm'], ['עבודה《avoda》', 'work, job', 'f'], ['משרד《misrad》', 'office', 'm'],
  // food
  ['מים《máyim》', 'water', 'm'], ['לחם《lékhem》', 'bread', 'm'], ['חלב《khalav》', 'milk', 'm'], ['פרי《pri》', 'fruit', 'm'], ['תפוח《tapúakh》', 'apple', 'm'],
  ['תה《te》', 'tea', 'm'], ['קפה《kafe》', 'coffee', 'm'], ['אורז《órez》', 'rice', 'm'], ['אוכל《ókhel》', 'food', 'm'], ['ביצה《beytsa》', 'egg', 'f'],
  ['ירק《yérek》', 'vegetable', 'm'], ['גבינה《gvina》', 'cheese', 'f'],
  // time
  ['יום《yom》', 'day', 'm'], ['לילה《láyla》', 'night', 'm'], ['בוקר《bóker》', 'morning', 'm'], ['ערב《érev》', 'evening', 'm'], ['שבוע《shavú\'a》', 'week', 'm'],
  ['חודש《khódesh》', 'month', 'm'], ['שנה《shana》', 'year', 'f'], ['שעה《sha\'a》', 'hour', 'f'], ['דקה《daka》', 'minute', 'f'], ['זמן《zman》', 'time', 'm'],
  ['מזג《mézeg》 אוויר《avir》', 'weather', 'm'], ['קיץ《káyits》', 'summer', 'm'], ['חורף《khóref》', 'winter', 'm'],
  // things in general
  ['דבר《davar》', 'thing', 'm'], ['שם《shem》', 'name', 'm'], ['מילה《mila》', 'word', 'f'], ['שאלה《she\'ela》', 'question', 'f'],
  ['תשובה《tshuva》', 'answer', 'f'], ['עברית《ivrit》', 'Hebrew (language)', 'f'], ['אנגלית《anglit》', 'English (language)', 'f'],
  ['צבע《tséva》', 'colour', 'm'], ['משחק《miskhak》', 'game', 'm'], ['מחלה《makhala》', 'illness', 'f'], ['בעיה《be\'aya》', 'problem', 'f'],
];

const verbs: Array<[string, string]> = [
  ['להיות《lihyot》', 'to be'], ['ללכת《lalékhet》', 'to go, walk'], ['לבוא《lavo》', 'to come'], ['לעשות《la\'asot》', 'to do, make'],
  ['להגיד《lehagid》', 'to say'], ['לדבר《ledaber》', 'to speak'], ['לראות《lir\'ot》', 'to see'], ['לשמוע《lishmó\'a》', 'to hear'],
  ['לשאול《lish\'ol》', 'to ask'], ['לדעת《ladá\'at》', 'to know'], ['להבין《lehavin》', 'to understand'], ['ללמוד《lilmod》', 'to learn, study'],
  ['לקרוא《likro》', 'to read, call'], ['לכתוב《likhtov》', 'to write'], ['יכול《yakhol》', 'can, to be able'], ['לרצות《lirtsot》', 'to want'],
  ['לאהוב《le\'ehov》', 'to love, like'], ['לאכול《le\'ekhol》', 'to eat'], ['לשתות《lishtot》', 'to drink'], ['לישון《lishon》', 'to sleep'],
  ['לקום《lakum》', 'to get up'], ['לשבת《lashévet》', 'to sit'], ['לרוץ《laruts》', 'to run'], ['לשחק《lesakhek》', 'to play'],
  ['לגור《lagur》', 'to live (somewhere)'], ['לעבוד《la\'avod》', 'to work'], ['לתת《latet》', 'to give'], ['לקחת《lakákhat》', 'to take'],
  ['לשים《lasim》', 'to put'], ['לקנות《liknot》', 'to buy'], ['למכור《limkor》', 'to sell'], ['לחפש《lekhapes》', 'to look for'],
  ['לפתוח《liftó\'akh》', 'to open'], ['לסגור《lisgor》', 'to close'], ['להתחיל《lehatkhil》', 'to begin'], ['לשחות《liskhot》', 'to swim'],
  ['לעוף《la\'uf》', 'to fly'], ['לחכות《lekhakot》', 'to wait'], ['לחשוב《lakhshov》', 'to think'], ['למות《lamut》', 'to die'],
  ['לפגוש《lifgosh》', 'to meet'], ['לנוח《lanúakh》', 'to rest'], ['לשנות《leshanot》', 'to change'], ['להראות《lehar\'ot》', 'to show'],
  ['לחזור《lakhzor》', 'to return'],
];

const adjectives: Array<[string, string]> = [
  ['טוב《tov》', 'good'], ['רע《ra》', 'bad'], ['גדול《gadol》', 'big'], ['קטן《katan》', 'small'], ['ארוך《arokh》', 'long'],
  ['גבוה《gavóa》', 'high, tall'], ['נמוך《namukh》', 'low, short'], ['זול《zol》', 'cheap'], ['יקר《yakar》', 'expensive, dear'], ['חדש《khadash》', 'new'],
  ['ישן《yashan》', 'old (things)'], ['צעיר《tsa\'ir》', 'young'], ['זקן《zaken》', 'old (people)'], ['מהיר《mahir》', 'fast'], ['איטי《iti》', 'slow'],
  ['חזק《khazak》', 'strong'], ['חלש《khalash》', 'weak'], ['קל《kal》', 'easy, light'], ['קשה《kashe》', 'difficult, hard'], ['חם《kham》', 'hot'],
  ['קר《kar》', 'cold'], ['שמח《saméakh》', 'happy'], ['עצוב《atsuv》', 'sad'], ['נחמד《nekhmad》', 'nice'], ['יפה《yafe》', 'beautiful'],
  ['טעים《ta\'im》', 'tasty'], ['עסוק《asuk》', 'busy'], ['נקי《naki》', 'clean'], ['מלוכלך《melukhlakh》', 'dirty'], ['חשוב《khashuv》', 'important'],
  ['מפורסם《mefursam》', 'famous'], ['נכון《nakhon》', 'right, true'],
  ['אדום《adom》', 'red'], ['כחול《kakhol》', 'blue'], ['ירוק《yarok》', 'green'], ['צהוב《tsahov》', 'yellow'], ['לבן《lavan》', 'white'], ['שחור《shakhor》', 'black'],
];

const others: Array<[string, string]> = [
  ['או《o》', 'or'], ['אבל《aval》', 'but'], ['כי《ki》', 'because'], ['אם《im》', 'if'], ['מתי《matay》', 'when?'],
  ['מאוד《me\'od》', 'very'], ['קצת《ktsat》', 'a little'], ['יותר《yoter》', 'more'], ['פחות《pakhot》', 'less'], ['גם《gam》', 'also'],
  ['שוב《shuv》', 'again'], ['עכשיו《akhshav》', 'now'], ['תמיד《tamid》', 'always'], ['לפעמים《lif\'amim》', 'sometimes'],
  ['היום《hayom》', 'today'], ['מחר《makhar》', 'tomorrow'], ['אתמול《etmol》', 'yesterday'], ['כאן《kan》', 'here'], ['שם《sham》', 'there'],
  ['איפה《éyfo》', 'where'], ['מי《mi》', 'who'], ['מה《ma》', 'what'], ['למה《láma》', 'why'], ['איך《eykh》', 'how'], ['כל《kol》', 'all, every'],
  ['כן《ken》', 'yes'], ['לא《lo》', 'no, not'], ['עם《im》', 'with'], ['בלי《bli》', 'without'], ['בשביל《bishvil》', 'for'], ['על《al》', 'on, about'],
  ['ליד《leyad》', 'next to'], ['בין《beyn》', 'between'], ['לפני《lifney》', 'before'], ['אחרי《akharey》', 'after'],
];

export const HE_A1_WORDS: A1Word[] = [
  ...nouns.map(([lemma, en, g]) => ({ lemma, en, g })),
  ...[...verbs, ...adjectives, ...others].map(([lemma, en]) => ({ lemma, en })),
];
