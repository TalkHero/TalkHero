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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { normalizeFeedback } from "@/lib/learning/feedback";
import type { LearningFeedback } from "@/lib/quests/types";
import { cn } from "@/lib/utils";

type Props = {
  feedback: string | LearningFeedback;
  isCorrect: boolean | null;
  grade: "correct" | "almost" | "incorrect" | null;
};

type FeedbackVariant = "correct" | "almost" | "incorrect";

const VARIANT_STYLES: Record<
  FeedbackVariant,
  {
    card: string;
    header: string;
    icon: string;
    badge: "success" | "warning" | "destructive";
    title: string;
    description: string;
  }
> = {
  correct: {
    card: "border-success/20",
    header: "bg-success-soft",
    icon: "bg-emerald-100 text-emerald-700",
    badge: "success",
    title: "Чудово!",
    description: "Відповідь правильна й природно звучить у розмові.",
  },
  almost: {
    card: "border-warning/25",
    header: "bg-warning-soft",
    icon: "bg-amber-100 text-amber-700",
    badge: "warning",
    title: "Майже правильно",
    description: "Хороша спроба. Розберімо невеликий нюанс.",
  },
  incorrect: {
    card: "border-destructive/20",
    header: "bg-destructive-soft",
    icon: "bg-red-100 text-red-700",
    badge: "destructive",
    title: "Розберімо відповідь",
    description: "Подивімося, що можна виправити й запам’ятати.",
  },
};

export function AIFeedbackCard({ feedback, isCorrect, grade }: Props) {
  const coach = normalizeFeedback(feedback, isCorrect);

  if (!coach) {
    return null;
  }

  const variant: FeedbackVariant =
    grade === "correct"
      ? "correct"
      : grade === "almost"
        ? "almost"
        : "incorrect";

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
          "flex-row items-start gap-4 border-b border-border pb-5",
          styles.header,
        )}
      >
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-lg",
            styles.icon,
          )}
        >
          {variant === "correct" ? (
            <CheckCircle2 className="size-5" aria-hidden="true" />
          ) : variant === "almost" ? (
            <Sparkles className="size-5" aria-hidden="true" />
          ) : (
            <CircleAlert className="size-5" aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{styles.title}</CardTitle>

            <Badge variant={styles.badge}>Навчальний відгук</Badge>
          </div>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {styles.description}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {coach.originalFragment || coach.correctedFragment ? (
          <section
            aria-labelledby="correction-heading"
            className="rounded-xl border border-border bg-muted/40 p-4"
          >
            <h3
              id="correction-heading"
              className="flex items-center gap-2 text-sm font-bold text-foreground"
            >
              <ArrowRight className="size-4 text-primary" aria-hidden="true" />
              Що саме виправити
            </h3>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {coach.originalFragment ? (
                <div className="rounded-lg border border-destructive/15 bg-destructive-soft p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                    Було
                  </p>

                  <p className="mt-1 font-medium leading-6 text-foreground">
                    {coach.originalFragment}
                  </p>
                </div>
              ) : null}

              {coach.correctedFragment ? (
                <div className="rounded-lg border border-success/15 bg-success-soft p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Краще
                  </p>

                  <p className="mt-1 font-medium leading-6 text-foreground">
                    {coach.correctedFragment}
                  </p>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {coach.naturalAnswer ? (
          <section
            aria-labelledby="natural-answer-heading"
            className="rounded-xl border border-primary/15 bg-primary-soft p-4"
          >
            <h3
              id="natural-answer-heading"
              className="flex items-center gap-2 text-sm font-bold text-primary"
            >
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Як сказати природно
            </h3>

            <p className="mt-2 whitespace-pre-line text-lg font-semibold leading-7 text-foreground">
              “{coach.naturalAnswer}”
            </p>
          </section>
        ) : null}

        <section
          aria-labelledby="feedback-explanation-heading"
          className="rounded-xl border border-violet-100 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/40"
        >
          <h3
            id="feedback-explanation-heading"
            className="flex items-center gap-2 text-sm font-bold text-violet-800 dark:text-violet-200"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            {variant === "correct" ? "Чому це добре" : "Чому саме так"}
          </h3>

          <p className="mt-2 whitespace-pre-line leading-7 text-foreground/80">
            {coach.explanation}
          </p>
        </section>

        {coach.remember ? (
          <section
            aria-labelledby="remember-heading"
            className="rounded-xl border border-warning/20 bg-warning-soft p-4"
          >
            <h3
              id="remember-heading"
              className="flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-200"
            >
              <Lightbulb className="size-4" aria-hidden="true" />
              {variant === "correct" ? "Корисно знати" : "Запам’ятайте"}
            </h3>

            <p className="mt-2 whitespace-pre-line leading-7 text-foreground/80">
              {coach.remember}
            </p>
          </section>
        ) : null}

        {coach.npcReply ? (
          <section
            aria-labelledby="npc-reply-heading"
            className="rounded-xl border border-success/15 bg-success-soft p-4"
          >
            <h3
              id="npc-reply-heading"
              className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-200"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              Відповідь персонажа
            </h3>

            <p className="mt-2 whitespace-pre-line text-lg font-medium leading-7 text-foreground">
              “{coach.npcReply}”
            </p>
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}
