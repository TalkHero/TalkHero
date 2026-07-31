"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  AnswerLength,
  CEFRLevel,
  PlacementEvaluation,
  PlacementSkill,
} from "@/lib/ai/placement-test";

export interface PlacementQuestion {
  id: string;
  text: string;
  level: CEFRLevel;
  skill: PlacementSkill;
  expectedAnswerLength: AnswerLength;
}

export interface PlacementProgress {
  completed: number;
  current: number;
  total: number;
}

export interface PlacementFinalResult {
  sessionId: string;
  completed: true;
  completedAt: string | null;

  finalLevel: CEFRLevel;
  finalScore: number;
  confidence: number;

  scores: {
    grammar: number;
    vocabulary: number;
    comprehension: number;
    complexity: number;
    taskCompletion: number;
  };

  answeredQuestions?: number;
  confirmedLevel?: CEFRLevel;

  resultSummary:
    | string
    | {
        text?: string;
        confirmedLevel?: CEFRLevel;
        answeredQuestions?: number;
      }
    | null;
}

export type PlacementTestStatus =
  | "idle"
  | "starting"
  | "active"
  | "answering"
  | "finishing"
  | "completed"
  | "error";

interface StartPlacementResponse {
  sessionId: string;
  completed?: boolean;

  currentQuestionIndex?: number;
  totalQuestions?: number;

  progress?: PlacementProgress;

  question?: PlacementQuestion;
  currentQuestion?: PlacementQuestion;
  nextQuestion?: PlacementQuestion;
}

interface AnswerPlacementResponse {
  sessionId: string;
  completed: boolean;

  currentQuestionIndex: number;
  totalQuestions: number;

  progress?: PlacementProgress;
  evaluation: PlacementEvaluation;
  nextQuestion: PlacementQuestion | null;
}

interface ApiErrorResponse {
  error?: string;
}

interface UsePlacementTestResult {
  status: PlacementTestStatus;
  sessionId: string | null;
  question: PlacementQuestion | null;
  progress: PlacementProgress | null;
  evaluation: PlacementEvaluation | null;
  result: PlacementFinalResult | null;
  error: string | null;

  startTest: () => Promise<void>;
  submitAnswer: (
    answer: string,
  ) => Promise<void>;
  retryFinish: () => Promise<void>;
}

const DEFAULT_ERROR =
  "Сталася помилка. Спробуйте ще раз.";

async function parseApiResponse<T>(
  response: Response,
): Promise<T> {
  const payload = (await response
    .json()
    .catch(() => null)) as
    | T
    | ApiErrorResponse
    | null;

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : DEFAULT_ERROR;

    throw new Error(message);
  }

  if (!payload) {
    throw new Error(
      "Сервер повернув порожню відповідь.",
    );
  }

  return payload as T;
}

function getStartQuestion(
  response: StartPlacementResponse,
): PlacementQuestion | null {
  return (
    response.question ??
    response.currentQuestion ??
    response.nextQuestion ??
    null
  );
}

function createProgress({
  currentQuestionIndex,
  totalQuestions,
}: {
  currentQuestionIndex?: number;
  totalQuestions?: number;
}): PlacementProgress | null {
  if (
    typeof currentQuestionIndex !==
      "number" ||
    typeof totalQuestions !== "number" ||
    totalQuestions <= 0
  ) {
    return null;
  }

  return {
    completed: currentQuestionIndex,
    current: Math.min(
      currentQuestionIndex + 1,
      totalQuestions,
    ),
    total: totalQuestions,
  };
}

