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

  const [loading, setLoading] = useState(false);

  const [playing, setPlaying] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current = null;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setPlaying(false);
  }, []);

  useEffect(() => {
    return cleanupAudio;
  }, [cleanupAudio]);

  useEffect(() => {
    cleanupAudio();
    setError(null);
  }, [text, voice, cleanupAudio]);

  const stop = useCallback(() => {
    cleanupAudio();
  }, [cleanupAudio]);

  const play = useCallback(async () => {
    if (!voice || !text.trim()) {
      setError("Для цього персонажа озвучення ще не налаштовано.");

      return;
    }

    if (playing) {
      stop();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          voice,
          instructions,
        }),
      });

      if (!response.ok) {
        let message = "Не вдалося завантажити озвучення.";

        try {
          const result = (await response.json()) as TTSFailure;

          if (result.error) {
            message = result.error;
          }
        } catch {
          // Сервер міг повернути відповідь не у форматі JSON.
        }

        throw new Error(message);
      }

      cleanupAudio();

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const audio = new Audio(objectUrl);

      objectUrlRef.current = objectUrl;
      audioRef.current = audio;

      audio.addEventListener("play", () => setPlaying(true), { once: true });

      audio.addEventListener(
        "ended",
        () => {
          audioRef.current = null;

          if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
          }

          setPlaying(false);
        },
        { once: true },
      );

      audio.addEventListener(
        "error",
        () => {
          setError("Браузеру не вдалося відтворити аудіо.");

          cleanupAudio();
        },
        { once: true },
      );

      await audio.play();
    } catch (caught) {
      cleanupAudio();

      setError(
        caught instanceof Error
          ? caught.message
          : "Сталася невідома помилка озвучення.",
      );
    } finally {
      setLoading(false);
    }
  }, [cleanupAudio, instructions, playing, stop, text, voice]);

  return {
    loading,
    playing,
    error,
    play,
    stop,
  };
}
