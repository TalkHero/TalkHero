export type EnglishLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type TutorProfile = {
  fullName: string;
  nativeLanguage: string;
  targetLanguage: string;
  level: EnglishLevel;
};

export type LessonContext = {
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

export type TutorPromptContext = {
  profile: TutorProfile;
  lesson: LessonContext;
};
