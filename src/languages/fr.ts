import type { LanguageConfig } from './types';

export const fr: LanguageConfig = {
  code: 'fr',
  displayName: 'French',
  flag: '🇫🇷',
  bcp47: 'fr-FR',
  genders: ['m', 'f'],
  grammarNotes: [
    '- Include the determiner when the French needs one ("the dog" → "le chien", "apples" in "I like apples" → "les pommes").',
    '- Include a preceding preposition when it contracts: de + le → du, de + les → des, à + le → au, à + les → aux ("of the house" → "de la maison", "to the markets" → "aux marchés").',
    "- Apply elision: le/la → l', de → d', que → qu' before a vowel or mute h (\"the apple tree\" → \"le pommier\", \"the hour\" → \"l'heure\").",
    '- Adjectives agree in gender and number with their noun and go where French puts them (usually after the noun; BANGS adjectives before). Include the noun in the span when you replace an adjective.',
    '- Conjugate verbs for their subject, tense and mood in context. Include the subject pronoun if French needs it.',
    '- Use the partitive (du, de la, des, de) where English has a bare mass noun ("they drank water" → "ils ont bu de l\'eau" if replacing the whole clause; otherwise "water" → "de l\'eau").',
  ].join('\n'),
  lemmaForms: 'infinitive for verbs, masculine singular for adjectives, noun without article',
  weaveExample: [
    "the edge of the forest||l'orée de la forêt||orée||f||noun||edge (of a wood)",
    'were wary of||se méfiaient des||se méfier||-||verb||to be wary of',
  ].join('\n'),
  pickExample: ['dog|dogs||chien', 'run|runs|running|ran||courir', 'fast||rapide'].join('\n'),
  functionWords: 'le la les un une des du de et est sont en dans il elle ils elles qui que pour avec sur au aux ce cette ces son sa ses leur leurs pas ne plus très a ont été être avoir nous vous je'.split(' '),
  genderColors: { m: '#2b6cb0', f: '#b83280' },
  citationForm(lemma, gender, pos) {
    if (pos !== 'noun' || (gender !== 'm' && gender !== 'f')) return lemma;
    // Ignores h aspiré ("le héros"); good enough for a list.
    if (/^[aeiouyhâàäéèêëîïôöûùü]/i.test(lemma)) return `l'${lemma}`;
    return `${gender === 'm' ? 'le' : 'la'} ${lemma}`;
  },
};
