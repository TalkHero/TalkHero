"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Sparkles,
} from "lucide-react";

type ReviewGrade = "again" | "hard" | "good" | "easy";

type ReviewCard = {
  id: string;
  word: string;
  translation: string | null;
  meaning: string | null;
  example: string | null;
  status: "new" | "learning" | "learned";
  review_count: number;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string;
  last_reviewed_at: string | null;
};

type ReviewStats = {
  due: number;
  total: number;
  learned: number;
};

const GRADE_BUTTONS: {
  grade: ReviewGrade;
  label: string;
  hint: string;
  className: string;
}[] = [
  {
    grade: "again",
    label: "Again",
    hint: "10 min",
    className:
      "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  },
  {
    grade: "hard",
    label: "Hard",
    hint: "1 day",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
  },
  {
    grade: "good",
    label: "Good",
    hint: "Normal",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
  },
  {
    grade: "easy",
    label: "Easy",
    hint: "Longer",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  },
];

export function ReviewSession() {
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    due: 0,
    total: 0,
    learned: 0,
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [answerVisible, setAnswerVisible] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submittingGrade, setSubmittingGrade] =
    useState<ReviewGrade | null>(null);

  const [errorMessage, setErrorMessage] = useState("");

  async function loadCards() {
    try {
      setLoading(true);
      setErrorMessage("");
      setCurrentIndex(0);
      setReviewedCount(0);
      setAnswerVisible(false);

      const response = await fetch("/api/review", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Не вдалося завантажити картки для повторення.",
        );
      }

      setCards(data.cards ?? []);
      setStats(
        data.stats ?? {
          due: 0,
          total: 0,
          learned: 0,
        },
      );
    } catch (error) {
      console.error("LOAD REVIEW CARDS ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Не вдалося завантажити картки для повторення.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCards();
  }, []);

  const currentCard = cards[currentIndex] ?? null;
  const initialCardCount = cards.length;

  const progress =
    initialCardCount > 0
      ? Math.round(
          (reviewedCount / initialCardCount) * 100,
        )
      : 0;

  const reviewCompleted =
    !loading &&
    initialCardCount > 0 &&
    currentIndex >= initialCardCount;

  async function submitGrade(grade: ReviewGrade) {
    if (!currentCard || submittingGrade) {
      return;
    }

    setSubmittingGrade(grade);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/review/${encodeURIComponent(currentCard.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            grade,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Не вдалося зберегти результат повторення.",
        );
      }

      setReviewedCount((previous) => previous + 1);
      setCurrentIndex((previous) => previous + 1);
      setAnswerVisible(false);

      setStats((previous) => ({
        ...previous,
        learned:
          data.card?.status === "learned" &&
          currentCard.status !== "learned"
            ? previous.learned + 1
            : previous.learned,
      }));
    } catch (error) {
      console.error("SUBMIT REVIEW GRADE ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Не вдалося зберегти результат повторення.",
      );
    } finally {
      setSubmittingGrade(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-500 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading review cards...
        </div>
      </div>
    );
  }

  if (errorMessage && cards.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="font-semibold text-red-700">
          Could not load your review
        </p>

        <p className="mt-2 text-sm text-red-600">
          {errorMessage}
        </p>

        <button
          type="button"
          onClick={loadCards}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          <RotateCcw className="h-4 w-4" />
          Спробуйте ще
        </button>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <h2 className="mt-5 text-2xl font-bold text-slate-950">
          You’re all caught up
        </h2>

        <p className="mt-2 text-slate-500">
          There are no vocabulary cards due for review right
          now.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-2xl font-bold text-slate-950">
              {stats.total}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-400">
              Усього слів
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-2xl font-bold text-emerald-600">
              {stats.learned}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-400">
              Вивчено
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (reviewCompleted) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Sparkles className="h-8 w-8" />
        </div>

        <h2 className="mt-5 text-3xl font-bold text-slate-950">
          Хороша робота!
        </h2>

        <p className="mt-2 text-slate-500">
         Ви завершили сьогоднішній огляд словникового запасу.
        </p>

        <div className="mt-8 rounded-2xl bg-slate-50 p-6">
          <p className="text-4xl font-bold text-indigo-600">
            {reviewedCount}
          </p>

          <p className="mt-2 text-sm font-medium text-slate-500">
            {reviewedCount === 1
              ? "word reviewed"
              : "words reviewed"}
          </p>
        </div>

        <button
          type="button"
          onClick={loadCards}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <RotateCcw className="h-4 w-4" />
          Перевірте наявність інших карток
        </button>
      </div>
    );
  }

  if (!currentCard) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Щоденний огляд
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {reviewedCount} of {initialCardCount} completed
            </p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Brain className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-300"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
        <div className="flex min-h-[380px] flex-col items-center justify-center px-6 py-12 text-center sm:px-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <BookOpen className="h-6 w-6" />
          </div>

          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Слово
          </p>

          <h2 className="mt-3 break-words text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            {currentCard.word}
          </h2>

          {!answerVisible ? (
            <button
              type="button"
              onClick={() => setAnswerVisible(true)}
              className="mt-10 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Показати відповідь
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <div className="mt-8 w-full max-w-xl space-y-5 border-t border-slate-200 pt-8">
              {currentCard.translation && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Переклад
                  </p>

                  <p className="mt-2 text-xl font-semibold text-slate-800">
                    {currentCard.translation}
                  </p>
                </div>
              )}

              {currentCard.meaning && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Значення
                  </p>

                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {currentCard.meaning}
                  </p>
                </div>
              )}

              {currentCard.example && (
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Наприклад
                  </p>

                  <p className="mt-2 text-sm italic leading-7 text-slate-600">
                    “{currentCard.example}”
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {answerVisible && (
          <div className="border-t border-slate-200 bg-slate-50 p-4 sm:p-5">
            <p className="mb-3 text-center text-xs font-medium text-slate-500">
              Наскільки добре ви запам'ятали це слово?
            </p>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {GRADE_BUTTONS.map((button) => {
                const isSubmitting =
                  submittingGrade === button.grade;

                return (
                  <button
                    key={button.grade}
                    type="button"
                    onClick={() =>
                      submitGrade(button.grade)
                    }
                    disabled={Boolean(submittingGrade)}
                    className={`rounded-xl border px-3 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${button.className}`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {isSubmitting && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}

                      {button.label}
                    </span>

                    <span className="mt-1 block text-[11px] font-medium opacity-70">
                      {button.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <p className="mt-4 text-center text-sm font-medium text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
