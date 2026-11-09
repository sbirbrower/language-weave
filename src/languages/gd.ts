import type { LanguageConfig } from './types';

export const gd: LanguageConfig = {
  code: 'gd',
  displayName: 'Scottish Gaelic',
  flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  bcp47: 'gd-GB',
  // Neither Google Text-to-Speech nor Whisper has Scottish Gaelic.
  noVoice: true,
  notHeard: true,
  genders: ['m', 'f'],
  grammarNotes: [
    '- Include the article in the span, in the form the noun’s gender, case and first letter need: masculine an, am before b f m p, an t- before a vowel (an cù, am bàta, an t-eilean); feminine a’ with lenition, an t- before sl sn sr or s and a vowel (a’ chaileag, a’ bhò, an t-sràid, an uinneag); na for every plural (na coin, na h-eileanan).',
    '- Include a preceding preposition in the span: it decides the case, lenites after the article and joins with it ("in the house" → "anns an taigh", "on the table" → "air a’ bhòrd", "to the shop" → "don bhùth", "under the bed" → "fon leabaidh", "from Glasgow" → "à Glaschu").',
    '- "X of the Y" is "X na Y" or "X an Y" with the second noun in the genitive and no article on the first ("at the edge of the forest" → "aig iomall na coille", "the door of the house" → "doras an taighe").',
    '- Adjectives come after their noun, lenited after a feminine singular noun (taigh mòr, caileag bheag), so include the noun (and its article) in the span when you replace an adjective ("the big house" → "an taigh mòr"). A predicative adjective after is or was stays plain ("is big" → "mòr"). seann, deagh and droch come before the noun and lenite it (seann chaisteal, deagh bhiadh).',
    '- Possessives come before the noun: include them (mo thaigh, do chù, a phiuthar for his sister, a piuthar for her sister, ar baile, ur càr).',
    '- A finite verb stands first in its Gaelic clause and carries the tense, and "have" is said with aig, so English word order can’t hold them: skip finite verbs and have. Weave a verb only as a verbal noun, for an English -ing after a form of be ("were running" → "a’ ruith", "is eating" → "ag ithe") or used as a noun ("swimming is popular" → "snàmh"); else pick a noun or an adjective instead.',
    '- Spell with every grave accent (à è ì ò ù) as the Gaelic Orthographic Conventions write them, never with acute accents, and with the apostrophe in a’ and dh’.',
  ].join('\n'),
  lemmaForms: 'the verbal noun for verbs, since only verbal nouns are woven (ithe, òl, ruith, ceannach), the masculine nominative singular for adjectives (mòr), the nominative singular for nouns, without the article (taigh, caileag)',
  weaveExample: [
    'at the edge of the forest||aig iomall na coille||iomall||m||noun||edge',
    'strangers||coigrich||coigreach||m||noun||stranger',
  ].join('\n'),
  pickExample: ['dog|dogs||cù', 'run|runs|running|ran||ruith', 'fast||luath'].join('\n'),
  // Words that are also English (is, do, no, air, gun, am, mar, sin, i) are left out; a, an and as count for both (`SHARED` in checks.ts).
  functionWords: 'a an na nan nam as agus tha bha bidh bhiodh chan cha eil bheil robh e iad mi thu sinn sibh anns ann aig le ri gu mu bho de tro ach seo siud glè cuideachd nach gach aca aige aice agam leis ris dha chaidh rinn nas cò dè'.split(' '),
  // Gaelic is easily mixed with Irish, its nearest neighbour, which is better known to the model.
  writingNotes:
    'standard modern Scottish Gaelic as Scottish schools teach it, never Irish words or spellings (tha, not tá; chan eil, not níl; ciamar, not conas), spelled to the Gaelic Orthographic Conventions: grave accents only (à è ì ò ù, never á é ó), a’ and dh’ with an apostrophe.',
  genderColors: { m: '#2b6cb0', f: '#b83280' },
  citationForm(lemma, gender, pos) {
    return pos === 'noun' && gender !== '-' ? `${lemma} (${gender})` : lemma;
  },
};
