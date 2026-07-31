import type {
  AssessmentQuestionCategory,
  AssessmentQuestionType,
  CefrLevel,
} from "@/lib/testing/types";

export type AssessmentBlueprintSlot = {
  cefrLevel: CefrLevel;
  category: AssessmentQuestionCategory;
  questionTypes: AssessmentQuestionType[];
  count: number;
  difficulty?: number[];
  weight?: number;
};

export type AssessmentBlueprint = {
  slug: string;
  questionCount: number;
  slots: AssessmentBlueprintSlot[];
};

const OBJECTIVE_TYPES: AssessmentQuestionType[] = [
  "multiple_choice",
  "fill_gap",
  "reading_choice",
  "true_false",
];

export const A1_TEST_BLUEPRINT: AssessmentBlueprint = {
  slug: "english-a1",
  questionCount: 20,
  slots: [
    {
      cefrLevel: "A1",
      category: "grammar",
      questionTypes: ["multiple_choice", "fill_gap"],
      count: 8,
      difficulty: [1, 2, 3, 4],
    },
    {
      cefrLevel: "A1",
      category: "vocabulary",
      questionTypes: ["multiple_choice", "fill_gap"],
      count: 7,
      difficulty: [1, 2, 3, 4],
    },
    {
      cefrLevel: "A1",
      category: "reading",
      questionTypes: ["reading_choice", "true_false"],
      count: 5,
      difficulty: [1, 2, 3, 4],
    },
  ],
};

export const A2_TEST_BLUEPRINT: AssessmentBlueprint = {
  slug: "english-a2",
  questionCount: 20,
  slots: [
    {
      cefrLevel: "A2",
      category: "grammar",
      questionTypes: ["multiple_choice", "fill_gap"],
      count: 8,
      difficulty: [1, 2, 3, 4, 5],
    },
    {
      cefrLevel: "A2",
      category: "vocabulary",
      questionTypes: ["multiple_choice", "fill_gap"],
      count: 7,
      difficulty: [1, 2, 3, 4, 5],
    },
    {
      cefrLevel: "A2",
      category: "reading",
      questionTypes: ["reading_choice", "true_false"],
      count: 5,
      difficulty: [1, 2, 3, 4, 5],
    },
  ],
};

export const B1_TEST_BLUEPRINT: AssessmentBlueprint = {
  slug: "english-b1",
  questionCount: 20,
  slots: [
    {
      cefrLevel: "B1",
      category: "grammar",
      questionTypes: ["multiple_choice", "fill_gap"],
      count: 7,
      difficulty: [1, 2, 3, 4, 5],
    },
    {
      cefrLevel: "B1",
      category: "vocabulary",
      questionTypes: ["multiple_choice", "fill_gap"],
      count: 7,
      difficulty: [1, 2, 3, 4, 5],
    },
    {
      cefrLevel: "B1",
      category: "reading",
      questionTypes: ["reading_choice", "true_false"],
      count: 6,
      difficulty: [1, 2, 3, 4, 5],
    },
  ],
};

export const B2_TEST_BLUEPRINT: AssessmentBlueprint = {
  slug: "english-b2",
  questionCount: 20,
  slots: [
    {
      cefrLevel: "B2",
      category: "grammar",
      questionTypes: ["multiple_choice", "fill_gap"],
      count: 7,
      difficulty: [1, 2, 3, 4, 5],
    },
    {
      cefrLevel: "B2",
      category: "vocabulary",
      questionTypes: ["multiple_choice", "fill_gap"],
      count: 6,
      difficulty: [1, 2, 3, 4, 5],
    },
    {
      cefrLevel: "B2",
      category: "reading",
      questionTypes: ["reading_choice", "true_false"],
      count: 7,
      difficulty: [1, 2, 3, 4, 5],
    },
  ],
};

export const C1_TEST_BLUEPRINT: AssessmentBlueprint = {
  slug: "english-c1",
  questionCount: 20,
  slots: [
    {
      cefrLevel: "C1",
      category: "grammar",
      questionTypes: ["multiple_choice", "fill_gap"],
      count: 6,
      difficulty: [1, 2, 3, 4, 5],
    },
    {
      cefrLevel: "C1",
      category: "vocabulary",
      questionTypes: ["multiple_choice", "fill_gap"],
      count: 6,
      difficulty: [1, 2, 3, 4, 5],
    },
    {
      cefrLevel: "C1",
      category: "reading",
      questionTypes: ["reading_choice", "true_false"],
      count: 8,
      difficulty: [1, 2, 3, 4, 5],
    },
  ],
};

