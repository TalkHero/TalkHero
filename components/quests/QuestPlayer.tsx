"use client";

import { useEffect, useRef } from "react";
import { Loader2, RotateCcw } from "lucide-react";

import { AIFeedbackCard } from "./AIFeedbackCard";
import { MissionHUD } from "./MissionHUD";
import { SceneRenderer } from "./SceneRenderer";
import { useQuest } from "./hooks/useQuest";
import { CompletionScene } from "./scenes/CompletionScene";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { trackEvent } from "@/lib/analytics";

export type QuestPlayerProps = {
  campaignSlug: string;
  episodeSlug: string;
  questSlug: string;
  onComplete?: () => void;
};

export function QuestPlayer({
  campaignSlug,
  episodeSlug,
  questSlug,
  onComplete,
}: QuestPlayerProps) {
const quest = useQuest();
const { startQuest } = quest;

const trackedStartRef = useRef(false);
const trackedCompletionRef = useRef(false);
useEffect(() => {
  trackedStartRef.current = false;
  trackedCompletionRef.current = false;

  void startQuest({
    campaignSlug,
    episodeSlug,
    questSlug,
  });
}, [
  campaignSlug,
  episodeSlug,
  questSlug,
  startQuest,
]);

useEffect(() => {
  if (
    quest.loading ||
    quest.error ||
    !quest.runId ||
    !quest.scene ||
    trackedStartRef.current
  ) {
    return;
  }

  trackedStartRef.current = true;

  trackEvent("quest_started", {
    campaign: campaignSlug,
    episode: episodeSlug,
    quest: questSlug,
  });
}, [
  quest.loading,
  quest.error,
  quest.runId,
  quest.scene,
  campaignSlug,
  episodeSlug,
  questSlug,
]);

useEffect(() => {
  if (
    !quest.completed ||
    trackedCompletionRef.current
  ) {
    return;
  }

  trackedCompletionRef.current = true;

  trackEvent("quest_completed", {
    campaign: campaignSlug,
    episode: episodeSlug,
    quest: questSlug,
    score: quest.score,
    max_score: quest.maxScore,
    xp_earned: quest.xpEarned,
    coins_earned: quest.coinsEarned,
  });

  onComplete?.();
}, [
  quest.completed,
  quest.score,
  quest.maxScore,
  quest.xpEarned,
  quest.coinsEarned,
  campaignSlug,
  episodeSlug,
  questSlug,
  onComplete,
]);

useEffect(() => {
  if (
    quest.completed ||
    quest.submitting ||
    quest.scene?.sceneType !== "completion"
  ) {
    return;
  }

  void quest.submitAnswer({
    userInput: null,
  });
}, [
  quest.completed,
  quest.submitting,
  quest.scene?.sceneType,
  quest.submitAnswer,
]);

const restartQuest = () => {
  trackedStartRef.current = false;
  trackedCompletionRef.current = false;

  void startQuest({
    campaignSlug,
    episodeSlug,
    questSlug,
  });
};

  if (quest.loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mx-auto flex min-h-[360px] w-full max-w-4xl items-center justify-center px-4 py-8 sm:px-6"
      >
        <Card className="w-full max-w-sm">
          <CardContent className="flex items-center justify-center gap-3">
            <Loader2
              className="size-5 animate-spin text-primary"
              aria-hidden="true"
            />

            <span className="text-sm text-muted-foreground">
              Завантажуємо місію…
            </span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (quest.error && !quest.scene) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <Card className="border-destructive/20 bg-destructive-soft">
          <CardHeader>
            <CardTitle className="text-destructive">
              Не вдалося відкрити місію
            </CardTitle>

            <CardDescription className="text-red-700 dark:text-red-300">
              {quest.error}
            </CardDescription>
          </CardHeader>

          <CardFooter className="border-destructive/10">
            <Button type="button" variant="destructive" onClick={restartQuest}>
              <RotateCcw aria-hidden="true" />
              Спробувати ще раз
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

  if (quest.completed) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <CompletionScene
          score={quest.score}
          maxScore={quest.maxScore}
          xpEarned={quest.xpEarned}
          coinsEarned={quest.coinsEarned}
          summary={quest.completionSummary ?? undefined}
          onRestart={restartQuest}
        />
      </main>
    );
  }

  if (quest.scene?.sceneType === "completion") {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto flex min-h-[360px] w-full max-w-4xl items-center justify-center px-4 py-8 sm:px-6"
    >
      <Card className="w-full max-w-sm">
        <CardContent className="flex items-center justify-center gap-3">
          <Loader2
            className="size-5 animate-spin text-primary"
            aria-hidden="true"
          />

          <span className="text-sm text-muted-foreground">
            Завершуємо місію…
          </span>
        </CardContent>
      </Card>
    </div>
  );
}

  const livingNPC = quest.scene?.metadata.aiConversation === true;

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      {quest.quest && quest.progress ? (
        <MissionHUD
          quest={quest.quest}
          progress={quest.progress}
          score={quest.score}
          xpEarned={quest.xpEarned}
          coinsEarned={quest.coinsEarned}
        />
      ) : null}

      {quest.error ? (
        <Card
          role="alert"
          className="border-destructive/20 bg-destructive-soft"
        >
          <CardContent className="py-4 text-sm text-red-700 dark:text-red-300">
            <span className="font-semibold">Помилка:</span> {quest.error}
          </CardContent>
        </Card>
      ) : null}

      <SceneRenderer
        scene={quest.scene}
        evaluation={quest.evaluation}
        loading={quest.submitting}
        onContinue={() => {
          void quest.submitAnswer({
            userInput: null,
          });
        }}
        onSubmit={async (value) => {
          await quest.submitAnswer({
            userInput: value,
          });
        }}
      />

      {!livingNPC && quest.evaluation?.feedback ? (
        <AIFeedbackCard
          feedback={quest.evaluation.feedback}
          isCorrect={quest.evaluation.isCorrect}
          grade={quest.evaluation.grade}
        />
      ) : null}
    </main>
  );
}
