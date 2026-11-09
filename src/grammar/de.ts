import type { GrammarPoint } from './types';

// For webpage passages: each point must fit true facts about any page (third person, the page's tenses),
// or a format's questions and reactions. Lessons bring their own points (`src/syllabus/`).
export const deGrammar: GrammarPoint[] = [
  // A1
  { id: 'sein-haben', level: 'A1', label: 'sein and haben in the present', instruction: 'Use sein and haben in the present (er ist, sie hat, sie sind, sie haben) to say what things are and have.', example: 'Der See ist groß und hat drei Inseln.' },
  { id: 'articles', level: 'A1', label: 'der, die, das / ein, eine', instruction: 'Use definite and indefinite articles with the right gender (der, die, das, ein, eine).', example: 'Das Dorf hat eine Kirche und ein Museum.' },
  { id: 'plurals', level: 'A1', label: 'Noun plurals', instruction: 'Use nouns in the plural with die, with their plural endings and umlauts (die Häuser, die Straßen, die Bäume).', example: 'Die Häuser sind weiß und die Straßen sind eng.' },
  { id: 'nicht-kein', level: 'A1', label: 'nicht and kein', instruction: 'Use kein before a noun and nicht for the rest, for something the page says is not so.', example: 'Diese Schlange ist nicht gefährlich. Sie hat kein Gift.' },
  { id: 'es-gibt', level: 'A1', label: 'es gibt', instruction: 'Use es gibt + accusative to say what is in a place or how many there are.', example: 'In der Stadt gibt es einen Fluss und zwei Brücken.' },
  { id: 'present', level: 'A1', label: 'Regular verbs in the present', instruction: 'Use regular verbs in the present (er wohnt, sie spielen, man findet) for general facts.', example: 'Viele Menschen wohnen in der Altstadt.' },
  { id: 'questions', level: 'A1', label: 'W-questions and yes/no questions', instruction: 'Ask questions with wo, wann, wie viele, wer or the verb first, in a line where a question fits (a heading, a quiz, an interview, a reaction).', example: 'Wo beginnt der Fluss?' },
  { id: 'verb-second', level: 'A1', label: 'The verb in second place', instruction: 'Start some sentences with a time or place, keeping the verb in second place (Im Winter schneit es…).', example: 'Im Winter schneit es oft in den Bergen.' },
  { id: 'accusative', level: 'A1', label: 'The accusative (den, einen)', instruction: 'Use the accusative for the object of a verb (den, einen, keinen for masculine nouns).', example: 'Der Bär sucht einen Platz für den Winter.' },
  // A2
  { id: 'perfekt-haben', level: 'A2', label: 'Perfekt with haben', instruction: 'Use the Perfekt with haben for completed past events the page dates or describes.', example: 'Die Römer haben hier eine Brücke gebaut.' },
  { id: 'perfekt-sein', level: 'A2', label: 'Perfekt with sein', instruction: 'Use the Perfekt with sein for movement and change (gehen, fahren, kommen, werden, sterben).', example: 'Sie ist 1938 nach London gegangen.' },
  { id: 'dative', level: 'A2', label: 'The dative after mit, von, bei, aus, nach, zu', instruction: 'Use the dative after mit, von, bei, aus, nach and zu (dem, der, den + -n; zum, zur, vom, beim).', example: 'Die Forscher fahren mit dem Boot zur Insel.' },
  { id: 'comparatives', level: 'A2', label: 'Comparative with als', instruction: 'Compare two things the page gives facts for with the comparative + als, or so … wie.', example: 'Der Nil ist länger als der Amazonas.' },
  { id: 'superlatives', level: 'A2', label: 'Superlative (am größten, der größte)', instruction: 'Use a superlative only where the page says something is the most or least.', example: 'Die Zugspitze ist der höchste Berg Deutschlands.' },
  { id: 'modals', level: 'A2', label: 'Modal verbs', instruction: 'Use können, müssen, dürfen or wollen with an infinitive at the end, for what things can or must do.', example: 'Pinguine können nicht fliegen, aber sie können gut schwimmen.' },
  { id: 'weil-dass', level: 'A2', label: 'weil and dass', instruction: 'Join facts with weil or dass, with the verb at the end of the clause.', example: 'Die Tiere schlafen im Winter, weil es kalt ist.' },
  { id: 'war-hatte', level: 'A2', label: 'war and hatte', instruction: 'Use war and hatte to describe how things were in the past.', example: 'Früher war die Stadt klein und hatte nur einen Hafen.' },
  { id: 'adjective-endings', level: 'A2', label: 'Adjective endings', instruction: 'Use adjectives before nouns with their endings after der-words and ein-words (der alte Turm, ein kleiner Fluss).', example: 'Ein kleiner Fluss fließt durch das alte Dorf.' },
  // B1
  { id: 'praeteritum', level: 'B1', label: 'Präteritum', instruction: 'Use the Präteritum for past events, as written texts do (begann, dauerte, kam).', example: 'Der Krieg begann 1914 und dauerte vier Jahre.' },
  { id: 'relatives', level: 'B1', label: 'Relative clauses', instruction: 'Join facts with relative pronouns (der, die, das, den, dem), with the verb at the end.', example: 'Der Fluss, der durch die Stadt fließt, heißt Spree.' },
  { id: 'passive', level: 'B1', label: 'The passive with werden', instruction: 'Use the passive (werden + past participle, von for the doer) for things that are or were made, found or built.', example: 'Der Turm wurde 1889 von Gustave Eiffel gebaut.' },
  { id: 'futur', level: 'B1', label: 'Futur I with werden', instruction: 'Use werden + infinitive for what the page says will happen, or in a line to the reader.', example: 'Die Stadt wird bald einen neuen Bahnhof bauen.' },
  { id: 'konjunktiv-ii', level: 'B1', label: 'Konjunktiv II (würde, könnte, wäre)', instruction: 'Use würde, könnte, hätte or wäre in a line to the reader, a reaction or a dialogue.', example: 'Würdest du diese Berge gern sehen?' },
  { id: 'genitive', level: 'B1', label: 'The genitive', instruction: 'Use the genitive for what belongs to something (des Landes, der Stadt).', example: 'Die Hauptstadt des Landes liegt am Meer.' },
  { id: 'als-wenn', level: 'B1', label: 'als and wenn in the past', instruction: 'Use als for one past event and wenn for something that happened again and again.', example: 'Als der Vulkan ausbrach, flohen die Menschen ans Meer.' },
  { id: 'um-zu', level: 'B1', label: 'um … zu', instruction: 'Say why something is done with um … zu + infinitive.', example: 'Die Vögel fliegen nach Süden, um Futter zu finden.' },
  // B2
  { id: 'plusquamperfekt', level: 'B2', label: 'Plusquamperfekt', instruction: 'Use the Plusquamperfekt for an event that came before another past event on the page.', example: 'Als der Krieg begann, hatte man die Brücke schon zerstört.' },
  { id: 'passive-modals', level: 'B2', label: 'The passive with modal verbs', instruction: 'Use a modal verb with the passive infinitive (kann … erreicht werden, muss … geschützt werden).', example: 'Der Gipfel kann nur zu Fuß erreicht werden.' },
  { id: 'konjunktiv-i', level: 'B2', label: 'Konjunktiv I for reported speech', instruction: 'Report what the page says people or sources state with Konjunktiv I (sei, habe, könne).', example: 'Forscher sagen, der See sei über eine Million Jahre alt.' },
  { id: 'connectors', level: 'B2', label: 'Contrast: obwohl, trotzdem, während', instruction: 'Contrast two facts the page gives with obwohl, trotzdem or während.', example: 'Die Wüste ist sehr trocken, trotzdem wachsen dort Pflanzen.' },
  { id: 'participle-attributes', level: 'B2', label: 'Participles before nouns', instruction: 'Use an extended participle before a noun (der 1889 gebaute Turm, die stark wachsende Stadt).', example: 'Der 1889 gebaute Turm ist 330 Meter hoch.' },
  { id: 'dessen-deren', level: 'B2', label: 'dessen and deren', instruction: 'Use the relative pronouns dessen and deren for whose.', example: 'Das ist ein Tier, dessen Schwanz sehr lang ist.' },
  { id: 'je-desto', level: 'B2', label: 'Two-part connectors', instruction: 'Link two facts with je … desto, sowohl … als auch or weder … noch.', example: 'Je höher man steigt, desto kälter wird es.' },
];
