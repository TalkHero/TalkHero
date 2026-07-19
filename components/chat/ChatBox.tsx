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
import { useChatStream } from "@/hooks/useChatStream";
import { useConversationManager } from "@/hooks/useConversationManager";

type Message = ChatMessage;

type XpToastData = {
  amount: number;
  totalXp: number;
  level: number;
};



export function ChatBox() {



  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);



  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [xpToast, setXpToast] = useState<XpToastData | null>(null);

   const {
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
  if (
    loading ||
    deletingConversationId ||
    id === conversationId
  ) {
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

  async function sendMessage() {
    const text = input.trim();

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

          window.setTimeout(() => {
            setXpToast(null);
          }, 3500);
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
                    ? `Sorry, something went wrong: ${error.message}`
                    : "Sorry, something went wrong.",
              }
            : message,
        ),
      );
    } finally {
      setLoading(false);
    }
  }



  return (
    <div className="relative flex h-full min-h-0 overflow-hidden bg-slate-50">
      <ConversationSidebar
  open={sidebarOpen}
  conversations={conversations}
  activeConversationId={conversationId}
  deletingConversationId={deletingConversationId}
  disabled={controlsDisabled}
  onClose={() => setSidebarOpen(false)}
  onNewConversation={handleStartNewConversation}
  onOpenConversation={handleOpenConversation}
  onDeleteConversation={deleteConversation}
/>

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
    </div>
  );
}
