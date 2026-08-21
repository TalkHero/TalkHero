"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Coins,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Star,
  Target,
  Trophy,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import type { QuestCompletionSummary } from "@/lib/quests";
import { cn } from "@/lib/utils";

type CompletionSceneProps = {
  score: number;
  maxScore: number;
  xpEarned: number;
  coinsEarned: number;
  summary?: QuestCompletionSummary;
  onRestart: () => void;
  adventureHref?: string;
};

type ResultCardProps = {
  label: string;
  value: string;
  icon: typeof Target;
  iconClassName: string;
  cardClassName: string;
};

function ResultCard({
  label,
  value,
  icon: Icon,
  iconClassName,
  cardClassName,
}: ResultCardProps) {
  return (
    <article className={cn("rounded-xl border p-5 text-center", cardClassName)}>
      <div
        className={cn(
          "mx-auto flex size-11 items-center justify-center rounded-lg",
          iconClassName,
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </div>

      <p className="mt-4 text-3xl font-bold tracking-tight text-foreground">
        {value}
      </p>

      <p className="mt-1 text-sm font-medium text-muted-foreground">{label}</p>
    </article>
  );
}

export function CompletionScene({
  score,
  maxScore,
  xpEarned,
  coinsEarned,
  summary,
  onRestart,
  adventureHref = "/adventure",
}: CompletionSceneProps) {
  const percentage =
    maxScore > 0
      ? Math.min(100, Math.max(0, Math.round((score / maxScore) * 100)))
      : 0;

  const result =
    percentage >= 90
      ? {
          title: "Відмінно!",
          description:
            "Ви впевнено завершили місію й показали дуже сильний результат.",
        }
      : percentage >= 75
        ? {
            title: "Чудова робота!",
            description:
              "Ви успішно завершили місію. Залишилося зовсім трохи до відмінного результату.",
          }
        : percentage >= 60
          ? {
              title: "Добрий результат!",
              description:
                "Місію завершено. Повторне проходження допоможе закріпити складні моменти.",
            }
          : {
              title: "Місію завершено!",
              description:
                "Ви дійшли до кінця. Спробуйте пройти місію ще раз і покращити результат.",
            };

  const strengths = summary?.strengths ?? [];

  const improvements = summary?.improvements ?? [];

  const hasLearningSummary = strengths.length > 0 || improvements.length > 0;

  return (
    <Card
      aria-labelledby="mission-completion-title"
      className={cn(
        "overflow-hidden border-success/20",
        "animate-in fade-in zoom-in-95 duration-300",
      )}
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 px-5 py-10 text-center text-white sm:px-10 sm:py-14">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/10 to-transparent"
        />

        <div className="relative">
          <div
            aria-hidden="true"
            className="mx-auto flex size-20 items-center justify-center rounded-xl bg-white/15 shadow-lg backdrop-blur"
          >
            <Trophy className="size-10" />
          </div>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-50">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Місію завершено
          </div>

          <h1
            id="mission-completion-title"
            className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl"
          >
            {result.title}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-emerald-50 sm:text-lg">
            {result.description}
          </p>
        </div>
      </div>

      <CardContent className="space-y-6 py-6 sm:py-8">
        <section
          aria-label="Результати місії"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <ResultCard
            label="Бали"
            value={score.toString()}
            icon={Target}
            iconClassName="bg-primary-soft text-primary"
            cardClassName="border-primary/15 bg-primary-soft/50"
          />

          <ResultCard
            label="Результат"
            value={`${percentage}%`}
            icon={Trophy}
            iconClassName="bg-violet-100 text-violet-700"
            cardClassName="border-violet-100 bg-violet-50"
          />

          <ResultCard
            label="Отримано XP"
            value={`+${xpEarned}`}
            icon={Star}
            iconClassName="bg-warning-soft text-amber-700"
            cardClassName="border-warning/20 bg-warning-soft/50"
          />

          <ResultCard
            label="Монети"
            value={`+${coinsEarned}`}
            icon={Coins}
            iconClassName="bg-success-soft text-emerald-700"
            cardClassName="border-success/15 bg-success-soft/50"
          />
        </section>

        {hasLearningSummary ? (
          <section
            aria-label="Підсумок навчання"
            className="grid gap-4 lg:grid-cols-2"
          >
            {strengths.length > 0 ? (
              <article className="rounded-xl border border-success/20 bg-success-soft/40 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="size-5" aria-hidden="true" />
                  </div>

                  <div className="min-w-0">
                    <CardTitle className="text-lg">Сильні сторони</CardTitle>

                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Що добре вдалося під час цієї місії.
                    </p>
                  </div>
                </div>

                <ul className="mt-5 space-y-3">
                  {strengths.map((strength, index) => (
                    <li
                      key={`${strength}-${index}`}
                      className="flex items-start gap-3 text-sm leading-6 text-foreground/80"
                    >
                      <CheckCircle2
                        className="mt-1 size-4 shrink-0 text-emerald-600"
                        aria-hidden="true"
                      />

                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}

            {improvements.length > 0 ? (
              <article className="rounded-xl border border-warning/20 bg-warning-soft/40 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    <Lightbulb className="size-5" aria-hidden="true" />
                  </div>

                  <div className="min-w-0">
                    <CardTitle className="text-lg">Що повторити</CardTitle>

                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Кілька моментів, які варто ще трохи закріпити.
                    </p>
                  </div>
                </div>

                <ul className="mt-5 space-y-3">
                  {improvements.map((improvement, index) => (
                    <li
                      key={`${improvement}-${index}`}
                      className="flex items-start gap-3 text-sm leading-6 text-foreground/80"
                    >
                      <Target
                        className="mt-1 size-4 shrink-0 text-amber-600"
                        aria-hidden="true"
                      />

                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}
          </section>
        ) : null}

        <section className="rounded-xl border border-violet-100 bg-violet-50 p-5 dark:border-violet-900 dark:bg-violet-950/40">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-200">
              <Sparkles className="size-5" aria-hidden="true" />
            </div>

            <div>
              <CardTitle className="text-lg">Продовжуйте пригоду</CardTitle>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Повторіть місію, щоб покращити результат, або поверніться до
                карти пригод і відкрийте наступне завдання.
              </p>
            </div>
          </div>
        </section>
      </CardContent>

      <CardFooter className="flex-col-reverse gap-3 sm:flex-row sm:justify-center">
        <Button
          type="button"
          variant="outline"
          width="full"
          onClick={onRestart}
          className="sm:w-auto"
        >
          <RotateCcw aria-hidden="true" />
          Пройти ще раз
        </Button>

        <Link
          href={adventureHref}
          className={buttonVariants({
            width: "full",
            className: "sm:w-auto",
          })}
        >
          Повернутися до пригоди
          <ArrowRight aria-hidden="true" />
        </Link>
      </CardFooter>
    </Card>
  );
}
