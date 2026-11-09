import type { GrammarPoint } from './types';

// For webpage passages: each point must fit true facts about any page (third person, the page's tenses),
// or a format's questions and reactions. Lessons bring their own points (`src/syllabus/`).
export const itGrammar: GrammarPoint[] = [
  // A1
  { id: 'essere', level: 'A1', label: 'essere in the present', instruction: 'Use essere in the present (è, sono) to say what things are and what they are like.', example: 'Il fiume è lungo e le montagne sono alte.' },
  { id: 'ce', level: 'A1', label: 'c’è and ci sono (there is, there are)', instruction: 'Use c’è and ci sono to say what there is in a place.', example: 'Sull’isola ci sono due spiagge e c’è un faro.' },
  { id: 'gender', level: 'A1', label: 'Articles and adjectives that agree', instruction: 'Use il, lo, l’, la, i, gli, le and un, uno, una, un’, with adjectives that agree with their noun’s gender and number (un castello antico, una città grande, gli edifici bianchi).', example: 'Siena è una città antica con strade strette.' },
  { id: 'avere', level: 'A1', label: 'avere (to have)', instruction: 'Use avere in the present (ha, hanno) to say what things have.', example: 'Il gatto ha la coda lunga.' },
  { id: 'present', level: 'A1', label: 'Regular verbs in the present', instruction: 'Use regular -are, -ere and -ire verbs in the present (abita, abitano, vive, vivono, parte, partono) for general facts.', example: 'L’orso polare vive nell’Artico e mangia le foche.' },
  { id: 'negation', level: 'A1', label: 'Negation with non', instruction: 'Put non before the verb for something the page says is not so.', example: 'Questo serpente non è pericoloso e non ha veleno.' },
  { id: 'prepositions', level: 'A1', label: 'Prepositions joined to the article', instruction: 'Join di, a, da, in and su to the article (del, al, dal, nel, sul, della, nella, sull’) to say where things are and what they belong to.', example: 'La torre è nel centro della città.' },
  { id: 'questions', level: 'A1', label: 'Questions with che cosa, chi, dove, quando, quanti', instruction: 'Ask questions with che cosa, chi, dove, quando or quanti, in a line where a question fits (a heading, a quiz, an interview, a reaction).', example: 'Dove nasce il fiume?' },
  // A2
  { id: 'passato-avere', level: 'A2', label: 'The passato prossimo with avere', instruction: 'Use the passato prossimo with avere (ha fondato, hanno costruito, ha scoperto) for completed past events the page describes.', example: 'Cristoforo Colombo ha raggiunto l’America nel 1492.' },
  { id: 'passato-essere', level: 'A2', label: 'The passato prossimo with essere', instruction: 'Use the passato prossimo with essere for verbs of movement and change (è nato, sono arrivati, è diventata), the participle agreeing with the subject.', example: 'Leonardo da Vinci è nato nel 1452.' },
  { id: 'imperfetto', level: 'A2', label: 'The imperfetto', instruction: 'Use the imperfetto (viveva, c’era, era) for how things were or what used to happen.', example: 'Nel Medioevo molte persone vivevano in campagna.' },
  { id: 'comparatives', level: 'A2', label: 'Comparisons with più … di', instruction: 'Compare two things the page gives facts for with più … di, meno … di or (così) … come.', example: 'Il Nilo è più lungo del Po.' },
  { id: 'superlatives', level: 'A2', label: 'The superlative', instruction: 'Use a superlative (il più alto, la più grande) only where the page says something is the most or least.', example: 'Il Po è il fiume più lungo d’Italia.' },
  { id: 'reflexive', level: 'A2', label: 'Reflexive verbs', instruction: 'Use reflexive verbs with si (si chiama, si trova, si nutre) for what things are called, where they are, or what they do.', example: 'Il fiume si chiama Arno e si trova in Toscana.' },
  { id: 'modals', level: 'A2', label: 'potere, dovere, volere', instruction: 'Use potere, dovere or volere with an infinitive for what things can, must or want to do.', example: 'I pinguini non possono volare, ma nuotano molto bene.' },
  { id: 'perche', level: 'A2', label: 'perché and che', instruction: 'Join facts with perché or che.', example: 'Molti animali dormono in inverno perché non c’è cibo.' },
  // B1
  { id: 'relative', level: 'B1', label: 'Relative clauses with che, dove and cui', instruction: 'Join facts with che, dove, or cui after a preposition (in cui, di cui, con cui).', example: 'Il fiume che attraversa Firenze si chiama Arno.' },
  { id: 'passive', level: 'B1', label: 'The passive with essere and venire', instruction: 'Use essere or venire + participle, agreeing with its subject (è stato costruito, venne fondata, furono scoperte), for things that were made, found or built.', example: 'Il Colosseo è stato costruito nel I secolo d.C.' },
  { id: 'si-passive', level: 'B1', label: 'The passive with si', instruction: 'Use si for what is generally done (si parla, si coltiva, si producono).', example: 'In Piemonte si produce molto vino.' },
  { id: 'remoto', level: 'B1', label: 'The passato remoto', instruction: 'Use the passato remoto (fondò, costruirono, nacque) for history long past, as Italian books and encyclopaedias tell it.', example: 'Giuseppe Garibaldi nacque a Nizza nel 1807.' },
  { id: 'future', level: 'B1', label: 'The future', instruction: 'Use the future (aprirà, saranno) for what the page says will happen, or in a line to the reader.', example: 'L’anno prossimo il museo aprirà una nuova sala.' },
  { id: 'conditional', level: 'B1', label: 'The conditional', instruction: 'Use the conditional (ti piacerebbe, potresti, sarebbe) in a line to the reader, a reaction or a dialogue.', example: 'Ti piacerebbe vedere queste montagne?' },
  { id: 'ne', level: 'B1', label: 'ne for some of them', instruction: 'Use ne for a number or part of something already named (ne descrive tre, ne restano pochi).', example: 'Nella regione ci sono molti castelli e la guida ne descrive tre.' },
  { id: 'quando', level: 'B1', label: 'quando and se', instruction: 'Use quando for when and se for if, with the indicative.', example: 'Quando il vulcano eruttò, la gente fuggì verso il mare.' },
  // B2
  { id: 'subjunctive', level: 'B2', label: 'The present subjunctive', instruction: 'Use the present subjunctive after è importante che, è possibile che, sebbene or affinché.', example: 'È importante che le foreste siano protette.' },
  { id: 'imperfect-subj', level: 'B2', label: 'The imperfect subjunctive', instruction: 'Use the imperfect subjunctive after a past verb of wanting, ordering or purpose (affinché potessero, ordinò che costruissero).', example: 'Il re ordinò che costruissero un nuovo ponte.' },
  { id: 'reported', level: 'B2', label: 'Reported speech', instruction: 'Report what the page says people or sources state with che, keeping the tense they used.', example: 'Gli scienziati affermano che il lago ha più di un milione di anni.' },
  { id: 'connectors', level: 'B2', label: 'Contrast: tuttavia, mentre, sebbene', instruction: 'Contrast two facts the page gives with tuttavia, mentre, or sebbene with the subjunctive.', example: 'Il deserto è molto secco; tuttavia, lì crescono alcune piante.' },
  { id: 'gerund', level: 'B2', label: 'stare + gerund and continuare a', instruction: 'Use stare + gerund (sta crescendo) for what is going on, and continuare a + infinitive (continua a funzionare) for what still goes on.', example: 'Il porto continua a funzionare dopo due secoli.' },
  { id: 'il-cui', level: 'B2', label: 'il cui, la cui (whose)', instruction: 'Use il cui, la cui, i cui, le cui for whose, the article agreeing with what is owned.', example: 'È un animale la cui coda è molto lunga.' },
  { id: 'gerund-clause', level: 'B2', label: 'The gerund for how and while', instruction: 'Use a gerund (attraversando, essendo, scendendo) for how something happens or what goes on at the same time, its subject the same as the main verb’s.', example: 'Scendendo dalle Alpi, il fiume diventa più largo.' },
];
