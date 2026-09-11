"use client";

import Link from "next/link";

import {
  ArrowRight,
  Check,
  CheckCircle2,
  Coins,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Star,
  Target,
  Trophy,
} from "lucide-react";

import {
  Button,
  buttonVariants,
} from "@/components/ui/button";

import type {
  QuestCompletionSummary,
} from "@/lib/quests";

import {
  cn,
} from "@/lib/utils";

type CompletionSceneProps = {
  score: number;
  maxScore: number;
  xpEarned: number;
  coinsEarned: number;
  summary?: QuestCompletionSummary;
  onRestart: () => void;
  adventureHref?: string;
};

type ResultTileProps = {
  label: string;
  value: string;
  icon:
    | typeof Target
    | typeof Trophy
    | typeof Star
    | typeof Coins;
  variant:
    | "indigo"
    | "violet"
    | "amber"
    | "emerald";
};

function ResultTile({
  label,
  value,
  icon: Icon,
  variant,
}: ResultTileProps) {
  const styles = {
    indigo: {
      icon:
        "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300",

      card:
        "border-indigo-100 bg-indigo-50/40 dark:border-indigo-900 dark:bg-indigo-950/20",
    },

    violet: {
      icon:
        "bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300",

      card:
        "border-violet-100 bg-violet-50/40 dark:border-violet-900 dark:bg-violet-950/20",
    },

    amber: {
      icon:
        "bg-amber-50 text-amber-500 dark:bg-amber-950/50 dark:text-amber-300",

      card:
        "border-amber-100 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/20",
    },

    emerald: {
      icon:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300",

      card:
        "border-emerald-100 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20",
    },
  } as const;

  return (
    <article
      className={cn(
        "flex min-h-[100px] items-center gap-3",
        "rounded-[20px] border",
        "px-3.5 py-3",
        styles[variant].card,
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center",
          "rounded-[14px]",
          styles[variant].icon,
        )}
      >
        <Icon
          className="size-5"
          aria-hidden="true"
        />
      </div>

      <div className="min-w-0">
        <p className="text-xl font-black tracking-tight text-slate-950 dark:text-white">
          {value}
        </p>

        <p className="mt-0.5 text-[11px] font-medium leading-4 text-slate-500 dark:text-slate-400">
          {label}
        </p>
      </div>
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
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(
              (score / maxScore) *
                100,
            ),
          ),
        )
      : 0;

  const result =
    percentage >= 90
      ? {
          title: "Відмінно!",
          description:
            "Ти впевнено пройшов місію й показав дуже сильний результат.",
        }
      : percentage >= 75
        ? {
            title:
              "Чудова робота!",
            description:
              "Місію завершено. Залишилося зовсім трохи до відмінного результату.",
          }
        : percentage >= 60
          ? {
              title:
                "Добрий результат!",
              description:
                "Місію завершено. Ти вже впорався із ситуацією англійською.",
            }
          : {
              title:
                "Місію завершено!",
              description:
                "Ти дійшов до кінця. Повторне проходження допоможе закріпити складні моменти.",
            };

  const strengths =
    summary?.strengths ??
    [];

  const improvements =
    summary?.improvements ??
    [];

  const hasLearningSummary =
    strengths.length > 0 ||
    improvements.length >
      0;

  return (
    <section
      aria-labelledby="mission-completion-title"
      className={cn(
        "mx-auto w-full max-w-3xl",
        "animate-in fade-in zoom-in-95 duration-300",
      )}
    >
      <div
        className={cn(
          "overflow-hidden rounded-[30px]",
          "border border-slate-200/80",
          "bg-white",
          "shadow-[0_18px_55px_rgba(15,23,42,0.08)]",
          "dark:border-slate-800",
          "dark:bg-slate-950",
        )}
      >
        {/* Completion hero */}
        <header className="relative overflow-hidden px-5 pb-6 pt-7 text-center sm:px-8 sm:pb-8 sm:pt-9">
          <div
            aria-hidden="true"
            className="
              absolute inset-x-0 top-0
              h-44
              bg-gradient-to-b
              from-emerald-50
              via-emerald-50/40
              to-transparent
              dark:from-emerald-950/30
              dark:via-emerald-950/10
            "
          />

          <div className="relative">
            <div
              className={cn(
                "mx-auto flex size-16 items-center justify-center",
                "rounded-full",
                "bg-emerald-500 text-white",
                "shadow-[0_12px_30px_rgba(16,185,129,0.28)]",
              )}
            >
              <Check
                className="size-8"
                strokeWidth={3}
                aria-hidden="true"
              />
            </div>

            <div
              className={cn(
                "mt-4 inline-flex items-center gap-1.5",
                "rounded-full",
                "bg-emerald-50 px-3 py-1.5",
                "text-[10px] font-black uppercase",
                "tracking-[0.1em]",
                "text-emerald-700",
                "dark:bg-emerald-950/50 dark:text-emerald-300",
              )}
            >
              <Trophy
                className="size-3.5"
                aria-hidden="true"
              />

              Місію завершено
            </div>

            <h1
              id="mission-completion-title"
              className="mt-4 text-[28px] font-black tracking-[-0.035em] text-slate-950 sm:text-4xl dark:text-white"
            >
              {result.title}
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 sm:text-base dark:text-slate-400">
              {result.description}
            </p>

            {/* Main score */}
            <div className="mt-5">
              <p className="text-5xl font-black tracking-[-0.05em] text-indigo-600 dark:text-indigo-300">
                {percentage}%
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-400">
                результат місії
              </p>
            </div>
          </div>
        </header>

        {/* Progress line */}
        <div className="px-5 sm:px-8">
          <div
            className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={
              percentage
            }
            aria-label={`Результат місії: ${percentage}%`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-[width] duration-700"
              style={{
                width: `${percentage}%`,
              }}
            />
          </div>
        </div>

        {/* Rewards */}
        <section
          aria-label="Результати місії"
          className="grid grid-cols-2 gap-3 px-5 py-6 sm:px-8"
        >
          <ResultTile
            label="Бали"
            value={String(
              score,
            )}
            icon={Target}
            variant="indigo"
          />

          <ResultTile
            label="Результат"
            value={`${percentage}%`}
            icon={Trophy}
            variant="violet"
          />

          <ResultTile
            label="Отримано XP"
            value={`+${xpEarned}`}
            icon={Star}
            variant="amber"
          />

          <ResultTile
            label="Монети"
            value={`+${coinsEarned}`}
            icon={Coins}
            variant="emerald"
          />
        </section>

        {/* Learning summary */}
        {hasLearningSummary ? (
          <section className="space-y-3 px-5 pb-6 sm:px-8">
            {strengths.length >
            0 ? (
              <article
                className={cn(
                  "rounded-[20px]",
                  "border border-emerald-100",
                  "bg-emerald-50/45",
                  "p-4",
                  "dark:border-emerald-900",
                  "dark:bg-emerald-950/20",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
                    <CheckCircle2
                      className="size-4.5"
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Що вдалося
                    </h2>

                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Сильні моменти цієї місії
                    </p>
                  </div>
                </div>

                <ul className="mt-3 space-y-2">
                  {strengths.map(
                    (
                      strength,
                      index,
                    ) => (
                      <li
                        key={`${strength}-${index}`}
                        className="flex items-start gap-2.5 text-sm leading-5.5 text-slate-700 dark:text-slate-300"
                      >
                        <Check
                          className="mt-0.5 size-4 shrink-0 text-emerald-500"
                          strokeWidth={
                            2.5
                          }
                          aria-hidden="true"
                        />

                        <span>
                          {
                            strength
                          }
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              </article>
            ) : null}

            {improvements.length >
            0 ? (
              <article
                className={cn(
                  "rounded-[20px]",
                  "border border-amber-100",
                  "bg-amber-50/45",
                  "p-4",
                  "dark:border-amber-900",
                  "dark:bg-amber-950/20",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
                    <Lightbulb
                      className="size-4.5"
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Що повторити
                    </h2>

                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Те, що варто трохи закріпити
                    </p>
                  </div>
                </div>

                <ul className="mt-3 space-y-2">
                  {improvements.map(
                    (
                      improvement,
                      index,
                    ) => (
                      <li
                        key={`${improvement}-${index}`}
                        className="flex items-start gap-2.5 text-sm leading-5.5 text-slate-700 dark:text-slate-300"
                      >
                        <Target
                          className="mt-0.5 size-4 shrink-0 text-amber-500"
                          aria-hidden="true"
                        />

                        <span>
                          {
                            improvement
                          }
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              </article>
            ) : null}
          </section>
        ) : null}

        {/* Next action */}
        <section className="mx-5 mb-5 rounded-[20px] bg-indigo-50/70 p-4 sm:mx-8 sm:mb-6 dark:bg-indigo-950/25">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
              <Sparkles
                className="size-4.5"
                aria-hidden="true"
              />
            </div>

            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Місія пройдена
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Переходь до наступної пригоди або повтори цю місію, щоб покращити результат.
              </p>
            </div>
          </div>
        </section>

        {/* Actions */}
        <footer className="border-t border-slate-100 px-5 py-5 sm:px-8 dark:border-slate-800">
          <div className="flex flex-col gap-3">
            <Link
              href={
                adventureHref
              }
              className={cn(
                buttonVariants(),
                "min-h-[52px] w-full rounded-full text-sm font-bold",
              )}
            >
              Продовжити пригоду

              <ArrowRight
                className="size-4"
                aria-hidden="true"
              />
            </Link>

            <Button
              type="button"
              variant="outline"
              onClick={
                onRestart
              }
              className="min-h-[48px] w-full rounded-full text-sm font-semibold"
            >
              <RotateCcw
                className="size-4"
                aria-hidden="true"
              />

              Пройти ще раз
            </Button>
          </div>
        </footer>
      </div>
    </section>
  );
}
