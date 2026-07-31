"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import type {
  AssessmentAnswerStatus,
  AssessmentQuestionCategory,
  AssessmentQuestionOption,
  AssessmentQuestionType,
  CefrLevel,
  PublicAssessmentTest,
} from "@/lib/testing/types";
import type { LearningRecommendation } from "@/lib/ai/recommendations";

type RuntimeAssessmentOption =
  | string
  | AssessmentQuestionOption;

type RuntimeAssessmentQuestion = {
  id: string;
  cefrLevel: CefrLevel;
  category: AssessmentQuestionCategory;
  questionType: AssessmentQuestionType;
  prompt: string;
  passage: string | null;
  options: RuntimeAssessmentOption[] | null;
  difficulty: number;
  estimatedTimeSeconds: number | null;
  topic: string | null;
};

type AssessmentProgress = {
  current: number;
  total: number;
  answered: number;
  skipped: number;
};

type StartAttemptResponse = {
  attemptId: string;
  resumed: boolean;
  test: PublicAssessmentTest;
  progress: AssessmentProgress;
  question: RuntimeAssessmentQuestion;
};

type AssessmentEvaluation = {
  status: Extract<
    AssessmentAnswerStatus,
    "correct" | "incorrect" | "skipped"
  >;
  isCorrect: boolean;
  correctAnswer: unknown;
  explanationUk: string | null;
};

type AssessmentActionResponse = {
  attemptId: string;
  completed: boolean;
  passed: boolean | null;
  percentage: number | null;
  progress: AssessmentProgress;
  evaluation: AssessmentEvaluation;
  question: RuntimeAssessmentQuestion | null;
  recommendations: LearningRecommendation | null;
};

type AssessmentResult = {
  recommendations: LearningRecommendation | null;
  passed: boolean | null;
  percentage: number;
  progress: AssessmentProgress;
};

type ApiErrorResponse = {
  error?: unknown;
  code?: unknown;
};

type RunnerStatus =
  | "loading"
  | "ready"
  | "submitting"
  | "feedback"
  | "completed"
  | "error";

type AssessmentRunnerProps = {
  slug: string;
};

const CATEGORY_LABELS: Record<
  AssessmentQuestionCategory,
  string
> = {
  grammar: "Граматика",
  vocabulary: "Словниковий запас",
  reading: "Читання",
  listening: "Аудіювання",
  writing: "Письмо",
  speaking: "Говоріння",
};

const QUESTION_TYPE_LABELS: Record<
  AssessmentQuestionType,
  string
> = {
  multiple_choice: "Оберіть одну відповідь",
  fill_gap: "Заповніть пропуск",
  reading_choice: "Дайте відповідь за текстом",
  true_false: "Правда чи неправда",
  matching: "Установіть відповідність",
  open_response: "Відкрита відповідь",
};

function getApiErrorMessage(
  payload: ApiErrorResponse,
  fallback: string,
): string {
  if (
    typeof payload.error === "string" &&
    payload.error.trim()
  ) {
    return payload.error;
  }

  return fallback;
}

async function parseJsonResponse<T>(
  response: Response,
): Promise<T> {
  const text = await response.text();

  if (!text) {
    throw new Error(
      "Сервер повернув порожню відповідь.",
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      "Сервер повернув некоректну відповідь.",
    );
  }
}

function getOptionKey(
  option: RuntimeAssessmentOption,
  index: number,
): string {
  if (typeof option === "string") {
    return `${index}:${option}`;
  }

  return option.id;
}

function getOptionText(
  option: RuntimeAssessmentOption,
): string {
  if (typeof option === "string") {
    return option;
  }

  return option.text;
}

function getAnswerPayload(
  option: RuntimeAssessmentOption,
): unknown {
  if (typeof option === "string") {
    return option;
  }

  return {
    optionId: option.id,
  };
}

