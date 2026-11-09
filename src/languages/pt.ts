import type { LanguageConfig } from './types';

export const pt: LanguageConfig = {
  code: 'pt',
  // "Brazilian" in every prompt, so the model doesn't drift into Portugal's words and spelling.
  displayName: 'Brazilian Portuguese',
  flag: '🇧🇷',
  bcp47: 'pt-BR',
  genders: ['m', 'f'],
  grammarNotes: [
    '- Include the article when Portuguese needs one ("the dog" → "o cachorro", "dogs" in "I like dogs" → "os cachorros"). Countries take one (o Brasil, a França), Portugal does not.',
    '- Include a preceding preposition when it contracts with the article: de + o → do, em + a → na, a + a → à, por + o → pelo ("of the forest" → "da floresta", "in the city" → "na cidade", "through the park" → "pelo parque").',
    '- Adjectives agree in gender and number with their noun and usually go after it (uma casa branca, os cachorros grandes). Include the noun in the span when you replace an adjective.',
    '- Conjugate verbs for their subject, tense and mood in context. "You" is você, with the third-person verb (você fala), never tu or vós. Use the preterite (pretérito perfeito) for one completed event and the imperfect for what went on or was usual; for "has been doing" use tem + participle (tem crescido). Use ser for what something is, estar for how it is for now, and ficar for where a place is.',
    '- An object or reflexive pronoun goes before the verb, as Brazilians write it: include it in the span ("washed themselves" → "se lavaram", "saw it" → "o viram"). If the English puts it first in a sentence, choose another span.',
    '- Spell with every accent and the cedilla (á â ã à é ê í ó ô õ ú ç), never without them, in Brazilian spelling (ônibus, econômico, fato, ideia).',
  ].join('\n'),
  lemmaForms: 'infinitive for verbs, masculine singular for adjectives, noun without article',
  weaveExample: [
    'at the edge of the forest||à beira da floresta||beira||f||noun||edge',
    'were wary of strangers||desconfiavam de estranhos||desconfiar||-||verb||to distrust',
  ].join('\n'),
  pickExample: ['dog|dogs||cachorro', 'run|runs|running|ran||correr', 'fast||rápido'].join('\n'),
  // Words that are also English (no, do, era, eu as in the EU, com as in .com) are left out; a, as and me count for both (`SHARED` in checks.ts).
  functionWords: 'o a os as um uma uns umas e ou é são está estão estava foi de da dos das na nos nas ao aos à pelo pela que em para por se seu sua seus suas não mais muito também mas como quando onde porque ele ela eles elas você vocês nós tem têm isso este esta'.split(' '),
  writingNotes:
    'Brazilian Portuguese as Brazilians write it today, never European Portuguese: você and vocês with third-person verbs, not tu or vós; estar + gerund (está fazendo), not estar a + infinitive; pronouns before the verb (se chama, me ajudou); Brazilian words (ônibus, trem, celular, café da manhã, banheiro, geladeira), not autocarro, comboio, telemóvel, pequeno-almoço; Brazilian spelling under the 1990 agreement (econômico, fato, ação, ideia, voo).',
  genderColors: { m: '#2b6cb0', f: '#b83280' },
  citationForm(lemma, gender, pos) {
    if (pos !== 'noun' || (gender !== 'm' && gender !== 'f')) return lemma;
    return `${gender === 'm' ? 'o' : 'a'} ${lemma}`;
  },
};
