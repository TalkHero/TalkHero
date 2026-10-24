import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Gamepad2,
  Mic,
  Target,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { DashboardData } from "@/lib/dashboard/types";

type DailyGoalsSectionProps = {
  goals: DashboardData["dailyGoals"];
};

const goalIcons = {
  speaking: Mic,
  review: BookOpenCheck,
  mission: Gamepad2,
};

const goalIconClassNames = {
  speaking: "bg-violet-50 text-violet-700",
  review: "bg-success-soft text-emerald-700",
  mission: "bg-primary-soft text-primary",
};

export function DailyGoalsSection({ goals }: DailyGoalsSectionProps) {
  const overallPercentage =
    goals.totalCount > 0
      ? Math.round((goals.completedCount / goals.totalCount) * 100)
      : 0;

  return (
    <section aria-labelledby="daily-goals-heading">
      <Card className="overflow-hidden border-primary/10">
        <CardHeader className="border-b border-border/60 bg-gradient-to-r from-primary-soft/80 via-primary-soft/30 to-white">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <Badge className="mb-3">
                <Target aria-hidden="true" />
                Щоденна практика
              </Badge>

              <CardTitle id="daily-goals-heading" className="text-2xl">
                Цілі на сьогодні
              </CardTitle>

              <CardDescription className="mt-1 leading-6">
                Три короткі кроки, які допоможуть підтримувати регулярний
                прогрес у навчанні.
              </CardDescription>
            </div>

            <div className="min-w-44 rounded-xl border border-primary/10 bg-white/90 p-4 shadow-sm">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Прогрес дня
                  </p>

                  <p className="mt-1 text-2xl font-bold text-foreground">
                    {goals.completedCount} із {goals.totalCount}
                  </p>
                </div>

                <p className="text-lg font-bold text-primary">
                  {overallPercentage}%
                </p>
              </div>

              <Progress
                value={overallPercentage}
                label="Загальний прогрес"
                className="mt-3"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 p-5 lg:grid-cols-3">
          {goals.items.map((goal) => {
            const Icon = goalIcons[goal.id];

            const current = Math.min(
              Math.max(goal.current, 0),
              goal.target,
            );

            const goalPercentage =
              goal.target > 0
                ? Math.round((current / goal.target) * 100)
                : 0;

            const statusLabel = goal.completed
              ? "Виконано"
              : current > 0
                ? "У процесі"
                : "Не почато";

            const actionLabel = goal.completed
              ? "Переглянути"
              : goal.id === "speaking"
                ? current > 0
                  ? "Продовжити практику"
                  : "Почати розмову"
                : goal.id === "review"
                  ? current > 0
                    ? "Продовжити повторення"
                    : "Повторити слова"
                  : current > 0
                    ? "Продовжити місію"
                    : "Перейти до місії";

            return (
              <article
                key={goal.id}
                className={[
                  "flex h-full flex-col rounded-xl border p-5 transition-colors",
                  goal.completed
                    ? "border-emerald-200 bg-emerald-50/60"
                    : "border-border bg-card hover:border-primary/20",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={[
                      "flex size-11 shrink-0 items-center justify-center rounded-xl",
                      goal.completed
                        ? "bg-emerald-100 text-emerald-700"
                        : goalIconClassNames[goal.id],
                    ].join(" ")}
                  >
                    {goal.completed ? (
                      <CheckCircle2
                        className="size-5"
                        aria-hidden="true"
                      />
                    ) : (
                      <Icon
                        className="size-5"
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  <span
                    className={[
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      goal.completed
                        ? "bg-emerald-100 text-emerald-800"
                        : current > 0
                          ? "bg-primary-soft text-primary"
                          : "bg-muted text-muted-foreground",
                    ].join(" ")}
                  >
                    {statusLabel}
                  </span>
                </div>

                <h3 className="mt-4 text-base font-bold text-foreground">
                  {goal.title}
                </h3>

                <p className="mt-1 flex-1 text-sm leading-6 text-muted-foreground">
                  {goal.description}
                </p>

                <div className="mt-5 flex items-center justify-between gap-4 text-xs">
                  <span className="font-medium text-muted-foreground">
                    {current} із {goal.target}
                  </span>

                  <span className="font-semibold text-foreground">
                    {goalPercentage}%
                  </span>
                </div>

                <Progress
                  value={current}
                  max={goal.target}
                  label={`${current} із ${goal.target}`}
                  className="mt-2"
                  indicatorClassName={
                    goal.completed
                      ? "bg-emerald-500"
                      : undefined
                  }
                />

                <Link
                  href={goal.href}
                  className={buttonVariants({
                    variant: goal.completed
                      ? "ghost"
                      : "outline",
                    size: "sm",
                    width: "full",
                    className: "mt-5",
                  })}
                >
                  {actionLabel}

                  <ArrowRight
                    className="size-4"
                    aria-hidden="true"
                  />
                </Link>
              </article>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
}