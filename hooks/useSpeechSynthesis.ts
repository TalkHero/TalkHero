"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechStatus = "idle" | "speaking" | "paused";

function splitTextIntoChunks(text: string): string[] {
  const normalizedText = text.replace(/\s+/g, " ").trim();

  if (!normalizedText) {
    return [];
  }

  const chunks = normalizedText.match(/[^.!?,;:]+[.!?,;:]?|.+$/g) ?? [
    normalizedText,
  ];

  return chunks.map((chunk) => chunk.trim()).filter(Boolean);
}

export function useSpeechSynthesis() {
  const [status, setStatus] = useState<SpeechStatus>("idle");

  const [lastText, setLastText] = useState("");

  const chunksRef = useRef<string[]>([]);
  const chunkIndexRef = useRef(0);
  const characterIndexRef = useRef(0);
  const sessionIdRef = useRef(0);
  const pausedByUserRef = useRef(false);

  const isSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const stop = useCallback(() => {
    if (!isSupported) {
      return;
    }

    sessionIdRef.current += 1;
    pausedByUserRef.current = false;
    chunkIndexRef.current = 0;
    characterIndexRef.current = 0;

    window.speechSynthesis.cancel();
    setStatus("idle");
  }, [isSupported]);

  const speakFromCurrentPosition = useCallback(
    (sessionId: number) => {
      if (!isSupported) {
        return;
      }

      function playNextChunk(): void {
        if (sessionId !== sessionIdRef.current) {
          return;
        }

        const chunks = chunksRef.current;
        const chunkIndex = chunkIndexRef.current;

        if (chunkIndex >= chunks.length) {
          characterIndexRef.current = 0;
          setStatus("idle");
          return;
        }

        const fullChunk = chunks[chunkIndex];

        const startIndex = characterIndexRef.current;

        const remainingText = fullChunk.slice(startIndex).trim();

        if (!remainingText) {
          chunkIndexRef.current += 1;
          characterIndexRef.current = 0;
          playNextChunk();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(remainingText);

        utterance.lang = "en-GB";
        utterance.rate = 0.95;
        utterance.pitch = 1;

        utterance.onboundary = (event) => {
          if (sessionId !== sessionIdRef.current) {
            return;
          }

          if (typeof event.charIndex === "number") {
            characterIndexRef.current = startIndex + event.charIndex;
          }
        };

        utterance.onend = () => {
          if (sessionId !== sessionIdRef.current) {
            return;
          }

          if (pausedByUserRef.current) {
            return;
          }

          chunkIndexRef.current += 1;
          characterIndexRef.current = 0;

          playNextChunk();
        };

        utterance.onerror = (event) => {
          if (sessionId !== sessionIdRef.current) {
            return;
          }

          if (event.error === "canceled" || event.error === "interrupted") {
            return;
          }

          console.error("SPEECH SYNTHESIS ERROR:", event.error);

          setStatus("idle");
        };

        window.speechSynthesis.speak(utterance);
      }

      playNextChunk();
    },
    [isSupported],
  );

  const speak = useCallback(
    (text: string) => {
      const normalizedText = text.trim();

      if (!isSupported || !normalizedText) {
        return;
      }

      window.speechSynthesis.cancel();

      const chunks = splitTextIntoChunks(normalizedText);

      if (chunks.length === 0) {
        return;
      }

      const newSessionId = sessionIdRef.current + 1;

      sessionIdRef.current = newSessionId;
      pausedByUserRef.current = false;
      chunksRef.current = chunks;
      chunkIndexRef.current = 0;
      characterIndexRef.current = 0;

      setLastText(normalizedText);
      setStatus("speaking");

      speakFromCurrentPosition(newSessionId);
    },
    [isSupported, speakFromCurrentPosition],
  );

  const pause = useCallback(() => {
    if (!isSupported || status !== "speaking") {
      return;
    }

    pausedByUserRef.current = true;
    sessionIdRef.current += 1;

    window.speechSynthesis.cancel();
    setStatus("paused");
  }, [isSupported, status]);

  const resume = useCallback(() => {
    if (!isSupported || status !== "paused" || !lastText) {
      return;
    }

    const newSessionId = sessionIdRef.current + 1;

    sessionIdRef.current = newSessionId;
    pausedByUserRef.current = false;
    setStatus("speaking");

    speakFromCurrentPosition(newSessionId);
  }, [isSupported, lastText, speakFromCurrentPosition, status]);

  const repeat = useCallback(() => {
    if (!lastText) {
      return;
    }

    speak(lastText);
  }, [lastText, speak]);

  const togglePause = useCallback(() => {
    if (status === "speaking") {
      pause();
      return;
    }

    if (status === "paused") {
      resume();
    }
  }, [pause, resume, status]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
      }
    };
  }, []);

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
