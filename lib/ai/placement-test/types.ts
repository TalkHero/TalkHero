export type CEFRLevel =
  | "A1"
  | "A2"
  | "B1"
  | "B2"
  | "C1"
  | "C2";

export type PlacementSkill =
  | "personal_information"
  | "daily_life"
  | "present_simple"
  | "past_simple"
  | "future_forms"
  | "description"
  | "experience"
  | "opinion"
  | "comparison"
  | "argumentation"
  | "hypothetical_reasoning"
  | "abstract_discussion";

export type AnswerLength =
  | "short"
  | "medium"
  | "long";

export interface PlacementQuestion {

  question: string;

  questionKey: string;

  level: CEFRLevel;

  skill: PlacementSkill;

  expectedAnswerLength: AnswerLength;
}

export interface PlacementEvaluation {

  grammar: number;

  vocabulary: number;

  comprehension: number;

  complexity: number;

  taskCompletion: number;

  estimatedLevel: CEFRLevel;

  feedback: string;
}
