import { describe, expect, it } from "vitest";

import { calculatePlacementResult } from "./calculate-result";

describe("calculatePlacementResult", () => {
  it("does not underrate a learner with consistent B1-level performance", () => {
    const result = calculatePlacementResult([
      {
        targetLevel: "A1",
        estimatedLevel: "A2",
        grammar: 85,
        vocabulary: 85,
        comprehension: 90,
        complexity: 75,
        taskCompletion: 90,
      },
      {
        targetLevel: "A2",
        estimatedLevel: "B1",
        grammar: 78,
        vocabulary: 75,
        comprehension: 82,
        complexity: 70,
        taskCompletion: 80,
      },
      {
        targetLevel: "B1",
        estimatedLevel: "B1",
        grammar: 72,
        vocabulary: 70,
        comprehension: 78,
        complexity: 66,
        taskCompletion: 76,
      },
      {
        targetLevel: "B1",
        estimatedLevel: "B1",
        grammar: 68,
        vocabulary: 70,
        comprehension: 75,
        complexity: 64,
        taskCompletion: 72,
      },
      {
        targetLevel: "B2",
        estimatedLevel: "B1",
        grammar: 58,
        vocabulary: 62,
        comprehension: 70,
        complexity: 55,
        taskCompletion: 65,
      },
    ]);

    expect(result.finalLevel).toBe("B1");
  });

  it("does not overrate a beginner", () => {
    const result = calculatePlacementResult([
      {
        targetLevel: "A1",
        estimatedLevel: "A1",
        grammar: 45,
        vocabulary: 50,
        comprehension: 55,
        complexity: 35,
        taskCompletion: 55,
      },
      {
        targetLevel: "A2",
        estimatedLevel: "A1",
        grammar: 35,
        vocabulary: 40,
        comprehension: 45,
        complexity: 30,
        taskCompletion: 45,
      },
    ]);

    expect(result.finalLevel).toBe("A1");
  });

  it("recognizes consistent B2-level performance", () => {
    const result = calculatePlacementResult([
      {
        targetLevel: "A1",
        estimatedLevel: "B1",
        grammar: 90,
        vocabulary: 90,
        comprehension: 95,
        complexity: 85,
        taskCompletion: 95,
      },
      {
        targetLevel: "A2",
        estimatedLevel: "B1",
        grammar: 88,
        vocabulary: 86,
        comprehension: 92,
        complexity: 82,
        taskCompletion: 90,
      },
      {
        targetLevel: "B1",
        estimatedLevel: "B2",
        grammar: 82,
        vocabulary: 84,
        comprehension: 88,
        complexity: 78,
        taskCompletion: 88,
      },
      {
        targetLevel: "B2",
        estimatedLevel: "B2",
        grammar: 76,
        vocabulary: 78,
        comprehension: 84,
        complexity: 74,
        taskCompletion: 82,
      },
      {
        targetLevel: "C1",
        estimatedLevel: "B2",
        grammar: 58,
        vocabulary: 62,
        comprehension: 68,
        complexity: 55,
        taskCompletion: 65,
      },
    ]);

    expect(result.finalLevel).toBe("B2");
  });
});
