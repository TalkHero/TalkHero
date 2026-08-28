import { describe, expect, it } from "vitest";

import { decideAdaptiveProgress } from "./adaptive-plan";

function createResult({
  targetLevel,
  estimatedLevel,
  grammar = 80,
  vocabulary = 80,
  comprehension = 85,
  complexity = 75,
  taskCompletion = 85,
}: {
  targetLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  estimatedLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  grammar?: number;
  vocabulary?: number;
  comprehension?: number;
  complexity?: number;
  taskCompletion?: number;
}) {
  return {
    targetLevel,
    estimatedLevel,
    grammar,
    vocabulary,
    comprehension,
    complexity,
    taskCompletion,
  };
}

describe("decideAdaptiveProgress", () => {
  it("needs more evidence after only one answer", () => {
    const result = decideAdaptiveProgress(
      [
        createResult({
          targetLevel: "B1",
          estimatedLevel: "B1",
        }),
      ],
      "B1",
    );

    expect(result).toEqual({
      action: "continue",
      reason: "need_more_evidence",
    });
  });

  it("fails B2 after two consistent B1 estimates", () => {
    const result = decideAdaptiveProgress(
      [
        createResult({
          targetLevel: "B2",
          estimatedLevel: "B1",
        }),
        createResult({
          targetLevel: "B2",
          estimatedLevel: "B1",
        }),
      ],
      "B2",
    );

    expect(result).toEqual({
      action: "finish",
      reason: "level_failed",
    });
  });

  it("passes B2 after two consistent B2 estimates with sufficient scores", () => {
    const result = decideAdaptiveProgress(
      [
        createResult({
          targetLevel: "B2",
          estimatedLevel: "B2",
        }),
        createResult({
          targetLevel: "B2",
          estimatedLevel: "B2",
        }),
      ],
      "B2",
    );

    expect(result).toEqual({
      action: "continue",
      reason: "level_passed",
    });
  });

  it("needs more evidence after a split B1 and B2 decision", () => {
    const result = decideAdaptiveProgress(
      [
        createResult({
          targetLevel: "B2",
          estimatedLevel: "B1",
        }),
        createResult({
          targetLevel: "B2",
          estimatedLevel: "B2",
        }),
      ],
      "B2",
    );

    expect(result).toEqual({
      action: "continue",
      reason: "need_more_evidence",
    });
  });

  it("fails B2 when two of three estimates are below B2", () => {
    const result = decideAdaptiveProgress(
      [
        createResult({
          targetLevel: "B2",
          estimatedLevel: "B1",
        }),
        createResult({
          targetLevel: "B2",
          estimatedLevel: "B2",
        }),
        createResult({
          targetLevel: "B2",
          estimatedLevel: "B1",
        }),
      ],
      "B2",
    );

    expect(result).toEqual({
      action: "finish",
      reason: "level_failed",
    });
  });

  it("passes B2 when two of three estimates are B2 or higher", () => {
    const result = decideAdaptiveProgress(
      [
        createResult({
          targetLevel: "B2",
          estimatedLevel: "B1",
        }),
        createResult({
          targetLevel: "B2",
          estimatedLevel: "B2",
        }),
        createResult({
          targetLevel: "B2",
          estimatedLevel: "C1",
        }),
      ],
      "B2",
    );

    expect(result).toEqual({
      action: "continue",
      reason: "level_passed",
    });
  });

  it("does not pass a level when evaluator estimates are high but performance is too weak", () => {
    const result = decideAdaptiveProgress(
      [
        createResult({
          targetLevel: "B2",
          estimatedLevel: "B2",
          grammar: 50,
          vocabulary: 50,
          comprehension: 55,
          complexity: 45,
          taskCompletion: 55,
        }),
        createResult({
          targetLevel: "B2",
          estimatedLevel: "B2",
          grammar: 52,
          vocabulary: 50,
          comprehension: 56,
          complexity: 46,
          taskCompletion: 56,
        }),
      ],
      "B2",
    );

    expect(result).toEqual({
      action: "finish",
      reason: "level_failed",
    });
  });

  it("accepts estimates above the target level as positive evidence", () => {
    const result = decideAdaptiveProgress(
      [
        createResult({
          targetLevel: "C1",
          estimatedLevel: "C1",
        }),
        createResult({
          targetLevel: "C1",
          estimatedLevel: "C2",
        }),
      ],
      "C1",
    );

    expect(result).toEqual({
      action: "continue",
      reason: "level_passed",
    });
  });

  it("finishes after two strong C2 estimates", () => {
    const result = decideAdaptiveProgress(
      [
        createResult({
          targetLevel: "C2",
          estimatedLevel: "C2",
          grammar: 92,
          vocabulary: 94,
          comprehension: 96,
          complexity: 95,
          taskCompletion: 95,
        }),
        createResult({
          targetLevel: "C2",
          estimatedLevel: "C2",
          grammar: 94,
          vocabulary: 95,
          comprehension: 97,
          complexity: 96,
          taskCompletion: 96,
        }),
      ],
      "C2",
    );

    expect(result).toEqual({
      action: "finish",
      reason: "maximum_level_reached",
    });
  });

  it("ignores evidence from other CEFR levels", () => {
    const result = decideAdaptiveProgress(
      [
        createResult({
          targetLevel: "A2",
          estimatedLevel: "C2",
        }),
        createResult({
          targetLevel: "B1",
          estimatedLevel: "B1",
        }),
      ],
      "B1",
    );

    expect(result).toEqual({
      action: "continue",
      reason: "need_more_evidence",
    });
  });
});