function formatCorrectAnswer(
  value: unknown,
  question: RuntimeAssessmentQuestion,
): string {
  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (
    value &&
    typeof value === "object" &&
    "optionId" in value
  ) {
    const optionId = (
      value as {
        optionId?: unknown;
      }
    ).optionId;

    if (typeof optionId === "string") {
      const option = question.options?.find(
        (candidate) =>
          typeof candidate !== "string" &&
          candidate.id === optionId,
      );

      if (
        option &&
        typeof option !== "string"
      ) {
        return option.text;
      }

      return optionId;
    }
  }

  if (
    value &&
    typeof value === "object" &&
    "acceptedAnswers" in value
  ) {
    const acceptedAnswers = (
      value as {
        acceptedAnswers?: unknown;
      }
    ).acceptedAnswers;

    if (Array.isArray(acceptedAnswers)) {
      return acceptedAnswers
        .filter(
          (answer): answer is string =>
            typeof answer === "string",
        )
        .join(", ");
    }
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function LoadingState() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-foreground" />

        <h1 className="mt-5 text-xl font-semibold">
          Завантажуємо тест
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Готуємо запитання та відновлюємо ваш прогрес.
        </p>
      </div>
    </main>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-xl text-destructive">
          !
        </div>

        <h1 className="mt-5 text-xl font-semibold">
          Не вдалося відкрити тест
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {message}
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Button
            type="button"
            size="lg"
            onClick={onRetry}
            className="w-full"
          >
            Спробувати ще раз
          </Button>

          <Button
            nativeButton={false}
            variant="outline"
            size="lg"
            render={
              <Link href="/dashboard" />
            }
            className="w-full"
          >
            Повернутися на головну
          </Button>
        </div>
      </section>
    </main>
  );
}

