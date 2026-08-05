"use client";

import type { ReactNode } from "react";
import { Headphones, Loader2, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { NPC, NPCEmotion } from "@/lib/quests/npcs";
import { cn } from "@/lib/utils";

type NPCCardProps = {
  npc: NPC;
  children: ReactNode;
  emotion?: NPCEmotion;
  showListenButton?: boolean;
  listening?: boolean;
  onListen?: () => void;
};

const THEME_CLASSES: Record<
  NPC["theme"],
  {
    card: string;
    avatar: string;
  }
> = {
  violet: {
    card: "border-violet-200 bg-gradient-to-br from-violet-50/80 via-white to-white",
    avatar: "bg-violet-100 text-violet-700",
  },
  emerald: {
    card: "border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-white",
    avatar: "bg-emerald-100 text-emerald-700",
  },
  blue: {
    card: "border-blue-200 bg-gradient-to-br from-blue-50/80 via-white to-white",
    avatar: "bg-blue-100 text-blue-700",
  },
  amber: {
    card: "border-amber-200 bg-gradient-to-br from-amber-50/80 via-white to-white",
    avatar: "bg-amber-100 text-amber-700",
  },
  rose: {
    card: "border-rose-200 bg-gradient-to-br from-rose-50/80 via-white to-white",
    avatar: "bg-rose-100 text-rose-700",
  },
  slate: {
    card: "border-border bg-gradient-to-br from-muted/70 via-white to-white",
    avatar: "bg-muted text-foreground",
  },
};

const EMOTION_LABELS: Record<NPCEmotion, string> = {
  happy: "Доброзичливий настрій",
  neutral: "Спокійний настрій",
  thinking: "Замислений настрій",
  surprised: "Здивований настрій",
  encouraging: "Підтримує вас",
  celebrating: "Святкує успіх",
};

export function NPCCard({
  npc,
  children,
  emotion = npc.emotion,
  showListenButton = false,
  listening = false,
  onListen,
}: NPCCardProps) {
  const theme = THEME_CLASSES[npc.theme];

  return (
    <Card
      className={cn(
        "overflow-hidden",
        "animate-in fade-in slide-in-from-bottom-2 duration-300",
        theme.card,
      )}
    >
      <CardHeader className="flex-row items-start justify-between gap-4 border-b border-black/5 pb-5">
        <div className="flex min-w-0 items-center gap-4">
          <div
            aria-hidden="true"
            className={cn(
              "flex size-16 shrink-0 items-center justify-center rounded-xl",
              "text-3xl shadow-sm",
              theme.avatar,
            )}
          >
            {npc.avatar}
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold tracking-tight text-foreground">
              {npc.name}
            </h2>

            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {npc.role}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <Badge variant="neutral">
            <Sparkles aria-hidden="true" />
            <span className="hidden sm:inline">{EMOTION_LABELS[emotion]}</span>
            <span className="sm:hidden">Настрій</span>
          </Badge>

          {showListenButton ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!onListen || listening}
              onClick={onListen}
              aria-label={
                listening
                  ? "Відтворюється репліка персонажа"
                  : `Прослухати репліку персонажа ${npc.name}`
              }
            >
              {listening ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Headphones aria-hidden="true" />
              )}

              <span className="hidden sm:inline">
                {listening ? "Відтворення…" : "Прослухати"}
              </span>
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="py-6 text-base leading-7 text-foreground sm:text-lg sm:leading-8">
        {children}
      </CardContent>
    </Card>
  );
}
