"use client";

import {
  ArrowRight,
  Loader2,
  RotateCcw,
} from "lucide-react";

import {
  useEffect,
  useRef,
} from "react";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  trackEvent,
} from "@/lib/analytics";

import type {
  PublicQuestScene,
  QuestSceneEvaluation,
} from "@/lib/quests";

import {
  getNPCById,
  getNPCBySpeaker,
  type NPC,
} from "@/lib/quests/npcs";

import {
  AIFeedbackCard,
} from "./AIFeedbackCard";

import {
  MissionHUD,
} from "./MissionHUD";

import {
  NPCCard,
} from "./NPCCard";

import {
  SceneRenderer,
} from "./SceneRenderer";

import {
  useNPCSpeech,
} from "./hooks/useNPCSpeech";

import {
  useQuest,
} from "./hooks/useQuest";

import {
  CompletionScene,
} from "./scenes/CompletionScene";

export type QuestPlayerProps = {
  campaignSlug: string;
  episodeSlug: string;
  questSlug: string;
  onComplete?: () => void;
};

const INTERACTIVE_SCENE_TYPES =
  new Set([
    "choice",
    "input",
    "translate",
    "voice",
  ]);

function getMetadataString(
  metadata: Record<
    string,
    unknown
  >,
  key: string,
): string | null {
  const value =
    metadata[key];

  return typeof value === "string" &&
    value.trim()
    ? value.trim()
    : null;
}

function getEvaluationString(
  evaluation:
    | QuestSceneEvaluation
    | null
    | undefined,
  key: string,
): string | null {
  const value =
    evaluation?.metadata?.[key];

  return typeof value === "string" &&
    value.trim()
    ? value.trim()
    : null;
}

function createFallbackNPC(
  scene: PublicQuestScene,
): NPC {
  const speaker =
    scene.speaker?.trim() ||
    "Персонаж";

  return {
    id: speaker
      .toLowerCase()
      .replace(/\s+/g, "-"),

    name: speaker,

    role:
      getMetadataString(
        scene.metadata,
        "role",
      ) ||
      "Співрозмовник",

    avatar:
      getMetadataString(
        scene.metadata,
        "avatar",
      ) ||
      "💬",

    emotion: "neutral",

    accent: "neutral",

    voiceId: null,

    theme: "slate",
  };
}

function resolveNPC(
  scene: PublicQuestScene,
): NPC {
  const npcId =
    getMetadataString(
      scene.metadata,
      "npcId",
    );

  return (
    (npcId
      ? getNPCById(npcId)
      : null) ??
    getNPCBySpeaker(
      scene.speaker,
    ) ??
    createFallbackNPC(scene)
  );
}

function buildSpeechInstructions(
  npc: NPC,
): string {
  const accent =
    npc.accent === "british"
      ? "Use a natural British English accent."
      : npc.accent ===
          "american"
        ? "Use a natural American English accent."
        : "Use clear neutral English pronunciation.";

  return [
    accent,
    "Sound friendly and natural.",
    "Speak clearly and at a comfortable pace for an English learner.",
  ].join(" ");
}

type QuestNPCContextProps = {
  scene: PublicQuestScene;
  text: string;
};

function QuestNPCContext({
  scene,
  text,
}: QuestNPCContextProps) {
  const npc =
    resolveNPC(scene);

  const speech =
    useNPCSpeech({
      text,
      voice: npc.voiceId,
      instructions:
        buildSpeechInstructions(
          npc,
        ),
    });

  return (
    <div className="space-y-2">
      <NPCCard
        npc={npc}
        emotion={npc.emotion}
        showListenButton={
          npc.voiceId !== null
        }
        listening={
          speech.loading ||
          speech.playing
        }
        onListen={() => {
          void speech.play();
        }}
      >
        {text}
      </NPCCard>

      {speech.error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-300"
        >
          {speech.error}
        </p>
      ) : null}
    </div>
  );
}