function CompletedState({
  test,
  result,
}: {
  test: PublicAssessmentTest;
  result: AssessmentResult;
}) {
  const passedLabel =
    result.passed === null
      ? "Результат збережено"
      : result.passed
        ? "Тест складено"
        : "Тест завершено";
const recommendations =
  result.recommendations;
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-9">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {passedLabel}
          </p>

          <div className="mx-auto mt-6 flex h-32 w-32 items-center justify-center rounded-full bg-foreground text-background">
            <span className="text-3xl font-bold">
              {Math.round(result.percentage)}%
            </span>
          </div>

          <h1 className="mt-7 text-3xl font-bold">
            {test.name}
          </h1>

          <p className="mx-auto mt-3 max-w-xl leading-7 text-muted-foreground">
            Ви відповіли на всі запитання. Результат
            збережено у вашому акаунті.
          </p>
        </div>
{recommendations && (
  <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
    <h3 className="text-lg font-semibold">
      🤖 Emma рекомендує
    </h3>

    <p className="mt-2 text-sm text-slate-700">
      {recommendations.summary}
    </p>

    {recommendations.strongestCategories.length >
      0 && (
      <div className="mt-5">
        <p className="font-medium">
          ⭐ Ваші сильні сторони
        </p>

        <ul className="mt-2 list-disc pl-5">
          {recommendations.strongestCategories.map(
            (category) => (
              <li key={category.category}>
                {category.category} —{" "}
                {category.percentage}%
              </li>
            ),
          )}
        </ul>
      </div>
    )}

    {recommendations.recommendedTopics.length >
      0 && (
      <div className="mt-5">
        <p className="font-medium">
          📚 Рекомендуємо повторити
        </p>

        <ul className="mt-2 list-disc pl-5">
          {recommendations.recommendedTopics.map(
            (topic) => (
              <li key={topic}>
                {topic}
              </li>
            ),
          )}
        </ul>
      </div>
    )}
  </div>
)}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-muted p-5 text-center">
            <div className="text-2xl font-bold">
              {result.progress.answered}
            </div>

            <div className="mt-1 text-sm text-muted-foreground">
              відповідей
            </div>
          </div>

          <div className="rounded-2xl bg-muted p-5 text-center">
            <div className="text-2xl font-bold">
              {result.progress.skipped}
            </div>

            <div className="mt-1 text-sm text-muted-foreground">
              «Не знаю»
            </div>
          </div>

          <div className="rounded-2xl bg-muted p-5 text-center">
            <div className="text-2xl font-bold">
              {result.progress.total}
            </div>

            <div className="mt-1 text-sm text-muted-foreground">
              запитань
            </div>
          </div>
        </div>

        {result.passed !== null && (
          <div
            className={[
              "mt-6 rounded-2xl border p-5 text-center",
              result.passed
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-amber-200 bg-amber-50 text-amber-900",
            ].join(" ")}
          >
            <p className="font-semibold">
              {result.passed
                ? "Вітаємо, прохідний бал набрано."
                : "Прохідний бал поки не набрано."}
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            nativeButton={false}
            size="lg"
            render={
              <Link href="/dashboard" />
            }
            className="flex-1"
          >
            До навчання
          </Button>

          <Button
            nativeButton={false}
            variant="outline"
            size="lg"
            render={
              <Link href="/profile" />
            }
            className="flex-1"
          >
            Відкрити профіль
          </Button>
        </div>
      </section>
    </main>
  );
}

export function AssessmentRunner({
  slug,
}: AssessmentRunnerProps) {
  const [status, setStatus] =
    useState<RunnerStatus>("loading");

  const [attemptId, setAttemptId] =
    useState<string | null>(null);

  const [test, setTest] =
    useState<PublicAssessmentTest | null>(null);

  const [question, setQuestion] =
    useState<RuntimeAssessmentQuestion | null>(
      null,
    );

  const [progress, setProgress] =
    useState<AssessmentProgress | null>(null);

  const [selectedOptionKey, setSelectedOptionKey] =
    useState<string | null>(null);

  const [selectedAnswer, setSelectedAnswer] =
    useState<unknown>(null);

  const [evaluation, setEvaluation] =
    useState<AssessmentEvaluation | null>(
      null,
    );

  const [pendingQuestion, setPendingQuestion] =
    useState<RuntimeAssessmentQuestion | null>(
      null,
    );

  const [pendingProgress, setPendingProgress] =
    useState<AssessmentProgress | null>(
      null,
    );

  const [result, setResult] =
    useState<AssessmentResult | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const loadAttempt = useCallback(async () => {
    setStatus("loading");
    setError(null);
    setEvaluation(null);
    setSelectedOptionKey(null);
    setSelectedAnswer(null);

    try {
      const response = await fetch(
        `/api/tests/${encodeURIComponent(slug)}/attempts`,
        {
          method: "POST",
        },
      );

      if (response.status === 401) {
        const nextPath = `/assessment/${encodeURIComponent(slug)}`;

        window.location.href =
          `/login?next=${encodeURIComponent(nextPath)}`;

        return;
      }

      const payload =
        await parseJsonResponse<
          StartAttemptResponse | ApiErrorResponse
        >(response);

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            payload as ApiErrorResponse,
            "Не вдалося розпочати тест.",
          ),
        );
      }

      const attempt =
        payload as StartAttemptResponse;

      setAttemptId(attempt.attemptId);
      setTest(attempt.test);
      setProgress(attempt.progress);
      setQuestion(attempt.question);
      setStatus("ready");
    } catch (loadError) {
      console.error(
        "Failed to load assessment:",
        loadError,
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Не вдалося завантажити тест.",
      );

      setStatus("error");
    }
  }, [slug]);

  useEffect(() => {
    void loadAttempt();
  }, [loadAttempt]);

  const progressPercentage = useMemo(() => {
    if (!progress || progress.total <= 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.round(
        (progress.answered / progress.total) *
          100,
      ),
    );
  }, [progress]);

  const submitAction = useCallback(
    async (
      action: "answer" | "skip",
    ): Promise<void> => {
      if (
        !attemptId ||
        !question ||
        status === "submitting"
      ) {
        return;
      }

      if (
        action === "answer" &&
        selectedAnswer === null
      ) {
        return;
      }

      setStatus("submitting");
      setError(null);

      try {
        const endpoint =
          action === "answer"
            ? `/api/tests/${encodeURIComponent(slug)}/attempts/${encodeURIComponent(attemptId)}/answers`
            : `/api/tests/${encodeURIComponent(slug)}/attempts/${encodeURIComponent(attemptId)}/skip`;

        const body =
          action === "answer"
            ? {
                questionId: question.id,
                answer: selectedAnswer,
              }
            : {
                questionId: question.id,
              };

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(body),
        });

        if (response.status === 401) {
          const nextPath = `/assessment/${encodeURIComponent(slug)}`;

          window.location.href =
            `/login?next=${encodeURIComponent(nextPath)}`;

          return;
        }

        const payload =
          await parseJsonResponse<
            AssessmentActionResponse | ApiErrorResponse
          >(response);

        if (!response.ok) {
          const apiError =
            payload as ApiErrorResponse;

          if (
            response.status === 409 &&
            (
              apiError.code ===
                "QUESTION_ALREADY_ANSWERED" ||
              apiError.code ===
                "QUESTION_OUT_OF_SEQUENCE"
            )
          ) {
            await loadAttempt();
            return;
          }

          throw new Error(
            getApiErrorMessage(
              apiError,
              action === "answer"
                ? "Не вдалося зберегти відповідь."
                : "Не вдалося пропустити запитання.",
            ),
          );
        }

        const actionResult =
          payload as AssessmentActionResponse;

        setEvaluation(
          actionResult.evaluation,
        );

        if (actionResult.completed) {
          setProgress(
            actionResult.progress,
          );

          setResult({
            passed: actionResult.passed,
            percentage:
              actionResult.percentage ?? 0,
              recommendations:
  actionResult.recommendations ?? null,
            progress:
              actionResult.progress,
          });

          setStatus("completed");
          return;
        }

        setPendingQuestion(
          actionResult.question,
        );

        setPendingProgress(
          actionResult.progress,
        );

        setStatus("feedback");
      } catch (submitError) {
        console.error(
          "Failed to submit assessment action:",
          submitError,
        );

        setError(
          submitError instanceof Error
            ? submitError.message
            : "Не вдалося зберегти дію.",
        );

        setStatus("ready");
      }
    },
    [
      attemptId,
      loadAttempt,
      question,
      selectedAnswer,
      slug,
      status,
    ],
  );

  function moveToNextQuestion() {
    if (!pendingQuestion || !pendingProgress) {
      void loadAttempt();
      return;
    }

    setQuestion(pendingQuestion);
    setProgress(pendingProgress);
    setPendingQuestion(null);
    setPendingProgress(null);
    setEvaluation(null);
    setSelectedOptionKey(null);
    setSelectedAnswer(null);
    setError(null);
    setStatus("ready");
  }

  if (status === "loading") {
    return <LoadingState />;
  }

  if (status === "error") {
    return (
      <ErrorState
        message={
          error ??
          "Сталася невідома помилка."
        }
        onRetry={() => {
          void loadAttempt();
        }}
      />
    );
  }

  if (
    status === "completed" &&
    test &&
    result
  ) {
    return (
      <CompletedState
        test={test}
        result={result}
      />
    );
  }

  if (
    !test ||
    !question ||
    !progress ||
    !attemptId
  ) {
    return <LoadingState />;
  }

  const isSubmitting =
    status === "submitting";

  const isFeedbackVisible =
    status === "feedback" &&
    evaluation !== null;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
      <header className="mb-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Assessment Center
            </p>

            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              {test.name}
            </h1>

            {test.description && (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {test.description}
              </p>
            )}
          </div>

          <div className="shrink-0 sm:text-right">
            <div className="font-semibold">
              {progress.current} /{" "}
              {progress.total}
            </div>

            <div className="text-sm text-muted-foreground">
              запитання
            </div>
          </div>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground transition-[width] duration-500"
            style={{
              width: `${progressPercentage}%`,
            }}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
          <span>
            Відповіді: {progress.answered}
          </span>

          <span>
            «Не знаю»: {progress.skipped}
          </span>

          {question.estimatedTimeSeconds && (
            <span>
              Орієнтовний час:{" "}
              {question.estimatedTimeSeconds} с
            </span>
          )}
        </div>
      </header>

      <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-foreground px-3 py-1 text-sm font-semibold text-background">
            {question.cefrLevel}
          </span>

          <span className="rounded-full bg-muted px-3 py-1 text-sm">
            {CATEGORY_LABELS[
              question.category
            ]}
          </span>

          {question.topic && (
            <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
              {question.topic}
            </span>
          )}
        </div>

        <p className="mt-6 text-sm font-medium text-muted-foreground">
          {
            QUESTION_TYPE_LABELS[
              question.questionType
            ]
          }
        </p>

        {question.passage && (
          <div className="mt-5 rounded-2xl border bg-muted/50 p-5">
            <p className="whitespace-pre-wrap leading-7">
              {question.passage}
            </p>
          </div>
        )}

        <h2 className="mt-5 text-xl font-semibold leading-8 sm:text-2xl">
          {question.prompt}
        </h2>

        {question.options &&
          question.options.length > 0 && (
            <div
              className="mt-7 grid gap-3"
              role="radiogroup"
              aria-label="Варіанти відповіді"
            >
              {question.options.map(
                (option, index) => {
                  const optionKey =
                    getOptionKey(
                      option,
                      index,
                    );

                  const isSelected =
                    selectedOptionKey ===
                    optionKey;

                  return (
                    <button
                      key={optionKey}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      disabled={
                        isSubmitting ||
                        isFeedbackVisible
                      }
                      onClick={() => {
                        setSelectedOptionKey(
                          optionKey,
                        );

                        setSelectedAnswer(
                          getAnswerPayload(option),
                        );

                        setError(null);
                      }}
                      className={[
                        "flex min-h-14 w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition",
                        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                        isSelected
                          ? "border-foreground bg-foreground text-background"
                          : "bg-background hover:bg-muted",
                        isSubmitting ||
                        isFeedbackVisible
                          ? "cursor-not-allowed opacity-70"
                          : "",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                          isSelected
                            ? "border-background/40"
                            : "border-border bg-muted",
                        ].join(" ")}
                      >
                        {String.fromCharCode(
                          65 + index,
                        )}
                      </span>

                      <span className="font-medium">
                        {getOptionText(option)}
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          )}

        {error && (
          <p className="mt-5 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {isFeedbackVisible &&
          evaluation && (
            <div
              className={[
                "mt-7 rounded-2xl border p-5",
                evaluation.status === "correct"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                  : evaluation.status ===
                      "skipped"
                    ? "border-amber-200 bg-amber-50 text-amber-950"
                    : "border-red-200 bg-red-50 text-red-950",
              ].join(" ")}
            >
              <h3 className="text-lg font-semibold">
                {evaluation.status ===
                "correct"
                  ? "Правильно"
                  : evaluation.status ===
                      "skipped"
                    ? "Відповідь пропущено"
                    : "Неправильно"}
              </h3>

              {evaluation.status !==
                "correct" && (
                <p className="mt-3 text-sm leading-6">
                  <span className="font-semibold">
                    Правильна відповідь:{" "}
                  </span>

                  {formatCorrectAnswer(
                    evaluation.correctAnswer,
                    question,
                  )}
                </p>
              )}

              {evaluation.explanationUk && (
                <p className="mt-3 text-sm leading-6">
                  {evaluation.explanationUk}
                </p>
              )}
            </div>
          )}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          {!isFeedbackVisible && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={isSubmitting}
              onClick={() => {
                void submitAction("skip");
              }}
              className="sm:min-w-36"
            >
              {isSubmitting
                ? "Зберігаємо…"
                : "Не знаю"}
            </Button>
          )}

          {!isFeedbackVisible && (
            <Button
              type="button"
              size="lg"
              disabled={
                isSubmitting ||
                selectedAnswer === null
              }
              onClick={() => {
                void submitAction("answer");
              }}
              className="sm:ml-auto sm:min-w-44"
            >
              {isSubmitting
                ? "Перевіряємо…"
                : "Відповісти"}
            </Button>
          )}

          {isFeedbackVisible && (
            <Button
              type="button"
              size="lg"
              onClick={moveToNextQuestion}
              className="w-full sm:ml-auto sm:w-auto sm:min-w-48"
            >
              Наступне питання
            </Button>
          )}
        </div>
      </section>
    </main>
  );
}
