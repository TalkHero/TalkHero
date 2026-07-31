import { getQuestionType } from "./utils.mjs";

export function createCategorySchema({
  level,
  category,
  count,
}) {
  const questionType = getQuestionType(category);

  return {
    type: "object",
    additionalProperties: false,
    required: ["questions"],

    properties: {
      questions: {
        type: "array",
        minItems: count,
        maxItems: count,
        question_code: {
  type: "string",
  pattern:
    "^[A-Z][0-9]-[A-Z]+(?:-[A-Z]+)*-[0-9]{3}$",
},

        items: {
          type: "object",
          additionalProperties: false,

          required: [
            "cefr_level",
            "category",
            "question_type",
            "prompt",
            "passage",
            "options",
            "correct_answer",
            "explanation_uk",
            "difficulty",
            "discrimination",
            "estimated_time_seconds",
            "topic",
            "tags",
            "source",
            "status",
          ],

          properties: {
            cefr_level: {
              type: "string",
              enum: [level],
            },

            category: {
              type: "string",
              enum: [category],
            },

            question_type: {
              type: "string",
              enum: [questionType],
            },

            prompt: {
              type: "string",
              minLength: 3,
            },

            passage: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  type: "null",
                },
              ],
            },

            options: {
              type: "array",
              minItems: 4,
              maxItems: 4,

              items: {
                type: "string",
                minLength: 1,
              },
            },

            correct_answer: {
              type: "string",
              minLength: 1,
            },

            explanation_uk: {
              type: "string",
              minLength: 5,
            },

            difficulty: {
              type: "integer",
              minimum: 1,
              maximum: 5,
            },

            discrimination: {
              type: "number",
              minimum: 0.8,
              maximum: 1.3,
            },

            estimated_time_seconds: {
              type: "integer",
              minimum: 20,
              maximum: 120,
            },

            topic: {
              type: "string",
              minLength: 1,
            },

            tags: {
              type: "array",
              minItems: 1,
              maxItems: 6,

              items: {
                type: "string",
                minLength: 1,
              },
            },

            source: {
              type: "string",
              enum: ["generated"],
            },

            status: {
              type: "string",
              enum: ["published"],
            },
          },
        },
      },
    },
  };
}
