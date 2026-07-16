"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Loader2,
  MessageSquarePlus,
  PanelLeftClose,
  PanelLeftOpen,
  Pause,
  Play,
  Send,
  Square,
  Mic,
  BookPlus,
  MicOff,
  Trash2,
  Volume2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

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

type HistoryMessage = {
  id: number | string;
  role: "user" | "assistant";
  content: string;
};
type SelectedWord = {
  word: string;
  context: string;
  messageId: string;
  x: number;
  y: number;
};

type ToastMessage = {
  type: "success" | "error";
  text: string;
};

type XpToast = {
  amount: number;
  totalXp: number;
  level: number;
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Hello! I’m Emma, your English tutor. What would you like to practice today?",
  },
];

export function ChatBox() {
  const [messages, setMessages] =
    useState<Message[]>(INITIAL_MESSAGES);

  const [conversations, setConversations] = useState<
    Conversation[]
  >([]);

  const [conversationId, setConversationId] = useState<
    string | null
  >(null);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [deletingConversationId, setDeletingConversationId] =
    useState<string | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [speakingMessageId, setSpeakingMessageId] = useState<
    string | null
  >(null);

  const [selectedWord, setSelectedWord] =
  useState<SelectedWord | null>(null);

const [savingSelectedWord, setSavingSelectedWord] =
  useState(false);

const [toastMessage, setToastMessage] =
  useState<ToastMessage | null>(null);

  const [xpToast, setXpToast] = useState<XpToast | null>(null);

  const {
    status: speechStatus,
    isSupported: isSpeechSupported,
    speak,
    pause,
    resume,
    stop,
  } = useSpeechSynthesis();
  const {
  isSupported: isRecognitionSupported,
  isListening,
  errorMessage: recognitionError,
  toggleListening,
  stopListening,
} = useSpeechRecognition();

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  async function loadConversations(): Promise<
    Conversation[]
  > {
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

      const loadedConversations =
        (data.conversations as Conversation[]) ?? [];

      setConversations(loadedConversations);

      return loadedConversations;
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

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(
          responseText || "Failed to load conversation",
        );
      }

      const data = JSON.parse(responseText);

      setConversationId(data.conversationId ?? null);

      if (data.messages?.length) {
        setMessages(
          data.messages.map((message: HistoryMessage) => ({
            id: String(message.id),
            role: message.role,
            content: message.content,
          })),
        );
      } else {
        setMessages(INITIAL_MESSAGES);
      }
    } catch (error) {
      console.error("LOAD CONVERSATION ERROR:", error);

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
      block: "end",
    });
  }, [messages, loading]);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(
      textarea.scrollHeight,
      160,
    )}px`;
  }, [input]);

  function startNewConversation() {
    setSelectedWord(null);
  if (loading || deletingConversationId) {
    return;
  }

  stop();
  setSpeakingMessageId(null);

  setConversationId(null);
  setMessages(INITIAL_MESSAGES);
  setInput("");

  requestAnimationFrame(() => {
    textareaRef.current?.focus();
  });
  setSelectedWord(null);
}

  async function openConversation(id: string) {
    setSelectedWord(null);
  if (
    loading ||
    deletingConversationId ||
    id === conversationId
  ) {
    return;
  }

  stop();
  setSpeakingMessageId(null);
stopListening();
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

      window.alert(
        error instanceof Error
          ? error.message
          : "Failed to delete conversation",
      );
    } finally {
      setDeletingConversationId(null);
    }
  }function handleSpeakMessage(message: Message) {
  if (!isSpeechSupported || !message.content.trim()) {
    return;
  }

  if (speakingMessageId === message.id) {
    if (speechStatus === "speaking") {
      pause();
      return;
    }

    if (speechStatus === "paused") {
      resume();
      return;
    }
  }

  stop();
  setSpeakingMessageId(message.id);
  speak(message.content);
}

function handleStopSpeaking() {
  stop();
  setSpeakingMessageId(null);
}
function handleToggleMicrophone() {
  stop();
  setSpeakingMessageId(null);

  toggleListening({
    language: "en-US",
    onTranscript: (text) => {
      setInput((previous) => {
        const separator =
          previous.trim().length > 0 ? " " : "";

        return `${previous}${separator}${text}`;
      });
    },
  });
}
function showToast(
  type: ToastMessage["type"],
  text: string,
) {
  setToastMessage({
    type,
    text,
  });

  window.setTimeout(() => {
    setToastMessage(null);
  }, 3500);
}

function handleAssistantTextSelection(
  message: Message,
  event: React.MouseEvent<HTMLDivElement>,
) {
  const container = event.currentTarget;

  window.requestAnimationFrame(() => {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      setSelectedWord(null);
      return;
    }

    const selectedText = selection
      .toString()
      .replace(/\s+/g, " ")
      .trim();

    if (!selectedText) {
      setSelectedWord(null);
      return;
    }

    if (selectedText.length > 100) {
      showToast(
        "error",
        "Select a shorter word or phrase.",
      );

      setSelectedWord(null);
      return;
    }

    const range = selection.getRangeAt(0);

    if (!container.contains(range.commonAncestorContainer)) {
      setSelectedWord(null);
      return;
    }

    const rectangle = range.getBoundingClientRect();

    if (!rectangle.width || !rectangle.height) {
      setSelectedWord(null);
      return;
    }

    setSelectedWord({
      word: selectedText,
      context: message.content,
      messageId: message.id,
      x: rectangle.left + rectangle.width / 2,
      y: Math.max(12, rectangle.top - 10),
    });
  });
}

async function saveSelectedWord() {
  if (!selectedWord || savingSelectedWord) {
    return;
  }

  const wordToSave = selectedWord.word;

  setSavingSelectedWord(true);

  try {
    const response = await fetch(
      "/api/vocabulary/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word: selectedWord.word,
          context: selectedWord.context,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to save word.",
      );
    }

    setSelectedWord(null);
    window.getSelection()?.removeAllRanges();

    if (data.alreadyExists) {
      showToast(
        "success",
        `"${data.vocabularyItem.word}" is already in your vocabulary.`,
      );
    } else {
      showToast(
        "success",
        `"${data.vocabularyItem.word}" saved to Vocabulary.`,
      );
    }
  } catch (error) {
    console.error("SAVE SELECTED WORD ERROR:", error);

    showToast(
      "error",
      error instanceof Error
        ? error.message
        : `Failed to save "${wordToSave}".`,
    );
  } finally {
    setSavingSelectedWord(false);
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
    stop();
    setSelectedWord(null);
window.getSelection()?.removeAllRanges();
setSpeakingMessageId(null);
stopListening();
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    const assistantMessageId = crypto.randomUUID();

    setMessages((previous) => [
      ...previous,
      userMessage,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
      },
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

      if (!response.ok) {
        const responseText = await response.text();

        throw new Error(
          responseText || "Failed to send message",
        );
      }

      if (!response.body) {
        throw new Error("Streaming is not supported");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";
      let receivedText = false;

      function processEventBlock(eventBlock: string) {
        const lines = eventBlock
          .replace(/\r/g, "")
          .split("\n");

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

        const data = JSON.parse(dataLines.join("\n"));

        if (
          eventName === "conversation" &&
          data.conversationId
        ) {
          setConversationId(data.conversationId);
        }

        if (eventName === "delta" && data.text) {
          receivedText = true;

          setMessages((previous) =>
            previous.map((message) =>
              message.id === assistantMessageId
                ? {
                    ...message,
                    content: message.content + data.text,
                  }
                : message,
            ),
          );
        }
        if (
  eventName === "done" &&
  data.xpAwarded &&
  data.progress
) {
  setXpToast({
    amount: Number(data.xpAwarded),
    totalXp: Number(data.progress.xp),
    level: Number(data.progress.level),
  });

  window.setTimeout(() => {
    setXpToast(null);
  }, 3500);
}

        if (eventName === "error") {
          throw new Error(
            data.error || "Failed to generate response",
          );
        }
      }

      while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, {
          stream: true,
        });

        const eventBlocks = buffer.split("\n\n");
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

      if (!receivedText) {
        throw new Error("Emma returned no response");
      }

      await loadConversations();
    } catch (error) {
      console.error("SEND MESSAGE ERROR:", error);

      setMessages((previous) =>
        previous.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                content:
                  error instanceof Error
                    ? `Sorry, something went wrong: ${error.message}`
                    : "Sorry, something went wrong.",
              }
            : message,
        ),
      );
    } finally {
      setLoading(false);

      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  const controlsDisabled =
    loading ||
    historyLoading ||
    Boolean(deletingConversationId);

  return (
    <div className="relative flex h-full min-h-0 overflow-hidden bg-slate-50">
      <aside
        className={`absolute inset-y-0 left-0 z-20 flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:relative lg:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:hidden"
        }`}
      >
        <div className="flex items-center gap-2 border-b border-slate-100 p-4">
          <button
            type="button"
            onClick={startNewConversation}
            disabled={controlsDisabled}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MessageSquarePlus className="h-4 w-4" />
            New conversation
          </button>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            aria-label="Close conversations"
          >
            <PanelLeftClose className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Conversations
          </p>

          {conversations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center">
              <p className="text-sm font-medium text-slate-600">
                No conversations yet
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Start a new chat with Emma.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => {
                const isActive =
                  conversation.id === conversationId;

                const isDeleting =
                  deletingConversationId ===
                  conversation.id;

                return (
                  <div
                    key={conversation.id}
                    className={`group flex items-center gap-1 rounded-xl transition ${
                      isActive
                        ? "bg-indigo-50"
                        : "hover:bg-slate-100"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        openConversation(conversation.id)
                      }
                      disabled={controlsDisabled}
                      title={conversation.title}
                      className={`min-w-0 flex-1 truncate rounded-xl px-3 py-3 text-left text-sm transition ${
                        isActive
                          ? "font-semibold text-indigo-700"
                          : "text-slate-700"
                      }`}
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
                      disabled={controlsDisabled}
                      title="Delete conversation"
                      aria-label={`Delete ${conversation.title}`}
                      className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 opacity-100 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 lg:opacity-0 lg:group-hover:opacity-100"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="absolute inset-0 z-10 bg-slate-950/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close conversations"
        />
      )}

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-14 shrink-0 items-center border-b border-slate-200 bg-white px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100"
            aria-label="Open conversations"
          >
            <PanelLeftOpen className="h-5 w-5" />
          </button>

          <p className="ml-2 text-sm font-semibold text-slate-800">
            Conversations
          </p>
        </div>

        {historyLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading conversation...
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
              {messages.map((message) => {
                const isUser = message.role === "user";
                const isEmptyAssistant =
                  !isUser &&
                  loading &&
                  message.content.length === 0;

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      isUser
                        ? "justify-end"
                        : "justify-start"
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
      <div className="flex h-7 items-center gap-1.5">
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
      </div>
    ) : isUser ? (
      <p className="whitespace-pre-wrap">
        {message.content}
      </p>
    ) : (
      <div
  onMouseUp={(event) =>
    handleAssistantTextSelection(message, event)
  }
  className="prose prose-slate max-w-none select-text text-sm leading-7 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-strong:text-slate-900"
>
  <ReactMarkdown remarkPlugins={[remarkGfm]}>
    {message.content}
  </ReactMarkdown>
</div>
    )}
  </div>

  {!isUser &&
    !isEmptyAssistant &&
    message.content.trim() &&
    isSpeechSupported && (
      <div className="mt-1.5 flex items-center gap-1 pl-1">
        <button
          type="button"
          onClick={() => handleSpeakMessage(message)}
          className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
          title={
            speakingMessageId === message.id &&
            speechStatus === "speaking"
              ? "Pause"
              : speakingMessageId === message.id &&
                  speechStatus === "paused"
                ? "Resume"
                : "Listen"
          }
        >
          {speakingMessageId === message.id &&
          speechStatus === "speaking" ? (
            <>
              <Pause className="h-4 w-4" />
              Pause
            </>
          ) : speakingMessageId === message.id &&
            speechStatus === "paused" ? (
            <>
              <Play className="h-4 w-4" />
              Resume
            </>
          ) : (
            <>
              <Volume2 className="h-4 w-4" />
              Listen
            </>
          )}
        </button>

        {speakingMessageId === message.id &&
          speechStatus !== "idle" && (
            <button
              type="button"
              onClick={handleStopSpeaking}
              className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-slate-400 transition hover:bg-slate-100 hover:text-red-600"
              title="Stop"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              Stop
            </button>
          )}


      </div>
    )}
</div>
                  </div>
                );
              })}

              <div ref={bottomRef} />
            </div>
          </div>
        )}

        <div className="shrink-0 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
          <div className="mx-auto w-full max-w-4xl">
            <div className="flex items-end gap-2 rounded-2xl border border-slate-300 bg-white p-2 shadow-sm transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10">
            {isRecognitionSupported && (
  <button
    type="button"
    onClick={handleToggleMicrophone}
    disabled={controlsDisabled}
    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
      isListening
        ? "bg-red-100 text-red-600 ring-2 ring-red-200"
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
    }`}
    aria-label={
      isListening
        ? "Stop microphone"
        : "Start microphone"
    }
    title={
      isListening
        ? "Stop listening"
        : "Start speaking"
    }
  >
    {isListening ? (
      <MicOff className="h-5 w-5" />
    ) : (
      <Mic className="h-5 w-5" />
    )}
  </button>
)}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                onKeyDown={handleKeyDown}
                disabled={controlsDisabled}
                rows={1}
                placeholder="Message Emma..."
                className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
              />

              <button
                type="button"
                onClick={sendMessage}
                disabled={
                  controlsDisabled || !input.trim()
                }
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                aria-label="Send message"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
{recognitionError && (
  <p className="mt-2 text-center text-xs font-medium text-red-600">
    {recognitionError}
  </p>
)}
            <p className="mt-2 text-center text-xs text-slate-400">
              Press Enter to send · Shift + Enter for a new
              line
            </p>
          </div>
        </div>
      </section>
{selectedWord && (
  <div
    className="fixed z-50 -translate-x-1/2 -translate-y-full"
    style={{
      left: selectedWord.x,
      top: selectedWord.y,
    }}
  >
    <button
      type="button"
      onMouseDown={(event) => {
        event.preventDefault();
      }}
      onClick={saveSelectedWord}
      disabled={savingSelectedWord}
      className="flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white shadow-xl transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {savingSelectedWord ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <BookPlus className="h-4 w-4" />
      )}

      {savingSelectedWord ? "Saving..." : "Save"}
    </button>
  </div>
)}
{toastMessage && (
  <div
    className={`fixed bottom-6 right-6 z-[60] max-w-sm rounded-2xl border px-4 py-3 text-sm font-medium shadow-xl ${
      toastMessage.type === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-red-200 bg-red-50 text-red-700"
    }`}
  >
    {toastMessage.text}
  </div>
)}{toastMessage && (
  <div
    className={`fixed bottom-6 right-6 z-[60] max-w-sm rounded-2xl border px-4 py-3 text-sm font-medium shadow-xl ${
      toastMessage.type === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-red-200 bg-red-50 text-red-700"
    }`}
  >
    {toastMessage.text}
  </div>
)}
{xpToast && (
  <div className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 shadow-xl">
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-lg">
        ✨
      </div>

      <div>
        <p className="text-sm font-bold text-amber-800">
          +{xpToast.amount} XP
        </p>

        <p className="text-xs text-amber-700">
          Total: {xpToast.totalXp} XP · Level{" "}
          {xpToast.level}
        </p>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
