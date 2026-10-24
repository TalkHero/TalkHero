import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { DashboardData } from "@/lib/dashboard/types";

type VocabularyProgressSectionProps = {
  stats: DashboardData["stats"];
};

export function VocabularyProgressSection({
  stats,
}: VocabularyProgressSectionProps) {
  const learnedPercentage =
    stats.vocabulary > 0
      ? Math.round(
          (stats.learned / stats.vocabulary) * 100,
        )
      : 0;

  return (
    <section aria-labelledby="vocabulary-progress-heading">
      <Card className="overflow-hidden border-emerald-200/70">
        <CardHeader className="border-b border-border/60 bg-gradient-to-r from-success-soft/80 via-success-soft/30 to-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <Badge variant="neutral" className="mb-3">
                <BookOpen aria-hidden="true" />
                Словниковий запас
              </Badge>

              <CardTitle
                id="vocabulary-progress-heading"
                className="text-2xl"
              >
                Ваш словник
              </CardTitle>

              <CardDescription className="mt-2 leading-6">
                {stats.vocabulary > 0
                  ? `${stats.learned} із ${stats.vocabulary} слів уже вивчено. Продовжуйте додавати нові слова та регулярно повторюйте їх.`
                  : "Додавайте корисні слова й фрази під час навчання, щоб поступово створити власний активний словник."}
              </CardDescription>
            </div>

            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-success-soft text-emerald-700">
              <BookOpen
                className="size-6"
                aria-hidden="true"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-sm font-medium text-muted-foreground">
                У словнику
              </p>

              <p className="mt-2 text-2xl font-bold text-foreground">
                {stats.vocabulary}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                слів і фраз
              </p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
              <p className="text-sm font-medium text-emerald-700">
                Вивчено
              </p>

              <p className="mt-2 text-2xl font-bold text-foreground">
                {stats.learned}
              </p>

              <p className="mt-1 text-xs text-emerald-700">
                освоєних слів
              </p>
            </div>

            <div className="rounded-xl border bg-card p-4">
              <p className="text-sm font-medium text-muted-foreground">
                До повторення
              </p>

              <p className="mt-2 text-2xl font-bold text-foreground">
                {stats.dueToday}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                доступно сьогодні
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border bg-muted/20 p-4">
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-foreground">
                Прогрес словника
              </p>

              <span className="text-sm font-bold text-emerald-700">
                {learnedPercentage}%
              </span>
            </div>

            <Progress
              value={learnedPercentage}
              label={`${stats.learned} із ${stats.vocabulary} слів вивчено`}
              indicatorClassName="bg-success"
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-wrap gap-3 border-t border-border/60 bg-muted/20">
          {stats.dueToday > 0 ? (
            <Link
              href="/review"
              className={buttonVariants({
                variant: "success",
              })}
            >
              Повторити {stats.dueToday} слів
              <ArrowRight aria-hidden="true" />
            </Link>
          ) : (
            <Link
              href="/vocabulary"
              className={buttonVariants({
                variant: "success",
              })}
            >
              Відкрити словник
              <ArrowRight aria-hidden="true" />
            </Link>
          )}

          {stats.dueToday > 0 && (
            <Link
              href="/vocabulary"
              className={buttonVariants({
                variant: "outline",
              })}
            >
              Відкрити словник
            </Link>
          )}
        </CardFooter>
      </Card>
    </section>
  );
}