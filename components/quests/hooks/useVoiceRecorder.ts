"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type RecorderState = "idle" | "requesting" | "recording" | "processing";

type TranscriptionResponse = {
  text?: string;
  error?: string;
};

type StartAutoTranscribeOptions = {
  onTranscript: (text: string) => void;
  onError?: (message: string) => void;
  silenceMs?: number;
  maxRecordingMs?: number;
};

type StartRecorderOptions = {
  autoStop?: boolean;
  onTranscript?: (text: string) => void;
  onError?: (message: string) => void;
  silenceMs?: number;
  maxRecordingMs?: number;
};

const DEFAULT_SILENCE_MS = 900;
const DEFAULT_MAX_RECORDING_MS = 30_000;

/*
 * Поріг RMS.
 *
 * 0.015–0.025 зазвичай добре працює
 * для звичайного мікрофона ноутбука.
 */
const SPEECH_THRESHOLD = 0.018;

/*
 * Не вважаємо випадковий короткий шум
 * початком мовлення.
 */
const MIN_SPEECH_ACTIVITY_MS = 140;

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

  const audioContextRef = useRef<AudioContext | null>(null);

  const analyserRef = useRef<AnalyserNode | null>(null);

  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const animationFrameRef = useRef<number | null>(null);

  const speechStartedRef = useRef(false);

  const speechActivityStartedAtRef = useRef<number | null>(null);

  const lastSpeechAtRef = useRef<number | null>(null);

  const autoStopRef = useRef(false);

  const autoTranscriptCallbackRef = useRef<((text: string) => void) | null>(
    null,
  );

  const autoErrorCallbackRef = useRef<((message: string) => void) | null>(null);

  const silenceMsRef = useRef(DEFAULT_SILENCE_MS);

  const maxRecordingMsRef = useRef(DEFAULT_MAX_RECORDING_MS);

  const autoStopTriggeredRef = useRef(false);

  const [state, setState] = useState<RecorderState>("idle");

  const [error, setError] = useState<string | null>(null);

  const [durationSeconds, setDurationSeconds] = useState(0);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());

    streamRef.current = null;
  }, []);

  const stopVad = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);

      animationFrameRef.current = null;
    }

    sourceNodeRef.current?.disconnect();

    sourceNodeRef.current = null;
    analyserRef.current = null;

    const audioContext = audioContextRef.current;

    audioContextRef.current = null;

    if (audioContext) {
      void audioContext.close().catch(() => {
        // AudioContext може вже бути закритий.
      });
    }

    speechStartedRef.current = false;

    speechActivityStartedAtRef.current = null;

    lastSpeechAtRef.current = null;
  }, []);

  const clearAutoMode = useCallback(() => {
    autoStopRef.current = false;

    autoTranscriptCallbackRef.current = null;

    autoErrorCallbackRef.current = null;

    autoStopTriggeredRef.current = false;

    silenceMsRef.current = DEFAULT_SILENCE_MS;

    maxRecordingMsRef.current = DEFAULT_MAX_RECORDING_MS;
  }, []);

  const transcribeBlob = useCallback(
    async (blob: Blob, mimeType: string): Promise<string> => {
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

      return text;
    },
    [],
  );

  const reset = useCallback(() => {
    const recorder = recorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {
        // Recorder уже міг завершитися.
      }
    }

    recorderRef.current = null;

    chunksRef.current = [];

    startedAtRef.current = null;

    stopVad();
    stopTracks();
    clearAutoMode();

    setState("idle");
    setDurationSeconds(0);
    setError(null);
  }, [clearAutoMode, stopTracks, stopVad]);

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
      stopVad();
      stopTracks();

      const recorder = recorderRef.current;

      if (recorder && recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          // Компонент уже демонтується.
        }
      }
    };
  }, [stopTracks, stopVad]);

  const processRecorderStop = useCallback(
    async (recorder: MediaRecorder): Promise<string | null> => {
      try {
        stopVad();
        stopTracks();

        setState("processing");

        const mimeType = recorder.mimeType || "audio/webm";

        const blob = new Blob(chunksRef.current, {
          type: mimeType,
        });

        const text = await transcribeBlob(blob, mimeType);

        setError(null);

        return text;
      } catch (caught) {
        const message =
          caught instanceof Error
            ? caught.message
            : "Сталася невідома помилка.";

        setError(message);

        return null;
      } finally {
        recorderRef.current = null;

        chunksRef.current = [];

        startedAtRef.current = null;

        setState("idle");

        setDurationSeconds(0);
      }
    },
    [stopTracks, stopVad, transcribeBlob],
  );

  const startVad = useCallback(
    (stream: MediaStream, recorder: MediaRecorder) => {
      if (typeof window === "undefined") {
        return;
      }

      const AudioContextClass = window.AudioContext;

      if (!AudioContextClass) {
        console.warn(
          "AudioContext is not supported. Automatic silence detection is unavailable.",
        );

        return;
      }

      const audioContext = new AudioContextClass();

      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 1024;

      analyser.smoothingTimeConstant = 0.25;

      const source = audioContext.createMediaStreamSource(stream);

      source.connect(analyser);

      audioContextRef.current = audioContext;

      analyserRef.current = analyser;

      sourceNodeRef.current = source;

      const samples = new Float32Array(analyser.fftSize);

      function monitor(): void {
        if (recorder.state !== "recording" || !autoStopRef.current) {
          return;
        }

        analyser.getFloatTimeDomainData(samples);

        let sumSquares = 0;

        for (let index = 0; index < samples.length; index += 1) {
          const sample = samples[index];

          sumSquares += sample * sample;
        }

        const rms = Math.sqrt(sumSquares / samples.length);

        const now = performance.now();

        if (rms >= SPEECH_THRESHOLD) {
          lastSpeechAtRef.current = now;

          if (speechActivityStartedAtRef.current === null) {
            speechActivityStartedAtRef.current = now;
          }

          const activeFor = now - speechActivityStartedAtRef.current;

          if (activeFor >= MIN_SPEECH_ACTIVITY_MS) {
            speechStartedRef.current = true;
          }
        } else {
          speechActivityStartedAtRef.current = null;

          /*
           * Не завершуємо запис,
           * доки користувач ще
           * взагалі не почав говорити.
           */
          if (speechStartedRef.current && lastSpeechAtRef.current !== null) {
            const silenceFor = now - lastSpeechAtRef.current;

            if (
              silenceFor >= silenceMsRef.current &&
              !autoStopTriggeredRef.current
            ) {
              autoStopTriggeredRef.current = true;

              stopVad();

              if (recorder.state === "recording") {
                recorder.stop();
              }

              return;
            }
          }
        }

        /*
         * Захист від нескінченного
         * запису, якщо користувач
         * довго говорить або
         * мікрофон ловить шум.
         */
        const startedAt = startedAtRef.current;

        if (startedAt) {
          const recordingFor = Date.now() - startedAt;

          if (
            recordingFor >= maxRecordingMsRef.current &&
            !autoStopTriggeredRef.current
          ) {
            autoStopTriggeredRef.current = true;

            stopVad();

            if (recorder.state === "recording") {
              recorder.stop();
            }

            return;
          }
        }

        animationFrameRef.current = window.requestAnimationFrame(monitor);
      }

      animationFrameRef.current = window.requestAnimationFrame(monitor);
    },
    [stopVad],
  );

  const start = useCallback(
    async (options: StartRecorderOptions = {}) => {
      setError(null);

      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      ) {
        setError("Цей браузер не підтримує запис голосу.");

        return;
      }

      const currentRecorder = recorderRef.current;

      if (currentRecorder && currentRecorder.state !== "inactive") {
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

        startedAtRef.current = null;

        speechStartedRef.current = false;

        speechActivityStartedAtRef.current = null;

        lastSpeechAtRef.current = null;

        autoStopTriggeredRef.current = false;

        autoStopRef.current = options.autoStop === true;

        autoTranscriptCallbackRef.current = options.onTranscript ?? null;

        autoErrorCallbackRef.current = options.onError ?? null;

        silenceMsRef.current = Math.max(
          500,
          options.silenceMs ?? DEFAULT_SILENCE_MS,
        );

        maxRecordingMsRef.current = Math.max(
          5000,
          options.maxRecordingMs ?? DEFAULT_MAX_RECORDING_MS,
        );

        recorder.addEventListener("dataavailable", (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        });

        recorder.addEventListener(
          "stop",
          () => {
            const wasAutoMode = autoStopRef.current;

            const onTranscript = autoTranscriptCallbackRef.current;

            const onError = autoErrorCallbackRef.current;

            void processRecorderStop(recorder).then((text) => {
              if (wasAutoMode && text && onTranscript) {
                onTranscript(text);
              }

              if (wasAutoMode && !text && onError) {
                onError("Не вдалося розпізнати голос.");
              }

              clearAutoMode();
            });
          },
          { once: true },
        );

        /*
         * 250 мс дає невеликі
         * MediaRecorder chunks
         * і нормально працює
         * з webm/opus.
         */
        recorder.start(250);

        startedAtRef.current = Date.now();

        setDurationSeconds(0);

        setState("recording");

        if (options.autoStop) {
          startVad(stream, recorder);
        }
      } catch (caught) {
        stopVad();
        stopTracks();
        clearAutoMode();

        setState("idle");

        const message =
          caught instanceof DOMException && caught.name === "NotAllowedError"
            ? "Дозвольте браузеру використовувати мікрофон."
            : "Не вдалося розпочати запис голосу.";

        setError(message);

        options.onError?.(message);
      }
    },
    [clearAutoMode, processRecorderStop, startVad, stopTracks, stopVad],
  );

  const startAutoTranscribe = useCallback(
    async ({
      onTranscript,
      onError,
      silenceMs = DEFAULT_SILENCE_MS,
      maxRecordingMs = DEFAULT_MAX_RECORDING_MS,
    }: StartAutoTranscribeOptions) => {
      await start({
        autoStop: true,
        onTranscript,
        onError,
        silenceMs,
        maxRecordingMs,
      });
    },
    [start],
  );

  const stopAndTranscribe = useCallback(async (): Promise<string | null> => {
    const recorder = recorderRef.current;

    if (!recorder || recorder.state === "inactive") {
      return null;
    }

    /*
     * Для ручного режиму
     * auto callback не потрібен.
     */
    autoStopRef.current = false;

    stopVad();

    return await new Promise((resolve) => {
      recorder.addEventListener(
        "stop",
        () => {
          void processRecorderStop(recorder).then(resolve);
        },
        { once: true },
      );

      recorder.stop();
    });
  }, [processRecorderStop, stopVad]);

  const cancel = useCallback(() => {
    const recorder = recorderRef.current;

    /*
     * Не даємо автоматичному
     * stop handler відправити
     * transcript при cancel.
     */
    autoStopRef.current = false;

    autoTranscriptCallbackRef.current = null;

    autoErrorCallbackRef.current = null;

    stopVad();

    if (recorder && recorder.state !== "inactive") {
      /*
       * Очищаємо chunks ДО stop,
       * щоб випадково не
       * транскрибувати cancel.
       */
      chunksRef.current = [];

      recorderRef.current = null;

      recorder.addEventListener(
        "stop",
        () => {
          startedAtRef.current = null;

          stopTracks();

          clearAutoMode();

          setState("idle");

          setDurationSeconds(0);
        },
        { once: true },
      );

      try {
        recorder.stop();
      } catch {
        stopTracks();

        clearAutoMode();

        setState("idle");
      }

      return;
    }

    reset();
  }, [clearAutoMode, reset, stopTracks, stopVad]);

  return {
    state,
    error,
    durationSeconds,

    /*
     * Старий API.
     */
    start,
    stopAndTranscribe,
    cancel,
    reset,

    /*
     * Новий hands-free API
     * для Speaking Mode.
     */
    startAutoTranscribe,

    isRecording: state === "recording",

    isProcessing: state === "processing",
  };
}
