"use client";

import { useEffect, useRef, useState } from "react";
import {
  BookPlus,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";

type VocabularyItem = {
  id: string;
  word: string;
  translation: string | null;
  meaning: string | null;
  example: string | null;
  status: "new" | "learning" | "learned";
};

type SaveWordDialogProps = {
  open: boolean;
  context: string;
  onClose: () => void;
};

export function SaveWordDialog({
  open,
  context,
  onClose,
}: SaveWordDialogProps) {
  const [word, setWord] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedItem, setSavedItem] =
    useState<VocabularyItem | null>(null);
  const [alreadyExists, setAlreadyExists] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setWord("");
    setSaving(false);
    setErrorMessage("");
    setSavedItem(null);
    setAlreadyExists(false);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open, saving]);

  async function saveWord() {
    const normalizedWord = word.trim();

    if (!normalizedWord || saving) {
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSavedItem(null);

    try {
      const response = await fetch(
        "/api/vocabulary/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            word: normalizedWord,
            context,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to save word.",
        );
      }

      setSavedItem(data.vocabularyItem);
      setAlreadyExists(Boolean(data.alreadyExists));
    } catch (error) {
      console.error("SAVE GENERATED WORD ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to save word.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    saveWord();
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !saving
        ) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-word-title"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <BookPlus className="h-5 w-5" />
            </div>

            <div>
              <h2
                id="save-word-title"
                className="font-semibold text-slate-950"
              >
                Save a word
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Emma will create the translation,
                explanation, and example automatically.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {!savedItem ? (
            <form onSubmit={handleSubmit}>
              <label
                htmlFor="vocabulary-word"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Word or phrase
              </label>

              <input
                ref={inputRef}
                id="vocabulary-word"
                type="text"
                value={word}
                onChange={(event) => {
                  setWord(event.target.value);
                  setErrorMessage("");
                }}
                disabled={saving}
                placeholder="For example: exhausted"
                maxLength={100}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50"
              />

              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Context
                </p>

                <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-600">
                  {context}
                </p>
              </div>

              {errorMessage && (
                <p className="mt-4 text-sm font-medium text-red-600">
                  {errorMessage}
                </p>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || !word.trim()}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <BookPlus className="h-4 w-4" />
                  )}

                  {saving
                    ? "Creating card..."
                    : "Create and save"}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />

                <div>
                  <h3 className="font-semibold text-slate-950">
                    {alreadyExists
                      ? "Already in your vocabulary"
                      : "Word saved successfully"}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    The vocabulary card is ready for review.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Word
                  </p>

                  <p className="mt-1 text-lg font-semibold text-slate-950">
                    {savedItem.word}
                  </p>
                </div>

                {savedItem.translation && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Translation
                    </p>

                    <p className="mt-1 text-sm text-slate-700">
                      {savedItem.translation}
                    </p>
                  </div>
                )}

                {savedItem.meaning && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Meaning
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-700">
                      {savedItem.meaning}
                    </p>
                  </div>
                )}

                {savedItem.example && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Example
                    </p>

                    <p className="mt-1 border-l-2 border-indigo-200 pl-3 text-sm italic leading-6 text-slate-600">
                      {savedItem.example}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
