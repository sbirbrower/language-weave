import type { LanguageConfig } from './types';

export const it: LanguageConfig = {
  code: 'it',
  displayName: 'Italian',
  flag: '🇮🇹',
  greeting: 'Ciao',
  bcp47: 'it-IT',
  genders: ['m', 'f'],
  grammarNotes: [
    '- Include the article when Italian needs one ("the dog" → "il cane", "dogs" in "I like dogs" → "i cani"). Masculine nouns take lo, gli, uno before s + consonant, z, gn, ps (lo zaino, gli studenti, uno specchio); l’ goes before a vowel in the singular (l’albero, l’isola), un’ before a feminine vowel (un’isola).',
    '- Include a preceding preposition when it joins the article: di, a, da, in, su + il, lo, la, l’, i, gli, le → del, al, dal, nel, sul, dello, della, dell’, dei, degli, delle… ("of the forest" → "del bosco", "in the garden" → "nel giardino", "on the island" → "sull’isola").',
    '- Adjectives agree in gender and number with their noun and usually go after it (una casa bianca, i cani grandi). Include the noun in the span when you replace an adjective.',
    '- Conjugate verbs for their subject, tense and mood in context; leave out the subject pronoun unless it is needed for contrast. Use the passato prossimo for one completed event, with essere for most verbs of movement and change and for reflexives (its participle agrees with the subject: sono arrivate) and avere for the rest; the imperfetto for what went on or was usual.',
    '- An object, reflexive, ci or ne pronoun goes before a conjugated verb: include it in the span ("washed themselves" → "si sono lavati", "saw it" → "l’hanno visto"). Put non before the verb inside the span ("did not eat" → "non hanno mangiato").',
    '- Spell with every accent (à è é ì ò ù: è for is, e for and; perché, città, più) and with the apostrophe of an elided article, with no space after it (l’acqua, dell’isola).',
  ].join('\n'),
  lemmaForms: 'infinitive for verbs, masculine singular for adjectives, noun without article',
  weaveExample: [
    'at the edge of the forest||al margine del bosco||margine||m||noun||edge',
    'were wary of strangers||diffidavano degli sconosciuti||diffidare||-||verb||to distrust',
  ].join('\n'),
  pickExample: ['dog|dogs||cane', 'run|runs|running|ran||correre', 'fast||veloce'].join('\n'),
  // Words that are also English (i, come, dove, era, con, per, ma, ha, da, chi, sue, ai) are left out; a and in
  // count for both (`SHARED` in checks.ts). non stays: in English it is mostly a prefix (non-profit), never two in a line.
  functionWords: 'il lo la gli le un uno una e è a di del della dei degli delle dell al alla alle nel nella nell dal sul che si ci ne non sono erano anche molto più questo questa questi queste quando perché essere avere hanno suo sua loro tra dopo mentre stato'.split(' '),
  genderColors: { m: '#2b6cb0', f: '#b83280' },
  citationForm(lemma, gender, pos) {
    if (pos !== 'noun' || (gender !== 'm' && gender !== 'f')) return lemma;
    // Ignores lo before i + vowel (lo iato) and the plural-only nouns; good enough for a list.
    if (/^[aeiouhàèéìòù]/i.test(lemma)) return `l’${lemma}`;
    if (gender === 'f') return `la ${lemma}`;
    return /^(s[^aeiouàèéìòù]|z|gn|ps|pn|x|y)/i.test(lemma) ? `lo ${lemma}` : `il ${lemma}`;
  },
};
