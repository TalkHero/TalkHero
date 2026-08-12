"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechStatus = "idle" | "speaking" | "paused";

type TTSFailure = {
  error?: string;
};

type PreparedAudio = {
  audio: HTMLAudioElement;
  objectUrl: string;
};

function detectUkrainian(text: string): boolean {
  const ukrainianLetters = text.match(/[іїєґІЇЄҐ]/g)?.length ?? 0;

  const cyrillicLetters = text.match(/[а-яА-ЯіїєґІЇЄҐ]/g)?.length ?? 0;

  if (ukrainianLetters > 0) {
    return true;
  }

  const latinLetters = text.match(/[a-zA-Z]/g)?.length ?? 0;

  return cyrillicLetters > latinLetters;
}

function createVoiceInstructions(text: string): string {
  if (detectUkrainian(text)) {
    return [
      "Speak natural Ukrainian with native pronunciation.",
      "Use a warm, lively, friendly female tutor voice.",
      "Speak at normal conversational speed.",
      "Use expressive, natural intonation and rhythm.",
      "Do not sound robotic, formal, flat, or overly slow.",
      "Pronounce English phrases naturally in British English.",
    ].join(" ");
  }

  return [
    "Speak natural British English.",
    "Use a warm, lively, friendly female tutor voice.",
    "Speak at normal conversational speed with clear pronunciation.",
    "Use expressive, natural intonation and rhythm.",
    "Do not sound robotic, formal, flat, or overly slow.",
    "Pronounce Ukrainian phrases naturally in Ukrainian.",
  ].join(" ");
}

function splitTextForSpeech(text: string): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return [];
  }

  /*
   * Ріжемо за завершенням речень.
   * Завдяки цьому перший TTS-запит
   * значно коротший за всю репліку.
   */
  const sentences = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [normalized];

  const chunks: string[] = [];

  for (const sentence of sentences) {
    const trimmed = sentence.trim();

    if (!trimmed) {
      continue;
    }

    /*
     * Дуже короткий шматок краще
     * приєднати до попереднього,
     * щоб Emma не звучала уривчасто.
     */
    if (trimmed.length < 18 && chunks.length > 0) {
      const previousIndex = chunks.length - 1;

      chunks[previousIndex] = `${chunks[previousIndex]} ${trimmed}`;

      continue;
    }

    /*
     * API приймає максимум
     * 1200 символів.
     */
    if (trimmed.length <= 1100) {
      chunks.push(trimmed);
      continue;
    }

    const words = trimmed.split(" ");

    let current = "";

    for (const word of words) {
      const next = current ? `${current} ${word}` : word;

      if (next.length > 1100) {
        if (current) {
          chunks.push(current);
        }

        current = word;
      } else {
        current = next;
      }
    }

    if (current) {
      chunks.push(current);
    }
  }

  return chunks;
}

