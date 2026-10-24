import Link from "next/link";
import {
  ArrowRight,
  Lightbulb,
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

type LanguageMasterySectionProps = {
  languageMastery: DashboardData["languageMastery"];
};

export function LanguageMasterySection({
  languageMastery,
}: LanguageMasterySectionProps) {
  return (
    <section aria-labelledby="language-mastery-heading">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="language-mastery-heading"
            className="text-2xl font-bold tracking-tight"
          >
            Робота над помилками
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            TalkHero запам’ятовує повторювані помилки та допомагає
            перетворювати їх на правильні мовні звички.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="neutral">
            Активні: {languageMastery.activeErrors}
          </Badge>

          <Badge variant="neutral">
            Закріплено: {languageMastery.masteredErrors}
          </Badge>
        </div>
      </div>

      <Card className="overflow-hidden border-amber-200/70">
        <CardHeader className="border-b border-border/60 bg-gradient-to-r from-warning-soft/80 via-warning-soft/30 to-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <CardDescription>
                Персональне повторення
              </CardDescription>

              <CardTitle className="mt-1 text-2xl">
                Що варто закріпити
              </CardTitle>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Зосередьтеся на помилках, які повторюються найчастіше.
                Після трьох успішних використань TalkHero вважатиме навичку
                закріпленою.
              </p>
            </div>

            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-warning-soft text-amber-700">
              <Lightbulb
                className="size-6"
                aria-hidden="true"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5">
          {languageMastery.practiceItems.length > 0 ? (
            <div className="space-y-4">
              {languageMastery.practiceItems.map((item) => {
                const masteryProgress = Math.min(
                  3,
                  Math.max(0, item.successfulUses),
                );

                const masteryPercentage = Math.round(
                  (masteryProgress / 3) * 100,
                );

                return (
                  <article
                    key={item.errorKey}
                    className="rounded-xl border border-border bg-card p-5"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                          <Badge variant="outline">
                            {item.errorType}
                          </Badge>

                          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                            Повторень помилки: {item.occurrenceCount}
                          </span>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                              Було
                            </p>

                            <p className="mt-2 text-sm font-medium leading-6 text-foreground">
                              {item.originalText}
                            </p>
                          </div>

                          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                              Правильно
                            </p>

                            <p className="mt-2 text-sm font-semibold leading-6 text-foreground">
                              {item.correctedText}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="w-full shrink-0 rounded-xl border bg-muted/20 p-4 lg:w-52">
                        <div className="flex items-end justify-between gap-4">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">
                              Закріплення
                            </p>

                            <p className="mt-1 text-xl font-bold text-foreground">
                              {masteryProgress} із 3
                            </p>
                          </div>

                          <span className="text-sm font-bold text-primary">
                            {masteryPercentage}%
                          </span>
                        </div>

                        <Progress
                          value={masteryProgress}
                          max={3}
                          label={`${masteryProgress} із 3 успішних використань`}
                          className="mt-3"
                        />

                        <p className="mt-3 text-xs leading-5 text-muted-foreground">
                          Ще {Math.max(0, 3 - masteryProgress)} успішних
                          використань до закріплення.
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
              <p className="font-semibold text-emerald-800">
                Усе актуальне вже закріплено
              </p>

              <p className="mt-1 text-sm leading-6 text-emerald-700">
                Нові рекомендації з’являться тут, коли TalkHero помітить
                повторювану мовну помилку.
              </p>
            </div>
          )}
        </CardContent>

        {languageMastery.practiceItems.length > 0 && (
          <CardFooter className="border-t border-border/60 bg-muted/20">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Використайте правильні конструкції у живому діалозі.
              </p>

              <Link
                href="/chat"
                className={buttonVariants({
                  variant: "outline",
                })}
              >
                Потренуватися з Еммою
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </CardFooter>
        )}
      </Card>
    </section>
  );
}