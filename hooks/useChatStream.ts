"use client";

import { useCallback } from "react";
import { API_ERRORS, UI_ERRORS } from "@/lib/i18n/errors";

export type ChatXpReward = {
  amount: number;
  totalXp: number;
  level: number;
};

export type DailyStreak = {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  streakIncreased: boolean;
};

export type UnlockedAchievement = {
  achievementId: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockedAt: string;
};

type StreamChatOptions = {
  text: string;
  conversationId: string | null;
  assistantMessageId: string;
  onConversationId: (conversationId: string) => void;
  onConversationTitle: (title: string) => void;
  onDelta: (assistantMessageId: string, text: string) => void;
  onXpAwarded: (reward: ChatXpReward) => void;
  onStreakUpdated: (streak: DailyStreak) => void;
  onAchievementsUnlocked: (achievements: UnlockedAchievement[]) => void;
};

type StreamAchievement = {
  achievement_id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  unlocked_at: string;
};

type StreamEventData = {
  conversationId?: string;
  title?: string;
  text?: string;
  error?: string;
  xpAwarded?: number;

  progress?: {
    xp?: number;
    level?: number;
  };

  streak?: {
    current_streak?: number;
    longest_streak?: number;
    last_activity_date?: string | null;
    streak_increased?: boolean;
  } | null;

  achievements?: StreamAchievement[];
};

export function useChatStream() {
  const streamChat = useCallback(
    async ({
      text,
      conversationId,
      assistantMessageId,
      onConversationId,
      onConversationTitle,
      onDelta,
      onXpAwarded,
      onStreakUpdated,
      onAchievementsUnlocked,
    }: StreamChatOptions) => {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          conversationId,
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();

        throw new Error(
  responseText || API_ERRORS.failedToStartChatRequest,
);
      }

      if (!response.body) {
        throw new Error("Ваш браузер не підтримує потокову передачу даних");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";
      let receivedText = false;

      function processEventBlock(eventBlock: string) {
        const lines = eventBlock.replace(/\r/g, "").split("\n");

        const eventName = lines
          .find((line) => line.startsWith("event:"))
          ?.slice(6)
          .trim();

        const dataLines = lines
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim());

        if (!eventName || dataLines.length === 0) {
          return;
        }

        let data: StreamEventData;

        try {
          data = JSON.parse(dataLines.join("\n")) as StreamEventData;
        } catch {
          throw new Error(
  UI_ERRORS.invalidStreamingResponse,
);
        }

        if (eventName === "conversation" && data.conversationId) {
          onConversationId(data.conversationId);
          return;
        }

if (eventName === "conversation-title" && data.title) {
  onConversationTitle(data.title);
  return;
}

        if (eventName === "delta" && data.text) {
          receivedText = true;
          onDelta(assistantMessageId, data.text);
          return;
        }

        if (eventName === "done") {
          const progressData = data.progress;
          const xpAwarded = data.xpAwarded;

          if (
            typeof xpAwarded === "number" &&
            progressData &&
            typeof progressData.xp === "number" &&
            typeof progressData.level === "number"
          ) {
            onXpAwarded({
              amount: xpAwarded,
              totalXp: progressData.xp,
              level: progressData.level,
            });
          }

          const streakData = data.streak;

          if (streakData) {
            const currentStreak = streakData.current_streak;
            const longestStreak = streakData.longest_streak;

            if (
              typeof currentStreak === "number" &&
              typeof longestStreak === "number"
            ) {
              onStreakUpdated({
                currentStreak,
                longestStreak,
                lastActivityDate: streakData.last_activity_date ?? null,
                streakIncreased: streakData.streak_increased ?? false,
              });
            }
          }

          const achievementsData = data.achievements;

          if (Array.isArray(achievementsData) && achievementsData.length > 0) {
            const achievements: UnlockedAchievement[] = achievementsData.map(
              (achievement) => ({
                achievementId: achievement.achievement_id,
                slug: achievement.slug,
                title: achievement.title,
                description: achievement.description,
                icon: achievement.icon,
                xpReward: achievement.xp_reward,
                unlockedAt: achievement.unlocked_at,
              }),
            );

            onAchievementsUnlocked(achievements);
          }

          return;
        }

        if (eventName === "error") {
          throw new Error(
  data.error || API_ERRORS.failedToGenerateResponse,
);
        }
      }

      try {
        while (true) {
          const { value, done } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, {
            stream: true,
          });

          const eventBlocks = buffer.split(/\r?\n\r?\n/);

          buffer = eventBlocks.pop() ?? "";

          for (const eventBlock of eventBlocks) {
            if (eventBlock.trim()) {
              processEventBlock(eventBlock);
            }
          }
        }

        buffer += decoder.decode();

        if (buffer.trim()) {
          processEventBlock(buffer);
        }
      } finally {
        reader.releaseLock();
      }

      if (!receivedText) {
        throw new Error(UI_ERRORS.emptyAssistantResponse);
      }
    },
    [],
  );

  return {
    streamChat,
  };
}