function getFeedbackReaction({
  evaluation,
}: {
  evaluation: QuestSceneEvaluation;
}): string {
  const npcReply =
    getEvaluationString(
      evaluation,
      "npcReply",
    );

  if (npcReply) {
    return npcReply;
  }

  if (
    evaluation.isCorrect === true
  ) {
    return "Great! That sounds good.";
  }

  if (
    evaluation.grade ===
    "almost"
  ) {
    return "Almost! Let’s make it sound a little more natural.";
  }

  return "Let’s try that one more time.";
}

export function QuestPlayer({
  campaignSlug,
  episodeSlug,
  questSlug,
  onComplete,
}: QuestPlayerProps) {
  const quest = useQuest();

  const {
    startQuest,
  } = quest;

  const trackedStartRef =
    useRef(false);

  const trackedCompletionRef =
    useRef(false);

  const lastSubmittedAnswerRef =
    useRef<unknown>(null);

  /*
   * Остання справжня dialogue-сцена.
   *
   * Вона потрібна для затвердженого UI:
   *
   * NPC
   * ↓
   * ТВОЄ ЗАВДАННЯ
   * ↓
   * FEEDBACK
   *
   * На static input/choice/translate сценах scene.content —
   * це часто опис ситуації, а не репліка NPC.
   */
  const lastDialogueSceneRef =
    useRef<PublicQuestScene | null>(
      null,
    );

  useEffect(() => {
    trackedStartRef.current =
      false;

    trackedCompletionRef.current =
      false;

    lastSubmittedAnswerRef.current =
      null;

    lastDialogueSceneRef.current =
      null;

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

  /*
   * Якщо quest відкрився одразу на dialogue
   * або користувач resumed саме dialogue —
   * запам'ятовуємо сцену.
   */
  useEffect(() => {
    if (
      quest.scene?.sceneType ===
      "dialogue"
    ) {
      lastDialogueSceneRef.current =
        quest.scene;
    }
  }, [
    quest.scene,
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

    trackedStartRef.current =
      true;

    trackEvent(
      "quest_started",
      {
        campaign:
          campaignSlug,

        episode:
          episodeSlug,

        quest:
          questSlug,
      },
    );
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

    trackedCompletionRef.current =
      true;

    trackEvent(
      "quest_completed",
      {
        campaign:
          campaignSlug,

        episode:
          episodeSlug,

        quest:
          questSlug,

        score:
          quest.score,

        max_score:
          quest.maxScore,

        xp_earned:
          quest.xpEarned,

        coins_earned:
          quest.coinsEarned,
      },
    );

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
      quest.scene
        ?.sceneType !==
        "completion"
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

  function restartQuest() {
    trackedStartRef.current =
      false;

    trackedCompletionRef.current =
      false;

    lastSubmittedAnswerRef.current =
      null;

    lastDialogueSceneRef.current =
      null;

    void startQuest({
      campaignSlug,
      episodeSlug,
      questSlug,
    });
  }

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

  if (
    quest.error &&
    !quest.scene
  ) {
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

          <CardFooter>
            <Button
              type="button"
              variant="destructive"
              onClick={
                restartQuest
              }
            >
              <RotateCcw
                aria-hidden="true"
              />

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
          maxScore={
            quest.maxScore
          }
          xpEarned={
            quest.xpEarned
          }
          coinsEarned={
            quest.coinsEarned
          }
          summary={
            quest.completionSummary ??
            undefined
          }
          onRestart={
            restartQuest
          }
        />
      </main>
    );
  }

  if (
    quest.scene?.sceneType ===
    "completion"
  ) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mx-auto flex min-h-[360px] w-full max-w-4xl items-center justify-center px-4 py-8 sm:px-6"
      >
        <Loader2
          className="size-6 animate-spin text-indigo-600"
          aria-hidden="true"
        />

        <span className="ml-3 text-sm text-slate-500">
          Завершуємо місію…
        </span>
      </div>
    );
  }

  /*
   * FEEDBACK STATE
   */
  if (
    quest.pendingFeedback
  ) {
    const {
      answeredScene,
      evaluation,
      result,
    } =
      quest.pendingFeedback;

    const isRetry =
      !result.completed &&
      result.scene?.id ===
        answeredScene.id &&
      evaluation.isCorrect ===
        false;

    const npcContext =
      lastDialogueSceneRef.current;

    const shouldShowNPC =
      npcContext !== null &&
      answeredScene.metadata
        .aiConversation !== true;

    return (
      <main className="mx-auto w-full max-w-4xl space-y-4 px-3 py-4 sm:space-y-5 sm:px-6 sm:py-7">
        {quest.quest &&
        quest.progress ? (
          <MissionHUD
            quest={
              quest.quest
            }
            progress={
              quest.progress
            }
            score={
              quest.score
            }
            xpEarned={
              quest.xpEarned
            }
            coinsEarned={
              quest.coinsEarned
            }
          />
        ) : null}

        {quest.error ? (
          <div
            role="alert"
            className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            {quest.error}
          </div>
        ) : null}

        {shouldShowNPC &&
        npcContext ? (
          <QuestNPCContext
            scene={
              npcContext
            }
            text={getFeedbackReaction({
              evaluation,
            })}
          />
        ) : null}

        {evaluation.feedback ? (
          <AIFeedbackCard
            feedback={
              evaluation.feedback
            }
            isCorrect={
              evaluation.isCorrect
            }
            grade={
              evaluation.grade
            }
            scene={
              answeredScene
            }
            userAnswer={
              lastSubmittedAnswerRef.current
            }
            suggestedAnswer={
              getEvaluationString(
                evaluation,
                "suggestedAnswer",
              )
            }
          />
        ) : null}

        <Button
          type="button"
          autoFocus
          onClick={
            quest.continueAfterFeedback
          }
          className="min-h-[52px] w-full rounded-full text-sm font-bold"
        >
          {result.completed
            ? "До результатів"
            : isRetry
              ? "Спробувати ще раз"
              : "Продовжити"}

          <ArrowRight
            className="size-4"
            aria-hidden="true"
          />
        </Button>
      </main>
    );
  }

  const livingNPC =
    quest.scene?.metadata
      .aiConversation === true;

  const interactiveScene =
    quest.scene &&
    INTERACTIVE_SCENE_TYPES.has(
      quest.scene.sceneType,
    );

  const contextScene =
    interactiveScene &&
    !livingNPC
      ? lastDialogueSceneRef.current
      : null;

  return (
    <main className="mx-auto w-full max-w-4xl space-y-4 px-3 py-4 sm:space-y-5 sm:px-6 sm:py-7">
      {quest.quest &&
      quest.progress ? (
        <MissionHUD
          quest={
            quest.quest
          }
          progress={
            quest.progress
          }
          score={
            quest.score
          }
          xpEarned={
            quest.xpEarned
          }
          coinsEarned={
            quest.coinsEarned
          }
        />
      ) : null}

      {quest.error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {quest.error}
        </div>
      ) : null}

      {contextScene ? (
        <QuestNPCContext
          scene={contextScene}
          text={
            contextScene.content
          }
        />
      ) : null}

      <SceneRenderer
        scene={quest.scene}
        evaluation={
          quest.evaluation
        }
        loading={
          quest.submitting
        }
        onContinue={() => {
          /*
           * Запам'ятовуємо dialogue ДО submit,
           * щоб наступна task-сцена мала правильну
           * попередню репліку NPC.
           */
          if (
            quest.scene
              ?.sceneType ===
            "dialogue"
          ) {
            lastDialogueSceneRef.current =
              quest.scene;
          }

          lastSubmittedAnswerRef.current =
            null;

          void quest.submitAnswer({
            userInput: null,
          });
        }}
        onSubmit={async (
          value,
        ) => {
          lastSubmittedAnswerRef.current =
            value;

          await quest.submitAnswer({
            userInput:
              value,
          });
        }}
      />

      {!livingNPC &&
      quest.evaluation
        ?.feedback ? (
        <AIFeedbackCard
          feedback={
            quest.evaluation
              .feedback
          }
          isCorrect={
            quest.evaluation
              .isCorrect
          }
          grade={
            quest.evaluation
              .grade
          }
          scene={
            quest.scene
          }
          userAnswer={
            lastSubmittedAnswerRef.current
          }
          suggestedAnswer={
            getEvaluationString(
              quest.evaluation,
              "suggestedAnswer",
            )
          }
        />
      ) : null}
    </main>
  );
}