export function usePlacementTest():
  UsePlacementTestResult {
  const [status, setStatus] =
    useState<PlacementTestStatus>("idle");

  const [sessionId, setSessionId] =
    useState<string | null>(null);

  const [question, setQuestion] =
    useState<PlacementQuestion | null>(
      null,
    );

  const [progress, setProgress] =
    useState<PlacementProgress | null>(
      null,
    );

  const [evaluation, setEvaluation] =
    useState<PlacementEvaluation | null>(
      null,
    );

  const [result, setResult] =
    useState<PlacementFinalResult | null>(
      null,
    );

  const [error, setError] =
    useState<string | null>(null);

  /*
   * Prevents duplicate automatic startup in
   * React Strict Mode during development.
   */
  const startedRef = useRef(false);

  const finishTest = useCallback(
    async (
      activeSessionId: string,
    ): Promise<void> => {
      setStatus("finishing");
      setError(null);

      try {
        const response = await fetch(
          "/api/placement-test/finish",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              sessionId:
                activeSessionId,
            }),
          },
        );

        const finalResult =
          await parseApiResponse<PlacementFinalResult>(
            response,
          );

        setResult(finalResult);
        setQuestion(null);
        setProgress(null);
        setStatus("completed");
      } catch (finishError) {
        console.warn(
  "Failed to finish placement test:",
  finishError,
);

        setError(
          finishError instanceof Error
            ? finishError.message
            : DEFAULT_ERROR,
        );

        setStatus("error");
      }
    },
    [],
  );

  const startTest =
    useCallback(async (): Promise<void> => {
      setStatus("starting");
      setError(null);
      setEvaluation(null);
      setResult(null);

      try {
        const response = await fetch(
          "/api/placement-test/start",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({}),
          },
        );

        const startResponse =
          await parseApiResponse<StartPlacementResponse>(
            response,
          );

        setSessionId(
          startResponse.sessionId,
        );

        if (startResponse.completed) {
          await finishTest(
            startResponse.sessionId,
          );

          return;
        }

        const activeQuestion =
          getStartQuestion(
            startResponse,
          );

        if (!activeQuestion) {
          throw new Error(
            "Не вдалося отримати питання тесту.",
          );
        }

        setQuestion(activeQuestion);

        setProgress(
          startResponse.progress ??
            createProgress({
              currentQuestionIndex:
                startResponse.currentQuestionIndex,
              totalQuestions:
                startResponse.totalQuestions,
            }),
        );

        setStatus("active");
      } catch (startError) {
        console.warn(
  "Failed to start placement test:",
  startError,
);

        setError(
          startError instanceof Error
            ? startError.message
            : DEFAULT_ERROR,
        );

        setStatus("error");
      }
    }, [finishTest]);

  const submitAnswer = useCallback(
    async (
      answer: string,
    ): Promise<void> => {
      const normalizedAnswer =
        answer.trim();

      if (
        !sessionId ||
        !question ||
        !normalizedAnswer ||
        status === "answering" ||
        status === "finishing"
      ) {
        return;
      }

      setStatus("answering");
      setError(null);
      setEvaluation(null);

      try {
        const response = await fetch(
          "/api/placement-test/answer",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              sessionId,
              questionId:
                question.id,
              answer:
                normalizedAnswer,
            }),
          },
        );

        const answerResponse =
          await parseApiResponse<AnswerPlacementResponse>(
            response,
          );

        setEvaluation(
          answerResponse.evaluation,
        );

        if (
  answerResponse.completed ||
  !answerResponse.nextQuestion
) {
  /*
   * The answer has already been saved.
   * Remove the question before finishing so it cannot
   * be submitted for a second time.
   */
  setQuestion(null);
  setProgress(null);

  await finishTest(sessionId);

  return;
}

        setQuestion(
          answerResponse.nextQuestion,
        );

        setProgress(
          answerResponse.progress ??
            createProgress({
              currentQuestionIndex:
                answerResponse.currentQuestionIndex,
              totalQuestions:
                answerResponse.totalQuestions,
            }),
        );

        setStatus("active");
      } catch (answerError) {
        console.warn(
  "Failed to submit placement answer:",
  answerError,
);

        setError(
          answerError instanceof Error
            ? answerError.message
            : DEFAULT_ERROR,
        );

        /*
         * Keep the current question available so the
         * user can retry without losing their answer.
         */
        setStatus("active");
      }
    },
    [
      finishTest,
      question,
      sessionId,
      status,
    ],
  );

  const retryFinish =
    useCallback(async (): Promise<void> => {
      if (!sessionId) {
        await startTest();

        return;
      }

      await finishTest(sessionId);
    }, [
      finishTest,
      sessionId,
      startTest,
    ]);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;

    void startTest();
  }, [startTest]);

  return {
    status,
    sessionId,
    question,
    progress,
    evaluation,
    result,
    error,
    startTest,
    submitAnswer,
    retryFinish,
  };
}
