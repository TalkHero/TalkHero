"use client";

import { useCallback, useRef, useState } from "react";

import type {
  PublicQuest,
  PublicQuestScene,
  QuestCompletionSummary,
  QuestProgress,
  QuestSceneEvaluation,
  StartedQuest,
  SubmitQuestSceneResult,
} from "@/lib/quests";

import type { PendingQuestFeedback } from "./quest-feedback";

type StartQuestParams = {
  campaignSlug: string;
  episodeSlug: string;
  questSlug: string;
};

type SubmitAnswerParams = {
  userInput: unknown;
  responseTimeMs?: number | null;
};

type ApiErrorPayload = {
  error?: string;
};

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as T &
    ApiErrorPayload;

  if (!response.ok) {
    throw new Error(
      payload.error || `Request failed (${response.status})`,
    );
  }

  return payload;
}

export function useQuest() {
  const [runId, setRunId] = useState<string | null>(null);

  const [quest, setQuest] = useState<PublicQuest | null>(null);

  const [scene, setScene] = useState<PublicQuestScene | null>(null);

  const [progress, setProgress] =
    useState<QuestProgress | null>(null);

  const [evaluation, setEvaluation] =
    useState<QuestSceneEvaluation | null>(null);

  const [pendingFeedback, setPendingFeedback] =
    useState<PendingQuestFeedback | null>(null);

  const [score, setScore] = useState(0);

  const [maxScore, setMaxScore] = useState(0);

  const [xpEarned, setXpEarned] = useState(0);

  const [coinsEarned, setCoinsEarned] = useState(0);

  const [completionSummary, setCompletionSummary] =
    useState<QuestCompletionSummary | null>(null);

  const [loading, setLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [completed, setCompleted] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const submitLockRef = useRef(false);

  /*
   * Кожен новий startQuest збільшує версію.
   *
   * Асинхронна відповідь від попереднього start/submit
   * не має права змінювати state після нового запуску.
   */
  const requestVersionRef = useRef(0);

  const startQuest = useCallback(
    async (params: StartQuestParams) => {
      const requestVersion = ++requestVersionRef.current;

      /*
       * Новий запуск анулює старий submit на рівні UI.
       * Його HTTP-запит може фізично завершитися,
       * але його результат буде проігноровано.
       */
      submitLockRef.current = false;

      setLoading(true);
      setSubmitting(false);

      setError(null);
      setEvaluation(null);
      setPendingFeedback(null);
      setCompletionSummary(null);
      setCompleted(false);

      try {
        const response = await fetch("/api/quests/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params),
        });

        const result = await readJson<StartedQuest>(response);

        if (requestVersion !== requestVersionRef.current) {
          return;
        }

        setRunId(result.runId);
        setQuest(result.quest);
        setScene(result.scene);
        setProgress(result.progress);

        setScore(result.score);
        setMaxScore(result.maxScore);
        setXpEarned(result.xpEarned);
        setCoinsEarned(result.coinsEarned);

        setCompletionSummary(null);
      } catch (caught) {
        if (requestVersion !== requestVersionRef.current) {
          return;
        }

        setError(
          caught instanceof Error
            ? caught.message
            : "Failed to start quest",
        );
      } finally {
        if (requestVersion === requestVersionRef.current) {
          setLoading(false);
        }
      }
    },
    [],
  );

  const applySubmitResult = useCallback(
    (result: SubmitQuestSceneResult) => {
      setScene(result.scene);
      setProgress(result.progress);
      setEvaluation(result.evaluation);

      setScore(result.score);
      setXpEarned(result.xpEarned);
      setCoinsEarned(result.coinsEarned);

      setCompleted(result.completed);

      setCompletionSummary(
        result.completionSummary ?? null,
      );
    },
    [],
  );

  const continueAfterFeedback = useCallback(() => {
    if (!pendingFeedback) {
      return;
    }

    const result = pendingFeedback.result;

    setPendingFeedback(null);

    setScene(result.scene);
    setProgress(result.progress);

    /*
     * Feedback уже показали окремим кроком.
     * Не переносимо evaluation попередньої відповіді
     * на наступну або retry-сцену.
     */
    setEvaluation(null);

    setScore(result.score);
    setXpEarned(result.xpEarned);
    setCoinsEarned(result.coinsEarned);

    setCompleted(result.completed);

    setCompletionSummary(
      result.completionSummary ?? null,
    );
  }, [pendingFeedback]);

  const submitAnswer = useCallback(
    async ({
      userInput,
      responseTimeMs,
    }: SubmitAnswerParams) => {
      if (
        !runId ||
        !scene ||
        submitLockRef.current ||
        pendingFeedback
      ) {
        return;
      }

      const requestVersion = requestVersionRef.current;
      const answeredRunId = runId;
      const answeredScene = scene;
      const submissionId = crypto.randomUUID();

      submitLockRef.current = true;

      setSubmitting(true);
      setError(null);

      try {
        const response = await fetch("/api/quests/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
  runId: answeredRunId,
  sceneId: answeredScene.id,
  submissionId,
  userInput,
  responseTimeMs,
}),
        });

        const result =
          await readJson<SubmitQuestSceneResult>(response);

        /*
         * Поки submit виконувався, міг початися
         * інший quest/run. Старий результат ігноруємо.
         */
        if (
          requestVersion !== requestVersionRef.current ||
          result.runId !== answeredRunId
        ) {
          return;
        }

        const aiConversation =
          answeredScene.metadata.aiConversation === true;

        const shouldPauseForFeedback =
          !aiConversation &&
          Boolean(result.evaluation.feedback);

        if (shouldPauseForFeedback) {
          setEvaluation(result.evaluation);

          setPendingFeedback({
            answeredScene,
            evaluation: result.evaluation,
            result,
            userInput,
          });

          return;
        }

        applySubmitResult(result);
      } catch (caught) {
        if (requestVersion !== requestVersionRef.current) {
          return;
        }

        setError(
          caught instanceof Error
            ? caught.message
            : "Failed to submit answer",
        );
      } finally {
        /*
         * Старий запит не повинен скидати lock/loading
         * вже нового запуску або нового submit.
         */
        if (requestVersion === requestVersionRef.current) {
          submitLockRef.current = false;
          setSubmitting(false);
        }
      }
    },
    [
      runId,
      scene,
      pendingFeedback,
      applySubmitResult,
    ],
  );

  return {
    runId,
    quest,
    scene,
    progress,
    evaluation,
    pendingFeedback,

    score,
    maxScore,

    xpEarned,
    coinsEarned,

    completionSummary,

    loading,
    submitting,
    completed,
    error,

    startQuest,
    submitAnswer,
    continueAfterFeedback,
  };
}
