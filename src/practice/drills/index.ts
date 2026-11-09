import { rngFrom } from '../../passage/rng';
import { lessonsFor, type SyllabusLesson } from '../../syllabus';
import type { Step } from '../types';
import { AR_DRILLS } from './ar';
import { DRILLS } from './build';
import { CS_DRILLS } from './cs';
import { DE_DRILLS } from './de';
import { ES_DRILLS } from './es';
import { FR_DRILLS } from './fr';
import { GD_DRILLS } from './gd';
import { HE_DRILLS } from './he';
import { HI_DRILLS } from './hi';
import { IT_DRILLS } from './it';
import { JA_DRILLS } from './ja';
import { KO_DRILLS } from './ko';
import { PT_DRILLS } from './pt';
import { RU_DRILLS } from './ru';
import type { DrillData } from './types';
import { ZH_DRILLS } from './zh';

/** Each language's drill data, by code. A language without any has no drills. */
export const DRILL_DATA: Readonly<Record<string, DrillData>> = {
  fr: FR_DRILLS,
  de: DE_DRILLS,
  ja: JA_DRILLS,
  zh: ZH_DRILLS,
  ko: KO_DRILLS,
  hi: HI_DRILLS,
  he: HE_DRILLS,
  ar: AR_DRILLS,
  cs: CS_DRILLS,
  es: ES_DRILLS,
  pt: PT_DRILLS,
  ru: RU_DRILLS,
  it: IT_DRILLS,
  gd: GD_DRILLS,
};

/** A lesson's drills, for the Practice tab (`PracticeDeps.drills`). */
export interface Drills {
  /** The drill types this lesson has; those that play audio only when something can read it aloud. */
  types(listening: boolean): string[];
  /** One drill of `type`, built by code from the language's data and the lesson's theme words (with their `glosses`); null if it can't be. */
  build(type: string, words: readonly string[], random: () => number, listening: boolean, glosses?: Readonly<Record<string, string>>): Step | null;
}

/** The language's lessons that drills count, in course order: all but the culture ones, so adding one moves no drill. */
export const drillLessons = (lang: string) => lessonsFor(lang).filter((l) => !l.kind);

/** The lesson's place among `drillLessons`, from 0; -1 for a culture lesson. */
const lessonIndex = (lesson: SyllabusLesson) => drillLessons(lesson.lang).findIndex((l) => l.id === lesson.id);

/**
 * The drills for a lesson: on sounds and script in its language's first few (`DrillData.lessons`), on
 * what a later one teaches in that lesson (`Drill.taught`); none in other lessons, in a culture lesson, or for a language without data.
 */
export function drillsFor(lesson: SyllabusLesson, data: DrillData | undefined = DRILL_DATA[lesson.lang]): Drills | undefined {
  const at = lessonIndex(lesson);
  if (!data || at < 0) return undefined;
  const fitting = DRILLS.filter((d) => (d.taught || at < data.lessons) && d.fits(data, at));
  if (!fitting.length) return undefined;
  return {
    types: (listening) => fitting.filter((d) => listening || !d.listening).map((d) => d.id),
    build(type, words, random, listening, glosses = {}) {
      const drill = fitting.find((d) => d.id === type);
      if (!drill || (drill.listening && !listening)) return null;
      const built = drill.build(data, { at, words, glosses, listening, rng: rngFrom(random) });
      return built && { ...built.exercise, type: drill.id, instruction: built.instruction, drill: { name: drill.name } };
    },
  };
}
