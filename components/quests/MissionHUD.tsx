"use client";

import { Coins, Star, Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { PublicQuest, QuestProgress } from "@/lib/quests";

type MissionHUDProps = {
  quest: PublicQuest;
  progress: QuestProgress;
  score: number;
  xpEarned: number;
  coinsEarned: number;
};

function calculatePercentage(progress: QuestProgress): number {
  if (progress.total <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(0, Math.round((progress.completed / progress.total) * 100)),
  );
}

export function MissionHUD({
  quest,
  progress,
  score,
  xpEarned,
  coinsEarned,
}: MissionHUDProps) {
  const percentage = calculatePercentage(progress);

  const currentScene = Math.min(
    Math.max(progress.current, 1),
    Math.max(progress.total, 1),
  );

  return (
    <Card aria-label="Стан поточної місії" className="overflow-hidden">
      <CardHeader className="gap-5 pb-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {quest.cefrLevel ? <Badge>Рівень {quest.cefrLevel}</Badge> : null}

              {quest.estimatedMinutes ? (
                <Badge variant="neutral">{quest.estimatedMinutes} хв</Badge>
              ) : null}
            </div>

            <CardTitle className="mt-3 text-2xl sm:text-3xl">
              {quest.title}
            </CardTitle>

            {quest.description ? (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                {quest.description}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-lg bg-primary-soft px-4 py-3 text-primary">
            <Target className="size-5" aria-hidden="true" />

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em]">
                Прогрес
              </p>

              <p className="mt-0.5 text-xl font-bold">{percentage}%</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Progress
          value={progress.completed}
          max={progress.total}
          label={`Сцена ${currentScene} із ${progress.total}`}
          showValue
        />

        <p className="mt-2 text-xs text-muted-foreground">
          Завершено сцен: {progress.completed}
        </p>
      </CardContent>

      <div className="grid grid-cols-3 border-t border-border bg-muted/40">
        <div className="flex min-w-0 items-center justify-center gap-2 border-r border-border px-2 py-4 sm:px-4">
          <Target className="size-4 shrink-0 text-primary" aria-hidden="true" />

          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground">Бали</p>

            <p className="font-bold text-foreground">{score}</p>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-center gap-2 border-r border-border px-2 py-4 sm:px-4">
          <Star className="size-4 shrink-0 text-amber-500" aria-hidden="true" />

          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground">Досвід</p>

            <p className="whitespace-nowrap font-bold text-foreground">
              {xpEarned} XP
            </p>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-center gap-2 px-2 py-4 sm:px-4">
          <Coins className="size-4 shrink-0 text-success" aria-hidden="true" />

          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground">Монети</p>

            <p className="font-bold text-foreground">{coinsEarned}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
