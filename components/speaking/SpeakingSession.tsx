"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Bot,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  Play,
  Sparkles,
  UserRound,
  Volume2,
} from "lucide-react";

import { useVoiceRecorder } from "@/components/quests/hooks/useVoiceRecorder";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import {
  SpeakingReport,
  type SpeakingEvaluation,
  type SpeakingReportMessage,
} from "@/components/speaking/SpeakingReport";
import { UI_ERRORS } from "@/lib/i18n/errors";
import { useRouter } from "next/navigation";

type SessionPhase = "idle" | "listening" | "thinking" | "speaking" | "error";

type SpeakingMessage = SpeakingReportMessage;

function cleanTextForSpeech(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_#>-]/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function isSpeakingEvaluation(value: unknown): value is SpeakingEvaluation {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const evaluation = value as Record<string, unknown>;

  return (
    typeof evaluation.grammarScore === "number" &&
    typeof evaluation.fluencyScore === "number" &&
    typeof evaluation.vocabularyScore === "number" &&
    typeof evaluation.naturalnessScore === "number" &&
    typeof evaluation.overallScore === "number" &&
    typeof evaluation.wasCorrect === "boolean" &&
    typeof evaluation.correctedSentence === "string" &&
    typeof evaluation.shortFeedback === "string" &&
    typeof evaluation.mainIssue === "string" &&
    typeof evaluation.encouragement === "string"
  );
}
function subscribeToClientState() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function SpeakingSession() {
  const router = useRouter();
  const [sessionActive, setSessionActive] = useState(false);

  const [startingSession, setStartingSession] = useState(false);

  const [showReport, setShowReport] = useState(false);

  const [sessionStartedAt] = useState(() => Date.now());
  const isClient = useSyncExternalStore(
    subscribeToClientState,
    getClientSnapshot,
    getServerSnapshot,
  );

  const [completionData, setCompletionData] = useState<{
    xpEarned: number;

    progress: {
      xp: number;
      level: number;
      progressPercent: number;

      previousLevel: number;
      leveledUp: boolean;
    };
  } | null>(null);

  const completingSessionRef = useRef(false);

  const [phase, setPhase] = useState<SessionPhase>("idle");

  const [conversationId, setConversationId] = useState<string | null>(null);

  const [messages, setMessages] = useState<SpeakingMessage[]>([]);

  const [evaluation, setEvaluation] = useState<SpeakingEvaluation | null>(null);

  const [sessionEvaluations, setSessionEvaluations] = useState<
    SpeakingEvaluation[]
  >([]);

  const [currentTranscript, setCurrentTranscript] = useState("");

  const [emmaResponse, setEmmaResponse] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  const sessionActiveRef = useRef(false);

  const processingTranscriptRef = useRef(false);

  const speechStartedRef = useRef(false);

  const messagesRef = useRef<SpeakingMessage[]>([]);

  const messagesBottomRef = useRef<HTMLDivElement | null>(null);

  const recorder = useVoiceRecorder();

  const { startAutoTranscribe, cancel: cancelRecording } = recorder;

  const recognitionSupported =
    isClient &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== "undefined";

  const stopListening = useCallback(() => {
    cancelRecording();
  }, [cancelRecording]);

  const {
    status: speechStatus,
    isSupported: speechSupported,
    speak,
    stop: stopSpeaking,
  } = useSpeechSynthesis();

  useEffect(() => {
    sessionActiveRef.current = sessionActive;
  }, [sessionActive]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    messagesBottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, emmaResponse, evaluation]);

  const voiceSupported = recognitionSupported && speechSupported;
  async function beginListening() {
    if (!sessionActiveRef.current || processingTranscriptRef.current) {
      return;
    }

    setPhase("listening");
    setCurrentTranscript("");
    setEmmaResponse("");
    setErrorMessage("");

    await startAutoTranscribe({
      silenceMs: 900,
      maxRecordingMs: 30_000,

      onTranscript: (text) => {
        const normalizedText = text.trim();

        if (
          !normalizedText ||
          processingTranscriptRef.current ||
          !sessionActiveRef.current
        ) {
          return;
        }

        processingTranscriptRef.current = true;

        setCurrentTranscript(normalizedText);

        void sendVoiceMessage(normalizedText);
      },

      onError: (message) => {
        if (!sessionActiveRef.current) {
          return;
        }

        processingTranscriptRef.current = false;

        setPhase("error");
        setErrorMessage(message);
      },
    });
  }
  async function evaluateTranscript(transcript: string) {
    const previousAssistantMessage =
      [...messagesRef.current]
        .reverse()
        .find(
          (message) => message.role === "assistant" && message.content.trim(),
        )?.content ?? "";

    try {
      const response = await fetch("/api/speaking/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript,
          previousAssistantMessage,
        }),
      });

      if (!response.ok) {
        return;
      }

      const responseData: unknown = await response.json();

      if (
        typeof responseData !== "object" ||
        responseData === null ||
        !("evaluation" in responseData)
      ) {
        return;
      }

      const nextEvaluation = responseData.evaluation;

      if (!isSpeakingEvaluation(nextEvaluation)) {
        return;
      }

      setEvaluation(nextEvaluation);

      setSessionEvaluations((previous) => [...previous, nextEvaluation]);
    } catch (error) {
      console.error("SPEAKING EVALUATION ERROR:", error);
    }
  }

  async function sendVoiceMessage(text: string) {
    const userMessage: SpeakingMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    const assistantMessageId = crypto.randomUUID();

    const nextMessages: SpeakingMessage[] = [
      ...messagesRef.current,
      userMessage,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
      },
    ];

    messagesRef.current = nextMessages;
    setMessages(nextMessages);

    setPhase("thinking");
    setEvaluation(null);
    setEmmaResponse("");
    setErrorMessage("");

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
          responseText || "Не вдалося надіслати голосове повідомлення.",
        );
      }

      if (!response.body) {
        throw new Error("Ваш браузер не підтримує потокову передачу даних.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";
      let fullResponse = "";

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

        const parsedData: unknown = JSON.parse(dataLines.join("\n"));

        if (typeof parsedData !== "object" || parsedData === null) {
          return;
        }

        const data = parsedData as Record<string, unknown>;

        if (
          eventName === "conversation" &&
          typeof data.conversationId === "string"
        ) {
          setConversationId(data.conversationId);
        }

        if (
          eventName === "conversation" &&
          typeof data.conversationId === "number"
        ) {
          setConversationId(String(data.conversationId));
        }

        if (eventName === "delta" && typeof data.text === "string") {
          fullResponse += data.text;

          setEmmaResponse(fullResponse);

          setMessages((previous) => {
            const updatedMessages = previous.map((message) =>
              message.id === assistantMessageId
                ? {
                    ...message,
                    content: fullResponse,
                  }
                : message,
            );

            messagesRef.current = updatedMessages;

            return updatedMessages;
          });
        }

        if (eventName === "error") {
          throw new Error(
            typeof data.error === "string"
              ? data.error
              : "Emma не змогла відповісти",
          );
        }
      }

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

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

      if (!fullResponse.trim()) {
        throw new Error("Емма повернула порожню відповідь.");
      }

      if (!sessionActiveRef.current) {
        processingTranscriptRef.current = false;
        return;
      }

      await evaluateTranscript(text);

      if (!sessionActiveRef.current) {
        processingTranscriptRef.current = false;
        return;
      }

      speechStartedRef.current = false;
      setPhase("speaking");

      speak(cleanTextForSpeech(fullResponse));
    } catch (error) {
      console.error("SPEAKING MODE ERROR:", error);

      processingTranscriptRef.current = false;

      setPhase("error");

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Під час розмовної практики сталася помилка.",
      );
    }
  }

  const beginListeningRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    beginListeningRef.current = beginListening;
  });

  useEffect(() => {
    if (phase !== "speaking") {
      return;
    }

    if (speechStatus === "speaking") {
      speechStartedRef.current = true;
      return;
    }

    if (speechStatus === "idle" && speechStartedRef.current) {
      speechStartedRef.current = false;
      processingTranscriptRef.current = false;

      if (sessionActiveRef.current) {
        window.setTimeout(() => {
          if (sessionActiveRef.current) {
            void beginListeningRef.current();
          }
        }, 500);
      }
    }
  }, [phase, speechStatus]);

  async function startSession() {
    if (!voiceSupported || startingSession) {
      if (!voiceSupported) {
        setPhase("error");

        setErrorMessage(UI_ERRORS.voiceModeNotSupported);
      }

      return;
    }

    stopSpeaking();
    stopListening();

    sessionActiveRef.current = true;
    processingTranscriptRef.current = true;
    speechStartedRef.current = false;

    messagesRef.current = [];

    setShowReport(false);
    setStartingSession(true);
    setSessionActive(true);
    setPhase("thinking");
    setMessages([]);
    setSessionEvaluations([]);
    setEvaluation(null);
    setConversationId(null);
    setCurrentTranscript("");
    setEmmaResponse("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/speaking/start", {
        method: "POST",
      });

      const responseData: unknown = await response.json();

      if (typeof responseData !== "object" || responseData === null) {
        throw new Error("Сервер повернув некоректну відповідь.");
      }

      const data = responseData as Record<string, unknown>;

      if (!response.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Не вдалося розпочати розмовну практику.",
        );
      }

      if (typeof data.message !== "string") {
        throw new Error("Початкове повідомлення відсутнє.");
      }

      const openingMessage = data.message;

      const openingMessageId = crypto.randomUUID();

      const openingMessages: SpeakingMessage[] = [
        {
          id: openingMessageId,
          role: "assistant",
          content: openingMessage,
        },
      ];

      messagesRef.current = openingMessages;
      setMessages(openingMessages);

      if (typeof data.conversationId === "string") {
        setConversationId(data.conversationId);
      } else if (typeof data.conversationId === "number") {
        setConversationId(String(data.conversationId));
      }

      setEmmaResponse(openingMessage);

      speechStartedRef.current = false;
      setPhase("speaking");

      speak(cleanTextForSpeech(openingMessage));
    } catch (error) {
      console.error("START SPEAKING SESSION ERROR:", error);

      sessionActiveRef.current = false;
      processingTranscriptRef.current = false;

      setSessionActive(false);
      setPhase("error");

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Не можливо почтаку розмовну практику.",
      );
    } finally {
      setStartingSession(false);
    }
  }
  async function completeSpeakingSession() {
    if (completingSessionRef.current) {
      return;
    }

    completingSessionRef.current = true;

    try {
      const response = await fetch("/api/speaking/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          startedAt: new Date(sessionStartedAt).toISOString(),
          durationSeconds: Math.floor((Date.now() - sessionStartedAt) / 1000),
          evaluations: sessionEvaluations,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Не вдалося завершити розмовну практику.",
        );
      }

      setCompletionData({
        xpEarned: data.session.xpEarned,
        progress: data.progress,
      });

      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      completingSessionRef.current = false;
    }
  }

  async function stopSession() {
    const hadActiveSession = sessionActiveRef.current;

    sessionActiveRef.current = false;
    processingTranscriptRef.current = false;
    speechStartedRef.current = false;

    stopListening();
    stopSpeaking();

    setSessionActive(false);
    setPhase("idle");
    setCurrentTranscript("");
    setEmmaResponse("");
    setErrorMessage("");

    if (hadActiveSession) {
      await completeSpeakingSession();
      setShowReport(true);
    }
  }

  function closeReport() {
    setShowReport(false);

    messagesRef.current = [];

    setMessages([]);
    setSessionEvaluations([]);
    setEvaluation(null);
    setConversationId(null);
    setPhase("idle");
    setCurrentTranscript("");
    setEmmaResponse("");
    setErrorMessage("");
  }

  function restartSession() {
    setShowReport(false);
    void startSession();
  }

  function retryListening() {
    processingTranscriptRef.current = false;
    setErrorMessage("");

    if (!sessionActiveRef.current) {
      sessionActiveRef.current = true;
      setSessionActive(true);
    }

    beginListening();
  }

  useEffect(() => {
    return () => {
      sessionActiveRef.current = false;
      stopListening();
      stopSpeaking();
    };
  }, [stopListening, stopSpeaking]);

  if (showReport) {
    return (
      <SpeakingReport
        evaluations={sessionEvaluations}
        messages={messages}
        completionData={completionData}
        onClose={closeReport}
        onRestart={restartSession}
      />
    );
  }

  const phaseInformation = {
    idle: {
      title: "Готові до практики",
      description: "Почніть розмову з Еммою без використання рук.",
      icon: Mic,
    },

    listening: {
      title: "Я слухаю...",
      description: "Говоріть англійською природно.",
      icon: Mic,
    },

    thinking: {
      title: "Emma слухає...",
      description: "YВаша відповідь аналізується.",
      icon: Loader2,
    },

    speaking: {
      title: "Emma говорить",
      description: "Уважно слухайте її відповідь.",
      icon: Volume2,
    },

    error: {
      title: "Голосову сесію призупинено",
      description: errorMessage || "Сталася помилка.",
      icon: MicOff,
    },
  }[phase];

  const PhaseIcon = phaseInformation.icon;

  return (
    <section className="flex min-h-[620px] flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
              sessionActive
                ? "bg-indigo-600 text-white"
                : "bg-indigo-50 text-indigo-600"
            }`}
          >
            <Sparkles className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold text-slate-950">Розмова з Еммою</h2>

            <p className="text-sm text-slate-500">
              Автоматична голосова розмова
            </p>
          </div>
        </div>

        {sessionActive ? (
          <button
            type="button"
            onClick={stopSession}
            className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
          >
            <PhoneOff className="h-4 w-4" />
            Завершити сесію
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void startSession()}
            disabled={startingSession || !voiceSupported}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {startingSession ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}

            {startingSession ? "Починається..." : "Почати говорити"}
          </button>
        )}
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[340px_1fr]">
        <div className="flex flex-col items-center justify-center border-b border-slate-200 bg-slate-50 p-8 text-center lg:border-b-0 lg:border-r">
          <div className="relative">
            {phase === "listening" && (
              <>
                <span className="absolute inset-0 animate-ping rounded-full bg-indigo-300 opacity-40" />
                <span className="absolute -inset-4 animate-pulse rounded-full border border-indigo-200" />
              </>
            )}

            <div
              className={`relative flex h-28 w-28 items-center justify-center rounded-full shadow-lg transition ${
                phase === "listening"
                  ? "bg-indigo-600 text-white"
                  : phase === "thinking"
                    ? "bg-amber-100 text-amber-600"
                    : phase === "speaking"
                      ? "bg-emerald-100 text-emerald-600"
                      : phase === "error"
                        ? "bg-red-100 text-red-600"
                        : "bg-white text-slate-500"
              }`}
            >
              <PhaseIcon
                className={`h-11 w-11 ${
                  phase === "thinking" ? "animate-spin" : ""
                }`}
              />
            </div>
          </div>

          <h3 className="mt-8 text-xl font-bold text-slate-950">
            {phaseInformation.title}
          </h3>

          <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
            {phaseInformation.description}
          </p>

          {phase === "error" && (
            <button
              type="button"
              onClick={retryListening}
              className="mt-5 flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Mic className="h-4 w-4" />
              Спробуйте ще
            </button>
          )}

          {!voiceSupported ? (
            <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700">
              Використовуйте сучасний браузер та дозвольте доступ до мікрофона.
            </p>
          ) : (
            <p className="mt-6 text-xs text-slate-400">
              Після завершення відповіді Емма автоматично знову почне слухати.
            </p>
          )}
        </div>

        <div className="flex min-h-0 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
            {messages.length === 0 ? (
              <div className="flex min-h-full items-center justify-center">
                <div className="max-w-md text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <Bot className="h-7 w-7" />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-slate-950">
                    Почніть голосову розмову
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Натисніть «Почати говорити», відповідайте Еммі англійською
                    та продовжуйте розмову без використання рук.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-2xl space-y-5">
                {messages.map((message) => {
                  const isUser = message.role === "user";

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isUser && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                          <Bot className="h-5 w-5" />
                        </div>
                      )}

                      <div
                        className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-7 ${
                          isUser
                            ? "rounded-br-md bg-indigo-600 text-white"
                            : "rounded-bl-md border border-slate-200 bg-slate-50 text-slate-700"
                        }`}
                      >
                        {message.content ? (
                          <p className="whitespace-pre-wrap">
                            {message.content}
                          </p>
                        ) : (
                          <div className="flex h-7 items-center gap-1.5">
                            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                          </div>
                        )}
                      </div>

                      {isUser && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-600">
                          <UserRound className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {evaluation && (
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-bold text-slate-900">
                        Зворотний зв&apos;язок
                      </h3>

                      <div className="rounded-full bg-white px-3 py-1 text-sm font-bold text-indigo-600">
                        {evaluation.overallScore}/100
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-slate-500">Grammar</p>

                        <p className="mt-1 font-bold text-slate-900">
                          {evaluation.grammarScore}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-3">
                        <p className="text-slate-500">Fluency</p>

                        <p className="mt-1 font-bold text-slate-900">
                          {evaluation.fluencyScore}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-3">
                        <p className="text-slate-500">Vocabulary</p>

                        <p className="mt-1 font-bold text-slate-900">
                          {evaluation.vocabularyScore}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-3">
                        <p className="text-slate-500">Naturalness</p>

                        <p className="mt-1 font-bold text-slate-900">
                          {evaluation.naturalnessScore}
                        </p>
                      </div>
                    </div>

                    {!evaluation.wasCorrect && evaluation.correctedSentence && (
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-slate-800">
                          Better sentence
                        </p>

                        <p className="mt-2 rounded-xl bg-white p-3 text-sm italic text-slate-700">
                          {evaluation.correctedSentence}
                        </p>
                      </div>
                    )}

                    {evaluation.shortFeedback && (
                      <p className="mt-4 text-sm leading-6 text-slate-600">
                        {evaluation.shortFeedback}
                      </p>
                    )}

                    {evaluation.encouragement && (
                      <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
                        {evaluation.encouragement}
                      </div>
                    )}
                  </div>
                )}

                <div ref={messagesBottomRef} />
              </div>
            )}
          </div>

          {(currentTranscript || emmaResponse) && (
            <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-7">
              {phase === "thinking" && currentTranscript && (
                <p className="text-sm text-slate-500">
                  <strong className="text-slate-700">You said:</strong>{" "}
                  {currentTranscript}
                </p>
              )}

              {phase === "speaking" && emmaResponse && (
                <p className="line-clamp-2 text-sm text-slate-500">
                  <strong className="text-slate-700">Emma:</strong>{" "}
                  {emmaResponse}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
