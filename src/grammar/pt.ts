import type { GrammarPoint } from './types';

// For webpage passages: each point must fit true facts about any page (third person, the page's tenses),
// or a format's questions and reactions. Lessons bring their own points (`src/syllabus/`).
export const ptGrammar: GrammarPoint[] = [
  // A1
  { id: 'ser', level: 'A1', label: 'ser in the present', instruction: 'Use ser in the present (é, são) to say what things are and what they are like.', example: 'O rio é longo e as montanhas são altas.' },
  { id: 'ficar', level: 'A1', label: 'ficar and estar for where things are', instruction: 'Use ficar (fica, ficam) for where a place or building is, and estar (está, estão) for where something movable is now.', example: 'Brasília fica no centro do Brasil.' },
  { id: 'gender', level: 'A1', label: 'Gender and adjectives that agree', instruction: 'Use o or a, um or uma, and adjectives that agree with their noun’s gender and number (um castelo antigo, uma cidade grande, umas casas brancas).', example: 'Ouro Preto é uma cidade antiga com ruas estreitas.' },
  { id: 'contractions', level: 'A1', label: 'do, da, no, na', instruction: 'Join de and em with the article (do, da, dos, das; no, na, nos, nas) to say whose something is or where it is.', example: 'A capital do estado fica no litoral.' },
  { id: 'ter', level: 'A1', label: 'ter and há', instruction: 'Use ter in the present (tem, têm) for what things have, and há for what there is in a place.', example: 'Na ilha há duas praias, e o gato tem o rabo longo.' },
  { id: 'present', level: 'A1', label: 'Regular verbs in the present', instruction: 'Use regular -ar, -er and -ir verbs in the present (vive, vivem, come, comem, fala, falam) for general facts.', example: 'O urso-polar vive no Ártico e come focas.' },
  { id: 'negation', level: 'A1', label: 'Negation with não', instruction: 'Put não before the verb for something the page says is not so.', example: 'Esta cobra não é perigosa e não tem veneno.' },
  { id: 'questions', level: 'A1', label: 'Questions with o que, onde, quando, quantos', instruction: 'Ask questions with o que, quem, onde, quando or quantos in a line where a question fits (a heading, a quiz, an interview, a reaction).', example: 'Onde nasce o rio?' },
  // A2
  { id: 'preterite', level: 'A2', label: 'The preterite', instruction: 'Use the pretérito perfeito (fundou, construíram, descobriu) for completed past events the page describes.', example: 'Pedro Álvares Cabral chegou ao Brasil em 1500.' },
  { id: 'imperfect', level: 'A2', label: 'The imperfect', instruction: 'Use the imperfect (vivia, havia, era) for how things were or what used to happen.', example: 'No século XIX, muita gente vivia no campo.' },
  { id: 'ser-estar', level: 'A2', label: 'ser and estar', instruction: 'Use ser for what something is or is made of, and estar for a state it is in for now.', example: 'A ponte é de pedra e está fechada para obras.' },
  { id: 'comparatives', level: 'A2', label: 'Comparisons with mais … do que', instruction: 'Compare two things the page gives facts for with mais … (do) que, menos … (do) que or tão … quanto.', example: 'O Brasil é maior do que a Argentina.' },
  { id: 'superlatives', level: 'A2', label: 'The superlative', instruction: 'Use a superlative (o mais alto, a maior) only where the page says something is the most or least.', example: 'O Pico da Neblina é a montanha mais alta do Brasil.' },
  { id: 'reflexive', level: 'A2', label: 'Verbs with se', instruction: 'Use verbs with se before them, as Brazilians write it (se chama, se encontra, se alimenta), for what things are called, where they are, or what they do.', example: 'O rio que corta São Paulo se chama Tietê.' },
  { id: 'poder', level: 'A2', label: 'poder, dever, ter que', instruction: 'Use poder, dever or ter que with an infinitive for what things can or must do.', example: 'Os pinguins não podem voar, mas nadam muito bem.' },
  { id: 'gerund', level: 'A2', label: 'estar + gerund', instruction: 'Use estar + gerund (está crescendo, estão chegando) for what is going on now.', example: 'O nível do mar está subindo.' },
  { id: 'porque', level: 'A2', label: 'porque and que', instruction: 'Join facts with porque or que.', example: 'Muitos animais dormem no inverno porque não há comida.' },
  // B1
  { id: 'relative', level: 'B1', label: 'Relative clauses with que and onde', instruction: 'Join facts with que, onde or o qual, a qual.', example: 'A cidade onde fica o Pão de Açúcar é o Rio de Janeiro.' },
  { id: 'passive', level: 'B1', label: 'The passive with ser', instruction: 'Use ser + participle, agreeing with its subject (foi construída, foram descobertos), for things that were made, found or built.', example: 'Brasília foi inaugurada em 1960.' },
  { id: 'se-passive', level: 'B1', label: 'The passive with se', instruction: 'Use se for what is generally done (se fala, se planta, se produz).', example: 'No Brasil se produz muito café.' },
  { id: 'perfect', level: 'B1', label: 'tem + participle', instruction: 'Use ter + participle (tem crescido, têm aumentado) for what has been going on again and again up to now, never for a single event.', example: 'A cidade tem crescido muito nos últimos anos.' },
  { id: 'future', level: 'B1', label: 'The future', instruction: 'Use ir + infinitive (vai abrir, vão ser) or the future (abrirá, serão) for what the page says will happen, or in a line to the reader.', example: 'No ano que vem, o museu vai abrir uma nova sala.' },
  { id: 'conditional', level: 'B1', label: 'The conditional', instruction: 'Use the conditional (gostaria, poderia, seria) in a line to the reader, a reaction or a dialogue.', example: 'Você gostaria de ver estas montanhas?' },
  { id: 'para', level: 'B1', label: 'por and para', instruction: 'Use para for purpose and destination, and por (pelo, pela) for cause, means and through a place.', example: 'Os navios passam pelo canal para chegar ao oceano.' },
  { id: 'quando', level: 'B1', label: 'quando in the past', instruction: 'Use quando with the preterite for one event and with the imperfect for a scene.', example: 'Quando o vulcão entrou em erupção, as pessoas fugiram para o mar.' },
  // B2
  { id: 'subjunctive', level: 'B2', label: 'The present subjunctive', instruction: 'Use the present subjunctive after para que, é importante que or é possível que.', example: 'É importante que as florestas sejam protegidas.' },
  { id: 'imperfect-subj', level: 'B2', label: 'The imperfect subjunctive', instruction: 'Use the imperfect subjunctive after a past verb of wanting, ordering or purpose (para que pudessem, mandou que construíssem).', example: 'O rei mandou que construíssem uma ponte nova.' },
  { id: 'future-subj', level: 'B2', label: 'The future subjunctive', instruction: 'Use the future subjunctive after se or quando for what may happen (se chover, quando houver, se você for), in a fact the page gives or a line to the reader.', example: 'Se você for ao Rio, suba o Corcovado.' },
  { id: 'personal-inf', level: 'B2', label: 'The personal infinitive', instruction: 'Use the personal infinitive after para, antes de or depois de when the subject is plural (para fugirem, antes de chegarem).', example: 'Muitas aves voam para o norte para fugirem do frio.' },
  { id: 'reported', level: 'B2', label: 'Reported speech', instruction: 'Report what the page says people or sources state with que, keeping the tense they used.', example: 'Os cientistas afirmam que o lago tem mais de um milhão de anos.' },
  { id: 'connectors', level: 'B2', label: 'Contrast: embora, no entanto, enquanto', instruction: 'Contrast two facts the page gives with embora (and the subjunctive), no entanto or enquanto.', example: 'O deserto é muito seco; no entanto, lá crescem plantas.' },
  { id: 'cujo', level: 'B2', label: 'cujo, cuja (whose)', instruction: 'Use cujo, cuja, cujos, cujas for whose, agreeing with what is owned.', example: 'É um animal cujo rabo é muito longo.' },
  { id: 'quanto-mais', level: 'B2', label: 'quanto mais … mais', instruction: 'Link two facts with quanto mais … mais or tanto … quanto.', example: 'Quanto mais alto se sobe, mais frio faz.' },
];
