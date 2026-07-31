"use client";

import type {
  PublicQuestScene,
} from "@/lib/quests";

type Props = {
  scene: PublicQuestScene;
  loading?: boolean;
  onContinue: () => void;
};

export function DialogueScene({
  scene,
  loading,
  onContinue,
}: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">
        {scene.speaker}
      </h2>

      <p>{scene.content}</p>

      <button
        disabled={loading}
        onClick={onContinue}
        className="rounded-lg bg-blue-600 px-4 py-2 text-white"
      >
        Continue
      </button>
    </div>
  );
}
