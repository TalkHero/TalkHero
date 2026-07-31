import {
  QuestEngineError,
} from "./errors";


import type {
  QuestActRecord,
  QuestSceneRecord,
} from "./types";

export type ResolveNextSceneInput = {
  currentScene: QuestSceneRecord;
  acts: QuestActRecord[];
  scenes: QuestSceneRecord[];
  nextSceneCode: string | null;
};

export type ResolveNextSceneResult = {
  nextScene: QuestSceneRecord | null;
  completed: boolean;
};

function sortScenes(
  acts: QuestActRecord[],
  scenes: QuestSceneRecord[],
): QuestSceneRecord[] {
  const actOrder = new Map(
    acts.map((act) => [
      act.id,
      act.order_index,
    ]),
  );

  return [...scenes].sort((left, right) => {
    const leftAct =
      actOrder.get(left.act_id) ?? 0;

    const rightAct =
      actOrder.get(right.act_id) ?? 0;

    if (leftAct !== rightAct) {
      return leftAct - rightAct;
    }

    return (
      left.order_index -
      right.order_index
    );
  });
}

export function resolveNextScene({
  currentScene,
  acts,
  scenes,
  nextSceneCode,
}: ResolveNextSceneInput): ResolveNextSceneResult {
  if (scenes.length === 0) {
    throw new QuestEngineError(
      "SCENE_NOT_FOUND",
      "Quest has no scenes",
    );
  }

  if (nextSceneCode) {
    const scene = scenes.find(
      (item) =>
        item.scene_code === nextSceneCode,
    );

    if (!scene) {
      throw new QuestEngineError(
        "SCENE_NOT_FOUND",
        `Scene '${nextSceneCode}' not found`,
      );
    }

    return {
      nextScene: scene,
      completed: false,
    };
  }

  const ordered = sortScenes(
  acts,
  scenes,
);

  const index = ordered.findIndex(
    (scene) =>
      scene.id === currentScene.id,
  );

  if (index === -1) {
    throw new QuestEngineError(
      "SCENE_NOT_FOUND",
      "Current scene not found",
    );
  }

  const next = ordered[index + 1];

  if (!next) {
    return {
      nextScene: null,
      completed: true,
    };
  }

  return {
    nextScene: next,
    completed: false,
  };
}
