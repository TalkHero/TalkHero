"use client";

import { useCallback, useEffect, useState } from "react";

import type { ChatMessage } from "@/components/chat/MessageBubble";
import type { ConversationItem } from "@/components/chat/ConversationSidebar";

type HistoryMessage = {
  id: number | string;
  role: "user" | "assistant";
  content: string;
};

type ConversationsResponse = {
  conversations?: ConversationItem[];
  error?: string;
};

type ConversationHistoryResponse = {
  conversationId?: string | null;
  messages?: HistoryMessage[];
};

type DeleteConversationResponse = {
  error?: string;
};

type UseConversationManagerOptions = {
  chatLoading: boolean;
};

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Hello! I’m Emma, your English tutor. What would you like to practice today?",
  },
];

export function useConversationManager({
  chatLoading,
}: UseConversationManagerOptions) {
  const [messages, setMessages] =
    useState<ChatMessage[]>(INITIAL_MESSAGES);

  const [conversations, setConversations] = useState<
    ConversationItem[]
  >([]);

  const [conversationId, setConversationId] = useState<
    string | null
  >(null);

  const [historyLoading, setHistoryLoading] =
    useState(true);

  const [
    deletingConversationId,
    setDeletingConversationId,
  ] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/conversations", {
        cache: "no-store",
      });

      const data =
        (await response.json()) as ConversationsResponse;

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load conversations",
        );
      }

      const loadedConversations =
        data.conversations ?? [];

      setConversations(loadedConversations);

      return loadedConversations;
    } catch (error) {
      console.error(
        "LOAD CONVERSATIONS ERROR:",
        error,
      );

      return [];
    }
  }, []);

  const loadConversation = useCallback(
    async (id?: string | null) => {
      try {
        setHistoryLoading(true);

        const url = id
          ? `/api/chat/history?conversationId=${encodeURIComponent(id)}`
          : "/api/chat/history";

        const response = await fetch(url, {
          cache: "no-store",
        });

        const responseText = await response.text();

        if (!response.ok) {
          throw new Error(
            responseText ||
              "Failed to load conversation",
          );
        }

        const data = JSON.parse(
          responseText,
        ) as ConversationHistoryResponse;

        setConversationId(data.conversationId ?? null);

        if (data.messages?.length) {
          setMessages(
            data.messages.map((message) => ({
              id: String(message.id),
              role: message.role,
              content: message.content,
            })),
          );
        } else {
          setMessages(INITIAL_MESSAGES);
        }
      } catch (error) {
        console.error(
          "LOAD CONVERSATION ERROR:",
          error,
        );

        setConversationId(null);
        setMessages(INITIAL_MESSAGES);
      } finally {
        setHistoryLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    async function initializeConversations() {
      await loadConversations();
      await loadConversation();
    }

    void initializeConversations();
  }, [loadConversation, loadConversations]);

  const startNewConversation = useCallback(() => {
    if (chatLoading || deletingConversationId) {
      return false;
    }

    setConversationId(null);
    setMessages(INITIAL_MESSAGES);

    return true;
  }, [chatLoading, deletingConversationId]);

  const openConversation = useCallback(
    async (id: string) => {
      if (
        chatLoading ||
        deletingConversationId ||
        id === conversationId
      ) {
        return false;
      }

      await loadConversation(id);

      return true;
    },
    [
      chatLoading,
      conversationId,
      deletingConversationId,
      loadConversation,
    ],
  );

  const deleteConversation = useCallback(
    async (id: string, title: string) => {
      if (chatLoading || deletingConversationId) {
        return false;
      }

      const confirmed = window.confirm(
        `Delete conversation "${title}"?`,
      );

      if (!confirmed) {
        return false;
      }

      setDeletingConversationId(id);

      try {
        const response = await fetch(
          `/api/conversations/${encodeURIComponent(id)}`,
          {
            method: "DELETE",
          },
        );

        const data =
          (await response.json()) as DeleteConversationResponse;

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Failed to delete conversation",
          );
        }

        const remainingConversations =
          await loadConversations();

        if (id === conversationId) {
          const nextConversation =
            remainingConversations[0];

          if (nextConversation) {
            await loadConversation(nextConversation.id);
          } else {
            setConversationId(null);
            setMessages(INITIAL_MESSAGES);
            setHistoryLoading(false);
          }
        }

        return true;
      } catch (error) {
        console.error(
          "DELETE CONVERSATION ERROR:",
          error,
        );

        window.alert(
          error instanceof Error
            ? error.message
            : "Failed to delete conversation",
        );

        return false;
      } finally {
        setDeletingConversationId(null);
      }
    },
    [
      chatLoading,
      conversationId,
      deletingConversationId,
      loadConversation,
      loadConversations,
    ],
  );

  const controlsDisabled =
    chatLoading ||
    historyLoading ||
    Boolean(deletingConversationId);

  return {
    messages,
    setMessages,

    conversations,

    conversationId,
    setConversationId,

    historyLoading,
    deletingConversationId,
    controlsDisabled,

    loadConversations,
    startNewConversation,
    openConversation,
    deleteConversation,
  };
}
