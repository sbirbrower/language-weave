import type { A1Word } from '../a1';
import type { EasyWord } from '../easy';
import type { Gender } from '../../languages';

// Hindi counterparts of the French lists in `easy.ts` and `a1.ts`, with readings (src/ruby.ts).
// Nouns in the direct singular, adjectives in the masculine -ā form, verbs in the infinitive; a verb
// made with करना or होना is written as both words. The French list's small words (is, from, for,
// between) are left out: their Hindi is a postposition or a verb ending, which can't stand in an
// English sentence.

// Easy words: the same English as the French list, so both find the same places.
const RANK_1: Array<[string, string]> = [
  // people
  ['man|men', 'आदमी《ādmī》/पुरुष《puruṣ》'], ['woman|women', 'औरत《aurat》/महिला《mahilā》'], ['child|children', 'बच्चा《baccā》'],
  ['boy|boys', 'लड़का《laṛkā》'], ['girl|girls', 'लड़की《laṛkī》'], ['baby|babies', 'बच्चा《baccā》/शिशु《śiśu》'], ['friend|friends', 'दोस्त《dost》'],
  ['family|families', 'परिवार《parivār》'], ['father|fathers', 'पिता《pitā》/पिताजी《pitājī》'], ['mother|mothers', 'माँ《māṃ》/माता《mātā》'],
  ['brother|brothers', 'भाई《bhāī》'], ['sister|sisters', 'बहन《bahan》'], ['son|sons', 'बेटा《beṭā》'], ['daughter|daughters', 'बेटी《beṭī》'],
  ['husband|husbands', 'पति《pati》'], ['wife|wives', 'पत्नी《patnī》'], ['people', 'लोग《log》'], ['person', 'व्यक्ति《vyakti》/आदमी《ādmī》'],
  ['king|kings', 'राजा《rājā》'], ['queen|queens', 'रानी《rānī》'],
  // animals
  ['animal|animals', 'जानवर《jānvar》'], ['dog|dogs', 'कुत्ता《kuttā》'], ['cat|cats', 'बिल्ली《billī》'], ['horse|horses', 'घोड़ा《ghoṛā》'],
  ['bird|birds', 'चिड़िया《ciṛiyā》/पक्षी《pakṣī》'], ['rabbit|rabbits', 'ख़रगोश《khargoś》'], ['cow|cows', 'गाय《gāy》'], ['sheep', 'भेड़《bheṛ》'],
  ['mouse|mice', 'चूहा《cūhā》'],
  // body
  ['head|heads', 'सिर《sir》'], ['eye|eyes', 'आँख《āṃkh》'], ['ear|ears', 'कान《kān》'], ['nose|noses', 'नाक《nāk》'], ['mouth', 'मुँह《muṃh》'],
  ['hand|hands', 'हाथ《hāth》'], ['foot|feet', 'पैर《pair》'], ['leg|legs', 'टाँग《ṭāṃg》/पैर《pair》'], ['heart|hearts', 'दिल《dil》'],
  ['tail|tails', 'पूँछ《pūṃch》'], ['body|bodies', 'शरीर《śarīr》'], ['hair', 'बाल《bāl》'],
  // home and things
  ['house|houses', 'घर《ghar》/मकान《makān》'], ['home', 'घर《ghar》'], ['door|doors', 'दरवाज़ा《darvāzā》'], ['window|windows', 'खिड़की《khiṛkī》'],
  ['table|tables', 'मेज़《mez》'], ['bed|beds', 'बिस्तर《bistar》'], ['garden|gardens', 'बगीचा《bagīcā》'], ['car|cars', 'गाड़ी《gāṛī》/कार《kār》'],
  ['bicycle|bicycles|bike|bikes', 'साइकिल《sāikil》'], ['train|trains', 'ट्रेन《ṭren》/रेलगाड़ी《relgāṛī》'], ['boat|boats', 'नाव《nāv》'],
  ['plane|planes|aircraft', 'हवाई《havāī》 जहाज़《jahāz》'], ['book|books', 'किताब《kitāb》'], ['letter|letters', 'चिट्ठी《ciṭṭhī》/अक्षर《akṣar》'],
  ['money', 'पैसा《paisā》'], ['photo|photos|photograph|photographs', 'फ़ोटो《foṭo》/तस्वीर《tasvīr》'], ['film|films|movie|movies', 'फ़िल्म《film》'],
  ['music', 'संगीत《sangīt》'], ['song|songs', 'गाना《gānā》/गीत《gīt》'], ['game|games', 'खेल《khel》'], ['name|names', 'नाम《nām》'],
  ['colour|colours|color|colors', 'रंग《rang》'], ['school|schools', 'स्कूल《skūl》'],
  // places and nature
  ['city|cities', 'शहर《śahar》'], ['town|towns', 'शहर《śahar》/क़स्बा《qasbā》'], ['village|villages', 'गाँव《gāṃv》'], ['country|countries', 'देश《deś》'],
  ['world', 'दुनिया《duniyā》'], ['street|streets', 'गली《galī》/सड़क《saṛak》'], ['road|roads', 'सड़क《saṛak》'], ['shop|shops', 'दुकान《dukān》'],
  ['sea|seas', 'समुद्र《samudra》'], ['river|rivers', 'नदी《nadī》'], ['mountain|mountains', 'पहाड़《pahāṛ》'], ['island|islands', 'द्वीप《dvīp》'],
  ['beach|beaches', 'समुद्र《samudra》 तट《taṭ》/बीच《bīc》'], ['forest|forests', 'जंगल《jangal》'], ['tree|trees', 'पेड़《peṛ》'], ['flower|flowers', 'फूल《phūl》'],
  ['sun', 'सूरज《sūraj》'], ['moon', 'चाँद《cāṃd》'], ['star|stars', 'तारा《tārā》'], ['sky', 'आसमान《āsmān》'], ['snow', 'बर्फ़《barf》'], ['rain', 'बारिश《bāriś》'],
  ['water', 'पानी《pānī》'], ['fire', 'आग《āg》'],
  // food
  ['food', 'खाना《khānā》'], ['bread', 'रोटी《roṭī》/ब्रेड《breḍ》'], ['milk', 'दूध《dūdh》'], ['meat', 'मांस《māṃs》/गोश्त《gośt》'], ['fruit|fruits', 'फल《phal》'],
  ['apple|apples', 'सेब《seb》'], ['coffee', 'कॉफ़ी《kofī》'], ['egg|eggs', 'अंडा《anḍā》'],
  // time
  ['day|days', 'दिन《din》'], ['night|nights', 'रात《rāt》'], ['morning|mornings', 'सुबह《subah》'], ['evening|evenings', 'शाम《śām》'],
  ['week|weeks', 'हफ़्ता《haftā》'], ['month|months', 'महीना《mahīnā》'], ['year|years', 'साल《sāl》'], ['hour|hours', 'घंटा《ghanṭā》'],
  ['summer', 'गर्मी《garmī》'], ['winter', 'सर्दी《sardī》'], ['autumn', 'पतझड़《patjhaṛ》'], ['century|centuries', 'सदी《sadī》'],
  // adjectives
  ['big|large', 'बड़ा《baṛā》'], ['small|tiny', 'छोटा《choṭā》'], ['good', 'अच्छा《acchā》'], ['bad', 'बुरा《burā》/ख़राब《kharāb》'], ['new', 'नया《nayā》'],
  ['old', 'पुराना《purānā》/बूढ़ा《būṛhā》'], ['young', 'जवान《javān》'], ['long', 'लंबा《lambā》'], ['short', 'छोटा《choṭā》'], ['hot|warm', 'गरम《garam》'],
  ['cold', 'ठंडा《ṭhanḍā》'], ['happy', 'ख़ुश《khuś》'], ['sad', 'उदास《udās》'], ['beautiful', 'सुंदर《sundar》'], ['pretty', 'सुंदर《sundar》/प्यारा《pyārā》'],
  ['fast|quick', 'तेज़《tez》'], ['slow', 'धीमा《dhīmā》'], ['easy', 'आसान《āsān》'], ['difficult', 'मुश्किल《muśkil》'], ['strong', 'मज़बूत《mazbūt》'],
  ['important', 'ज़रूरी《zarūrī》/महत्वपूर्ण《mahatvpūrṇ》'], ['popular', 'लोकप्रिय《lokpriya》'], ['famous', 'मशहूर《maśhūr》'],
  // colours
  ['red', 'लाल《lāl》'], ['blue', 'नीला《nīlā》'], ['green', 'हरा《harā》'], ['white', 'सफ़ेद《safed》'], ['black', 'काला《kālā》'], ['yellow', 'पीला《pīlā》'],
  ['grey|gray', 'स्लेटी《sleṭī》'], ['brown', 'भूरा《bhūrā》'], ['pink', 'गुलाबी《gulābī》'], ['orange', 'नारंगी《nārangī》'],
  // general nouns and adjectives
  ['species', 'प्रजाति《prajāti》'], ['group|groups', 'समूह《samūh》/झुंड《jhunḍ》'], ['part|parts', 'हिस्सा《hissā》'], ['number|numbers', 'संख्या《sankhyā》/नंबर《nambar》'],
  ['shape|shapes', 'आकार《ākār》/शक्ल《śakl》'], ['size|sizes', 'आकार《ākār》/साइज़《sāiz》'], ['life', 'ज़िंदगी《zindagī》/जीवन《jīvan》'], ['death', 'मौत《maut》/मृत्यु《mrityu》'],
  ['skin|skins', 'त्वचा《tvacā》/खाल《khāl》'], ['fur', 'फ़र《far》/बाल《bāl》'], ['human|humans', 'इंसान《insān》/मनुष्य《manuṣya》'], ['adult|adults', 'वयस्क《vayask》'],
  ['health', 'सेहत《sehat》/स्वास्थ्य《svāsthya》'], ['disease|diseases', 'बीमारी《bīmārī》'], ['population|populations', 'आबादी《ābādī》/जनसंख्या《jansankhyā》'],
  ['habitat|habitats', 'आवास《āvās》'], ['system|systems', 'व्यवस्था《vyavasthā》/सिस्टम《sisṭam》'], ['surface|surfaces', 'सतह《satah》'],
  ['structure|structures', 'ढाँचा《ḍhāṃcā》/संरचना《sanracnā》'], ['region|regions', 'इलाक़ा《ilāqā》/क्षेत्र《kṣetra》'], ['zone|zones', 'क्षेत्र《kṣetra》'], ['energy', 'ऊर्जा《ūrjā》'],
  ['climate', 'जलवायु《jalvāyu》'], ['history', 'इतिहास《itihās》'], ['science', 'विज्ञान《vigyān》'], ['problem|problems', 'समस्या《samasyā》'],
  ['example|examples', 'उदाहरण《udāharaṇ》'], ['image|images', 'तस्वीर《tasvīr》'], ['type|types', 'प्रकार《prakār》/तरह《tarah》'], ['nature', 'प्रकृति《prakriti》/क़ुदरत《qudrat》'],
  ['culture|cultures', 'संस्कृति《sanskriti》'], ['protection', 'सुरक्षा《surakṣā》'], ['production', 'उत्पादन《utpādan》'], ['information', 'जानकारी《jānkārī》'],
  ['nation|nations', 'राष्ट्र《rāṣṭra》/देश《deś》'], ['million|millions', 'दस《das》 लाख《lākh》'], ['minute|minutes', 'मिनट《minaṭ》'], ['sport|sports', 'खेल《khel》'],
  ['centre|centres|center|centers', 'केंद्र《kendra》/सेंटर《senṭar》'], ['planet|planets', 'ग्रह《grah》'], ['ocean|oceans', 'महासागर《mahāsāgar》/समुद्र《samudra》'],
  ['plant|plants', 'पौधा《paudhā》'], ['fish', 'मछली《machlī》'], ['wild', 'जंगली《janglī》'], ['natural', 'प्राकृतिक《prākritik》'],
  ['central', 'केंद्रीय《kendrīya》'], ['national', 'राष्ट्रीय《rāṣṭrīya》'], ['international', 'अंतरराष्ट्रीय《antarrāṣṭrīya》'], ['high', 'ऊँचा《ūṃcā》'],
  ['low', 'नीचा《nīcā》/कम《kam》'], ['rare', 'दुर्लभ《durlabh》'], ['common', 'आम《ām》'], ['different', 'अलग《alag》'], ['possible', 'मुमकिन《mumkin》/संभव《sambhav》'],
  ['normal', 'सामान्य《sāmānya》'], ['simple', 'सरल《saral》/आसान《āsān》'], ['modern', 'आधुनिक《ādhunik》'], ['original', 'मूल《mūl》/असली《aslī》'],
  ['true', 'सच《sac》/सही《sahī》'], ['full', 'भरा《bharā》'], ['dark', 'अँधेरा《aṃdherā》/गहरा《gahrā》'],
];

