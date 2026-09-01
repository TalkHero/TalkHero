"use client";

import type { ComponentType } from "react";

import type { PublicQuestScene } from "@/lib/quests";

import { ChoiceScene } from "./scenes/ChoiceScene";
import { DialogueScene } from "./scenes/DialogueScene";
import { InputScene } from "./scenes/InputScene";
import { NarrationScene } from "./scenes/NarrationScene";
import { TranslateScene } from "./scenes/TranslateScene";
import { VoiceScene } from "./scenes/VoiceScene";

export type RegisteredSceneProps = {
  scene: PublicQuestScene;
  loading: boolean;
  onContinue: () => void;
  onSubmit: (value: unknown) => Promise<void>;
};

function NarrationSceneAdapter({
  scene,
  loading,
  onContinue,
}: RegisteredSceneProps) {
  return (
    <NarrationScene
      scene={scene}
      loading={loading}
      onContinue={onContinue}
    />
  );
}

function DialogueSceneAdapter({
  scene,
  loading,
  onContinue,
}: RegisteredSceneProps) {
  return (
    <DialogueScene
      scene={scene}
      loading={loading}
      onContinue={onContinue}
    />
  );
}

function ChoiceSceneAdapter({
  scene,
  loading,
  onSubmit,
}: RegisteredSceneProps) {
  return (
    <ChoiceScene
      scene={scene}
      loading={loading}
      onSubmit={onSubmit}
    />
  );
}

function InputSceneAdapter({
  scene,
  loading,
  onSubmit,
}: RegisteredSceneProps) {
  return (
    <InputScene
      scene={scene}
      loading={loading}
      onSubmit={onSubmit}
    />
  );
}

function TranslateSceneAdapter({
  scene,
  loading,
  onSubmit,
}: RegisteredSceneProps) {
  return (
    <TranslateScene
      scene={scene}
      loading={loading}
      onSubmit={onSubmit}
    />
  );
}

function VoiceSceneAdapter({
  scene,
  loading,
  onSubmit,
}: RegisteredSceneProps) {
  return (
    <VoiceScene
      scene={scene}
      loading={loading}
      onSubmit={onSubmit}
    />
  );
}

export const SCENE_REGISTRY: Partial<
  Record<
    PublicQuestScene["sceneType"],
    ComponentType<RegisteredSceneProps>
  >
> = {
  narration: NarrationSceneAdapter,
  dialogue: DialogueSceneAdapter,
  completion: DialogueSceneAdapter,
  choice: ChoiceSceneAdapter,
  input: InputSceneAdapter,
  translate: TranslateSceneAdapter,
  voice: VoiceSceneAdapter,
};
