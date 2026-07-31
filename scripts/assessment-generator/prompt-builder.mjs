import { getQuestionType } from "./utils.mjs";

const CATEGORY_INSTRUCTIONS = {
  grammar: `
Test grammar structures appropriate for the requested CEFR level.

Use a balanced variety of structures.
Do not repeat the same grammatical construction excessively.
Each question must test one clear grammatical point.
`.trim(),

  vocabulary: `
Test vocabulary appropriate for the requested CEFR level.

Include a balanced variety of:
- meaning in context;
- collocations;
- common phrases;
- word choice;
- topic vocabulary;
- phrasal verbs where appropriate.

Avoid direct Ukrainian translation questions when possible.
`.trim(),

  reading: `
Create reading-comprehension questions appropriate for the requested CEFR level.

Requirements:
- passage must never be null;
- passages must use natural English;
- answers must be directly supported by the passage;
- one passage may support two related questions;
- each question must remain a separate object;
- include detail, main-idea and inference questions;
- avoid generic prompts when possible;
- a main-idea prompt should identify the passage context instead of only saying
  "What is the main idea of the passage?".
`.trim(),

  cloze: `
Create multiple-choice cloze questions appropriate for the requested CEFR level.

Requirements:
- every prompt must contain exactly one blank written as ___;
- test grammar, vocabulary, collocation, prepositions or phrasal verbs;
- passage must be null;
- the complete sentence must sound natural after inserting the correct answer.
`.trim(),

  use_of_english: `
Create Use of English multiple-choice questions appropriate for the requested CEFR level.

Requirements:
- every prompt must contain exactly one blank written as ___;
- test collocations, fixed expressions, phrasal verbs, transformations,
  grammar in context or nuanced word choice;
- passage must be null;
- do not duplicate ordinary grammar questions;
- do not reuse the same sentence frame, answer set or grammar target
  from the grammar category.
`.trim(),
};

export function buildCategoryPrompt({
  level,
  category,
  count,
  existingPrompts = [],
}) {
  const questionType = getQuestionType(category);
  const existingPromptBlock =
    existingPrompts.length > 0
      ? `
The following prompts already exist in this assessment bank.
Do not create duplicates or close paraphrases of them:

${existingPrompts.map((prompt) => `- ${prompt}`).join("\n")}
`
      : "";

  return `
Create exactly ${count} English assessment questions.

Assessment level: CEFR ${level}
Category: ${category}
Required question_type: ${questionType}

This set belongs ONLY to the ${level} assessment.
Do not include questions from another CEFR level.

${CATEGORY_INSTRUCTIONS[category]}

General requirements:

1. Generate exactly ${count} question objects.
2. Prompts, passages and answer options must be written in natural English.
3. explanation_uk must be written in correct Ukrainian using Unicode UTF-8 text.
4. Every question must have exactly four answer options.
5. Exactly one option must be correct.
6. correct_answer must exactly match one string from options.
7. All answer options must be unique.
8. Distractors must be plausible but clearly incorrect.
9. Do not generate duplicate or near-duplicate prompts.
10. difficulty must be an integer from 1 to 5.
11. discrimination must be a number from 0.8 to 1.3.
12. estimated_time_seconds must be an integer from 20 to 120.
13. source must be "generated".
14. status must be "published".
15. cefr_level must always be "${level}".
16. category must always be "${category}".
17. question_type must always be "${questionType}".
18. Do not repeat an answer set used by another question.
19. Do not create two questions that test the same sentence with only names,
    places or verbs changed.

For reading questions:
- passage must be a non-empty string.

For all other categories:
- passage must be null.

${existingPromptBlock}

Return only data matching the JSON schema.
`.trim();
}
