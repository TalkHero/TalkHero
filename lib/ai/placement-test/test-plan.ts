import { CEFRLevel, PlacementSkill } from "./types";

export interface TestPlanStep {
  level: CEFRLevel;
  skill: PlacementSkill;
  answerLength: "short" | "medium" | "long";
}

export const TEST_PLAN: TestPlanStep[] = [
  // A1 — базова особиста інформація
  {
    level: "A1",
    skill: "personal_information",
    answerLength: "short",
  },
  {
    level: "A1",
    skill: "daily_life",
    answerLength: "short",
  },

  // A2 — опис подій і предметів
  {
    level: "A2",
    skill: "past_simple",
    answerLength: "medium",
  },
  {
    level: "A2",
    skill: "description",
    answerLength: "medium",
  },

  // B1 — досвід, плани та власна думка
  {
    level: "B1",
    skill: "experience",
    answerLength: "medium",
  },
  {
    level: "B1",
    skill: "future_forms",
    answerLength: "medium",
  },
  {
    level: "B1",
    skill: "opinion",
    answerLength: "medium",
  },

  // B2 — порівняння, аргументація та складні ситуації
  {
    level: "B2",
    skill: "comparison",
    answerLength: "long",
  },
  {
    level: "B2",
    skill: "argumentation",
    answerLength: "long",
  },
  {
    level: "B2",
    skill: "hypothetical_reasoning",
    answerLength: "long",
  },
  {
    level: "B2",
    skill: "problem_solving",
    answerLength: "long",
  },

  // C1 — абстрактне мислення, аргументація та оцінювання
  {
    level: "C1",
    skill: "abstract_discussion",
    answerLength: "long",
  },
  {
    level: "C1",
    skill: "argumentation",
    answerLength: "long",
  },
  {
    level: "C1",
    skill: "critical_evaluation",
    answerLength: "long",
  },

  // C2 — синтез складних ідей та аналіз перспектив
  {
    level: "C2",
    skill: "abstract_synthesis",
    answerLength: "long",
  },
  {
    level: "C2",
    skill: "perspective_analysis",
    answerLength: "long",
  },
];
