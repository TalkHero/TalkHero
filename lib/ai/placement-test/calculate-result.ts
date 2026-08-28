import type { CEFRLevel } from "./types";

const CEFR_LEVELS: readonly CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

const DIMENSION_WEIGHTS = {
  grammar: 0.25,
  vocabulary: 0.2,
  comprehension: 0.2,
  complexity: 0.2,
  taskCompletion: 0.15,
} as const;

const MIN_SCORE = 0;
const MAX_SCORE = 100;
const PASSING_LEVEL_SCORE = 65;

export interface PlacementResultQuestion {
  targetLevel: CEFRLevel;
  estimatedLevel: CEFRLevel;

  grammar: number;
  vocabulary: number;
  comprehension: number;
  complexity: number;
  taskCompletion: number;
}

export interface PlacementDimensionScores {
  grammar: number;
  vocabulary: number;
  comprehension: number;
  complexity: number;
  taskCompletion: number;
}

export interface PlacementLevelPerformance {
  level: CEFRLevel;
  questionCount: number;
  averageScore: number;
  passed: boolean;
}

export interface PlacementResult {
  finalLevel: CEFRLevel;
  finalScore: number;
  confidence: number;

  grammarScore: number;
  vocabularyScore: number;
  comprehensionScore: number;
  complexityScore: number;
  taskCompletionScore: number;

  answeredQuestions: number;
  confirmedLevel: CEFRLevel;
  levelPerformance: PlacementLevelPerformance[];
  resultSummary: string;
}

