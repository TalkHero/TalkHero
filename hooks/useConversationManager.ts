"use client";

import { useCallback, useEffect, useState } from "react";

import type { ChatMessage } from "@/components/chat/MessageBubble";
import type { ConversationItem } from "@/components/chat/ConversationSidebar";
import { API_ERRORS } from "@/lib/i18n/errors";

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

type RenameConversationResponse = {
  conversation?: ConversationItem;
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

  const [
    renamingConversationId,
    setRenamingConversationId,
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
          data.error ||
            API_ERRORS.failedToLoadConversations,
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
              API_ERRORS.failedToLoadConversation,
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
    if (
      chatLoading ||
      deletingConversationId ||
      renamingConversationId
    ) {
      return false;
    }

    setConversationId(null);
    setMessages(INITIAL_MESSAGES);

    return true;
  }, [
    chatLoading,
    deletingConversationId,
    renamingConversationId,
  ]);

  const openConversation = useCallback(
    async (id: string) => {
      if (
        chatLoading ||
        deletingConversationId ||
        renamingConversationId ||
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
      renamingConversationId,
    ],
  );

  const renameConversation = useCallback(
    async (id: string, newTitle: string) => {
      if (
        chatLoading ||
        deletingConversationId ||
        renamingConversationId
      ) {
        return false;
      }

      const title = newTitle
        .replace(/\s+/g, " ")
        .trim();

      if (!title) {
        window.alert("Назва розмови обов'язкова.");
        return false;
      }

      if (title.length > 60) {
        window.alert(
          "Назва розмови не може містити більше ніж 60 символів.",
        );
        return false;
      }

      const currentConversation =
        conversations.find(
          (conversation) => conversation.id === id,
        );

      if (currentConversation?.title === title) {
        return true;
      }

      setRenamingConversationId(id);

      try {
        const response = await fetch(
          `/api/conversations/${encodeURIComponent(id)}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title,
            }),
          },
        );

        const data =
          (await response.json()) as RenameConversationResponse;

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Не вдалося перейменувати розмову.",
          );
        }

        const updatedConversation = data.conversation;

        setConversations((previous) =>
          previous.map((conversation) =>
            conversation.id === id
              ? {
                  ...conversation,
                  title:
                    updatedConversation?.title ?? title,
                }
              : conversation,
          ),
        );

        return true;
      } catch (error) {
        console.error(
          "RENAME CONVERSATION ERROR:",
          error,
        );

        window.alert(
          error instanceof Error
            ? error.message
            : "Не вдалося перейменувати розмову.",
        );

        return false;
      } finally {
        setRenamingConversationId(null);
      }
    },
    [
      chatLoading,
      conversations,
      deletingConversationId,
      renamingConversationId,
    ],
  );

  const deleteConversation = useCallback(
    async (id: string, title: string) => {
      if (
        chatLoading ||
        deletingConversationId ||
        renamingConversationId
      ) {
        return false;
      }

      const confirmed = window.confirm(
        `Видалити розмову "${title}"?`,
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
              API_ERRORS.failedToDeleteConversation,
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
            : API_ERRORS.failedToDeleteConversation,
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
      renamingConversationId,
    ],
  );

  const controlsDisabled =
    chatLoading ||
    historyLoading ||
    Boolean(deletingConversationId) ||
    Boolean(renamingConversationId);

  return {
    messages,
    setMessages,

    conversations,

    conversationId,
    setConversationId,

    historyLoading,
    deletingConversationId,
    renamingConversationId,
    controlsDisabled,

    loadConversations,
    startNewConversation,
    openConversation,
    renameConversation,
    deleteConversation,
  };
}
