"use client";

import { useCallback, useState } from "react";

import type {
  PublicQuest,
  PublicQuestScene,
  QuestCompletionSummary,
  QuestProgress,
  QuestSceneEvaluation,
  StartedQuest,
  SubmitQuestSceneResult,
} from "@/lib/quests";

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
    throw new Error(payload.error || `Request failed (${response.status})`);
  }

  return payload;
}

export function useQuest() {
  const [runId, setRunId] = useState<string | null>(null);

  const [quest, setQuest] = useState<PublicQuest | null>(null);

  const [scene, setScene] = useState<PublicQuestScene | null>(null);

  const [progress, setProgress] = useState<QuestProgress | null>(null);

  const [evaluation, setEvaluation] = useState<QuestSceneEvaluation | null>(
    null,
  );

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

  const startQuest = useCallback(async (params: StartQuestParams) => {
    setLoading(true);
    setError(null);
    setEvaluation(null);
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

      setRunId(result.runId);
      setQuest(result.quest);
      setScene(result.scene);
      setProgress(result.progress);

      setScore(0);
      setMaxScore(result.maxScore);
      setXpEarned(0);
      setCoinsEarned(0);
      setCompletionSummary(null);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to start quest",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const submitAnswer = useCallback(
    async ({ userInput, responseTimeMs }: SubmitAnswerParams) => {
      if (!runId || submitting) {
        return;
      }

      setSubmitting(true);
      setError(null);

      try {
        const response = await fetch("/api/quests/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            runId,
            userInput,
            responseTimeMs,
          }),
        });

        const result = await readJson<SubmitQuestSceneResult>(response);

        setScene(result.scene);
        setProgress(result.progress);
        setEvaluation(result.evaluation);
        setScore(result.score);
        setXpEarned(result.xpEarned);
        setCoinsEarned(result.coinsEarned);
        setCompleted(result.completed);

        setCompletionSummary(result.completionSummary ?? null);
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "Failed to submit answer",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [runId, submitting],
  );

  return {
    runId,
    quest,
    scene,
    progress,
    evaluation,

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
  };
}
