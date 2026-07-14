"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
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

  const [conversationId, setConversationId] =
    useState<string | null>(null);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const response = await fetch("/api/chat/history", {
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
        }
      } catch (error) {
        console.error("LOAD HISTORY ERROR:", error);
      } finally {
        setHistoryLoading(false);
      }
    }

    loadHistory();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();

    if (!text || loading) return;

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
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  if (historyLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-slate-500">
          Loading conversation...
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
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

      <div className="border-t bg-white p-4">
        <div className="mx-auto flex max-w-4xl gap-3">
          <input
            className="flex-1 rounded-xl border border-slate-300 p-4 outline-none focus:border-blue-500"
            placeholder="Type your message..."
            value={input}
            onChange={(event) =>
              setInput(event.target.value)
            }
            onKeyDown={handleKeyDown}
            disabled={loading}
          />

          <button
            type="button"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-black px-6 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Thinking..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
