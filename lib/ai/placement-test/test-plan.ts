import { CEFRLevel, PlacementSkill } from "./types";

export interface TestPlanStep {

    level: CEFRLevel;

    skill: PlacementSkill;

    answerLength: "short" | "medium" | "long";
}

export const TEST_PLAN: TestPlanStep[] = [

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
        level: "C1",
        skill: "abstract_discussion",
        answerLength: "long",
    },

    {
        level: "C1",
        skill: "argumentation",
        answerLength: "long",
    },
];
