"use client";

import Link from "next/link";
import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";

import {
  usePlacementTest,
  type PlacementFinalResult,
} from "@/hooks/use-placement-test";
import type {
  AnswerLength,
  PlacementEvaluation,
} from "@/lib/ai/placement-test";
import { trackEvent } from "@/lib/analytics";

const ANSWER_PLACEHOLDERS: Record<
  AnswerLength,
  string
> = {
  short:
    "Напишіть коротку відповідь англійською...",
  medium:
    "Дайте розгорнуту відповідь англійською...",
  long:
    "Напишіть детальну відповідь англійською...",
};

const ANSWER_HINTS: Record<
  AnswerLength,
  string
> = {
  short: "Орієнтовно 1–2 речення",
  medium: "Орієнтовно 3–5 речень",
  long: "Орієнтовно 6–10 речень",
};

function ScoreBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const normalizedValue = Math.max(
    0,
    Math.min(100, value),
  );

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4 text-sm">
        <span className="text-slate-600">
          {label}
        </span>

        <span className="font-semibold text-slate-900">
          {normalizedValue}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-slate-900 transition-all duration-500"
          style={{
            width: `${normalizedValue}%`,
          }}
        />
      </div>
    </div>
  );
}

function LoadingState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="text-center">
        <div className="mx-auto mb-5 h-11 w-11 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

        <h1 className="text-xl font-semibold text-slate-900">
          {title}
        </h1>

        <p className="mt-2 text-slate-600">
          {description}
        </p>
      </div>
    </main>
  );
}

function EvaluationCard({
  evaluation,
}: {
  evaluation: PlacementEvaluation;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Попередня відповідь
          </p>

          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            Результат оцінювання
          </h2>
        </div>

        <span className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white">
          {evaluation.estimatedLevel}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ScoreBar
          label="Граматика"
          value={evaluation.grammar}
        />

        <ScoreBar
          label="Словниковий запас"
          value={evaluation.vocabulary}
        />

        <ScoreBar
          label="Розуміння"
          value={
            evaluation.comprehension
          }
        />

        <ScoreBar
          label="Складність"
          value={evaluation.complexity}
        />

        <ScoreBar
          label="Виконання завдання"
          value={
            evaluation.taskCompletion
          }
        />
      </div>

      <p className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
        {evaluation.feedback}
      </p>
    </section>
  );
}

function getResultSummary(
  result: PlacementFinalResult,
): string | null {
  if (
    typeof result.resultSummary ===
    "string"
  ) {
    return result.resultSummary;
  }

  if (
    result.resultSummary &&
    typeof result.resultSummary.text ===
      "string"
  ) {
    return result.resultSummary.text;
  }

  return null;
}

