"use client";

import { Coins, Star, Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type {
  PublicQuest,
  QuestProgress,
} from "@/lib/quests";

type MissionHUDProps = {
  quest: PublicQuest;
  progress: QuestProgress;
  score: number;
  xpEarned: number;
  coinsEarned: number;
};

function calculatePercentage(
  progress: QuestProgress,
): number {
  if (progress.total <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (progress.completed /
          progress.total) *
          100,
      ),
    ),
  );
}

export function MissionHUD({
  quest,
  progress,
  score,
  xpEarned,
  coinsEarned,
}: MissionHUDProps) {
  const percentage =
    calculatePercentage(progress);

  const currentScene = Math.min(
    Math.max(progress.current, 1),
    Math.max(progress.total, 1),
  );

  return (
    <Card
      aria-label="Стан поточної місії"
      className="overflow-hidden"
    >
      <CardContent className="p-4 sm:p-5">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {quest.cefrLevel ? (
                  <Badge>
                    Рівень {quest.cefrLevel}
                  </Badge>
                ) : null}

                {quest.estimatedMinutes ? (
                  <Badge variant="neutral">
                    {quest.estimatedMinutes} хв
                  </Badge>
                ) : null}
              </div>

              <h2 className="mt-2 truncate text-lg font-bold text-foreground sm:text-xl">
                {quest.title}
              </h2>
            </div>

            <div className="flex shrink-0 items-center gap-2 rounded-lg bg-primary-soft px-3 py-2 text-primary">
              <Target
                className="size-4"
                aria-hidden="true"
              />

              <span className="text-sm font-bold">
                {percentage}%
              </span>
            </div>
          </div>

          <div>
            <Progress
              value={progress.completed}
              max={progress.total}
              label={`Сцена ${currentScene} із ${progress.total}`}
              showValue
            />
          </div>
        </div>
      </CardContent>

      <div className="grid grid-cols-3 border-t border-border bg-muted/30">
        <div className="flex min-w-0 items-center justify-center gap-2 border-r border-border px-2 py-2.5 sm:px-4">
          <Target
            className="size-4 shrink-0 text-primary"
            aria-hidden="true"
          />

          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">
              Бали
            </p>

            <p className="text-sm font-bold text-foreground">
              {score}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-center gap-2 border-r border-border px-2 py-2.5 sm:px-4">
          <Star
            className="size-4 shrink-0 text-amber-500"
            aria-hidden="true"
          />

          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">
              Досвід
            </p>

            <p className="whitespace-nowrap text-sm font-bold text-foreground">
              {xpEarned} XP
            </p>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-center gap-2 px-2 py-2.5 sm:px-4">
          <Coins
            className="size-4 shrink-0 text-success"
            aria-hidden="true"
          />

          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">
              Монети
            </p>

            <p className="text-sm font-bold text-foreground">
              {coinsEarned}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
