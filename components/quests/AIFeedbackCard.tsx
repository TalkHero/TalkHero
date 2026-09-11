"use client";

import {
  BookOpen,
  Check,
  CircleAlert,
  Lightbulb,
  Sparkles,
  Volume2,
} from "lucide-react";

import {
  normalizeFeedback,
} from "@/lib/learning/feedback";

import type {
  PublicQuestScene,
} from "@/lib/quests";

import type {
  LearningFeedback,
} from "@/lib/quests/types";

import { cn } from "@/lib/utils";

type Props = {
  feedback:
    | string
    | LearningFeedback;

  isCorrect:
    | boolean
    | null;

  grade:
    | "correct"
    | "almost"
    | "incorrect"
    | null;

  userAnswer?: unknown;

  scene?:
    | PublicQuestScene
    | null;

  suggestedAnswer?:
    | string
    | null;
};

type Variant =
  | "correct"
  | "almost"
  | "incorrect";

function normalizeText(
  value:
    | string
    | null
    | undefined,
) {
  return (
    value
      ?.trim()
      .toLowerCase()
      .replace(
        /[.!?,;:'"“”‘’]/g,
        "",
      ) ?? ""
  );
}

function getAnswerText(
  value: unknown,
  scene?:
    | PublicQuestScene
    | null,
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    scene?.options?.length
  ) {
    const option =
      scene.options.find(
        (item) =>
          item.id === value ||
          item.value === value,
      );

    if (option) {
      return option.text;
    }
  }

  if (
    typeof value === "string"
  ) {
    return (
      value.trim() ||
      null
    );
  }

  if (
    typeof value === "number"
  ) {
    return String(value);
  }

  return null;
}

export function AIFeedbackCard({
  feedback,
  isCorrect,
  grade,
  userAnswer,
  scene = null,
  suggestedAnswer = null,
}: Props) {
  const coach =
    normalizeFeedback(
      feedback,
      isCorrect,
    );

  if (!coach) {
    return null;
  }

  const hasExplicitCorrection =
    Boolean(
      coach.originalFragment &&
        coach.correctedFragment,
    ) &&
    normalizeText(
      coach.originalFragment,
    ) !==
      normalizeText(
        coach.correctedFragment,
      );

  const variant: Variant =
    isCorrect === true
      ? hasExplicitCorrection ||
        grade === "almost"
        ? "almost"
        : "correct"
      : grade === "almost"
        ? "almost"
        : "incorrect";

  const answerText =
    getAnswerText(
      userAnswer,
      scene,
    );

  const title =
    variant === "correct"
      ? "Чудово!"
      : variant === "almost"
        ? "Майже правильно"
        : "Спробуй ще раз";

  const recommendedAnswer =
    suggestedAnswer?.trim() ||
    coach.correctedFragment?.trim() ||
    coach.naturalAnswer?.trim() ||
    null;

  const usefulPhrase =
    coach.naturalAnswer?.trim() ||
    (variant === "correct"
      ? answerText
      : recommendedAnswer);

  return (
    <section
      aria-live="polite"
      aria-label="Навчальний відгук"
      className={cn(
        "overflow-hidden rounded-[28px]",
        "border",
        "px-5 py-5 sm:px-7 sm:py-6",
        "shadow-[0_16px_46px_rgba(15,23,42,0.06)]",

        variant === "correct" &&
          "border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40",

        variant === "almost" &&
          "border-amber-200 bg-gradient-to-br from-amber-50/90 via-white to-amber-50/30",

        variant === "incorrect" &&
          "border-rose-200 bg-gradient-to-br from-rose-50/90 via-white to-rose-50/30",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full",

            variant === "correct" &&
              "bg-emerald-500 text-white",

            variant === "almost" &&
              "bg-amber-400 text-white",

            variant === "incorrect" &&
              "bg-rose-500 text-white",
          )}
        >
          {variant ===
          "correct" ? (
            <Check
              className="size-5"
              strokeWidth={3}
              aria-hidden="true"
            />
          ) : variant ===
            "almost" ? (
            <Sparkles
              className="size-5"
              aria-hidden="true"
            />
          ) : (
            <CircleAlert
              className="size-5"
              aria-hidden="true"
            />
          )}
        </div>

        <h2
          className={cn(
            "text-[22px] font-black tracking-tight",

            variant === "correct" &&
              "text-emerald-600",

            variant === "almost" &&
              "text-amber-600",

            variant === "incorrect" &&
              "text-rose-600",
          )}
        >
          {title}
        </h2>
      </div>

      {answerText ? (
        <section className="mt-5">
          <p className="text-xs font-semibold text-slate-500">
            Твоя відповідь:
          </p>

          <div
            className={cn(
              "mt-2 rounded-[16px]",
              "border border-white/70",
              "bg-white/80",
              "px-4 py-3",
              "text-[15px] font-medium leading-6 text-slate-900",
              "shadow-sm",
            )}
          >
            {answerText}
          </div>
        </section>
      ) : null}

      {variant !== "correct" &&
      recommendedAnswer ? (
        <section className="mt-5 flex gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <Sparkles
              className="size-4.5"
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-800">
              Краще сказати
            </h3>

            <div className="mt-2 rounded-[16px] bg-indigo-50 px-4 py-3">
              <p className="text-[15px] font-semibold leading-6 text-slate-900">
                {recommendedAnswer}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-5 flex gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-500">
          <Lightbulb
            className="size-4.5"
            aria-hidden="true"
          />
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-800">
            {variant === "correct"
              ? "Чому це добре"
              : "Чому саме так"}
          </h3>

          <p className="mt-1 whitespace-pre-line text-[14px] leading-5.5 text-slate-600">
            {coach.explanation}
          </p>
        </div>
      </section>

      {usefulPhrase ? (
        <section className="mt-5 flex gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <BookOpen
              className="size-4.5"
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-800">
              Корисна фраза
            </h3>

            <div className="mt-2 flex items-center justify-between gap-3 rounded-[16px] bg-indigo-50 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[14px] font-semibold leading-5.5 text-slate-900">
                  {usefulPhrase}
                </p>

                {coach.remember ? (
                  <p className="mt-1 whitespace-pre-line text-xs leading-5 text-slate-500">
                    {coach.remember}
                  </p>
                ) : null}
              </div>

              <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-indigo-200 bg-white text-indigo-600">
                <Volume2
                  className="size-4"
                  aria-hidden="true"
                />
              </span>
            </div>
          </div>
        </section>
      ) : coach.remember ? (
        <section className="mt-5 rounded-[16px] bg-amber-50 px-4 py-3">
          <p className="text-xs font-bold text-amber-800">
            Запам’ятай
          </p>

          <p className="mt-1 whitespace-pre-line text-sm leading-5.5 text-slate-600">
            {coach.remember}
          </p>
        </section>
      ) : null}

      {coach.npcReply ? (
        <section className="mt-5 rounded-[16px] border border-emerald-100 bg-white/75 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
            Відповідь персонажа
          </p>

          <p className="mt-1.5 text-[14px] font-semibold leading-6 text-slate-800">
            {coach.npcReply}
          </p>
        </section>
      ) : null}
    </section>
  );
}
