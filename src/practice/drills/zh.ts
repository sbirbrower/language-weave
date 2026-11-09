import type { DrillData } from './types';

/** Two-syllable words without a light tone, a 一 or 不, or two third tones running, so what's heard is the tones as written. */
export const ZH_DRILLS: DrillData = {
  lessons: 4,
  tones: {
    names: { 1: 'a high, level first tone', 2: 'a rising second tone', 3: 'a low, dipping third tone', 4: 'a falling fourth tone' },
    words: [
      { text: '老师《lǎoshī》', syllables: ['lǎo', 'shī'], en: 'teacher' },
      { text: '学生《xuéshēng》', syllables: ['xué', 'shēng'], en: 'student' },
      { text: '中国《Zhōngguó》', syllables: ['Zhōng', 'guó'], en: 'China' },
      { text: '汉语《Hànyǔ》', syllables: ['Hàn', 'yǔ'], en: 'Chinese' },
      { text: '米饭《mǐfàn》', syllables: ['mǐ', 'fàn'], en: 'rice' },
      { text: '电脑《diànnǎo》', syllables: ['diàn', 'nǎo'], en: 'computer' },
      { text: '手机《shǒujī》', syllables: ['shǒu', 'jī'], en: 'mobile phone' },
      { text: '咖啡《kāfēi》', syllables: ['kā', 'fēi'], en: 'coffee' },
      { text: '医生《yīshēng》', syllables: ['yī', 'shēng'], en: 'doctor' },
      { text: '工作《gōngzuò》', syllables: ['gōng', 'zuò'], en: 'work' },
      { text: '北京《Běijīng》', syllables: ['Běi', 'jīng'], en: 'Beijing' },
      { text: '银行《yínháng》', syllables: ['yín', 'háng'], en: 'bank' },
      { text: '飞机《fēijī》', syllables: ['fēi', 'jī'], en: 'plane' },
      { text: '火车《huǒchē》', syllables: ['huǒ', 'chē'], en: 'train' },
      { text: '面包《miànbāo》', syllables: ['miàn', 'bāo'], en: 'bread' },
      { text: '苹果《píngguǒ》', syllables: ['píng', 'guǒ'], en: 'apple' },
      { text: '美国《Měiguó》', syllables: ['Měi', 'guó'], en: 'America' },
      { text: '汉字《hànzì》', syllables: ['hàn', 'zì'], en: 'Chinese character' },
      { text: '大学《dàxué》', syllables: ['dà', 'xué'], en: 'university' },
      { text: '天气《tiānqì》', syllables: ['tiān', 'qì'], en: 'weather' },
      { text: '音乐《yīnyuè》', syllables: ['yīn', 'yuè'], en: 'music' },
      { text: '电影《diànyǐng》', syllables: ['diàn', 'yǐng'], en: 'film' },
      { text: '牛奶《niúnǎi》', syllables: ['niú', 'nǎi'], en: 'milk' },
      { text: '商店《shāngdiàn》', syllables: ['shāng', 'diàn'], en: 'shop' },
      { text: '时间《shíjiān》', syllables: ['shí', 'jiān'], en: 'time' },
    ],
  },
};
