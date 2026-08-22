"use client";

import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  PanelLeftOpen,
  Pause,
  Play,
  Square,
  Volume2,
} from "lucide-react";

import {
  type ChatMessage,
  MessageBubble,
} from "@/components/chat/MessageBubble";
import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { SelectedWordPopup } from "@/components/chat/SelectedWordPopup";
import { Toast } from "@/components/chat/Toast";
import { XpToast } from "@/components/chat/XpToast";

import { useSelectedWord } from "@/hooks/useSelectedWord";
import { useSpeechControls } from "@/hooks/useSpeechControls";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { type DailyStreak, useChatStream } from "@/hooks/useChatStream";
import { useConversationManager } from "@/hooks/useConversationManager";
import { StreakBadge } from "@/components/chat/StreakBadge";
import { type UnlockedAchievement } from "@/hooks/useChatStream";

import { AchievementToast } from "@/components/chat/AchievementToast";
import { useRouter } from "next/navigation";

type Message = ChatMessage;

type XpToastData = {
  amount: number;
  totalXp: number;
  level: number;
};

export function ChatBox() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [xpToast, setXpToast] = useState<XpToastData | null>(null);
  const [dailyStreak, setDailyStreak] = useState<DailyStreak | null>(null);
  const [achievementToast, setAchievementToast] =
    useState<UnlockedAchievement | null>(null);

  const achievementQueue = useRef<UnlockedAchievement[]>([]);

  const {
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
  } = useConversationManager({
    chatLoading: loading,
  });

  const {
    selectedWord,
    savingSelectedWord,
    toastMessage,
    clearSelectedWord,
    handleAssistantTextSelection,
    saveSelectedWord,
  } = useSelectedWord();

  const {
    speechStatus,
    isSpeechSupported,
    speakingMessageId,
    handleSpeakMessage,
    handleStopSpeaking,
    resetSpeech,
  } = useSpeechControls();

  const {
    isSupported: isRecognitionSupported,
    isListening,
    errorMessage: recognitionError,
    toggleListening,
    stopListening,
  } = useSpeechRecognition();

  const { streamChat } = useChatStream();

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  function handleStartNewConversation() {
    const started = startNewConversation();

    if (!started) {
      return;
    }

    resetSpeech();
    stopListening();
    clearSelectedWord();
    setInput("");
  }

  async function handleOpenConversation(id: string) {
    if (loading || deletingConversationId || id === conversationId) {
      return;
    }

    resetSpeech();
    stopListening();
    clearSelectedWord();

    await openConversation(id);
  }

  function handleToggleMicrophone() {
    resetSpeech();

    toggleListening({
      language: "en-US",
      onTranscript: (text) => {
        setInput((previous) => {
          const separator = previous.trim().length > 0 ? " " : "";

          return `${previous}${separator}${text}`;
        });
      },
    });
  }

  async function sendMessage(quickReply?: string) {
    const text =
      typeof quickReply === "string" ? quickReply.trim() : input.trim();

    if (!text || loading || historyLoading || deletingConversationId) {
      return;
    }

    resetSpeech();
    stopListening();
    clearSelectedWord();

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
      await streamChat({
        text,
        conversationId,
        assistantMessageId,

        onConversationId: (newConversationId) => {
          setConversationId(newConversationId);
        },

        onConversationTitle: () => {
          loadConversations();
        },

        onDelta: (messageId, deltaText) => {
          setMessages((previous) =>
            previous.map((message) =>
              message.id === messageId
                ? {
                    ...message,
                    content: message.content + deltaText,
                  }
                : message,
            ),
          );
        },

        onXpAwarded: (reward) => {
          setXpToast({
            amount: reward.amount,
            totalXp: reward.totalXp,
            level: reward.level,
          });

          router.refresh();

          window.setTimeout(() => {
            setXpToast(null);
          }, 3500);
        },

        onStreakUpdated: (streak) => {
          setDailyStreak(streak);
        },

        onAchievementsUnlocked: (achievements) => {
          if (!achievements.length) {
            return;
          }

          achievementQueue.current.push(...achievements);

          if (achievementToast) {
            return;
          }

          const showNext = () => {
            const next = achievementQueue.current.shift();

            if (!next) {
              setAchievementToast(null);
              return;
            }

            setAchievementToast(next);

            window.setTimeout(() => {
              setAchievementToast(null);

              window.setTimeout(showNext, 300);
            }, 5000);
          };

          showNext();
        },
      });

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
                    ? `Вибачте, сталася помилка: ${error.message}`
                    : "Вибачте, сталася помилка.",
              }
            : message,
        ),
      );
    } finally {
      setLoading(false);
    }
  }
  const showQuickStarts =
    !historyLoading &&
    !loading &&
    !conversationId &&
    messages.every((message) => message.role !== "user");

  const quickStarts = [
    {
      label: "👋 Познайомитися",
      message: "Hi Emma! I'd like to introduce myself.",
    },
    {
      label: "💬 Проста розмова",
      message: "Hi Emma! Let's have a simple English conversation.",
    },
    {
      label: "☕ Ситуація в кафе",
      message: "Hi Emma! I'd like to practice ordering at a coffee shop.",
    },
  ];

  return (
    <div className="relative flex h-full min-h-0 overflow-hidden bg-slate-50">
      <ConversationSidebar
        open={sidebarOpen}
        conversations={conversations}
        activeConversationId={conversationId}
        deletingConversationId={deletingConversationId}
        renamingConversationId={renamingConversationId}
        disabled={controlsDisabled}
        onClose={() => setSidebarOpen(false)}
        onNewConversation={handleStartNewConversation}
        onOpenConversation={handleOpenConversation}
        onRenameConversation={renameConversation}
        onDeleteConversation={deleteConversation}
      />

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 lg:hidden"
              aria-label="Відкрити розмови"
            >
              <PanelLeftOpen className="h-5 w-5" />
            </button>

            <p className="ml-2 text-sm font-semibold text-slate-800">
              TalkHero
            </p>
          </div>

          <StreakBadge streak={dailyStreak} />
        </div>

        {historyLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
              <Loader2 className="h-5 w-5 animate-spin" />
              Завантаження розмови...
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
              {messages.map((message) => {
                const isAssistant = message.role === "assistant";

                const showSpeechControls =
                  isAssistant &&
                  message.content.trim().length > 0 &&
                  isSpeechSupported;

                const speechFooter = showSpeechControls ? (
                  <div className="mt-1.5 flex items-center gap-1 pl-1">
                    <button
                      type="button"
                      onClick={() => handleSpeakMessage(message)}
                      className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
                      title={
                        speakingMessageId === message.id &&
                        speechStatus === "speaking"
                          ? "Пауза"
                          : speakingMessageId === message.id &&
                              speechStatus === "paused"
                            ? "Продовжити"
                            : "Прослухати"
                      }
                    >
                      {speakingMessageId === message.id &&
                      speechStatus === "speaking" ? (
                        <>
                          <Pause className="h-4 w-4" />
                          Пауза
                        </>
                      ) : speakingMessageId === message.id &&
                        speechStatus === "paused" ? (
                        <>
                          <Play className="h-4 w-4" />
                          Продовжити
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-4 w-4" />
                          Прослухати
                        </>
                      )}
                    </button>

                    {speakingMessageId === message.id &&
                      speechStatus !== "idle" && (
                        <button
                          type="button"
                          onClick={handleStopSpeaking}
                          className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-slate-400 transition hover:bg-slate-100 hover:text-red-600"
                          title="Зупинити"
                        >
                          <Square className="h-3.5 w-3.5 fill-current" />
                          Зупинити
                        </button>
                      )}
                  </div>
                ) : null;

                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    loading={loading}
                    onAssistantMouseUp={handleAssistantTextSelection}
                    footer={speechFooter}
                  />
                );
              })}
              {showQuickStarts && (
                <div className="ml-14 flex flex-wrap gap-2">
                  {quickStarts.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => void sendMessage(item.message)}
                      className="rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-50"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>
        )}

        <ChatComposer
          input={input}
          loading={loading}
          disabled={controlsDisabled}
          isRecognitionSupported={isRecognitionSupported}
          isListening={isListening}
          recognitionError={recognitionError}
          onInputChange={setInput}
          onSend={sendMessage}
          onToggleMicrophone={handleToggleMicrophone}
        />
      </section>

      <SelectedWordPopup
        selectedWord={selectedWord}
        saving={savingSelectedWord}
        onSave={saveSelectedWord}
      />

      <Toast message={toastMessage} />

      <XpToast xp={xpToast} />
      <AchievementToast achievement={achievementToast} />
    </div>
  );
}