interface ScoredPlacementQuestion extends PlacementResultQuestion {
  overallScore: number;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function roundScore(value: number): number {
  return Math.round(clamp(value, MIN_SCORE, MAX_SCORE));
}

function normalizeScore(value: number): number {
  if (!Number.isFinite(value)) {
    return MIN_SCORE;
  }

  return clamp(value, MIN_SCORE, MAX_SCORE);
}

function getLevelIndex(level: CEFRLevel): number {
  const index = CEFR_LEVELS.indexOf(level);

  if (index === -1) {
    return 0;
  }

  return index;
}

function getLevelByIndex(index: number): CEFRLevel {
  const normalizedIndex = Math.round(clamp(index, 0, CEFR_LEVELS.length - 1));

  return CEFR_LEVELS[normalizedIndex];
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  if (values.length <= 1) {
    return 0;
  }

  const mean = average(values);

  const variance = average(
    values.map((value) => {
      const difference = value - mean;

      return difference * difference;
    }),
  );

  return Math.sqrt(variance);
}

function calculateQuestionScore(question: PlacementResultQuestion): number {
  return (
    normalizeScore(question.grammar) * DIMENSION_WEIGHTS.grammar +
    normalizeScore(question.vocabulary) * DIMENSION_WEIGHTS.vocabulary +
    normalizeScore(question.comprehension) * DIMENSION_WEIGHTS.comprehension +
    normalizeScore(question.complexity) * DIMENSION_WEIGHTS.complexity +
    normalizeScore(question.taskCompletion) * DIMENSION_WEIGHTS.taskCompletion
  );
}

function calculateDimensionScores(
  questions: ScoredPlacementQuestion[],
): PlacementDimensionScores {
  return {
    grammar: roundScore(average(questions.map((question) => question.grammar))),

    vocabulary: roundScore(
      average(questions.map((question) => question.vocabulary)),
    ),

    comprehension: roundScore(
      average(questions.map((question) => question.comprehension)),
    ),

    complexity: roundScore(
      average(questions.map((question) => question.complexity)),
    ),

    taskCompletion: roundScore(
      average(questions.map((question) => question.taskCompletion)),
    ),
  };
}

function calculateLevelPerformance(
  questions: ScoredPlacementQuestion[],
): PlacementLevelPerformance[] {
  return CEFR_LEVELS.map((level) => {
    const matchingQuestions = questions.filter(
      (question) =>
        question.targetLevel === level,
    );

    const averageScore = roundScore(
      average(
        matchingQuestions.map(
          (question) =>
            question.overallScore,
        ),
      ),
    );

    const demonstratedLevelCount =
      matchingQuestions.filter(
        (question) =>
          getLevelIndex(
            question.estimatedLevel,
          ) >= getLevelIndex(level),
      ).length;

    const requiredLevelEvidence =
      Math.ceil(
        matchingQuestions.length / 2,
      );

    const hasEnoughEvaluatorEvidence =
      matchingQuestions.length > 0 &&
      demonstratedLevelCount >=
        requiredLevelEvidence;

    return {
      level,
      questionCount:
        matchingQuestions.length,
      averageScore,
      passed:
        matchingQuestions.length > 0 &&
        averageScore >=
          PASSING_LEVEL_SCORE &&
        hasEnoughEvaluatorEvidence,
    };
  }).filter(
    (performance) =>
      performance.questionCount > 0,
  );
}

function calculateConfirmedLevel(
  levelPerformance: PlacementLevelPerformance[],
): CEFRLevel {
  let confirmedLevel: CEFRLevel = "A1";

  for (let index = 0; index < CEFR_LEVELS.length; index += 1) {
    const level = CEFR_LEVELS[index];

    const performance = levelPerformance.find((item) => item.level === level);

    /*
     * A level can only be confirmed when there is
     * evidence for it and the average result reaches
     * the passing threshold.
     */
    if (!performance) {
      continue;
    }

    if (performance.passed) {
      confirmedLevel = level;
      continue;
    }

    /*
     * Stop at the first tested level that was not
     * passed. This prevents a single unusually good
     * advanced answer from skipping weak lower levels.
     */
    break;
  }

  return confirmedLevel;
}

function calculatePerformanceAbility(
  questions: ScoredPlacementQuestion[],
): number {
  const weightedAbilityTotal = questions.reduce((total, question) => {
    const targetLevelIndex = getLevelIndex(question.targetLevel);

    /*
     * A score of 70 means the student performs
     * approximately at the target level.
     *
     * Every 20 score points move the demonstrated
     * ability by roughly one CEFR band.
     */
    const scoreAdjustment = (question.overallScore - 70) / 20;

    const demonstratedAbility = clamp(
      targetLevelIndex + scoreAdjustment,
      0,
      CEFR_LEVELS.length - 1,
    );

    /*
     * Harder questions provide slightly more
     * information than easier questions.
     */
    const difficultyWeight = 1 + targetLevelIndex * 0.12;

    return total + demonstratedAbility * difficultyWeight;
  }, 0);

  const totalWeight = questions.reduce((total, question) => {
    const targetLevelIndex = getLevelIndex(question.targetLevel);

    return total + 1 + targetLevelIndex * 0.12;
  }, 0);

  if (totalWeight === 0) {
    return 0;
  }

  return weightedAbilityTotal / totalWeight;
}

function calculateEvaluatorAbility(
  questions: ScoredPlacementQuestion[],
): number {
  const weightedLevelTotal = questions.reduce((total, question) => {
    const reliability = clamp(
      (normalizeScore(question.comprehension) +
        normalizeScore(question.taskCompletion)) /
        200,
      0.2,
      1,
    );

    return total + getLevelIndex(question.estimatedLevel) * reliability;
  }, 0);

  const totalReliability = questions.reduce((total, question) => {
    const reliability = clamp(
      (normalizeScore(question.comprehension) +
        normalizeScore(question.taskCompletion)) /
        200,
      0.2,
      1,
    );

    return total + reliability;
  }, 0);

  if (totalReliability === 0) {
    return 0;
  }

  return weightedLevelTotal / totalReliability;
}

function calculateFinalLevel(
  questions: ScoredPlacementQuestion[],
  confirmedLevel: CEFRLevel,
): CEFRLevel {
  const levelPerformance = calculateLevelPerformance(questions);

  const confirmedLevelIndex = getLevelIndex(confirmedLevel);

  const confirmedPerformance = levelPerformance.find(
    (performance) => performance.level === confirmedLevel,
  );

  const nextLevelIndex = confirmedLevelIndex + 1;

  if (nextLevelIndex >= CEFR_LEVELS.length) {
    return confirmedLevel;
  }

  const nextLevel = CEFR_LEVELS[nextLevelIndex];

  const nextPerformance = levelPerformance.find(
    (performance) => performance.level === nextLevel,
  );

  /*
   * No evidence for the next level means we keep
   * the highest consistently confirmed level.
   */
  if (!nextPerformance) {
    return confirmedLevel;
  }

  /*
   * Higher CEFR levels require slightly stronger
   * evidence because the placement test contains
   * fewer advanced questions.
   */
  const promotionThreshold =
    nextLevel === "C1" || nextLevel === "C2"
      ? 72
      : 68;

  /*
   * Do not promote when the confirmed level itself
   * was only barely demonstrated.
   */
  const confirmedLevelIsStable =
    !confirmedPerformance ||
    confirmedPerformance.averageScore >= PASSING_LEVEL_SCORE;

  if (
  confirmedLevelIsStable &&
  nextPerformance.passed &&
  nextPerformance.averageScore >= promotionThreshold
) {
  return nextLevel;
}

  return confirmedLevel;
}

function calculateConfidence({
  questions,
  finalLevel,
  levelPerformance,
}: {
  questions: ScoredPlacementQuestion[];
  finalLevel: CEFRLevel;
  levelPerformance: PlacementLevelPerformance[];
}): number {
  const questionCountConfidence = clamp(
  questions.length / 16,
  0,
  1,
);

  const testedLevels = new Set(
    questions.map((question) => question.targetLevel),
  );

  const levelCoverageConfidence = clamp(
  testedLevels.size / 6,
  0,
  1,
);

  const questionScores = questions.map((question) => question.overallScore);

  const deviation = standardDeviation(questionScores);

  const consistencyConfidence = clamp(1 - deviation / 35, 0, 1);

  const finalLevelPerformance = levelPerformance.find(
    (performance) => performance.level === finalLevel,
  );

  const boundaryConfidence = finalLevelPerformance
    ? clamp(
        Math.abs(finalLevelPerformance.averageScore - PASSING_LEVEL_SCORE) / 25,
        0.35,
        1,
      )
    : 0.45;

  const averageTaskCompletion = average(
    questions.map((question) => normalizeScore(question.taskCompletion) / 100),
  );

  const confidence =
    questionCountConfidence * 0.3 +
    levelCoverageConfidence * 0.2 +
    consistencyConfidence * 0.25 +
    boundaryConfidence * 0.1 +
    averageTaskCompletion * 0.15;

  return roundScore(confidence * 100);
}

function describeStrength(scores: PlacementDimensionScores): string {
  const dimensions = [
    {
      label: "граматика",
      score: scores.grammar,
    },
    {
      label: "словниковий запас",
      score: scores.vocabulary,
    },
    {
      label: "розуміння завдання",
      score: scores.comprehension,
    },
    {
      label: "складність мовлення",
      score: scores.complexity,
    },
    {
      label: "виконання завдання",
      score: scores.taskCompletion,
    },
  ];

  const strongestDimension = [...dimensions].sort(
    (first, second) => second.score - first.score,
  )[0];

  return strongestDimension.label;
}

function describeImprovementArea(scores: PlacementDimensionScores): string {
  const dimensions = [
    {
      label: "точністю граматичних конструкцій",
      score: scores.grammar,
    },
    {
      label: "розширенням словникового запасу",
      score: scores.vocabulary,
    },
    {
      label: "точнішим розумінням запитань",
      score: scores.comprehension,
    },
    {
      label: "використанням складніших речень",
      score: scores.complexity,
    },
    {
      label: "повнотою відповідей",
      score: scores.taskCompletion,
    },
  ];

  const weakestDimension = [...dimensions].sort(
    (first, second) => first.score - second.score,
  )[0];

  return weakestDimension.label;
}

function buildResultSummary({
  finalLevel,
  finalScore,
  confidence,
  scores,
}: {
  finalLevel: CEFRLevel;
  finalScore: number;
  confidence: number;
  scores: PlacementDimensionScores;
}): string {
  const strength = describeStrength(scores);

  const improvementArea = describeImprovementArea(scores);

  return [
    `Визначений рівень англійської — ${finalLevel}.`,
    `Загальний результат — ${finalScore} зі 100, впевненість оцінювання — ${confidence}%.`,
    `Найсильніша сторона: ${strength}.`,
    `Для подальшого прогресу варто попрацювати над ${improvementArea}.`,
  ].join(" ");
}

function validateQuestions(questions: PlacementResultQuestion[]): void {
  if (questions.length === 0) {
    throw new Error("At least one answered placement question is required.");
  }

  for (const question of questions) {
    if (!CEFR_LEVELS.includes(question.targetLevel)) {
      throw new Error(
        `Unsupported target CEFR level: ${question.targetLevel}.`,
      );
    }

    if (!CEFR_LEVELS.includes(question.estimatedLevel)) {
      throw new Error(
        `Unsupported estimated CEFR level: ${question.estimatedLevel}.`,
      );
    }
  }
}

export function calculatePlacementResult(
  inputQuestions: PlacementResultQuestion[],
): PlacementResult {
  validateQuestions(inputQuestions);

  const questions: ScoredPlacementQuestion[] = inputQuestions.map(
    (question) => {
      const normalizedQuestion = {
        ...question,
        grammar: normalizeScore(question.grammar),
        vocabulary: normalizeScore(question.vocabulary),
        comprehension: normalizeScore(question.comprehension),
        complexity: normalizeScore(question.complexity),
        taskCompletion: normalizeScore(question.taskCompletion),
      };

      return {
        ...normalizedQuestion,
        overallScore: calculateQuestionScore(normalizedQuestion),
      };
    },
  );

  const scores = calculateDimensionScores(questions);

  const levelPerformance = calculateLevelPerformance(questions);

  const confirmedLevel = calculateConfirmedLevel(levelPerformance);

  const finalLevel = calculateFinalLevel(questions, confirmedLevel);

  const finalScore = roundScore(
    questions.reduce((total, question) => total + question.overallScore, 0) /
      questions.length,
  );

  const confidence = calculateConfidence({
    questions,
    finalLevel,
    levelPerformance,
  });

  const resultSummary = buildResultSummary({
    finalLevel,
    finalScore,
    confidence,
    scores,
  });

  return {
    finalLevel,
    finalScore,
    confidence,

    grammarScore: scores.grammar,
    vocabularyScore: scores.vocabulary,
    comprehensionScore: scores.comprehension,
    complexityScore: scores.complexity,
    taskCompletionScore: scores.taskCompletion,

    answeredQuestions: questions.length,
    confirmedLevel,
    levelPerformance,
    resultSummary,
  };
}
