"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;

  start(): void;
  stop(): void;
  abort(): void;

  onstart: (() => void) | null;
  onend: (() => void) | null;

  onresult:
    | ((event: SpeechRecognitionEvent) => void)
    | null;

  onerror:
    | ((event: SpeechRecognitionErrorEvent) => void)
    | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

type SpeechRecognitionStatus =
  | "idle"
  | "listening"
  | "error";

export function useSpeechRecognition() {
  const [status, setStatus] =
    useState<SpeechRecognitionStatus>("idle");

  const [errorMessage, setErrorMessage] = useState("");

  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef =
    useRef<SpeechRecognitionInstance | null>(null);

  const shouldContinueRef = useRef(false);

  useEffect(() => {
    const supported = Boolean(
      window.SpeechRecognition ||
        window.webkitSpeechRecognition,
    );

    setIsSupported(supported);
  }, []);

  const stopListening = useCallback(() => {
    shouldContinueRef.current = false;

    const recognition = recognitionRef.current;

    if (recognition) {
      try {
        recognition.stop();
      } catch {
        recognition.abort();
      }
    }

    setStatus("idle");
  }, []);

  const startListening = useCallback(
    ({
      language = "en-US",
      onTranscript,
    }: {
      language?: string;
      onTranscript: (text: string) => void;
    }) => {
      if (!isSupported) {
        setStatus("error");
        setErrorMessage(
          "Speech recognition is not supported in this browser.",
        );
        return;
      }

      if (status === "listening") {
        stopListening();
        return;
      }

      const RecognitionConstructor =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

      if (!RecognitionConstructor) {
        setStatus("error");
        setErrorMessage(
          "Speech recognition is not supported in this browser.",
        );
        return;
      }

      const recognition =
        new RecognitionConstructor();

      recognition.lang = language;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognitionRef.current = recognition;
      shouldContinueRef.current = true;

      setErrorMessage("");

      recognition.onstart = () => {
        setStatus("listening");
      };

      recognition.onresult = (event) => {
        let finalTranscript = "";

        for (
          let index = event.resultIndex;
          index < event.results.length;
          index += 1
        ) {
          const result = event.results[index];

          if (result.isFinal) {
            finalTranscript +=
              result[0]?.transcript ?? "";
          }
        }

        const normalizedTranscript =
          finalTranscript.trim();

        if (normalizedTranscript) {
          onTranscript(normalizedTranscript);
        }
      };

      recognition.onerror = (event) => {
        if (
          event.error === "aborted" ||
          event.error === "no-speech"
        ) {
          return;
        }

        console.error(
          "SPEECH RECOGNITION ERROR:",
          event.error,
          event.message,
        );

        shouldContinueRef.current = false;
        setStatus("error");

        if (event.error === "not-allowed") {
          setErrorMessage(
            "Microphone permission was denied.",
          );
        } else if (
          event.error === "audio-capture"
        ) {
          setErrorMessage(
            "No microphone was found.",
          );
        } else if (event.error === "network") {
          setErrorMessage(
            "Speech recognition network error.",
          );
        } else {
          setErrorMessage(
            "Speech recognition failed.",
          );
        }
      };

      recognition.onend = () => {
        if (shouldContinueRef.current) {
          try {
            recognition.start();
            return;
          } catch {
            shouldContinueRef.current = false;
          }
        }

        setStatus("idle");
      };

      try {
        recognition.start();
      } catch (error) {
        console.error(
          "START SPEECH RECOGNITION ERROR:",
          error,
        );

        shouldContinueRef.current = false;
        setStatus("error");
        setErrorMessage(
          "Could not start speech recognition.",
        );
      }
    },
    [isSupported, status, stopListening],
  );

  const toggleListening = useCallback(
    ({
      language = "en-US",
      onTranscript,
    }: {
      language?: string;
      onTranscript: (text: string) => void;
    }) => {
      if (status === "listening") {
        stopListening();
        return;
      }

      startListening({
        language,
        onTranscript,
      });
    },
    [startListening, status, stopListening],
  );

  useEffect(() => {
    return () => {
      shouldContinueRef.current = false;
      recognitionRef.current?.abort();
    };
  }, []);

  return {
    status,
    isSupported,
    isListening: status === "listening",
    errorMessage,
    startListening,
    stopListening,
    toggleListening,
  };
}
