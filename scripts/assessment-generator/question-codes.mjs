const CATEGORY_CODE_MAP = {
  grammar: "GRAMMAR",
  vocabulary: "VOCABULARY",
  reading: "READING",
  cloze: "CLOZE",
  use_of_english: "USE-OF-ENGLISH",
};

function normalizeLevel(level) {
  if (
    typeof level !== "string" ||
    level.trim().length === 0
  ) {
    throw new Error(
      "Cannot create question codes without a CEFR level.",
    );
  }

  return level.trim().toUpperCase();
}

function getCategoryCode(category) {
  const categoryCode =
    CATEGORY_CODE_MAP[category];

  if (!categoryCode) {
    throw new Error(
      `Unsupported assessment category: "${category}".`,
    );
  }

  return categoryCode;
}

export function assignQuestionCodes({
  questions,
  level,
}) {
  if (!Array.isArray(questions)) {
    throw new Error(
      "assignQuestionCodes expected an array of questions.",
    );
  }

  const normalizedLevel =
    normalizeLevel(level);

  const counters = new Map();

  return questions.map((question) => {
    const category = question?.category;

    const nextNumber =
      (counters.get(category) ?? 0) + 1;

    counters.set(category, nextNumber);

    const categoryCode =
      getCategoryCode(category);

    const sequence = String(
      nextNumber,
    ).padStart(3, "0");

    return {
      ...question,
      question_code:
        `${normalizedLevel}-${categoryCode}-${sequence}`,
    };
  });
}