export function useSpeechSynthesis() {
  const [status, setStatus] = useState<SpeechStatus>("idle");

  const [lastText, setLastText] = useState("");

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const objectUrlRef = useRef<string | null>(null);

  const nextAudioRef = useRef<PreparedAudio | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const sessionIdRef = useRef(0);

  const chunksRef = useRef<string[]>([]);

  const chunkIndexRef = useRef(0);

  const isSupported =
    typeof window !== "undefined" &&
    typeof Audio !== "undefined" &&
    typeof URL !== "undefined";

  const revokePreparedAudio = useCallback((prepared: PreparedAudio | null) => {
    if (!prepared) {
      return;
    }

    prepared.audio.pause();
    prepared.audio.onplay = null;
    prepared.audio.onended = null;
    prepared.audio.onerror = null;

    prepared.audio.removeAttribute("src");

    prepared.audio.load();

    URL.revokeObjectURL(prepared.objectUrl);
  }, []);

  const cleanupCurrentAudio = useCallback(() => {
    const audio = audioRef.current;

    if (audio) {
      audio.pause();

      audio.onplay = null;
      audio.onended = null;
      audio.onerror = null;

      audio.removeAttribute("src");

      audio.load();

      audioRef.current = null;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);

      objectUrlRef.current = null;
    }
  }, []);

  const cleanupAllAudio = useCallback(() => {
    cleanupCurrentAudio();

    revokePreparedAudio(nextAudioRef.current);

    nextAudioRef.current = null;
  }, [cleanupCurrentAudio, revokePreparedAudio]);

  const requestAudio = useCallback(
    async (text: string, signal: AbortSignal): Promise<PreparedAudio> => {
      const response = await fetch("/api/tts", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          text,
          voice: "marin",
          instructions: createVoiceInstructions(text),
        }),

        signal,
      });

      if (!response.ok) {
        let message = "Не вдалося створити озвучення.";

        try {
          const result = (await response.json()) as TTSFailure;

          if (result.error) {
            message = result.error;
          }
        } catch {
          // Сервер міг повернути не JSON.
        }

        throw new Error(message);
      }

      const contentType = response.headers.get("content-type");

      if (!contentType?.includes("audio")) {
        throw new Error("TTS повернув некоректний формат аудіо.");
      }

      /*
       * Поки браузерний Audio API
       * не може напряму програти
       * fetch ReadableStream,
       * збираємо blob одного
       * короткого речення.
       *
       * Виграш у тому, що тепер
       * не чекаємо генерацію всієї
       * довгої репліки.
       */
      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error("TTS повернув порожній аудіофайл.");
      }

      const objectUrl = URL.createObjectURL(blob);

      const audio = new Audio();

      audio.preload = "auto";
      audio.src = objectUrl;

      audio.load();

      return {
        audio,
        objectUrl,
      };
    },
    [],
  );

  const stop = useCallback(() => {
    sessionIdRef.current += 1;

    abortControllerRef.current?.abort();

    abortControllerRef.current = null;

    chunksRef.current = [];
    chunkIndexRef.current = 0;

    cleanupAllAudio();

    setStatus("idle");
  }, [cleanupAllAudio]);

  const speak = useCallback(
    async (text: string) => {
      const normalizedText = text.trim();

      if (!isSupported || !normalizedText) {
        return;
      }

      const chunks = splitTextForSpeech(normalizedText);

      if (chunks.length === 0) {
        return;
      }

      sessionIdRef.current += 1;

      const sessionId = sessionIdRef.current;

      abortControllerRef.current?.abort();

      cleanupAllAudio();

      const controller = new AbortController();

      abortControllerRef.current = controller;

      chunksRef.current = chunks;

      chunkIndexRef.current = 0;

      setLastText(normalizedText);

      setStatus("idle");

      const playPreparedAudio = async (
        prepared: PreparedAudio,
        index: number,
      ): Promise<void> => {
        if (sessionId !== sessionIdRef.current) {
          revokePreparedAudio(prepared);

          return;
        }

        cleanupCurrentAudio();

        audioRef.current = prepared.audio;

        objectUrlRef.current = prepared.objectUrl;

        /*
         * Якщо це аудіо вже було
         * підготовлене як next,
         * більше не тримаємо його
         * в nextAudioRef.
         */
        if (nextAudioRef.current?.objectUrl === prepared.objectUrl) {
          nextAudioRef.current = null;
        }

        const audio = prepared.audio;

        audio.onplay = () => {
          if (sessionId === sessionIdRef.current) {
            setStatus("speaking");
          }
        };

        audio.onerror = (event) => {
          if (sessionId !== sessionIdRef.current) {
            return;
          }

          console.error("TTS AUDIO PLAYBACK ERROR", {
            error: event,

            mediaError: audio.error
              ? {
                  code: audio.error.code,

                  message: audio.error.message,
                }
              : null,

            chunk: chunksRef.current[index],

            readyState: audio.readyState,

            networkState: audio.networkState,
          });

          stop();
        };

        /*
         * Поки Emma говорить
         * поточне речення,
         * заздалегідь генеруємо
         * наступне.
         */
        const nextIndex = index + 1;

        let nextPromise: Promise<PreparedAudio> | null = null;

        if (nextIndex < chunksRef.current.length) {
          nextPromise = requestAudio(
            chunksRef.current[nextIndex],
            controller.signal,
          );

          void nextPromise
            .then((nextPrepared) => {
              if (sessionId !== sessionIdRef.current) {
                revokePreparedAudio(nextPrepared);

                return;
              }

              nextAudioRef.current = nextPrepared;
            })
            .catch((error) => {
              if (
                error instanceof DOMException &&
                error.name === "AbortError"
              ) {
                return;
              }

              console.error("TTS PREFETCH ERROR:", error);
            });
        }

        audio.onended = async () => {
          if (sessionId !== sessionIdRef.current) {
            return;
          }

          chunkIndexRef.current = nextIndex;

          if (nextIndex >= chunksRef.current.length) {
            cleanupCurrentAudio();

            abortControllerRef.current = null;

            setStatus("idle");

            return;
          }

          try {
            let nextPrepared = nextAudioRef.current;

            if (!nextPrepared && nextPromise) {
              nextPrepared = await nextPromise;
            }

            if (!nextPrepared) {
              nextPrepared = await requestAudio(
                chunksRef.current[nextIndex],
                controller.signal,
              );
            }

            if (sessionId !== sessionIdRef.current) {
              revokePreparedAudio(nextPrepared);

              return;
            }

            await playPreparedAudio(nextPrepared, nextIndex);
          } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
              return;
            }

            console.error("TTS NEXT CHUNK ERROR:", error);

            stop();
          }
        };

        try {
          await audio.play();
        } catch (error) {
          if (sessionId !== sessionIdRef.current) {
            return;
          }

          console.error("TTS PLAY ERROR:", error);

          stop();
        }
      };

      try {
        /*
         * Чекаємо тільки ПЕРШЕ
         * коротке речення.
         */
        const firstPrepared = await requestAudio(chunks[0], controller.signal);

        if (sessionId !== sessionIdRef.current) {
          revokePreparedAudio(firstPrepared);

          return;
        }

        await playPreparedAudio(firstPrepared, 0);
      } catch (error) {
        if (sessionId !== sessionIdRef.current) {
          return;
        }

        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("SPEAKING TTS ERROR:", error);

        stop();
      }
    },
    [
      cleanupAllAudio,
      cleanupCurrentAudio,
      isSupported,
      requestAudio,
      revokePreparedAudio,
      stop,
    ],
  );

  const pause = useCallback(() => {
    const audio = audioRef.current;

    if (!audio || status !== "speaking") {
      return;
    }

    audio.pause();

    setStatus("paused");
  }, [status]);

  const resume = useCallback(async () => {
    const audio = audioRef.current;

    if (!audio || status !== "paused") {
      return;
    }

    try {
      await audio.play();

      setStatus("speaking");
    } catch (error) {
      console.error("TTS RESUME ERROR:", error);

      stop();
    }
  }, [status, stop]);

  const repeat = useCallback(() => {
    if (!lastText) {
      return;
    }

    void speak(lastText);
  }, [lastText, speak]);

  const togglePause = useCallback(() => {
    if (status === "speaking") {
      pause();

      return;
    }

    if (status === "paused") {
      void resume();
    }
  }, [pause, resume, status]);

  useEffect(() => {
    return () => {
      sessionIdRef.current += 1;

      abortControllerRef.current?.abort();

      cleanupAllAudio();
    };
  }, [cleanupAllAudio]);

  return {
    status,
    isSupported,
    lastText,

    isSpeaking: status === "speaking",

    isPaused: status === "paused",

    speak,
    pause,
    resume,
    togglePause,
    repeat,
    stop,
  };
}
