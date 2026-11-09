import type { LanguageConfig } from './types';

export const es: LanguageConfig = {
  code: 'es',
  displayName: 'Spanish',
  flag: '🇪🇸',
  bcp47: 'es-ES',
  genders: ['m', 'f'],
  grammarNotes: [
    '- Include the article when Spanish needs one ("the dog" → "el perro", "dogs" in "I like dogs" → "los perros"). A feminine noun starting with a stressed a or ha takes el in the singular ("the water" → "el agua").',
    '- Include a preceding preposition when it contracts: a + el → al, de + el → del ("to the market" → "al mercado", "of the forest" → "del bosque").',
    '- Adjectives agree in gender and number with their noun and usually go after it (una casa blanca, los perros grandes). Include the noun in the span when you replace an adjective.',
    '- Conjugate verbs for their subject, tense and mood in context; leave out the subject pronoun unless it is needed for contrast. Use the preterite for one completed event and the imperfect for what went on or was usual. Use ser for what something is and estar for where it is or how it is for now.',
    '- An object or reflexive pronoun goes before a conjugated verb: include it in the span ("washed themselves" → "se lavaron", "saw it" → "lo vieron"). Put a before a person who is the object ("saw her mother" → "vio a su madre").',
    '- Spell with every accent, ñ and ü (á é í ó ú ñ ü), never without them. Leave out ¿ and ¡ inside an English sentence.',
  ].join('\n'),
  lemmaForms: 'infinitive for verbs, masculine singular for adjectives, noun without article',
  weaveExample: [
    'at the edge of the forest||al borde del bosque||borde||m||noun||edge',
    'were wary of strangers||desconfiaban de los desconocidos||desconfiar||-||verb||to distrust',
  ].join('\n'),
  pickExample: ['dog|dogs||perro', 'run|runs|running|ran||correr', 'fast||rápido'].join('\n'),
  // Words that are also English (no, son, con, sin, era, hay, ya, mi, dos) are left out; a and me count for both (`SHARED` in checks.ts).
  functionWords: 'el la los las un una unos unas y o a es está están estaba fue del al de que en por para se su sus lo le les muy pero como más también este esta estos estas ese esa cuando donde porque han tiene tienen ser estar hace él ella ellos ellas nosotros'.split(' '),
  genderColors: { m: '#2b6cb0', f: '#b83280' },
  citationForm(lemma, gender, pos) {
    if (pos !== 'noun' || (gender !== 'm' && gender !== 'f')) return lemma;
    // Ignores el agua, el águila (a stressed a- that takes el); good enough for a list.
    return `${gender === 'm' ? 'el' : 'la'} ${lemma}`;
  },
};
