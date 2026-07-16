"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

type VocabularyStatus = "new" | "learning" | "learned";

type VocabularyItem = {
  id: string;
  word: string;
  translation: string | null;
  meaning: string | null;
  example: string | null;
  status: VocabularyStatus;
  review_count: number;
  created_at: string;
  updated_at: string;
};

const STATUS_LABELS: Record<VocabularyStatus, string> = {
  new: "New",
  learning: "Learning",
  learned: "Learned",
};

const NEXT_STATUS: Record<VocabularyStatus, VocabularyStatus> = {
  new: "learning",
  learning: "learned",
  learned: "new",
};

export function VocabularyManager() {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>(
    [],
  );

  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [meaning, setMeaning] = useState("");
  const [example, setExample] = useState("");

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [updatingId, setUpdatingId] = useState<string | null>(
    null,
  );

  const [deletingId, setDeletingId] = useState<string | null>(
    null,
  );

  const [errorMessage, setErrorMessage] = useState("");

  async function loadVocabulary() {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await fetch("/api/vocabulary", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load vocabulary.",
        );
      }

      setVocabulary(data.vocabulary ?? []);
    } catch (error) {
      console.error("LOAD VOCABULARY ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load vocabulary.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVocabulary();
  }, []);

  const filteredVocabulary = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return vocabulary;
    }

    return vocabulary.filter((item) => {
      return [
        item.word,
        item.translation,
        item.meaning,
        item.example,
      ].some((value) =>
        value?.toLowerCase().includes(normalizedSearch),
      );
    });
  }, [search, vocabulary]);

  async function addWord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!word.trim() || saving) {
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/vocabulary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word,
          translation,
          meaning,
          example,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to add word.",
        );
      }

      setVocabulary((previous) => [
        data.vocabularyItem,
        ...previous,
      ]);

      setWord("");
      setTranslation("");
      setMeaning("");
      setExample("");
    } catch (error) {
      console.error("ADD VOCABULARY ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to add word.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(item: VocabularyItem) {
    if (updatingId || deletingId) {
      return;
    }

    setUpdatingId(item.id);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/vocabulary/${encodeURIComponent(item.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: NEXT_STATUS[item.status],
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update word.",
        );
      }

      setVocabulary((previous) =>
        previous.map((currentItem) =>
          currentItem.id === item.id
            ? data.vocabularyItem
            : currentItem,
        ),
      );
    } catch (error) {
      console.error("UPDATE VOCABULARY ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to update word.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteWord(item: VocabularyItem) {
    if (deletingId || updatingId) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${item.word}" from your vocabulary?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(item.id);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/vocabulary/${encodeURIComponent(item.id)}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to delete word.",
        );
      }

      setVocabulary((previous) =>
        previous.filter(
          (currentItem) => currentItem.id !== item.id,
        ),
      );
    } catch (error) {
      console.error("DELETE VOCABULARY ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to delete word.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={addWord}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Add a new word
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Save useful words and phrases for future practice.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={word}
            onChange={(event) => setWord(event.target.value)}
            placeholder="Word or phrase"
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
          />

          <input
            value={translation}
            onChange={(event) =>
              setTranslation(event.target.value)
            }
            placeholder="Translation"
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
          />

          <textarea
            value={meaning}
            onChange={(event) => setMeaning(event.target.value)}
            placeholder="Meaning or explanation"
            rows={3}
            className="resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
          />

          <textarea
            value={example}
            onChange={(event) => setExample(event.target.value)}
            placeholder="Example sentence"
            rows={3}
            className="resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={saving || !word.trim()}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}

            {saving ? "Adding..." : "Add word"}
          </button>

          {errorMessage && (
            <p className="text-sm font-medium text-red-600">
              {errorMessage}
            </p>
          )}
        </div>
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Your vocabulary
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {vocabulary.length} saved{" "}
              {vocabulary.length === 1 ? "word" : "words"}
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search vocabulary..."
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading vocabulary...
          </div>
        ) : filteredVocabulary.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <BookOpen className="h-7 w-7" />
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              No words found
            </h3>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Add your first word or change the search query.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredVocabulary.map((item) => {
              const isUpdating = updatingId === item.id;
              const isDeleting = deletingId === item.id;

              return (
                <article
                  key={item.id}
                  className="p-5 transition hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-slate-950">
                          {item.word}
                        </h3>

                        {item.translation && (
                          <span className="text-sm text-slate-500">
                            {item.translation}
                          </span>
                        )}

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.status === "learned"
                              ? "bg-emerald-50 text-emerald-700"
                              : item.status === "learning"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {STATUS_LABELS[item.status]}
                        </span>
                      </div>

                      {item.meaning && (
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {item.meaning}
                        </p>
                      )}

                      {item.example && (
                        <p className="mt-2 border-l-2 border-indigo-200 pl-3 text-sm italic leading-6 text-slate-500">
                          {item.example}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => changeStatus(item)}
                        disabled={
                          Boolean(updatingId) ||
                          Boolean(deletingId)
                        }
                        className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}

                        Next status
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteWord(item)}
                        disabled={
                          Boolean(deletingId) ||
                          Boolean(updatingId)
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        aria-label={`Delete ${item.word}`}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
