"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import type { ChatMessage } from "@/components/chat/MessageBubble";

export type SelectedWord = {
  word: string;
  context: string;
  messageId: string;
  x: number;
  y: number;
};

export type SelectedWordToast = {
  type: "success" | "error";
  text: string;
};

export function useSelectedWord() {
  const [selectedWord, setSelectedWord] =
    useState<SelectedWord | null>(null);

  const [savingSelectedWord, setSavingSelectedWord] =
    useState(false);

  const [toastMessage, setToastMessage] =
    useState<SelectedWordToast | null>(null);

const toastTimeoutRef = useRef<number | undefined>(
  undefined,
);

  const clearSelectedWord = useCallback(() => {
    setSelectedWord(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  const showToast = useCallback(
    (
      type: SelectedWordToast["type"],
      text: string,
    ) => {
      setToastMessage({
        type,
        text,
      });

      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }

      toastTimeoutRef.current = window.setTimeout(() => {
        setToastMessage(null);
        toastTimeoutRef.current = undefined;
      }, 3500);
    },
    [],
  );

  const handleAssistantTextSelection = useCallback(
    (
      message: ChatMessage,
      event: MouseEvent<HTMLDivElement>,
    ) => {
      const container = event.currentTarget;

      window.requestAnimationFrame(() => {
        const selection = window.getSelection();

        if (!selection || selection.rangeCount === 0) {
          setSelectedWord(null);
          return;
        }

        const selectedText = selection
          .toString()
          .replace(/\s+/g, " ")
          .trim();

        if (!selectedText) {
          setSelectedWord(null);
          return;
        }

        if (selectedText.length > 100) {
          showToast(
            "error",
            "Виберіть коротше слово або фразу.",
          );

          setSelectedWord(null);
          return;
        }

        const range = selection.getRangeAt(0);

        if (
          !container.contains(
            range.commonAncestorContainer,
          )
        ) {
          setSelectedWord(null);
          return;
        }

        const rectangle = range.getBoundingClientRect();

        if (!rectangle.width || !rectangle.height) {
          setSelectedWord(null);
          return;
        }

        setSelectedWord({
          word: selectedText,
          context: message.content,
          messageId: message.id,
          x: rectangle.left + rectangle.width / 2,
          y: Math.max(12, rectangle.top - 10),
        });
      });
    },
    [showToast],
  );

  const saveSelectedWord = useCallback(async () => {
    if (!selectedWord || savingSelectedWord) {
      return;
    }

    const wordToSave = selectedWord.word;

    setSavingSelectedWord(true);

    try {
      const response = await fetch(
        "/api/vocabulary/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            word: selectedWord.word,
            context: selectedWord.context,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Не вдалося зберегти слово.",
        );
      }

      clearSelectedWord();

      if (data.alreadyExists) {
        showToast(
          "success",
          `"${data.vocabularyItem.word}" вже є у вашому словнику.`,
        );
      } else {
        showToast(
          "success",
          `Слово "${data.vocabularyItem.word}" додано до словника.`,
        );
      }
    } catch (error) {
      console.error(
        "Помилка збережжня:",
        error,
      );

      showToast(
        "error",
        error instanceof Error
          ? error.message
          : `Не вдалося зберегти "${wordToSave}".`,
      );
    } finally {
      setSavingSelectedWord(false);
    }
  }, [
    clearSelectedWord,
    savingSelectedWord,
    selectedWord,
    showToast,
  ]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  return {
    selectedWord,
    savingSelectedWord,
    toastMessage,
    clearSelectedWord,
    handleAssistantTextSelection,
    saveSelectedWord,
  };
}
