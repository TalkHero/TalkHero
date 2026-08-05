"use client";

import type {
  PublicQuestScene,
  QuestSceneEvaluation,
} from "@/lib/quests";

import { AIConversationScene } from "./scenes/AIConversationScene";
import { SCENE_REGISTRY } from "./SceneRegistry";

export type SceneRendererProps = {
  scene: PublicQuestScene | null;
  evaluation?: QuestSceneEvaluation | null;
  loading?: boolean;
  onContinue: () => void;
  onSubmit: (value: unknown) => Promise<void>;
};

export function SceneRenderer({
  scene,
  evaluation = null,
  loading = false,
  onContinue,
  onSubmit,
}: SceneRendererProps) {
  if (!scene) {
    return null;
  }

  if (
    scene.metadata.aiConversation === true
  ) {
    return (
      <AIConversationScene
        scene={scene}
        evaluation={evaluation}
        loading={loading}
        onSubmit={onSubmit}
      />
    );
  }

  const SceneComponent =
    SCENE_REGISTRY[scene.sceneType];

  if (!SceneComponent) {
    return (
      <section
        role="alert"
        className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900"
      >
        <h2 className="font-semibold">
          Цей тип сцени ще не підтримується
        </h2>

        <p className="mt-2 text-sm">
          Тип сцени:{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono">
            {scene.sceneType}
          </code>
        </p>
      </section>
    );
  }

  return (
    <SceneComponent
      scene={scene}
      loading={loading}
      onContinue={onContinue}
      onSubmit={onSubmit}
    />
  );
}
