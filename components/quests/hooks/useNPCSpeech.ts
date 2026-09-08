"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseNPCSpeechOptions = {
  text: string;
  voice: string | null;
  instructions?: string;
};

type TTSFailure = {
  error?: string;
};

export function useNPCSpeech({
  text,
  voice,
  instructions,
}: UseNPCSpeechOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const objectUrlRef = useRef<string | null>(null);

  const abortControllerRef =
    useRef<AbortController | null>(null);

  const sessionIdRef = useRef(0);

  const loadingRef = useRef(false);

  const [loading, setLoading] = useState(false);

  const [playing, setPlaying] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const cleanupAudio = useCallback(() => {
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
      URL.revokeObjectURL(
        objectUrlRef.current,
      );

      objectUrlRef.current = null;
    }

    setPlaying(false);
  }, []);

  const cancelRequest = useCallback(() => {
    abortControllerRef.current?.abort();

    abortControllerRef.current = null;

    loadingRef.current = false;

    setLoading(false);
  }, []);

  const stop = useCallback(() => {
    /*
     * Інвалідуємо всі попередні
     * асинхронні операції.
     */
    sessionIdRef.current += 1;

    cancelRequest();
    cleanupAudio();
  }, [cancelRequest, cleanupAudio]);

  /*
   * При зміні репліки або голосу
   * старе аудіо та старий TTS-запит
   * більше не повинні продовжуватися.
   */
  useEffect(() => {
    sessionIdRef.current += 1;

    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    loadingRef.current = false;

    cleanupAudio();

    setLoading(false);
    setError(null);
  }, [text, voice, cleanupAudio]);

  /*
   * Повне очищення при демонтуванні.
   */
  useEffect(() => {
    return () => {
      sessionIdRef.current += 1;

      abortControllerRef.current?.abort();
      abortControllerRef.current = null;

      if (audioRef.current) {
        audioRef.current.pause();

        audioRef.current.onplay = null;
        audioRef.current.onended = null;
        audioRef.current.onerror = null;

        audioRef.current.removeAttribute(
          "src",
        );

        audioRef.current = null;
      }

      if (objectUrlRef.current) {
        URL.revokeObjectURL(
          objectUrlRef.current,
        );

        objectUrlRef.current = null;
      }
    };
  }, []);

  const play = useCallback(async () => {
    if (!voice || !text.trim()) {
      setError(
        "Для цього персонажа озвучення ще не налаштовано.",
      );

      return;
    }

    /*
     * Якщо репліка вже грає —
     * кнопка працює як Stop.
     */
    if (audioRef.current) {
      stop();

      return;
    }

    /*
     * Не дозволяємо створити два
     * паралельні TTS-запити подвійним кліком.
     */
    if (loadingRef.current) {
      return;
    }

    sessionIdRef.current += 1;

    const sessionId =
      sessionIdRef.current;

    abortControllerRef.current?.abort();

    const controller =
      new AbortController();

    abortControllerRef.current =
      controller;

    loadingRef.current = true;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/tts",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            text,
            voice,
            instructions,
          }),

          signal: controller.signal,
        },
      );

      if (
        sessionId !==
        sessionIdRef.current
      ) {
        return;
      }

      if (!response.ok) {
        let message =
          "Не вдалося завантажити озвучення.";

        try {
          const result =
            (await response.json()) as TTSFailure;

          if (result.error) {
            message = result.error;
          }
        } catch {
          // Сервер міг повернути не JSON.
        }

        throw new Error(message);
      }

      const contentType =
        response.headers.get(
          "content-type",
        );

      if (
        !contentType?.includes("audio")
      ) {
        throw new Error(
          "TTS повернув некоректний формат аудіо.",
        );
      }

      const blob =
        await response.blob();

      if (
        sessionId !==
        sessionIdRef.current
      ) {
        return;
      }

      if (blob.size === 0) {
        throw new Error(
          "TTS повернув порожній аудіофайл.",
        );
      }

      cleanupAudio();

      const objectUrl =
        URL.createObjectURL(blob);

      const audio =
        new Audio(objectUrl);

      objectUrlRef.current =
        objectUrl;

      audioRef.current = audio;

      audio.onplay = () => {
        if (
          sessionId ===
          sessionIdRef.current
        ) {
          setPlaying(true);
        }
      };

      audio.onended = () => {
        if (
          sessionId !==
          sessionIdRef.current
        ) {
          return;
        }

        cleanupAudio();
      };

      audio.onerror = () => {
        if (
          sessionId !==
          sessionIdRef.current
        ) {
          return;
        }

        setError(
          "Браузеру не вдалося відтворити аудіо.",
        );

        cleanupAudio();
      };

      await audio.play();
    } catch (caught) {
      if (
        sessionId !==
        sessionIdRef.current
      ) {
        return;
      }

      if (
        caught instanceof DOMException &&
        caught.name === "AbortError"
      ) {
        return;
      }

      cleanupAudio();

      setError(
        caught instanceof Error
          ? caught.message
          : "Сталася невідома помилка озвучення.",
      );
    } finally {
      /*
       * Старий запит не повинен
       * змінити стан уже нової сесії.
       */
      if (
        sessionId ===
        sessionIdRef.current
      ) {
        abortControllerRef.current =
          null;

        loadingRef.current = false;

        setLoading(false);
      }
    }
  }, [
    cleanupAudio,
    instructions,
    stop,
    text,
    voice,
  ]);

  return {
    loading,
    playing,
    error,
    play,
    stop,
  };
}
