import type { GrammarPoint } from './types';

// For webpage passages: each point must fit true facts about any page (third person, the page's tenses),
// or a format's questions and reactions. Lessons bring their own points (`src/syllabus/`).
// Examples carry readings (src/ruby.ts), as the passages do.
export const jaGrammar: GrammarPoint[] = [
  // A1
  { id: 'desu', level: 'A1', label: 'XはYです', instruction: 'Say what things are with は and です, and じゃありません for what they are not.', example: 'パリはフランスの首都《しゅと》です。' },
  { id: 'aru-iru', level: 'A1', label: 'ある and いる', instruction: 'Say what is in a place with あります for things and plants and います for people and animals (〜に〜があります).', example: '森《もり》にはクマがいます。' },
  { id: 'adjectives', level: 'A1', label: 'い- and な-adjectives', instruction: 'Describe things with い-adjectives (高《たか》い) and な-adjectives (静《しず》かな), before a noun or before です.', example: 'この山《やま》は高《たか》いです。静《しず》かな村《むら》もあります。' },
  { id: 'masu', level: 'A1', label: 'Verbs with ます', instruction: 'Use verbs in the polite present (食《た》べます, 住《す》みます, 来《き》ます) for general facts.', example: 'この鳥《とり》は虫《むし》を食《た》べます。' },
  { id: 'negative', level: 'A1', label: 'ません and じゃありません', instruction: 'Use ません, じゃありません or くないです for something the page says is not so.', example: 'このヘビには毒《どく》がありません。' },
  { id: 'particles', level: 'A1', label: 'は, を, に and で', instruction: 'Use は for the topic, を for the object, に for where something is or goes, and で for where something happens.', example: '人々《ひとびと》は公園《こうえん》でサッカーをします。' },
  { id: 'no', level: 'A1', label: 'の between nouns', instruction: 'Link nouns with の for what belongs to or describes something (日本《にほん》の首都《しゅと》).', example: '日本《にほん》の首都《しゅと》は東京《とうきょう》です。' },
  { id: 'ka', level: 'A1', label: 'Questions with か', instruction: 'Ask questions with か and a question word (どこ, いつ, 何《なん》, いくつ), in a line where a question fits (a heading, a quiz, an interview, a reaction).', example: '富士山《ふじさん》はどこにありますか。' },
  { id: 'counters', level: 'A1', label: 'Numbers with counters', instruction: 'Count with the counter the thing takes (〜つ for things, 〜人《にん》 for people, 〜匹《ひき》 for small animals), after the noun and its particle.', example: '湖《みずうみ》には島《しま》が三《みっ》つあります。' },
  // A2
  { id: 'mashita', level: 'A2', label: 'The past with ました and でした', instruction: 'Use ました and でした for past events the page dates or describes.', example: '1964年《ねん》に東京《とうきょう》でオリンピックがありました。' },
  { id: 'adj-past', level: 'A2', label: 'Adjectives in the past', instruction: 'Say how things were with かったです for い-adjectives and でした for な-adjectives.', example: '昔《むかし》、この町《まち》はとても小《ちい》さかったです。' },
  { id: 'te-form', level: 'A2', label: 'Linking with the て-form', instruction: 'Join two actions or descriptions with the て-form (飛《と》んで, 高《たか》くて, 静《しず》かで).', example: 'この鳥《とり》は南《みなみ》へ飛《と》んで、冬《ふゆ》を過《す》ごします。' },
  { id: 'te-iru', level: 'A2', label: '〜ています', instruction: 'Use 〜ています for a state that lasts (住《す》んでいます, 知《し》られています) or something going on.', example: '多《おお》くの人《ひと》がこの町《まち》に住《す》んでいます。' },
  { id: 'yori', level: 'A2', label: 'Comparing with より', instruction: 'Compare two things the page gives facts for with 〜は〜より, or 〜より〜のほうが.', example: '東京《とうきょう》は大阪《おおさか》より大《おお》きいです。' },
  { id: 'ichiban', level: 'A2', label: '一番《いちばん》 for the most', instruction: 'Use 一番《いちばん》 only where the page says something is the most or least.', example: '富士山《ふじさん》は日本《にほん》で一番《いちばん》高《たか》い山《やま》です。' },
  { id: 'kara', level: 'A2', label: 'Reasons with から', instruction: 'Give a reason the page states with から after it.', example: '冬《ふゆ》は寒《さむ》いですから、クマは長《なが》く眠《ねむ》ります。' },
  { id: 'dekiru', level: 'A2', label: 'ことができる', instruction: 'Say what things can or cannot do with 〜ことができます or 〜ことができません.', example: 'ペンギンは飛《と》ぶことができませんが、上手《じょうず》に泳《およ》ぎます。' },
  // B1
  { id: 'plain', level: 'B1', label: 'The plain style of written texts', instruction: 'Write in the plain style (だ, である, 始《はじ》まった) as articles and encyclopedias do.', example: '戦争《せんそう》は1914年《ねん》に始《はじ》まり、4年《ねん》続《つづ》いた。' },
  { id: 'relative', level: 'B1', label: 'Clauses before a noun', instruction: 'Describe a noun with a clause before it (町《まち》を流《なが》れる川《かわ》), with the verb in the plain form.', example: '町《まち》を流《なが》れる川《かわ》は隅田川《すみだがわ》です。' },
  { id: 'passive', level: 'B1', label: 'The passive with られる', instruction: 'Use the passive (建《た》てられる, 呼《よ》ばれる) for things that are or were made, found, built or called.', example: '東京《とうきょう》タワーは1958年《ねん》に建《た》てられました。' },
  { id: 'souda', level: 'B1', label: 'そうです for what is said', instruction: 'Report what the page says sources or people state with 〜によると…そうです.', example: '研究者《けんきゅうしゃ》によると、この湖《みずうみ》はとても古《ふる》いそうです。' },
  { id: 'tame', level: 'B1', label: 'ために for a purpose', instruction: 'Say why something is done with a plain verb + ために.', example: '鳥《とり》は食《た》べ物《もの》を探《さが》すために南《みなみ》へ飛《と》びます。' },
  { id: 'conditional', level: 'B1', label: '〜と and 〜ば', instruction: 'Say what always happens when something is so with 〜と or 〜ば.', example: '山《やま》を登《のぼ》ると、だんだん寒《さむ》くなります。' },
  { id: 'you-ni-naru', level: 'B1', label: '〜ようになる', instruction: 'Say how something changed over time with 〜ようになりました.', example: '多《おお》くの人《ひと》がスマートフォンを使《つか》うようになりました。' },
  // B2
  { id: 'causative', level: 'B2', label: 'The causative with させる', instruction: 'Say who made or let someone do something with the causative (させる, 働《はたら》かせる).', example: '王《おう》は人々《ひとびと》に城《しろ》を建《た》てさせました。' },
  { id: 'niyotte', level: 'B2', label: 'によって in written passives', instruction: 'Name who made, found or invented something with 〜によって and the passive.', example: '電話《でんわ》はベルによって発明《はつめい》された。' },
  { id: 'nimokakawarazu', level: 'B2', label: 'Contrast: のに and にもかかわらず', instruction: 'Contrast two facts the page gives with のに or にもかかわらず.', example: '砂漠《さばく》はとても乾燥《かんそう》しているにもかかわらず、植物《しょくぶつ》が育《そだ》つ。' },
  { id: 'wakedewanai', level: 'B2', label: '〜わけではない', instruction: 'Say something is not true of every case with 〜わけではない, where the page says so.', example: 'すべての鳥《とり》が飛《と》べるわけではない。' },
  { id: 'ba-hodo', level: 'B2', label: '〜ば〜ほど', instruction: 'Link two facts that grow together with 〜ば〜ほど.', example: '高《たか》く登《のぼ》れば登《のぼ》るほど、寒《さむ》くなる。' },
  { id: 'keigo', level: 'B2', label: 'Polite requests to the reader', instruction: 'Use honorific requests (ご覧《らん》ください, お〜ください) in a line to the reader.', example: 'この町《まち》の古《ふる》い寺《てら》をぜひご覧《らん》ください。' },
];
