import type { EnglishLevel } from "../tutor/types";

export type Lesson = {
  id: string;

  level: EnglishLevel;

  unit: number;

  lesson: number;

  title: string;

  topic: string;

  grammar: string[];

  vocabulary: string[];

  objectives: string[];

  speakingTask: string;

  homework: string;
};