const RANK_2: Array<[string, string]> = [
  // verbs: the model puts them in the form the English needs
  ['eat|eats|ate|eaten|eating', 'खाना《khānā》'], ['drink|drinks|drank|drinking', 'पीना《pīnā》'], ['sleep|sleeps|slept|sleeping', 'सोना《sonā》'],
  ['run|runs|ran|running', 'दौड़ना《dauṛnā》'], ['walk|walks|walked|walking', 'चलना《calnā》'], ['play|plays|played|playing', 'खेलना《khelnā》'],
  ['live|lives|lived|living', 'रहना《rahnā》/जीना《jīnā》'], ['love|loves|loved|loving', 'प्यार《pyār》 करना《karnā》'], ['see|sees|saw|seen|seeing', 'देखना《dekhnā》'],
  ['go|goes|went|gone|going', 'जाना《jānā》'], ['come|comes|came|coming', 'आना《ānā》'], ['make|makes|made|making', 'बनाना《banānā》'],
  ['give|gives|gave|given|giving', 'देना《denā》'], ['take|takes|took|taken|taking', 'लेना《lenā》'], ['find|finds|found|finding', 'पाना《pānā》/ढूँढ़ना《ḍhūṃṛhnā》'],
  ['buy|buys|bought|buying', 'ख़रीदना《kharīdnā》'], ['sell|sells|sold|selling', 'बेचना《becnā》'],
  ['begin|begins|began|begun|beginning|start|starts|started|starting', 'शुरू《śurū》 होना《honā》/शुरू《śurū》 करना《karnā》'],
  ['finish|finishes|finished|finishing', 'ख़त्म《khatm》 होना《honā》/ख़त्म《khatm》 करना《karnā》'], ['win|wins|won|winning', 'जीतना《jītnā》'], ['lose|loses|lost|losing', 'हारना《hārnā》/खोना《khonā》'],
  ['help|helps|helped|helping', 'मदद《madad》 करना《karnā》'], ['want|wants|wanted|wanting', 'चाहना《cāhnā》'], ['think|thinks|thought|thinking', 'सोचना《socnā》'],
  ['become|becomes|became|becoming', 'बनना《bannā》'], ['die|dies|died|dying', 'मरना《marnā》'], ['call|calls|called|calling', 'बुलाना《bulānā》'],
  ['work|works|worked|working', 'काम《kām》 करना《karnā》'], ['travel|travels|travelled|traveled|travelling|traveling', 'सफ़र《safar》 करना《karnā》/यात्रा《yātrā》 करना《karnā》'],
  ['hunt|hunts|hunted|hunting', 'शिकार《śikār》 करना《karnā》'], ['wait|waits|waited|waiting', 'इंतज़ार《intazār》 करना《karnā》'], ['carry|carries|carried|carrying', 'उठाना《uṭhānā》'],
  // adverbs
  ['often', 'अक्सर《aksar》'], ['always', 'हमेशा《hameśā》'], ['never', 'कभी《kabhī》 नहीं《nahīṃ》'], ['sometimes', 'कभी《kabhī》-कभी《kabhī》'], ['today', 'आज《āj》'],
  ['now', 'अब《ab》'], ['here', 'यहाँ《yahāṃ》'], ['together', 'साथ《sāth》'], ['quickly', 'जल्दी《jaldī》'], ['early', 'जल्दी《jaldī》'], ['late', 'देर《der》 से《se》'],
  ['grow|grows|grew|grown|growing', 'बढ़ना《baṛhnā》/उगना《ugnā》'], ['feed|feeds|fed|feeding', 'खिलाना《khilānā》'],
  ['move|moves|moved|moving', 'हिलना《hilnā》/चलना《calnā》'], ['show|shows|showed|shown|showing', 'दिखाना《dikhānā》'],
  ['change|changes|changed|changing', 'बदलना《badalnā》'], ['use|uses|used|using', 'इस्तेमाल《istemāl》 करना《karnā》'],
];

