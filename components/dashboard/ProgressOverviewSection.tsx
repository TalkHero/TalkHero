import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Flame,
  Gamepad2,
  Mic,
  Star,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import type { DashboardData } from "@/lib/dashboard/types";

type ProgressOverviewSectionProps = {
  profile: DashboardData["profile"];
  stats: DashboardData["stats"];
  nextAdventure: DashboardData["nextAdventure"];
};

export function ProgressOverviewSection({
  profile,
  stats,
  nextAdventure,
}: ProgressOverviewSectionProps) {
  const statistics = [
    {
      label: "Завершено місій",
      value: nextAdventure.completedMissions.toString(),
      description: `${nextAdventure.completedMissions} із ${nextAdventure.totalMissions} місій завершено в поточній кампанії.`,
      href: "/adventure",
      actionLabel: "До пригод",
      icon: Gamepad2,
      iconClassName: "bg-primary-soft text-primary",
    },
    {
      label: "Загальний досвід",
      value: `${profile.xp} XP`,
      description: `Ваш поточний рівень профілю — ${profile.level}.`,
      href: "/profile",
      actionLabel: "Переглянути профіль",
      icon: Star,
      iconClassName: "bg-warning-soft text-amber-700",
    },
    {
      label: "Поточна серія",
      value: `${profile.streak} дн.`,
      description:
        profile.streak > 0
          ? "Продовжуйте регулярну практику, щоб підтримувати навчальний ритм."
          : "Почніть навчальну активність сьогодні та сформуйте регулярну звичку.",
      href: "/speaking",
      actionLabel: "Практикуватися",
      icon: Flame,
      iconClassName: "bg-orange-50 text-orange-700",
    },
    {
      label: "Вивчено слів",
      value: stats.learned.toString(),
      description:
        stats.dueToday > 0
          ? `Сьогодні до повторення готово ${stats.dueToday} слів.`
          : "На сьогодні термінових повторень немає.",
      href: stats.dueToday > 0 ? "/review" : "/vocabulary",
      actionLabel:
        stats.dueToday > 0
          ? "Повторити слова"
          : "Відкрити словник",
      icon: BookOpen,
      iconClassName: "bg-success-soft text-emerald-700",
    },
  ];

  return (
    <section aria-labelledby="progress-heading">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="progress-heading"
            className="text-2xl font-bold tracking-tight"
          >
            Ваш прогрес
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Основні результати навчання та наступні дії.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/speaking/history"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
            })}
          >
            <Mic aria-hidden="true" />
            Історія розмов
          </Link>

          <Link
            href="/profile"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
            })}
          >
            Профіль
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {statistics.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className="talkhero-focus group rounded-xl"
            >
              <Card
                interactive
                className="h-full transition-colors group-hover:border-primary/20"
              >
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={[
                        "flex size-11 shrink-0 items-center justify-center rounded-xl",
                        item.iconClassName,
                      ].join(" ")}
                    >
                      <Icon className="size-5" aria-hidden="true" />
                    </div>

                    <p className="text-2xl font-bold tracking-tight text-foreground">
                      {item.value}
                    </p>
                  </div>

                  <h3 className="mt-5 font-bold text-foreground">
                    {item.label}
                  </h3>

                  <p className="mt-1 flex-1 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>

                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    {item.actionLabel}

                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}