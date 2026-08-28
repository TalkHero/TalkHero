import type { CEFRLevel } from "./types";

export interface AdaptiveQuestionResult {
  targetLevel: CEFRLevel;
  estimatedLevel: CEFRLevel;

  grammar: number;
  vocabulary: number;
  comprehension: number;
  complexity: number;
  taskCompletion: number;
}

export interface AdaptiveDecision {
  action: "continue" | "finish";
  reason:
    | "need_more_evidence"
    | "level_passed"
    | "level_failed"
    | "maximum_level_reached";
}

const CEFR_LEVELS: readonly CEFRLevel[] = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
];

const PASS_SCORE = 65;

const MIN_LEVEL_EVIDENCE = 2;
const MAX_LEVEL_EVIDENCE = 3;

const DIMENSION_WEIGHTS = {
  grammar: 0.25,
  vocabulary: 0.2,
  comprehension: 0.2,
  complexity: 0.2,
  taskCompletion: 0.15,
} as const;

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

function getLevelIndex(
  level: CEFRLevel,
): number {
  return CEFR_LEVELS.indexOf(level);
}

function calculateQuestionScore(
  result: AdaptiveQuestionResult,
): number {
  return (
    clampScore(result.grammar) *
      DIMENSION_WEIGHTS.grammar +
    clampScore(result.vocabulary) *
      DIMENSION_WEIGHTS.vocabulary +
    clampScore(result.comprehension) *
      DIMENSION_WEIGHTS.comprehension +
    clampScore(result.complexity) *
      DIMENSION_WEIGHTS.complexity +
    clampScore(result.taskCompletion) *
      DIMENSION_WEIGHTS.taskCompletion
  );
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return (
    values.reduce(
      (total, value) => total + value,
      0,
    ) / values.length
  );
}

function demonstratesLevel(
  result: AdaptiveQuestionResult,
  targetLevel: CEFRLevel,
): boolean {
  return (
    getLevelIndex(result.estimatedLevel) >=
    getLevelIndex(targetLevel)
  );
}

export function decideAdaptiveProgress(
  results: AdaptiveQuestionResult[],
  currentLevel: CEFRLevel,
): AdaptiveDecision {
  const levelResults = results.filter(
    (result) =>
      result.targetLevel === currentLevel,
  );

  if (
    levelResults.length <
    MIN_LEVEL_EVIDENCE
  ) {
    return {
      action: "continue",
      reason: "need_more_evidence",
    };
  }

  const levelScore = average(
    levelResults.map(calculateQuestionScore),
  );

  const demonstratedCount =
    levelResults.filter((result) =>
      demonstratesLevel(
        result,
        currentLevel,
      ),
    ).length;

  const failedCount =
    levelResults.length -
    demonstratedCount;

  /*
   * Two consistent evaluator judgements are enough
   * to make an early decision.
   *
   * Examples for a B2 target:
   *
   * B2 + B2 -> pass
   * B1 + B1 -> fail
   * B1 + B2 -> collect more evidence
   */
  if (demonstratedCount >= 2) {
    if (currentLevel === "C2") {
      return {
        action: "finish",
        reason:
          "maximum_level_reached",
      };
    }

    if (levelScore >= PASS_SCORE) {
      return {
        action: "continue",
        reason: "level_passed",
      };
    }

    return {
      action: "finish",
      reason: "level_failed",
    };
  }

  if (failedCount >= 2) {
    return {
      action: "finish",
      reason: "level_failed",
    };
  }

  /*
   * A split decision needs a third answer.
   */
  if (
    levelResults.length <
    MAX_LEVEL_EVIDENCE
  ) {
    return {
      action: "continue",
      reason: "need_more_evidence",
    };
  }

  /*
   * With three answers, require a majority of
   * evaluator judgements at or above the target
   * CEFR level as well as sufficient performance.
   */
  const hasLevelMajority =
    demonstratedCount >
    failedCount;

  if (
    hasLevelMajority &&
    levelScore >= PASS_SCORE
  ) {
    if (currentLevel === "C2") {
      return {
        action: "finish",
        reason:
          "maximum_level_reached",
      };
    }

    return {
      action: "continue",
      reason: "level_passed",
    };
  }

  return {
    action: "finish",
    reason: "level_failed",
  };
}
