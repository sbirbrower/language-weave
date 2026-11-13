import type { LanguageConfig } from './types';

export const cs: LanguageConfig = {
  code: 'cs',
  displayName: 'Czech',
  flag: '🇨🇿',
  greeting: 'Ahoj',
  bcp47: 'cs-CZ',
  genders: ['m', 'f', 'n'],
  grammarNotes: [
    '- Czech has no articles: "the house" → "dům", with the article inside the span.',
    '- Nouns, adjectives and pronouns take the case the sentence needs. Include a preceding preposition in the span, since it decides the case ("in the forest" → "v lese", "with the dog" → "se psem", "to the town" → "do města", "the dog" as object → "psa").',
    '- Write v, s, k and z as ve, se, ke and ze before a word that would be hard to say otherwise (ve městě, se psem, ke stolu, ze školy).',
    '- Adjectives agree with their noun in gender, number and case (velký pes, velká kočka, velké město, s velkým psem). Include the noun in the span when you replace such an adjective. Masculine nouns for people and animals take the animate endings (vidím psa, malí psi; but vidím dům, malé domy).',
    '- Conjugate verbs for their subject and tense; the past agrees with the subject in gender and number (byl, byla, bylo, byli, byly). Use a perfective verb for one completed event, an imperfective one for what went on or was repeated. Skip a verb that needs se or si, or a past tense that needs jsem or jsi, since those small words must stand second in a Czech clause; pick a noun or an adjective instead.',
    '- Spell with every háček and čárka (č ď ň ř š ť ž ě, á é í ó ú ů ý), never without them.',
  ].join('\n'),
  lemmaForms: 'infinitive for verbs, the masculine nominative singular for adjectives, nominative singular for nouns',
  weaveExample: [
    'at the edge of the forest||na okraji lesa||okraj||m||noun||edge',
    'were wary of strangers||nedůvěřovali cizincům||nedůvěřovat||-||verb||to distrust',
  ].join('\n'),
  pickExample: ['dog|dogs||pes', 'run|runs|running|ran||běžet', 'fast||rychlý'].join('\n'),
  // Words that are also English (i, to, on, do, my, ten, by, s from "it's") are left out; a counts for both (`SHARED` in checks.ts).
  functionWords: 'a je jsou byl byla bylo byli byly není nejsou jsem jsme jste se si v ve na ze ke že jak co kde kdy proč ale nebo také taky velmi který která které jeho její jejich už ještě pro od při jako tak než jen'.split(' '),
  genderColors: { m: '#2b6cb0', f: '#b83280', n: '#2f855a' },
  citationForm(lemma, gender, pos) {
    return pos === 'noun' && gender !== '-' ? `${lemma} (${gender})` : lemma;
  },
};
