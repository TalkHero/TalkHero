import type {
  AnswerLength,
  CEFRLevel,
  PlacementSkill,
} from "../types";

interface BuildQuestionGeneratorPromptParams {
  level: CEFRLevel;
  skill: PlacementSkill;
  expectedAnswerLength: AnswerLength;
  previousQuestions: string[];
  rejectedQuestion?: string;
}

function formatPreviousQuestions(questions: string[]): string {
  if (questions.length === 0) {
    return "No previous questions are available.";
  }

  return questions
    .slice(0, 100)
    .map((question, index) => `${index + 1}. ${question}`)
    .join("\n");
}

export function buildQuestionGeneratorPrompt({
  level,
  skill,
  expectedAnswerLength,
  previousQuestions,
  rejectedQuestion,
}: BuildQuestionGeneratorPromptParams): string {
  const rejectedSection = rejectedQuestion
    ? `
REJECTED QUESTION

The previous generation was rejected because it was too similar to an
existing question or did not satisfy the requirements:

${rejectedQuestion}

Generate a substantially different question.
`
    : "";

  return `
You generate one question for an English CEFR placement test.

The student must answer the question in English.

TARGET

CEFR level: ${level}
Skill: ${skill}
Expected answer length: ${expectedAnswerLength}

CORE RULES

- Generate exactly one question.
- Write the question only in English.
- The question must be suitable for CEFR level ${level}.
- The question must primarily test the skill "${skill}".
- The question must encourage a natural written response.
- Do not explain grammar.
- Do not correct the student.
- Do not provide an example answer.
- Do not provide hints.
- Do not include multiple separate tasks.
- Do not ask yes/no questions unless the question also explicitly asks why.
- Do not ask for private, sensitive, medical, political, financial, sexual,
  religious, or traumatic personal information.
- Avoid topics that require specialist knowledge.
- Use neutral everyday topics.
- The question must make sense without additional context.

ANSWER LENGTH

For "short":
- expect approximately 1-2 complete sentences;
- ask a direct and simple question.

For "medium":
- expect approximately 3-5 complete sentences;
- ask the student to describe, explain, compare, or recount something.

For "long":
- expect approximately 5-8 complete sentences;
- ask for reasoning, examples, advantages and disadvantages, or a developed
  opinion.

UNIQUENESS

The new question must be meaningfully different from every previous question.

It is not enough to:
- replace one noun;
- change a place, day, person, or activity;
- use synonyms;
- change "tell me" to "describe";
- paraphrase the same underlying task.

Avoid repeating the same:
- communicative task;
- scenario;
- subject;
- time frame;
- requested opinion;
- grammatical context.

PREVIOUS QUESTIONS

${formatPreviousQuestions(previousQuestions)}

QUESTION KEY

Create a stable snake_case questionKey that describes the actual semantic task.

Good examples:
- a2_past_simple_unexpected_event
- b1_opinion_learning_from_mistakes
- b2_comparison_city_and_rural_life

The questionKey must:
- use lowercase English letters, digits, and underscores only;
- begin with the CEFR level in lowercase;
- include the tested skill or grammatical purpose;
- describe this exact question;
- not be generic;
- not duplicate a previous semantic task.

OUTPUT CONSISTENCY

Return:
- level exactly as "${level}";
- skill exactly as "${skill}";
- expectedAnswerLength exactly as "${expectedAnswerLength}".

${rejectedSection}
`.trim();
}
