"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type RecorderState = "idle" | "requesting" | "recording" | "processing";

type TranscriptionResponse = {
  text?: string;
  error?: string;
};

function chooseMimeType(): string {
  if (typeof MediaRecorder === "undefined") {
    return "";
  }

  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];

  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function extensionForMimeType(mimeType: string): string {
  if (mimeType.includes("ogg")) {
    return "ogg";
  }

  if (mimeType.includes("mp4")) {
    return "m4a";
  }

  return "webm";
}

export function useVoiceRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number | null>(null);

  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());

    streamRef.current = null;
  }, []);

  const reset = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }

    recorderRef.current = null;
    chunksRef.current = [];
    startedAtRef.current = null;
    stopTracks();
    setState("idle");
    setDurationSeconds(0);
    setError(null);
  }, [stopTracks]);

  useEffect(() => {
    if (state !== "recording") {
      return;
    }

    const timer = window.setInterval(() => {
      const startedAt = startedAtRef.current;

      if (startedAt) {
        setDurationSeconds(Math.floor((Date.now() - startedAt) / 1000));
      }
    }, 250);

    return () => {
      window.clearInterval(timer);
    };
  }, [state]);

  useEffect(() => {
    return () => {
      stopTracks();
    };
  }, [stopTracks]);

  const start = useCallback(async () => {
    setError(null);

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError("Цей браузер не підтримує запис голосу.");
      return;
    }

    setState("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      const mimeType = chooseMimeType();

      const recorder = mimeType
        ? new MediaRecorder(stream, {
            mimeType,
          })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorderRef.current = recorder;

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      });

      recorder.start(250);
      startedAtRef.current = Date.now();
      setDurationSeconds(0);
      setState("recording");
    } catch (caught) {
      stopTracks();
      setState("idle");

      const message =
        caught instanceof DOMException && caught.name === "NotAllowedError"
          ? "Дозвольте браузеру використовувати мікрофон."
          : "Не вдалося розпочати запис голосу.";

      setError(message);
    }
  }, [stopTracks]);

  const stopAndTranscribe = useCallback(async (): Promise<string | null> => {
    const recorder = recorderRef.current;

    if (!recorder || recorder.state === "inactive") {
      return null;
    }

    setState("processing");
    setError(null);

    return await new Promise((resolve) => {
      recorder.addEventListener(
        "stop",
        async () => {
          try {
            stopTracks();

            const mimeType = recorder.mimeType || "audio/webm";

            const blob = new Blob(chunksRef.current, {
              type: mimeType,
            });

            if (blob.size === 0) {
              throw new Error("Запис виявився порожнім.");
            }

            const formData = new FormData();
            const extension = extensionForMimeType(mimeType);

            formData.append("audio", blob, `voice-answer.${extension}`);

            const response = await fetch("/api/stt", {
              method: "POST",
              body: formData,
            });

            const result = (await response.json()) as TranscriptionResponse;

            if (!response.ok) {
              throw new Error(result.error || "Не вдалося розпізнати голос.");
            }

            const text = result.text?.trim() ?? "";

            if (!text) {
              throw new Error("Не вдалося розпізнати слова.");
            }

            resolve(text);
          } catch (caught) {
            setError(
              caught instanceof Error
                ? caught.message
                : "Сталася невідома помилка.",
            );
            resolve(null);
          } finally {
            recorderRef.current = null;
            chunksRef.current = [];
            startedAtRef.current = null;
            setState("idle");
            setDurationSeconds(0);
          }
        },
        { once: true },
      );

      recorder.stop();
    });
  }, [stopTracks]);

  const cancel = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.addEventListener(
        "stop",
        () => {
          chunksRef.current = [];
          recorderRef.current = null;
          startedAtRef.current = null;
          stopTracks();
          setState("idle");
          setDurationSeconds(0);
        },
        { once: true },
      );

      recorderRef.current.stop();
      return;
    }

    reset();
  }, [reset, stopTracks]);

  return {
    state,
    error,
    durationSeconds,
    start,
    stopAndTranscribe,
    cancel,
    reset,
  };
}
