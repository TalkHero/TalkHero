"use client";

import { useCallback, useState } from "react";
import type { ChatMessage } from "@/components/chat/MessageBubble";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

export function useSpeechControls() {
  const [speakingMessageId, setSpeakingMessageId] = useState<
    string | null
  >(null);

  const {
    status,
    isSupported,
    speak,
    pause,
    resume,
    stop,
  } = useSpeechSynthesis();

  const handleSpeakMessage = useCallback(
    (message: ChatMessage) => {
      if (!isSupported || !message.content.trim()) {
        return;
      }

      if (speakingMessageId === message.id) {
        if (status === "speaking") {
          pause();
          return;
        }

        if (status === "paused") {
          resume();
          return;
        }
      }

      stop();
      setSpeakingMessageId(message.id);
      speak(message.content);
    },
    [
      isSupported,
      pause,
      resume,
      speak,
      speakingMessageId,
      status,
      stop,
    ],
  );

  const handleStopSpeaking = useCallback(() => {
    stop();
    setSpeakingMessageId(null);
  }, [stop]);

  const resetSpeech = useCallback(() => {
    stop();
    setSpeakingMessageId(null);
  }, [stop]);

  return {
    speechStatus: status,
    isSpeechSupported: isSupported,
    speakingMessageId,
    handleSpeakMessage,
    handleStopSpeaking,
    resetSpeech,
  };
}
