"use client";

import { useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Conversation = {
  id: string;
  title: string;
  created_at: string;
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "👋 Hello! I'm Emma, your English teacher. How can I help you today?",
  },
];

export function ChatBox() {
  const [messages, setMessages] =
    useState<Message[]>(INITIAL_MESSAGES);

  const [conversations, setConversations] =
    useState<Conversation[]>([]);

  const [conversationId, setConversationId] =
    useState<string | null>(null);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [deletingConversationId, setDeletingConversationId] =
    useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function loadConversations() {
    try {
      const response = await fetch("/api/conversations", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load conversations",
        );
      }

      const loadedConversations = data.conversations ?? [];

      setConversations(loadedConversations);

      return loadedConversations as Conversation[];
    } catch (error) {
      console.error("LOAD CONVERSATIONS ERROR:", error);
      return [];
    }
  }

  async function loadConversation(id?: string | null) {
    try {
      setHistoryLoading(true);

      const url = id
        ? `/api/chat/history?conversationId=${encodeURIComponent(id)}`
        : "/api/chat/history";

      const response = await fetch(url, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load history",
        );
      }

      setConversationId(data.conversationId ?? null);

      if (data.messages?.length) {
        setMessages(
          data.messages.map(
            (message: {
              id: number | string;
              role: "user" | "assistant";
              content: string;
            }) => ({
              id: String(message.id),
              role: message.role,
              content: message.content,
            }),
          ),
        );
      } else {
        setMessages(INITIAL_MESSAGES);
      }
    } catch (error) {
      console.error("LOAD HISTORY ERROR:", error);

      setConversationId(null);
      setMessages(INITIAL_MESSAGES);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    async function initializeChat() {
      await loadConversations();
      await loadConversation();
    }

    initializeChat();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  function startNewConversation() {
    if (loading || deletingConversationId) return;

    setConversationId(null);
    setMessages(INITIAL_MESSAGES);
    setInput("");
  }

  async function openConversation(id: string) {
    if (
      loading ||
      deletingConversationId ||
      id === conversationId
    ) {
      return;
    }

    await loadConversation(id);
  }

  async function deleteConversation(
    id: string,
    title: string,
  ) {
    if (loading || deletingConversationId) return;

    const confirmed = window.confirm(
      `Delete conversation "${title}"?`,
    );

    if (!confirmed) return;

    setDeletingConversationId(id);

    try {
      const response = await fetch(
        `/api/conversations/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to delete conversation",
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
          setInput("");
          setHistoryLoading(false);
        }
      }
    } catch (error) {
      console.error("DELETE CONVERSATION ERROR:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete conversation",
      );
    } finally {
      setDeletingConversationId(null);
    }
  }

  async function sendMessage() {
    const text = input.trim();

    if (
      !text ||
      loading ||
      historyLoading ||
      deletingConversationId
    ) {
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
    ]);

    setInput("");
    setLoading(true);

    try {
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to send message",
        );
      }

      setConversationId(data.conversationId);

      setMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.answer,
        },
      ]);

      await loadConversations();
    } catch (error) {
      console.error("SEND MESSAGE ERROR:", error);

      setMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            error instanceof Error
              ? `❌ ${error.message}`
              : "❌ Sorry, something went wrong.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex h-full min-h-0">
      <aside className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white p-3">
        <button
          type="button"
          onClick={startNewConversation}
          disabled={
            loading || Boolean(deletingConversationId)
          }
          className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          + New Conversation
        </button>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="px-2 py-4 text-sm text-slate-400">
              No conversations yet.
            </p>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => {
                const isActive =
                  conversation.id === conversationId;

                const isDeleting =
                  deletingConversationId ===
                  conversation.id;

                return (
                  <div
                    key={conversation.id}
                    className={`group flex items-center gap-1 rounded-xl ${
                      isActive
                        ? "bg-blue-50"
                        : "hover:bg-slate-100"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        openConversation(conversation.id)
                      }
                      disabled={
                        loading ||
                        Boolean(deletingConversationId)
                      }
                      className={`min-w-0 flex-1 truncate rounded-xl px-3 py-3 text-left text-sm transition ${
                        isActive
                          ? "font-medium text-blue-700"
                          : "text-slate-700"
                      }`}
                      title={conversation.title}
                    >
                      {conversation.title}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteConversation(
                          conversation.id,
                          conversation.title,
                        )
                      }
                      disabled={
                        loading ||
                        Boolean(deletingConversationId)
                      }
                      className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`Delete ${conversation.title}`}
                      title="Delete conversation"
                    >
                      {isDeleting ? "…" : "🗑️"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {historyLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-slate-500">
              Loading conversation...
            </p>
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "user"
                    ? "flex justify-end"
                    : "flex justify-start"
                }
              >
                <div
                  className={
                    message.role === "user"
                      ? "max-w-xl rounded-2xl rounded-br-md bg-blue-600 px-5 py-3 text-white"
                      : "max-w-xl rounded-2xl rounded-bl-md bg-white px-5 py-3 shadow"
                  }
                >
                  {message.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-white px-5 py-3 shadow">
                  🤖 Thinking...
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}

        <div className="shrink-0 border-t border-slate-200 bg-white p-4">
          <div className="mx-auto flex max-w-4xl gap-3">
            <input
              className="flex-1 rounded-xl border border-slate-300 p-4 outline-none focus:border-blue-500"
              placeholder="Type your message..."
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
              onKeyDown={handleKeyDown}
              disabled={
                loading ||
                historyLoading ||
                Boolean(deletingConversationId)
              }
            />

            <button
              type="button"
              onClick={sendMessage}
              disabled={
                loading ||
                historyLoading ||
                Boolean(deletingConversationId) ||
                !input.trim()
              }
              className="rounded-xl bg-black px-6 text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Thinking..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