/**
 * Початкова версія комплексного Placement Test.
 *
 * Усі питання об'єктивні. Writing і Speaking будуть окремими
 * додатковими оцінюваннями після основного результату.
 */
export const PLACEMENT_TEST_BLUEPRINT: AssessmentBlueprint = {
  slug: "english-placement",
  questionCount: 30,
  slots: [
    {
      cefrLevel: "A1",
      category: "grammar",
      questionTypes: OBJECTIVE_TYPES,
      count: 2,
      difficulty: [2, 3],
      weight: 1,
    },
    {
      cefrLevel: "A1",
      category: "vocabulary",
      questionTypes: OBJECTIVE_TYPES,
      count: 2,
      difficulty: [2, 3],
      weight: 1,
    },
    {
      cefrLevel: "A1",
      category: "reading",
      questionTypes: ["reading_choice", "true_false"],
      count: 2,
      difficulty: [2, 3],
      weight: 1,
    },

    {
      cefrLevel: "A2",
      category: "grammar",
      questionTypes: OBJECTIVE_TYPES,
      count: 2,
      difficulty: [2, 3, 4],
      weight: 1.2,
    },
    {
      cefrLevel: "A2",
      category: "vocabulary",
      questionTypes: OBJECTIVE_TYPES,
      count: 2,
      difficulty: [2, 3, 4],
      weight: 1.2,
    },
    {
      cefrLevel: "A2",
      category: "reading",
      questionTypes: ["reading_choice", "true_false"],
      count: 2,
      difficulty: [2, 3, 4],
      weight: 1.2,
    },

    {
      cefrLevel: "B1",
      category: "grammar",
      questionTypes: OBJECTIVE_TYPES,
      count: 2,
      difficulty: [2, 3, 4],
      weight: 1.5,
    },
    {
      cefrLevel: "B1",
      category: "vocabulary",
      questionTypes: OBJECTIVE_TYPES,
      count: 2,
      difficulty: [2, 3, 4],
      weight: 1.5,
    },
    {
      cefrLevel: "B1",
      category: "reading",
      questionTypes: ["reading_choice", "true_false"],
      count: 2,
      difficulty: [2, 3, 4],
      weight: 1.5,
    },

    {
      cefrLevel: "B2",
      category: "grammar",
      questionTypes: OBJECTIVE_TYPES,
      count: 2,
      difficulty: [2, 3, 4, 5],
      weight: 2,
    },
    {
      cefrLevel: "B2",
      category: "vocabulary",
      questionTypes: OBJECTIVE_TYPES,
      count: 2,
      difficulty: [2, 3, 4, 5],
      weight: 2,
    },
    {
      cefrLevel: "B2",
      category: "reading",
      questionTypes: ["reading_choice", "true_false"],
      count: 2,
      difficulty: [2, 3, 4, 5],
      weight: 2,
    },

    {
      cefrLevel: "C1",
      category: "grammar",
      questionTypes: OBJECTIVE_TYPES,
      count: 2,
      difficulty: [2, 3, 4, 5],
      weight: 2.5,
    },
    {
      cefrLevel: "C1",
      category: "vocabulary",
      questionTypes: OBJECTIVE_TYPES,
      count: 2,
      difficulty: [2, 3, 4, 5],
      weight: 2.5,
    },
    {
      cefrLevel: "C1",
      category: "reading",
      questionTypes: ["reading_choice", "true_false"],
      count: 2,
      difficulty: [2, 3, 4, 5],
      weight: 2.5,
    },
  ],
};

export const ASSESSMENT_BLUEPRINTS: Record<
  string,
  AssessmentBlueprint
> = {
  [PLACEMENT_TEST_BLUEPRINT.slug]: PLACEMENT_TEST_BLUEPRINT,
  [A1_TEST_BLUEPRINT.slug]: A1_TEST_BLUEPRINT,
  [A2_TEST_BLUEPRINT.slug]: A2_TEST_BLUEPRINT,
  [B1_TEST_BLUEPRINT.slug]: B1_TEST_BLUEPRINT,
  [B2_TEST_BLUEPRINT.slug]: B2_TEST_BLUEPRINT,
  [C1_TEST_BLUEPRINT.slug]: C1_TEST_BLUEPRINT,
};

export function getAssessmentBlueprint(
  slug: string,
): AssessmentBlueprint | null {
  return ASSESSMENT_BLUEPRINTS[slug] ?? null;
}
