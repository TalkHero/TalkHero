import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Gamepad2,
  Mic,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardData } from "@/lib/dashboard/types";

type LearningMode = {
  href: string;
  title: string;
  description: string;
  actionLabel: string;
  icon: LucideIcon;
  iconClassName: string;
};

type LearningModesSectionProps = {
  nextAdventure: DashboardData["nextAdventure"];
  stats: DashboardData["stats"];
};

function ModeCard({
  mode,
  featured = false,
  tone = "primary",
}: {
  mode: LearningMode;
  featured?: boolean;
  tone?: "primary" | "violet";
}) {
  const Icon = mode.icon;

  const featuredSurfaceClassName =
    tone === "violet"
      ? "border-violet-200/80 bg-gradient-to-br from-white via-white to-violet-50/70"
      : "border-primary/20 bg-gradient-to-br from-white via-white to-primary-soft/70";

  return (
    <Link
      href={mode.href}
      className="talkhero-focus group rounded-xl"
    >
      <Card
        interactive
        className={[
          "h-full transition-colors",
          featured
            ? `min-h-60 ${featuredSurfaceClassName}`
            : "group-hover:border-primary/20",
        ].join(" ")}
      >
        <CardHeader className={featured ? "pb-4" : "pb-3"}>
          <div
            className={[
              "flex shrink-0 items-center justify-center",
              featured
                ? "size-14 rounded-xl"
                : "size-11 rounded-lg",
              mode.iconClassName,
            ].join(" ")}
          >
            <Icon
              className={featured ? "size-7" : "size-5"}
              aria-hidden="true"
            />
          </div>

          <CardTitle
            className={
              featured
                ? "pt-4 text-xl sm:text-2xl"
                : "pt-2 text-base"
            }
          >
            {mode.title}
          </CardTitle>

          <CardDescription
            className={
              featured
                ? "max-w-xl text-sm leading-6"
                : "text-sm leading-6"
            }
          >
            {mode.description}
          </CardDescription>
        </CardHeader>

        <CardFooter className="mt-auto border-0 pt-0">
          <span
            className={[
              "inline-flex items-center gap-2 font-semibold text-primary",
              featured ? "text-sm" : "text-xs sm:text-sm",
            ].join(" ")}
          >
            {mode.actionLabel}

            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}

export function LearningModesSection({
  nextAdventure,
  stats,
}: LearningModesSectionProps) {
  const modes: LearningMode[] = [
    {
      href: nextAdventure.mission?.href ?? "/adventure",
      title: "Пригода",
      description: nextAdventure.mission
        ? `Наступна місія — «${nextAdventure.mission.title}». ${nextAdventure.mission.description}`
        : `Кампанію «${nextAdventure.campaignTitle}» завершено. Перегляньте доступні пригоди.`,
      actionLabel: nextAdventure.mission
        ? nextAdventure.mission.status === "in_progress"
          ? "Продовжити пригоду"
          : "Почати місію"
        : "Переглянути пригоди",
      icon: Gamepad2,
      iconClassName: "bg-primary-soft text-primary",
    },
    {
      href: "/speaking",
      title: "Розмовна практика",
      description:
        "Говоріть уголос з Еммою, тренуйте природну англійську та отримуйте персональний зворотний зв’язок.",
      actionLabel: "Почати говорити",
      icon: Mic,
      iconClassName: "bg-violet-50 text-violet-700",
    },
    {
      href: "/vocabulary",
      title: "Словник",
      description:
        stats.vocabulary > 0
          ? `У вашому словнику ${stats.vocabulary} слів і фраз. Вивчено — ${stats.learned}.`
          : "Зберігайте корисні слова й фрази, щоб поступово створити власний словник.",
      actionLabel:
        stats.vocabulary > 0
          ? "Відкрити словник"
          : "Додати перші слова",
      icon: BookOpen,
      iconClassName: "bg-success-soft text-emerald-700",
    },
    {
      href: "/review",
      title: "Повторення",
      description:
        stats.dueToday > 0
          ? `Сьогодні до повторення готово ${stats.dueToday} слів. Закріпіть їх у пам’яті.`
          : "На сьогодні термінових повторень немає. Можете переглянути вже вивчений матеріал.",
      actionLabel:
        stats.dueToday > 0
          ? "Почати повторення"
          : "Переглянути матеріал",
      icon: Trophy,
      iconClassName: "bg-warning-soft text-amber-700",
    },
  ];

  return (
    <section aria-labelledby="learning-modes-heading">
      <div className="mb-5">
        <h2
          id="learning-modes-heading"
          className="text-2xl font-bold tracking-tight"
        >
          Ваші напрями навчання
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Оберіть формат, який найкраще відповідає вашій сьогоднішній цілі.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {modes.slice(0, 2).map((mode, index) => (
          <ModeCard
            key={mode.title}
            mode={mode}
            featured
            tone={index === 1 ? "violet" : "primary"}
          />
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {modes.slice(2).map((mode) => (
          <ModeCard
            key={mode.title}
            mode={mode}
          />
        ))}
      </div>
    </section>
  );
}