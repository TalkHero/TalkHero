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

const SKILL_GUIDANCE: Record<PlacementSkill, string> = {
  personal_information:
    "Ask for basic personal information using simple everyday language.",

  daily_life:
    "Ask about routines, everyday activities, habits, or familiar situations.",

  present_simple:
    "Primarily test accurate use of the present simple in a natural context.",

  past_simple:
    "Ask the learner to describe or recount a completed past event.",

  future_forms:
    "Ask about plans, predictions, arrangements, or intentions using appropriate future forms.",

  description:
    "Ask the learner to describe a person, place, object, situation, or experience clearly.",

  experience:
    "Ask the learner to describe a past experience and explain what happened or what they learned.",

  opinion:
    "Ask for a clear personal opinion supported by simple reasons or examples.",

  comparison:
    "Require a developed comparison between two realistic options, including similarities, differences, advantages, or disadvantages.",

  argumentation:
    "Require a clear position supported by multiple reasons, relevant examples, and a coherent conclusion.",

  hypothetical_reasoning:
    "Present a realistic hypothetical situation and require the learner to explain likely consequences, alternatives, and responses.",

  abstract_discussion:
    "Ask about an abstract social or personal concept and require nuanced reasoning, implications, and balanced reflection.",

  problem_solving:
    "Present a realistic multi-factor problem. Require the learner to identify constraints, compare possible solutions, justify a preferred solution, and discuss likely consequences.",

  critical_evaluation:
    "Present a claim, policy, trend, or proposed solution. Require the learner to evaluate strengths and weaknesses, consider exceptions or trade-offs, and reach a qualified judgment.",

  abstract_synthesis:
    "Present two or more abstract ideas, principles, or social trends. Require the learner to connect them, identify tensions or relationships, synthesize a broader interpretation, and support it with reasoning.",

  perspective_analysis:
    "Present contrasting viewpoints on a complex issue. Require the learner to identify assumptions, evaluate the logic of each perspective, explain where they overlap or conflict, and formulate a nuanced position.",
};

export function buildQuestionGeneratorPrompt({
  level,
  skill,
  expectedAnswerLength,
  previousQuestions,
  rejectedQuestion,
}: BuildQuestionGeneratorPromptParams): string {
  const skillGuidance = SKILL_GUIDANCE[skill];

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

SKILL-SPECIFIC GUIDANCE

${skillGuidance}

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
