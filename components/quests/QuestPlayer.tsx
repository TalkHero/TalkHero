"use client";

import { useEffect } from "react";

import { SceneRenderer } from "./SceneRenderer";
import { CompletionScene } from "./scenes/CompletionScene";
import { useQuest } from "./hooks/useQuest";

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

  useEffect(() => {
    void quest.startQuest({
      campaignSlug,
      episodeSlug,
      questSlug,
    });
  }, [
    campaignSlug,
    episodeSlug,
    questSlug,
  ]);

  useEffect(() => {
    if (quest.completed) {
      onComplete?.();
    }
  }, [
    quest.completed,
    onComplete,
  ]);

  if (quest.loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border p-8">
        Loading quest...
      </div>
    );
  }

  if (quest.error) {
    return (
      <div className="space-y-4 rounded-xl border border-red-300 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-700">
          Quest error
        </h2>

        <p className="text-red-600">
          {quest.error}
        </p>

        <button
          className="rounded-lg bg-red-600 px-4 py-2 text-white"
          onClick={() =>
            void quest.startQuest({
              campaignSlug,
              episodeSlug,
              questSlug,
            })
          }
        >
          Retry
        </button>
      </div>
    );
  }

  if (quest.completed) {
    return (
      <CompletionScene />
    );
  }

  return (
    <div className="space-y-6">

      {quest.progress && (
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span>
              Progress
            </span>

            <span>
              {quest.progress.current}
              {" / "}
              {quest.progress.total}
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded bg-gray-200">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{
                width: `${(quest.progress.current / quest.progress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      <SceneRenderer
        scene={quest.scene}
        loading={quest.submitting}
        onContinue={() =>
          quest.submitAnswer({
            userInput: null,
          })
        }
        onSubmit={async (value) => {
          await quest.submitAnswer({
            userInput: value,
          });
        }}
      />

      <div className="flex gap-6 text-sm text-gray-600">
        <span>
          Score: {quest.score}
        </span>

        <span>
          XP: {quest.xpEarned}
        </span>

        <span>
          Coins: {quest.coinsEarned}
        </span>
      </div>

    </div>
  );
}
