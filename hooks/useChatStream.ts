"use client";

import { useCallback } from "react";

export type ChatXpReward = {
  amount: number;
  totalXp: number;
  level: number;
};

type StreamChatOptions = {
  text: string;
  conversationId: string | null;
  assistantMessageId: string;
  onConversationId: (conversationId: string) => void;
  onDelta: (assistantMessageId: string, text: string) => void;
  onXpAwarded: (reward: ChatXpReward) => void;
};

type StreamEventData = {
  conversationId?: string;
  text?: string;
  error?: string;
  xpAwarded?: number;
  progress?: {
    xp?: number;
    level?: number;
  };
};

export function useChatStream() {
  const streamChat = useCallback(
    async ({
      text,
      conversationId,
      assistantMessageId,
      onConversationId,
      onDelta,
      onXpAwarded,
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

        throw new Error(responseText || "Failed to send message");
      }

      if (!response.body) {
        throw new Error("Streaming is not supported by this browser");
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
          data = JSON.parse(dataLines.join("\n"));
        } catch {
          throw new Error("Received an invalid streaming response");
        }

        if (eventName === "conversation" && data.conversationId) {
          onConversationId(data.conversationId);
          return;
        }

        if (eventName === "delta" && data.text) {
          receivedText = true;

          onDelta(assistantMessageId, data.text);
          return;
        }

        if (
          eventName === "done" &&
          typeof data.xpAwarded === "number" &&
          data.progress &&
          typeof data.progress.xp === "number" &&
          typeof data.progress.level === "number"
        ) {
          onXpAwarded({
            amount: data.xpAwarded,
            totalXp: data.progress.xp,
            level: data.progress.level,
          });

          return;
        }

        if (eventName === "error") {
          throw new Error(
            data.error || "Failed to generate assistant response",
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
        throw new Error("Emma returned an empty response");
      }
    },
    [],
  );

  return {
    streamChat,
  };
}
