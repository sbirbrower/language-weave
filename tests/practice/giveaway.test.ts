import { describe, expect, it } from 'vitest';
import { seededRng } from '../../src/passage/rng';
import { getExerciseType } from '../../src/practice/exercises';
import { givesAway } from '../../src/practice/giveaway';
import { parsePractice } from '../../src/practice/prompt';

const parse = (raw: Record<string, unknown>) => getExerciseType(String(raw.type))!.parse(raw, seededRng('s'))!;
const items = (...ts: string[]) => ts.map((target) => ({ target, en: '' }));
const sort = (...groups: Array<[string, string, string[]]>) => ({
  type: 'sort',
  instruction: 'Sort them',
  groups: groups.map(([label, en, ts]) => ({ label, en, items: items(...ts) })),
});

describe('givesAway', () => {
  it('catches a sort whose items show their group: a pronoun, an ending, an article', () => {
    const endings = sort(['-e', 'ich form', ['ich wohne', 'ich lerne']], ['-st', 'du form', ['du lernst', 'du wohnst']], ['-t', 'er/sie/es form', ['er wohnt', 'das Kind kommt']]);
    expect(givesAway(parse(endings))).toBe(true);
    expect(givesAway(parse(sort(['-e', '', ['wohne', 'lerne']], ['-st', '', ['lernst', 'wohnst']])))).toBe(true);
    expect(givesAway(parse(sort(['ich', 'I', ['ich wohne', 'ich lerne']], ['er/sie/es', '', ['er wohnt', 'sie lernt']])))).toBe(true);
    expect(givesAway(parse(sort(['masculino', 'masculine (o)', ['o livro', 'o carro']], ['feminino', 'feminine (a)', ['a casa', 'a mesa']])))).toBe(true);
    expect(givesAway(parse(sort(['は', '', ['私は学生です', '今日は']], ['が', '', ['猫がいます', '雨が降る']])))).toBe(true);
  });

  it('reads a label written as a pattern: a word only its group has, around …, 〜 or +', () => {
    expect(givesAway(parse(sort(['faire du', '', ['Je fais du tennis.', 'Il fait du vélo.']], ['faire de la', '', ['Tu fais de la danse.', 'Elle fait de la natation.']])))).toBe(true);
    expect(givesAway(parse(sort(['hace…', '', ['Hace sol.', 'Hace viento.']], ['hay…', '', ['Hay niebla.', 'Hay nubes.']])))).toBe(true);
    expect(givesAway(parse(sort(['〜と思います', '', ['静かだと思います。', '高いと思います。']], ['〜と言っていました', '', ['買ったと言っていました。', '来ると言っていました。']])))).toBe(true);
    expect(givesAway(parse(sort(['一边…一边…', '', ['他一边开会，一边喝茶。', '我们一边休息，一边聊天。']], ['只做一件事', '', ['他今天去面试。', '医生在医院工作。']])))).toBe(true);
    expect(givesAway(parse(sort(['처음', '', ['먼저 청소했어요.', '아침에 탔어요.']], ['마지막', '', ['마지막으로 운동했어요.', '마지막으로 왔어요.']])))).toBe(true);
    // Forms that go with the label, but aren't it, are the lesson: тебя with ты.
    expect(givesAway(parse(sort(['ich', '', ['wohne', 'lerne']], ['du', '', ['lernst', 'wohnst']])))).toBe(false);
    expect(givesAway(parse(sort(['ты', '', ['Как тебя зовут?', 'А у тебя?']], ['вы', '', ['Как вас зовут?', 'Здравствуйте!']])))).toBe(false);
  });

  it('lets a sort through when knowing the lesson decides it', () => {
    expect(givesAway(parse(sort(['ich', 'I', ['wohne', 'lerne']], ['du', 'you', ['lernst', 'wohnst']], ['er/sie/es', 'he/she/it', ['wohnt', 'kommt']])))).toBe(false);
    expect(givesAway(parse(sort(['masculin', 'masculine', ['livre', 'café']], ['féminin', 'feminine', ['table', 'maison']])))).toBe(false);
    // One item showing its group, of six, is left alone.
    expect(givesAway(parse(sort(['haben', '', ['gegessen', 'gemacht', 'habe gehabt']], ['sein', '', ['gegangen', 'gefahren', 'gekommen']])))).toBe(false);
  });

  it('catches pairs whose halves show each other', () => {
    const pairs = (ps: string[][]) => parse({ type: 'pairs', instruction: '', pairs: ps });
    expect(givesAway(pairs([['du', 'du lernst'], ['ich', 'ich lerne'], ['er', 'er lernt']]))).toBe(true);
    expect(givesAway(pairs([['du', 'lernst'], ['ich', 'lerne'], ['er', 'lernt']]))).toBe(false);
    expect(givesAway(pairs([['das Kind', 'die Kinder'], ['der Hund', 'die Hunde'], ['die Frau', 'die Frauen']]))).toBe(false);
  });

  it('catches a choice whose prompt has the answer and no other option', () => {
    const meaning = (word: string, options: string[], answer: string) => parse({ type: 'meaning', instruction: '', word, options, answer, why: '' });
    expect(givesAway(meaning('le croissant', ['croissant', 'bread', 'cake'], 'croissant'))).toBe(true);
    expect(givesAway(meaning('le pain', ['bread', 'croissant', 'cake'], 'bread'))).toBe(false);
    const gap = (sentence: string, options: string[], answer: string) => parse({ type: 'gap', instruction: '', sentence, en: '', options, answer, why: '' });
    expect(givesAway(gap('Er ___ nach Hause, und sie geht auch.', ['geht', 'gehst', 'gehe'], 'geht'))).toBe(true);
    // A wrong option on screen too: the sentence doesn't point at the answer.
    expect(givesAway(gap('Ich ___ müde, und du bist es auch.', ['bin', 'bist', 'ist'], 'bin'))).toBe(false);
  });

  it('is applied by parsePractice', () => {
    const line = JSON.stringify(sort(['-e', '', ['ich wohne', 'ich lerne']], ['-st', '', ['du lernst', 'du wohnst']]));
    expect(parsePractice(line, { type: getExerciseType('sort')!, setting: '', seed: 's' })).toBeNull();
  });
});
