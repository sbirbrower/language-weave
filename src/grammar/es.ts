import type { GrammarPoint } from './types';

// For webpage passages: each point must fit true facts about any page (third person, the page's tenses),
// or a format's questions and reactions. Lessons bring their own points (`src/syllabus/`).
export const esGrammar: GrammarPoint[] = [
  // A1
  { id: 'ser', level: 'A1', label: 'ser in the present', instruction: 'Use ser in the present (es, son) to say what things are and what they are like.', example: 'El río es largo y las montañas son altas.' },
  { id: 'estar', level: 'A1', label: 'estar for where things are', instruction: 'Use estar in the present (está, están) to say where things are.', example: 'Madrid está en el centro de España.' },
  { id: 'gender', level: 'A1', label: 'Gender and adjectives that agree', instruction: 'Use el or la, un or una, and adjectives that agree with their noun’s gender and number (un castillo antiguo, una ciudad grande, unas casas blancas).', example: 'Toledo es una ciudad antigua con calles estrechas.' },
  { id: 'hay', level: 'A1', label: 'hay (there is, there are)', instruction: 'Use hay to say what there is in a place.', example: 'En la isla hay dos playas y un faro.' },
  { id: 'tener', level: 'A1', label: 'tener (to have)', instruction: 'Use tener in the present (tiene, tienen) to say what things have.', example: 'El gato tiene la cola larga.' },
  { id: 'present', level: 'A1', label: 'Regular verbs in the present', instruction: 'Use regular -ar, -er and -ir verbs in the present (vive, viven, come, comen, habla, hablan) for general facts.', example: 'El oso polar vive en el Ártico y come focas.' },
  { id: 'negation', level: 'A1', label: 'Negation with no', instruction: 'Put no before the verb for something the page says is not so.', example: 'Esta serpiente no es peligrosa y no tiene veneno.' },
  { id: 'questions', level: 'A1', label: 'Questions with qué, dónde, cuándo, cuántos', instruction: 'Ask questions with qué, quién, dónde, cuándo or cuántos, written with ¿ and ?, in a line where a question fits (a heading, a quiz, an interview, a reaction).', example: '¿Dónde nace el río?' },
  // A2
  { id: 'preterite', level: 'A2', label: 'The preterite', instruction: 'Use the preterite (fundó, construyeron, descubrió) for completed past events the page describes.', example: 'Cristóbal Colón llegó a América en 1492.' },
  { id: 'imperfect', level: 'A2', label: 'The imperfect', instruction: 'Use the imperfect (vivía, había, era) for how things were or what used to happen.', example: 'En la Edad Media, mucha gente vivía en el campo.' },
  { id: 'ser-estar', level: 'A2', label: 'ser and estar', instruction: 'Use ser for what something is or is made of, and estar for where it is or a state it is in.', example: 'El puente es de piedra y está cerrado por obras.' },
  { id: 'comparatives', level: 'A2', label: 'Comparisons with más … que', instruction: 'Compare two things the page gives facts for with más … que, menos … que or tan … como.', example: 'El Nilo es más largo que el Amazonas.' },
  { id: 'superlatives', level: 'A2', label: 'The superlative', instruction: 'Use a superlative (el más alto, la más grande) only where the page says something is the most or least.', example: 'El Teide es la montaña más alta de España.' },
  { id: 'reflexive', level: 'A2', label: 'Reflexive verbs', instruction: 'Use reflexive verbs with se (se llama, se encuentra, se alimenta) for what things are called, where they are, or what they do.', example: 'El río se llama Ebro y se encuentra en el norte.' },
  { id: 'poder', level: 'A2', label: 'poder, deber, tener que', instruction: 'Use poder, deber or tener que with an infinitive for what things can or must do.', example: 'Los pingüinos no pueden volar, pero nadan muy bien.' },
  { id: 'porque', level: 'A2', label: 'porque and que', instruction: 'Join facts with porque or que.', example: 'Muchos animales duermen en invierno porque no hay comida.' },
  // B1
  { id: 'relative', level: 'B1', label: 'Relative clauses with que and donde', instruction: 'Join facts with que, donde or el que, la que.', example: 'El río que pasa por Sevilla se llama Guadalquivir.' },
  { id: 'passive', level: 'B1', label: 'The passive with ser', instruction: 'Use ser + participle, agreeing with its subject (fue construido, fueron descubiertas), for things that were made, found or built.', example: 'La catedral fue construida en el siglo XIII.' },
  { id: 'se-passive', level: 'B1', label: 'The passive with se', instruction: 'Use se for what is generally done (se habla, se cultiva, se producen).', example: 'En La Rioja se produce mucho vino.' },
  { id: 'perfect', level: 'B1', label: 'The present perfect', instruction: 'Use haber + participle (ha crecido, han encontrado) for recent events or changes the page reports.', example: 'La ciudad ha crecido mucho en los últimos años.' },
  { id: 'future', level: 'B1', label: 'The future', instruction: 'Use the future (abrirá, serán) or ir a + infinitive for what the page says will happen, or in a line to the reader.', example: 'El año que viene el museo abrirá una nueva sala.' },
  { id: 'conditional', level: 'B1', label: 'The conditional', instruction: 'Use the conditional (te gustaría, podrías, sería) in a line to the reader, a reaction or a dialogue.', example: '¿Te gustaría ver estas montañas?' },
  { id: 'para', level: 'B1', label: 'por and para', instruction: 'Use para for purpose and destination, and por for cause, means and through a place.', example: 'Los barcos pasan por el canal para llegar al océano.' },
  { id: 'cuando', level: 'B1', label: 'cuando and si', instruction: 'Use cuando for when and si for if, with the indicative.', example: 'Cuando el volcán entró en erupción, la gente huyó al mar.' },
  // B2
  { id: 'subjunctive', level: 'B2', label: 'The present subjunctive', instruction: 'Use the present subjunctive after para que, es importante que or es posible que.', example: 'Es importante que los bosques se protejan.' },
  { id: 'imperfect-subj', level: 'B2', label: 'The imperfect subjunctive', instruction: 'Use the imperfect subjunctive after a past verb of wanting, ordering or purpose (para que pudieran, ordenó que construyeran).', example: 'El rey ordenó que construyeran un puente nuevo.' },
  { id: 'reported', level: 'B2', label: 'Reported speech', instruction: 'Report what the page says people or sources state with que, keeping the tense they used.', example: 'Los científicos afirman que el lago tiene más de un millón de años.' },
  { id: 'connectors', level: 'B2', label: 'Contrast: aunque, sin embargo, mientras que', instruction: 'Contrast two facts the page gives with aunque, sin embargo or mientras que.', example: 'El desierto es muy seco; sin embargo, allí crecen plantas.' },
  { id: 'gerund', level: 'B2', label: 'estar and seguir + gerund', instruction: 'Use estar or seguir + gerund (está creciendo, sigue funcionando) for what is going on or still goes on.', example: 'El puerto sigue funcionando después de dos siglos.' },
  { id: 'cuyo', level: 'B2', label: 'cuyo, cuya (whose)', instruction: 'Use cuyo, cuya, cuyos, cuyas for whose, agreeing with what is owned.', example: 'Es un animal cuya cola es muy larga.' },
  { id: 'cuanto-mas', level: 'B2', label: 'cuanto más … más', instruction: 'Link two facts with cuanto más … más or tanto … como.', example: 'Cuanto más alto se sube, más frío hace.' },
];
