import type { GrammarPoint } from './types';

// For webpage passages: each point must fit true facts about any page (third person, the page's tenses),
// or a format's questions and reactions. Lessons bring their own points (`src/syllabus/`).
export const gdGrammar: GrammarPoint[] = [
  // A1
  { id: 'tha', level: 'A1', label: 'tha and chan eil', instruction: 'Use tha and chan eil with an adjective or a place to say what things are like and where they are.', example: 'Tha an loch mòr, ach chan eil e domhainn.' },
  { id: 'copula', level: 'A1', label: '’S e … a th’ ann', instruction: 'Use ’S e … a th’ ann (or ’S e … a th’ ann an X) to say what something is.', example: '’S e baile mòr a th’ ann an Glaschu.' },
  { id: 'article', level: 'A1', label: 'The article: an, am, an t-, a’', instruction: 'Use the article in the form the noun’s gender and first letter need (an cù, am bàta, an t-eilean, a’ chaileag, an t-sràid).', example: 'Tha an t-eilean beag, ach tha am bàta mòr.' },
  { id: 'adjectives', level: 'A1', label: 'Adjectives after the noun', instruction: 'Put adjectives after their noun, lenited after a feminine noun (caisteal mòr, eaglais bheag).', example: 'Tha caisteal mòr agus eaglais bheag anns a’ bhaile.' },
  { id: 'plurals', level: 'A1', label: 'Plurals with na', instruction: 'Use nouns in the plural with na (na taighean, na sràidean, na h-eileanan), and a plain adjective after tha.', example: 'Tha na taighean geal agus tha na sràidean cumhang.' },
  { id: 'ann-an', level: 'A1', label: 'ann an and anns an', instruction: 'Say where things are with ann an (ann am before b, f, m, p) for a name, and anns an or anns a’ with the article.', example: 'Tha mòran thaighean-tasgaidh ann an Dùn Èideann.' },
  { id: 'aig', level: 'A1', label: 'Having with aig', instruction: 'Say what things have with tha … aig (Tha earball fada aig an t-sionnach).', example: 'Tha earball fada aig an t-sionnach.' },
  { id: 'questions', level: 'A1', label: 'Questions with a bheil and question words', instruction: 'Ask questions with a bheil, càite a bheil, cò, dè or cia mheud, in a line where a question fits (a heading, a quiz, an interview, a reaction).', example: 'Càite a bheil an abhainn a’ tòiseachadh?' },
  // A2
  { id: 'past', level: 'A2', label: 'The past tense', instruction: 'Use the past tense, the verb lenited (thog, chuir; dh’ before a vowel or f), for completed events the page dates or describes.', example: 'Thog na Ròmanaich balla tarsainn na dùthcha.' },
  { id: 'past-irregular', level: 'A2', label: 'Irregular verbs in the past', instruction: 'Use the irregular pasts (chaidh, thàinig, rinn, chunnaic, fhuair, thug) for completed events.', example: 'Thàinig na Lochlannaich gu na h-eileanan air bàtaichean fada.' },
  { id: 'bha', level: 'A2', label: 'bha and cha robh', instruction: 'Use bha and cha robh to describe how things were in the past.', example: 'Bha am baile beag, agus cha robh ach aon chidhe ann.' },
  { id: 'progressive', level: 'A2', label: 'tha + a’ + verbal noun', instruction: 'Use tha with a’ or ag and a verbal noun for what things are doing (a’ sruthadh, a’ fàs, ag itealaich).', example: 'Tha an abhainn a’ sruthadh tron bhaile.' },
  { id: 'bidh', level: 'A2', label: 'bidh for what usually happens', instruction: 'Use bidh with a verbal noun for what happens again and again, or every year.', example: 'Bidh na h-eòin a’ falbh gu deas as t-fhoghar.' },
  { id: 'comparatives', level: 'A2', label: 'The comparative: nas … na', instruction: 'Compare two things the page gives facts for with nas and the comparative form, then na (nas àirde na, nas motha na).', example: 'Tha Beinn Nibheis nas àirde na Beinn Laomainn.' },
  { id: 'superlatives', level: 'A2', label: 'The superlative with as', instruction: 'Use as with the comparative form only where the page says something is the most or least.', example: '’S e Beinn Nibheis a’ bheinn as àirde ann am Breatainn.' },
  { id: 'genitive', level: 'A2', label: 'The genitive with the article', instruction: 'Say what belongs to something with the second noun in the genitive (mullach na beinne, meadhan a’ bhaile), with no article on the first.', example: 'Tha mullach na beinne fuar fiù ’s as t-samhradh.' },
  { id: 'urrainn', level: 'A2', label: 'Is urrainn do (can)', instruction: 'Use is urrainn do and chan urrainn do for what things can or can’t do.', example: 'Chan urrainn do struthan itealaich, ach is urrainn dhaibh ruith gu luath.' },
  // B1
  { id: 'relatives', level: 'B1', label: 'Relative clauses with a and nach', instruction: 'Join facts with a (who, which, that) and the independent form of the verb, or nach for not.', example: '’S i Cluaidh an abhainn a tha a’ sruthadh tro Ghlaschu.' },
  { id: 'passive', level: 'B1', label: 'The passive with chaidh', instruction: 'Use chaidh + a + verbal noun for things that were made, found or built.', example: 'Chaidh Pàrlamaid na h-Alba fhosgladh ann an 1999.' },
  { id: 'perfect', level: 'B1', label: 'The perfect with air', instruction: 'Use tha … air + verbal noun for what has happened and still holds.', example: 'Tha an sneachda air leaghadh air na beanntan.' },
  { id: 'gu-bheil', level: 'B1', label: 'gu bheil and nach eil', instruction: 'Report what the page says people think or know with gu bheil, gun robh or nach eil.', example: 'Tha luchd-saidheans ag ràdh gu bheil an loch glè dhomhainn.' },
  { id: 'nuair-a', level: 'B1', label: 'nuair a in the past', instruction: 'Join two past events with nuair a and the independent form of the verb.', example: 'Nuair a spreadh a’ bheinn-theine, theich na daoine chun na mara.' },
  { id: 'gus', level: 'B1', label: 'gus for purpose', instruction: 'Say why something is done with gus + verbal noun, the object first and lenited (gus biadh a lorg).', example: 'Bidh na h-eòin a’ falbh gu deas gus biadh a lorg.' },
  { id: 'conditional', level: 'B1', label: 'The conditional (bhiodh, am bu toil leat)', instruction: 'Use the conditional (bhiodh, dh’fhaodadh, am bu toil leat) in a line to the reader, a reaction or a dialogue.', example: 'Am bu toil leat na beanntan seo fhaicinn?' },
  { id: 'verbal-noun-object', level: 'B1', label: 'A verbal noun with its object in the genitive', instruction: 'Put the object of a verbal noun in the genitive (a’ togail thaighean, ag ionnsachadh na Gàidhlig).', example: 'Tha iad a’ togail thaighean ùra faisg air a’ chladach.' },
  // B2
  { id: 'pluperfect', level: 'B2', label: 'bha … air for what had happened', instruction: 'Use bha … air + verbal noun for an event that came before another past event on the page.', example: 'Bha an drochaid air tuiteam mus deach an rathad ùr a thogail.' },
  { id: 'stative-passive', level: 'B2', label: 'tha … air a + verbal noun', instruction: 'Use tha … air a (or air an) + verbal noun for the state something is in (air a thogail, air a chuairteachadh).', example: 'Tha an loch air a chuairteachadh le beanntan.' },
  { id: 'reported', level: 'B2', label: 'Reported speech with gun robh and gum biodh', instruction: 'Report what people or sources said with thuirt … gun robh, gum biodh or nach robh.', example: 'Thuirt an luchd-rannsachaidh gun robh an loch glè shean.' },
  { id: 'ged-a', level: 'B2', label: 'Contrast with ged a', instruction: 'Contrast two facts the page gives with ged a, a dh’aindeoin sin or ach.', example: 'Ged a tha am fàsach glè thioram, tha lusan a’ fàs ann.' },
  { id: 'impersonal', level: 'B2', label: 'Impersonal forms (-ear, thathar)', instruction: 'Use the impersonal forms (cluinnear, chithear, thathar ag ràdh) for what people in general do or say.', example: 'Cluinnear Gàidhlig gach latha anns na h-Eileanan Siar.' },
  { id: 'fronting', level: 'B2', label: 'Fronting with ’s ann', instruction: 'Put a time, place or reason first with ’s ann … a to stress it.', example: '’S ann ann an Dùn Èideann a tha Pàrlamaid na h-Alba.' },
  { id: 'feumar', level: 'B2', label: 'feumar and faodar', instruction: 'Use feumar and faodar + a + verbal noun for what must or may be done.', example: 'Feumar a’ choille a dhìon.' },
];