function FinalResult({
  result,
}: {
  result: PlacementFinalResult;
}) {
  const resultSummary =
    getResultSummary(result);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Тест завершено
          </p>

          <div className="mx-auto mt-5 flex h-28 w-28 items-center justify-center rounded-full bg-slate-900">
            <span className="text-4xl font-bold text-white">
              {result.finalLevel}
            </span>
          </div>

          <h1 className="mt-6 text-3xl font-bold text-slate-900">
            Ваш рівень англійської визначено
          </h1>

          <p className="mt-3 text-slate-600">
            Результат збережено у вашому
            профілі та буде використано для
            персоналізації навчання.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-5 text-center">
            <div className="text-3xl font-bold text-slate-900">
              {result.finalScore}
            </div>

            <div className="mt-1 text-sm text-slate-600">
              Загальний бал зі 100
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-5 text-center">
            <div className="text-3xl font-bold text-slate-900">
              {result.confidence}%
            </div>

            <div className="mt-1 text-sm text-slate-600">
              Впевненість оцінювання
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-5">
          <ScoreBar
            label="Граматика"
            value={result.scores.grammar}
          />

          <ScoreBar
            label="Словниковий запас"
            value={
              result.scores.vocabulary
            }
          />

          <ScoreBar
            label="Розуміння"
            value={
              result.scores.comprehension
            }
          />

          <ScoreBar
            label="Складність мовлення"
            value={
              result.scores.complexity
            }
          />

          <ScoreBar
            label="Виконання завдання"
            value={
              result.scores.taskCompletion
            }
          />
        </div>

        {resultSummary && (
          <p className="mt-8 rounded-2xl bg-slate-50 p-5 leading-7 text-slate-700">
            {resultSummary}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="flex-1 rounded-xl bg-slate-900 px-5 py-3 text-center font-semibold text-white transition hover:bg-slate-700"
          >
            Перейти до навчання
          </Link>

          <Link
            href="/profile"
            className="flex-1 rounded-xl border border-slate-300 px-5 py-3 text-center font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Відкрити профіль
          </Link>
        </div>
      </section>
    </main>
  );
}

const SKILL_LABELS: Record<string, string> = {
  grammar: "Граматика",
  vocabulary: "Словниковий запас",
  reading: "Читання",
  writing: "Письмо",
  speaking: "Говоріння",
  comprehension: "Розуміння",
};

const TOPIC_LABELS: Record<string, string> = {
  personal_information:
    "Особиста інформація",
  daily_life:
    "Повсякденне життя",
  present_simple:
    "Теперішній час",
  past_simple:
    "Минулий час",
  description:
    "Опис",
  experience:
    "Досвід",
  future_forms:
    "Майбутній час",
  opinion:
    "Власна думка",
  comparison:
    "Порівняння",
  argumentation:
    "Аргументація",
  hypothetical_reasoning:
    "Гіпотетичне міркування",
  abstract_discussion:
    "Абстрактне обговорення",
  problem_solving:
    "Розв’язання проблем",
  critical_evaluation:
    "Критичне оцінювання",
  abstract_synthesis:
    "Синтез абстрактних ідей",
  perspective_analysis:
    "Аналіз точок зору",
};

export default function PlacementTestPage() {
  const {
    status,
    question,
    progress,
    evaluation,
    result,
    error,
    startTest,
    submitAnswer,
    retryFinish,
  } = usePlacementTest();

  const [answer, setAnswer] =
    useState("");
const trackedCompletionRef =
  useRef(false);
  useEffect(() => {
    setAnswer("");
  }, [question?.id]);
useEffect(() => {
  if (
    status !== "completed" ||
    !result ||
    trackedCompletionRef.current
  ) {
    return;
  }

  trackedCompletionRef.current = true;

  trackEvent("placement_test_completed", {
    level: result.finalLevel,
    score: result.finalScore,
    confidence: result.confidence,
  });
}, [status, result]);
  const isSubmitting =
    status === "answering" ||
    status === "finishing";

  const progressPercentage =
    useMemo(() => {
      if (
        !progress ||
        progress.total <= 0
      ) {
        return 0;
      }

      return Math.round(
        (progress.completed /
          progress.total) *
          100,
      );
    }, [progress]);

  async function handleSubmit(
  event: FormEvent<HTMLFormElement>,
) {
  event.preventDefault();

  if (
    isSubmitting ||
    !answer.trim()
  ) {
    return;
  }

  const submittedAnswer = answer;

  /*
   * Clear immediately so the previous answer can never
   * appear under the next question while React is
   * switching question state.
   */
  setAnswer("");

  const submittedSuccessfully =
    await submitAnswer(submittedAnswer);

  /*
   * If the request failed before the answer was accepted,
   * restore what the learner typed so they can retry.
   */
  if (!submittedSuccessfully) {
    setAnswer(submittedAnswer);
  }
}



  if (
    status === "idle" ||
    status === "starting"
  ) {
    return (
      <LoadingState
        title="Готуємо тест"
        description="Створюємо перше питання…"
      />
    );
  }

  if (
    status === "finishing"
  ) {
    return (
      <LoadingState
        title="Підраховуємо результат"
        description="Аналізуємо ваші відповіді та визначаємо рівень…"
      />
    );
  }

  if (
    status === "completed" &&
    result
  ) {
    return (
      <FinalResult result={result} />
    );
  }

  if (
    status === "error" &&
    !question
  ) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-4 py-10">
        <section className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            Не вдалося продовжити тест
          </h1>

          <p className="mt-3 text-sm leading-6 text-red-700">
            {error ??
              "Сталася невідома помилка."}
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                void retryFinish();
              }}
              className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700"
            >
              Спробувати завершити
            </button>

            <button
              type="button"
              onClick={() => {
                void startTest();
              }}
              className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Відновити тест
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (!question) {
    return (
      <LoadingState
        title="Завантажуємо питання"
        description="Зачекайте кілька секунд…"
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Тест на визначення рівня
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Визначення рівня англійської
            </h1>
          </div>

          {progress && (
            <div className="shrink-0 text-right">
              <div className="font-semibold text-slate-900">
                {progress.current} /{" "}
                {progress.total}
              </div>

              <div className="text-sm text-slate-500">
                питання
              </div>
            </div>
          )}
        </div>

        {progress && (
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-slate-900 transition-all duration-500"
              style={{
                width: `${progressPercentage}%`,
              }}
            />
          </div>
        )}
      </header>

      <div className="grid gap-6">
        {evaluation && (
          <EvaluationCard
            evaluation={evaluation}
          />
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white">
              {question.level}
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
              {TOPIC_LABELS[question.skill] ??
                SKILL_LABELS[question.skill] ??
                question.skill}
            </span>
          </div>

          <h2 className="text-xl font-semibold leading-8 text-slate-900 sm:text-2xl">
            {question.text}
          </h2>

          <form
            className="mt-7"
            onSubmit={handleSubmit}
          >
            <label
              htmlFor="placement-answer"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Ваша відповідь англійською
            </label>

            <textarea
              id="placement-answer"
              value={answer}
              onChange={(event) => {
                setAnswer(
                  event.target.value,
                );
              }}
              disabled={isSubmitting}
              rows={
                question.expectedAnswerLength ===
                "long"
                  ? 10
                  : question.expectedAnswerLength ===
                      "medium"
                    ? 7
                    : 4
              }
              maxLength={10_000}
              placeholder={
                ANSWER_PLACEHOLDERS[
                  question
                    .expectedAnswerLength
                ]
              }
              className="w-full resize-y rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-50"
            />

            <div className="mt-2 flex items-center justify-between gap-4 text-sm text-slate-500">
              <span>
                {
                  ANSWER_HINTS[
                    question
                      .expectedAnswerLength
                  ]
                }
              </span>

              <span>
                {answer.length} / 10000
              </span>
            </div>

            {error && (
              <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={
                isSubmitting ||
                !answer.trim()
              }
              className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "answering"
                ? "Оцінюємо відповідь…"
                : "Надіслати відповідь"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
