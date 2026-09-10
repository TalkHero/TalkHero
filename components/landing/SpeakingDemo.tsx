"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Gift,
  Loader2,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type DemoMessage = {
  role: "user" | "assistant";
  content: string;
};

type DemoResponse = {
  reply: string;
  hasCorrection: boolean;
  originalSentence: string;
  correctedSentence: string;
  explanation: string;
};

type SttResponse = {
  text?: string;
  error?: string;
};

const MAX_USER_MESSAGES = 2;

export function SpeakingDemo() {
  const [messages, setMessages] = useState<DemoMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I’m Emma 👋 What do you like doing in your free time?",
    },
  ]);

  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [lastCorrection, setLastCorrection] =
    useState<DemoResponse | null>(null);

  const [autoplayEnabled, setAutoplayEnabled] =
    useState(true);

  const [isSpeaking, setIsSpeaking] = useState(false);

  const [isRecording, setIsRecording] =
    useState(false);

  const [isTranscribing, setIsTranscribing] =
    useState(false);

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(null);

  const mediaStreamRef =
    useRef<MediaStream | null>(null);

  const audioChunksRef = useRef<Blob[]>([]);

  const audioRef =
    useRef<HTMLAudioElement | null>(null);

  const audioUrlRef =
    useRef<string | null>(null);

  const userMessagesCount = useMemo(
    () =>
      messages.filter(
        (message) => message.role === "user",
      ).length,
    [messages],
  );

  const demoFinished =
    userMessagesCount >= MAX_USER_MESSAGES;

  const latestEmmaMessage = useMemo(() => {
    for (
      let index = messages.length - 1;
      index >= 0;
      index -= 1
    ) {
      if (messages[index].role === "assistant") {
        return messages[index].content;
      }
    }

    return "";
  }, [messages]);

  function cleanupAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    setIsSpeaking(false);
  }

  function cleanupRecorder() {
    mediaStreamRef.current
      ?.getTracks()
      .forEach((track) => track.stop());

    mediaStreamRef.current = null;
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];

    setIsRecording(false);
  }

  async function speakEmma(text: string) {
    const normalizedText = text.trim();

    if (!normalizedText) {
      return;
    }

    cleanupAudio();

    try {
      const response = await fetch(
        "/api/demo/tts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: normalizedText,
            voice: "nova",
            instructions:
              "Speak natural British English. Use a warm, lively, friendly female tutor voice. Speak clearly at a comfortable conversational pace.",
          }),
        },
      );

      if (!response.ok) {
        let message =
          "Не вдалося озвучити відповідь Emma.";

        try {
          const result =
            (await response.json()) as {
              error?: string;
            };

          if (result.error) {
            message = result.error;
          }
        } catch {
          // Response may not be JSON.
        }

        throw new Error(message);
      }

      const blob = await response.blob();

      if (!blob.size) {
        throw new Error(
          "Сервіс озвучення повернув порожній файл.",
        );
      }

      const objectUrl =
        URL.createObjectURL(blob);

      const audio = new Audio(objectUrl);

      audioRef.current = audio;
      audioUrlRef.current = objectUrl;

      audio.onplay = () => {
        setIsSpeaking(true);
      };

      audio.onended = () => {
        cleanupAudio();
      };

      audio.onerror = () => {
        cleanupAudio();
      };

      await audio.play();
    } catch (caught) {
      console.error(
        "DEMO TTS ERROR:",
        caught,
      );

      cleanupAudio();
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const message = answer.trim();

    if (
      !message ||
      loading ||
      demoFinished
    ) {
      return;
    }

    setLoading(true);
    setError("");
    setLastCorrection(null);

    const previousMessages = [...messages];

    const nextMessages: DemoMessage[] = [
      ...previousMessages,
      {
        role: "user",
        content: message,
      },
    ];

    setMessages(nextMessages);
    setAnswer("");

    try {
      const response = await fetch(
        "/api/demo/speaking",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            message,
            history:
              previousMessages.slice(-4),
          }),
        },
      );

      const data: unknown =
        await response.json();

      if (
        typeof data !== "object" ||
        data === null
      ) {
        throw new Error(
          "Некоректна відповідь сервера.",
        );
      }

      if (!response.ok) {
        const possibleError =
          data as {
            error?: unknown;
          };

        throw new Error(
          typeof possibleError.error ===
            "string"
            ? possibleError.error
            : "Не вдалося отримати відповідь Emma.",
        );
      }

      if (!("reply" in data)) {
        throw new Error(
          "Некоректна відповідь сервера.",
        );
      }

      const result =
        data as DemoResponse;

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: result.reply,
        },
      ]);

      if (result.hasCorrection) {
        setLastCorrection(result);
      }

      if (autoplayEnabled) {
        void speakEmma(result.reply);
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Не вдалося отримати відповідь Emma.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function startRecording() {
    if (
      isRecording ||
      isTranscribing ||
      demoFinished ||
      loading
    ) {
      return;
    }

    setError("");

    if (
      typeof navigator ===
        "undefined" ||
      !navigator.mediaDevices
        ?.getUserMedia ||
      typeof MediaRecorder ===
        "undefined"
    ) {
      setError(
        "Цей браузер не підтримує запис голосу.",
      );

      return;
    }

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          },
        );

      mediaStreamRef.current = stream;

      const preferredTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ];

      const mimeType =
        preferredTypes.find((type) =>
          MediaRecorder.isTypeSupported(
            type,
          ),
        ) ?? "";

      const recorder = mimeType
        ? new MediaRecorder(stream, {
            mimeType,
          })
        : new MediaRecorder(stream);

      mediaRecorderRef.current =
        recorder;

      audioChunksRef.current = [];

      recorder.addEventListener(
        "dataavailable",
        (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(
              event.data,
            );
          }
        },
      );

      recorder.addEventListener(
        "stop",
        () => {
          void transcribeRecording(
            recorder.mimeType ||
              "audio/webm",
          );
        },
        {
          once: true,
        },
      );

      recorder.start(250);

      setIsRecording(true);
    } catch (caught) {
      cleanupRecorder();

      if (
        caught instanceof DOMException &&
        caught.name ===
          "NotAllowedError"
      ) {
        setError(
          "Дозвольте браузеру використовувати мікрофон.",
        );

        return;
      }

      setError(
        "Не вдалося розпочати запис голосу.",
      );
    }
  }

  function stopRecording() {
    const recorder =
      mediaRecorderRef.current;

    if (
      !recorder ||
      recorder.state === "inactive"
    ) {
      return;
    }

    setIsRecording(false);

    try {
      recorder.stop();
    } catch {
      cleanupRecorder();
    }
  }

  async function transcribeRecording(
    mimeType: string,
  ) {
    setIsTranscribing(true);

    try {
      mediaStreamRef.current
        ?.getTracks()
        .forEach((track) =>
          track.stop(),
        );

      mediaStreamRef.current = null;

      const blob = new Blob(
        audioChunksRef.current,
        {
          type: mimeType,
        },
      );

      audioChunksRef.current = [];

      if (!blob.size) {
        throw new Error(
          "Запис виявився порожнім.",
        );
      }

      const extension =
        mimeType.includes("ogg")
          ? "ogg"
          : mimeType.includes("mp4")
            ? "m4a"
            : "webm";

      const formData =
        new FormData();

      formData.append(
        "audio",
        blob,
        `demo-answer.${extension}`,
      );

      const response = await fetch(
        "/api/demo/stt",
        {
          method: "POST",
          body: formData,
        },
      );

      const result =
        (await response.json()) as SttResponse;

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Не вдалося розпізнати голос.",
        );
      }

      const transcript =
        result.text?.trim() ?? "";

      if (!transcript) {
        throw new Error(
          "Не вдалося розпізнати слова.",
        );
      }

      setAnswer(transcript);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Не вдалося розпізнати голос.",
      );
    } finally {
      cleanupRecorder();
      setIsTranscribing(false);
    }
  }

  function toggleAutoplay() {
    setAutoplayEnabled(
      (current) => {
        const next = !current;

        if (!next) {
          cleanupAudio();
        }

        return next;
      },
    );
  }

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }

      if (audioUrlRef.current) {
        URL.revokeObjectURL(
          audioUrlRef.current,
        );
      }

      const recorder =
        mediaRecorderRef.current;

      if (
        recorder &&
        recorder.state !== "inactive"
      ) {
        try {
          recorder.stop();
        } catch {
          // Ignore cleanup failure.
        }
      }

      mediaStreamRef.current
        ?.getTracks()
        .forEach((track) =>
          track.stop(),
        );
    };
  }, []);

  return (
    <section
  id="speaking-demo"
  className="bg-white px-4 pb-10 pt-14 sm:px-6 sm:pb-14 sm:pt-20"
>
      <div className="mx-auto max-w-4xl">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
            <Sparkles className="h-4 w-4" />

            Спробуй TalkHero прямо зараз
          </div>

          <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Поговори з Emma
          </h2>

          <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg">
            Вона відповість і покаже, як
            сказати природніше.
          </p>
        </div>

        <div className="mx-auto mt-9 max-w-2xl overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(79,70,229,0.10)]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 ring-2 ring-white shadow-md">
                <Image
                  src="/images/emma/emma-hero.png"
                  alt="Emma"
                  width={96}
                  height={96}
                  className="absolute left-1/2 top-[4px] w-[86px] max-w-none -translate-x-1/2"
                />

                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
              </div>

              <div className="min-w-0">
                <p className="truncate font-black text-slate-950">
                  Emma
                </p>

                <p className="truncate text-xs font-medium text-slate-500">
                  AI English Coach
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleAutoplay}
                aria-label={
                  autoplayEnabled
                    ? "Вимкнути автовідтворення"
                    : "Увімкнути автовідтворення"
                }
                title={
                  autoplayEnabled
                    ? "Автовідтворення увімкнено"
                    : "Автовідтворення вимкнено"
                }
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                  autoplayEnabled
                    ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                    : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                }`}
              >
                {autoplayEnabled ? (
                  <Volume2 className="h-5 w-5" />
                ) : (
                  <VolumeX className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Conversation */}
          <div className="min-w-0 space-y-4 overflow-hidden bg-gradient-to-b from-slate-50/70 to-white px-3 py-5 sm:px-6 sm:py-6">
            {messages.map(
              (message, index) => {
                const isUser =
                  message.role === "user";

                return (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex min-w-0 items-end gap-2.5 ${
                      isUser
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {!isUser && (
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-indigo-100 to-violet-100">
                        <Image
                          src="/images/emma/emma-hero.png"
                          alt=""
                          width={72}
                          height={72}
                          className="absolute left-1/2 top-[3px] w-[64px] max-w-none -translate-x-1/2"
                        />
                      </div>
                    )}

                    <div
                      className={`min-w-0 max-w-[calc(100%-46px)] break-words rounded-[20px] px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[82%] sm:text-[15px] ${
                        isUser
                          ? "rounded-br-md bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
                          : "rounded-bl-md border border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                );
              },
            )}

            {loading && (
              <div className="flex items-end gap-2.5">
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-indigo-100 to-violet-100">
                  <Image
                    src="/images/emma/emma-hero.png"
                    alt=""
                    width={72}
                    height={72}
                    className="absolute left-1/2 top-[3px] w-[64px] max-w-none -translate-x-1/2"
                  />
                </div>

                <div className="flex items-center gap-2 rounded-[20px] rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />

                  Emma думає...
                </div>
              </div>
            )}

            {lastCorrection && (
              <div className="mt-1 rounded-[22px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                    <Sparkles className="h-4 w-4" />
                  </div>

                  <p className="text-sm font-black text-slate-950">
                    Emma помітила помилку
                  </p>
                </div>

                {lastCorrection.originalSentence && (
                  <div className="mt-3 flex items-center gap-3 rounded-2xl bg-red-50 px-3 py-2.5">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
                      <X className="h-3.5 w-3.5" />
                    </div>

                    <p className="min-w-0 text-sm leading-5 text-red-800">
                      {
                        lastCorrection.originalSentence
                      }
                    </p>
                  </div>
                )}

                {lastCorrection.correctedSentence && (
                  <div className="mt-2 flex items-center gap-3 rounded-2xl bg-emerald-50 px-3 py-2.5">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check className="h-3.5 w-3.5" />
                    </div>

                    <p className="min-w-0 text-sm font-medium leading-5 text-emerald-900">
                      {
                        lastCorrection.correctedSentence
                      }
                    </p>
                  </div>
                )}

                {lastCorrection.explanation && (
                  <p className="mt-3 text-sm leading-5 text-slate-600">
                    {
                      lastCorrection.explanation
                    }
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Input / registration wall */}
          <div className="border-t border-slate-100 bg-white p-4 sm:p-5">
            {!demoFinished ? (
              <>
                <form
                  onSubmit={handleSubmit}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={answer}
                    onChange={(event) =>
                      setAnswer(
                        event.target.value,
                      )
                    }
                    maxLength={500}
                    placeholder={
                      isRecording
                        ? "Говоріть..."
                        : isTranscribing
                          ? "Розпізнаю голос..."
                          : "Напишіть відповідь англійською..."
                    }
                    disabled={
                      loading ||
                      isTranscribing
                    }
                    className="h-12 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50"
                  />

                  <button
                    type="button"
                    onClick={
                      isRecording
                        ? stopRecording
                        : () =>
                            void startRecording()
                    }
                    disabled={
                      loading ||
                      isTranscribing
                    }
                    aria-label={
                      isRecording
                        ? "Зупинити запис"
                        : "Говорити голосом"
                    }
                    className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition ${
                      isRecording
                        ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    {isRecording && (
                      <span className="absolute inset-0 animate-ping rounded-2xl bg-red-400 opacity-20" />
                    )}

                    {isTranscribing ? (
                      <Loader2 className="relative h-5 w-5 animate-spin" />
                    ) : isRecording ? (
                      <MicOff className="relative h-5 w-5" />
                    ) : (
                      <Mic className="relative h-5 w-5" />
                    )}
                  </button>

                  <button
                    type="submit"
                    disabled={
                      !answer.trim() ||
                      loading ||
                      isRecording ||
                      isTranscribing
                    }
                    aria-label="Надіслати"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </form>

                <div className="mt-3 flex items-center justify-between gap-3 px-1">
                  <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-slate-400 sm:text-xs">
                    <Gift className="h-3.5 w-3.5 shrink-0" />

                    <span className="truncate">
                      2 відповіді безкоштовно · Без
                      реєстрації
                    </span>
                  </div>

                  {latestEmmaMessage && (
                    <button
                      type="button"
                      onClick={() =>
                        void speakEmma(
                          latestEmmaMessage,
                        )
                      }
                      disabled={isSpeaking}
                      className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-indigo-600 transition hover:text-indigo-700 disabled:opacity-50 sm:text-xs"
                    >
                      {isSpeaking ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Volume2 className="h-3.5 w-3.5" />
                      )}

                      Слухати Emma
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-[24px] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5 text-center shadow-sm sm:p-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/20">
                  <Sparkles className="h-5 w-5" />
                </div>

                <h3 className="mt-4 text-xl font-black tracking-tight text-slate-950">
                  Продовжимо розмову?
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
                  Продовжуй практику з Emma без
                  обмежень. Створи безкоштовний
                  акаунт за кілька секунд.
                </p>

                <div className="mx-auto mt-4 grid max-w-sm gap-2 text-left">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className="h-4 w-4 shrink-0 text-emerald-500" />

                    Персональні виправлення помилок
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className="h-4 w-4 shrink-0 text-emerald-500" />

                    Голосова практика з AI
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className="h-4 w-4 shrink-0 text-emerald-500" />

                    Прогрес від A1 до C2
                  </div>
                </div>

                <Link
                  href="/register"
                  className="mt-5 inline-flex h-12 w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5"
                >
                  Продовжити з Emma

                  <ArrowRight className="h-4 w-4" />
                </Link>

                <p className="mt-3 text-xs text-slate-500">
                  Безкоштовно · Без картки · 30
                  секунд
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
