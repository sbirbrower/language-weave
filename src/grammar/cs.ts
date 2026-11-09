import type { GrammarPoint } from './types';

// For webpage passages: each point must fit true facts about any page (third person, the page's tenses),
// or a format's questions and reactions. Lessons bring their own points (`src/syllabus/`).
export const csGrammar: GrammarPoint[] = [
  // A1
  { id: 'byt', level: 'A1', label: 'být in the present', instruction: 'Use být in the present (je, jsou; není, nejsou) to say what things are and what they are like.', example: 'Řeka je dlouhá a hory jsou vysoké.' },
  { id: 'gender', level: 'A1', label: 'Gender and adjectives that agree', instruction: 'Use adjectives that agree with their noun’s gender (velký hrad, velká řeka, velké město).', example: 'Praha je velké město a má starý hrad.' },
  { id: 'plurals', level: 'A1', label: 'Noun plurals', instruction: 'Use nouns in the nominative plural with their endings (hrady, řeky, města, lidé).', example: 'Domy jsou bílé a ulice jsou úzké.' },
  { id: 'negation', level: 'A1', label: 'Negation with ne-', instruction: 'Put ne- in front of the verb (není, nemá, nežije) for something the page says is not so.', example: 'Tento had není nebezpečný a nemá jed.' },
  { id: 'mit', level: 'A1', label: 'mít (to have)', instruction: 'Use mít in the present (má, mají; nemá, nemají) to say what things have.', example: 'Kočka má dlouhý ocas.' },
  { id: 'present', level: 'A1', label: 'Verbs in the present', instruction: 'Use verbs in the present (žije, roste, hraje, mluví) for general facts.', example: 'Lední medvěd žije na severu a loví tuleně.' },
  { id: 'questions', level: 'A1', label: 'Questions with kdo, co, kde, kdy, kolik', instruction: 'Ask questions with kdo, co, kde, kdy or kolik, or yes/no questions, in a line where a question fits (a heading, a quiz, an interview, a reaction).', example: 'Kde začíná řeka?' },
  { id: 'accusative', level: 'A1', label: 'The accusative', instruction: 'Use the accusative for the object of a verb (feminine -a → -u: řeka → řeku; masculine animate nouns: pes → psa).', example: 'Vlk loví zajíce a srnu.' },
  { id: 'there-is', level: 'A1', label: 'There is: v / na + place + je, jsou', instruction: 'Say what is in a place by starting with the place (Ve městě…, Na ostrově…), then je or jsou.', example: 'Ve městě jsou dva mosty a jeden hrad.' },
  // A2
  { id: 'past', level: 'A2', label: 'The past tense', instruction: 'Use the past tense, agreeing with its subject (byl, byla, bylo, byli; založil, postavili), for past events the page describes.', example: 'Karel IV. založil univerzitu v roce 1348.' },
  { id: 'locative', level: 'A2', label: 'The locative after v and na', instruction: 'Use the locative after v and na for where things are (v lese, ve městě, na ostrově, na horách).', example: 'Medvědi žijí v lesích a na horách.' },
  { id: 'genitive', level: 'A2', label: 'The genitive after z, do, od, u, bez', instruction: 'Use the genitive after z, do, od, u and bez (do města, z lesa, u řeky).', example: 'Ptáci letí z Evropy do Afriky.' },
  { id: 'instrumental', level: 'A2', label: 'The instrumental after s, and for means', instruction: 'Use the instrumental after s (with) and for how things travel or are done (lodí, vlakem, rukou).', example: 'Turisté jezdí na ostrov lodí s průvodcem.' },
  { id: 'comparatives', level: 'A2', label: 'Comparative with než', instruction: 'Compare two things the page gives facts for with the comparative (větší, delší, rychlejší) + než.', example: 'Nil je delší než Amazonka.' },
  { id: 'superlatives', level: 'A2', label: 'Superlative with nej-', instruction: 'Use a superlative (nejvyšší, největší) only where the page says something is the most or least.', example: 'Sněžka je nejvyšší hora Česka.' },
  { id: 'modals', level: 'A2', label: 'moct, umět, muset, smět', instruction: 'Use moct, umět, muset or smět with an infinitive for what things can or must do.', example: 'Tučňáci nemohou létat, ale umějí dobře plavat.' },
  { id: 'protoze', level: 'A2', label: 'protože and že', instruction: 'Join facts with protože or že.', example: 'Zvířata v zimě spí, protože nemají dost potravy.' },
  { id: 'aspect', level: 'A2', label: 'Perfective and imperfective verbs', instruction: 'Use a perfective verb for one completed event (postavili, našli) and an imperfective one for what went on or happened often (stavěli, hledali).', example: 'Vědci dlouho hledali vodu a nakonec ji našli.' },
  // B1
  { id: 'ktery', level: 'B1', label: 'Relative clauses with který', instruction: 'Join facts with který, která, které, in the case the clause needs.', example: 'Řeka, která teče přes Prahu, se jmenuje Vltava.' },
  { id: 'passive', level: 'B1', label: 'The passive with být', instruction: 'Use být + passive participle (byl postaven, byla objevena) for things that were made, found or built.', example: 'Most byl postaven ve čtrnáctém století.' },
  { id: 'reflexive-passive', level: 'B1', label: 'The passive with se', instruction: 'Use se for what is generally done (vyrábí se, pěstuje se, mluví se).', example: 'Na jižní Moravě se pěstuje víno.' },
  { id: 'future', level: 'B1', label: 'The future', instruction: 'Use budu + imperfective infinitive, or a perfective verb in the present form, for what the page says will happen, or in a line to the reader.', example: 'Příští rok se ve městě otevře nové muzeum.' },
  { id: 'conditional', level: 'B1', label: 'The conditional (bych, bys, by)', instruction: 'Use the conditional (bych, bys, by + past form) in a line to the reader, a reaction or a dialogue.', example: 'Chtěl bys vidět tyto hory?' },
  { id: 'kdyz', level: 'B1', label: 'když and jestli', instruction: 'Use když for when, and jestli or pokud for if.', example: 'Když sopka vybuchla, lidé utekli k moři.' },
  { id: 'dative', level: 'B1', label: 'The dative', instruction: 'Use the dative for whom something is given, shown or said to, and after k and díky.', example: 'Díky teplému klimatu tu rostou vinice.' },
  { id: 'motion', level: 'B1', label: 'Verbs of motion: jít, jet, letět', instruction: 'Use jít for going on foot, jet for going by vehicle and letět for flying, with their prefixed forms (přijet, odletět).', example: 'Ptáci na podzim odlétají na jih.' },
  // B2
  { id: 'participles', level: 'B2', label: 'Participles before nouns', instruction: 'Use a participle as an adjective before a noun (postavený most, rostoucí město).', example: 'Rychle rostoucí město potřebuje nové silnice.' },
  { id: 'verbal-nouns', level: 'B2', label: 'Verbal nouns (-ní, -tí)', instruction: 'Use verbal nouns (stavění, objevení, pití) to name actions, as written texts do.', example: 'Objevení penicilinu změnilo medicínu.' },
  { id: 'reported', level: 'B2', label: 'Reported speech with že', instruction: 'Report what the page says people or sources state with že, keeping the tense they used.', example: 'Vědci tvrdí, že jezero je staré přes milion let.' },
  { id: 'connectors', level: 'B2', label: 'Contrast: ačkoli, přesto, zatímco', instruction: 'Contrast two facts the page gives with ačkoli, přesto or zatímco.', example: 'Poušť je velmi suchá, přesto tam rostou rostliny.' },
  { id: 'aby', level: 'B2', label: 'aby for purpose', instruction: 'Say why something is done with aby + past form (aby našli, aby chránili).', example: 'Ptáci letí na jih, aby našli potravu.' },
  { id: 'jehoz', level: 'B2', label: 'jehož, jejíž, jejichž', instruction: 'Use jehož, jejíž and jejichž for whose.', example: 'Je to zvíře, jehož ocas je velmi dlouhý.' },
  { id: 'two-part', level: 'B2', label: 'Two-part connectors', instruction: 'Link two facts with čím … tím, jak … tak or ani … ani.', example: 'Čím výš člověk stoupá, tím je chladněji.' },
];
