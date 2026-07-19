"use client";

import {
  Loader2,
  Mic,
  MicOff,
  Send,
} from "lucide-react";
import { useEffect, useRef } from "react";

type ChatComposerProps = {
  input: string;
  loading: boolean;
  disabled: boolean;
  isRecognitionSupported: boolean;
  isListening: boolean;
  recognitionError: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onToggleMicrophone: () => void;
};

export function ChatComposer({
  input,
  loading,
  disabled,
  isRecognitionSupported,
  isListening,
  recognitionError,
  onInputChange,
  onSend,
  onToggleMicrophone,
}: ChatComposerProps) {
  const textareaRef =
    useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(
      textarea.scrollHeight,
      160,
    )}px`;
  }, [input]);

  useEffect(() => {
    if (!loading && !disabled) {
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    }
  }, [loading, disabled]);

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  }

  return (
    <div className="shrink-0 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex items-end gap-2 rounded-2xl border border-slate-300 bg-white p-2 shadow-sm transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10">
          {isRecognitionSupported && (
            <button
              type="button"
              onClick={onToggleMicrophone}
              disabled={disabled}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
                isListening
                  ? "bg-red-100 text-red-600 ring-2 ring-red-200"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
              aria-label={
                isListening
                  ? "Stop microphone"
                  : "Start microphone"
              }
              title={
                isListening
                  ? "Stop listening"
                  : "Start speaking"
              }
            >
              {isListening ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </button>
          )}

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(event) =>
              onInputChange(event.target.value)
            }
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
            placeholder="Message Emma..."
            className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
          />

          <button
            type="button"
            onClick={onSend}
            disabled={disabled || !input.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            aria-label="Send message"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>

        {recognitionError && (
          <p className="mt-2 text-center text-xs font-medium text-red-600">
            {recognitionError}
          </p>
        )}

        <p className="mt-2 text-center text-xs text-slate-400">
          Press Enter to send · Shift + Enter for a new line
        </p>
      </div>
    </div>
  );
}