export const HI_EASY_WORDS: EasyWord[] = [
  ...RANK_1.map(([forms, lemma]) => ({ forms, lemma, rank: 1 as const })),
  ...RANK_2.map(([forms, lemma]) => ({ forms, lemma, rank: 2 as const })),
];

// Everyday A1 vocabulary, grouped by theme: the top-up may only weave these
// (plus the lesson's own words), so the extra words stay at the reader's level.
const nouns: Array<[string, string, Gender]> = [
  // people and family
  ['आदमी《ādmī》', 'man', 'm'], ['औरत《aurat》', 'woman', 'f'], ['बच्चा《baccā》', 'child', 'm'], ['लड़का《laṛkā》', 'boy', 'm'],
  ['लड़की《laṛkī》', 'girl', 'f'], ['दोस्त《dost》', 'friend', 'm'], ['परिवार《parivār》', 'family', 'm'], ['पिता《pitā》', 'father', 'm'],
  ['माँ《māṃ》', 'mother', 'f'], ['भाई《bhāī》', 'brother', 'm'], ['बहन《bahan》', 'sister', 'f'], ['बेटा《beṭā》', 'son', 'm'],
  ['बेटी《beṭī》', 'daughter', 'f'], ['पति《pati》', 'husband', 'm'], ['पत्नी《patnī》', 'wife', 'f'], ['लोग《log》', 'people', 'm'],
  ['अध्यापक《adhyāpak》', 'teacher', 'm'], ['छात्र《chātra》', 'student', 'm'],
  // body
  ['शरीर《śarīr》', 'body', 'm'], ['सिर《sir》', 'head', 'm'], ['आँख《āṃkh》', 'eye', 'f'], ['कान《kān》', 'ear', 'm'], ['नाक《nāk》', 'nose', 'f'],
  ['मुँह《muṃh》', 'mouth', 'm'], ['दाँत《dāṃt》', 'tooth', 'm'], ['गर्दन《gardan》', 'neck', 'f'], ['पीठ《pīṭh》', 'back', 'f'], ['हाथ《hāth》', 'hand', 'm'],
  ['बाँह《bāṃh》', 'arm', 'f'], ['पैर《pair》', 'foot, leg', 'm'], ['पूँछ《pūṃch》', 'tail', 'f'], ['दिल《dil》', 'heart', 'm'], ['बाल《bāl》', 'hair', 'm'],
  // animals
  ['जानवर《jānvar》', 'animal', 'm'], ['कुत्ता《kuttā》', 'dog', 'm'], ['बिल्ली《billī》', 'cat', 'f'], ['घोड़ा《ghoṛā》', 'horse', 'm'],
  ['चिड़िया《ciṛiyā》', 'bird', 'f'], ['मछली《machlī》', 'fish', 'f'], ['ख़रगोश《khargoś》', 'rabbit', 'm'], ['गाय《gāy》', 'cow', 'f'],
  ['भेड़《bheṛ》', 'sheep', 'f'], ['चूहा《cūhā》', 'mouse', 'm'],
  // home and objects
  ['घर《ghar》', 'house, home', 'm'], ['कमरा《kamrā》', 'room', 'm'], ['रसोई《rasoī》', 'kitchen', 'f'], ['दरवाज़ा《darvāzā》', 'door', 'm'],
  ['खिड़की《khiṛkī》', 'window', 'f'], ['मेज़《mez》', 'table', 'f'], ['कुर्सी《kursī》', 'chair', 'f'], ['बिस्तर《bistar》', 'bed', 'm'],
  ['बगीचा《bagīcā》', 'garden', 'm'], ['किताब《kitāb》', 'book', 'f'], ['पन्ना《pannā》', 'page', 'm'], ['क़लम《qalam》', 'pen', 'f'],
  ['फ़ोटो《foṭo》', 'photo', 'f'], ['फ़ोन《fon》', 'phone', 'm'], ['गाड़ी《gāṛī》', 'car', 'f'], ['साइकिल《sāikil》', 'bike', 'f'],
  ['ट्रेन《ṭren》', 'train', 'f'], ['बस《bas》', 'bus', 'f'], ['पैसा《paisā》', 'money', 'm'], ['चाबी《cābī》', 'key', 'f'], ['बैग《baig》', 'bag', 'm'],
  ['खिलौना《khilaunā》', 'toy', 'm'],
  // places
  ['शहर《śahar》', 'city, town', 'm'], ['गाँव《gāṃv》', 'village', 'm'], ['देश《deś》', 'country', 'm'], ['सड़क《saṛak》', 'road', 'f'],
  ['रास्ता《rāstā》', 'way', 'm'], ['स्कूल《skūl》', 'school', 'm'], ['कक्षा《kakṣā》', 'class', 'f'], ['दुकान《dukān》', 'shop', 'f'],
  ['बाज़ार《bāzār》', 'market', 'm'], ['पार्क《pārk》', 'park', 'm'], ['स्टेशन《sṭeśan》', 'station', 'm'], ['समुद्र《samudra》', 'sea', 'm'],
  ['पहाड़《pahāṛ》', 'mountain', 'm'], ['नदी《nadī》', 'river', 'f'], ['जंगल《jangal》', 'forest', 'm'], ['खेत《khet》', 'field', 'm'],
  ['दुनिया《duniyā》', 'world', 'f'], ['काम《kām》', 'work, job', 'm'], ['दफ़्तर《daftar》', 'office', 'm'],
  // food
  ['पानी《pānī》', 'water', 'm'], ['रोटी《roṭī》', 'bread', 'f'], ['दूध《dūdh》', 'milk', 'm'], ['फल《phal》', 'fruit', 'm'], ['सेब《seb》', 'apple', 'm'],
  ['चाय《cāy》', 'tea', 'f'], ['कॉफ़ी《kofī》', 'coffee', 'f'], ['चावल《cāval》', 'rice', 'm'], ['खाना《khānā》', 'food, meal', 'm'], ['अंडा《anḍā》', 'egg', 'm'],
  ['सब्ज़ी《sabzī》', 'vegetable', 'f'], ['दाल《dāl》', 'lentils', 'f'],
  // time
  ['दिन《din》', 'day', 'm'], ['रात《rāt》', 'night', 'f'], ['सुबह《subah》', 'morning', 'f'], ['शाम《śām》', 'evening', 'f'], ['हफ़्ता《haftā》', 'week', 'm'],
  ['महीना《mahīnā》', 'month', 'm'], ['साल《sāl》', 'year', 'm'], ['घंटा《ghanṭā》', 'hour', 'm'], ['मिनट《minaṭ》', 'minute', 'm'], ['समय《samay》', 'time', 'm'],
  ['मौसम《mausam》', 'weather', 'm'], ['गर्मी《garmī》', 'summer, heat', 'f'], ['सर्दी《sardī》', 'winter, cold', 'f'],
  // things in general
  ['चीज़《cīz》', 'thing', 'f'], ['बात《bāt》', 'matter, thing said', 'f'], ['नाम《nām》', 'name', 'm'], ['शब्द《śabd》', 'word', 'm'],
  ['सवाल《savāl》', 'question', 'm'], ['जवाब《javāb》', 'answer', 'm'], ['हिंदी《hindī》', 'Hindi (language)', 'f'], ['अंग्रेज़ी《angrezī》', 'English (language)', 'f'],
  ['रंग《rang》', 'colour', 'm'], ['खेल《khel》', 'game, sport', 'm'], ['बीमारी《bīmārī》', 'illness', 'f'], ['समस्या《samasyā》', 'problem', 'f'],
];

