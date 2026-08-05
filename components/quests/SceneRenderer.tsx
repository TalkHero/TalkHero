"use client";

import type { PublicQuestScene, QuestSceneEvaluation } from "@/lib/quests";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

  if (scene.metadata.aiConversation === true) {
    return (
      <AIConversationScene
        scene={scene}
        evaluation={evaluation}
        loading={loading}
        onSubmit={onSubmit}
      />
    );
  }

  const SceneComponent = SCENE_REGISTRY[scene.sceneType];

  if (!SceneComponent) {
    return (
      <Card role="alert" className="border-warning/20 bg-warning-soft">
        <CardHeader>
          <CardTitle className="text-amber-800 dark:text-amber-200">
            Цей тип сцени ще не підтримується
          </CardTitle>

          <CardDescription className="text-amber-700 dark:text-amber-300">
            Рушій не знайшов компонент для відображення поточної сцени.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0 text-sm text-amber-800 dark:text-amber-200">
          Тип сцени:{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono dark:bg-amber-950">
            {scene.sceneType}
          </code>
        </CardContent>
      </Card>
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
