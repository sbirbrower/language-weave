import type { GrammarPoint } from './types';

// For webpage passages: each point must fit true facts about any page (third person, the page's tenses),
// or a format's questions and reactions. Lessons bring their own points (`src/syllabus/`).
export const frGrammar: GrammarPoint[] = [
  // A1
  { id: 'etre-avoir', level: 'A1', label: 'être and avoir in the present', instruction: 'Use être and avoir in the present (il est, elle a, ils sont, ils ont) to say what things are and have.', example: 'Le lac est grand et il a trois îles.' },
  { id: 'articles', level: 'A1', label: 'le, la, les / un, une, des', instruction: 'Use definite and indefinite articles with the right gender and number (le, la, l\', les, un, une, des).', example: 'Une ville a un port et des plages.' },
  { id: 'adj-agreement', level: 'A1', label: 'Adjective agreement', instruction: 'Use adjectives that agree with their noun in gender and number (grand / grande / grands / grandes).', example: 'Les maisons sont blanches et la rue est petite.' },
  { id: 'negation', level: 'A1', label: 'ne… pas', instruction: 'Use ne… pas (n\'… pas before a vowel) for something the page says is not so.', example: 'Ce serpent n\'est pas dangereux.' },
  { id: 'il-y-a', level: 'A1', label: 'il y a', instruction: 'Use il y a to say what is in a place or how many there are.', example: 'Il y a 272 stations dans le métro.' },
  { id: 'er-present', level: 'A1', label: 'Regular -er verbs in the present', instruction: 'Use regular -er verbs in the present (il habite, elles mangent, on trouve) for general facts.', example: 'Ces oiseaux mangent des insectes.' },
  { id: 'questions', level: 'A1', label: 'Questions with est-ce que and question words', instruction: 'Ask questions with est-ce que, où, quand, combien or qui, in a line where a question fits (a heading, a quiz, an interview, a reaction).', example: 'Où est-ce que le fleuve commence ?' },
  { id: 'place-prepositions', level: 'A1', label: 'Prepositions of place', instruction: 'Say where things are with à, en, au, dans, sur, sous, près de or entre.', example: 'Le château est près de la mer, en Écosse.' },
  // A2
  { id: 'pc-avoir', level: 'A2', label: 'Passé composé with avoir', instruction: 'Use the passé composé with avoir for completed past events the page dates or describes.', example: 'Les Romains ont construit le pont en 50.' },
  { id: 'pc-etre', level: 'A2', label: 'Passé composé with être', instruction: 'Use the passé composé with être for movement and change (arriver, partir, naître, mourir, devenir), with agreement.', example: 'Elle est née à Paris et elle est partie en 1920.' },
  { id: 'comparatives', level: 'A2', label: 'plus / moins / aussi… que', instruction: 'Compare two things the page gives facts for with plus… que, moins… que or aussi… que.', example: 'Le Nil est plus long que l\'Amazone.' },
  { id: 'superlatives', level: 'A2', label: 'le plus / le moins', instruction: 'Use a superlative (le plus grand, la plus ancienne, le moins connu) only where the page says something is the most or least.', example: 'C\'est la plus haute montagne d\'Europe.' },
  { id: 'futur-proche', level: 'A2', label: 'Futur proche', instruction: 'Use aller + infinitive for plans the page states, or in a line to the reader or a dialogue.', example: 'La ville va ouvrir une nouvelle ligne.' },
  { id: 'possessives', level: 'A2', label: 'Possessive adjectives', instruction: 'Use possessive adjectives (son, sa, ses, leur, leurs) for what people or things have.', example: 'Le chat chasse avec ses griffes et sa queue l\'aide à sauter.' },
  { id: 'object-pronouns', level: 'A2', label: 'le, la, les as object pronouns', instruction: 'Replace a noun already named with le, la, l\' or les before the verb.', example: 'Les abeilles font du miel et les hommes le récoltent.' },
  { id: 'imparfait-description', level: 'A2', label: 'Imparfait for descriptions', instruction: 'Use the imparfait to describe how things were or what used to happen in the past.', example: 'Autrefois, la ville était petite et les gens pêchaient.' },
  // B1
  { id: 'pc-imparfait', level: 'B1', label: 'Passé composé or imparfait', instruction: 'In the same sentence or pair of sentences, use the imparfait for the background and the passé composé for the event.', example: 'Le navire traversait l\'Atlantique quand il a heurté un iceberg.' },
  { id: 'relatives', level: 'B1', label: 'qui, que, où', instruction: 'Join facts with the relative pronouns qui, que and où.', example: 'C\'est la ville où le roi est né et qui a donné son nom au pays.' },
  { id: 'passive', level: 'B1', label: 'The passive', instruction: 'Use the passive (être + past participle, with agreement, and par for the doer) for things that are or were made, found or built.', example: 'La tour a été construite par Gustave Eiffel.' },
  { id: 'futur-simple', level: 'B1', label: 'Futur simple', instruction: 'Use the futur simple for what the page says will happen, or in a line to the reader.', example: 'La nouvelle gare ouvrira en 2030.' },
  { id: 'y-en', level: 'B1', label: 'The pronouns y and en', instruction: 'Use y for a place and en for a quantity or de + noun, instead of repeating them.', example: 'Le parc est immense et on y trouve des ours. Il y en a cent.' },
  { id: 'conditional', level: 'B1', label: 'Conditionnel présent', instruction: 'Use the conditionnel in a line to the reader, a reaction or a dialogue (on pourrait, tu aimerais, ce serait).', example: 'Tu aimerais voir ces montagnes ?' },
  { id: 'dont', level: 'B1', label: 'dont', instruction: 'Use dont for a link with de (whose, of which).', example: 'C\'est un animal dont la queue est très longue.' },
  // B2
  { id: 'plus-que-parfait', level: 'B2', label: 'Plus-que-parfait', instruction: 'Use the plus-que-parfait for an event that came before another past event on the page.', example: 'Quand la guerre a commencé, le pont avait déjà été détruit.' },
  { id: 'subjonctif', level: 'B2', label: 'The subjunctive', instruction: 'Use the subjunctive after il faut que, bien que, pour que or avant que, keeping every fact true.', example: 'Bien que le volcan soit actif, des gens vivent tout près.' },
  { id: 'gerondif', level: 'B2', label: 'The gérondif (en + -ant)', instruction: 'Use the gérondif to say how or while something is done.', example: 'Les baleines communiquent en chantant.' },
  { id: 'passe-simple', level: 'B2', label: 'Passé simple (third person)', instruction: 'Use the passé simple in the third person for dated past events, as history books do.', example: 'Napoléon devint empereur en 1804.' },
  { id: 'connectors', level: 'B2', label: 'Contrast: cependant, pourtant, alors que', instruction: 'Contrast two facts the page gives with cependant, pourtant, alors que or tandis que.', example: 'Le désert est très sec, pourtant des plantes y poussent.' },
  { id: 'lequel', level: 'B2', label: 'lequel, auquel, duquel', instruction: 'Use a relative with a preposition (dans lequel, auquel, près duquel).', example: 'C\'est le lac au bord duquel la ville a été fondée.' },
];
