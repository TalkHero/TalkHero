"use client";

import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Lightbulb,
  MessageCircle,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { normalizeFeedback } from "@/lib/learning/feedback";
import type { LearningFeedback } from "@/lib/quests/types";
import { cn } from "@/lib/utils";

type Props = {
  feedback: string | LearningFeedback;
  isCorrect: boolean | null;
  grade: "correct" | "almost" | "incorrect" | null;
};

type FeedbackVariant =
  | "correct"
  | "almost"
  | "incorrect";

const VARIANT_STYLES: Record<
  FeedbackVariant,
  {
    card: string;
    header: string;
    icon: string;
    badge:
      | "success"
      | "warning"
      | "destructive";
    title: string;
    description: string;
  }
> = {
  correct: {
    card: "border-success/20",
    header: "bg-success-soft/70",
    icon: "bg-emerald-100 text-emerald-700",
    badge: "success",
    title: "Чудово!",
    description:
      "Відповідь правильна й звучить природно.",
  },

  almost: {
    card: "border-warning/25",
    header: "bg-warning-soft/70",
    icon: "bg-amber-100 text-amber-700",
    badge: "warning",
    title: "Майже правильно",
    description:
      "Є невеликий нюанс, який легко виправити.",
  },

  incorrect: {
    card: "border-destructive/20",
    header: "bg-destructive-soft/70",
    icon: "bg-red-100 text-red-700",
    badge: "destructive",
    title: "Розберімо відповідь",
    description:
      "Подивіться, як сказати точніше.",
  },
};

function normalizeText(
  value: string | null | undefined,
) {
  return (
    value
      ?.trim()
      .toLowerCase()
      .replace(/[.!?,;:'"“”‘’]/g, "") ?? ""
  );
}

export function AIFeedbackCard({
  feedback,
  isCorrect,
  grade,
}: Props) {
  const coach =
    normalizeFeedback(feedback, isCorrect);

  if (!coach) {
    return null;
  }

  const hasExplicitCorrection =
    Boolean(
      coach.originalFragment &&
        coach.correctedFragment,
    ) &&
    normalizeText(coach.originalFragment) !==
      normalizeText(coach.correctedFragment);

  const variant: FeedbackVariant =
    isCorrect === true
      ? hasExplicitCorrection ||
        grade === "almost"
        ? "almost"
        : "correct"
      : grade === "almost"
        ? "almost"
        : "incorrect";

  const showNaturalAnswer =
    Boolean(coach.naturalAnswer) &&
    variant !== "correct" &&
    (!coach.originalFragment ||
      normalizeText(coach.naturalAnswer) !==
        normalizeText(
          coach.originalFragment,
        ));

  const styles = VARIANT_STYLES[variant];

  return (
    <Card
      aria-live="polite"
      aria-label="Навчальний відгук"
      className={cn(
        "overflow-hidden",
        "animate-in fade-in slide-in-from-bottom-2 duration-300",
        styles.card,
      )}
    >
      <CardHeader
        className={cn(
          "flex-row items-center gap-3 border-b border-border px-5 py-4 sm:px-6",
          styles.header,
        )}
      >
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            styles.icon,
          )}
        >
          {variant === "correct" ? (
            <CheckCircle2
              className="size-5"
              aria-hidden="true"
            />
          ) : variant === "almost" ? (
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

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-lg">
              {styles.title}
            </CardTitle>

            <Badge variant={styles.badge}>
              {variant === "correct"
                ? "Правильно"
                : variant === "almost"
                  ? "Майже"
                  : "Виправлення"}
            </Badge>
          </div>

          <p className="mt-0.5 text-sm text-muted-foreground">
            {styles.description}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-5 py-4 sm:px-6 sm:py-5">
        {hasExplicitCorrection ? (
          <section
            aria-labelledby="correction-heading"
            className="overflow-hidden rounded-xl border border-border"
          >
            <h3
              id="correction-heading"
              className="sr-only"
            >
              Що саме виправити
            </h3>

            <div className="grid sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
              <div className="bg-destructive-soft/60 p-3.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
                  Було
                </p>

                <p className="mt-1.5 font-medium leading-6 text-foreground">
                  {coach.originalFragment}
                </p>
              </div>

              <div className="hidden items-center justify-center border-x border-border px-2 sm:flex">
                <ArrowRight
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>

              <div className="border-t border-border bg-success-soft/60 p-3.5 sm:border-t-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  Краще
                </p>

                <p className="mt-1.5 font-semibold leading-6 text-foreground">
                  {coach.correctedFragment}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {showNaturalAnswer ? (
          <section
            aria-labelledby="natural-answer-heading"
            className="rounded-xl border border-primary/15 bg-primary-soft/60 px-4 py-3"
          >
            <h3
              id="natural-answer-heading"
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary"
            >
              <CheckCircle2
                className="size-4"
                aria-hidden="true"
              />
              Як сказати природно
            </h3>

            <p className="mt-1.5 text-base font-semibold leading-6 text-foreground sm:text-lg">
              “{coach.naturalAnswer}”
            </p>
          </section>
        ) : null}

        <section
          aria-labelledby="feedback-explanation-heading"
          className="rounded-xl border border-violet-100 bg-violet-50/70 px-4 py-3 dark:border-violet-900 dark:bg-violet-950/30"
        >
          <h3
            id="feedback-explanation-heading"
            className="flex items-center gap-2 text-sm font-bold text-violet-800 dark:text-violet-200"
          >
            <MessageCircle
              className="size-4"
              aria-hidden="true"
            />

            {variant === "correct"
              ? "Чому це добре"
              : "Чому саме так"}
          </h3>

          <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-foreground/80 sm:text-base">
            {coach.explanation}
          </p>
        </section>

        {coach.remember ? (
          <section
            aria-labelledby="remember-heading"
            className="flex gap-3 rounded-xl border border-warning/20 bg-warning-soft/60 px-4 py-3"
          >
            <Lightbulb
              className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-300"
              aria-hidden="true"
            />

            <div className="min-w-0">
              <h3
                id="remember-heading"
                className="text-sm font-bold text-amber-800 dark:text-amber-200"
              >
                {variant === "correct"
                  ? "Корисно знати"
                  : "Запам’ятайте"}
              </h3>

              <p className="mt-1 whitespace-pre-line text-sm leading-6 text-foreground/80">
                {coach.remember}
              </p>
            </div>
          </section>
        ) : null}

        {coach.npcReply ? (
          <section
            aria-labelledby="npc-reply-heading"
            className="rounded-xl border border-success/15 bg-success-soft/50 px-4 py-3"
          >
            <h3
              id="npc-reply-heading"
              className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-200"
            >
              <MessageCircle
                className="size-4"
                aria-hidden="true"
              />
              Відповідь персонажа
            </h3>

            <p className="mt-1.5 whitespace-pre-line font-medium leading-6 text-foreground">
              “{coach.npcReply}”
            </p>
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}