const verbs: Array<[string, string]> = [
  ['होना《honā》', 'to be'], ['जाना《jānā》', 'to go'], ['आना《ānā》', 'to come'], ['करना《karnā》', 'to do'], ['बनाना《banānā》', 'to make'],
  ['कहना《kahnā》', 'to say'], ['बोलना《bolnā》', 'to speak'], ['देखना《dekhnā》', 'to see, watch'], ['सुनना《sunnā》', 'to hear, listen'],
  ['पूछना《pūchnā》', 'to ask'], ['जानना《jānnā》', 'to know'], ['समझना《samajhnā》', 'to understand'], ['सीखना《sīkhnā》', 'to learn'],
  ['पढ़ना《paṛhnā》', 'to read, study'], ['लिखना《likhnā》', 'to write'], ['सकना《saknā》', 'can, to be able'], ['चाहना《cāhnā》', 'to want'],
  ['खाना《khānā》', 'to eat'], ['पीना《pīnā》', 'to drink'], ['सोना《sonā》', 'to sleep'], ['उठना《uṭhnā》', 'to get up'], ['बैठना《baiṭhnā》', 'to sit'],
  ['दौड़ना《dauṛnā》', 'to run'], ['चलना《calnā》', 'to walk, move'], ['खेलना《khelnā》', 'to play'], ['रहना《rahnā》', 'to live, stay'],
  ['काम《kām》 करना《karnā》', 'to work'], ['देना《denā》', 'to give'], ['लेना《lenā》', 'to take'], ['रखना《rakhnā》', 'to put, keep'],
  ['ख़रीदना《kharīdnā》', 'to buy'], ['बेचना《becnā》', 'to sell'], ['ढूँढ़ना《ḍhūṃṛhnā》', 'to look for'], ['खोलना《kholnā》', 'to open'],
  ['बंद《band》 करना《karnā》', 'to close'], ['शुरू《śurū》 करना《karnā》', 'to begin'], ['तैरना《tairnā》', 'to swim'], ['उड़ना《uṛnā》', 'to fly'],
  ['इंतज़ार《intazār》 करना《karnā》', 'to wait'], ['सोचना《socnā》', 'to think'], ['मरना《marnā》', 'to die'], ['मिलना《milnā》', 'to meet, be found'],
  ['आराम《ārām》 करना《karnā》', 'to rest'], ['बदलना《badalnā》', 'to change'], ['दिखाना《dikhānā》', 'to show'], ['लौटना《lauṭnā》', 'to return'],
];

