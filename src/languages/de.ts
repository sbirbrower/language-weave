import type { LanguageConfig } from './types';

export const de: LanguageConfig = {
  code: 'de',
  displayName: 'German',
  flag: '🇩🇪',
  bcp47: 'de-DE',
  genders: ['m', 'f', 'n'],
  grammarNotes: [
    '- Include the article when German needs one, in the case the sentence needs ("the dog" as subject → "der Hund", "I see the dog" → "den Hund", "with the dog" → "mit dem Hund").',
    '- Capitalise every noun, wherever it stands ("the house" → "das Haus").',
    '- Include a preceding preposition when it contracts with the article: an dem → am, in dem → im, in das → ins, zu dem → zum, zu der → zur, von dem → vom, bei dem → beim ("in the forest" → "im Wald").',
    '- Adjectives before a noun take the ending their gender, case and article call for (ein großer Hund, der große Hund, mit einem großen Hund). Include the noun in the span when you replace such an adjective. Adjectives after sein take no ending.',
    '- Conjugate verbs for their subject and tense. Skip a verb whose German would have to move to stay grammatical (a separable prefix, a verb at the end of a subordinate clause, the participle of a compound tense); pick a noun or an adjective instead.',
    '- Spell with ä, ö, ü and ß, never ae, oe, ue or ss for them.',
  ].join('\n'),
  lemmaForms: 'infinitive for verbs, the adjective without an ending, noun without article',
  weaveExample: [
    'at the edge of the forest||am Rand des Waldes||Rand||m||noun||edge',
    'were wary of strangers||misstrauten Fremden||misstrauen||-||verb||to distrust',
  ].join('\n'),
  pickExample: ['dog|dogs||Hund', 'run|runs|running|ran||laufen', 'fast||schnell'].join('\n'),
  functionWords: 'der die das den dem des ein eine einen einem einer und ist sind nicht mit von zu zum zur im auf für es sie er ich wir ihr auch sehr hat haben wird werden war kein keine sich'.split(' '),
  genderColors: { m: '#2b6cb0', f: '#b83280', n: '#2f855a' },
  citationForm(lemma, gender, pos) {
    if (pos !== 'noun' || gender === '-') return lemma;
    const article = { m: 'der', f: 'die', n: 'das' }[gender];
    return `${article} ${lemma.charAt(0).toUpperCase()}${lemma.slice(1)}`;
  },
};
