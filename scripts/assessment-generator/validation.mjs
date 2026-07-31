import {
  getQuestionType,
  getTotalQuestionCount,
  normalizeText,
} from "./utils.mjs";

function validateQuestion({
  question,
  index,
  level,
  category,
}) {
  const prefix = `${category} question ${index + 1}`;
  const expectedType = getQuestionType(category);

  if (question.cefr_level !== level) {
    throw new Error(
      `${prefix}: expected cefr_level "${level}", received "${question.cefr_level}".`,
    );
  }

  if (question.category !== category) {
    throw new Error(
      `${prefix}: expected category "${category}", received "${question.category}".`,
    );
  }

  if (question.question_type !== expectedType) {
    throw new Error(
      `${prefix}: expected question_type "${expectedType}", received "${question.question_type}".`,
    );
  }

  if (
    typeof question.prompt !== "string" ||
    !question.prompt.trim()
  ) {
    throw new Error(`${prefix}: prompt is empty.`);
  }

  if (
    !Array.isArray(question.options) ||
    question.options.length !== 4
  ) {
    throw new Error(
      `${prefix}: exactly four answer options are required.`,
    );
  }

  const normalizedOptions = question.options.map(
    (option) => {
      if (
        typeof option !== "string" ||
        !option.trim()
      ) {
        throw new Error(
          `${prefix}: every option must be a non-empty string.`,
        );
      }

      return normalizeText(option);
    },
  );

  if (new Set(normalizedOptions).size !== 4) {
    throw new Error(
      `${prefix}: answer options must be unique.`,
    );
  }

  if (!question.options.includes(question.correct_answer)) {
    throw new Error(
      `${prefix}: correct_answer must exactly match one option.`,
    );
  }

  if (
    typeof question.explanation_uk !== "string" ||
    !question.explanation_uk.trim()
  ) {
    throw new Error(
      `${prefix}: explanation_uk is empty.`,
    );
  }

  if (category === "reading") {
    if (
      typeof question.passage !== "string" ||
      !question.passage.trim()
    ) {
      throw new Error(
        `${prefix}: reading question requires a passage.`,
      );
    }
  } else if (question.passage !== null) {
    throw new Error(
      `${prefix}: non-reading question must have passage=null.`,
    );
  }

  if (
    ["cloze", "use_of_english"].includes(category) &&
    !question.prompt.includes("___")
  ) {
    throw new Error(
      `${prefix}: prompt must contain ___.`,
    );
  }

  if (
    !Number.isInteger(question.difficulty) ||
    question.difficulty < 1 ||
    question.difficulty > 5
  ) {
    throw new Error(
      `${prefix}: difficulty must be an integer from 1 to 5.`,
    );
  }

  if (
    typeof question.discrimination !== "number" ||
    question.discrimination < 0.8 ||
    question.discrimination > 1.3
  ) {
    throw new Error(
      `${prefix}: discrimination must be between 0.8 and 1.3.`,
    );
  }

  if (
    !Number.isInteger(question.estimated_time_seconds) ||
    question.estimated_time_seconds < 20 ||
    question.estimated_time_seconds > 120
  ) {
    throw new Error(
      `${prefix}: estimated_time_seconds must be from 20 to 120.`,
    );
  }

  if (
    typeof question.topic !== "string" ||
    !question.topic.trim()
  ) {
    throw new Error(`${prefix}: topic is empty.`);
  }

  if (
    !Array.isArray(question.tags) ||
    question.tags.length === 0
  ) {
    throw new Error(
      `${prefix}: at least one tag is required.`,
    );
  }
}

export function validateCategoryQuestions({
  questions,
  level,
  category,
  expectedCount,
  existingPromptSet,
}) {
  if (!Array.isArray(questions)) {
    throw new Error(
      `Category "${category}" does not contain a questions array.`,
    );
  }

  if (questions.length !== expectedCount) {
    throw new Error(
      `Category "${category}": expected ${expectedCount}, received ${questions.length}.`,
    );
  }

  const currentPromptSet = new Set();

  questions.forEach((question, index) => {
    validateQuestion({
      question,
      index,
      level,
      category,
    });

    const normalizedPrompt = normalizeText(
      question.prompt,
    );

    if (currentPromptSet.has(normalizedPrompt)) {
      throw new Error(
        `Category "${category}" contains duplicate prompt: "${question.prompt}"`,
      );
    }

    if (existingPromptSet.has(normalizedPrompt)) {
      throw new Error(
        `Prompt duplicates another category: "${question.prompt}"`,
      );
    }

    currentPromptSet.add(normalizedPrompt);
  });
}

export function validateCompleteBank({
  questions,
  level,
  config,
}) {
  const expectedTotal =
    getTotalQuestionCount(config);

  if (questions.length !== expectedTotal) {
    throw new Error(
      `Expected ${expectedTotal} questions, received ${questions.length}.`,
    );
  }

  const promptSet = new Set();

  for (const [category, expectedCount] of Object.entries(
    config,
  )) {
    const actualCount = questions.filter(
      (question) =>
        question.cefr_level === level &&
        question.category === category,
    ).length;

    if (actualCount !== expectedCount) {
      throw new Error(
        `Category "${category}": expected ${expectedCount}, received ${actualCount}.`,
      );
    }
  }

  for (const question of questions) {
    const normalizedPrompt = normalizeText(
      question.prompt,
    );

    if (promptSet.has(normalizedPrompt)) {
      throw new Error(
        `Complete bank contains duplicate prompt: "${question.prompt}"`,
      );
    }

    promptSet.add(normalizedPrompt);
  }
}
