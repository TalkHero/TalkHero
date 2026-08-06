import Link from "next/link";
import {
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
        <CardHeader className="border-b border-border/60 bg-gradient-to-r from-primary-soft/80 to-white">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Badge className="mb-3">
                <Target aria-hidden="true" />
                Щоденна практика
              </Badge>

              <CardTitle id="daily-goals-heading" className="text-2xl">
                Цілі на сьогодні
              </CardTitle>

              <CardDescription className="mt-1">
                Виконайте короткі навчальні цілі та підтримуйте регулярний
                прогрес.
              </CardDescription>
            </div>

            <div className="min-w-40 rounded-xl border border-primary/10 bg-white/80 p-4">
              <p className="text-sm font-medium text-muted-foreground">
                Виконано
              </p>

              <p className="mt-1 text-2xl font-bold text-foreground">
                {goals.completedCount} із {goals.totalCount}
              </p>

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

            const current = Math.min(Math.max(goal.current, 0), goal.target);

            return (
              <article
                key={goal.id}
                className={[
                  "flex h-full flex-col rounded-xl border p-5",
                  goal.completed
                    ? "border-emerald-200 bg-emerald-50/60"
                    : "border-border bg-card",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={[
                      "flex size-11 shrink-0 items-center justify-center rounded-lg",
                      goal.completed
                        ? "bg-emerald-100 text-emerald-700"
                        : goalIconClassNames[goal.id],
                    ].join(" ")}
                  >
                    {goal.completed ? (
                      <CheckCircle2 className="size-5" aria-hidden="true" />
                    ) : (
                      <Icon className="size-5" aria-hidden="true" />
                    )}
                  </div>

                  <span
                    className={[
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      goal.completed
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-muted text-muted-foreground",
                    ].join(" ")}
                  >
                    {goal.completed ? "Виконано" : "У процесі"}
                  </span>
                </div>

                <h3 className="mt-4 font-bold text-foreground">{goal.title}</h3>

                <p className="mt-1 flex-1 text-sm leading-6 text-muted-foreground">
                  {goal.description}
                </p>

                <Progress
                  value={current}
                  max={goal.target}
                  label={`${current} із ${goal.target}`}
                  showValue
                  className="mt-5"
                  indicatorClassName={
                    goal.completed ? "bg-emerald-500" : undefined
                  }
                />

                <Link
                  href={goal.href}
                  className={buttonVariants({
                    variant: goal.completed ? "ghost" : "outline",
                    size: "sm",
                    width: "full",
                    className: "mt-4",
                  })}
                >
                  {goal.completed ? "Переглянути" : "Перейти до цілі"}
                </Link>
              </article>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
}
