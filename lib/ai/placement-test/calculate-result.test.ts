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

  it("recognizes strong and consistent C1-level performance", () => {
    const result = calculatePlacementResult([
      {
        targetLevel: "A1",
        estimatedLevel: "A2",
        grammar: 95,
        vocabulary: 94,
        comprehension: 98,
        complexity: 90,
        taskCompletion: 98,
      },
      {
        targetLevel: "A2",
        estimatedLevel: "B1",
        grammar: 94,
        vocabulary: 92,
        comprehension: 97,
        complexity: 89,
        taskCompletion: 96,
      },
      {
        targetLevel: "B1",
        estimatedLevel: "B2",
        grammar: 92,
        vocabulary: 90,
        comprehension: 95,
        complexity: 88,
        taskCompletion: 94,
      },
      {
        targetLevel: "B2",
        estimatedLevel: "C1",
        grammar: 90,
        vocabulary: 88,
        comprehension: 94,
        complexity: 87,
        taskCompletion: 93,
      },
      {
        targetLevel: "C1",
        estimatedLevel: "C1",
        grammar: 86,
        vocabulary: 88,
        comprehension: 92,
        complexity: 90,
        taskCompletion: 91,
      },
      {
        targetLevel: "C1",
        estimatedLevel: "C1",
        grammar: 88,
        vocabulary: 90,
        comprehension: 94,
        complexity: 92,
        taskCompletion: 93,
      },
    ]);

    expect(result.confirmedLevel).toBe("C1");
    expect(result.finalLevel).toBe("C1");
  });

  it("keeps a strong B2 learner at B2 when C1 performance is weak", () => {
    const result = calculatePlacementResult([
      {
        targetLevel: "A1",
        estimatedLevel: "A2",
        grammar: 92,
        vocabulary: 92,
        comprehension: 96,
        complexity: 86,
        taskCompletion: 96,
      },
      {
        targetLevel: "A2",
        estimatedLevel: "B1",
        grammar: 90,
        vocabulary: 88,
        comprehension: 94,
        complexity: 84,
        taskCompletion: 92,
      },
      {
        targetLevel: "B1",
        estimatedLevel: "B2",
        grammar: 86,
        vocabulary: 84,
        comprehension: 90,
        complexity: 82,
        taskCompletion: 90,
      },
      {
        targetLevel: "B2",
        estimatedLevel: "B2",
        grammar: 82,
        vocabulary: 84,
        comprehension: 90,
        complexity: 80,
        taskCompletion: 88,
      },
      {
        targetLevel: "C1",
        estimatedLevel: "B2",
        grammar: 58,
        vocabulary: 60,
        comprehension: 64,
        complexity: 56,
        taskCompletion: 62,
      },
      {
        targetLevel: "C1",
        estimatedLevel: "B2",
        grammar: 60,
        vocabulary: 62,
        comprehension: 66,
        complexity: 58,
        taskCompletion: 64,
      },
    ]);

    expect(result.confirmedLevel).toBe("B2");
    expect(result.finalLevel).toBe("B2");
  });

  it("does not skip a failed B2 level because of a strong C1 answer", () => {
    const result = calculatePlacementResult([
      {
        targetLevel: "A1",
        estimatedLevel: "A2",
        grammar: 90,
        vocabulary: 90,
        comprehension: 94,
        complexity: 84,
        taskCompletion: 94,
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
        estimatedLevel: "B1",
        grammar: 82,
        vocabulary: 82,
        comprehension: 88,
        complexity: 78,
        taskCompletion: 88,
      },
      {
        targetLevel: "B2",
        estimatedLevel: "B1",
        grammar: 56,
        vocabulary: 58,
        comprehension: 62,
        complexity: 54,
        taskCompletion: 60,
      },
      {
        targetLevel: "C1",
        estimatedLevel: "C1",
        grammar: 90,
        vocabulary: 92,
        comprehension: 96,
        complexity: 94,
        taskCompletion: 96,
      },
    ]);

    expect(result.confirmedLevel).toBe("B1");
    expect(result.finalLevel).toBe("B1");
  });
    it("recognizes strong and consistent C2-level performance", () => {
    const result = calculatePlacementResult([
      {
        targetLevel: "A1",
        estimatedLevel: "A2",
        grammar: 96,
        vocabulary: 95,
        comprehension: 98,
        complexity: 91,
        taskCompletion: 98,
      },
      {
        targetLevel: "A2",
        estimatedLevel: "B1",
        grammar: 95,
        vocabulary: 94,
        comprehension: 98,
        complexity: 91,
        taskCompletion: 97,
      },
      {
        targetLevel: "B1",
        estimatedLevel: "B2",
        grammar: 94,
        vocabulary: 93,
        comprehension: 97,
        complexity: 92,
        taskCompletion: 96,
      },
      {
        targetLevel: "B2",
        estimatedLevel: "C1",
        grammar: 92,
        vocabulary: 92,
        comprehension: 96,
        complexity: 91,
        taskCompletion: 95,
      },
      {
        targetLevel: "C1",
        estimatedLevel: "C1",
        grammar: 90,
        vocabulary: 92,
        comprehension: 96,
        complexity: 93,
        taskCompletion: 95,
      },
      {
        targetLevel: "C1",
        estimatedLevel: "C2",
        grammar: 92,
        vocabulary: 94,
        comprehension: 97,
        complexity: 95,
        taskCompletion: 96,
      },
      {
        targetLevel: "C2",
        estimatedLevel: "C2",
        grammar: 93,
        vocabulary: 95,
        comprehension: 98,
        complexity: 96,
        taskCompletion: 97,
      },
      {
        targetLevel: "C2",
        estimatedLevel: "C2",
        grammar: 94,
        vocabulary: 96,
        comprehension: 98,
        complexity: 97,
        taskCompletion: 98,
      },
    ]);

    expect(result.confirmedLevel).toBe("C2");
    expect(result.finalLevel).toBe("C2");
  });

  it("keeps a strong C1 learner at C1 when C2 performance is weak", () => {
    const result = calculatePlacementResult([
      {
        targetLevel: "A1",
        estimatedLevel: "A2",
        grammar: 94,
        vocabulary: 94,
        comprehension: 97,
        complexity: 89,
        taskCompletion: 97,
      },
      {
        targetLevel: "A2",
        estimatedLevel: "B1",
        grammar: 92,
        vocabulary: 92,
        comprehension: 96,
        complexity: 88,
        taskCompletion: 95,
      },
      {
        targetLevel: "B1",
        estimatedLevel: "B2",
        grammar: 90,
        vocabulary: 90,
        comprehension: 94,
        complexity: 87,
        taskCompletion: 93,
      },
      {
        targetLevel: "B2",
        estimatedLevel: "C1",
        grammar: 88,
        vocabulary: 88,
        comprehension: 93,
        complexity: 86,
        taskCompletion: 92,
      },
      {
        targetLevel: "C1",
        estimatedLevel: "C1",
        grammar: 86,
        vocabulary: 88,
        comprehension: 92,
        complexity: 89,
        taskCompletion: 91,
      },
      {
        targetLevel: "C1",
        estimatedLevel: "C1",
        grammar: 88,
        vocabulary: 90,
        comprehension: 94,
        complexity: 91,
        taskCompletion: 93,
      },
      {
        targetLevel: "C2",
        estimatedLevel: "C1",
        grammar: 62,
        vocabulary: 66,
        comprehension: 70,
        complexity: 60,
        taskCompletion: 68,
      },
      {
        targetLevel: "C2",
        estimatedLevel: "C1",
        grammar: 60,
        vocabulary: 64,
        comprehension: 68,
        complexity: 58,
        taskCompletion: 66,
      },
    ]);

    expect(result.confirmedLevel).toBe("C1");
    expect(result.finalLevel).toBe("C1");
  });
  it("does not confirm B2 when most B2 answers are estimated as B1", () => {
  const result = calculatePlacementResult([
    {
      targetLevel: "A1",
      estimatedLevel: "A2",
      grammar: 90,
      vocabulary: 85,
      comprehension: 95,
      complexity: 75,
      taskCompletion: 95,
    },
    {
      targetLevel: "A2",
      estimatedLevel: "A2",
      grammar: 88,
      vocabulary: 82,
      comprehension: 92,
      complexity: 74,
      taskCompletion: 90,
    },
    {
      targetLevel: "B1",
      estimatedLevel: "B1",
      grammar: 85,
      vocabulary: 78,
      comprehension: 90,
      complexity: 72,
      taskCompletion: 88,
    },

    // High numerical scores, but evaluator sees mostly B1.
    {
      targetLevel: "B2",
      estimatedLevel: "B1",
      grammar: 92,
      vocabulary: 70,
      comprehension: 76,
      complexity: 66,
      taskCompletion: 62,
    },
    {
      targetLevel: "B2",
      estimatedLevel: "B1",
      grammar: 93,
      vocabulary: 68,
      comprehension: 91,
      complexity: 67,
      taskCompletion: 64,
    },
    {
      targetLevel: "B2",
      estimatedLevel: "B1",
      grammar: 92,
      vocabulary: 74,
      comprehension: 87,
      complexity: 68,
      taskCompletion: 66,
    },
    {
      targetLevel: "B2",
      estimatedLevel: "B2",
      grammar: 94,
      vocabulary: 78,
      comprehension: 90,
      complexity: 80,
      taskCompletion: 78,
    },
  ]);

  expect(result.confirmedLevel).toBe("B1");
  expect(result.finalLevel).toBe("B1");
});
});
