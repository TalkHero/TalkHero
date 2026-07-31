"use client";

import type {
  PublicQuestScene,
} from "@/lib/quests";

import { ChoiceScene } from "./scenes/ChoiceScene";
import { CompletionScene } from "./scenes/CompletionScene";
import { DialogueScene } from "./scenes/DialogueScene";
import { InputScene } from "./scenes/InputScene";

export type SceneRendererProps = {
  scene: PublicQuestScene | null;

  loading?: boolean;

  onContinue: () => void;

  onSubmit: (
    value: unknown,
  ) => Promise<void>;
};

export function SceneRenderer({
  scene,
  loading = false,
  onContinue,
  onSubmit,
}: SceneRendererProps) {
  if (!scene) {
    return <CompletionScene />;
  }

  switch (scene.sceneType) {
    case "dialogue":
      return (
        <DialogueScene
          scene={scene}
          loading={loading}
          onContinue={onContinue}
        />
      );

    case "choice":
      return (
        <ChoiceScene
          scene={scene}
          loading={loading}
          onSubmit={onSubmit}
        />
      );

    case "input":
      return (
        <InputScene
          scene={scene}
          loading={loading}
          onSubmit={onSubmit}
        />
      );

    default:
      return (
        <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-red-700">
          Unsupported scene type:
          {" "}
          {scene.sceneType}
        </div>
      );
  }
}
