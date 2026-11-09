import type { BankEntry } from '../bank';
import { numberEntries } from './numbers';

// Tier 1: the lesson's own phrases. Sent to the model so register and
// punctuation fit the sentence.
const phrases: BankEntry[] = [
  { id: 'hello', tier: 1, category: 'greetings', english: 'hello', french: 'bonjour', lemmas: ['bonjour'], pos: 'phrase', gloss: 'hello' },
  { id: 'hi', tier: 1, category: 'greetings', english: 'hi|hey', french: 'salut', lemmas: ['salut'], pos: 'phrase', gloss: 'hi', hint: 'only as a greeting' },
  { id: 'good-morning', tier: 1, category: 'greetings', english: 'good (?:morning|afternoon|day)', french: 'bonjour', lemmas: ['bonjour'], pos: 'phrase', gloss: 'good morning' },
  { id: 'good-evening', tier: 1, category: 'greetings', english: 'good evening', french: 'bonsoir', lemmas: ['bonsoir'], pos: 'phrase', gloss: 'good evening' },
  { id: 'good-night', tier: 1, category: 'greetings', english: 'good ?night', french: 'bonne nuit', lemmas: ['bonne nuit'], pos: 'phrase', gloss: 'good night' },
  { id: 'goodbye', tier: 1, category: 'greetings', english: 'good-?bye|farewell', french: 'au revoir', lemmas: ['au revoir', 'adieu'], pos: 'phrase', gloss: 'goodbye' },
  { id: 'bye', tier: 1, category: 'greetings', english: 'bye(?:-bye)?', french: 'salut', lemmas: ['salut', 'au revoir'], pos: 'phrase', gloss: 'bye', hint: 'only as a farewell' },
  { id: 'see-you-soon', tier: 1, category: 'greetings', english: 'see you soon', french: 'à bientôt', lemmas: ['à bientôt'], pos: 'phrase', gloss: 'see you soon' },
  { id: 'see-you-later', tier: 1, category: 'greetings', english: 'see you later', french: 'à plus tard', lemmas: ['à plus tard', 'à plus'], pos: 'phrase', gloss: 'see you later' },
  { id: 'see-you-tomorrow', tier: 1, category: 'greetings', english: 'see you tomorrow', french: 'à demain', lemmas: ['à demain'], pos: 'phrase', gloss: 'see you tomorrow' },
  { id: 'welcome', tier: 1, category: 'greetings', english: 'welcome', french: 'bienvenue', lemmas: ['bienvenue', 'bienvenu'], pos: 'phrase', gloss: 'welcome', hint: 'as a greeting or "welcome to …"; skip the verb ("we welcome")' },

  { id: 'how-are-you', tier: 1, category: 'ca-va', english: String.raw`how are you(?: doing)?|how['’]s it going|how do you do`, french: 'comment ça va ?', lemmas: ['comment ça va', 'comment allez-vous', 'ça va'], pos: 'phrase', gloss: 'how are you?', hint: 'informal "comment ça va ?" unless the sentence is clearly formal' },
  { id: 'very-well', tier: 1, category: 'ca-va', english: 'very well', french: 'très bien', lemmas: ['très bien'], pos: 'phrase', gloss: 'very well' },
  { id: 'not-bad', tier: 1, category: 'ca-va', english: 'not bad', french: 'pas mal', lemmas: ['pas mal'], pos: 'phrase', gloss: 'not bad' },
  { id: 'so-so', tier: 1, category: 'ca-va', english: 'so-so', french: 'comme ci, comme ça', lemmas: ['comme ci, comme ça', 'comme ci comme ça'], pos: 'phrase', gloss: 'so-so' },
  { id: 'and-you', tier: 1, category: 'ca-va', english: String.raw`and you(?=\s?\?)`, french: 'et toi', lemmas: ['et toi', 'et vous'], pos: 'phrase', gloss: 'and you?' },
  { id: 'thank-you', tier: 1, category: 'ca-va', english: 'thank you(?: very much| so much)?|thanks(?! to)(?: a lot)?', french: 'merci', lemmas: ['merci', 'merci beaucoup'], pos: 'phrase', gloss: 'thank you' },

  { id: 'please-repeat', tier: 1, category: 'classroom', english: 'please repeat(?: that)?|repeat(?: that)?,? please|say (?:that|it) again', french: "répétez, s'il vous plaît", lemmas: ["répétez, s'il vous plaît", 'répéter'], pos: 'phrase', gloss: 'please repeat' },
  { id: 'dont-understand', tier: 1, category: 'classroom', english: String.raw`I don['’]t understand|I do not understand`, french: 'je ne comprends pas', lemmas: ['je ne comprends pas', 'comprendre'], pos: 'phrase', gloss: "I don't understand" },
  { id: 'dont-know', tier: 1, category: 'classroom', english: String.raw`I don['’]t know|I do not know`, french: 'je ne sais pas', lemmas: ['je ne sais pas', 'savoir'], pos: 'phrase', gloss: "I don't know" },
  { id: 'how-say', tier: 1, category: 'classroom', english: 'how do you say', french: 'comment dit-on', lemmas: ['comment dit-on', 'dire'], pos: 'phrase', gloss: 'how do you say' },
  { id: 'what-mean', tier: 1, category: 'classroom', english: 'what does (?:it|that|this) mean', french: "qu'est-ce que ça veut dire", lemmas: ["qu'est-ce que ça veut dire", 'vouloir dire'], pos: 'phrase', gloss: 'what does it mean?' },
  { id: 'more-slowly', tier: 1, category: 'classroom', english: 'more slowly', french: 'plus lentement', lemmas: ['plus lentement', 'lentement'], pos: 'phrase', gloss: 'more slowly' },
  { id: 'again', tier: 1, category: 'classroom', english: 'again|once more|one more time', french: 'encore une fois', lemmas: ['encore une fois', 'encore'], pos: 'phrase', gloss: 'again', hint: 'skip "never again" and other uses where French needs a different word' },
  { id: 'have-question', tier: 1, category: 'classroom', english: 'I have a question', french: "j'ai une question", lemmas: ["j'ai une question", 'question'], pos: 'phrase', gloss: 'I have a question' },
  { id: 'ladies-gentlemen', tier: 1, category: 'greetings', english: 'ladies and gentlemen', french: 'mesdames et messieurs', lemmas: ['mesdames et messieurs'], pos: 'phrase', gloss: 'ladies and gentlemen' },
  { id: 'excuse-me', tier: 1, category: 'everyday', english: 'excuse me|pardon me', french: 'excusez-moi', lemmas: ['excusez-moi', 'excuse-moi', 'pardon'], pos: 'phrase', gloss: 'excuse me' },
];