const adjectives: Array<[string, string]> = [
  ['अच्छा《acchā》', 'good'], ['बुरा《burā》', 'bad'], ['बड़ा《baṛā》', 'big'], ['छोटा《choṭā》', 'small, short'], ['लंबा《lambā》', 'long, tall'],
  ['ऊँचा《ūṃcā》', 'high'], ['नीचा《nīcā》', 'low'], ['सस्ता《sastā》', 'cheap'], ['महँगा《mahaṃgā》', 'expensive'], ['नया《nayā》', 'new'],
  ['पुराना《purānā》', 'old (things)'], ['जवान《javān》', 'young'], ['बूढ़ा《būṛhā》', 'old (people)'], ['तेज़《tez》', 'fast'], ['धीमा《dhīmā》', 'slow'],
  ['मज़बूत《mazbūt》', 'strong'], ['कमज़ोर《kamzor》', 'weak'], ['आसान《āsān》', 'easy'], ['मुश्किल《muśkil》', 'difficult'], ['गरम《garam》', 'hot'],
  ['ठंडा《ṭhanḍā》', 'cold'], ['ख़ुश《khuś》', 'happy'], ['उदास《udās》', 'sad'], ['अकेला《akelā》', 'alone'], ['प्यारा《pyārā》', 'lovely, dear'],
  ['सुंदर《sundar》', 'beautiful'], ['स्वादिष्ट《svādiṣṭ》', 'tasty'], ['व्यस्त《vyast》', 'busy'], ['साफ़《sāf》', 'clean'], ['गंदा《gandā》', 'dirty'],
  ['ज़रूरी《zarūrī》', 'important, necessary'], ['मशहूर《maśhūr》', 'famous'], ['सही《sahī》', 'right'], ['ग़लत《galat》', 'wrong'],
  ['लाल《lāl》', 'red'], ['नीला《nīlā》', 'blue'], ['हरा《harā》', 'green'], ['पीला《pīlā》', 'yellow'], ['सफ़ेद《safed》', 'white'], ['काला《kālā》', 'black'],
];

