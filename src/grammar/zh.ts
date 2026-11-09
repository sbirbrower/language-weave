import type { GrammarPoint } from './types';

// For webpage passages: each point must fit true facts about any page (third person, the page's tenses),
// or a format's questions and reactions. Lessons bring their own points (`src/syllabus/`).
// Examples carry pinyin (src/ruby.ts), word by word, as the passages do.
export const zhGrammar: GrammarPoint[] = [
  // A1
  { id: 'shi', level: 'A1', label: '是《shì》 for what things are', instruction: 'Say what things are with A 是《shì》 B, and 不《bù》是《shì》 for what they are not.', example: '东京《Dōngjīng》是《shì》日本《Rìběn》的《de》首都《shǒudū》。' },
  { id: 'you', level: 'A1', label: '有《yǒu》 for what there is', instruction: 'Say what a place has or what there is with 有《yǒu》, and 没有《méiyǒu》 for what there isn’t.', example: '一《yī》年《nián》有《yǒu》十二《shí’èr》个《gè》月《yuè》。' },
  { id: 'hen', level: 'A1', label: '很《hěn》 + adjective', instruction: 'Describe things with 很《hěn》 and an adjective, with no 是《shì》 (山《shān》很《hěn》高《gāo》).', example: '这《zhè》座《zuò》山《shān》很《hěn》高《gāo》。' },
  { id: 'bu', level: 'A1', label: 'Saying no with 不《bù》', instruction: 'Use 不《bù》 before a verb or an adjective for something the page says is not so.', example: '鲸鱼《jīngyú》不《bù》是《shì》鱼《yú》。' },
  { id: 'de', level: 'A1', label: '的《de》 between nouns', instruction: 'Link two nouns with 的《de》 for what belongs to or describes something (法国《Fǎguó》的《de》首都《shǒudū》).', example: '法国《Fǎguó》的《de》首都《shǒudū》是《shì》巴黎《Bālí》。' },
  { id: 'zai', level: 'A1', label: '在《zài》 for where things are', instruction: 'Say where something is with 在《zài》 and the place.', example: '巴黎《Bālí》在《zài》法国《Fǎguó》。' },
  { id: 'ma', level: 'A1', label: 'Questions with 吗《ma》 and 什么《shénme》, 哪里《nǎlǐ》, 几《jǐ》', instruction: 'Ask questions with 吗《ma》 at the end or a question word in place of the answer, in a line where a question fits (a heading, a quiz, an interview, a reaction).', example: '北京《Běijīng》在《zài》哪里《nǎlǐ》？' },
  { id: 'measure', level: 'A1', label: 'Numbers with measure words', instruction: 'Count with a measure word between the number and the noun (个《gè》 for most things, 只《zhī》 for animals, 本《běn》 for books).', example: '一《yī》年《nián》有《yǒu》四《sì》个《gè》季节《jìjié》。' },
  { id: 'verbs', level: 'A1', label: 'Verbs for facts', instruction: 'State general facts with a plain verb, which never changes for who does it or when.', example: '熊猫《xióngmāo》吃《chī》竹子《zhúzi》。' },
  // A2
  { id: 'le', level: 'A2', label: '了《le》 for what happened', instruction: 'Use 了《le》 after a verb for an event the page dates or describes as done.', example: '2008年《nián》，北京《Běijīng》举办《jǔbàn》了《le》奥运会《Àoyùnhuì》。' },
  { id: 'guo', level: 'A2', label: '过《guo》 for what has happened before', instruction: 'Use 过《guo》 after a verb for something that has happened at some time, where the page says so.', example: '人类《rénlèi》去《qù》过《guo》月球《yuèqiú》。' },
  { id: 'bi', level: 'A2', label: 'Comparing with 比《bǐ》', instruction: 'Compare two things the page gives facts for with A 比《bǐ》 B + adjective.', example: '长江《Chángjiāng》比《bǐ》黄河《Huánghé》长《cháng》。' },
  { id: 'zui', level: 'A2', label: '最《zuì》 for the most', instruction: 'Use 最《zuì》 only where the page says something is the most or least.', example: '珠穆朗玛峰《Zhūmùlǎngmǎ Fēng》是《shì》世界《shìjiè》上《shàng》最《zuì》高《gāo》的《de》山《shān》。' },
  { id: 'zhengzai', level: 'A2', label: '正在《zhèngzài》 for what is going on', instruction: 'Use 正在《zhèngzài》 before a verb for something going on now, where the page says so.', example: '很《hěn》多《duō》城市《chéngshì》正在《zhèngzài》变《biàn》大《dà》。' },
  { id: 'yinwei', level: 'A2', label: '因为《yīnwèi》…所以《suǒyǐ》', instruction: 'Give a reason the page states with 因为《yīnwèi》 and its result with 所以《suǒyǐ》.', example: '因为《yīnwèi》冬天《dōngtiān》很《hěn》冷《lěng》，所以《suǒyǐ》熊《xióng》要《yào》睡《shuì》很《hěn》长《cháng》时间《shíjiān》。' },
  { id: 'hui', level: 'A2', label: '会《huì》 for can', instruction: 'Say what animals or people can or cannot do with 会《huì》 and 不《bù》会《huì》.', example: '企鹅《qǐ’é》不《bù》会《huì》飞《fēi》，但是《dànshì》会《huì》游泳《yóuyǒng》。' },
  { id: 'time-place', level: 'A2', label: 'Time and place before the verb', instruction: 'Put when and where before the verb: who, when, where, then what happens.', example: '很《hěn》多《duō》中国人《Zhōngguórén》在《zài》春节《Chūnjié》吃《chī》饺子《jiǎozi》。' },
  // B1
  { id: 'relative', level: 'B1', label: 'Describing a noun with 的《de》', instruction: 'Describe a noun with a clause and 的《de》 before it (流经《liújīng》上海《Shànghǎi》的《de》河《hé》).', example: '流经《liújīng》上海《Shànghǎi》的《de》河《hé》叫《jiào》黄浦江《Huángpǔ Jiāng》。' },
  { id: 'bei', level: 'B1', label: 'The passive with 被《bèi》', instruction: 'Use 被《bèi》 for something done to a thing or a person, often something bad, where the page says so.', example: '1666年《nián》，伦敦《Lúndūn》的《de》很《hěn》多《duō》房子《fángzi》被《bèi》大火《dàhuǒ》烧毁《shāohuǐ》了《le》。' },
  { id: 'shi-de', level: 'B1', label: '是《shì》…的《de》 for who, when or how', instruction: 'Stress who did something, or when, where or how it was done, with 是《shì》…的《de》.', example: '电话《diànhuà》是《shì》贝尔《Bèi’ěr》发明《fāmíng》的《de》。' },
  { id: 'yuelaiyue', level: 'B1', label: '越来越《yuèláiyuè》', instruction: 'Say how something keeps growing or changing with 越来越《yuèláiyuè》 and an adjective.', example: '用《yòng》手机《shǒujī》的《de》人《rén》越来越《yuèláiyuè》多《duō》。' },
  { id: 'suiran', level: 'B1', label: '虽然《suīrán》…但是《dànshì》', instruction: 'Contrast two facts the page gives with 虽然《suīrán》 and 但是《dànshì》.', example: '虽然《suīrán》沙漠《shāmò》很《hěn》干《gān》，但是《dànshì》也《yě》有《yǒu》植物《zhíwù》。' },
  { id: 'ruguo', level: 'B1', label: '如果《rúguǒ》…就《jiù》', instruction: 'Say what happens when something is so with 如果《rúguǒ》 and 就《jiù》.', example: '如果《rúguǒ》水《shuǐ》到《dào》了《le》零《líng》度《dù》，就《jiù》会《huì》结冰《jiébīng》。' },
  { id: 'ju', level: 'B1', label: '据《jù》…说《shuō》 for what is said', instruction: 'Report what the page says sources or people state with 据《jù》…说《shuō》.', example: '据《jù》科学家《kēxuéjiā》说《shuō》，这《zhè》种《zhǒng》鸟《niǎo》很《hěn》少见《shǎojiàn》。' },
  { id: 'weile', level: 'B1', label: '为了《wèile》 for a purpose', instruction: 'Say why something is done with 为了《wèile》 at the start.', example: '为了《wèile》找《zhǎo》食物《shíwù》，很《hěn》多《duō》鸟《niǎo》冬天《dōngtiān》飞《fēi》到《dào》南方《nánfāng》。' },
  // B2
  { id: 'ba', level: 'B2', label: 'The 把《bǎ》 construction', instruction: 'Say what is done to a thing, and where it ends up, with 把《bǎ》 and the thing before the verb.', example: '蜜蜂《mìfēng》把《bǎ》花粉《huāfěn》带《dài》回《huí》蜂巢《fēngcháo》。' },
  { id: 'you-agent', level: 'B2', label: '由《yóu》 in written Chinese', instruction: 'Name who made, wrote, proposed or runs something with 由《yóu》, as written texts do.', example: '相对论《xiāngduìlùn》由《yóu》爱因斯坦《Àiyīnsītǎn》提出《tíchū》。' },
  { id: 'budan', level: 'B2', label: '不但《bùdàn》…而且《érqiě》', instruction: 'Add a second fact to a first with 不但《bùdàn》…而且《érqiě》.', example: '中国《Zhōngguó》不但《bùdàn》人口《rénkǒu》多《duō》，而且《érqiě》面积《miànjī》也《yě》很《hěn》大《dà》。' },
  { id: 'jishi', level: 'B2', label: '即使《jíshǐ》…也《yě》', instruction: 'Say something stays true even in a case the page names with 即使《jíshǐ》…也《yě》.', example: '即使《jíshǐ》在《zài》冬天《dōngtiān》，这里《zhèlǐ》也《yě》不《bù》冷《lěng》。' },
  { id: 'bingbushi', level: 'B2', label: '并不是《bìng bù shì》…都《dōu》', instruction: 'Say something is not true of every case with 并《bìng》不《bù》是《shì》…都《dōu》, where the page says so.', example: '并《bìng》不《bù》是《shì》所有《suǒyǒu》的《de》鸟《niǎo》都《dōu》会《huì》飞《fēi》。' },
  { id: 'zhiyi', level: 'B2', label: '…之一《zhīyī》 for one of', instruction: 'Say something is one of the most or the best with 最《zuì》…之一《zhīyī》, where the page says so.', example: '长城《Chángchéng》是《shì》世界《shìjiè》上《shàng》最《zuì》有名《yǒumíng》的《de》建筑《jiànzhù》之一《zhīyī》。' },
  { id: 'suizhe', level: 'B2', label: '随着《suízhe》 for change over time', instruction: 'Link a change to what goes with it with 随着《suízhe》.', example: '随着《suízhe》人口《rénkǒu》增长《zēngzhǎng》，城市《chéngshì》越来越《yuèláiyuè》大《dà》。' },
  { id: 'yi-wei', level: 'B2', label: '以《yǐ》…为《wéi》 in written Chinese', instruction: 'Use the written pattern 以《yǐ》 A 为《wéi》 B (以《yǐ》…为《wéi》食《shí》, 以《yǐ》…为《wéi》主《zhǔ》) for what something lives on or is mainly made of.', example: '这《zhè》种《zhǒng》鸟《niǎo》以《yǐ》昆虫《kūnchóng》为《wéi》食《shí》。' },
];