// Tier 3: words inside the phrases, classroom verbs and nouns, politeness.
// Verbs need conjugating, so most go to the model.
const parts: BankEntry[] = [
  { id: 'soon', tier: 3, category: 'greetings', english: '(?<!as )soon(?! as)', french: 'bientôt', lemmas: ['bientôt'], pos: 'adv', gloss: 'soon', fixed: true },
  { id: 'later', tier: 3, category: 'greetings', english: 'later', french: 'plus tard', lemmas: ['plus tard'], pos: 'adv', gloss: 'later', hint: 'adverb only; skip the adjective ("the later years")' },
  { id: 'tomorrow', tier: 3, category: 'greetings', english: 'tomorrow', french: 'demain', lemmas: ['demain'], pos: 'adv', gloss: 'tomorrow', fixed: true },
  { id: 'how', tier: 3, category: 'ca-va', english: 'how(?! (?:many|much|long|far|often|old)\\b)', french: 'comment', lemmas: ['comment'], pos: 'adv', gloss: 'how', hint: 'only where French uses "comment"' },
  { id: 'please', tier: 3, category: 'classroom', english: 'please', french: "s'il vous plaît", lemmas: ["s'il vous plaît", "s'il te plaît"], pos: 'phrase', gloss: 'please', hint: 'only the polite word; skip the verb "to please"' },
  { id: 'what', tier: 3, category: 'classroom', english: 'what', french: "qu'est-ce que", lemmas: ["qu'est-ce que", 'quoi', 'que', 'quel', 'quelle', 'ce que'], pos: 'pron', gloss: 'what', hint: 'in questions: qu\'est-ce que / quoi / quel(le) as French needs; skip "what" where no short French fits' },
  { id: 'why', tier: 3, category: 'classroom', english: 'why', french: 'pourquoi', lemmas: ['pourquoi'], pos: 'adv', gloss: 'why', hint: 'skip "the reason why"' },
  { id: 'say', tier: 3, category: 'classroom', english: 'say|says|said|saying', french: 'dire', lemmas: ['dire'], pos: 'verb', gloss: 'to say', hint: 'conjugate for subject and tense; include the subject pronoun if French needs it ("she said" → "elle a dit")' },
  { id: 'understand', tier: 3, category: 'classroom', english: 'understand|understands|understood', french: 'comprendre', lemmas: ['comprendre'], pos: 'verb', gloss: 'to understand', hint: 'conjugate for subject and tense' },
  { id: 'repeat', tier: 3, category: 'classroom', english: 'repeat|repeats|repeated|repeating', french: 'répéter', lemmas: ['répéter'], pos: 'verb', gloss: 'to repeat', hint: 'conjugate; an adjective agrees ("repeated attempts" → "tentatives répétées")' },
  { id: 'know', tier: 3, category: 'classroom', english: 'know|knows|knew|known|knowing', french: 'savoir', lemmas: ['savoir', 'connaître'], pos: 'verb', gloss: 'to know', hint: 'savoir for facts, connaître for people and places; conjugate' },
  { id: 'mean', tier: 3, category: 'classroom', english: 'mean|means|meant', french: 'vouloir dire', lemmas: ['vouloir dire', 'signifier'], pos: 'verb', gloss: 'to mean', hint: 'only the verb "to signify"; skip "means" (a way) and the adjective "mean"' },
  { id: 'ask', tier: 3, category: 'classroom', english: 'ask|asks|asked|asking', french: 'demander', lemmas: ['demander'], pos: 'verb', gloss: 'to ask', hint: 'conjugate' },
  { id: 'answer', tier: 3, category: 'classroom', english: 'answer|answers|answered|answering', french: 'répondre', lemmas: ['répondre', 'réponse'], pos: 'verb', gloss: 'to answer', hint: 'verb → répondre (conjugated); noun → la réponse' },
  { id: 'listen', tier: 3, category: 'classroom', english: 'listen|listens|listened|listening', french: 'écouter', lemmas: ['écouter'], pos: 'verb', gloss: 'to listen', hint: 'conjugate; "listen to X" → "écouter X"' },
  { id: 'read', tier: 3, category: 'classroom', english: 'read|reads|reading', french: 'lire', lemmas: ['lire', 'lecture'], pos: 'verb', gloss: 'to read', hint: 'conjugate; the noun "reading" → la lecture' },
  { id: 'write', tier: 3, category: 'classroom', english: 'write|writes|wrote|written|writing', french: 'écrire', lemmas: ['écrire', 'écriture'], pos: 'verb', gloss: 'to write', hint: 'conjugate; the noun "writing" → l\'écriture' },
  { id: 'open', tier: 3, category: 'classroom', english: 'open|opens|opened|opening', french: 'ouvrir', lemmas: ['ouvrir', 'ouvert', 'ouverture'], pos: 'verb', gloss: 'to open', hint: 'verb → ouvrir conjugated; adjective → ouvert(e)' },
  { id: 'look', tier: 3, category: 'classroom', english: 'look|looks|looked|looking', french: 'regarder', lemmas: ['regarder'], pos: 'verb', gloss: 'to look at', hint: '"look at X" → "regarder X" (drop "at"); skip "look like", "look for" and "looks" meaning appearance' },
  { id: 'slowly', tier: 3, category: 'classroom', english: 'slowly', french: 'lentement', lemmas: ['lentement'], pos: 'adv', gloss: 'slowly', fixed: true },
  { id: 'word', tier: 3, category: 'classroom', english: 'words?', french: 'mot', lemmas: ['mot'], gender: 'm', pos: 'noun', gloss: 'word', hint: 'include the article (le mot, les mots, des mots)' },
  { id: 'question', tier: 3, category: 'classroom', english: 'questions?', french: 'question', lemmas: ['question'], gender: 'f', pos: 'noun', gloss: 'question', hint: 'include the article' },
  { id: 'teacher', tier: 3, category: 'classroom', english: 'teachers?', french: 'professeur', lemmas: ['professeur', 'professeure', 'enseignant', 'enseignante'], gender: 'm', pos: 'noun', gloss: 'teacher', hint: 'include the article' },
  { id: 'student', tier: 3, category: 'classroom', english: 'students?|pupils?', french: 'élève', lemmas: ['élève', 'étudiant', 'étudiante'], gender: 'm', pos: 'noun', gloss: 'student', hint: 'include the article; étudiant(e) for university' },
  { id: 'lesson', tier: 3, category: 'classroom', english: String.raw`lessons?|(?<!(?:taxonomic|social|working|middle|upper|lower|ruling|first|second|business|economy|world|weight|heavyweight) )class(?:es)?(?! of)`, french: 'cours', lemmas: ['cours', 'leçon', 'classe'], gender: 'm', pos: 'noun', gloss: 'lesson, class', hint: 'only a school class or lesson; skip "class" meaning a category or social class' },

  { id: 'friend', tier: 3, category: 'everyday', english: 'friends?', french: 'ami', lemmas: ['ami', 'amie'], gender: 'm', pos: 'noun', gloss: 'friend', hint: 'include the article; amie for a woman' },
  { id: 'sorry', tier: 3, category: 'everyday', english: 'sorry', french: 'pardon', lemmas: ['pardon', 'désolé'], pos: 'phrase', gloss: 'sorry', hint: '"Sorry!" → "Pardon !"; "I\'m sorry" → "je suis désolé(e)"; skip "a sorry state"' },
  { id: 'yes', tier: 3, category: 'everyday', english: 'yes', french: 'oui', lemmas: ['oui'], pos: 'adv', gloss: 'yes', fixed: true },
  { id: 'no', tier: 3, category: 'everyday', english: String.raw`no(?!\.\s?\d)`, french: 'non', lemmas: ['non'], pos: 'adv', gloss: 'no', hint: 'only the answer or interjection ("No, …"); skip "no" before a noun' },
  { id: 'mr', tier: 3, category: 'everyday', english: String.raw`Mr\.?`, caseSensitive: true, french: 'monsieur', lemmas: ['monsieur'], gender: 'm', pos: 'title', gloss: 'Mr, sir', fixed: true },
  { id: 'mrs', tier: 3, category: 'everyday', english: String.raw`Mrs\.?`, caseSensitive: true, french: 'madame', lemmas: ['madame'], gender: 'f', pos: 'title', gloss: 'Mrs, madam', fixed: true },
  { id: 'miss', tier: 3, category: 'everyday', english: 'Miss', caseSensitive: true, french: 'mademoiselle', lemmas: ['mademoiselle'], gender: 'f', pos: 'title', gloss: 'Miss', fixed: true },
  { id: 'lady', tier: 3, category: 'everyday', english: 'lady|ladies', french: 'dame', lemmas: ['dame', 'madame'], gender: 'f', pos: 'noun', gloss: 'lady', hint: 'include the article (la dame, les dames)' },
  { id: 'gentleman', tier: 3, category: 'everyday', english: 'gentleman|gentlemen', french: 'monsieur', lemmas: ['monsieur', 'messieurs'], gender: 'm', pos: 'noun', gloss: 'gentleman', hint: 'include the article (le monsieur, les messieurs)' },
  { id: 'sir', tier: 3, category: 'everyday', english: 'sir', caseSensitive: true, french: 'monsieur', lemmas: ['monsieur'], gender: 'm', pos: 'title', gloss: 'Mr, sir', fixed: true },
  { id: 'madam', tier: 3, category: 'everyday', english: String.raw`madam|ma['’]am`, french: 'madame', lemmas: ['madame'], gender: 'f', pos: 'title', gloss: 'Mrs, madam', fixed: true },
];

