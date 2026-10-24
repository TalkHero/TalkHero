import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  GraduationCap,
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

type LevelProgressSectionProps = {
  currentEnglishLevel: string;
  nextEnglishLevel: string | null;
  levelTestHref: string | null;
};

export function LevelProgressSection({
  currentEnglishLevel,
  nextEnglishLevel,
  levelTestHref,
}: LevelProgressSectionProps) {
  return (
    <section aria-labelledby="level-progress-heading">
      <Card className="overflow-hidden border-violet-200 bg-gradient-to-br from-white via-white to-violet-50">
        <CardHeader>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <Badge variant="neutral" className="mb-3">
                <BookOpenCheck aria-hidden="true" />
                Оцінювання знань
              </Badge>

              <CardTitle
                id="level-progress-heading"
                className="text-3xl sm:text-4xl"
              >
                Ваш рівень англійської
              </CardTitle>

              <CardDescription className="mt-3 text-base leading-7">
                {nextEnglishLevel
                  ? `Наступна ціль — ${nextEnglishLevel}. Складіть тест рівня ${nextEnglishLevel} щонайменше на 70%, щоб підвищити свій рівень англійської.`
                  : "Ви досягли найвищого рівня, для якого зараз доступний тест у TalkHero."}
              </CardDescription>
            </div>

            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <GraduationCap
                className="size-7"
                aria-hidden="true"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <div className="rounded-xl border bg-white p-5">
              <p className="text-sm font-medium text-muted-foreground">
                Поточний рівень
              </p>

              <p className="mt-2 text-4xl font-bold tracking-tight">
                {currentEnglishLevel}
              </p>
            </div>

            <div className="hidden justify-center sm:flex">
              <ArrowRight
                className="size-6 text-muted-foreground"
                aria-hidden="true"
              />
            </div>

            <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-5">
              <p className="text-sm font-medium text-violet-700">
                {nextEnglishLevel
                  ? "Наступна ціль"
                  : "Прогрес рівня"}
              </p>

              <p className="mt-2 text-4xl font-bold tracking-tight">
                {nextEnglishLevel ?? currentEnglishLevel}
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter>
          {nextEnglishLevel && levelTestHref ? (
            <Link
              href={levelTestHref}
              className={buttonVariants()}
            >
              Пройти тест {nextEnglishLevel}
              <ArrowRight aria-hidden="true" />
            </Link>
          ) : (
            <Badge variant="neutral">
              Максимальний доступний рівень
            </Badge>
          )}
        </CardFooter>
      </Card>
    </section>
  );
}