"use client";

import { Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TypingIndicator } from "./TypingIndicator";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Props = {
  message: ChatMessage;
  loading: boolean;
  onAssistantMouseUp: (
    message: ChatMessage,
    event: React.MouseEvent<HTMLDivElement>,
  ) => void;
  footer?: React.ReactNode;
};

export function MessageBubble({
  message,
  loading,
  onAssistantMouseUp,
  footer,
}: Props) {
  const isUser = message.role === "user";

  const isEmptyAssistant =
    !isUser &&
    loading &&
    message.content.length === 0;

  return (
    <div
      className={`flex gap-3 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isUser && (
        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
          <Bot className="h-5 w-5" />
        </div>
      )}

      <div className="min-w-0 max-w-[88%] sm:max-w-[78%]">
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-7 sm:px-5 ${
            isUser
              ? "rounded-br-md bg-indigo-600 text-white shadow-sm"
              : "rounded-bl-md border border-slate-200 bg-white text-slate-800 shadow-sm"
          }`}
        >
          {isEmptyAssistant ? (
            <TypingIndicator />
          ) : isUser ? (
            <p className="whitespace-pre-wrap">
              {message.content}
            </p>
          ) : (
            <div
              onMouseUp={(event) =>
                onAssistantMouseUp(message, event)
              }
              className="prose prose-slate max-w-none select-text text-sm leading-7 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-strong:text-slate-900"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {footer}
      </div>
    </div>
  );
}
