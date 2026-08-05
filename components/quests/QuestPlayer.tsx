"use client";

import { useEffect } from "react";

import { AIFeedbackCard } from "./AIFeedbackCard";
import { MissionHUD } from "./MissionHUD";
import { SceneRenderer } from "./SceneRenderer";
import { useQuest } from "./hooks/useQuest";
import { CompletionScene } from "./scenes/CompletionScene";

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

  useEffect(() => {
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
    if (quest.completed) {
      onComplete?.();
    }
  }, [quest.completed, onComplete]);

  const restartQuest = () => {
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
        className="flex min-h-56 items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm"
      >
        Завантаження місії…
      </div>
    );
  }

  if (quest.error && !quest.scene) {
    return (
      <div
        role="alert"
        className="space-y-4 rounded-3xl border border-red-200 bg-red-50 p-6"
      >
        <h2 className="text-lg font-semibold text-red-800">
          Не вдалося відкрити місію
        </h2>

        <p className="text-red-700">
          {quest.error}
        </p>

        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700"
          onClick={restartQuest}
        >
          Спробувати ще раз
        </button>
      </div>
    );
  }

  if (quest.completed) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <CompletionScene
          score={quest.score}
          xpEarned={quest.xpEarned}
          coinsEarned={quest.coinsEarned}
          onRestart={restartQuest}
        />
      </main>
    );
  }

  const livingNPC =
    quest.scene?.metadata
      .aiConversation === true;

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      {quest.quest && quest.progress && (
        <MissionHUD
          quest={quest.quest}
          progress={quest.progress}
          score={quest.score}
          xpEarned={quest.xpEarned}
          coinsEarned={quest.coinsEarned}
        />
      )}

      {quest.error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span className="font-semibold">
            Помилка:
          </span>{" "}
          {quest.error}
        </div>
      )}

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

      {!livingNPC &&
        quest.evaluation?.feedback && (
          <AIFeedbackCard
  feedback={
    quest.evaluation.feedback
  }
  isCorrect={
    quest.evaluation.isCorrect
  }
  grade={
    quest.evaluation.grade
  }
/>
        )}
    </main>
  );
}