const others: Array<[string, string]> = [
  ['और《aur》', 'and'], ['या《yā》', 'or'], ['लेकिन《lekin》', 'but'], ['क्योंकि《kyoṃki》', 'because'], ['अगर《agar》', 'if'], ['जब《jab》', 'when'],
  ['बहुत《bahut》', 'very, a lot'], ['थोड़ा《thoṛā》', 'a little'], ['ज़्यादा《zyādā》', 'more, too much'], ['कम《kam》', 'less, few'], ['भी《bhī》', 'also'],
  ['फिर《phir》', 'again, then'], ['अभी《abhī》', 'right now'], ['अब《ab》', 'now'], ['हमेशा《hameśā》', 'always'], ['अक्सर《aksar》', 'often'],
  ['आज《āj》', 'today'], ['कल《kal》', 'yesterday, tomorrow'], ['यहाँ《yahāṃ》', 'here'], ['वहाँ《vahāṃ》', 'there'], ['कहाँ《kahāṃ》', 'where'],
  ['कब《kab》', 'when?'], ['कौन《kaun》', 'who'], ['क्या《kyā》', 'what'], ['क्यों《kyoṃ》', 'why'], ['कैसे《kaise》', 'how'], ['सब《sab》', 'all, everyone'],
  ['हाँ《hāṃ》', 'yes'], ['नहीं《nahīṃ》', 'no, not'], ['जी《jī》', 'polite marker; yes'],
];

export const HI_A1_WORDS: A1Word[] = [
  ...nouns.map(([lemma, en, g]) => ({ lemma, en, g })),
  ...[...verbs, ...adjectives, ...others].map(([lemma, en]) => ({ lemma, en })),
];