// Tier 4: invariant words from the ça-va dialogues ("et toi ?", "très bien",
// "moi aussi"). Capped hard so they don't swamp the page.
const small: BankEntry[] = [
  { id: 'and', tier: 4, category: 'everyday', english: 'and(?!/)', french: 'et', lemmas: ['et'], pos: 'conj', gloss: 'and', fixed: true },
  { id: 'with', tier: 4, category: 'everyday', english: 'with', french: 'avec', lemmas: ['avec'], pos: 'prep', gloss: 'with', fixed: true },
  { id: 'but', tier: 4, category: 'everyday', english: '(?<!(?:all|nothing|anything|everything|none|last) )but', french: 'mais', lemmas: ['mais'], pos: 'conj', gloss: 'but', fixed: true },
  { id: 'very', tier: 4, category: 'everyday', english: '(?<!the )very(?! much)', french: 'très', lemmas: ['très'], pos: 'adv', gloss: 'very', fixed: true },
  { id: 'also', tier: 4, category: 'everyday', english: 'also', french: 'aussi', lemmas: ['aussi'], pos: 'adv', gloss: 'also', fixed: true },
  { id: 'well', tier: 4, category: 'everyday', english: 'well', french: 'bien', lemmas: ['bien', 'aussi'], pos: 'adv', gloss: 'well', hint: 'adverb only ("as well" → aussi); skip the noun and "well" as an interjection' },
  { id: 'too', tier: 4, category: 'everyday', english: 'too', french: 'aussi', lemmas: ['aussi', 'trop'], pos: 'adv', gloss: 'too', hint: '"also" → aussi; "excessively" → trop' },
];

export const basicsEntries: BankEntry[] = [...phrases, ...numberEntries(), ...parts, ...small];
